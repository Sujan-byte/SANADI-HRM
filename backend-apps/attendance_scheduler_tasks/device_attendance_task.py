import os
import uuid
from datetime import timedelta
from datetime import datetime, time
from .utils.transfer_device_attendance_sql_helper import SQLHelper
from .utils.attendance_status_enum import Status
from .utils.overstay_utils import (
    OVER_STAY_STATUS, AUTO_PUNCH_ZERO_FIELDS,
    get_lop_on_overstay, get_active_overstay,
)
import json
import psycopg2
import logging.handlers
import environ
env = environ.Env()


log_dir = "attendance_logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

today_date = datetime.today().strftime('%Y-%m-%d')
log_file = os.path.join(log_dir, f"transfer_attendance_{today_date}.log")  # New file every day

logger = logging.getLogger("transfer_attendance")
logger.setLevel(logging.DEBUG)

file_handler = logging.FileHandler(log_file, encoding="utf-8")
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)



def get_grace_details(postgres_cursor, punch_date, employee_type, employee_group, employee_reporting, employee_shift=None):

    master_grace_details = get_grace_details_by_master(postgres_cursor,
        punch_date, employee_group, employee_reporting, employee_type, employee_shift
    )

    grace_details = {
        'min_work_mins': master_grace_details[10] if master_grace_details else 480,
        'max_work_mins': master_grace_details[9] if master_grace_details else 600,
        'break_time': master_grace_details[1] if master_grace_details else 60,
        'wo_break_time': master_grace_details[16] if master_grace_details else 60,
        'max_day_ot_mins': master_grace_details[7] if master_grace_details else 60,
        'max_night_ot_mins': master_grace_details[8] if master_grace_details else 60,
        'weekly_off_work_mins': master_grace_details[13] if master_grace_details else 0,
        'wo_max_day_ot_mins': master_grace_details[14] if master_grace_details else 600,
        'wo_max_night_ot_mins': master_grace_details[15] if master_grace_details else 600,
        'total_work_hours': (master_grace_details[12] if master_grace_details else 720), # in mins
        'lop_on_absent': bool(master_grace_details[17]) if master_grace_details else False,
    }
    # print(f"[GRACE] emp_type={employee_type} emp_group={employee_group} emp_reporting={employee_reporting} â†’ {grace_details}")
    return grace_details


def get_grace_details_by_master(postgres_cursor, punch_in_date, emp_group, emp_reporting, emp_type, emp_shift=None):
    # Query for Special type â€” shift match gives highest priority, NULL shift matches all
    query_special = """
        SELECT
            type, break_time, description, emp_group, emp_reporting, emp_type, from_date,
            max_day_ot_mins, max_day_ot_mins, max_work_mins, min_work_mins, to_date,
            total_work_hours, weekly_off_work_mins, wo_max_day_ot_mins, wo_max_night_ot_mins, wo_break_time,
            lop_on_absent
        FROM
            hrm_gracedetails
        WHERE
            b_id = %s
            AND %s BETWEEN from_date AND to_date
            AND type = 'Special'
            AND emp_type IN (%s, 'All')
            AND emp_group IN (%s, 'All')
            AND emp_reporting IN (%s, 'All')
            AND (shift_id IS NULL OR shift_id = %s)
        ORDER BY
            CASE
                WHEN shift_id = %s AND emp_type = %s AND emp_group = %s AND emp_reporting = %s THEN 1 -- Shift + all three match
                WHEN shift_id = %s THEN 2                                                             -- Shift match only
                WHEN emp_type = %s AND emp_group = %s AND emp_reporting = %s THEN 3                  -- All three match (no shift)
                WHEN emp_type = %s AND emp_group = %s THEN 4
                WHEN emp_type = %s AND emp_reporting = %s THEN 5
                WHEN emp_group = %s AND emp_reporting = %s THEN 6
                WHEN emp_type = %s THEN 7
                WHEN emp_group = %s THEN 8
                WHEN emp_reporting = %s THEN 9
                ELSE 10
            END
        LIMIT 1;
    """

    postgres_cursor.execute(query_special, (
        str(1),
        punch_in_date,
        emp_type,
        emp_group,
        emp_reporting,
        emp_shift,       # WHERE shift_id IS NULL OR shift_id = %s
        emp_shift,       # CASE shift_id = %s AND all three
        emp_type,
        emp_group,
        emp_reporting,
        emp_shift,       # CASE shift_id = %s only
        emp_type,
        emp_group,
        emp_reporting,
        emp_type,
        emp_group,
        emp_type,
        emp_reporting,
        emp_group,
        emp_reporting,
        emp_type,
        emp_group,
        emp_reporting,
    ))
    result = postgres_cursor.fetchone()

    if not result:
        # Query for Normal type â€” same shift-aware logic, no date range filter
        query_normal = """
            SELECT
                type, break_time, description, emp_group, emp_reporting, emp_type, from_date,
                max_day_ot_mins, max_day_ot_mins, max_work_mins, min_work_mins, to_date,
                total_work_hours, weekly_off_work_mins, wo_max_day_ot_mins, wo_max_night_ot_mins, wo_break_time,
                lop_on_absent
            FROM
                hrm_gracedetails
            WHERE
                b_id = %s
                AND type = 'Normal'
                AND emp_type IN (%s, 'All')
                AND emp_group IN (%s, 'All')
                AND emp_reporting IN (%s, 'All')
                AND (shift_id IS NULL OR shift_id = %s)
            ORDER BY
                CASE
                    WHEN shift_id = %s AND emp_type = %s AND emp_group = %s AND emp_reporting = %s THEN 1
                    WHEN shift_id = %s THEN 2
                    WHEN emp_type = %s AND emp_group = %s AND emp_reporting = %s THEN 3
                    WHEN emp_type = %s AND emp_group = %s THEN 4
                    WHEN emp_type = %s AND emp_reporting = %s THEN 5
                    WHEN emp_group = %s AND emp_reporting = %s THEN 6
                    WHEN emp_type = %s THEN 7
                    WHEN emp_group = %s THEN 8
                    WHEN emp_reporting = %s THEN 9
                    ELSE 10
                END
            LIMIT 1;
        """

        postgres_cursor.execute(query_normal, (
            str(1),
            emp_type,
            emp_group,
            emp_reporting,
            emp_shift,       # WHERE shift_id IS NULL OR shift_id = %s
            emp_shift,       # CASE shift_id = %s AND all three
            emp_type,
            emp_group,
            emp_reporting,
            emp_shift,       # CASE shift_id = %s only
            emp_type,
            emp_group,
            emp_reporting,
            emp_type,
            emp_group,
            emp_type,
            emp_reporting,
            emp_group,
            emp_reporting,
            emp_type,
            emp_group,
            emp_reporting,
        ))
        result = postgres_cursor.fetchone()
    # print("result", result)
    return result


def format_time(time_str):
    try:
        time_obj = datetime.strptime(time_str, "%H%M")
        return time_obj.strftime('%H:%M')
    except ValueError:
        return time_str


def calculate_ot_minutes(data,login_time, logout_time, work_time, grace_master_data,is_ot_eligible, **kwargs):
    weekly_off = kwargs.get('weekly_off',None)
    postgres_cursor = kwargs.get('postgres_cursor',None)
    login_time = format_time(login_time)
    logout_time = format_time(logout_time)

    login_dt = datetime.strptime(login_time, "%H:%M")
    logout_dt = datetime.strptime(logout_time, "%H:%M")
    if login_time=="00:00" or logout_time == "00:00" :
        worked_minutes = 0
    else:
        worked_minutes = (logout_dt - login_dt).seconds // 60

    # print("worked minutes",worked_minutes,login_time,logout_time)
    if weekly_off is not None and postgres_cursor is not None:
        formatted_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
        is_weekly_off = check_if_weekly_off(formatted_date, weekly_off)
        is_holiday = check_only_holiday(formatted_date, postgres_cursor)
        # print("check holiday",data['date'],is_holiday)
        if (is_weekly_off or is_holiday):
            break_time = grace_master_data['wo_break_time']
        else:
            break_time = grace_master_data['break_time']
    else:
        break_time = grace_master_data['break_time']

    # break_time = grace_master_data['break_time']
    # print("break time",type(break_time),break_time)
    worked_minutes =  max(0, worked_minutes - break_time) # 120 is break time
    data['total_hours']=worked_minutes
    if is_ot_eligible:
        ot_minutes = max(0, worked_minutes - int(work_time or 0))
        if ot_minutes <= 0:
            data['ot_hrs'] = ot_minutes
            return data
        maximum_ot_time=get_maximum_ot_mins(login_dt,logout_dt, grace_master_data)
        ot_minutes = apply_ot_rounding(ot_minutes,maximum_ot_time)
        data['ot_hrs'] = ot_minutes
    else:
        data['ot_hrs'] = 0
    return data


def get_maximum_ot_mins(login_dt,logout_dt,grace_master_data):
    noon_time = time(12, 0)  # 12:00 PM (noon)
    midnight_time = time(0, 0)  # 12:00 AM (midnight)

    login_time_obj = login_dt.time()
    logout_time_obj = logout_dt.time()

    is_night_ot = False

    if login_time_obj > noon_time and logout_time_obj >= midnight_time:
        is_night_ot = True

    if is_night_ot:
        maximum_ot_time = grace_master_data['max_night_ot_mins']
    else:
        maximum_ot_time = grace_master_data['max_day_ot_mins']
    return maximum_ot_time


def get_maximum_hot_mins(login_dt,logout_dt,grace_master_data):
    noon_time = time(12, 0)  # 12:00 PM (noon)
    midnight_time = time(0, 0)  # 12:00 AM (midnight)

    login_time_obj = login_dt.time()
    logout_time_obj = logout_dt.time()

    is_night_ot = False

    if login_time_obj > noon_time and logout_time_obj >= midnight_time:
        is_night_ot = True

    if is_night_ot:
        maximum_ot_time = grace_master_data['wo_max_day_ot_mins']
    else:
        maximum_ot_time = grace_master_data['wo_max_night_ot_mins']
    return maximum_ot_time


def apply_ot_rounding(ot_minutes,maximum_ot_time):
    # print("max ot time",maximum_ot_time)
    full_hours = ot_minutes // 60
    remaining_minutes = ot_minutes % 60

    if 1 <= remaining_minutes <= 14:
        rounded_minutes = 0
    elif 15 <= remaining_minutes <= 30:
        rounded_minutes = 30
    elif 31 <= remaining_minutes <= 44:
        rounded_minutes = 30
    elif 45 <= remaining_minutes <= 60:
        rounded_minutes = 60
    else:
        rounded_minutes = 0

    total_minutes = (full_hours * 60) + rounded_minutes

    if total_minutes > maximum_ot_time :
            return maximum_ot_time

    return total_minutes


def check_only_holiday(punch_in_date, postgres_cursor_or_list) -> bool:
    # Accepts either a pre-loaded list (fast path) or a cursor (legacy fallback)
    if isinstance(postgres_cursor_or_list, list):
        holiday_list = postgres_cursor_or_list
    else:
        holiday_list = get_holiday_master(postgres_cursor_or_list)
    for holiday in holiday_list:
        holiday_from = holiday[0]
        holiday_to = holiday[1]
        if holiday_from <= punch_in_date <= holiday_to:
            return True
    return False


def day_name_to_weekday(day_name):
    day_map = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6
    }
    return day_map.get(day_name.lower(), -1)


def parse_weekly_off(weekly_off):
    """Parse weekly_off JSON string once; returns list of weekday ints."""
    try:
        days = json.loads(weekly_off) if isinstance(weekly_off, str) else (weekly_off or [])
        if not days:
            return [6]  # default Sunday
        return [day_name_to_weekday(d) for d in days if isinstance(d, str)]
    except Exception:
        return [6]


def check_if_weekly_off(punch_in_date, weekly_off):
    # weekly_off may be a raw JSON string or a pre-parsed list of ints
    if isinstance(weekly_off, list) and weekly_off and isinstance(weekly_off[0], int):
        return punch_in_date.weekday() in weekly_off
    try:
        weekly_off_days = json.loads(weekly_off) if isinstance(weekly_off, str) else (weekly_off or [])
        if not weekly_off_days:
            return punch_in_date.weekday() == 6
        punch_in_weekday = punch_in_date.weekday()
        for day_name in weekly_off_days:
            if punch_in_weekday == day_name_to_weekday(day_name):
                return True
        return False
    except Exception:
        return punch_in_date.weekday() == 6



def calculation_fun(data,postgres_cursor,grace_master_data,is_ot_eligible,weekly_off):
    total_hrs = int(data["total_hours"] or 0)
    wrk_time = int(data["working_time"] or 0)
    ot_hrs = int(data["ot_hrs"] or 0)
    login_time = data["login_time"]
    logout_time = data["logout_time"]
    punch_in_date = data['date']
    if isinstance(punch_in_date, str):
        punch_in_date = datetime.strptime(punch_in_date, "%Y-%m-%d").date()

    formatted_login_time = format_time(login_time)
    formatted_logout_time = format_time(logout_time)
    login_dt = datetime.strptime(formatted_login_time, "%H:%M")
    logout_dt = datetime.strptime(formatted_logout_time, "%H:%M")

    fixed_ot_hrs = get_maximum_ot_mins(login_dt,logout_dt,grace_master_data)
    # print("fixed ot hrs in cal fun",fixed_ot_hrs)

    is_weekly_off=check_if_weekly_off(punch_in_date,weekly_off)
    is_holiday=check_only_holiday(punch_in_date,postgres_cursor)

    if (is_weekly_off or is_holiday) and ot_hrs:
        max_hot_time=get_maximum_hot_mins(login_dt,logout_dt, grace_master_data)
        # print("max hot time",max_hot_time,total_hrs)
        if total_hrs > max_hot_time:
            hot_hrs = max_hot_time
        else:
            hot_hrs = apply_ot_rounding(total_hrs,max_hot_time)

        data.update(
            {
                'hot_hrs': hot_hrs if is_ot_eligible else '0',
                'ot2_hrs': '0',
                "less_hrs":'0',
                'extra_hrs': '0',
                'ot_hrs': '0',
                'processed_total_hour': total_hrs,
                'processed_logout_time': logout_time,
            }
        )
    else:
        workable_hrs = wrk_time + fixed_ot_hrs
        extra_hrs = max(total_hrs - workable_hrs, 0) if wrk_time > 0 else 0
        less_hrs = max(wrk_time - total_hrs, 0) if wrk_time > 0 else 0
        if total_hrs > workable_hrs:
            processed_total_hour = total_hrs - extra_hrs
            logout_dt = datetime.strptime(str(logout_time).zfill(4), "%H%M")
            new_logout_dt = logout_dt - timedelta(minutes=extra_hrs)
            processed_logout_time = new_logout_dt.strftime("%H%M")
        elif total_hrs < wrk_time:
            processed_total_hour = total_hrs
            processed_logout_time = logout_time
        else:
            processed_total_hour = total_hrs
            processed_logout_time = logout_time
        data.update({
            "less_hrs": less_hrs if total_hrs < wrk_time else "0",
            "extra_hrs": extra_hrs if total_hrs > workable_hrs else "0",
            "processed_total_hour": processed_total_hour,
            "processed_logout_time": processed_logout_time
        })

        if (
            data['shift'] == '2'
            or int(login_time or 0) > int(logout_time or 0) != 0
        ):
            data['ot2_hrs'] = ot_hrs
            data['hot_hrs'] = '0'
            data['ot_hrs'] = '0'
        else:
            data['hot_hrs'] = '0'
            data['ot2_hrs'] = '0'

    return data



