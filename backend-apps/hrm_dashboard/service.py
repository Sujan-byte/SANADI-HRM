import calendar
from datetime import datetime
from django.utils import timezone
from django.db.models import Q

from hrm_master.models import EmployeeMaster, LeaveReversalRequest, LeaveEntry, LeaveApplication


class DashboardService:
    """Ported from Gateway Gulf HRM's dashboard.service.DashboardService, trimmed to the
    HRM-only (leave/employee) pieces actually used by AdminDashboardComponent /
    StaffDashboardComponent on Michellin's home page. The CRM/Equipment/Inventory/Purchase
    counterparts in the original file were not ported (not part of this HRM-only build).
    """

    @classmethod
    def dashboard_counts(cls, b_id):
        now = datetime.now()
        year = now.year
        current_date = now.date()

        # Adjust financial year if before April
        if current_date < datetime(year, 4, 1).date():
            year -= 1

        # Financial year months (Apr to Mar)
        month_labels = [
            ('apr', 4), ('may', 5), ('jun', 6), ('jul', 7), ('aug', 8), ('sep', 9),
            ('oct', 10), ('nov', 11), ('dec', 12), ('jan', 1), ('feb', 2), ('mar', 3)
        ]

        staff_counts = []  # Group-1 monthly counts
        worker_counts = []  # Group-2 monthly counts

        for label, month in month_labels:
            actual_year = year if month >= 4 else year + 1

            # Month start and end
            month_start = datetime(actual_year, month, 1).date()
            if month == 12:
                month_end = datetime(actual_year + 1, 1, 1).date()
            else:
                month_end = datetime(actual_year, month + 1, 1).date()

            # Get unique employee IDs from LeaveEntry
            group1_entry_query = LeaveEntry.objects.filter(
                b_id=b_id,
                approval_status='APPROVED',
                from_date__lte=month_end,
                to_date__gte=month_start,
                employee__employee_group='Group-1',
                employee__is_active=True
            )

            group1_entry_employees = set()
            for leave_entry in group1_entry_query.distinct('employee_id'):
                # Check for reversals specifically for this leave_entry
                reversal_check = LeaveReversalRequest.objects.filter(
                    leave_entry=leave_entry,
                    approval_status='APPROVED'
                ).filter(
                    # Reversal should overlap with the leave
                    reverse_from_date__lte=leave_entry.to_date,
                    reverse_to_date__gte=leave_entry.from_date
                ).filter(
                    # Check if reversal has ANY DAYS in this specific month
                    reverse_to_date__gt=month_start,    # Reversal ends AFTER month starts
                    reverse_from_date__lt=month_end     # Reversal starts BEFORE month ends
                )

                has_reversal = reversal_check.exists()

                if not has_reversal:
                    group1_entry_employees.add(leave_entry.employee_id)

            # Get unique employee IDs from LeaveApplication
            group1_app_query = LeaveApplication.objects.filter(
                b_id=b_id,
                approval_status='APPROVED',
                leave_approved_start_date__lte=month_end,
                leave_approved_end_date__gte=month_start,
                employee_code__employee_group='Group-1',
                employee_code__is_active=True
            )

            group1_app_employees = set()
            for leave_app in group1_app_query.distinct('employee_code_id'):
                # Check for reversals specifically for this leave_application
                reversal_check = LeaveReversalRequest.objects.filter(
                    leave_application=leave_app,
                    approval_status='APPROVED'
                ).filter(
                    # Reversal should overlap with the approved leave dates
                    reverse_from_date__lte=leave_app.leave_approved_end_date,
                    reverse_to_date__gte=leave_app.leave_approved_start_date
                ).filter(
                    # Check if reversal has ANY DAYS in this specific month
                    reverse_to_date__gt=month_start,    # Reversal ends AFTER month starts
                    reverse_from_date__lt=month_end     # Reversal starts BEFORE month ends
                )

                has_reversal = reversal_check.exists()

                if not has_reversal:
                    group1_app_employees.add(leave_app.employee_code_id)

            # Combine both sets and get unique count
            group1_all_employees = group1_entry_employees.union(group1_app_employees)
            staff_counts.append(len(group1_all_employees))

            group2_entry_query = LeaveEntry.objects.filter(
                b_id=b_id,
                approval_status='APPROVED',
                from_date__lte=month_end,
                to_date__gte=month_start,
                employee__employee_group='Group-2',
                employee__is_active=True
            )

            group2_entry_employees = set()
            for leave_entry in group2_entry_query.distinct('employee_id'):
                has_reversal = LeaveReversalRequest.objects.filter(
                    leave_entry=leave_entry,
                    approval_status='APPROVED'
                ).filter(
                    reverse_from_date__lte=leave_entry.to_date,
                    reverse_to_date__gte=leave_entry.from_date
                ).filter(
                    reverse_to_date__gt=month_start,
                    reverse_from_date__lt=month_end
                ).exists()

                if not has_reversal:
                    group2_entry_employees.add(leave_entry.employee_id)

            group2_app_query = LeaveApplication.objects.filter(
                b_id=b_id,
                approval_status='APPROVED',
                leave_approved_start_date__lte=month_end,
                leave_approved_end_date__gte=month_start,
                employee_code__employee_group='Group-2',
                employee_code__is_active=True
            )

            group2_app_employees = set()
            for leave_app in group2_app_query.distinct('employee_code_id'):
                has_reversal = LeaveReversalRequest.objects.filter(
                    leave_application=leave_app,
                    approval_status='APPROVED'
                ).filter(
                    reverse_from_date__lte=leave_app.leave_approved_end_date,
                    reverse_to_date__gte=leave_app.leave_approved_start_date
                ).filter(
                    reverse_to_date__gt=month_start,
                    reverse_from_date__lt=month_end
                ).exists()

                if not has_reversal:
                    group2_app_employees.add(leave_app.employee_code_id)

            # Filter only employees who are under leave
            group2_all_employees = EmployeeMaster.objects.filter(
                id__in=group2_entry_employees.union(group2_app_employees),
                is_under_leave=True
            ).values_list('id', flat=True)

            worker_counts.append(len(group2_all_employees))

        # ===== TOTAL COUNTS =====
        total_employees = EmployeeMaster.objects.filter(is_active=True, b_id=b_id).count()
        total_worker_count = EmployeeMaster.objects.filter(
            is_active=True, employee_group="Group-2", b_id=b_id
        ).count()
        total_staff_count = EmployeeMaster.objects.filter(
            is_active=True, employee_group="Group-1", b_id=b_id
        ).count()

        # ===== EMPLOYEES ON LEAVE TODAY =====
        today = timezone.now().date()

        # Employees from LeaveEntry today
        today_entry_query = LeaveEntry.objects.filter(
            b_id=b_id,
            approval_status='APPROVED',
            from_date__lte=today,
            to_date__gte=today,
            employee__is_active=True
        )

        today_entry_employees = set()
        for leave_entry in today_entry_query.distinct('employee_id'):
            has_reversal = LeaveReversalRequest.objects.filter(
                leave_entry=leave_entry,
                approval_status='APPROVED'
            ).filter(
                reverse_from_date__lte=leave_entry.to_date,
                reverse_to_date__gte=leave_entry.from_date
            ).filter(
                reverse_to_date__gt=today,
                reverse_from_date__lt=today
            ).exists()

            if not has_reversal:
                today_entry_employees.add(leave_entry.employee_id)

        # Employees from LeaveApplication today
        today_app_query = LeaveApplication.objects.filter(
            b_id=b_id,
            approval_status='APPROVED',
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today,
            employee_code__is_active=True
        )

        today_app_employees = set()
        for leave_app in today_app_query.distinct('employee_code_id'):
            has_reversal = LeaveReversalRequest.objects.filter(
                leave_application=leave_app,
                approval_status='APPROVED'
            ).filter(
                reverse_from_date__lte=leave_app.new_leave_end_date,
                reverse_to_date__gte=leave_app.new_leave_start_date
            ).filter(
                reverse_to_date__gt=today,
                reverse_from_date__lt=today
            ).exists()

            if not has_reversal:
                today_app_employees.add(leave_app.employee_code_id)

        # Combine both sets
        today_all_employees = today_entry_employees.union(today_app_employees)

        # GROUP WISE COUNT
        group1_leave_today = EmployeeMaster.objects.filter(
            id__in=today_all_employees,
            employee_group='Group-1'
        ).count()

        group2_leave_today = EmployeeMaster.objects.filter(
            id__in=today_all_employees,
            employee_group='Group-2',
            is_under_leave=True   # TOGGLE CONDITION
        ).count()

        employees_on_leave_today = group1_leave_today + group2_leave_today

        return {
            'staff_counts': staff_counts,        # Group-1 monthly counts (excluding reversals)
            'worker_counts': worker_counts,      # Group-2 monthly counts (excluding reversals)
            'total_employees': total_employees,
            'total_worker_count': total_worker_count,
            'total_staff_count': total_staff_count,
            'employee_on_leave': employees_on_leave_today,
            'group1_employee_on_leave': group1_leave_today,
            'group2_employee_on_leave': group2_leave_today
        }

    @classmethod
    def today_leave_details(cls, b_id):
        """
        Get detailed list of employees on leave today, latest records first.
        """
        today = timezone.now().date()
        leave_details = []

        # Track processed employee IDs to avoid duplicates across both sources
        processed_employee_ids = set()

        # Employees from LeaveEntry today - LATEST first
        today_entry_query = LeaveEntry.objects.filter(
            b_id=b_id,
            approval_status='APPROVED',
            from_date__lte=today,
            to_date__gte=today,
            employee__is_active=True
        ).select_related(
            'employee',
            'employee__designation',
            'employee__department',
            'leave_type'
        ).order_by('employee_id', '-modified').distinct('employee_id')

        # Employees from LeaveApplication today - LATEST first
        today_app_query = LeaveApplication.objects.filter(
            b_id=b_id,
            approval_status='APPROVED',
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today,
            employee_code__is_active=True
        ).select_related(
            'employee_code',
            'employee_code__designation',
            'employee_code__department'
        ).order_by('employee_code_id', '-modified').distinct('employee_code_id')

        sr_no = 1

        # Process LeaveEntry records (already ordered by latest modified)
        for leave_entry in today_entry_query:
            employee_id = leave_entry.employee_id

            # Check for reversal
            has_reversal = LeaveReversalRequest.objects.filter(
                leave_entry=leave_entry,
                approval_status='APPROVED'
            ).filter(
                reverse_from_date__lte=leave_entry.to_date,
                reverse_to_date__gte=leave_entry.from_date
            ).filter(
                reverse_to_date__gt=today,
                reverse_from_date__lt=today
            ).exists()

            if not has_reversal and leave_entry.employee:

                # Toggle logic
                if leave_entry.employee.employee_group == 'Group-2' and not leave_entry.employee.is_under_leave:
                    continue

                leave_details.append({
                    'sr_no': sr_no,
                    'emp_id': leave_entry.employee.employee_code if leave_entry.employee.employee_code else 'N/A',
                    'emp_name': f"{leave_entry.employee.first_name or ''} {leave_entry.employee.last_name or ''}".strip(),
                    'designation': leave_entry.employee.designation.designation_name if leave_entry.employee.designation else 'N/A',
                    'department': leave_entry.employee.department.department_name if leave_entry.employee.department else 'N/A',
                    'from_date': leave_entry.from_date.strftime('%d-%m-%Y') if leave_entry.from_date else 'N/A',
                    'to_date': leave_entry.to_date.strftime('%d-%m-%Y') if leave_entry.to_date else 'N/A',
                    'leave_type': leave_entry.leave_type.status_name if leave_entry.leave_type else 'N/A',
                    'source': 'Leave Entry',
                    'modified_date': leave_entry.modified,  # used for final sorting, popped below
                    'group': leave_entry.employee.employee_group or 'Group-1'
                })
                processed_employee_ids.add(employee_id)
                sr_no += 1

        # Process LeaveApplication records - SKIP if already processed from LeaveEntry
        for leave_app in today_app_query:
            employee_id = leave_app.employee_code_id

            # Skip if this employee was already processed from LeaveEntry
            if employee_id in processed_employee_ids:
                continue

            # Check for reversal
            has_reversal = LeaveReversalRequest.objects.filter(
                leave_application=leave_app,
                approval_status='APPROVED'
            ).filter(
                reverse_from_date__lte=leave_app.new_leave_end_date,
                reverse_to_date__gte=leave_app.new_leave_start_date
            ).filter(
                reverse_to_date__gt=today,
                reverse_from_date__lt=today
            ).exists()

            if not has_reversal and leave_app.employee_code:
                # Toggle logic for Group-2
                if leave_app.employee_code.employee_group == 'Group-2' and not leave_app.employee_code.is_under_leave:
                    continue
                leave_details.append({
                    'sr_no': sr_no,
                    'emp_id': leave_app.employee_code.employee_code if leave_app.employee_code.employee_code else 'N/A',
                    'emp_name': f"{leave_app.employee_code.first_name or ''} {leave_app.employee_code.last_name or ''}".strip(),
                    'designation': leave_app.employee_code.designation.designation_name if leave_app.employee_code.designation else 'N/A',
                    'department': leave_app.employee_code.department.department_name if leave_app.employee_code.department else 'N/A',
                    'from_date': leave_app.new_leave_start_date.strftime('%d-%m-%Y') if leave_app.new_leave_start_date else 'N/A',
                    'to_date': leave_app.new_leave_end_date.strftime('%d-%m-%Y') if leave_app.new_leave_end_date else 'N/A',
                    'leave_type': 'Annual Leave',
                    'source': 'Leave Application',
                    'modified_date': leave_app.modified,  # used for final sorting, popped below
                    'group': leave_app.employee_code.employee_group or 'Group-1'
                })
                processed_employee_ids.add(employee_id)
                sr_no += 1

        # Sort by modified date (latest first)
        leave_details.sort(key=lambda x: x['modified_date'], reverse=True)

        # Reassign serial numbers after sorting
        for i, detail in enumerate(leave_details, 1):
            detail['sr_no'] = i

        # Remove modified_date from final response
        for detail in leave_details:
            detail.pop('modified_date', None)

        return {
            'count': len(leave_details),
            'results': leave_details,
            'date': today.strftime('%d-%m-%Y')
        }


