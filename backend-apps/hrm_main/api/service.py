from datetime import datetime, timedelta, date, time
from decimal import Decimal

import pandas as pd
from hrm_main.models import Advance, GraceDetails
from hrm_master.models import LeaveEntry, LeaveMasterDetails, HolidayMaster, LeaveMasterDetailBreakup
from django.db.models import Q
from notificationemail.notification import NotificationService
from rest_framework import serializers
from hrm_main.models import GratuityEmployeeForm, EmployeeMonthlyAllowanceDetails, TravelPlanningLog
from dateutil.relativedelta import relativedelta
from branch.models import BranchWorkingDays
from django.db.models import Q, Case, When, IntegerField

class HRMSignal:
    # attendance .csv file extracted
    @classmethod
    def employee_month_list(cls, employee_data):
        extracted_data = []
        days = list(map(str, range(1, 32)))
        date_base = employee_data.get('date')
        for i, day in enumerate(days):
            date = f"{day.zfill(2)}/{date_base[3:]}"
            record = {
                'date': date,
                'employee_code': employee_data['employee_code'],
                'employee_name': employee_data['employee_name'],
                'login': employee_data['login_times'][i],
                'logout_time': employee_data['logout_times'][i],
                'working_time': employee_data['working_times'][i],
                'status': employee_data['status_data'][i]
            }
            extracted_data.append(record)
            return extracted_data

    @classmethod
    def on_month_extract(cls, rowValue):
        # print("rowValue", rowValue)
        date = None
        if rowValue:
            date_range = rowValue[1]
            start_date = date_range.split(" To ")
            date = start_date[0]
        return {'date': date}

    @classmethod
    def on_month_days_extract(cls, rowValue):
        return {'days': rowValue[1:]}

    @classmethod
    def on_employee_details_extract(cls, rowValue):
        employee_data = []
        if rowValue:
            for value in rowValue[0].split(";"):
                if value:
                    employee_data.append(value.split(":")[1].strip())
        # print("employee_data", employee_data)
        return {'employee_code': employee_data[0], 'employee_name': employee_data[1]}

    @classmethod
    def on_employee_login_time_extract(cls, rowValue):
        login_data = []
        if rowValue:
            rowValue = pd.Series(rowValue)
            rowValue = rowValue.fillna('00:00:00')
            login_data.extend(rowValue)
            # print("login_data", login_data)
        return {'login_times': login_data[1:]}

    @classmethod
    def on_employee_logout_time_extract(cls, rowValue):
        logout_data = []
        # print("logout_data", logout_data)
        if rowValue:
            rowValue = pd.Series(rowValue)
            rowValue = rowValue.fillna('00:00:00')
            logout_data.extend(rowValue)
            # print("logout_data", logout_data)
        return {'logout_times': logout_data[1:]}

    @classmethod
    def on_employee_working_time_extract(cls, rowValue):
        working_data = []
        # print("working_data", working_data)
        if rowValue:
            rowValue = pd.Series(rowValue)
            rowValue = rowValue.fillna('00:00:00')
            working_data.extend(rowValue)
            # print("working_data", working_data)
        return {'working_times': working_data[1:]}

    @classmethod
    def on_employee_attendance_status_time_extract(cls, rowValue):
        status_data = []
        # print("status_data", rowValue)
        if rowValue:
            rowValue = pd.Series(rowValue)
            rowValue = rowValue.replace({'P': 'Present', 'A': 'Absent', 'HLF': 'Half Leave'})
            status_data.extend(rowValue)
            # print("status_data", status_data)
        return {'status_data': status_data[1:]}

    # @classmethod
    # def on_advance_balance_deduct(cls, employee_id, from_date, advance_emi):
    #     from_date = datetime.strptime(from_date, '%Y-%m-%d')
    #     print("to_date",from_date)
    #
    #     if advance_emi != 0:
    #         print("advance_emi",advance_emi)
    #         advances_loan_deduct_month = Advance.objects.filter(
    #             loan_start_date__month__lte=from_date.month,
    #             loan_start_date__year__lte=from_date.year,
    #             employee=employee_id,approval_status='APPROVED'
    #         )
    #         loan_emi = 0
    #         for advance_loan in advances_loan_deduct_month:
    #             print("advance_emi", advance_emi)
    #             if advance_loan.balance_loan_amount != 0:
    #                 advance_loan.balance_loan_amount -= Decimal(advance_emi)
    #                 advance_loan.save()
    #         return loan_emi

    @classmethod
    def on_advance_balance_deduct(cls, employee_id, from_date, advance_emi):
        for fmt in ('%d-%m-%Y', '%Y-%m-%d'):
            try:
                from_date = datetime.strptime(from_date, fmt) if isinstance(from_date, str) else from_date
                break
            except (ValueError, TypeError):
                continue
        print("to_date", from_date)
        if advance_emi != 0:
            comparison_date = date(from_date.year, from_date.month, 1)
            advances_loan_deduct_month = Advance.objects.filter(
                loan_start_date__lte=comparison_date,
                employee=employee_id,
                approval_status='APPROVED'
            )
            print("advance_emi", comparison_date, advances_loan_deduct_month)
            loan_emi = 0
            for advance_loan in advances_loan_deduct_month:
                print("advance_emi", advance_emi)
                if advance_loan.balance_loan_amount != 0:
                    advance_loan.balance_loan_amount -= Decimal(advance_emi)
                    advance_loan.save()
            return advance_emi

    @classmethod
    def get_working_days_pay_silp_month(cls, from_date, to_date, branch_id):
        branch_config = BranchWorkingDays.objects.filter(branch_id=branch_id).first()
        if not branch_config:
            raise ValueError(f"No working days configuration found for branch ID {branch_id}")

        working_days = 0

        def is_nth_saturday(date, nth):
            if date.weekday() != 5:  
                return False

            # Count Saturdays from the start of the month
            first_day = date.replace(day=1)
            saturday_count = sum(
                1 for d in range((date - first_day).days + 1)
                if (first_day + timedelta(days=d)).weekday() == 5
            )
            return saturday_count == nth

        # Iterate through each day in the range
        current_date = from_date
        while current_date <= to_date:
            weekday = current_date.weekday() 

            # Skip weekly off days
            if weekday in branch_config.weekly_off_days:
                current_date += timedelta(days=1)
                continue

            # Skip specific Saturdays based on the branch configuration
            if branch_config.is_second_saturday_off and is_nth_saturday(current_date, 2):
                current_date += timedelta(days=1)
                continue
            if branch_config.is_third_saturday_off and is_nth_saturday(current_date, 3):
                current_date += timedelta(days=1)
                continue
            if branch_config.is_fourth_saturday_off and is_nth_saturday(current_date, 4):
                current_date += timedelta(days=1)
                continue
            if branch_config.is_fifth_saturday_off and is_nth_saturday(current_date, 5):
                current_date += timedelta(days=1)
                continue

            # Count the day as a working day
            working_days += 1
            current_date += timedelta(days=1)

        # Subtract branch-specific holidays
        holiday_count = HolidayMaster.objects.filter((Q(date__month=from_date.month, date__year=from_date.year) |
                                                     Q(date__month=to_date.month, date__year=to_date.year)) & Q(b_id = branch_id)).count()

        # Final working days calculation
        return working_days - holiday_count

    @classmethod
    def get_working_days_pay_silp_month_based_on_employee(cls, from_date, to_date, employee,branch_id):
        weekly_off = employee.weekly_off or []
        def parse(d):
            if not isinstance(d, str):
                return d
            for fmt in ('%d-%m-%Y', '%Y-%m-%d'):
                try:
                    return datetime.strptime(d, fmt).date()
                except ValueError:
                    continue
            return d
        from_date, to_date = parse(from_date), parse(to_date)

        days = sum(
            1 for i in range((to_date - from_date).days + 1)
            if (from_date + timedelta(days=i)).strftime('%A') not in weekly_off
        )
        return days

    @classmethod
    def leave_details_count(cls, from_date, to_date, employee_id):
        print("leave_list_count", from_date.strftime('%B'), from_date.year, to_date.strftime('%B'), to_date.year)
        leave_list_count = LeaveMasterDetailBreakup.objects.filter(
            Q(allocated_month=from_date.strftime('%B'), allocated_year=from_date.year) |
            Q(allocated_month=to_date.strftime('%B'), allocated_year=to_date.year),
            leave_master_detail__leave_master__employee=employee_id,
            leave_master_detail__leave_type__in=['Annual Leave', 'Sick Leave'],
        )
        print("leave_list_count", leave_list_count)
        annual_leave = leave_list_count.filter(leave_master_detail__leave_type='Annual Leave').first()
        sick_leave = leave_list_count.filter(leave_master_detail__leave_type='Sick Leave').first()

        return (
            annual_leave.utilized_leaves if annual_leave else 0,
            sick_leave.utilized_leaves if sick_leave else 0,
            annual_leave.available_leaves if annual_leave else 0,
            sick_leave.available_leaves if sick_leave else 0,
        )

    @classmethod
    def number_to_words(cls, n):
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
        teens = ["Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        thousands = ["", "Thousand"]

        if n == 0:
            return "Zero"

        if n < 10:
            return units[n]

        if n < 20:
            return teens[n - 11]

        if n < 100:
            return tens[n // 10] + (units[n % 10] if (n % 10 != 0) else "")

        if n < 1000:
            return units[n // 100] + " Hundred " + ("and " + cls.number_to_words(n % 100) if (n % 100 != 0) else "")

        if n < 1000000:
            return cls.number_to_words(n // 1000) + " Thousand " + (
                cls.number_to_words(n % 1000) if (n % 1000 != 0) else "")

        return str(n)

    @classmethod
    def validate_checkin(cls, travel_planning_data):
        tpid = travel_planning_data.get('travel_planning')
        tp_checkin_flag = travel_planning_data.get('checkin_flag')
        tp_checkout_flag = travel_planning_data.get('checkout_flag')
        if tp_checkout_flag == True:
            if tp_checkin_flag == False and tp_checkout_flag == True:
                raise serializers.ValidationError(f"Please Checkin First")

        if tp_checkin_flag == True:
            existing_checkin = TravelPlanningLog.objects.filter(travel_planning=tpid, is_active=True,
                                                                checkin_flag=True, checkout_flag=False).all()
            if existing_checkin:
                for i in existing_checkin:
                    i_checkin_date = i.checkin_date
                    i_checkin_time = i.checkin_time
                    raise serializers.ValidationError(
                        f"Please checkout for already created checkin {i_checkin_date} at {i_checkin_time} before creating new Checkin")
        return True

    @classmethod
    def validate_checkin_breakin(cls, travel_planning_data, instance):
        tp_checkin_flag = travel_planning_data.get('checkin_flag')
        tp_checkout_flag = travel_planning_data.get('checkout_flag')
        tp_breakin_flag = travel_planning_data.get('breakin_flag')
        tp_breakout_flag = travel_planning_data.get('breakout_flag')

        if tp_checkin_flag == True and tp_checkout_flag == False:
            existing_checkin = TravelPlanningLog.objects.filter(id=instance.id, is_active=True,
                                                                checkin_flag=True).first()
            if existing_checkin:
                if tp_breakin_flag == False and tp_breakout_flag == True:
                    # for i in existing_checkin:
                    raise serializers.ValidationError(f"Please breakin first to breakout")
                elif tp_breakin_flag == True and tp_breakout_flag == False:
                    if existing_checkin.breakin_flag == True and existing_checkin.breakout_flag == False:
                        raise serializers.ValidationError(f"Breakin already created")
                    else:
                        pass
                elif tp_breakin_flag == True and tp_breakout_flag == True:
                    if existing_checkin.breakin_flag == True and existing_checkin.breakout_flag == True:
                        raise serializers.ValidationError(f"Breakout already created")
                    else:
                        pass
                else:
                    # for i in existing_checkin:
                    raise serializers.ValidationError(f"CheckIn already created")

        if tp_checkin_flag == True and tp_checkout_flag == True:
            existing_checkin = TravelPlanningLog.objects.filter(id=instance.id, is_active=True, checkin_flag=True).all()
            for i in existing_checkin:
                if i.breakin_flag == True and i.breakout_flag == False:
                    raise serializers.ValidationError(
                        f"Please breakout for already created breakin {i.breakin_time} before checkout")
                if i.breakin_flag == False and i.breakout_flag == True:
                    raise serializers.ValidationError(f"Please breakin first to breakout")
                if i.checkout_flag == True:
                    raise serializers.ValidationError(f"Checkout already done")
        return True

    @classmethod
    def total_timing(cls, travel_planning_data, instance):
        tp_checkout_time = travel_planning_data.get('checkout_time')
        tp_checkout_flag = travel_planning_data.get('checkout_flag')
        total_log_time = ""
        if tp_checkout_flag == True:
            existing_checkin = TravelPlanningLog.objects.filter(id=instance.id, is_active=True,
                                                                checkin_flag=True).first()
            if existing_checkin.checkin_flag == True and existing_checkin.breakin_flag == True and existing_checkin.breakout_flag == True and tp_checkout_flag == True:
                if existing_checkin.checkin_time not in ["", None] and existing_checkin.breakin_time not in ["",
                                                                                                             None] and existing_checkin.breakout_time not in [
                    "", None] and tp_checkout_time not in ["", None]:

                    breakin_time = datetime.strptime(str(existing_checkin.breakin_time), '%H:%M:%S')
                    breakout_time = datetime.strptime(str(existing_checkin.breakout_time), '%H:%M:%S')
                    checkin = datetime.strptime(str(existing_checkin.checkin_time), '%H:%M:%S')
                    checkout = datetime.strptime(str(tp_checkout_time), '%H:%M:%S')
                    if checkout < checkin:
                        checkout += timedelta(days=1)
                    total_break_time_delta = breakout_time - breakin_time
                    total_log_time_delta = checkout - checkin
                    # total_log_time = str(total_log_time_delta - total_break_time_delta)

                    # Calculate total time excluding break time
                    total_log_time_seconds = total_log_time_delta.total_seconds() - total_break_time_delta.total_seconds()

                    # Convert total seconds back to HH:MM:SS format
                    hours = int(total_log_time_seconds // 3600)
                    minutes = int((total_log_time_seconds % 3600) // 60)
                    seconds = int(total_log_time_seconds % 60)
                    total_log_time = f"{hours:02}:{minutes:02}:{seconds:02}"

            elif existing_checkin.checkin_flag == True and tp_checkout_flag == True:
                if existing_checkin.checkin_time not in ["", None] and tp_checkout_time not in ["", None]:
                    checkin = datetime.strptime(str(existing_checkin.checkin_time), '%H:%M:%S')
                    checkout = datetime.strptime(str(tp_checkout_time), '%H:%M:%S')
                    if checkout < checkin:
                        checkout += timedelta(days=1)
                    total_log_time_delta = checkout - checkin
                    # total_log_time = str(total_log_time_delta)
                    # Calculate total time in seconds and convert back to HH:MM:SS format
                    total_log_time_seconds = total_log_time_delta.total_seconds()

                    hours = int(total_log_time_seconds // 3600)
                    minutes = int((total_log_time_seconds % 3600) // 60)
                    seconds = int(total_log_time_seconds % 60)
                    total_log_time = f"{hours:02}:{minutes:02}:{seconds:02}"
        return total_log_time

    @classmethod
    def break_timing(cls, travel_planning_data, instance):
        try:
            tp_breakout_time = travel_planning_data.get('breakout_time')
            tp_breakout_flag = travel_planning_data.get('breakout_flag')
            total_break_time = ""
            if tp_breakout_flag == True:
                existing_checkin = TravelPlanningLog.objects.filter(id=instance.id, is_active=True,
                                                                    checkin_flag=True).first()
                if existing_checkin.checkin_flag == True and existing_checkin.breakin_flag == True:
                    if existing_checkin.breakin_time not in ["", None] and tp_breakout_time not in ["", None]:
                        breakin_time = datetime.strptime(str(existing_checkin.breakin_time), '%H:%M:%S')
                        breakout_time = datetime.strptime(str(tp_breakout_time), '%H:%M:%S')
                        if breakout_time < breakin_time:
                            breakout_time += timedelta(days=1)
                        total_break_time_delta = breakout_time - breakin_time
                        # total_break_time = str(total_break_time_delta)
                        total_break_time_seconds = total_break_time_delta.total_seconds()
                        hours = int(total_break_time_seconds // 3600)
                        minutes = int((total_break_time_seconds % 3600) // 60)
                        seconds = int(total_break_time_seconds % 60)
                        total_break_time = f"{hours:02}:{minutes:02}:{seconds:02}"
            return total_break_time
        except Exception as e:
            raise serializers.ValidationError(e)

    @classmethod
    def calculate_total_distance(cls, travel_planning_data, instance):
        try:
            total_distance = 0.00
            tp_checkout_flag = travel_planning_data.get('checkout_flag')
            travel_planning_id = travel_planning_data.get('travel_planning').id or instance.get('travel_planning').id
            if tp_checkout_flag == True:
                travel_planning_log = TravelPlanningLog.objects.filter(travel_planning__id=travel_planning_id,
                                                                       is_active=True).all()
                if travel_planning_log:
                    i_count = 0.00
                    for i in travel_planning_log:
                        i_count += i.distance
                    total_distance = round(i_count, 2)
            return total_distance
        except Exception as e:
            raise serializers.ValidationError(e)


class GratuitySignal:
    @classmethod
    def calculate_service_years(cls, start_date, end_date):
        service_years = 0
        if start_date and end_date:
            difference = relativedelta(end_date, start_date)
            year_diff = difference.years
            month_diff = difference.months
            day_diff = difference.days
            if day_diff < 0:
                try:
                    next_month = start_date.replace(month=start_date.month + 1, day=1)
                except ValueError:
                    next_month = start_date.replace(year=start_date.year + 1, month=1, day=1)
                days_in_month = (next_month - start_date.replace(day=1)).days
                month_diff -= 1
                day_diff += days_in_month
            if month_diff < 0:
                year_diff -= 1
                month_diff += 12
            if month_diff > 6 or (month_diff == 6 and day_diff >= 1):
                year_diff += 1
            service_years = max(year_diff, 1)
        return service_years

    @classmethod
    def gratuity_calculation(cls, employee):
        # ── DEPRECATED ──────────────────────────────────────────────────────
        # This method used the Indian Gratuity Act formula (basic*15/26) which
        # is incorrect for UAE employees.
        # All gratuity calculations now go through:
        #   hrm.api.gratuity.gratuity_router.calculate_gratuity()
        # which applies the correct UAE or India formula based on branch config.
        # This method is intentionally left as a no-op to avoid breaking any
        # signal connections; it will be removed in a future cleanup.
        # ────────────────────────────────────────────────────────────────────
        return

        basic_sal = 0
        from django.utils import timezone

        try:
            gratuity = GratuityEmployeeForm.objects.get(employee=employee)
            if gratuity:
                monthly_details = EmployeeMonthlyAllowanceDetails.objects.filter(
                    gross_earnings__employee=gratuity.employee,
                    components__iexact='Basic Salary'
                ).first()
                if monthly_details:
                    basic_sal = monthly_details.monthly
                else:
                    basic_sal = 0
                current_date = timezone.now().date()
                one_year_ago = current_date - timedelta(days=365)
                if gratuity.employee.doj <= one_year_ago:
                    dor = gratuity.employee.dor
                    if dor is None or current_date <= dor:
                        end_date = current_date
                    else:
                        end_date = dor
                    service_years = cls.calculate_service_years(gratuity.employee.doj, end_date)

                    gratuity_amount = (basic_sal * 15) / 26
                    total_gratuity_yearly = gratuity_amount * service_years
                    total_gratuity_monthly = gratuity_amount / 12

                    gratuity.total_gratuity_monthly = round(total_gratuity_monthly)
                    gratuity.total_gratuity_yearly = round(total_gratuity_yearly)
                    gratuity.service_years = service_years
                    gratuity.present_basic_pay = basic_sal
                    gratuity.save()

                else:
                    gratuity.total_gratuity_monthly = 0
                    gratuity.total_gratuity_yearly = 0
                    gratuity.service_years = 0
                    gratuity.present_basic_pay = 0
            return True
        except GratuityEmployeeForm.DoesNotExist:
            print(f"No gratuity found for employee with ID: {employee}")
        # gratuity = GratuityEmployeeForm.objects.get(employee=employee)


class EmployeeGraceDetails:

    def get_grace_details(cls,punch_date, employee_type, employee_group, employee_reporting,b_id):
        master_grace_details = cls.get_grace_details_by_master(
            punch_date, employee_group, employee_reporting, employee_type
        )
        print("master_grace_details",master_grace_details)
        grace_details = {
            'min_work_mins': master_grace_details.min_work_mins if master_grace_details else (
                430 if b_id == '2' else 480),
            'max_work_mins': master_grace_details.max_work_mins if master_grace_details else (
                610 if b_id == '2' else 600),
            'break_time': master_grace_details.break_time if master_grace_details else (610 if b_id == '2' else 120),
            'max_day_ot_mins': master_grace_details.max_day_ot_mins if master_grace_details else (
                180 if b_id == '2' else 120),
            'max_night_ot_mins': master_grace_details.max_night_ot_mins if master_grace_details else (
                180 if b_id == '2' else 120),
            'weekly_off_work_mins': master_grace_details.weekly_off_work_mins if master_grace_details else 0,
            'wo_max_day_ot_mins': master_grace_details.wo_max_day_ot_mins if master_grace_details else (
                660 if b_id == '2' else 600),
            'wo_max_night_ot_mins': master_grace_details.wo_max_night_ot_mins if master_grace_details else (
                660 if b_id == '2' else 600),
            'total_work_hours': master_grace_details.total_work_hours if master_grace_details else 720
        }

        return grace_details

    def get_grace_details_by_master(cls,punch_in_date, emp_group, emp_reporting, emp_type):
        # Query first for 'Special' type
        grace_details = GraceDetails.objects.filter(
            Q(from_date__lte=punch_in_date) & Q(to_date__gte=punch_in_date),
            Q(emp_type=emp_type) | Q(emp_type="All"),
            Q(emp_group=emp_group) | Q(emp_group="All"),
            Q(emp_reporting=emp_reporting) | Q(emp_reporting="All"),
            type="Special"
        ).annotate(
            priority=Case(
                When(emp_type=emp_type, emp_group=emp_group, emp_reporting=emp_reporting, then=1),
                When(emp_type=emp_type, emp_group=emp_group, then=2),
                When(emp_type=emp_type, emp_reporting=emp_reporting, then=3),
                When(emp_group=emp_group, emp_reporting=emp_reporting, then=4),
                When(emp_type=emp_type, then=5),
                When(emp_group=emp_group, then=6),
                When(emp_reporting=emp_reporting, then=7),
                default=8,
                output_field=IntegerField(),
            )
        ).order_by("priority").first()

        # If no 'Special' type is found, fallback to 'Normal'
        if not grace_details:
            grace_details = GraceDetails.objects.filter(
                Q(emp_type=emp_type) | Q(emp_type="All"),
                Q(emp_group=emp_group) | Q(emp_group="All"),
                Q(emp_reporting=emp_reporting) | Q(emp_reporting="All"),
                type="Normal"
            ).annotate(
                priority=Case(
                    When(emp_type=emp_type, emp_group=emp_group, emp_reporting=emp_reporting, then=1),
                    When(emp_type=emp_type, emp_group=emp_group, then=2),
                    When(emp_type=emp_type, emp_reporting=emp_reporting, then=3),
                    When(emp_group=emp_group, emp_reporting=emp_reporting, then=4),
                    When(emp_type=emp_type, then=5),
                    When(emp_group=emp_group, then=6),
                    When(emp_reporting=emp_reporting, then=7),
                    default=8,
                    output_field=IntegerField(),
                )
            ).order_by("priority").first()

        return grace_details

    def apply_ot_rounding(cls,ot_minutes, maximum_ot_time):
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

        if total_minutes > maximum_ot_time:
            return maximum_ot_time

        return total_minutes

    def get_maximum_hot_mins(cls,login_time, logout_time, grace_master_data):
        formatted_login_time = cls.format_time(login_time)
        formatted_logout_time = cls.format_time(logout_time)
        login_dt = datetime.strptime(formatted_login_time, "%H:%M")
        logout_dt = datetime.strptime(formatted_logout_time, "%H:%M")

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

    def format_time(cls,time_str):
        try:
            time_obj = datetime.strptime(time_str, "%H%M")
            return time_obj.strftime('%H:%M')
        except ValueError:
            return time_str