def is_midnight(time_data):
    return time_data == time(0, 0, 0)


def convert_to_time(time_str):
    if isinstance(time_str, time):  # If already a time object, return it
        return time_str
    time_str = str(time_str).strip()

    if len(time_str) == 4 and time_str.isdigit():
        time_str = f"{time_str[:2]}:{time_str[2:]}"
    return datetime.strptime(time_str, "%H:%M").time()


def is_today(punch_date):
    return punch_date == datetime.today().date()


def is_late(login_time, shift_in):
    return login_time > shift_in


def is_left_early(worked_hours, base_hours):
    return worked_hours < base_hours


def convert_time_to_minutes(time_str):
    hours, minutes = map(int, time_str.split(":"))
    return hours * 60 + minutes


def get_static_fields():
    return {
        "created": "NOW()",
        "modified": "NOW()",
        "user_created": "Data Integration",
        "user_modified": "Data Integration",
        "is_active": True,
    }


def get_guid():
    return str(uuid.uuid4())


# DB connection and fetching
def get_t_enter_attendance_details(t_enter_postgres_conn,date,employee_id):
    # print("t_enter_postgres_conn",t_enter_postgres_conn,date,employee_id)
    # print("date",date,employee_id)
    # postgres_query = """
    #     SELECT c_date, c_time, l_uid, l_tid
    #     FROM public.tenter_sfic
    #     WHERE c_date = %s AND l_uid =%s  ORDER BY id;
    # """
    # employee_ids = ['E10007','E10179']
    # placeholders = ','.join(['%s'] * len(employee_ids))  # Generates: %s,%s

    # # Use f-string to inject placeholders into the SQL string
    # postgres_query = f"""
    #     SELECT TO_CHAR(punch_time,'YYYY-MM-DD') AS c_date,
    #         TO_CHAR(punch_time,'HH24MISS') AS c_time,
    #         emp_code, emp_id AS l_uid, terminal_sn AS l_tid
    #     FROM public.iclock_transaction
    #     WHERE punch_time::date = TO_DATE(%s, 'YYYY-MM-DD')
    #     AND emp_code IN ({placeholders})
    #     ORDER BY c_time;
    # """

    # try:
    #     # date = '2025-05-23'
    #     cursor = t_enter_postgres_conn.cursor()
    #     # Combine date with unpacked employee_ids for parameter substitution
    #     cursor.execute(postgres_query, (date, *employee_ids))
    #     attendance_data = cursor.fetchall()
    #     return attendance_data

    # except Exception as e:
    #     print(f"Error fetching attendance details: {e}")
    #     return []

    # postgres_query = """
    #     SELECT TO_CHAR(punch_time,'YYYY-MM-DD') AS c_date,TO_CHAR(punch_time,'HH24MISS') AS c_time,emp_code,emp_id AS l_uid,terminal_sn AS l_tid FROM public.iclock_transaction
    #     WHERE punch_time::date = TO_DATE(%s,'YYYY-MM-DD') AND "emp_code" = %s
    #     ORDER BY c_time;
    # """



    postgres_query = """
    SELECT 
        TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'YYYY-MM-DD') AS c_date,
        TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'HH24MISS') AS c_time,
        emp_code,
        emp_id AS l_uid,
        terminal_sn AS l_tid 
    FROM public.iclock_transaction
    WHERE (punch_time AT TIME ZONE 'Asia/Dubai')::date = TO_DATE(%s, 'YYYY-MM-DD')
      AND emp_code = %s
    ORDER BY c_time;
"""



    try:
        # date = '20250523'
        # employee_id='E10007'
        cursor = t_enter_postgres_conn.cursor()
        # print("Data",date,employee_id)
        cursor.execute(postgres_query, (date,employee_id))
        attendance_data = cursor.fetchall()  # Fetch all matching records
        # print("if",attendance_data)
        return attendance_data
    except Exception as e:
        print(f"Error fetching attendance details: {e}")
        return []

def get_employees(postgres_cursor, start_date=None, end_date=None):
    """
    Fetch active employees who have a valid doj and fall within the given date range.
    - doj must NOT be NULL (no joining date = skip employee)
    - doj <= end_date  (employee must have joined before the period ends)
    - dor IS NULL OR dor >= start_date  (employee not yet relieved when period starts)
    """
    postgres_cursor.execute(
        """
        SELECT first_name, default_shift_id, employee_code,
               employee_code AS employee_card_number,
               employee_type, employee_group, reporting,
               auto_punch, is_ot_eligible, weekly_off,
               shift_details_id, doj, dor, b_id
        FROM public.master_employeemaster
        WHERE  is_active = %s
          AND doj IS NOT NULL
          AND doj <= %s
          AND (dor IS NULL OR dor >= %s)
        """,
        (True, end_date, start_date),
    )
    return postgres_cursor.fetchall()

# def get_employees(postgres_cursor):
#     postgres_cursor.execute(
#         """
#         SELECT first_name,default_shift_id,employee_code,employee_card_number,employee_type,employee_group,reporting,auto_punch,is_ot_eligible,weekly_off FROM public.master_employeemaster
#         WHERE b_id = %s and is_active = %s and employee_code=%s
#         """,
#         (str(1),True,'Employee-2'),
#     )
#     return postgres_cursor.fetchall()


def get_holiday_master(postgres_cursor):
    postgres_cursor.execute(
        """
        SELECT date,to_date FROM public.master_holidaymaster
        WHERE b_id = %s 
        """,
        (str(1),),
    )
    return postgres_cursor.fetchall()

def get_leave_entry_for_employee(postgres_cursor, employee_code, punch_in_date):
    postgres_cursor.execute(
        """
        SELECT asm.code as code, le.travel_or_leave as leave_type
        FROM public.master_leaveentry le
        JOIN public.master_employeemaster me 
            ON me.id = le.employee_id AND me.b_id = %s AND me.employee_code = %s
        JOIN public.hrm_attendancestatusmaster asm
            ON asm.id = le.leave_type_id
        WHERE le.b_id = %s 
          AND %s BETWEEN le.from_date AND le.to_date
          AND le.approval_status = %s 
          AND le.is_active = %s
        LIMIT 1
        """,
        (str(1), employee_code, str(1), punch_in_date, 'APPROVED', True),
    )
    return postgres_cursor.fetchone()

def get_annual_leave_code(postgres_cursor):
    postgres_cursor.execute(
        """
        SELECT code 
        FROM public.hrm_attendancestatusmaster 
        WHERE status_name = %s
        LIMIT 1
        """,
        ('Annual Leave',)
    )
    result = postgres_cursor.fetchone()
    return result[0] if result else None


def get_leave_application_for_employee(postgres_cursor, employee_code, punch_in_date):
    postgres_cursor.execute(
        """
        SELECT le.leave_approved_start_date, le.leave_approved_end_date 
        FROM public.master_leaveapplication le
        JOIN public.master_employeemaster me 
          ON me.id = le.employee_code_id
        WHERE le.b_id = %s 
          AND me.employee_code = %s 
          AND me.b_id = %s
          AND %s BETWEEN le.leave_approved_start_date AND le.leave_approved_end_date
          AND le.approval_status = %s 
          AND le.is_active = %s
        """,
        (str(1), employee_code, str(1), punch_in_date, 'APPROVED', True),
    )
    result = postgres_cursor.fetchone()
    return result[0] if result else None


def get_shift_details(postgres_cursor, b_id, shift):
    postgres_cursor.execute(
        """
        SELECT shift_name,start_time,end_time FROM public.master_shifttimings
        WHERE b_id = %s and id = %s
        """,
        (
            b_id,
            shift,
        ),
    )
    return postgres_cursor.fetchone()


def get_existing_attendance_data(postgres_cursor, employee_code, date):
    postgres_cursor.execute(
        """
        SELECT login_time,logout_time FROM public.hrm_attendancedetails
        WHERE employee_code = %s AND date = %s and b_id = %s
        """,
        (str(employee_code), date, str(1),),
    )
    return postgres_cursor.fetchone()


# Db invoker for update or insert
def update_attendance_details(data, postgres_cursor):
    postgres_cursor.execute(
        """
        UPDATE public.hrm_attendancedetails
        SET 
            modified = CURRENT_TIMESTAMP,
            user_modified = 'Data Integration',
            login_time = %s,
            logout_time = %s,
            working_time = %s,
            status = %s,
            ot_hrs = %s,
            shift = %s,
            shift_in = %s,
            shift_out = %s,
            total_hours = %s,
            less_hrs = %s,
            late_hrs = %s,
            permitted_ot = %s,
            scheduled_ot = %s,
            employee_name = %s,
            hot_hrs = %s,
            ot2_hrs = %s,
            extra_hrs = %s,
            processed_total_hour = %s,
            is_consecutive_weekly_off = %s,
            processed_logout_time = %s
        WHERE date = %s AND employee_code = %s and b_id = %s
        """,
        (
            data["login_time"],
            data["logout_time"],
            data["working_time"],
            data["status"],
            data["ot_hrs"],
            data["shift"],
            data["shift_in"],
            data["shift_out"],
            data["total_hours"],
            data["less_hrs"],
            data["late_hrs"],
            data["permitted_ot"],
            data["scheduled_ot"],
            data["employee_name"],
            data["hot_hrs"],
            data["ot2_hrs"],
            data["extra_hrs"],
            data["processed_total_hour"],
            data["is_consecutive_weekly_off"],
            data["processed_logout_time"],
            data["date"],
            str(data["employee_code"]),
            str(data["b_id"])
        ),
    )


def insert_attendance_details(data, postgres_cursor):
    guid = get_guid()
    postgres_cursor.execute(
        """
        INSERT INTO public.hrm_attendancedetails (
             "b_id", guid, created, modified,
             user_created, user_modified, is_active, is_finalized,
             date, login_time, logout_time, working_time, status, ot_hrs, shift, shift_in, shift_out,
             total_hours, less_hrs, late_hrs, permitted_ot, scheduled_ot,employee_name,employee_code,hot_hrs,ot2_hrs,extra_hrs,processed_total_hour,is_consecutive_weekly_off,processed_logout_time,approval_status
        )
        VALUES (
             %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
             'Data Integration', 'Data Integration', TRUE, FALSE,
             %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """,
        (
            data["b_id"],
            guid,
            data["date"],
            data["login_time"],
            data["logout_time"],
            data["working_time"],
            data["status"],
            data['ot_hrs'],
            data["shift"],
            data["shift_in"],
            data["shift_out"],
            data["total_hours"],
            data["less_hrs"],
            data["late_hrs"],
            data["permitted_ot"],
            data["scheduled_ot"],
            data['employee_name'],
            data['employee_code'],
            data['hot_hrs'],
            data['ot2_hrs'],
            data['extra_hrs'],
            data['processed_total_hour'],
            data['is_consecutive_weekly_off'],
            data['processed_logout_time'],
            'PENDING_APPROVAL'
        ),
    )


# heart of scheduler
def update_consecutive_weekly_off_sql(cursor, data):
    date = data.get('date')
    status = data.get('status')
    employee_code = data.get('employee_code')
    if isinstance(date,str):
     date = datetime.strptime(date, "%Y-%m-%d")

    # Initialize the SQL helper
    sql_helper = SQLHelper(cursor)

    # Check if the date is a Sunday
    if date.weekday() == 6:  # Sunday is represented by 6 in weekday()
        # Calculate previous Sunday
        previous_weekly_off = date - timedelta(days=7)

        # Calculate next Sunday
        next_weekly_off = date + timedelta(days=7)
        # print("next weekly_off and previous weekly_off",previous_weekly_off,next_weekly_off)
        # Check if the status is 11
        # print("status",status)
        if status == 11:
            # print("comes inside status", status)

            # Check previous Sunday
            previous_weekly_off_instance = sql_helper.get_previous_weekly_off_instance(previous_weekly_off, employee_code)

            # Set is_consecutive_weekly_off based on previous Sunday
            is_consecutive_weekly_off = bool(previous_weekly_off_instance)
            sql_helper.update_is_consecutive_weekly_off(date, employee_code, is_consecutive_weekly_off)

            # print("comes inside previous_weekly_off", previous_weekly_off, previous_weekly_off_instance)
            # print("comes inside next weekly_off", next_weekly_off)
            # print("comes inside current", date)

            if not is_consecutive_weekly_off:
                # Check next Sunday
                next_weekly_off_instance = sql_helper.get_next_weekly_off_instance(next_weekly_off, employee_code, False)

                if next_weekly_off_instance:
                    # Directly update next Sunday's is_consecutive_weekly_off
                    sql_helper.update_is_consecutive_weekly_off(next_weekly_off, employee_code, True)

                    # Recursively call the method for the next Sunday
                    next_weekly_off_data = {
                        'date': next_weekly_off,
                        'status': '11',
                        'employee_code': employee_code,
                    }
                    update_consecutive_weekly_off_sql(cursor, next_weekly_off_data)
            else:
                # Check next Sunday
                next_weekly_off_instance = sql_helper.get_next_weekly_off_instance(next_weekly_off, employee_code, True)

                if next_weekly_off_instance:
                    # Directly update next Sunday's is_consecutive_weekly_off
                    sql_helper.update_is_consecutive_weekly_off(next_weekly_off, employee_code, False)

                    # Recursively call the method for the next Sunday
                    next_weekly_off_data = {
                        'date': next_weekly_off,
                        'status': '11',
                        'employee_code': employee_code,
                    }
                    update_consecutive_weekly_off_sql(cursor, next_weekly_off_data)

        else:
            # If status is not '11', set is_consecutive_weekly_off to False
            sql_helper.update_is_consecutive_weekly_off(date, employee_code, False)

            # Check next Sunday
            next_weekly_off_instance = sql_helper.get_next_weekly_off_instance(next_weekly_off, employee_code, True)

            if next_weekly_off_instance:
                # Directly update next Sunday's is_consecutive_weekly_off
                sql_helper.update_is_consecutive_weekly_off(next_weekly_off, employee_code, False)

                # Recursively call the method for the next Sunday
                next_weekly_off_data = {
                    'date': next_weekly_off,
                    'status': '11',
                    'employee_code': employee_code,
                }
                update_consecutive_weekly_off_sql(cursor, next_weekly_off_data)

    return data