# --- Legacy ERP dashboard helpers below are not part of this HRM-only build; kept
# commented out for reference only. ---
# from sales.models import *
# from service.models import *
# from purchase.models import *
# from master.models import PartyMaster, ProductMaster, EmployeeMaster
# from inventory.models import MaterialRequestDetails
# from account.models import Invoice, InvoiceDetails
# from django.db.models import Sum, Q, F, Count
# from itertools import chain

# # admin dashboard functions
# def sales(month, year, b_id):
#     try:
#         sales_data = []
#         for i in ['inquiry', 'quotation', 'order']:
#             s_data = []
#             total_count = 0
#             total_value = 0
#             for j in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']:
#                 count = 0
#                 value = 0
#                 if i == 'inquiry':
#                     si_query = SalesInquiry.objects.filter(approval_status=j, inquiry_date__month=month, inquiry_date__year=year, b_id=b_id)
#                     count = si_query.count()
#                     value = si_query.aggregate(v=Sum('approx_value'))['v']
#                 elif i == 'quotation':
#                     sq_query = SalesQuotation.objects.filter(approval_status=j, quotation_date__month=month, quotation_date__year=year, b_id=b_id)
#                     count = sq_query.count()
#                     value = sq_query.aggregate(v=Sum('grand_total'))['v']
#                 elif i == 'order':
#                     sop_query = SalesOrderProfile.objects.filter(approval_status=j, order_profile_date__month=month, order_profile_date__year=year, b_id=b_id)
#                     count = sop_query.count()
#                     value = sop_query.aggregate(v=Sum('grand_total'))['v']
#                 s_data.append({'type': j, 'count': count, 'value': value})
#                 total_count += count
#                 if value != None:
#                     total_value += value
#             sales_data.append({i: s_data, 'total_count': total_count, 'total_value': round(total_value, 2)})
#         return sales_data
#     except Exception as e:
#         print(e)
#         return []

