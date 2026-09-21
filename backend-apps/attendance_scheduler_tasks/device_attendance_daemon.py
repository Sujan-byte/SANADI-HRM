"""
Attendance Sync Daemon
=======================
Listens on PostgreSQL NOTIFY 'new_punch' from the BioTime DB.
When a notification arrives, runs incremental sync for all new punches.

Stores last-processed upload_time in the HRM database table
(public.attendance_sync_watermark) so the watermark survives container
restarts and redeployments.

Zero server load when no punches arrive — sleeps in select() until
PostgreSQL wakes it up.

Run via start.sh or as a systemd service (see attendance_daemon.service).

DB setup (run once manually on HRM DB):
    CREATE TABLE IF NOT EXISTS public.attendance_sync_watermark (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_upload_time TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT single_row CHECK (id = 1)
    );
"""

import os
import sys
import select
import logging
import logging.handlers
import psycopg2
import psycopg2.extensions
import environ
import time
from datetime import datetime, timezone

# ── Django setup ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from attendance_scheduler_tasks.device_attendance_task import (
    transfer_attendance_incremental,
    get_t_enter_connection,
)

# ── Config ────────────────────────────────────────────────────────────────────
env = environ.Env()

# ── Logging ───────────────────────────────────────────────────────────────────
log_dir = os.path.join(BASE_DIR, "attendance_logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "attendance_daemon.log")

logger = logging.getLogger("attendance_daemon")
logger.setLevel(logging.INFO)
handler = logging.handlers.TimedRotatingFileHandler(
    log_file, when="midnight", backupCount=7, encoding="utf-8"
)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.addHandler(logging.StreamHandler(sys.stdout))


# ── HRM DB connection (for watermark) ─────────────────────────────────────────

def get_hrm_connection():
    """Plain psycopg2 connection to the HRM database."""
    return psycopg2.connect(
        dbname=env("DB_NAME"),
        user=env("DB_USERNAME"),
        password=env("DB_PASSWORD"),
        host=env("DB_SERVER"),
        port=env("DB_PORT"),
    )


# ── Watermark DB helpers ──────────────────────────────────────────────────────

def read_watermark():
    """
    Read last processed upload_time from the HRM DB watermark table.
    Returns a datetime (UTC-aware) or None on first ever run.
    """
    try:
        conn = get_hrm_connection()
        cur  = conn.cursor()
        cur.execute("SELECT last_upload_time FROM public.attendance_sync_watermark WHERE id = 1;")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            dt = row[0]
            # Ensure timezone-aware
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        return None
    except Exception as e:
        logger.exception(f"Failed to read watermark from DB: {e}")
        return None


def write_watermark(dt):
    """
    Upsert the watermark into the HRM DB.
    Survives container restarts and redeployments.
    """
    try:
        conn = get_hrm_connection()
        cur  = conn.cursor()
        cur.execute(
            """
            INSERT INTO public.attendance_sync_watermark (id, last_upload_time, updated_at)
            VALUES (1, %s, NOW())
            ON CONFLICT (id) DO UPDATE
                SET last_upload_time = EXCLUDED.last_upload_time,
                    updated_at       = NOW();
            """,
            (dt,)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.exception(f"Failed to write watermark to DB: {e}")


# ── Bio DB connection ─────────────────────────────────────────────────────────

def get_bio_listen_connection():
    """
    Persistent connection to BioTime DB for LISTEN.
    Must be ISOLATION_LEVEL_AUTOCOMMIT so LISTEN takes effect immediately.
    TCP keepalives prevent the server from dropping idle LISTEN connections.
    """
    conn = psycopg2.connect(
        dbname=env("DB_BIO_NAME"),
        user=env("DB_BIO_USERNAME"),
        password=env("DB_BIO_PASSWORD"),
        host=env("DB_BIO_SERVER"),
        port=env("DB_BIO_PORT"),
        # Send keepalive probe after 30s idle, every 10s, up to 5 retries
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    return conn


# ── Daemon ────────────────────────────────────────────────────────────────────

def run_daemon():
    logger.info("Attendance sync daemon starting...")

    # ── Startup catchup ──────────────────────────────────────────────────────
    # Process any punches that arrived while the daemon was stopped / container was down.
    since = read_watermark()
    if since:
        logger.info(f"Catching up on punches since daemon last ran: {since}")
        try:
            max_upload_time = transfer_attendance_incremental(since_upload_time=since)
            if max_upload_time:
                write_watermark(max_upload_time)
                logger.info(f"Catchup complete. Watermark advanced to {max_upload_time}")
            else:
                logger.info("Catchup: no missed punches found.")
        except Exception as e:
            logger.exception(f"Catchup sync failed: {e}")
    else:
        logger.info("No watermark in DB — first run, seeding watermark to NOW().")
        write_watermark(datetime.now(timezone.utc))

    # ── Main listen loop ─────────────────────────────────────────────────────
    while True:
        try:
            bio_conn = get_bio_listen_connection()
            bio_cur  = bio_conn.cursor()
            bio_cur.execute("LISTEN new_punch;")
            logger.info("Listening on channel 'new_punch'...")

            last_heartbeat = time.time()

            while True:
                # Block for up to 30s — short enough to send a heartbeat
                # before any firewall/server drops the idle connection
                ready = select.select([bio_conn], [], [], 30)

                if ready[0]:
                    bio_conn.poll()
                    if not bio_conn.notifies:
                        continue

                    # Drain all notifications (device may send a burst)
                    bio_conn.notifies.clear()
                    logger.info("Notification received — running incremental sync...")

                    since = read_watermark()
                    try:
                        max_upload_time = transfer_attendance_incremental(since_upload_time=since)
                        if max_upload_time:
                            write_watermark(max_upload_time)
                        logger.info("Incremental sync complete.")
                    except Exception as e:
                        logger.exception(f"Incremental sync error: {e}")
                else:
                    # No notification — send a lightweight heartbeat to keep
                    # the connection alive through firewalls and idle timeouts
                    bio_cur.execute("SELECT 1;")
                    logger.debug("Daemon alive, heartbeat sent.")

        except Exception as e:
            logger.exception(f"Daemon connection error: {e}. Reconnecting in 10s...")
            try:
                bio_conn.close()
            except Exception:
                pass
            bio_conn = None
            time.sleep(10)


if __name__ == "__main__":
    run_daemon()