def get_shift_details_if_not_exist(login_time,logout_time):
    # login_time = convert_time_to_minutes(login_time_str)
    noon_time = convert_time_to_minutes("12:00")
    checking_time = login_time if login_time>0 else logout_time

    shift_in_str = "00:00"
    shift_out_str = "00:00"

    if 0 < checking_time < noon_time:
        # Day Shift (Before 12:00 PM)
        shift_in_str = "07:00"
        shift_out_str = "19:00"
    elif checking_time >= noon_time:
        # Night Shift (After 12:00 PM)
        shift_in_str = "19:00"
        shift_out_str = "07:00"

    return shift_in_str, shift_out_str


def update_row_status(row_data, punch_in_date, postgres_cursor,weekly_off):
    worked_hrs = int(row_data["total_hours"] or 0)
    base_hrs = int(row_data["working_time"] or 0)
    login_time_str = row_data["login_time"]
    logout_time_str = row_data["logout_time"]
    shift_in_str = row_data["shift_in"]
    shift_out_str = row_data["shift_out"]

    if isinstance(punch_in_date, str):
        punch_in_date = datetime.strptime(punch_in_date, "%Y-%m-%d").date()


    if shift_in_str == '00:00' and shift_out_str == '00:00':
        shift_in_str, shift_out_str = get_shift_details_if_not_exist(int(login_time_str or 0),int(logout_time_str or 0))
        row_data["shift_in"] = shift_in_str
        row_data["shift_out"] = shift_out_str

    # shift_in = convert_to_time(shift_in_str)
    # login_time = convert_to_time(login_time_str)
    # logout_time = convert_to_time(logout_time_str)
    # print("logiit time str",login_time_str,logout_time_str)
    has_one_swipe = (logout_time_str == "0000") != (login_time_str == "0000")

    if not is_today(punch_in_date) and has_one_swipe:
        row_data["status"] = Status.SwipeMiss.value
    elif check_if_weekly_off(punch_in_date,weekly_off):
        if worked_hrs > 0:
            row_data["status"] = Status.WeeklyOffOvertime.value
        else:
            row_data["status"] = Status.WeeklyOff.value

    # Check if it's a Holiday
    elif check_only_holiday(punch_in_date,postgres_cursor):
        if worked_hrs > 0:
            row_data["status"] = Status.HolidayOvertime.value
        else:
            row_data["status"] = Status.Holiday.value

    # Check if worked hours are 0 (Absent)

    # Check if it's a Swipe Miss
    # elif not is_today(punch_in_date) and (logout_time_str == "0000" or login_time_str == "0000"):
    #     row_data["status"] = Status.SwipeMiss.value

    elif is_today(punch_in_date) and logout_time_str == "0000" and login_time_str == "0000" and worked_hrs == 0:
        row_data["status"] = Status.YetToPunchToday.value

    elif is_today(punch_in_date) and logout_time_str == "0000" :
        row_data["status"] = Status.OnTime.value

    # Check if the employee is Late and Left Early
    # elif is_late(login_time, shift_in) and is_left_early(worked_hrs, base_hrs):
    #     row_data["status"] = Status.LateAndLeftEarly.value

    elif worked_hrs == 0:
        row_data["status"] = Status.Absent.value

    # Check if the employee Left Early
    elif is_left_early(worked_hrs, base_hrs):
        row_data["status"] = Status.LeftEarly.value

    # Check if the employee is Late Today
    # elif is_late(login_time, shift_in) and is_today(punch_in_date) and is_midnight(logout_time):
    #     row_data["status"] = Status.LateToday.value

    # Check if the employee is Late and has Overtime
    # elif is_late(login_time, shift_in) and (int(row_data["ot_hrs"]) > 0 or int(row_data["ot2_hrs"]) > 0):
    #     row_data["status"] = Status.LateAndOvertime.value

    # Check if the employee has Regular Overtime
    elif int(row_data["ot_hrs"]) > 0 or int(row_data["ot2_hrs"]) > 0:
        row_data["status"] = Status.RegularAndOvertime.value

    # Default to OnTime
    else:
        row_data["status"] = Status.OnTime.value

    return row_data


def get_work_time(formatted_date,grace_master_data,postgres_cursor,weekly_off):
    if isinstance(formatted_date, str):
        formatted_date = datetime.strptime(formatted_date, "%Y-%m-%d").date()
    is_weekly_off=check_if_weekly_off(formatted_date,weekly_off)
    is_holiday=check_only_holiday(formatted_date,postgres_cursor)

    if is_weekly_off or is_holiday:
        work_time = grace_master_data['weekly_off_work_mins']
    else:
        work_time = grace_master_data['min_work_mins']
    return work_time