# def service(month, year, b_id):
#     try:
#         service_data = []
#         for i in ['inquiry', 'quotation', 'order']:
#             s_data = []
#             total_count = 0
#             total_value = 0
#             for j in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']:
#                 count = 0
#                 value = 0
#                 if i == 'inquiry':
#                     si_query = ServiceInquiry.objects.filter(approval_status=j, inquiry_date__month=month, inquiry_date__year=year, b_id=b_id)
#                     count = si_query.count()
#                     value = si_query.aggregate(v=Sum('approx_value'))['v']
#                 elif i == 'quotation':
#                     sq_query = ServiceQuotation.objects.filter(approval_status=j, quotation_date__month=month, quotation_date__year=year, b_id=b_id)
#                     count = sq_query.count()
#                     value = sq_query.aggregate(v=Sum('grand_total'))['v']
#                 elif i == 'order':
#                     sop_query = ServiceOrderProfile.objects.filter(approval_status=j, order_profile_date__month=month, order_profile_date__year=year, b_id=b_id)
#                     count = sop_query.count()
#                     value = sop_query.aggregate(v=Sum('grand_total'))['v']
#                 s_data.append({'type': j, 'count': count, 'value': value})
#                 total_count += count
#                 if value != None:
#                     total_value += value
#             service_data.append({i: s_data, 'total_count': total_count, 'total_value': round(total_value, 2)})
#         return service_data
#     except Exception as e:
#         print(e)
#         return []

