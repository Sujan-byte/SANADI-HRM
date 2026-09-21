# views.py
import ast
import itertools
from datetime import datetime
from datetime import time as dt_time
from lib2to3.fixes.fix_input import context

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from hrm_master.models import Department, EmployeeMaster
from rest_framework.response import Response
from rest_framework import viewsets, status
from hrm_utils.exception_handler import ExceptionsHandler
from .api.serializers import AttendanceDetailsSerializer, HistoricalAttendanceDetailsSerializer
from .models import AttendanceDetails
exception_handler = ExceptionsHandler()
from collections import OrderedDict
import io
import pandas as pd
from rest_framework.decorators import action
import xlsxwriter
import pdfkit
from django.http import HttpResponse
from django.template.loader import render_to_string
import environ
env = environ.Env()
environ.Env.read_env()
from django.db import transaction
from django.db.models import Exists, OuterRef, Q

class AttendanceDetailsViewSet(viewsets.ModelViewSet):
    queryset = AttendanceDetails.objects.all().order_by('employee_name','date','id')
    serializer_class = AttendanceDetailsSerializer
    search_fields = ['id', 'employee_name', 'employee_code', 'login_time', 'logout_time',
                     'working_time', 'date',
                     'status', ]
    filterset_fields = {
        "employee_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "login_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "logout_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "working_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
        "b_id": ['exact']
    }

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset()).order_by('id')

        query_params = request.query_params.dict()
        if 'offset' in request.query_params and 'limit' in query_params:  # To get Details with offset and limit
            if 'multipleQuery' in query_params:
                # queryset = self.get_queryset()
                query_params.pop('offset', None)
                query_params.pop('limit', None)
                query_params.pop('attendance', None)
                filterset_fields = self.filterset_fields.copy()
                query_filter = Q()
                for key, value in query_params.items():
                    if key in filterset_fields:
                        query_filter &= Q(**{key + '__istartswith': value.strip()})
                if query_filter:
                    queryset = queryset.filter(query_filter).order_by('attendance')

            offset = int(request.query_params.get('offset', 0))
            limit = int(request.query_params.get('limit', 10))  # Set a default limit, e.g., 10
            total_count = queryset.count()
            queryset = queryset[offset:limit]
            # Calculate whether there are more items after the current page
            has_more = total_count > limit
            serializer = self.get_serializer(queryset, many=True)
            response_data = {
                'data': serializer.data,
                'total_count': total_count,
                'has_more': has_more,
            }

            return Response(response_data, status=status.HTTP_200_OK)
        if 'page' in request.query_params:
            page = self.paginate_queryset(queryset)
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(queryset, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['POST'], url_path='bulk-update-time-sheet')
    def bulk_update_time_sheet(self, request, client=None):

        timesheet_data = request.data
        if not isinstance(timesheet_data, list):
            return Response({"error": "Invalid data format. Expected a list."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                updated_timesheets = []

                for item in timesheet_data:
                    timesheet = AttendanceDetails.objects.get(id=item.get('id'))
                    serializer = AttendanceDetailsSerializer(timesheet, data=item, partial=True, context={'request':request})  # Use serializer for update

                    if serializer.is_valid():
                        serializer.save()  # Saves the updated instance
                        updated_timesheets.append(serializer.data)
                    else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Timesheets updated successfully!", "data": updated_timesheets},
                            status=status.HTTP_200_OK)

        except AttendanceDetails.DoesNotExist:
            return Response({"error": "One or more timesheet records not found."}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='get_time_sheet')
    def get_time_sheet(self, request, *args, **kwargs):
        department = request.query_params.get('department', None)
        employee_type = request.query_params.get('employee_type', None)
        employee_group = request.query_params.get('employee_group', None)
        time_sheet_type = request.query_params.get('time_sheet_type', None)
        reporting = request.query_params.get('reporting', None)
        is_processed = request.query_params.get('is_processed', None)
        is_processed = is_processed == 'true'
        page = request.query_params.get('page', None)
        approval_time_sheet = request.query_params.get('approval_time_sheet', 'false')
        approval_time_sheet = approval_time_sheet == 'true'
        b_id = request.query_params.get('b_id', None)

        if time_sheet_type == 'B':
            queryset = self.get_queryset()
            exclude_statuses = [19, 18, 11, 17]

            consolidated_status_on_same_date = queryset.filter(
                date=OuterRef('date'),
                status__in=exclude_statuses
            )

            queryset = queryset.annotate(
                has_consolidated_status=Exists(consolidated_status_on_same_date)
            ).exclude(
                Q(status=-1) & Q(has_consolidated_status=True)
            )
            # queryset = self.get_queryset()
        else:
            filters = Q()
            if department:
                filters &= Q(department=department)
            if employee_type:
                filters &= Q(employee_type=employee_type)
            if employee_group:
                filters &= Q(employee_group=employee_group)
            if reporting:
                filters &= Q(reporting=reporting)
            if b_id:
                filters &= Q(b_id=b_id)
            if filters:
                employee_codes = EmployeeMaster.objects.filter(
                   filters
                ).values_list('employee_code', flat=True)
                queryset = self.get_queryset().exclude(status='-1').filter(employee_code__in=employee_codes)
            else:
                queryset = self.get_queryset().exclude(status='-1')

        queryset = self.filter_queryset(queryset).order_by('date', 'employee_name', 'id')
        aggregate_columns=[]
        overall_count=[]

        if not approval_time_sheet:
            aggregate_columns = self.get_aggregated_values(queryset,request)
            if not department:
                overall_count=self.overall_status_wise_report(queryset,is_processed=is_processed)
        else:
            queryset = queryset.filter(~Q(edited_data={}) & ~Q(edited_data__isnull=True))

        if page is not None:
            page = self.paginate_queryset(queryset)
            serializer = self.get_serializer(page, many=True,context={'time_sheet':True,'request':request})
            paginated_data=self.get_paginated_response(serializer.data).data
            data = {
                'data': paginated_data, 'aggregate_columns': aggregate_columns,'overall_status_wise_count':overall_count
            }
            return Response(data)
        serializer = self.get_serializer(queryset, many=True,context={'time_sheet':True,'request':request})
        return Response(serializer.data)

    def get_aggregated_values(self,queryset, request, is_export=False):
        is_processed =  request.query_params.get('is_processed', 'False').lower() == 'true' if request is not None else False

        all_records = list(queryset.values(
            'total_hours', 'working_time', 'ot_hrs', 'ot2_hrs','hot_hrs','less_hrs','extra_hrs','status','is_consecutive_weekly_off','permitted_ot','processed_logout_time','processed_total_hour','break_hrs'
        ))

        total_hours = 0
        total_working_hours = 0
        total_ot_hours = 0
        total_ot2_hours = 0
        total_hot_hours = 0
        total_less_hours = 0
        total_extra_hours = 0
        total_break_hours = 0

        for record in all_records:
            # print("less hrs",record['less_hrs'])
            if is_processed:
                record=AttendanceDetailsSerializer().get_processed_data(record)
            if not is_export:
                record=AttendanceDetailsSerializer().update_permitted_ot_with_hot(record)
            if record['status'] != '-1':
                total_hours += int(record['total_hours']) if record['total_hours'] else 0
                total_working_hours += int(record['working_time']) if record['working_time'] else 0
                total_ot_hours += int(record['ot_hrs']) if record['ot_hrs'] else 0
                total_ot2_hours += int(record['ot2_hrs']) if record['ot2_hrs'] else 0
                total_hot_hours += int(record['hot_hrs']) if record['hot_hrs'] else 0
                total_less_hours += int(record['less_hrs']) if record['less_hrs'] else 0
                total_extra_hours += int(record['extra_hrs']) if record['extra_hrs'] else 0
                total_break_hours += int(record['break_hrs']) if record['break_hrs'] else 0

        aggregate_columns = {
            "total_hours": self.convert_to_time_format(total_hours),
            "total_working_hours":  self.convert_to_time_format(total_working_hours) ,
            "total_ot_hours": self.convert_to_time_format(total_ot_hours) ,
            "total_ot2_hours":  self.convert_to_time_format(total_ot2_hours) ,
            "total_hot_hours": self.convert_to_time_format(total_hot_hours),
            "total_less_hours":self.convert_to_time_format(total_less_hours) ,
            "total_extra_hours": self.convert_to_time_format(total_extra_hours),
            "total_break_hours": self.convert_to_time_format(total_break_hours)
        }
        return aggregate_columns


    def convert_to_time_format(self,value):
        minutes = value // 60
        seconds = value % 60
        return f"{minutes:02}.{seconds:02}"

    def overall_status_wise_report(self,queryset, **kwargs):
        is_processed = kwargs.get('is_processed',False)
        status_mapping = {
            '4': 'absent',
            '8': 'annual_leave',
            '9': 'sick_leave',
            '23': 'spl_leave',
            '13': 'comp_off',
            '19': 'holiday_ot',
            '18': 'holiday',
            '11': 'weekly_off_ot',
            '17': 'weekly_off'
        }

        result = {status_name: 0 for status_name in status_mapping.values()}

        for obj in queryset:
            # TODO Needs to be improved as per branch
            if obj.is_consecutive_weekly_off and is_processed:
                obj.status = '17'
            if obj.status in status_mapping:
                result[status_mapping[obj.status]] += 1

        total_days = queryset.order_by('date').exclude(status='-1').distinct('date').count()
        leave_statuses = ['absent', 'annual_leave', 'sick_leave', 'spl_leave', 'holiday', 'weekly_off','weekly_off_ot','holiday_ot','comp_off']

        total_leave_days = sum(result[status] for status in leave_statuses if status in result)

        present_working_days = abs(total_days - total_leave_days)

        result['present_working_days'] = present_working_days
        result['total_days'] = total_days
        # print("result",result)
        return result


    @action(detail=False, methods=['GET'], url_path='time_sheet_export_excel')
    def time_sheet_export_excel(self, request, client):
        department = request.query_params.get('department', None)
        export = request.query_params.get('export_fields', None)
        employee_type = request.query_params.get('employee_type', None)
        employee_group = request.query_params.get('employee_group', None)
        time_sheet_type = request.query_params.get('time_sheet_type', None)
        reporting = request.query_params.get('reporting', None)
        is_processed = request.query_params.get('is_processed', None)
        is_processed = is_processed == 'true'
        b_id = request.query_params.get('b_id', None)

        if time_sheet_type == 'B':
            queryset = self.get_queryset()
        else:
            filters = Q()
            if department:
                filters &= Q(department=department)
            if employee_type:
                filters &= Q(employee_type=employee_type)
            if employee_group:
                filters &= Q(employee_group=employee_group)
            if reporting:
                filters &= Q(reporting=reporting)
            if b_id:
                filters &= Q(b_id=b_id)
            if filters:
                employee_codes = EmployeeMaster.objects.filter(
                    filters
                ).values_list('employee_code', flat=True)
                queryset = self.get_queryset().exclude(status='-1').filter(employee_code__in=employee_codes)
            else:
                queryset = self.get_queryset().exclude(status='-1')

        queryset = self.filter_queryset(queryset)

        grouped_data = {}
        for key, group in itertools.groupby(queryset, key=lambda x: x.employee_code):
            grouped_data[key] = list(group)

        processed_data = []
        for employee_code, group_list in grouped_data.items():
            group_queryset = queryset.filter(employee_code=employee_code)
            aggregate_columns = self.get_aggregated_values(group_queryset,request,is_export=True)
            overall_count = self.overall_status_wise_report(group_queryset,is_processed=is_processed)
            serializer = self.get_serializer(
                group_queryset, many=True,
                context={'time_sheet': True, 'export_timesheet': True, 'request': request}
            )

            emp_obj = EmployeeMaster.objects.filter(employee_code=employee_code).first()
            employee_name = emp_obj.first_name
            emp_code = emp_obj.employee_code
            department_name = emp_obj.department.department_name if emp_obj.department is not None else None
            processed_data.append({
                'employee_code': employee_code,
                'employee_name':employee_name,
                'emp_code':emp_code,
                'department_name':department_name,
                'data': serializer.data,
                'overall_count': overall_count,
                'aggregate_columns': aggregate_columns
            })
        export = ast.literal_eval(export)
        return self.get_time_sheet_export_file(processed_data,export,request,reporting)

    def extract_and_calculate_date_range(self,request):
            from_date_str = request.query_params.get('date__gte', None)
            to_date_str = request.query_params.get('date__lte', None)

            month_year = "-"

            if to_date_str:
                try:
                    month_year = datetime.strptime(to_date_str, "%d-%m-%Y").strftime("%b-%y")
                except ValueError:
                    month_year = None

            concat_str = "-"
            date_difference = "-"

            if from_date_str and to_date_str:
                try:
                    from_date = datetime.strptime(from_date_str, "%d-%m-%Y")
                    to_date = datetime.strptime(to_date_str, "%d-%m-%Y")
                    date_difference = (to_date - from_date).days+1 # added one to include from date
                    concat_str = f"{from_date.strftime('%d-%b-%y')} to {to_date.strftime('%d-%b-%y')}"
                except ValueError as e:
                    print(f"Error parsing dates: {e}")

            return {
                'month_year': month_year,
                'concat_date': concat_str,
                'date_difference': date_difference
            }

    def get_time_sheet_export_file(self, data, export_fields, request,reporting):
        excel_file = io.BytesIO()
        workbook = xlsxwriter.Workbook(excel_file)
        worksheet = workbook.add_worksheet('Sheet1')

        header_format = workbook.add_format({
            'bold': True,
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
            'bg_color': '#d3d3d3'
        })

        value_format = workbook.add_format({
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
        })

        row_offset = 0

        max_col_widths = [0] * (len(export_fields) + 6)

        def update_max_col_width(col, value):
            if value is not None:
                width = len(str(value))
                if width > max_col_widths[col]:
                    max_col_widths[col] = width

        for employee_data in data:
            employee_name = employee_data['employee_name']
            emp_code = employee_data['emp_code']
            department_name = employee_data['department_name']
            overall_count = employee_data['overall_count']
            aggregate_columns = employee_data['aggregate_columns']
            employee_records = employee_data['data']

            date_extraction = self.extract_and_calculate_date_range(request)

            custom_headers = [
                'Emp Name', 'Emp Code', 'Department', 'Month', 'Period', 'Days'
            ]
            custom_values = [
                employee_name, emp_code, department_name, date_extraction['month_year'],
                date_extraction['concat_date'], date_extraction['date_difference']
            ]

            column_offset = 1 if reporting == 'Direct' and 'converted_break_hrs' in export_fields.keys() else 0
            colspans = [2+column_offset, 2, 2, 2, 2, 1]

            start_col = 0
            for i, header in enumerate(custom_headers):
                end_col = start_col + colspans[i] - 1
                if colspans[i] > 1:
                    worksheet.merge_range(row_offset, start_col, row_offset, end_col, header, header_format)
                    worksheet.merge_range(row_offset + 1, start_col, row_offset + 1, end_col, custom_values[i],
                                          value_format)
                else:
                    worksheet.write(row_offset, start_col, header, header_format)
                    worksheet.write(row_offset + 1, start_col, custom_values[i], value_format)

                update_max_col_width(start_col, header)
                update_max_col_width(start_col, custom_values[i])

                start_col = end_col + 1

            export_fields.pop('employee_name',None)
            for col, detailed_header in enumerate(export_fields.values()):
                worksheet.write(row_offset + 2, col, detailed_header, header_format)
                update_max_col_width(col, detailed_header)

            processed_data = []

            for item in employee_records:
                ordered_item = {col: item.get(col, None) for col in export_fields}
                processed_data.append(ordered_item)

            df = pd.DataFrame(processed_data)
            df.fillna(' ', inplace=True)
            df.replace('', ' ', inplace=True)

            table_start_row = row_offset + 3
            for data_row in df.values:
                for col, value in enumerate(data_row):
                    if isinstance(value, list):
                        value_str = ', '.join(map(str, value))
                        worksheet.write(table_start_row, col, value_str, value_format)
                        update_max_col_width(col, value_str)
                    else:
                        worksheet.write(table_start_row, col, value, value_format)
                        update_max_col_width(col, value)
                table_start_row += 1

            footer_start_row = table_start_row

            bold_value_format = workbook.add_format({
                'bold': True,
                'align': 'left',
                'valign': 'vcenter',
                'border': 1,
            })
            footer_columns = 11 + column_offset
            for col in range(footer_columns):
                if col == 0:
                    worksheet.write(footer_start_row, col, "TOTAL", bold_value_format)
                    update_max_col_width(col, "TOTAL")
                elif col == 3:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_hours'])
                elif column_offset==1 and col == 4:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_break_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_break_hours'])
                elif col == 4 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_working_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_working_hours'])
                elif col == 6 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_ot_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_ot_hours'])
                elif col == 7 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_ot2_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_ot2_hours'])
                elif col == 8 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_hot_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_hot_hours'])
                elif col == 9 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_less_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_less_hours'])
                elif col == 10 + column_offset:
                    worksheet.write(footer_start_row, col, aggregate_columns['total_extra_hours'], bold_value_format)
                    update_max_col_width(col, aggregate_columns['total_extra_hours'])
                else:
                    worksheet.write(footer_start_row, col, "", bold_value_format)

            second_footer_headers = [
                "Present Working day", "Weekly off", "Weekly off OT", "Holiday", "Holiday OT",
                "Absent", "Annual Leave", "Sick Leave", "Spl Leave", "Comp Off", "Total Days"
            ]

            second_footer_values = [
                overall_count['present_working_days'], overall_count['weekly_off'], overall_count['weekly_off_ot'],
                overall_count['holiday'], overall_count['holiday_ot'], overall_count['absent'],
                overall_count['annual_leave'], overall_count['sick_leave'], overall_count['spl_leave'],
                overall_count['comp_off'], overall_count['total_days']
            ]

            second_footer_start_row = footer_start_row + 1

            for col, header in enumerate(second_footer_headers):
                if col == 0 and column_offset == 1:
                    worksheet.merge_range(second_footer_start_row, col, second_footer_start_row, col + 1, header,
                                          header_format)
                else:
                    worksheet.write(second_footer_start_row, col + column_offset, header, header_format)

            second_footer_value_row = second_footer_start_row + 1
            for col, value in enumerate(second_footer_values):
                if col == 0 and column_offset == 1:
                    worksheet.merge_range(second_footer_value_row, col, second_footer_value_row, col + 1, value,
                                          value_format)
                else:
                    worksheet.write(second_footer_value_row, col + column_offset, value, value_format)

            row_offset = second_footer_value_row + 3
        for col, width in enumerate(max_col_widths):
            if width !=0:
                worksheet.set_column(col, col, width)

        workbook.close()
        excel_file.seek(0)

        response = HttpResponse(
            content=excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="report.xlsx"'
        return response


    @action(detail=False, methods=['GET'], url_path='time_sheet_export_pdf')
    def time_sheet_export_pdf(self, request, client):
        department = request.query_params.get('department', None)
        export = request.query_params.get('export_fields', None)
        employee_type = request.query_params.get('employee_type', None)
        employee_group = request.query_params.get('employee_group', None)
        time_sheet_type = request.query_params.get('time_sheet_type', None)
        is_processed = request.query_params.get('is_processed', None)
        reporting = request.query_params.get('reporting', None)
        is_processed = is_processed == 'true'
        b_id = request.query_params.get('b_id', None)

        if time_sheet_type == 'B':
            queryset = self.get_queryset()
        else:
            filters = Q()
            if department:
                filters &= Q(department=department)
            if employee_type:
                filters &= Q(employee_type=employee_type)
            if employee_group:
                filters &= Q(employee_group=employee_group)
            if reporting:
                filters &= Q(reporting=reporting)
            if b_id:
                filters &= Q(b_id=b_id)
            if filters:
                employee_codes = EmployeeMaster.objects.filter(
                    filters
                ).values_list('employee_code', flat=True)
                queryset = self.get_queryset().exclude(status='-1').filter(employee_code__in=employee_codes)
            else:
                queryset = self.get_queryset().exclude(status='-1')

        queryset = self.filter_queryset(queryset)

        grouped_data = {}
        for key, group in itertools.groupby(queryset, key=lambda x: x.employee_code):
            grouped_data[key] = list(group)

        processed_data = []
        for employee_code, group_list in grouped_data.items():
            group_queryset = queryset.filter(employee_code=employee_code)
            aggregate_columns = self.get_aggregated_values(group_queryset,request,is_export=True)
            overall_count = self.overall_status_wise_report(group_queryset,is_processed=is_processed)
            serializer = self.get_serializer(
                group_queryset, many=True,
                context={'time_sheet': True, 'export_timesheet': True, 'request': request}
            )

            emp_obj = EmployeeMaster.objects.filter(employee_code=employee_code).first()
            employee_name = emp_obj.first_name
            emp_code = emp_obj.employee_code
            department_name = emp_obj.department.department_name if emp_obj.department is not None else None
            processed_data.append({
                'employee_code': employee_code,
                'employee_name': employee_name,
                'emp_code': emp_code,
                'department_name': department_name,
                'data': serializer.data,
                'overall_count': overall_count,
                'aggregate_columns': aggregate_columns
            })
        export = ast.literal_eval(export)
        return self.get_time_sheet_export_pdf(processed_data,export,request,reporting)

    def get_time_sheet_export_pdf(self, data, export_fields, request,reporting):
        date_extraction = self.extract_and_calculate_date_range(request)
        export_fields.pop('employee_name',None)
        custom_headers = [
            'Emp Name', 'Emp Code', 'Department', 'Month', 'Period', 'Days'
        ]
        column_offset = 1 if reporting == 'Direct' and 'converted_break_hrs' in export_fields.keys() else 0
        table_headers = list(export_fields.values())
        table_fields = list(export_fields.keys())

        processed_data = []
        for employee in data:
            employee_name = employee.get('employee_name', "")
            emp_code = employee.get('emp_code', "")
            department_name = employee.get('department_name', "")
            overall_count = employee.get('overall_count', {})
            aggregate_columns = employee.get('aggregate_columns', {})

            custom_values = [
                employee_name, emp_code, department_name, date_extraction['month_year'],
                date_extraction['concat_date'], date_extraction['date_difference']
            ]

            footer_headers = [
                "Present Working day", "Weekly off", "Weekly off OT", "Holiday",
                "Holiday OT", "Absent", "Annual Leave", "Sick Leave", "Spl Leave", "Comp Off", "Total Days"
            ]

            footer_values = [
                overall_count.get('present_working_days', 0), overall_count.get('weekly_off', 0),
                overall_count.get('weekly_off_ot', 0), overall_count.get('holiday', 0),
                overall_count.get('holiday_ot', 0),
                overall_count.get('absent', 0), overall_count.get('annual_leave', 0),
                overall_count.get('sick_leave', 0),
                overall_count.get('spl_leave', 0), overall_count.get('comp_off', 0), overall_count.get('total_days', 0)
            ]

            processed_data.append({
                'employee_name': employee_name,
                'emp_code': emp_code,
                'department_name': department_name,
                'custom_headers': custom_headers,
                'custom_header_values': custom_values,
                'table_headers': table_headers,
                'table_fields': table_fields,
                'footer_headers': footer_headers,
                'footer_values': footer_values,
                'data': employee.get('data', []),
                'aggregate_columns': aggregate_columns,
                'column_offset':column_offset
            })

        html_content = render_to_string('timesheet_template.html', {'processed_data': processed_data})

        pdf_options = {
            'page-size': 'A4',
            'encoding': 'UTF-8',
            'margin-top': '5mm',
            'margin-right': '5mm',
            'margin-bottom': '5mm',
            'margin-left': '5mm',
        }

        pdf = pdfkit.from_string(html_content, False, options=pdf_options,
                                 configuration=pdfkit.configuration(wkhtmltopdf=env("WK_HTML_TO_PDF")))

        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="timesheet_report.pdf"'
        return response




    @action(detail=False, methods=['GET'], url_path='timesheet_import_template')
    def timesheet_import_template(self, request, *args, **kwargs):
        from hrm_main.models import AttendanceStatusMaster
        status_list = list(AttendanceStatusMaster.objects.filter(type='Attendance').values_list('status_name', flat=True))

        excel_file = io.BytesIO()
        workbook = xlsxwriter.Workbook(excel_file)
        worksheet = workbook.add_worksheet('Timesheet')

        header_format = workbook.add_format({'bold': True, 'bg_color': '#d3d3d3', 'border': 1, 'align': 'center', 'valign': 'vcenter'})
        sample_format = workbook.add_format({'border': 1, 'font_color': '#888888', 'italic': True})

        # (label shown in Excel, db field name used by importer, sample value, editable by user)
        columns = [
            ('Employee Code *',      'employee_code',  'E001',       True),
            ('Date * (DD-MM-YYYY)',  'date',           '01-07-2025', True),
            ('Employee Name',        'employee_name',  'John Doe',   True),
            ('In Time (HH:MM)',      'login_time',     '08:00',      True),
            ('Out Time (HH:MM)',     'logout_time',    '17:00',      True),
            ('Work Hrs',             'total_hours',    '9',          True),
            ('Break Hrs',            'break_hrs',      '0.5',        True),
            ('Base Hrs',             'working_time',   '8.5',        True),
            ('Status',               'status',         status_list[0] if status_list else 'Present', True),
            ('OT 1',                 'ot_hrs',         '0',          True),
            ('OT 2',                 'ot2_hrs',        '0',          True),
            ('HOT Hrs',              'hot_hrs',        '0',          True),
            ('Less Hrs',             'less_hrs',       '0',          True),
            ('Extra Hrs',            'extra_hrs',      '0',          True),
            ('Remarks',              'remarks',        '',           True),
        ]

        status_col_idx = None
        for col, (label, field, sample, editable) in enumerate(columns):
            worksheet.write(0, col, label, header_format)
            worksheet.write(1, col, sample, sample_format)
            worksheet.set_column(col, col, 20)
            if field == 'status':
                status_col_idx = col

        # Status dropdown
        if status_list and status_col_idx is not None:
            status_sheet = workbook.add_worksheet('StatusList')
            for i, name in enumerate(status_list):
                status_sheet.write(i, 0, name)
            status_sheet.hide()
            worksheet.data_validation(1, status_col_idx, 1000, status_col_idx, {
                'validate': 'list',
                'source': f'=StatusList!$A$1:$A${len(status_list)}',
            })

        worksheet.set_row(0, 20)
        workbook.close()
        excel_file.seek(0)

        response = HttpResponse(
            content=excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="timesheet_import_template.xlsx"'
        return response

    @action(detail=False, methods=['POST'], url_path='import_timesheet')
    def import_timesheet(self, request, *args, **kwargs):
        from hrm_main.models import AttendanceStatusMaster
        file = request.FILES.get('file')
        b_id = request.data.get('b_id') or request.query_params.get('b_id')

        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Map Excel column labels â†’ DB field names (matches template column definitions)
        label_to_field = {
            'employee code *':       'employee_code',
            'date * (dd-mm-yyyy)':   'date',
            'employee name':         'employee_name',
            'in time (hh:mm)':       'login_time',
            'out time (hh:mm)':      'logout_time',
            'work hrs':              'total_hours',
            'break hrs':             'break_hrs',
            'base hrs':              'working_time',
            'status':                'status',
            'ot 1':                  'ot_hrs',
            'ot 2':                  'ot2_hrs',
            'hot hrs':               'hot_hrs',
            'less hrs':              'less_hrs',
            'extra hrs':             'extra_hrs',
            'remarks':               'remarks',
        }

        file_name = file.name.lower()
        try:
            if file_name.endswith('.xlsx'):
                raw_df = pd.read_excel(file, dtype=str, engine='openpyxl', header=0)
            elif file_name.endswith('.xls'):
                raw_df = pd.read_excel(file, dtype=str, engine='xlrd', header=0)
            else:
                return Response({'error': 'Unsupported file format. Upload .xlsx or .xls'}, status=status.HTTP_400_BAD_REQUEST)

            raw_columns = list(raw_df.columns)
            df = raw_df.copy()
            df.columns = [label_to_field.get(c.strip().lower(), c.strip().lower().replace(' ', '_')) for c in df.columns]
            df = df.fillna('').replace('nan', '').replace('NaN', '')
        except Exception as e:
            return Response({'error': f'Failed to read file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        required_fields = {'employee_code', 'date'}
        missing = required_fields - set(df.columns)
        if missing:
            return Response({
                'error': f'Missing required columns: {", ".join(missing)}',
                'raw_columns_in_file': raw_columns,
                'mapped_columns': list(df.columns),
                'hint': 'Please download a fresh template and re-import.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Keep only rows that have both employee_code and date filled
        df = df[df['employee_code'].str.strip().astype(bool) & df['date'].str.strip().astype(bool)]

        if df.empty:
            return Response({
                'error': 'No valid data rows found.',
                'mapped_columns': list(df.columns),
                'total_rows_in_file': len(raw_df),
                'hint': 'Ensure employee_code and date columns have values.'
            }, status=status.HTTP_400_BAD_REQUEST)


        # Build status nameâ†’code lookup from AttendanceStatusMaster
        status_lookup = {
            s.status_name.strip().lower(): s.code
            for s in AttendanceStatusMaster.objects.all()
            if s.status_name and s.code
        }

        created_count = 0
        updated_count = 0
        errors = []

        # Cache valid employee codes for this b_id to avoid per-row DB hits
        valid_employee_codes = set(
            EmployeeMaster.objects.filter(b_id=int(b_id)).values_list('employee_code', flat=True)
            if b_id else
            EmployeeMaster.objects.values_list('employee_code', flat=True)
        )

        results = []
        with transaction.atomic():
            for idx, row in df.iterrows():
                employee_code = str(row.get('employee_code', '')).strip()
                date_val = str(row.get('date', '')).strip()

                if not employee_code or not date_val:
                    errors.append(f'Row {idx + 2}: employee_code and date are required.')
                    continue

                if employee_code not in valid_employee_codes:
                    errors.append(f'Row {idx + 2}: Employee code "{employee_code}" not found in employee master.')
                    continue

                parsed_date = None
                # Strip time portion if present (e.g. "2026-07-01 00:00:00")
                date_val_clean = date_val.split(' ')[0].split('T')[0].strip()
                for fmt in ('%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d'):
                    try:
                        parsed_date = datetime.strptime(date_val_clean, fmt).date()
                        break
                    except ValueError:
                        continue
                if parsed_date is None:
                    errors.append(f'Row {idx + 2}: Invalid date format "{date_val}". Use DD-MM-YYYY.')
                    continue

                defaults = {}

                # Time fields: stored as HHMM in DB (e.g. "0800"), Excel has HH:MM.
                # Excel time-formatted cells come through pandas as datetime.time/Timestamp
                # objects, so str() on them yields "08:00:00" (with seconds) rather than "08:00".
                for field in ['login_time', 'logout_time']:
                    raw_val = row.get(field, '') if field in df.columns else ''
                    if isinstance(raw_val, (dt_time, datetime, pd.Timestamp)):
                        defaults[field] = raw_val.strftime('%H%M')
                        continue
                    val = str(raw_val).strip()
                    if val and val.lower() != 'nan':
                        try:
                            if ':' in val:
                                time_obj = datetime.strptime(val.split(':')[0].zfill(2) + ':' + val.split(':')[1], '%H:%M')
                                defaults[field] = time_obj.strftime('%H%M')
                            else:
                                defaults[field] = val.zfill(4)  # already HHMM
                        except ValueError:
                            defaults[field] = val

                # Hour fields: stored as total MINUTES in DB (e.g. 9 hrs = 540)
                # User enters decimal hours: 9, 1.5, 8.5 etc.
                for field in ['total_hours', 'working_time', 'ot_hrs', 'ot2_hrs',
                              'hot_hrs', 'less_hrs', 'extra_hrs', 'break_hrs']:
                    val = str(row.get(field, '')).strip() if field in df.columns else ''
                    if val:
                        try:
                            defaults[field] = str(int(float(val) * 60))
                        except ValueError:
                            pass

                # Plain text fields
                for field in ['employee_name', 'remarks']:
                    val = str(row.get(field, '')).strip() if field in df.columns else ''
                    if val:
                        defaults[field] = val

                # Recompute processed fields â€” mirrors serializer's update_processed_details
                # total_hours and extra_hrs are already in minutes at this point
                try:
                    from datetime import timedelta
                    total_mins = int(defaults.get('total_hours', 0))
                    extra_mins = int(defaults.get('extra_hrs', 0))
                    defaults['processed_total_hour'] = str(total_mins - extra_mins)

                    if 'logout_time' in defaults:
                        logout_hhmm = defaults['logout_time'].zfill(4)
                        logout_dt = datetime.strptime(logout_hhmm, '%H%M')
                        processed_logout = logout_dt - timedelta(minutes=extra_mins)
                        defaults['processed_logout_time'] = processed_logout.strftime('%H%M')
                except Exception:
                    pass

                # Resolve status: accept status_name (text) or raw code
                if 'status' in df.columns and str(row.get('status', '')).strip():
                    raw_status = str(row['status']).strip()
                    resolved = status_lookup.get(raw_status.lower())
                    defaults['status'] = resolved if resolved is not None else raw_status

                if b_id:
                    defaults['b_id'] = int(b_id)

                lookup = {'employee_code': employee_code, 'date': parsed_date}
                if b_id:
                    lookup['b_id'] = int(b_id)

                obj, created = AttendanceDetails.objects.update_or_create(
                    **lookup,
                    defaults=defaults
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

                results.append({
                    'row': idx + 2,
                    'employee_code': employee_code,
                    'date': str(parsed_date),
                    'action': 'created' if created else 'updated',
                    'id': obj.id,
                    'defaults_applied': {k: v for k, v in defaults.items() if k not in ('b_id',)},
                })

        response_data = {
            'message': f'Import complete. Created: {created_count}, Updated: {updated_count}.',
            'created': created_count,
            'updated': updated_count,
            'results': results,
        }
        if errors:
            response_data['errors'] = errors

        return Response(response_data, status=status.HTTP_200_OK)


class HistoricalAttendanceDetailsViewSet(viewsets.ModelViewSet):
    queryset = AttendanceDetails.history.model.objects.all().order_by('id')
    serializer_class = HistoricalAttendanceDetailsSerializer
    search_fields = [ 'employee_name', 'employee_code', 'login_time', 'logout_time',
                     'working_time', 'date',
                     'status', ]
    filterset_fields = {
        "employee_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "login_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "logout_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "working_time": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
    }