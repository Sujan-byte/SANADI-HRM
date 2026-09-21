import os
import uuid
from datetime import timedelta
from datetime import datetime, time
from .utils.transfer_device_attendance_sql_helper import SQLHelper
from .utils.attendance_status_enum import Status
import json
import psycopg2
import logging.handlers
import environ
env = environ.Env()


log_dir = "sfic_logs"
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
    print("master grace details",master_grace_details)

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
        'total_work_hours': (master_grace_details[12] if master_grace_details else 720) # in mins
    }
    # print("grace details",grace_details)
    return grace_details


def get_grace_details_by_master(postgres_cursor, punch_in_date, emp_group, emp_reporting, emp_type, emp_shift=None):
    print("emplyee shift",emp_shift)
    # Query for Special type — shift match gives highest priority, NULL shift matches all
    query_special = """
        SELECT
            type, break_time, description, emp_group, emp_reporting, emp_type, from_date,
            max_day_ot_mins, max_day_ot_mins, max_work_mins, min_work_mins, to_date,
            total_work_hours, weekly_off_work_mins, wo_max_day_ot_mins, wo_max_night_ot_mins, wo_break_time
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
        # Query for Normal type — same shift-aware logic, no date range filter
        query_normal = """
            SELECT
                type, break_time, description, emp_group, emp_reporting, emp_type, from_date,
                max_day_ot_mins, max_day_ot_mins, max_work_mins, min_work_mins, to_date,
                total_work_hours, weekly_off_work_mins, wo_max_day_ot_mins, wo_max_night_ot_mins, wo_break_time
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


def check_only_holiday(punch_in_date,postgres_cursor) -> bool:
    holiday_list = get_holiday_master(postgres_cursor)
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


def check_if_weekly_off(punch_in_date, weekly_off):
    # print("weekly off",weekly_off)
    try:
        weekly_off_days = json.loads(weekly_off)
        # print("weekly_of_days",weekly_off_days)
        if not weekly_off_days:
            return punch_in_date.weekday() == 6
        punch_in_weekday = punch_in_date.weekday()
        for day_name in weekly_off_days:
            if punch_in_weekday == day_name_to_weekday(day_name):
                # print("comes its weekly off",day_name,punch_in_date)
                return True
        return False
    except:
        print("Invalid weekly_off format. Expected a JSON-like array string.")
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
            print("fixed ot hrs1",processed_logout_time,wrk_time,total_hrs,workable_hrs)
        elif total_hrs < wrk_time:
            processed_total_hour = total_hrs
            processed_logout_time = logout_time
            print("fixed ot hrs2", processed_logout_time)
        else:
            processed_total_hour = total_hrs
            processed_logout_time = logout_time
            print("fixed ot hrs3", processed_logout_time)
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

def get_employees(postgres_cursor):
    postgres_cursor.execute(
        """
        SELECT first_name,default_shift_id,employee_code,employee_code as employee_card_number,employee_type,employee_group,reporting,auto_punch,is_ot_eligible,weekly_off,shift_details_id FROM public.master_employeemaster
        WHERE b_id = %s and is_active = %s
        """,
        (str(1),True),
    )
    # print()
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
            str(1)
        ),
    )