# def purchase(month, year, b_id):
#     try:
#         purchase_data = []
#         for i in ['oa', 'po', 'grn']:
#             p_data = []
#             total_count = 0
#             total_value = 0
#             for j in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']:
#                 count = 0
#                 value = 0
#                 if i == 'oa':
#                     oa_query = OrderAcceptance.objects.filter(approval_status=j, oa_date__month=month, oa_date__year=year, b_id=b_id)
#                     count = oa_query.count()
#                     value = oa_query.aggregate(v=Sum('grand_total'))['v']
#                 elif i == 'po':
#                     po_query = PurchaseOrder.objects.filter(approval_status=j, form_date__month=month, form_date__year=year, b_id=b_id)
#                     count = po_query.count()
#                     value = po_query.aggregate(v=Sum('grand_total'))['v']
#                 elif i == 'grn':
#                     grn_query = GRN.objects.filter(approval_status=j, grn_date__month=month, grn_date__year=year, b_id=b_id)
#                     count = grn_query.count()
#                     value = grn_query.aggregate(v=Sum('grand_total'))['v']
#                 p_data.append({'type': j, 'count': count, 'value': value})
#                 total_count += count
#                 if value != None:
#                     total_value += value
#             purchase_data.append({i: p_data, 'total_count': total_count, 'total_value': round(total_value, 2)})
#         return purchase_data
#     except Exception as e:
#         print(e)
#         return [] 

