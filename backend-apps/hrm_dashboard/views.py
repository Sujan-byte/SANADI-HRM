from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import JsonResponse, HttpResponse
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import date
from django.db.models import Q, F, Prefetch
from django.utils import timezone
from master.models import *
from hrm_master.models import *
import importlib
from branch.models import Branch
from django.contrib.auth.models import Group
from master.api.serializers import DepartmentSerializer
from django.apps import apps
from rest_framework.decorators import action
from datetime import datetime
from security.models import User
from hrm_dashboard.service import DashboardService


@api_view(['GET'])
@permission_classes((IsAuthenticated,))
def dashboard_counts(request, client):
    b_id = request.query_params.get('b_id')
    dashboard_service = DashboardService()
    data = dashboard_service.dashboard_counts(b_id)
    return JsonResponse(data, safe=False)


@api_view(['GET'])
@permission_classes((IsAuthenticated,))
def today_leave_details(request, client):
    """
    Get detailed list of employees on leave today
    """
    b_id = request.query_params.get('b_id')
    dashboard_service = DashboardService()
    data = dashboard_service.today_leave_details(b_id)
    return JsonResponse(data, safe=False)


class HRMDashboardViewSet(viewsets.ModelViewSet):
    """ViewSet for the Lookup class"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            b_id = request.query_params.get('b_id')
            month = request.query_params.get('month')
            year = request.query_params.get('year')
            if not month and not year:
                month = date.today().month
                year = date.today().year
            holiday_query = list(HolidayMaster.objects.filter(date__year=year, date__month=month, is_active=True, b_id=b_id).values('date', 'description'))
            if request.user.is_superuser:
                department_query = self.queryset.filter(b_id=b_id)
                departments = []
                for dq in department_query:
                    employee_count = EmployeeMaster.objects.filter(department=dq.id, is_active=True, b_id=b_id).count()
                    departments.append({'department_code': dq.department_code, 'department_name': dq.department_name, 'number_of_employees': employee_count})
                total_no_of_employees = EmployeeMaster.objects.filter(is_active=True, b_id=b_id).count()
                et_graph_data = []
                employee_type = GlobalMaster.objects.filter(global_key='employee_type').first()
                for et in (employee_type.global_value if employee_type else []):
                    et_graph_data.append({et['id']: EmployeeMaster.objects.filter(employee_type=et['id'], is_active=True, b_id=b_id).count()})
                leave_application_query = LeaveEntry.objects.filter(Q(from_date__year=year, from_date__month=month) | Q(to_date__year=year, to_date__month=month), approval_status='APPROVED', b_id=b_id).values('employee__employee_code', 'employee__first_name', 'leave_type', 'from_date', 'to_date', 'approval_status')
                final_data = {'admin': True, 'departments': departments, 'total_no_of_employees': total_no_of_employees, 'todays_attendance': 0, 'employee_type': et_graph_data, 'leave_application': leave_application_query, 'holidays': holiday_query}
                return Response(final_data, status=status.HTTP_200_OK)
            else:
                emp = request.user.employee_id
                leave_master_query = LeaveMaster.objects.filter(employee=emp, b_id=b_id).first()
                leave_type_list = list(LeaveMasterDetails.objects.filter(leave_master=leave_master_query.id, b_id=b_id).values('leave_type', 'allocated_leaves', 'available_leaves')) if leave_master_query else []
                leave_application_query = LeaveEntry.objects.filter(Q(from_date__year=year, from_date__month=month) | Q(
                        to_date__year=year, to_date__month=month), employee=emp, approval_status='APPROVED', b_id=b_id).values('leave_type', 'from_date', 'to_date', 'no_of_days', 'approval_status')
                final_data = {'admin_employee': False, 'leaves': leave_type_list, 'leave_application': leave_application_query, 'holidays': holiday_query, 'total_leaves': leave_master_query.total_allocated_leaves if leave_master_query else 0, 'number_of_leave_applied': leave_application_query.count()}
                return Response(final_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
