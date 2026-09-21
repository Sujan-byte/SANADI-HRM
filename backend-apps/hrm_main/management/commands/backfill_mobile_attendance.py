from django.core.management.base import BaseCommand
from mobile_apis.models import EmployeeLog
from mobile_apis.views import get_bio_db_connection
import pytz
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Backfill existing EmployeeLog records into iclock_transaction so the scheduler can re-process hrm_attendancedetails'

    def add_arguments(self, parser):
        parser.add_argument('--start_date', type=str, help='Start date YYYY-MM-DD (inclusive)')
        parser.add_argument('--end_date',   type=str, help='End date YYYY-MM-DD (inclusive)')

    def handle(self, *args, **options):
        qs = EmployeeLog.objects.select_related('employee').filter(
            checkin_date__isnull=False
        )
        if options.get('start_date'):
            qs = qs.filter(checkin_date__gte=options['start_date'])
        if options.get('end_date'):
            qs = qs.filter(checkin_date__lte=options['end_date'])

        total = qs.count()
        self.stdout.write(f"Processing {total} EmployeeLog record(s)...")

        dubai = pytz.timezone('Asia/Dubai')
        inserted = skipped = failed = 0

        conn = get_bio_db_connection()
        cur = conn.cursor()

        for log in qs:
            emp_code = log.employee.employee_code

            # Look up emp_id from existing BioTime records
            cur.execute(
                "SELECT emp_id FROM public.iclock_transaction WHERE emp_code = %s AND emp_id IS NOT NULL LIMIT 1;",
                (emp_code,)
            )
            row = cur.fetchone()
            emp_id = row[0] if row else None

            punches = []
            # Check-in punch
            if log.checkin_date and log.checkin_time:
                naive = datetime.combine(log.checkin_date, log.checkin_time)
                punches.append(dubai.localize(naive))
            # Check-out punch (only if checkout actually happened)
            if log.checkout_flag and log.checkout_date and log.checkout_time:
                naive = datetime.combine(log.checkout_date, log.checkout_time)
                punches.append(dubai.localize(naive))

            for punch_time in punches:
                # Duplicate check: skip if a record already exists within 1 minute
                cur.execute(
                    """
                    SELECT id FROM public.iclock_transaction
                    WHERE emp_code = %s
                      AND punch_time BETWEEN %s AND %s
                    LIMIT 1;
                    """,
                    (emp_code, punch_time - timedelta(minutes=1), punch_time + timedelta(minutes=1))
                )
                if cur.fetchone():
                    skipped += 1
                    self.stdout.write(f"  SKIP  {emp_code} {punch_time} (already in iclock_transaction)")
                    continue

                try:
                    # Get next_id via sequence (same as insert_iclock_transaction)
                    cur.execute("SELECT pg_get_serial_sequence('public.iclock_transaction', 'id')")
                    seq_name = cur.fetchone()[0]
                    if seq_name:
                        cur.execute(f"SELECT nextval('{seq_name}')")
                    else:
                        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM public.iclock_transaction")
                    next_id = cur.fetchone()[0]

                    cur.execute(
                        """
                        INSERT INTO public.iclock_transaction (
                            id, emp_code, punch_time, punch_state, verify_type,
                            work_code, terminal_sn, terminal_alias, area_alias,
                            longitude, latitude, gps_location, mobile, source,
                            purpose, crc, is_attendance, reserved, upload_time,
                            sync_status, sync_time, is_mask, temperature,
                            emp_id, terminal_id, company_code
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING id;
                        """,
                        (
                            next_id, emp_code, punch_time, '255', 1,
                            '', 'MOBILE', 'mobile punch', '',
                            0.0, 0.0, '', '', 0, 0, '', 1, '',
                            datetime.now(pytz.timezone('Asia/Dubai')),
                            0, None, 0, None, emp_id, None, ''
                        )
                    )
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    inserted += 1
                    self.stdout.write(self.style.SUCCESS(
                        f"  INSERT id={new_id}  {emp_code}  {punch_time}"
                    ))
                except Exception as e:
                    conn.rollback()
                    failed += 1
                    self.stdout.write(self.style.ERROR(
                        f"  FAIL  {emp_code}  {punch_time}: {e}"
                    ))

        cur.close()
        conn.close()

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Inserted={inserted}  Skipped={skipped}  Failed={failed}"
        ))
        if inserted > 0:
            self.stdout.write(
                "\nNext step — re-run the scheduler for the affected date range:\n"
                "  python manage.py device_attendance_sfic <start_date> <end_date>"
            )