# def revenue_analytics_func(month, year, b_id):
#     ra_data = {}
#     try:
#         ra_data = dict(Invoice.objects.filter(invoice_date__year=year, invoice_date__month=month, b_id=b_id).values_list('customer__party_name').annotate(total_sum=Sum('grand_total')).order_by('-total_sum')[:5])
#         return ra_data
#     except Exception as e:
#         print(e)
#         return ra_data

# def ms_product(month, year, b_id):
#     selling_product = {}
#     try:
#         selling_product = dict(InvoiceDetails.objects.filter(invoice__invoice_date__year=year, invoice__invoice_date__month=month, b_id=b_id).values_list('product__item_name').annotate(total_sum=Sum('total_amount')).order_by('-total_sum')[:5])
#         return selling_product
#     except Exception as e:
#         print(e)
#         return selling_product
    
# def assigned_to(month, year, b_id):
#     sr_lst = []
#     try:
#         sr_lst = SalesQuotation.objects.filter(quotation_date__month=month, quotation_date__year=year, approval_status='APPROVED', b_id=b_id, assign_to__employee__designation__designation_name='Sales Representative').annotate(sr=F('assign_to__first_name')).values('sr').annotate(sales_invoice=Count('id', distinct=True), sales_revenue=Sum('grand_total', distinct=True)).order_by('-sales_revenue')[:5]
#         return sr_lst
#     except Exception as e:
#         print(e)
#         return sr_lst
    