def get_previous_date_records(current_date,t_enter_connection,employee_id):
        """Fetch records from the previous day."""
        previous_date = (datetime.strptime(current_date, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
        # print("previous date",previous_date)
        return get_t_enter_attendance_details(t_enter_connection, previous_date, employee_id)



# def operate_on_attendance_data( formatted_date, formatted_time, employee_code, postgres_cursor, existing_data,employee_data,**kwargs):
#     grace_master_data = kwargs.get('grace_master_data')
#     is_ot_eligible = kwargs.get('is_ot_eligible')
#     weekly_off = kwargs.get('weekly_off')

#     shift_name='0'
#     shift_in='00:00'
#     shift_out='00:00'
#     shift_details = get_shift_details(postgres_cursor, 1, employee_data[1])

#     #TODO here if two devices exist for login and logout then differentiate by terminal ID
#     login_time = existing_data[0] if existing_data else formatted_time
#     logout_time = '0000' if login_time==formatted_time else formatted_time if  existing_data  else '0000'

#     if shift_details:
#         shift_name = shift_details[0]
#         shift_in = shift_details[1]
#         shift_out = shift_details[2]

#     work_time=get_work_time(formatted_date, grace_master_data,postgres_cursor,weekly_off)
#     # print("work time ",work_time)
#     data = {
#         "date": formatted_date,
#         "login_time": login_time,
#         "employee_code": employee_data[2],
#         "logout_time":  logout_time,
#         'employee_name': employee_data[0],
#         "working_time": work_time,
#         "shift": shift_name,
#         "shift_in": shift_in,
#         "shift_out": shift_out,
#         "status": '0',
#         "total_hours": '',
#         "less_hrs": '',
#         "late_hrs": '',
#         "ot_hrs": '',
#         'hot_hrs': '',
#         'ot2_hrs': '',
#         'extra_hrs': '',
#         'processed_total_hour': '',
#         'is_consecutive_weekly_off': False,
#         'processed_logout_time': '',
#         "permitted_ot": '',
#         "scheduled_ot": '',
#     }
#     data=calculate_ot_minutes(data,login_time,logout_time,data['working_time'],grace_master_data,is_ot_eligible,weekly_off=weekly_off,postgres_cursor=postgres_cursor)
#     data=calculation_fun(data,postgres_cursor,grace_master_data,is_ot_eligible,weekly_off)
#     data = update_row_status(data,data['date'],postgres_cursor,weekly_off)
#     return data


def operate_on_attendance_data( formatted_date, formatted_time, employee_code, postgres_cursor, existing_data,employee_data,**kwargs):
    grace_master_data = kwargs.get('grace_master_data')
    is_ot_eligible = kwargs.get('is_ot_eligible')
    weekly_off = kwargs.get('weekly_off')
    attendance_details = kwargs.get('attendance_details')
    # print("attendacne detail..985",attendance_details)

    shift_name='Dynamic Shift'
    shift_in='00:00'
    shift_out='00:00'
    shift_details = get_shift_details(postgres_cursor, 1, employee_data[1])

    if len(attendance_details) > 1:
        login_time=remove_seconds_from_time(attendance_details[0][1])
        # print("llogin time ..945",login_time)
        logout_time = remove_seconds_from_time(attendance_details[-1][1])
    else:
        # TODO: If two devices exist for login/logout, differentiate by terminal ID
        # print("exisitng data line 998",existing_data)
        if existing_data:
            login_time = existing_data[0]
            logout_time = formatted_time if existing_data[0] != formatted_time else '0000'
            # print("login time an logout time 1002",login_time,logout_time)
        else:
            login_time = formatted_time
            # print("1005 login time",login_time)
            logout_time = '0000'

    if shift_details:
        # print("shit detials 1009",shift_details)
        shift_name = shift_details[0]
        shift_in = shift_details[1]
        shift_out = shift_details[2]
    work_time=get_work_time(formatted_date, grace_master_data,postgres_cursor,weekly_off)
    # print("work time 1013",work_time)
    data = {
        "date": formatted_date,
        "login_time": login_time,
        "employee_code": employee_data[2],
        "logout_time":  logout_time,
        'employee_name': employee_data[0],
        "working_time": work_time,
        "shift": shift_name,
        "shift_in": shift_in,
        "shift_out": shift_out,
        "status": '0',
        "total_hours": '',
        "less_hrs": '',
        "late_hrs": '',
        "ot_hrs": '',
        'hot_hrs': '',
        'ot2_hrs': '',
        'extra_hrs': '',
        'processed_total_hour': '',
        'is_consecutive_weekly_off': False,
        'processed_logout_time': '',
        "permitted_ot": '',
        "scheduled_ot": '',
    }
    # print("dataaa 1039",data)
    data=calculate_ot_minutes(data,login_time,logout_time,data['working_time'],grace_master_data,is_ot_eligible,weekly_off=weekly_off,postgres_cursor=postgres_cursor)
    data=calculation_fun(data,postgres_cursor,grace_master_data,is_ot_eligible,weekly_off)
    data = update_row_status(data,data['date'],postgres_cursor,weekly_off)
    # logger.info(f"Data .. {data}")
    return data

def remove_seconds_from_time(time):
    time_str = time.strip().zfill(6)
    return time_str[:4]

def modify_t_enter_data(postgres_cursor, data, employee_data, **kwargs):
    date = data[0]
    employee_code = data[2]
    time = data[1]

    formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%Y-%m-%d")

    time_str = time.strip().zfill(6)
    formatted_time = time_str[:4]

    existing_attendance_data = get_existing_attendance_data(
        postgres_cursor, employee_data[2], formatted_date
    )
    attendance_data = operate_on_attendance_data(
        formatted_date,
        formatted_time,
        employee_code,
        postgres_cursor,
        existing_attendance_data,
        employee_data,
        **kwargs
    )

    # print("existing attendance data",attendance_data)
    if existing_attendance_data:
        update_attendance_details(attendance_data,postgres_cursor)
    else:
        insert_attendance_details(attendance_data, postgres_cursor)

    return attendance_data



def get_standard_punch_times(grace_master_data, default_login_time='0900'):
    # print("grace master data",grace_master_data)
    login_time = default_login_time
    # print("login time",login_time)
    login_time_obj = datetime.strptime(login_time, '%H%M')
    # print("login obj..",login_time_obj)
    logout_time_obj = login_time_obj + timedelta(
        minutes=int(grace_master_data['min_work_mins']) + int(grace_master_data['break_time'])
    )
    logout_time = logout_time_obj.strftime('%H%M')
    total_worked_hrs = int(grace_master_data['min_work_mins'])
    return login_time, logout_time, total_worked_hrs


def operate_on_attendance_data_if_not_exist(formatted_date, postgres_cursor, employee_data, grace_master_data, auto_punch, is_ot_eligible, weekly_off):
    if isinstance(formatted_date, str):
        formatted_date = datetime.strptime(formatted_date, "%Y-%m-%d").date()

    shift_name = '0'
    shift_in = '00:00'
    shift_out = '00:00'
    shift_details = get_shift_details(postgres_cursor, 1, employee_data[1])

    login_time = '0000'
    logout_time = '0000'
    total_worked_hrs = '0'
    work_time = get_work_time(formatted_date, grace_master_data, postgres_cursor, weekly_off)

    leave_entry = get_leave_entry_for_employee(postgres_cursor, employee_data[2], formatted_date)

    if not leave_entry:
        leave_application = get_leave_application_for_employee(postgres_cursor, employee_data[2], formatted_date)
    else:
        leave_application = None

    # If an approved reversal covers this date, treat as a normal working day
    postgres_cursor.execute("""
        SELECT 1
        FROM public.master_leavereversalrequest lr
        JOIN public.master_employeemaster me ON me.id = lr.employee_id AND me.b_id = '1'
        WHERE lr.b_id = '1'
          AND lr.approval_status = 'APPROVED'
          AND me.employee_code = %s
          AND %s BETWEEN lr.reverse_from_date AND lr.reverse_to_date
        LIMIT 1
    """, [employee_data[2], formatted_date])
    if postgres_cursor.fetchone():
        leave_entry       = None
        leave_application = None

    if shift_details:
        shift_name, shift_in, shift_out = shift_details

    if check_if_weekly_off(formatted_date, weekly_off):
        status = Status.WeeklyOff.value

    elif check_only_holiday(formatted_date, postgres_cursor):
        status = Status.Holiday.value
    elif leave_entry:
        leave_type = leave_entry[1]
        leave_code = leave_entry[0]
        if leave_type == 'Leave':
            login_time = logout_time = '0000'
            total_worked_hrs = '0'
        else:
            login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
        print("Leave entry", leave_entry, "Login:", login_time, "Logout:", logout_time, "Worked Hrs:", total_worked_hrs)
        status = leave_code

    elif leave_application:
        status_obj = get_annual_leave_code(postgres_cursor)
        login_time = logout_time = '0000'
        total_worked_hrs = '0'
        status = status_obj[0]

    elif auto_punch:
        login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
        status = Status.OnTime.value

    elif is_today(formatted_date):
        status = Status.YetToPunchToday.value

    else:
        status = Status.Absent.value

    data = {
        "date": formatted_date,
        "login_time": login_time,
        "employee_code": employee_data[2],
        "logout_time": logout_time,
        "employee_name": employee_data[0],
        "working_time": work_time,
        "shift": shift_name,
        "shift_in": shift_in,
        "shift_out": shift_out,
        "status": status,
        "total_hours": total_worked_hrs,
        "less_hrs": '0',
        "late_hrs": '0',
        "ot_hrs": '0',
        "hot_hrs": '0',
        "ot2_hrs": '0',
        "extra_hrs": '0',
        "processed_total_hour": total_worked_hrs,
        "is_consecutive_weekly_off": False,
        "processed_logout_time": logout_time,
        "permitted_ot": '0',
        "scheduled_ot": '0',
    }

    if int(data['total_hours']) > 0:
        data = calculate_ot_minutes(data, login_time, logout_time, data['working_time'], grace_master_data, is_ot_eligible)
        data = calculation_fun(data, postgres_cursor, grace_master_data, is_ot_eligible, weekly_off)
        # data = update_row_status(data, data['date'], postgres_cursor, weekly_off)

    return data

def update_attendance_data_if_not_exist(date,employee_data,postgres_cursor, **kwargs):
    grace_master_data=kwargs.get('grace_master_data')
    auto_punch = kwargs.get('auto_punch')
    is_ot_eligible = kwargs.get('is_ot_eligible')
    weekly_off = kwargs.get('weekly_off')
    formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%Y-%m-%d")
    existing_attendance_data = get_existing_attendance_data(
        postgres_cursor, employee_data[2], formatted_date
    )
    print("comeing here",existing_attendance_data)
    attendance_data = operate_on_attendance_data_if_not_exist(formatted_date, postgres_cursor, employee_data,grace_master_data,auto_punch,is_ot_eligible,weekly_off)
    if existing_attendance_data:
        update_attendance_details(attendance_data, postgres_cursor)
    else:
        insert_attendance_details(attendance_data, postgres_cursor)
    return attendance_data

def has_valid_attendance_data(login_time, logout_time):
    """
    Check if attendance record has valid data
    Returns True if record has valid times (not null/empty/0000)
    Returns False if record needs update (both times are invalid)
    """
    # Check if login_time is invalid
    login_invalid = (
        login_time is None or 
        login_time == "" or 
        login_time == "0000"
    )
    
    # Check if logout_time is invalid
    logout_invalid = (
        logout_time is None or 
        logout_time == "" or 
        logout_time == "0000"
    )
    
    # If BOTH are invalid, return False (needs update)
    if login_invalid and logout_invalid:
        return False
    
    # If at least one is valid, return True (preserve record)
    return True

# â”€â”€ Bulk pre-load helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _bulk_fetch_bio_punches(t_enter_conn, date_list, emp_codes):
    """Single query to biometric DB for all employees Ã— all dates."""
    from collections import defaultdict
    if not date_list or not emp_codes:
        return {}
    cursor = t_enter_conn.cursor()
    placeholders_dates = ','.join(['%s'] * len(date_list))
    placeholders_emps  = ','.join(['%s'] * len(emp_codes))
    query = f"""
        SELECT
            TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'YYYY-MM-DD') AS c_date,
            TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'HH24MISS')   AS c_time,
            emp_code,
            emp_id      AS l_uid,
            terminal_sn AS l_tid
        FROM public.iclock_transaction
        WHERE (punch_time AT TIME ZONE 'Asia/Dubai')::date IN ({placeholders_dates})
          AND emp_code IN ({placeholders_emps})
        ORDER BY emp_code, c_date, c_time;
    """
    cursor.execute(query, date_list + emp_codes)
    result = defaultdict(list)
    for row in cursor.fetchall():
        result[(row[2], row[0])].append(row)
    return result


def _bulk_fetch_existing_attendance(postgres_cursor, date_list, emp_codes):
    """Single query for all existing attendance records in the date range.
    Returns dict: (emp_code, date_str) -> (login_time, logout_time, status, total_hours)
    """
    if not date_list or not emp_codes:
        return {}
    placeholders_dates = ','.join(['%s'] * len(date_list))
    placeholders_emps  = ','.join(['%s'] * len(emp_codes))
    query = f"""
        SELECT employee_code, date, login_time, logout_time, status, total_hours
        FROM public.hrm_attendancedetails
        WHERE b_id = '1'
          AND date IN ({placeholders_dates})
          AND employee_code IN ({placeholders_emps})
    """
    postgres_cursor.execute(query, date_list + emp_codes)
    result = {}
    for row in postgres_cursor.fetchall():
        result[(str(row[0]), str(row[1]))] = (row[2], row[3], row[4], row[5])
    return result


def _bulk_fetch_leave_entries(postgres_cursor, start_date, end_date, emp_codes):
    """Single query for all approved leave entries overlapping the date range.

    Returns dict: emp_code -> list of
        (from_date[0], to_date[1], status_code[2], travel_or_leave[3],
         type_of_days[4], status_name[5], extended_to_date[6],
         allow_beyond_eligible[7], lop_days_from_extension[8], is_paid_beyond[9])
    """
    from collections import defaultdict
    if not emp_codes:
        return {}
    placeholders = ','.join(['%s'] * len(emp_codes))
    query = f"""
        SELECT me.employee_code, le.from_date, le.to_date,
               asm.code AS status_code, le.travel_or_leave,
               le.type_of_days, asm.status_name, le.extended_to_date,
               le.allow_beyond_eligible,
               COALESCE(le.lop_days_from_extension, 0) AS lop_days_from_extension,
               le.is_paid_beyond
        FROM public.master_leaveentry le
        JOIN public.master_employeemaster me
            ON me.id = le.employee_id AND me.b_id = '1'
        JOIN public.hrm_attendancestatusmaster asm
            ON asm.id = le.leave_type_id
        WHERE le.b_id = '1'
          AND le.approval_status = 'APPROVED'
          AND le.is_active = TRUE
          AND le.to_date >= %s
          AND le.from_date <= %s
          AND me.employee_code IN ({placeholders})
    """
    postgres_cursor.execute(query, [start_date, end_date] + emp_codes)
    result = defaultdict(list)
    for row in postgres_cursor.fetchall():
        result[row[0]].append((row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10]))
    return result


def _bulk_fetch_leave_applications(postgres_cursor, start_date, end_date, emp_codes):
    """Single query for all approved leave applications overlapping the date range.
    Fetches type_of_days from LeavePolicy via LeaveMasterDetails (latest by id).
    LeaveApplication always maps to 'Annual Leave' (same as get_annual_leave_code).
    Returns dict: emp_code -> list of
        (start_date, end_date, type_of_days, leave_type_name, resume_duty_on,
         allow_beyond_eligible, lop_days_from_extension)
    allow_beyond_eligible + lop_days_from_extension are used to split Annual Leave / LOP
    correctly in the attendance pipeline without relying on pre-existing status='22' rows.
    """
    from collections import defaultdict
    if not emp_codes:
        return {}
    placeholders = ','.join(['%s'] * len(emp_codes))
    query = f"""
        SELECT
            me.employee_code,
            la.leave_approved_start_date,
            la.leave_approved_end_date,
            COALESCE(lp.type_of_days, 'Calendar_days') AS type_of_days,
            'Annual Leave' AS leave_type_name,
            la.resume_duty_on,
            la.allow_beyond_eligible,
            COALESCE(la.lop_days_from_extension, 0) AS lop_days_from_extension
        FROM public.master_leaveapplication la
        JOIN public.master_employeemaster me
            ON me.id = la.employee_code_id
        LEFT JOIN (
            SELECT DISTINCT ON (lm.employee_id)
                lm.employee_id,
                lmd.leave_policy_key_id
            FROM public.master_leavemasterdetails lmd
            JOIN public.master_leavemaster lm
                ON lm.id = lmd.leave_master_id AND lm.b_id = '1'
            ORDER BY lm.employee_id, lmd.id DESC
        ) lmd ON lmd.employee_id = me.id
        LEFT JOIN public.master_leavepolicy lp
            ON lp.id = lmd.leave_policy_key_id
        WHERE la.b_id = '1'
          AND la.approval_status = 'APPROVED'
          AND la.is_active = TRUE
          AND la.leave_approved_end_date >= %s
          AND la.leave_approved_start_date <= %s
          AND me.employee_code IN ({placeholders})
    """
    postgres_cursor.execute(query, [start_date, end_date] + emp_codes)
    result = defaultdict(list)
    for row in postgres_cursor.fetchall():
        # start, end, type_of_days, leave_type_name, resume_duty_on, allow_beyond, lop_days
        result[row[0]].append((row[1], row[2], row[3], row[4], row[5], bool(row[6]), float(row[7] or 0)))
    return result


def _bulk_fetch_pending_overstay(postgres_cursor, start_date, emp_codes):
    """
    Fetch the most recent approved leave (LeaveEntry or LeaveApplication) per employee
    where the leave ended BEFORE the run's start_date and no resume/extended date is set.

    These are leaves that finished in a previous period â€” the normal leave cache misses
    them because it only fetches records overlapping the current date range.

    Returns dict: emp_code -> list of overstay candidates
      LeaveEntry    tuples: ('entry', to_date,   status_name,      None)
      LeaveApp      tuples: ('app',   end_date,   leave_type_name,  None)
    """
    from collections import defaultdict
    if not emp_codes:
        return {}
    placeholders = ','.join(['%s'] * len(emp_codes))
    result = defaultdict(list)

    # â”€â”€ LeaveEntry: to_date < start_date, no extended_to_date â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    entry_query = f"""
        SELECT DISTINCT ON (me.employee_code)
            me.employee_code,
            le.to_date,
            asm.status_name
        FROM public.master_leaveentry le
        JOIN public.master_employeemaster me
            ON me.id = le.employee_id AND me.b_id = '1'
        JOIN public.hrm_attendancestatusmaster asm
            ON asm.id = le.leave_type_id
        WHERE le.b_id = '1'
          AND le.approval_status = 'APPROVED'
          AND le.is_active = TRUE
          AND le.to_date < %s
          AND le.extended_to_date IS NULL
          AND me.employee_code IN ({placeholders})
        ORDER BY me.employee_code, le.to_date DESC
    """
    postgres_cursor.execute(entry_query, [start_date] + emp_codes)
    for row in postgres_cursor.fetchall():
        result[row[0]].append(('entry', row[1], row[2], None))

    # â”€â”€ LeaveApplication: end_date < start_date, no resume_duty_on â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # LeaveApplication always corresponds to Annual Leave â€” the attendance task
    # uses get_annual_leave_code() which hardcodes 'Annual Leave' as the status.
    app_query = f"""
        SELECT DISTINCT ON (me.employee_code)
            me.employee_code,
            la.leave_approved_end_date,
            'Annual Leave' AS leave_type_name
        FROM public.master_leaveapplication la
        JOIN public.master_employeemaster me
            ON me.id = la.employee_code_id
        WHERE la.b_id = '1'
          AND la.approval_status = 'APPROVED'
          AND la.is_active = TRUE
          AND la.leave_approved_end_date < %s
          AND la.resume_duty_on IS NULL
          AND me.employee_code IN ({placeholders})
        ORDER BY me.employee_code, la.leave_approved_end_date DESC
    """
    postgres_cursor.execute(app_query, [start_date] + emp_codes)
    for row in postgres_cursor.fetchall():
        result[row[0]].append(('app', row[1], row[2], None))

    return result


def _bulk_fetch_resume_punches(t_enter_conn, pending_overstay_cache, auto_punch_emp_codes,
                               leave_entry_cache=None, leave_app_cache=None):
    """
    For each NON-auto-punch employee that could be in overstay, find the earliest
    date on which they have a real bio swipe in iclock_transaction AFTER their leave ended.

    Auto-punch employees are excluded â€” they always have generated records so a
    punch record does not mean they physically returned.

    Covers all three overstay sources:
      - pending_overstay_cache: leaves ending before the run window
      - leave_entry_cache:      leaves overlapping the window with no extended_to_date
      - leave_app_cache:        applications overlapping the window with no resume_duty_on

    Returns dict: emp_code -> earliest real bio-punch date after leave end.
    """
    # Collect earliest leave-end per employee, skipping auto-punch employees
    emp_end_map = {}

    def _track(emp_code, end_date):
        if emp_code in auto_punch_emp_codes:
            return  # auto-punch: generated records are not real bio punches
        if end_date and (emp_code not in emp_end_map or end_date < emp_end_map[emp_code]):
            emp_end_map[emp_code] = end_date

    for emp_code, records in (pending_overstay_cache or {}).items():
        for rec in records:
            _track(emp_code, rec[1])

    for emp_code, entries in (leave_entry_cache or {}).items():
        for entry in entries:
            if entry[6] is None:   # extended_to_date is None
                _track(emp_code, entry[1])

    for emp_code, apps in (leave_app_cache or {}).items():
        for app in apps:
            if app[4] is None:     # resume_duty_on is None
                _track(emp_code, app[1])

    if not emp_end_map:
        return {}

    # Query iclock_transaction (bio machine DB) for first real swipe after leave end
    cursor = t_enter_conn.cursor()
    emp_end_pairs = list(emp_end_map.items())
    values_sql = ', '.join(['(%s, %s::date)'] * len(emp_end_pairs))
    flat_params = []
    for emp_code, end_date in emp_end_pairs:
        flat_params.extend([emp_code, end_date])

    query = f"""
        SELECT iclock_transaction.emp_code,
               MIN((punch_time AT TIME ZONE 'Asia/Dubai')::date) AS first_punch_date
        FROM public.iclock_transaction
        JOIN (VALUES {values_sql}) AS v(emp_code, leave_end)
            ON iclock_transaction.emp_code = v.emp_code
           AND (punch_time AT TIME ZONE 'Asia/Dubai')::date > v.leave_end
        GROUP BY iclock_transaction.emp_code
    """
    cursor.execute(query, flat_params)
    result = {}
    for row in cursor.fetchall():
        result[row[0]] = row[1]

    return result


def _bulk_fetch_leave_reversals(postgres_cursor, start_date, end_date, emp_codes):
    """Single query for all approved leave reversals overlapping the date range.
    Returns dict: emp_code -> list of (reverse_from_date, reverse_to_date)
    """
    from collections import defaultdict
    if not emp_codes:
        return {}
    placeholders = ','.join(['%s'] * len(emp_codes))
    query = f"""
        SELECT me.employee_code, lr.reverse_from_date, lr.reverse_to_date
        FROM public.master_leavereversalrequest lr
        JOIN public.master_employeemaster me
            ON me.id = lr.employee_id AND me.b_id = '1'
        WHERE lr.b_id = '1'
          AND lr.approval_status = 'APPROVED'
          AND lr.reverse_to_date   >= %s
          AND lr.reverse_from_date <= %s
          AND me.employee_code IN ({placeholders})
    """
    postgres_cursor.execute(query, [start_date, end_date] + emp_codes)
    result = defaultdict(list)
    for row in postgres_cursor.fetchall():
        result[row[0]].append((row[1], row[2]))  # (reverse_from_date, reverse_to_date)
    return result


def _get_leave_reversal_from_cache(reversal_cache, emp_code, punch_date):
    """Return True if an approved reversal covers punch_date for this employee."""
    for (from_date, to_date) in reversal_cache.get(emp_code, []):
        if from_date <= punch_date <= to_date:
            return True
    return False


def _is_no_pay_penalty(postgres_cursor, emp_code, punch_date):
    """
    Return True if an approved DisciplinaryAction with affects_pay=True
    covers punch_date for this employee. Checked first before leave/shift logic
    so the status is always overridden to NoPayPenalty for penalised days.
    """
    postgres_cursor.execute(
        """
        SELECT 1 FROM hrm_disciplinaryaction da
        JOIN master_employeemaster em ON em.id = da.employee_id
        WHERE em.employee_code = %s
        AND da.approval_status = 'APPROVED'
        AND da.affects_pay = TRUE
        AND da.from_date <= %s
        AND da.to_date >= %s
        AND da.is_active = TRUE
        LIMIT 1
        """,
        (emp_code, punch_date.strftime('%Y-%m-%d'), punch_date.strftime('%Y-%m-%d'))
    )
    return postgres_cursor.fetchone() is not None


def _bulk_fetch_shifts(postgres_cursor, shift_ids):
    """Single query for all distinct shift details."""
    if not shift_ids:
        return {}
    ids = [s for s in shift_ids if s is not None]
    if not ids:
        return {}
    placeholders = ','.join(['%s'] * len(ids))
    query = f"""
        SELECT id, shift_name, start_time, end_time
        FROM public.master_shifttimings
        WHERE b_id = '1' AND id IN ({placeholders})
    """
    postgres_cursor.execute(query, ids)
    return {row[0]: (row[1], row[2], row[3]) for row in postgres_cursor.fetchall()}


def _get_leave_entry_from_cache(leave_cache, emp_code, punch_date):
    """Look up leave entry for an employee on a date from pre-loaded cache.
    Returns (status_code, travel_or_leave, type_of_days) or None.
    Cache format: (from_date, to_date, status_code, travel_or_leave, type_of_days, status_name)
    """
    for entry in leave_cache.get(emp_code, []):
        from_date, to_date, status_code, travel_or_leave, type_of_days = entry[0], entry[1], entry[2], entry[3], entry[4]
        if from_date <= punch_date <= to_date:
            return (status_code, travel_or_leave, type_of_days or 'Working_days')
    return None


def _get_leave_application_from_cache(leave_app_cache, emp_code, punch_date):
    """Look up leave application for an employee on a date from pre-loaded cache.
    Returns (start_date, type_of_days, allow_beyond_eligible, lop_days_from_extension) or None.
    Tuple indices from _bulk_fetch_leave_applications:
      [0]=start, [1]=end, [2]=type_of_days, [3]=leave_type_name,
      [4]=resume_duty_on, [5]=allow_beyond_eligible, [6]=lop_days_from_extension
    """
    for row in leave_app_cache.get(emp_code, []):
        start, end = row[0], row[1]
        if start <= punch_date <= end:
            type_of_days = row[2]
            allow_beyond = row[5] if len(row) > 5 else False
            lop_days     = row[6] if len(row) > 6 else 0.0
            return (start, type_of_days, allow_beyond, lop_days)
    return None


def _get_grace_details_from_cache(grace_cache, postgres_cursor, punch_date, emp_type, emp_group, emp_reporting, emp_shift):
    """Return grace details using cache; fetch from DB only on cache miss.
    Special grace is date-sensitive so key includes date; Normal grace is date-free.
    We try Special first (with date), fall back to Normal (no date in key).
    """
    special_key = ('S', emp_type, emp_group, emp_reporting, emp_shift, str(punch_date))
    if special_key in grace_cache:
        return grace_cache[special_key]

    normal_key = ('N', emp_type, emp_group, emp_reporting, emp_shift)
    # Try to resolve via Special query; if miss, Normal query (date-free, cacheable forever)
    result = get_grace_details(postgres_cursor, punch_date, emp_type, emp_group, emp_reporting, emp_shift)
    grace_cache[special_key] = result
    # Also cache under normal key so future dates that miss Special hit the cached Normal
    if normal_key not in grace_cache:
        grace_cache[normal_key] = result
    return result


# â”€â”€ Patched helpers that accept pre-loaded holiday list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _calculation_fun_fast(data, holiday_list, grace_master_data, is_ot_eligible, weekly_off):
    """calculation_fun using pre-loaded holiday list instead of cursor."""
    total_hrs = int(data["total_hours"] or 0)
    wrk_time  = int(data["working_time"] or 0)
    ot_hrs    = int(data["ot_hrs"] or 0)
    login_time  = data["login_time"]
    logout_time = data["logout_time"]
    punch_in_date = data['date']
    if isinstance(punch_in_date, str):
        punch_in_date = datetime.strptime(punch_in_date, "%Y-%m-%d").date()

    formatted_login_time  = format_time(login_time)
    formatted_logout_time = format_time(logout_time)
    login_dt  = datetime.strptime(formatted_login_time,  "%H:%M")
    logout_dt = datetime.strptime(formatted_logout_time, "%H:%M")

    fixed_ot_hrs = get_maximum_ot_mins(login_dt, logout_dt, grace_master_data)
    is_weekly_off = check_if_weekly_off(punch_in_date, weekly_off)
    is_holiday    = check_only_holiday(punch_in_date, holiday_list)   # list, not cursor

    if (is_weekly_off or is_holiday) and ot_hrs:
        max_hot_time = get_maximum_hot_mins(login_dt, logout_dt, grace_master_data)
        hot_hrs = max_hot_time if total_hrs > max_hot_time else apply_ot_rounding(total_hrs, max_hot_time)
        data.update({
            'hot_hrs': hot_hrs if is_ot_eligible else '0',
            'ot2_hrs': '0',
            'less_hrs': '0',
            'extra_hrs': '0',
            'ot_hrs': '0',
            'processed_total_hour': total_hrs,
            'processed_logout_time': logout_time,
        })
    else:
        workable_hrs = wrk_time + fixed_ot_hrs
        extra_hrs = max(total_hrs - workable_hrs, 0) if wrk_time > 0 else 0
        less_hrs  = max(wrk_time - total_hrs, 0)    if wrk_time > 0 else 0
        if total_hrs > workable_hrs:
            processed_total_hour = total_hrs - extra_hrs
            logout_dt2 = datetime.strptime(str(logout_time).zfill(4), "%H%M")
            processed_logout_time = (logout_dt2 - timedelta(minutes=extra_hrs)).strftime("%H%M")
        else:
            processed_total_hour  = total_hrs
            processed_logout_time = logout_time
        data.update({
            "less_hrs":             less_hrs if total_hrs < wrk_time else "0",
            "extra_hrs":            extra_hrs if total_hrs > workable_hrs else "0",
            "processed_total_hour": processed_total_hour,
            "processed_logout_time": processed_logout_time,
        })
        if data['shift'] == '2' or int(login_time or 0) > int(logout_time or 0) != 0:
            data['ot2_hrs'] = ot_hrs
            data['hot_hrs'] = '0'
            data['ot_hrs']  = '0'
        else:
            data['hot_hrs']  = '0'
            data['ot2_hrs']  = '0'
    return data


def _calculate_ot_minutes_fast(data, login_time, logout_time, work_time, grace_master_data, is_ot_eligible, weekly_off, holiday_list):
    """calculate_ot_minutes using pre-loaded holiday list instead of cursor."""
    login_time  = format_time(login_time)
    logout_time = format_time(logout_time)
    login_dt  = datetime.strptime(login_time,  "%H:%M")
    logout_dt = datetime.strptime(logout_time, "%H:%M")

    if login_time == "00:00" or logout_time == "00:00":
        worked_minutes = 0
    else:
        worked_minutes = (logout_dt - login_dt).seconds // 60

    formatted_date = datetime.strptime(data['date'], "%Y-%m-%d").date() if isinstance(data['date'], str) else data['date']
    is_weekly_off = check_if_weekly_off(formatted_date, weekly_off)
    is_holiday    = check_only_holiday(formatted_date, holiday_list)
    break_time = grace_master_data['wo_break_time'] if (is_weekly_off or is_holiday) else grace_master_data['break_time']

    worked_minutes = max(0, worked_minutes - break_time)
    data['total_hours'] = worked_minutes

    if is_ot_eligible:
        ot_minutes = max(0, worked_minutes - int(work_time or 0))
        if ot_minutes <= 0:
            data['ot_hrs'] = ot_minutes
            return data
        maximum_ot_time = get_maximum_ot_mins(login_dt, logout_dt, grace_master_data)
        data['ot_hrs'] = apply_ot_rounding(ot_minutes, maximum_ot_time)
    else:
        data['ot_hrs'] = 0
    return data


def _update_row_status_fast(row_data, punch_in_date, weekly_off, holiday_list):
    """update_row_status using pre-loaded holiday list instead of cursor."""
    worked_hrs      = int(row_data["total_hours"] or 0)
    base_hrs        = int(row_data["working_time"] or 0)
    login_time_str  = row_data["login_time"]
    logout_time_str = row_data["logout_time"]
    shift_in_str    = row_data["shift_in"]
    shift_out_str   = row_data["shift_out"]

    if isinstance(punch_in_date, str):
        punch_in_date = datetime.strptime(punch_in_date, "%Y-%m-%d").date()

    if shift_in_str == '00:00' and shift_out_str == '00:00':
        shift_in_str, shift_out_str = get_shift_details_if_not_exist(
            int(login_time_str or 0), int(logout_time_str or 0)
        )
        row_data["shift_in"]  = shift_in_str
        row_data["shift_out"] = shift_out_str

    has_one_swipe = (logout_time_str == "0000") != (login_time_str == "0000")
    is_weekly_off = check_if_weekly_off(punch_in_date, weekly_off)
    is_holiday    = check_only_holiday(punch_in_date, holiday_list)

    if not is_today(punch_in_date) and has_one_swipe:
        row_data["status"] = Status.SwipeMiss.value
    elif is_weekly_off:
        row_data["status"] = Status.WeeklyOffOvertime.value if worked_hrs > 0 else Status.WeeklyOff.value
    elif is_holiday:
        row_data["status"] = Status.HolidayOvertime.value if worked_hrs > 0 else Status.Holiday.value
    elif is_today(punch_in_date) and logout_time_str == "0000" and login_time_str == "0000" and worked_hrs == 0:
        row_data["status"] = Status.YetToPunchToday.value
    elif is_today(punch_in_date) and logout_time_str == "0000":
        row_data["status"] = Status.OnTime.value
    elif worked_hrs == 0:
        row_data["status"] = Status.Absent.value
    elif is_left_early(worked_hrs, base_hrs):
        row_data["status"] = Status.LeftEarly.value
    elif int(row_data["ot_hrs"]) > 0 or int(row_data["ot2_hrs"]) > 0:
        row_data["status"] = Status.RegularAndOvertime.value
    else:
        row_data["status"] = Status.OnTime.value
    return row_data


# â”€â”€ Phase 6 helpers: policy-driven WOâ†’LOP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _get_subsequent_weekly_offs(absent_date, weekly_off_parsed, holiday_list, max_days=14):
    """
    Walk forward from absent_date+1, collecting every consecutive weekly-off date.
    Stops as soon as a non-weekly-off day is encountered (holidays are skipped, not counted as WO).
    Returns list of date objects.
    """
    from datetime import timedelta as _td
    result = []
    check = absent_date + _td(days=1)
    for _ in range(max_days):
        if check_if_weekly_off(check, weekly_off_parsed):
            result.append(check)
        elif check_only_holiday(check, holiday_list):
            # holidays don't break the chain â€” skip over them
            pass
        else:
            break  # hit a normal working day â€” stop
        check += _td(days=1)
    return result


def _apply_lop_on_absent(postgres_cursor, emp_code, emp_name, absent_date, weekly_off_parsed, holiday_list):
    """
    For each consecutive weekly-off day after absent_date, set its status to LOP.
    Called only when lop_on_absent=True and the day is being marked Absent.
    """
    wo_dates = _get_subsequent_weekly_offs(absent_date, weekly_off_parsed, holiday_list)
    for wo_date in wo_dates:
        date_str = wo_date.strftime('%Y-%m-%d')
        postgres_cursor.execute(
            """
            SELECT id, status FROM public.hrm_attendancedetails
            WHERE employee_code = %s AND date = %s AND b_id = '1'
            """,
            (emp_code, date_str)
        )
        existing = postgres_cursor.fetchone()
        lop_code = str(Status.LOP.value)
        if existing:
            # Only overwrite if it's currently WeeklyOff â€” don't touch leave/holiday/OT rows
            if str(existing[1]) == str(Status.WeeklyOff.value):
                postgres_cursor.execute(
                    """
                    UPDATE public.hrm_attendancedetails
                    SET status = %s, modified = CURRENT_TIMESTAMP, user_modified = 'Data Integration'
                    WHERE id = %s
                    """,
                    (lop_code, existing[0])
                )
        # If no record exists yet for that WO day, it will be created as WO when the
        # scheduler processes that date normally â€” the absentâ†’LOP recheck will run then.


def _revert_lop_on_absent(postgres_cursor, emp_code, absent_date, weekly_off_parsed, holiday_list):
    """
    When a previously-absent day now has hours > 0, revert any consecutive weekly-off days
    that were set to LOP (by _apply_lop_on_absent) back to WeeklyOff.
    """
    wo_dates = _get_subsequent_weekly_offs(absent_date, weekly_off_parsed, holiday_list)
    for wo_date in wo_dates:
        date_str = wo_date.strftime('%Y-%m-%d')
        postgres_cursor.execute(
            """
            SELECT id, status FROM public.hrm_attendancedetails
            WHERE employee_code = %s AND date = %s AND b_id = '1'
            """,
            (emp_code, date_str)
        )
        existing = postgres_cursor.fetchone()
        if existing and str(existing[1]) == str(Status.LOP.value):
            postgres_cursor.execute(
                """
                UPDATE public.hrm_attendancedetails
                SET status = %s, modified = CURRENT_TIMESTAMP, user_modified = 'Data Integration'
                WHERE id = %s
                """,
                (str(Status.WeeklyOff.value), existing[0])
            )


def _get_lop_status_if_preceding_absent(postgres_cursor, emp_code, wo_date, weekly_off_parsed, holiday_list):
    """
    Walk back from wo_date-1 skipping holidays, find the first preceding working day.
    If that day's attendance status is Absent, return LOP status string.
    Otherwise return WeeklyOff status string.
    """
    from datetime import timedelta as _td
    check = wo_date - _td(days=1)
    for _ in range(14):
        if check_only_holiday(check, holiday_list):
            check -= _td(days=1)
            continue
        if check_if_weekly_off(check, weekly_off_parsed):
            check -= _td(days=1)
            continue
        # Found the preceding working day â€” check its status in DB
        postgres_cursor.execute(
            """
            SELECT status FROM public.hrm_attendancedetails
            WHERE employee_code = %s AND date = %s AND b_id = '1'
            """,
            (emp_code, check.strftime('%Y-%m-%d'))
        )
        row = postgres_cursor.fetchone()
        if row and str(row[0]) == str(Status.Absent.value):
            return str(Status.LOP.value)
        return str(Status.WeeklyOff.value)
    return str(Status.WeeklyOff.value)


def _get_preceding_workday_leave_type(leave_entry_cache, leave_app_cache, emp_code, current_date, weekly_off_parsed, holiday_list):
    """
    Walk back up to 14 days from current_date to find the most recent
    working day (not WO, not holiday) and return its leave type name if
    that day was on leave (LeaveEntry or LeaveApplication), else None.

    leave_entry_cache: emp_code â†’ list of (from_date, to_date, status_code, travel_or_leave, type_of_days, status_name)
    leave_app_cache:   emp_code â†’ list of (start_date, end_date, type_of_days, leave_type_name)
    """
    from datetime import timedelta as _td
    check = current_date - _td(days=1)
    for _ in range(14):
        check_date = check.date() if hasattr(check, 'date') else check
        if check_if_weekly_off(check_date, weekly_off_parsed):
            check -= _td(days=1)
            continue
        if check_only_holiday(check_date, holiday_list):
            check -= _td(days=1)
            continue
        # Working day â€” check LeaveEntry first
        for entry in leave_entry_cache.get(emp_code, []):
            from_date, to_date, status_code, travel_or_leave, type_of_days, status_name = entry[0], entry[1], entry[2], entry[3], entry[4], entry[5]
            if from_date <= check_date <= to_date:
                return status_name  # e.g. 'Annual Leave', 'Sick Leave'
        # Then check LeaveApplication
        for row in leave_app_cache.get(emp_code, []):
            start, end, type_of_days, leave_type_name = row[0], row[1], row[2], row[3] if len(row) > 3 else ''
            if start <= check_date <= end and leave_type_name:
                return leave_type_name
        return None  # working day but not on leave â€” stop walking back
    return None


def _should_lop_weekly_off(emp_type, emp_group, emp_reporting, b_id, leave_type_name):
    """
    Return True if the leave policy for this employee+leave_type has
    lop_on_weekly_off_after_leave=True. Defaults to False if no policy found.
    """
    if not leave_type_name:
        return False
    try:
        from hrm_master.tasks.accrue_leave_task import get_leave_policies_for_employee, get_policy_for_date
        from django.utils.timezone import now
        policies_by_lt = get_leave_policies_for_employee(emp_type, emp_group, emp_reporting, b_id)
        today = now().date()
        for _, versions in policies_by_lt.items():
            sample = versions[-1]
            if sample.type_of_leave and sample.type_of_leave.status_name == leave_type_name:
                policy = get_policy_for_date(versions, today)
                if policy:
                    return bool(policy.lop_on_weekly_off_after_leave)
    except Exception as e:
        print(f"[WO-LOP] _should_lop_weekly_off error: {e}")
    return False


def _bulk_fetch_lop_dates(postgres_cursor, start_date, end_date, emp_codes):
    """
    Return a set of (emp_code, date_str) pairs that are marked LOP ('22')
    due to allow_beyond_eligible on a LeaveApplication, LeaveExtension, or LeaveEntry.

    Three sources:
      1. LeaveApplication with allow_beyond_eligible=True â€” LOP days are
         attendance rows with status='22' within the leave date range.
      2. LeaveExtension with allow_beyond_eligible=True â€” LOP days are
         stored in extension_lop_attendance_ids (JSON array of att IDs).
      3. LeaveEntry with allow_beyond_eligible=True AND is_paid_beyond=False â€”
         LOP days are stored in extension_lop_attendance_ids (JSON array of att IDs).

    All are resolved against hrm_attendancedetails so we get actual dates.
    Returns set of (emp_code, 'YYYY-MM-DD').
    """
    if not emp_codes:
        return set()
    placeholders = ','.join(['%s'] * len(emp_codes))
    result = set()

    # Source 1: LeaveApplication allow_beyond â€” attendance rows status='22'
    # within the leave date range for this employee
    try:
        query1 = f"""
            SELECT ad.employee_code, ad.date::text
            FROM public.hrm_attendancedetails ad
            JOIN public.master_leaveapplication la
                ON la.employee_code_id = (
                    SELECT id FROM public.master_employeemaster
                    WHERE employee_code = ad.employee_code AND b_id = '1'
                    LIMIT 1
                )
            WHERE la.b_id = '1'
              AND la.approval_status = 'APPROVED'
              AND la.is_active = TRUE
              AND la.allow_beyond_eligible = TRUE
              AND ad.status = '22'
              AND ad.date BETWEEN %s AND %s
              AND ad.date BETWEEN la.leave_approved_start_date AND la.leave_approved_end_date
              AND ad.employee_code IN ({placeholders})
        """
        postgres_cursor.execute(query1, [start_date, end_date] + emp_codes)
        for row in postgres_cursor.fetchall():
            result.add((str(row[0]), str(row[1])))
    except Exception as e:
        print(f"[LOP-fetch] Source1 error: {e}")

    # Source 2: LeaveExtension allow_beyond â€” extension_lop_attendance_ids array
    try:
        query2 = f"""
            SELECT ad.employee_code, ad.date::text
            FROM public.hrm_attendancedetails ad
            JOIN public.master_leaveextension le
                ON ad.id = ANY(
                    ARRAY(SELECT jsonb_array_elements_text(le.extension_lop_attendance_ids)::int)
                )
            JOIN public.master_employeemaster me
                ON me.id = le.employee_id
            WHERE le.approval_status = 'APPROVED'
              AND le.allow_beyond_eligible = TRUE
              AND ad.date BETWEEN %s AND %s
              AND ad.employee_code IN ({placeholders})
        """
        postgres_cursor.execute(query2, [start_date, end_date] + emp_codes)
        for row in postgres_cursor.fetchall():
            result.add((str(row[0]), str(row[1])))
    except Exception as e:
        print(f"[LOP-fetch] Source2 error: {e}")

    # Source 3: LeaveEntry allow_beyond + unpaid (is_paid_beyond=False) â€”
    # extension_lop_attendance_ids stores the att IDs marked as LOP.
    # Cast to jsonb first to handle both jsonb and text-stored columns.
    try:
        query3 = f"""
            SELECT ad.employee_code, ad.date::text
            FROM public.hrm_attendancedetails ad
            JOIN public.master_leaveentry le
                ON ad.id = ANY(
                    ARRAY(
                        SELECT jsonb_array_elements_text(
                            CASE jsonb_typeof(le.extension_lop_attendance_ids::jsonb)
                                WHEN 'array' THEN le.extension_lop_attendance_ids::jsonb
                                ELSE '[]'::jsonb
                            END
                        )::int
                    )
                )
            JOIN public.master_employeemaster me
                ON me.id = le.employee_id
            WHERE le.b_id = '1'
              AND le.approval_status = 'APPROVED'
              AND le.is_active = TRUE
              AND le.allow_beyond_eligible = TRUE
              AND le.is_paid_beyond = FALSE
              AND jsonb_array_length(
                    CASE jsonb_typeof(le.extension_lop_attendance_ids::jsonb)
                        WHEN 'array' THEN le.extension_lop_attendance_ids::jsonb
                        ELSE '[]'::jsonb
                    END
                  ) > 0
              AND ad.date BETWEEN %s AND %s
              AND ad.employee_code IN ({placeholders})
        """
        postgres_cursor.execute(query3, [start_date, end_date] + emp_codes)
        for row in postgres_cursor.fetchall():
            result.add((str(row[0]), str(row[1])))
    except Exception as e:
        print(f"[LOP-fetch] Source3 error: {e}")

    return result


# begin from here
def transfer_attendance_details(**kwargs):
    """Transfers attendance details within a date range (defaults to today)."""

    t_enter_connection = get_t_enter_connection()
    postgres_conn, postgres_cursor = get_postgres_connection()

    today = datetime.today().strftime("%Y-%m-%d")
    start_date = kwargs.get("start_date", (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d"))
    end_date   = kwargs.get("end_date", today)
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj   = datetime.strptime(end_date,   "%Y-%m-%d")

    employees = get_employees(postgres_cursor, start_date=start_date, end_date=end_date)

    # â”€â”€ Filter employees by code if provided â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    filter_codes = kwargs.get("employee_codes")
    if filter_codes:
        filter_set = {str(c).strip() for c in filter_codes}
        employees = [e for e in employees if str(e[2]) in filter_set]
        if not employees:
            print(f"No employees found for codes: {filter_codes}")
            return

    # â”€â”€ Build date list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    date_list = []
    d = start_date_obj
    while d <= end_date_obj:
        date_list.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)

    emp_codes  = [e[2] for e in employees]
    emp_cards  = [e[3] for e in employees]

    # â”€â”€ Pre-load everything in bulk â€” zero per-iteration DB round trips â”€â”€â”€â”€â”€â”€
    print("Pre-loading static data...")
    holiday_list      = get_holiday_master(postgres_cursor)                           # once
    annual_leave_code = get_annual_leave_code(postgres_cursor)                        # once

    shift_ids   = list({e[1] for e in employees if e[1] is not None})
    shift_cache = _bulk_fetch_shifts(postgres_cursor, shift_ids)                      # one query

    bio_punch_map      = _bulk_fetch_bio_punches(t_enter_connection, date_list, emp_cards)  # one bio query
    existing_att_map   = _bulk_fetch_existing_attendance(postgres_cursor, date_list, emp_codes)  # one query
    leave_entry_cache    = _bulk_fetch_leave_entries(postgres_cursor, start_date, end_date, emp_codes)       # one query
    leave_app_cache      = _bulk_fetch_leave_applications(postgres_cursor, start_date, end_date, emp_codes)  # one query
    leave_reversal_cache = _bulk_fetch_leave_reversals(postgres_cursor, start_date, end_date, emp_codes)     # one query
    pending_overstay_cache = _bulk_fetch_pending_overstay(postgres_cursor, start_date, emp_codes)            # overstay: leaves that ended before this run window
    auto_punch_emp_codes   = {e[2] for e in employees if e[7]}                                              # emp_codes where auto_punch=True
    resume_punch_cache     = _bulk_fetch_resume_punches(t_enter_connection, pending_overstay_cache,
                                                        auto_punch_emp_codes,
                                                        leave_entry_cache, leave_app_cache)                  # first real bio-punch after leave end (bio employees only)
    lop_date_set           = _bulk_fetch_lop_dates(postgres_cursor, start_date, end_date, emp_codes)         # (emp_code, date_str) pairs marked LOP by allow_beyond

    grace_cache = {}  # keyed by (emp_type, emp_group, emp_reporting, shift_id, date_str) â€” lazy

    print(f"Processing {len(employees)} employees Ã— {len(date_list)} days...")

    for employee in employees:
        emp_name      = employee[0]
        shift_id      = employee[1]
        emp_code      = employee[2]
        emp_card      = employee[3]
        emp_type      = employee[4]
        emp_group     = employee[5]
        emp_reporting = employee[6]
        auto_punch    = employee[7]
        is_ot_eligible = employee[8]
        weekly_off    = employee[9]
        shift_details_id = employee[10]
        emp_doj       = employee[11]  # date or None
        emp_dor       = employee[12]  # date or None
        emp_b_id      = str(employee[13])  # branch id

        shift_details = shift_cache.get(shift_id)
        # Parse weekly_off JSON once per employee instead of on every date check
        weekly_off_parsed = parse_weekly_off(weekly_off)

        for date_str in date_list:
            current_date = datetime.strptime(date_str, "%Y-%m-%d")

            # Skip dates before employee joined or after employee was relieved
            if emp_doj and current_date.date() < emp_doj:
                continue
            if emp_dor and current_date.date() > emp_dor:
                continue

            grace_master_data = _get_grace_details_from_cache(
                grace_cache, postgres_cursor, current_date,
                emp_type, emp_group, emp_reporting, shift_details_id
            )

            attendance_details = list(bio_punch_map.get((emp_card, date_str), []))
            existing_att       = existing_att_map.get((str(emp_code), date_str))

            attendance_data = None

            if attendance_details:
                # Process using pre-loaded data â€” no DB reads inside
                if len(attendance_details) > 1:
                    login_time  = remove_seconds_from_time(attendance_details[0][1])
                    logout_time = remove_seconds_from_time(attendance_details[-1][1])
                else:
                    if existing_att:
                        login_time  = existing_att[0]
                        logout_time = attendance_details[0][1][:4] if existing_att[0] != attendance_details[0][1][:4] else '0000'
                    else:
                        login_time  = remove_seconds_from_time(attendance_details[0][1])
                        logout_time = '0000'

                shift_name = 'Dynamic Shift'
                shift_in   = '00:00'
                shift_out  = '00:00'
                if shift_details:
                    shift_name = shift_details[0]
                    shift_in   = shift_details[1]
                    shift_out  = shift_details[2]

                work_time = grace_master_data['weekly_off_work_mins'] if (
                    check_if_weekly_off(current_date.date(), weekly_off_parsed) or
                    check_only_holiday(current_date.date(), holiday_list)
                ) else grace_master_data['min_work_mins']

                data = {
                    "date":                   date_str,
                    "login_time":             login_time,
                    "employee_code":          emp_code,
                    "logout_time":            logout_time,
                    "employee_name":          emp_name,
                    "working_time":           work_time,
                    "shift":                  shift_name,
                    "shift_in":               shift_in,
                    "shift_out":              shift_out,
                    "b_id":                   emp_b_id,
                    "status":                 '0',
                    "total_hours":            '',
                    "less_hrs":               '',
                    "late_hrs":               '',
                    "ot_hrs":                 '',
                    "hot_hrs":                '',
                    "ot2_hrs":                '',
                    "extra_hrs":              '',
                    "processed_total_hour":   '',
                    "is_consecutive_weekly_off": False,
                    "processed_logout_time":  '',
                    "permitted_ot":           '',
                    "scheduled_ot":           '',
                }
                data = _calculate_ot_minutes_fast(data, login_time, logout_time, work_time, grace_master_data, is_ot_eligible, weekly_off_parsed, holiday_list)
                data = _calculation_fun_fast(data, holiday_list, grace_master_data, is_ot_eligible, weekly_off_parsed)
                data = _update_row_status_fast(data, date_str, weekly_off_parsed, holiday_list)

                if _is_no_pay_penalty(postgres_cursor, emp_code, current_date.date()):
                    data['status'] = str(Status.NoPayPenalty.value)

                attendance_data = data

                if existing_att:
                    update_attendance_details(attendance_data, postgres_cursor)
                else:
                    insert_attendance_details(attendance_data, postgres_cursor)

            else:
                # No biometric punch â€” determine status from leave / auto-punch / absent
                punch_in_date = current_date.date()
                login_time  = '0000'
                logout_time = '0000'
                total_worked_hrs = '0'

                shift_name = '0'
                shift_in   = '00:00'
                shift_out  = '00:00'
                if shift_details:
                    shift_name, shift_in, shift_out = shift_details

                work_time = grace_master_data['weekly_off_work_mins'] if (
                    check_if_weekly_off(punch_in_date, weekly_off_parsed) or
                    check_only_holiday(punch_in_date, holiday_list)
                ) else grace_master_data['min_work_mins']

                leave_entry       = _get_leave_entry_from_cache(leave_entry_cache, emp_code, punch_in_date)
                leave_application = _get_leave_application_from_cache(leave_app_cache, emp_code, punch_in_date)

                # If an approved reversal covers this date, treat as normal working day
                if _get_leave_reversal_from_cache(leave_reversal_cache, emp_code, punch_in_date):
                    leave_entry       = None
                    leave_application = None

                is_weekly_off = check_if_weekly_off(punch_in_date, weekly_off_parsed)
                is_holiday    = check_only_holiday(punch_in_date, holiday_list)
                existing_status = existing_att[2] if existing_att and len(existing_att) > 2 else None
                existing_hours  = int(existing_att[3] or 0) if existing_att and len(existing_att) > 3 else 0

                # â”€â”€ Priority 1: LOP (allow_beyond leave application or entry) â”€â”€â”€â”€â”€â”€â”€â”€â”€
                # For allow_beyond leaves: the last lop_days_from_extension days of the
                # leave are LOP ('22'). Compute the split date and check if today falls
                # in the LOP portion. This takes priority over Annual Leave and auto_punch.
                # Also covers allow_beyond extension LOP days via lop_date_set.
                _is_lop_day = False
                # Check direct allow_beyond leave application: last lop_days_from_extension
                # days of the leave are LOP. leave_app_cache row:
                # (start[0], end[1], type_of_days[2], leave_type[3], resume[4], allow_beyond[5], lop_days[6])
                for row in leave_app_cache.get(emp_code, []):
                    if row[0] <= punch_in_date <= row[1] and bool(row[5]):
                        lop_days_count = float(row[6] or 0)
                        if lop_days_count > 0:
                            from datetime import timedelta as _td2
                            # LOP = last lop_days_count days of the leave period
                            lop_start_dt = row[1] - _td2(days=int(lop_days_count) - 1)
                            if punch_in_date >= lop_start_dt:
                                _is_lop_day = True
                        break

                # Check direct allow_beyond leave entry (unpaid): last lop_days_from_extension
                # days of the leave are LOP. leave_entry_cache row:
                # (from_date[0], to_date[1], status_code[2], travel_or_leave[3], type_of_days[4],
                #  status_name[5], extended_to_date[6], allow_beyond_eligible[7],
                #  lop_days_from_extension[8], is_paid_beyond[9])
                if not _is_lop_day:
                    for row in leave_entry_cache.get(emp_code, []):
                        if len(row) > 9 and row[0] <= punch_in_date <= row[1]:
                            le_allow_beyond = bool(row[7]) if len(row) > 7 else False
                            le_is_paid_beyond = bool(row[9]) if len(row) > 9 else False
                            le_lop_days = float(row[8] or 0) if len(row) > 8 else 0
                            if le_allow_beyond and not le_is_paid_beyond and le_lop_days > 0:
                                from datetime import timedelta as _td2
                                lop_start_dt = row[1] - _td2(days=int(le_lop_days) - 1)
                                if punch_in_date >= lop_start_dt:
                                    _is_lop_day = True
                            break

                # Extension LOP days (from lop_date_set built from extension_lop_attendance_ids)
                # This covers LeaveExtension allow_beyond and LeaveEntry allow_beyond (Source 3)
                if not _is_lop_day and (emp_code, date_str) in lop_date_set:
                    _is_lop_day = True

                if _is_lop_day:
                    status = '22'
                    login_time = logout_time = '0000'
                    total_worked_hrs = '0'
                    shift_in = shift_out = '00:00'
                    # Keep work_time (Base Hrs) as scheduled shift hours â€” do NOT zero it

                # â”€â”€ Priority 2: Overstay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                # Leave ended, employee hasn't resumed. Overrides WO / Holiday / auto_punch.
                # Overstay: leave ended and employee hasn't resumed (resume_duty_on not reached).
                # lop_on_overstay flag in the leave policy governs whether to mark overstay
                # for both bio-punch and auto-punch employees.
                elif not leave_entry and not leave_application:
                    is_overstay, os_leave_type = get_active_overstay(
                        emp_code, punch_in_date, leave_entry_cache, leave_app_cache, pending_overstay_cache,
                        resume_punch_cache=resume_punch_cache,
                    )
                    if is_overstay:
                        lop_allowed = get_lop_on_overstay(emp_code, '1', os_leave_type)
                        # Respect leave policy lop_on_overstay flag for all employees.
                        if lop_allowed:
                            status = OVER_STAY_STATUS
                            login_time = logout_time = '0000'
                            total_worked_hrs = '0'
                            shift_in = shift_out = '00:00'
                            # Keep work_time (Base Hrs) as scheduled shift hours â€” do NOT zero it
                        else:
                            # lop_on_overstay=False in policy â€” fall through to normal flow
                            is_overstay = False

                    if not is_overstay:
                        # No overstay â€” normal flow for days after leave with no active leave
                        if is_weekly_off:
                            if existing_status == str(Status.WeeklyOffOvertime.value) or existing_hours > 0:
                                status = existing_status or str(Status.WeeklyOffOvertime.value)
                            else:
                                lop_status = Status.WeeklyOff.value
                                if grace_master_data.get('lop_on_absent'):
                                    lop_status = _get_lop_status_if_preceding_absent(
                                        postgres_cursor, emp_code, punch_in_date, weekly_off_parsed, holiday_list
                                    )
                                if lop_status == str(Status.LOP.value):
                                    status = str(Status.LOP.value)
                                else:
                                    preceding_leave_type = _get_preceding_workday_leave_type(
                                        leave_entry_cache, leave_app_cache, emp_code, current_date, weekly_off_parsed, holiday_list
                                    )
                                    if preceding_leave_type and _should_lop_weekly_off(
                                        emp_type, emp_group, emp_reporting, 1, preceding_leave_type
                                    ):
                                        status = str(Status.LOP.value)
                                    else:
                                        status = str(Status.WeeklyOff.value)
                        elif is_holiday:
                            status = str(Status.Holiday.value)
                        elif auto_punch:
                            login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
                            status = str(Status.OnTime.value)
                        elif is_today(punch_in_date):
                            status = str(Status.YetToPunchToday.value)
                        else:
                            status = str(Status.Absent.value)
                            if grace_master_data.get('lop_on_absent'):
                                _apply_lop_on_absent(
                                    postgres_cursor, emp_code, emp_name,
                                    punch_in_date, weekly_off_parsed, holiday_list
                                )

                # â”€â”€ Priority 3â€“8: Active leave covers this day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                else:
                    # Resolve type_of_days for leave entry and leave application
                    leave_entry_calendar = None
                    leave_entry_working  = None
                    if leave_entry:
                        if leave_entry[2] == 'Calendar_days':
                            leave_entry_calendar = leave_entry
                        else:
                            leave_entry_working = leave_entry

                    leave_app_calendar = None
                    leave_app_working  = None
                    if leave_application:
                        if leave_application[1] == 'Calendar_days':
                            leave_app_calendar = leave_application
                        else:
                            leave_app_working = leave_application

                    # Priority 3: Leave entry Calendar_days (overrides WO/Holiday)
                    if leave_entry_calendar:
                        leave_type = leave_entry_calendar[1]
                        leave_code = leave_entry_calendar[0]
                        if leave_type == 'Leave':
                            login_time = logout_time = '0000'
                            total_worked_hrs = '0'
                            shift_in = shift_out = '00:00'
                            # Keep work_time (Base Hrs) as scheduled shift hours â€” do NOT zero it
                        else:
                            login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
                        status = leave_code

                    # Priority 4: Leave application Calendar_days (overrides WO/Holiday)
                    elif leave_app_calendar:
                        login_time = logout_time = '0000'
                        total_worked_hrs = '0'
                        shift_in = shift_out = '00:00'
                        # Keep work_time (Base Hrs) as scheduled shift hours â€” do NOT zero it
                        status = annual_leave_code

                    # Priority 5: Weekly Off
                    elif is_weekly_off:
                        if existing_status == str(Status.WeeklyOffOvertime.value) or existing_hours > 0:
                            status = existing_status or str(Status.WeeklyOffOvertime.value)
                        else:
                            lop_status = Status.WeeklyOff.value
                            if grace_master_data.get('lop_on_absent'):
                                lop_status = _get_lop_status_if_preceding_absent(
                                    postgres_cursor, emp_code, punch_in_date, weekly_off_parsed, holiday_list
                                )
                            if lop_status == str(Status.LOP.value):
                                status = str(Status.LOP.value)
                            else:
                                preceding_leave_type = _get_preceding_workday_leave_type(
                                    leave_entry_cache, leave_app_cache, emp_code, current_date, weekly_off_parsed, holiday_list
                                )
                                if preceding_leave_type and _should_lop_weekly_off(
                                    emp_type, emp_group, emp_reporting, 1, preceding_leave_type
                                ):
                                    status = str(Status.LOP.value)
                                else:
                                    status = str(Status.WeeklyOff.value)

                    # Priority 6: Holiday
                    elif is_holiday:
                        status = str(Status.Holiday.value)

                    # Priority 7: Leave entry Working_days
                    elif leave_entry_working:
                        leave_type = leave_entry_working[1]
                        leave_code = leave_entry_working[0]
                        if leave_type == 'Leave':
                            login_time = logout_time = '0000'
                            total_worked_hrs = '0'
                            shift_in = shift_out = '00:00'
                            # Keep work_time (Base Hrs) as the scheduled shift hours â€” do NOT zero it
                        else:
                            login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
                        status = leave_code

                    # Priority 8: Leave application Working_days
                    elif leave_app_working:
                        login_time = logout_time = '0000'
                        total_worked_hrs = '0'
                        shift_in = shift_out = '00:00'
                        # Keep work_time (Base Hrs) as the scheduled shift hours â€” do NOT zero it
                        status = annual_leave_code

                    # Priority 9: Auto punch (within leave period â€” shouldn't normally reach here)
                    elif auto_punch:
                        login_time, logout_time, total_worked_hrs = get_standard_punch_times(grace_master_data)
                        status = str(Status.OnTime.value)

                    # Priority 10: Yet to punch today
                    elif is_today(punch_in_date):
                        status = str(Status.YetToPunchToday.value)

                    # Priority 11: Absent
                    else:
                        status = str(Status.Absent.value)
                        if grace_master_data.get('lop_on_absent'):
                            _apply_lop_on_absent(
                                postgres_cursor, emp_code, emp_name,
                                punch_in_date, weekly_off_parsed, holiday_list
                            )

                att_data = {
                    "date":                   date_str,
                    "login_time":             login_time,
                    "employee_code":          emp_code,
                    "logout_time":            logout_time,
                    "employee_name":          emp_name,
                    "working_time":           work_time,
                    "shift":                  shift_name,
                    "shift_in":               shift_in,
                    "shift_out":              shift_out,
                    "b_id":                   emp_b_id,
                    "status":                 status,
                    "total_hours":            total_worked_hrs,
                    "less_hrs":               '0',
                    "late_hrs":               '0',
                    "ot_hrs":                 '0',
                    "hot_hrs":                '0',
                    "ot2_hrs":                '0',
                    "extra_hrs":              '0',
                    "processed_total_hour":   total_worked_hrs,
                    "is_consecutive_weekly_off": False,
                    "processed_logout_time":  logout_time,
                    "permitted_ot":           '0',
                    "scheduled_ot":           '0',
                }

                if int(att_data['total_hours']) > 0:
                    att_data = _calculate_ot_minutes_fast(att_data, login_time, logout_time, work_time, grace_master_data, is_ot_eligible, weekly_off_parsed, holiday_list)
                    att_data = _calculation_fun_fast(att_data, holiday_list, grace_master_data, is_ot_eligible, weekly_off_parsed)
                    # If this day was previously Absent and now has hours, revert subsequent WOâ†’LOP back to WO
                    if grace_master_data.get('lop_on_absent') and existing_att and str(existing_att[2]) == str(Status.Absent.value):
                        _revert_lop_on_absent(postgres_cursor, emp_code, punch_in_date, weekly_off_parsed, holiday_list)

                # Override status to NoPayPenalty if an approved penalty covers this date
                # (keeps actual punch times/hours intact â€” only pay is affected)
                if _is_no_pay_penalty(postgres_cursor, emp_code, punch_in_date):
                    att_data['status'] = str(Status.NoPayPenalty.value)

                attendance_data = att_data

                if existing_att:
                    update_attendance_details(attendance_data, postgres_cursor)
                else:
                    insert_attendance_details(attendance_data, postgres_cursor)

    postgres_conn.commit()
    postgres_cursor.close()
    postgres_conn.close()
    t_enter_connection.close()
    print("Done.")


def process_worker_attendance(postgres_cursor, attendance_details, employee, date_str, formatted_date,
                              t_enter_connection, grace_master_data, is_ot_eligible, weekly_off):
    """Process worker attendance with night shift handling"""
    punch_types = {'check_in': 'PSS7244900271', 'check_out': 'PSS7244900271'}
    NIGHT_SHIFT_MAX_TIME = 120000

    checkouts_to_process = []
    while (attendance_details and
          
           int(attendance_details[0][1]) < NIGHT_SHIFT_MAX_TIME):
        checkouts_to_process.append(attendance_details.pop(0))

    if checkouts_to_process:
        last_checkout = checkouts_to_process[-1]

        current_date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        previous_date_obj = current_date_obj - timedelta(days=1)
        previous_date = previous_date_obj.strftime("%Y-%m-%d")
        previous_formatted_date = previous_date_obj.strftime('%Y-%m-%d')
        previous_records = get_t_enter_attendance_details(t_enter_connection, previous_date, employee[3]) or []

        checkout_record = list(last_checkout)
        checkout_record[0] = previous_date

        if not any(
                r[1] == checkout_record[1] and r[3] == punch_types['check_out']
                for r in previous_records
        ):
            previous_records.append(checkout_record)
            # print("previous records",previous_records)

            prev_attendance = process_worker_records(
                postgres_cursor, previous_records, employee, previous_formatted_date,
                grace_master_data, is_ot_eligible, weekly_off, punch_types
            )

            if prev_attendance is not None:
                update_consecutive_weekly_off_sql(postgres_cursor, prev_attendance)
    # print("attendance_details....1280",attendance_details)
    return process_worker_records(
        postgres_cursor, attendance_details, employee, formatted_date,
        grace_master_data, is_ot_eligible, weekly_off, punch_types
    )


def process_worker_records(postgres_cursor, records, employee, date,
                           grace_master_data, is_ot_eligible, weekly_off, punch_types):
    """Process worker records for a single day"""
    login_time = '0000'
    logout_time = '0000'
    # print("Recordss..",records)
    # for record in records:
        
    #     if record[0] == record[0] and record[2] == record[2]:
    #         print("trueee.",record)
    #         login_time = records[0][1].strip().zfill(6)[:4]
    #         logout_time = records[-1][1].strip().zfill(6)[:4]
    # print("Record",records)
    #     terminal_id = record[4]
    #     print("terminal id",terminal_id)

    #     print("punch tpyes",punch_types)
    #     print("log ntime line 1300..",login_time,logout_time)
    #     time_str = record[1].strip().zfill(6)[:4]
    #     print("time str",time_str,record[3] == punch_types['check_in'])
    #     print("Record....",record[3])
    #     terminal_id = record[4]
    #     time_str = record[1].strip().zfill(6)[:4]
    if records:
        
        # print("a",records[0][1].strip().zfill(6)[:4],records[-1][1].strip().zfill(6)[:4])
        login_time = records[0][1].strip().zfill(6)[:4]
        logout_time = records[-1][1].strip().zfill(6)[:4]


        # if record[3] == punch_types['check_in']:
        #     login_time = time_str
        # else:
        #     logout_time = time_str


    existing_data = get_existing_attendance_data(postgres_cursor, employee[2], date)
    # print("exisitn data 1352",existing_data)

    attendance_data = operate_on_attendance_data_workers(
        date,
        login_time,
        logout_time,
        postgres_cursor,
        employee,
        grace_master_data=grace_master_data,
        is_ot_eligible=is_ot_eligible,
        weekly_off=weekly_off
    )
  
    if existing_data:
        update_attendance_details(attendance_data, postgres_cursor)
    else:
        insert_attendance_details(attendance_data, postgres_cursor)
    # print("attendacne data",attendance_data)

    return attendance_data



def operate_on_attendance_data_workers( formatted_date, login_time,logout_time, postgres_cursor,employee_data,**kwargs):
    grace_master_data = kwargs.get('grace_master_data')
    is_ot_eligible = kwargs.get('is_ot_eligible')
    weekly_off = kwargs.get('weekly_off')
    # print("log ntime line 13180..",login_time,logout_time)
    shift_name='0'
    shift_in='00:00'
    shift_out='00:00'
    shift_details = get_shift_details(postgres_cursor, 1, employee_data[1])

    if shift_details:
        shift_name = shift_details[0]
        shift_in = shift_details[1]
        shift_out = shift_details[2]

    work_time=get_work_time(formatted_date, grace_master_data,postgres_cursor,weekly_off)

    data = {
        "date": formatted_date,
        "login_time": login_time,
        "employee_code": employee_data[2],
        "logout_time":  logout_time,
        'employee_name': employee_data[0],
        "working_time": work_time,
        "shift": shift_name,
        "shift_in": shift_in,
        "shift_out": shift_out,
        "status": '0',
        "total_hours": '',
        "less_hrs": '',
        "late_hrs": '',
        "ot_hrs": '',
        'hot_hrs': '',
        'ot2_hrs': '',
        'extra_hrs': '',
        'processed_total_hour': '',
        'is_consecutive_weekly_off': False,
        'processed_logout_time': '',
        "permitted_ot": '',
        "scheduled_ot": '',
    }
    data=calculate_ot_minutes(data,login_time,logout_time,data['working_time'],grace_master_data,is_ot_eligible,weekly_off=weekly_off,postgres_cursor=postgres_cursor)
    data=calculation_fun(data,postgres_cursor,grace_master_data,is_ot_eligible,weekly_off)
    data = update_row_status(data,data['date'],postgres_cursor,weekly_off)
    # print("data..",data)
    return data



def get_postgres_connection():
    """Get a connection to the default PostgreSQL database."""
    conn = psycopg2.connect(
        dbname=env("DB_NAME"),
        user=env("DB_USERNAME"),
        password=env("DB_PASSWORD"),
        host=env("DB_SERVER"),
        port=env("DB_PORT"),
    )
    return conn, conn.cursor()


def get_t_enter_connection():
    """Get a connection to the t_enter PostgreSQL database."""
    conn = psycopg2.connect(
        dbname=env("DB_BIO_NAME"),
        user=env("DB_BIO_USERNAME"),
        password=env("DB_BIO_PASSWORD"),
        host=env("DB_BIO_SERVER"),
        port=env("DB_BIO_PORT"),
    )

    return conn



def _fetch_new_punches(t_enter_conn, since_upload_time):
    """
    Fetch iclock_transaction rows uploaded after since_upload_time.
    Uses upload_time (when row hit DB) not punch_time â€” correctly handles
    offline devices that reconnect and bulk-upload old punch_time dates.
    Returns list of (emp_code, punch_date_str, punch_time_str, upload_time).
    """
    cursor = t_enter_conn.cursor()
    cursor.execute("""
        SELECT
            emp_code,
            TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'YYYY-MM-DD') AS punch_date,
            TO_CHAR(punch_time AT TIME ZONE 'Asia/Dubai', 'HH24MISS')   AS punch_time_str,
            upload_time
        FROM public.iclock_transaction
        WHERE upload_time > %s
          AND is_attendance = 1
        ORDER BY emp_code, punch_date, punch_time_str
    """, (since_upload_time,))
    return cursor.fetchall()


def transfer_attendance_incremental(since_upload_time=None):
    """
    Incremental sync â€” called by the daemon immediately after a NOTIFY.
    Processes only (emp_code, date) pairs uploaded after since_upload_time.
    Returns max upload_time of processed punches so the daemon can advance
    the watermark file.

    since_upload_time: datetime â€” reads only rows after this timestamp.
                       If None, defaults to 1 hour ago (safe fallback).
    """
    from datetime import timezone
    if since_upload_time is None:
        since_upload_time = datetime.now(timezone.utc) - timedelta(hours=1)

    t_enter_connection = get_t_enter_connection()
    postgres_conn, postgres_cursor = get_postgres_connection()

    try:
        # â”€â”€ 1. Fetch punches after watermark (by upload_time) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        new_punches = _fetch_new_punches(t_enter_connection, since_upload_time)
        if not new_punches:
            logger.info("No new punches since last sync. Nothing to do.")
            return None

        max_upload_time = max(row[3] for row in new_punches)
        logger.info(f"Found {len(new_punches)} new punch rows. Max upload_time: {max_upload_time}")

        # â”€â”€ 2. Find unique (emp_code, date) pairs affected â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        affected_pairs = set()
        for emp_code, punch_date, _, _ in new_punches:
            affected_pairs.add((emp_code, punch_date))

        affected_dates = sorted({date for _, date in affected_pairs})
        affected_emp_cards = sorted({emp for emp, _ in affected_pairs})

        logger.info(f"Affected: {len(affected_emp_cards)} employees Ã— {len(affected_dates)} dates")

        # â”€â”€ 3. Load only the affected employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        all_employees = get_employees(postgres_cursor)
        # emp_card is index 3; filter to only affected cards
        employees = [e for e in all_employees if e[3] in set(affected_emp_cards)]
        if not employees:
            logger.info("No matching HRM employees for the new punches.")
            return max_upload_time

        emp_codes = [e[2] for e in employees]
        emp_cards = [e[3] for e in employees]

        # â”€â”€ 4. Pre-load all bulk data for affected scope only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        start_date = affected_dates[0]
        end_date   = affected_dates[-1]

        holiday_list      = get_holiday_master(postgres_cursor)
        annual_leave_code = get_annual_leave_code(postgres_cursor)

        shift_ids   = list({e[1] for e in employees if e[1] is not None})
        shift_cache = _bulk_fetch_shifts(postgres_cursor, shift_ids)

        bio_punch_map        = _bulk_fetch_bio_punches(t_enter_connection, affected_dates, emp_cards)
        existing_att_map     = _bulk_fetch_existing_attendance(postgres_cursor, affected_dates, emp_codes)
        leave_entry_cache    = _bulk_fetch_leave_entries(postgres_cursor, start_date, end_date, emp_codes)
        leave_app_cache      = _bulk_fetch_leave_applications(postgres_cursor, start_date, end_date, emp_codes)
        leave_reversal_cache = _bulk_fetch_leave_reversals(postgres_cursor, start_date, end_date, emp_codes)

        grace_cache = {}

        # â”€â”€ 5. Process only affected (emp, date) pairs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        for employee in employees:
            emp_name       = employee[0]
            shift_id       = employee[1]
            emp_code       = employee[2]
            emp_card       = employee[3]
            emp_type       = employee[4]
            emp_group      = employee[5]
            emp_reporting  = employee[6]
            auto_punch     = employee[7]
            is_ot_eligible = employee[8]
            weekly_off     = employee[9]
            shift_details_id = employee[10]

            shift_details     = shift_cache.get(shift_id)
            weekly_off_parsed = parse_weekly_off(weekly_off)

            # Only iterate dates where this employee had a new punch
            emp_dates = [date for (ec, date) in affected_pairs if ec == emp_card]

            for date_str in emp_dates:
                current_date = datetime.strptime(date_str, "%Y-%m-%d")

                grace_master_data = _get_grace_details_from_cache(
                    grace_cache, postgres_cursor, current_date,
                    emp_type, emp_group, emp_reporting, shift_details_id
                )

                attendance_details = list(bio_punch_map.get((emp_card, date_str), []))
                existing_att       = existing_att_map.get((str(emp_code), date_str))

                attendance_data = None

                if attendance_details:
                    if len(attendance_details) > 1:
                        login_time  = remove_seconds_from_time(attendance_details[0][1])
                        logout_time = remove_seconds_from_time(attendance_details[-1][1])
                    else:
                        if existing_att:
                            login_time  = existing_att[0]
                            logout_time = attendance_details[0][1][:4] if existing_att[0] != attendance_details[0][1][:4] else '0000'
                        else:
                            login_time  = attendance_details[0][1][:4]
                            logout_time = '0000'

                    shift_name = 'Dynamic Shift'
                    shift_in   = '00:00'
                    shift_out  = '00:00'
                    if shift_details:
                        shift_name = shift_details[0]
                        shift_in   = shift_details[1]
                        shift_out  = shift_details[2]

                    work_time = grace_master_data['weekly_off_work_mins'] if (
                        check_if_weekly_off(current_date.date(), weekly_off_parsed) or
                        check_only_holiday(current_date.date(), holiday_list)
                    ) else grace_master_data['min_work_mins']

                    att_data = {
                        "date":                  date_str,
                        "login_time":            login_time,
                        "employee_code":         emp_code,
                        "logout_time":           logout_time,
                        "employee_name":         emp_name,
                        "working_time":          work_time,
                        "shift":                 shift_name,
                        "shift_in":              shift_in,
                        "shift_out":             shift_out,
                        "status":                '0',
                        "total_hours":           '',
                        "less_hrs":              '',
                        "late_hrs":              '',
                        "ot_hrs":                '',
                        "hot_hrs":               '',
                        "ot2_hrs":               '',
                        "extra_hrs":             '',
                        "processed_total_hour":  '',
                        "is_consecutive_weekly_off": False,
                        "processed_logout_time": '',
                        "permitted_ot":          '',
                        "scheduled_ot":          '',
                    }
                    att_data = _calculate_ot_minutes_fast(att_data, login_time, logout_time, work_time, grace_master_data, is_ot_eligible, weekly_off_parsed, holiday_list)
                    att_data = _calculation_fun_fast(att_data, holiday_list, grace_master_data, is_ot_eligible, weekly_off_parsed)
                    att_data = _update_row_status_fast(att_data, date_str, weekly_off_parsed, holiday_list)
                    attendance_data = att_data

                else:
                    # No bio punch â€” only update if record already exists (don't create absent rows for partial reprocessing)
                    if existing_att:
                        punch_in_date = current_date.date()
                        login_time  = existing_att[0] or '0000'
                        logout_time = existing_att[1] or '0000'
                        work_time = grace_master_data['weekly_off_work_mins'] if (
                            check_if_weekly_off(punch_in_date, weekly_off_parsed) or
                            check_only_holiday(punch_in_date, holiday_list)
                        ) else grace_master_data['min_work_mins']

                        leave_entry       = _get_leave_entry_from_cache(leave_entry_cache, emp_code, punch_in_date)
                        leave_application = _get_leave_application_from_cache(leave_app_cache, emp_code, punch_in_date)

                        # If an approved reversal covers this date, treat as normal working day
                        if _get_leave_reversal_from_cache(leave_reversal_cache, emp_code, punch_in_date):
                            leave_entry       = None
                            leave_application = None

                        is_weekly_off = check_if_weekly_off(punch_in_date, weekly_off_parsed)
                        is_holiday    = check_only_holiday(punch_in_date, holiday_list)

                        leave_entry_calendar = None
                        leave_entry_working  = None
                        if leave_entry:
                            if leave_entry[2] == 'Calendar_days':
                                leave_entry_calendar = leave_entry
                            else:
                                leave_entry_working = leave_entry

                        # leave_application[1] is type_of_days fetched from leave policy
                        leave_app_calendar = None
                        leave_app_working  = None
                        if leave_application:
                            if leave_application[1] == 'Calendar_days':
                                leave_app_calendar = leave_application
                            else:
                                leave_app_working = leave_application

                        if leave_entry_calendar:
                            status = leave_entry_calendar[0]
                        elif leave_app_calendar:
                            status = annual_leave_code
                        elif is_weekly_off:
                            status = Status.WeeklyOff.value
                        elif is_holiday:
                            status = Status.Holiday.value
                        elif leave_entry_working:
                            status = leave_entry_working[0]
                        elif leave_app_working:
                            status = annual_leave_code
                        else:
                            status = existing_att[2] if len(existing_att) > 2 else Status.Absent.value

                        shift_name = shift_in = shift_out = '00:00'
                        if shift_details:
                            shift_name, shift_in, shift_out = shift_details

                        attendance_data = {
                            "date":                  date_str,
                            "login_time":            login_time,
                            "employee_code":         emp_code,
                            "logout_time":           logout_time,
                            "employee_name":         emp_name,
                            "working_time":          work_time,
                            "shift":                 shift_name,
                            "shift_in":              shift_in,
                            "shift_out":             shift_out,
                            "status":                status,
                            "total_hours":           '0',
                            "less_hrs":              '0',
                            "late_hrs":              '0',
                            "ot_hrs":                '0',
                            "hot_hrs":               '0',
                            "ot2_hrs":               '0',
                            "extra_hrs":             '0',
                            "processed_total_hour":  '0',
                            "is_consecutive_weekly_off": False,
                            "processed_logout_time": logout_time,
                            "permitted_ot":          '0',
                            "scheduled_ot":          '0',
                        }

                if attendance_data is not None:
                    if _is_no_pay_penalty(postgres_cursor, emp_code, punch_in_date):
                        attendance_data['status'] = str(Status.NoPayPenalty.value)
                    if existing_att:
                        update_attendance_details(attendance_data, postgres_cursor)
                    else:
                        insert_attendance_details(attendance_data, postgres_cursor)

        # â”€â”€ 6. Commit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        postgres_conn.commit()
        logger.info("Incremental sync complete.")
        return max_upload_time

    except Exception as e:
        postgres_conn.rollback()
        logger.exception(f"Incremental sync failed: {e}")
        raise
    finally:
        postgres_cursor.close()
        postgres_conn.close()
        t_enter_connection.close()


if __name__ == "__main__":
        try:
            logger.info("Starting transfer_attendance_details task.")
            transfer_attendance_details()  # Call your task function
            logger.info("Finished transfer_attendance_details task successfully.")
        except Exception as e:
            logger.exception("Error occurred during transfer_attendance_details:",e)

