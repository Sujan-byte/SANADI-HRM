from hrm_master.models import ShiftTimings
from datetime import datetime, timedelta

class TimeSheetCal:

    @classmethod
    def time_calculation(cls, data):
        convertable_fields = ['login_time', 'logout_time']
        for field in convertable_fields:
            if field in data and data[field]:
                time_obj = datetime.strptime(data[field], "%H:%M")
                data[field] = time_obj.strftime("%H%M")
        return data

    @classmethod
    def update_processed_details(cls, data):
        logout_time = data['logout_time']
        total_hrs = int(data['total_hours'])
        extra_hrs = int(data['extra_hrs'])
        processed_total_hour = total_hrs - extra_hrs
        data['processed_total_hour'] = processed_total_hour
        logout_dt = datetime.strptime(str(logout_time).zfill(4), "%H%M")
        new_logout_dt = logout_dt - timedelta(minutes=extra_hrs)
        data['processed_logout_time'] = new_logout_dt.strftime("%H%M")
        return data

    @classmethod
    def update_consecutive_sunday(cls, meta, data, instance):
        date = data.get('date')
        status = data.get('status')
        employee_code = data.get('employee_code')

        if date.weekday() == 6:
            previous_sunday = date - timedelta(days=7)
            next_sunday = date + timedelta(days=7)
            if status == '11':
                previous_sunday_instance = meta.model.objects.filter(
                    date=previous_sunday,
                    employee_code=employee_code,
                    status='11',
                    is_consecutive_weekly_off=False
                ).first()

                if previous_sunday_instance:
                    instance.is_consecutive_weekly_off = True
                else:
                    instance.is_consecutive_weekly_off = False

                instance.save()

                if not instance.is_consecutive_weekly_off:
                    next_sunday_instance = meta.model.objects.filter(
                        date=next_sunday,
                        employee_code=employee_code,
                        status='11',
                        is_consecutive_weekly_off=False
                    ).first()

                    if next_sunday_instance:
                        next_sunday_instance.is_consecutive_weekly_off = True
                        next_sunday_instance.save()

                        next_sunday_data = {
                            'date': next_sunday_instance.date,
                            'status': next_sunday_instance.status,
                            'employee_code': next_sunday_instance.employee_code,
                        }
                        cls.update_consecutive_sunday(meta,next_sunday_data, next_sunday_instance)
            else:
                instance.is_consecutive_weekly_off = False
                instance.save()

                next_sunday_instance = meta.model.objects.filter(
                    date=next_sunday,
                    employee_code=employee_code,
                    status='11',
                    is_consecutive_weekly_off=True
                ).first()

                if next_sunday_instance:
                    next_sunday_instance.is_consecutive_weekly_off = False
                    next_sunday_instance.save()
                    next_sunday_data = {
                        'date': next_sunday_instance.date,
                        'status': next_sunday_instance.status,
                        'employee_code': next_sunday_instance.employee_code,
                    }
                    cls.update_consecutive_sunday(meta,next_sunday_data, next_sunday_instance)

        return data

    @classmethod
    def return_converted_data(cls, data):
        time_fields = ['login_time', 'logout_time', 'shift_in', 'shift_out']
        for field in time_fields:
            if data.get(field):
                try:
                    time_str = str(data[field]).zfill(4)
                    time_obj = datetime.strptime(time_str, "%H%M")
                    data[field] = time_obj.strftime('%H:%M')
                except Exception:
                    data[field] = "00:00"

        # For the hour fields
        hour_fields = ['total_hours', 'working_time', 'ot_hrs', 'ot2_hrs', 'hot_hrs', 'less_hrs', 'extra_hrs']
        for field in hour_fields:
            if data.get(field):
                try:
                    minutes = int(data[field]) // 60
                    seconds = int(data[field]) % 60
                    data[f'converted_{field}'] = f"{minutes:02}.{seconds:02}"
                except Exception:
                    data[f'converted_{field}'] = "00:00"

        return data

    @classmethod
    def get_processed_data(cls, data):
        record_total_hrs = int(data['total_hours'])

        if data['is_consecutive_weekly_off']:
            data['total_hours'] = '0'
            data['login_time'] = '0'
            data['logout_time'] = '0'
            data['ot_hrs'] = '0'
            data['ot2_hrs'] = '0'
            data['hot_hrs'] = '0'
            data['less_hrs'] = '0'
            data['extra_hrs'] = '0'
            data['status'] = '17'

        else:
            if record_total_hrs > 0:
                data['logout_time'] = data['processed_logout_time']
                data['total_hours'] = data['processed_total_hour']
                data['extra_hrs'] = '0'
        return data

    def get_shift_details(cls, data):
        shift_obj = ShiftTimings.objects.filter(shift_code=data['shift']).first()
        if shift_obj:
            data['shift_name'] = shift_obj.shift_name
        if data['shift'] == '1':
            data['shift_in'] = '0700'
            data['shift_out'] = '1900'
        elif data['shift'] == '2':
            data['shift_in'] = '1900'
            data['shift_out'] = '0700'
        elif data['shift'] == 'GEN-SFIC':
            data['shift_in'] = '0900'
            data['shift_out'] = '1800'
        else:
            login_time = int(data['login_time']) if data['login_time'] != '0' else 0
            logout_time = int(data['logout_time']) if data['logout_time'] != '0' else 0

            if login_time > logout_time and logout_time != 0:
                data['shift_in'] = '1900'
                data['shift_out'] = '0700'
            elif login_time < logout_time and login_time != 0:
                data['shift_in'] = '0700'
                data['shift_out'] = '1900'
            else:
                data['shift_in'] = '0000'
                data['shift_out'] = '0000'

        return data

    def get_attendance_obj_for_leave(self,status):
        data= {
    "login_time": '0000',
    "logout_time": '0000',
    "processed_total_hour": '0',
    "working_time": '0',
    "total_hours": '0',
    "processed_logout_time": '0000',
    "ot_hrs": '0',
    "extra_hrs": "0",
    "hot_hrs": "0",
    "ot2_hrs": "0",
    "less_hrs": "0",
    "late_hrs": "0",
    "permitted_ot": "0",
    "scheduled_ot": "0",
    "is_consecutive_weekly_off": False,
    "status": status,
    "remarks": "",
    "break_hrs": "0"
}
        return data

    def auto_punch_attendance_details(self,status,grace_details):
        login_time_str = '0900'
        login_time = datetime.strptime(login_time_str, '%H%M')

        work_minutes = int(grace_details.get('min_work_mins', 0))
        break_minutes = int(grace_details.get('break_time', 0))

        total_minutes = work_minutes + break_minutes
        logout_time = login_time + timedelta(minutes=total_minutes)

        logout_time_str = logout_time.strftime('%H%M')

        data = {
            "login_time": login_time_str,
            "logout_time": logout_time_str,
            "processed_total_hour": grace_details['min_work_mins'],
            "working_time": grace_details['min_work_mins'],
            "total_hours": grace_details['min_work_mins'],
            "processed_logout_time": logout_time_str,
            "ot_hrs": '0',
            "extra_hrs": "0",
            "hot_hrs": "0",
            "ot2_hrs": "0",
            "less_hrs": "0",
            "late_hrs": "0",
            "permitted_ot": "0",
            "scheduled_ot": "0",
            "is_consecutive_weekly_off": False,
            "status": status,
            "remarks": "",
            "break_hrs": "0"
        }
        return data