# # service engineer's dashbord functions
# def service_engineer(eid, month, year, b_id):
#     service_lst = []
#     engineer_query = ServiceAssignEngineerAssignTo.objects.filter(employee=eid, b_id=b_id).all()
#     for eq in engineer_query:
#         source = eq.assign_engineer.source
#         cname = eq.assign_engineer.customer.party_name
#         sid = None
#         sdate = None
#         if eq.assign_engineer.source == 'Call Id':
#             sid = eq.assign_engineer.call_id_no.call_id
#             sdate = eq.assign_engineer.call_id_no.call_attended_date
#         elif eq.assign_engineer.source == 'Delivery Challan':
#             sid = eq.assign_engineer.dc_no.dc_no
#             sdate = eq.assign_engineer.dc_no.dc_date
#         elif eq.assign_engineer.source == 'Order Profile':
#             sid = eq.assign_engineer.op_no.order_profile_no
#             sdate = eq.assign_engineer.op_no.order_profile_date
#         elif eq.assign_engineer.source == 'Self Service Assign':
#             sid = eq.assign_engineer.self_assign_id_no.self_assign_id
#             sdate = eq.assign_engineer.self_assign_id_no.date
#         if sdate != None and sid != None:
#             if sdate.month == int(month) and sdate.year == int(year):
#                 # prods = ServiceAssignEngineerProductDetails.objects.filter(assign_engineer=eq.assign_engineer.id, b_id=b_id).annotate(serial_number=F('hsn')).values('product_name', 'model', 'serial_number', 'equipment_status')
#                 # for p in prods:
#                 # service_lst.append({**p, 'customer_name': cname, 'source': source, 'source_id': sid, 'source_date': sdate})
#                 service_lst.append({'assign_id': sid, 'customer_name': cname, 'source': source, 'date': sdate})
#     return service_lst

# # employee dashboard functions
# def sales2(month, year, b_id):
#     si_query = SalesInquiry.objects.filter(b_id=b_id)
#     total_sales_inquiry = si_query.count()
#     sq_query = SalesQuotation.objects.filter(b_id=b_id)
#     total_sales_quotation = sq_query.count()
#     sales_quotation_status = {}
#     for i in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']:
#         sales_quotation_status[i] = sq_query.filter(approval_status=i, quotation_date__year=year, quotation_date__month=month).count()
#     sales_inquiry = list(si_query.filter(inquiry_date__year=year, inquiry_date__month=month).values('inquiry_no', 'inquiry_date', 'customer__party_name', 'lead_source', 'poc_name', 'poc_mobile', 'poc_email'))
#     sales_quotation = sq_query.filter(quotation_date__year=year, quotation_date__month=month).values('quotation_no', 'quotation_date', 'customer__party_name', 'approval_status')
#     sales_order_profile = list(SalesOrderProfile.objects.filter(approval_status='APPROVED', order_profile_date__year=year, order_profile_date__month=month, b_id=b_id).values('order_profile_no', 'order_profile_type', 'customer__party_name', 'order_profile_date'))
#     sales_data = {'total_sales_inquiry': total_sales_inquiry, 'total_sales_quotation': total_sales_quotation, 'sales_quotation_status': sales_quotation_status, 'sales_inquiry': sales_inquiry, 'sales_quotation': sales_quotation, 'sales_order_profile': sales_order_profile}
#     return sales_data