def insert_attendance_details(data, postgres_cursor):
    guid = get_guid()
    postgres_cursor.execute(
        """
        INSERT INTO public.hrm_attendancedetails (
             "b_id", guid, created, modified,
             user_created, user_modified, is_active,
             date, login_time, logout_time, working_time, status, ot_hrs, shift, shift_in, shift_out,
             total_hours, less_hrs, late_hrs, permitted_ot, scheduled_ot,employee_name,employee_code,hot_hrs,ot2_hrs,extra_hrs,processed_total_hour,is_consecutive_weekly_off,processed_logout_time,approval_status
        )
        VALUES (
             %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
             'Data Integration', 'Data Integration', TRUE,
             %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """,
        (
            "1",
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
    # print("leave application", leave_entry, leave_application)

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

# begin from here
def transfer_attendance_details(**kwargs):
    """Transfers attendance details within a date range (defaults to today)."""

    t_enter_connection = get_t_enter_connection()
    postgres_conn, postgres_cursor = get_postgres_connection()

    employees = get_employees(postgres_cursor)
    # print("employees...",employees)
    # dag_run = kwargs.get("dag_run")  # Ensure dag_run exists
    # conf = dag_run.conf if dag_run else {}  # Get conf safely
    today = datetime.today().strftime("%Y-%m-%d")
    # conf = {"start_date": "2025-01-26", "end_date": "2025-01-26"}
    start_date = kwargs.get("start_date", (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d"))
    end_date = kwargs.get("end_date", today)
    # print("start date and end date",start_date,end_date)
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
    # print(f"Processing attendance from {start_date} to {end_date}")
    # print("employees",employees)
    for employee in employees:
        # print("employee",employee[4],employee)
        current_date = start_date_obj
        # print("current data",current_date)
        # print("start date",start_date_obj,current_date <= end_date_obj)
        # print("end date",end_date_obj)
        # print("employee[0]",employee[0],employee[1],employee[2],employee[3],employee[4],employee[5],employee[6])
        while current_date <= end_date_obj:
            date_str = current_date.strftime('%Y-%m-%d')
            formatted_date = current_date.strftime('%Y-%m-%d')
            # existing_record = get_existing_attendance_data(postgres_cursor, employee[2], date_str)
            # if existing_record:
            #     existing_login = existing_record[0]
            #     existing_logout = existing_record[1]
                
            #     # Check if record has valid data
            #     if has_valid_attendance_data(existing_login, existing_logout):
            #         # print(f"✅ SKIPPING: Employee {employee[2]} on {date_str} has valid data ({existing_login}, {existing_logout})")
            #         current_date += timedelta(days=1)
            #         continue
            #     else:
            #         print(f"📝 OVERWRITING: Employee {employee[2]} on {date_str} has invalid data ({existing_login}, {existing_logout})")

            grace_master_data=get_grace_details(postgres_cursor,current_date,employee[4],employee[5],employee[6],employee[10])
            # print("grace master data..1180",grace_master_data)

            attendance_details = get_t_enter_attendance_details(t_enter_connection, date_str, employee[3] )
            # print("Attendance details",attendance_details)

            attendance_data=None
            if attendance_details:
                # check any terminal id exists 1 in attendance details then forllow staff loigic
                # if employee[4] == 'Staff'  or any(data[3] == 1 for data in attendance_details):
                for data in attendance_details:
                    attendance_data = modify_t_enter_data(postgres_cursor, data, employee,grace_master_data=grace_master_data,is_ot_eligible=employee[8],weekly_off=employee[9],attendance_details=attendance_details)
                # else:
                #     attendance_data = process_worker_attendance(
                #         postgres_cursor,
                #         attendance_details,
                #         employee,
                #         date_str,
                #         formatted_date,
                #         t_enter_connection,
                #         grace_master_data,
                #         employee[8],  # is_ot_eligible
                #         employee[9]  # weekly_off
                #     )
            else:
                attendance_data = update_attendance_data_if_not_exist(date_str, employee, postgres_cursor, grace_master_data=grace_master_data,auto_punch=employee[7],is_ot_eligible=employee[8],weekly_off=employee[9])
            # print("Attenacnat _data",attendance_data)
            if attendance_data is not None:
                update_consecutive_weekly_off_sql(postgres_cursor, attendance_data)

            current_date += timedelta(days=1)

    postgres_conn.commit()
    postgres_cursor.close()
    postgres_conn.close()


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



if __name__ == "__main__":
        try:
            logger.info("Starting transfer_attendance_details task.")
            transfer_attendance_details()  # Call your task function
            logger.info("Finished transfer_attendance_details task successfully.")
        except Exception as e:
            logger.exception("Error occurred during transfer_attendance_details:",e)