# def service2(month, year, b_id):
#     si_query = ServiceInquiry.objects.filter(b_id=b_id)
#     total_service_inquiry = si_query.count()
#     sq_query = ServiceQuotation.objects.filter(b_id=b_id)
#     total_service_quotation = sq_query.count()
#     service_quotation_status = {}
#     for i in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']:
#         service_quotation_status[i] = sq_query.filter(approval_status=i, quotation_date__year=year, quotation_date__month=month).count()
#     notifications_on_warranty = Invoice.objects.filter(approval_status='APPROVED', invoice_date__year=year, invoice_date__month=month, b_id=b_id).values('invoice_no', 'customer__party_name', )
#     service_inquiry = si_query.filter(inquiry_date__year=year, inquiry_date__month=month).values('inquiry_no', 'inquiry_date', 'customer__party_name', 'lead_source', 'poc_name', 'poc_mobile', 'poc_email')
#     service_quotation = sq_query.filter(quotation_date__year=year, quotation_date__month=month).values('quotation_no', 'quotation_date', 'customer__party_name', 'approval_status')
#     service_order_profile = list(ServiceOrderProfile.objects.filter(approval_status='APPROVED', order_profile_date__year=year, order_profile_date__month=month, b_id=b_id).values('order_profile_no', 'order_profile_type', 'customer_po_number', 'order_profile_date'))
#     service_complaint = ServiceAssignEngineerAssignTo.objects.filter(assign_engineer__date__year=year, assign_engineer__date__month=month, b_id=b_id).values('assign_engineer__assign_id', 'assign_engineer__source', 'assign_engineer__customer__party_name', 'assign_engineer__date', 'employee__first_name')
#     spare_part_request = MaterialRequestDetails.objects.filter(material_request__request_date__year=year, material_request__request_date__month=month, material_request__approval_status='PENDING_APPROVAL', b_id=b_id).values('material_request__id', 'material_request__employee__first_name', 'material_request__customer_service__assign_engineer__assign_id', 'material_request__customer_service__customer_name', 'material_request__customer_service__type', 'part_number', 'part_name', 'qty')
#     service_data = {'total_service_inquiry': total_service_inquiry, 'total_service_quotation': total_service_quotation, 'service_quotation_status': service_quotation_status, 'amc_remainder': amc_remainder(b_id), 'notifications_on_warranty': notifications_on_warranty, 'service_inquiry': service_inquiry, 'service_quotation': service_quotation, 'service_complaint': service_complaint, 'service_order_profile': service_order_profile, 'spare_part_request': spare_part_request}
#     return service_data

# def purchase2(month, year, b_id):
#     oa_query = OrderAcceptance.objects.filter(b_id=b_id)
#     oa = oa_query.count()
#     po_query = PurchaseOrder.objects.filter(b_id=b_id)
#     po = po_query.count()
#     grn_query = GRN.objects.filter(b_id=b_id)
#     grn = grn_query.count()
#     oa_lst = list(oa_query.filter(oa_date__year=year, oa_date__month=month).values('oa_no', 'oa_date', 'customer__party_name'))
#     po_lst = list(po_query.filter(form_date__year=year, form_date__month=month).values('type', 'form_code', 'form_date', 'supplier_name__party_name', 'delivery_date'))
#     grn_lst = list(grn_query.filter(grn_date__year=year, grn_date__month=month).values('grn_no', 'grn_date', 'source', 'supplier__party_name', 'grand_total'))
#     order_acceptance = list(OrderAcceptance.objects.filter(approval_status='APPROVED', oa_date__year=year, oa_date__month=month, b_id=b_id).values('oa_no', 'oa_date', 'customer__party_name', 'customer_po_no', 'customer_po_date'))
#     purchase_data = {'order_acceptance': oa, 'purchase_order': po, 'grn': grn, 'order_acceptance_list': oa_lst, 'purchase_order_list': po_lst, 'grn_list': grn_lst, 'order_acceptance2': order_acceptance}
#     return purchase_data

# def amc_remainder(b_id):
#     table_lst = [WarrantyDetailsPreventiveMaintenance, WarrantyDetailsBreakdownMaintenance, WarrantyDetailsCalibration,
#               WarrantyDetailsGeneralService, ContractInfoPreventiveMaintenance, ContractInfoBreakdownMaintenance,
#               ContractInfoCalibration, ContractInfoGeneralService]
#     start_date = date.today()
#     end_date = date.today() + timedelta(7)
#     filter_params = {'schedule_date__gte': start_date, 'schedule_date__lte': end_date, 'b_id': b_id}
#     amc = []
#     for tl in table_lst:
#         amc.append(tl.objects.filter(**filter_params).values('warranty_details__warranty__invoice__invoice_no', 'warranty_details__warranty__customer__party_name', 'warranty_details__product_name', 'schedule_date'))
#     amc_rem = list(chain(*amc))
#     return amc_rem