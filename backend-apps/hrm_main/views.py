# views.py
import ast
import calendar
import importlib
import os
import random
import traceback
from datetime import datetime, timedelta
from sqlite3 import DatabaseError, IntegrityError
from time import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from rest_framework import filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from backend.filters.custom_filter import DynamicSearchFilter
from rest_framework import viewsets
from django.db.models import Q
from hrm_utils.exceptions.utils import api_exception_handler
from hrm_master.models import Department, Designation, Grade, EmployeeMaster
from master.models import AppSettings, GlobalMaster
from hrm_master.api.serializers import DepartmentSerializer, DesignationSerializer, \
    GradeSerializer, EmployeeMasterSerializer
from master.api.serializers import GlobalMasterSerializer, AppSettingsSerializer
from rest_framework.mixins import ListModelMixin
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import viewsets, status
# from notificationemail.notification import NotificationService
from hrm_utils.constants import NumberConstructorConstants
from hrm_utils.exception_handler import ExceptionsHandler, ApiException
from hrm_utils.number_constuctor import NumberConstructor
from django.shortcuts import render
from hrm_utils.custom_functions import get_dynamic_serializer_class
from django.db.models import Sum
from rest_framework.decorators import action
import tempfile
import pandas as pd
from django.http import JsonResponse
from django.conf import settings
import pdfkit
from .api.serializers import EmployeeMonthlySalarySerializer, SalaryIncrementSerializer, \
    GratuityEmployeeFormSerializer, GratuitySerializer, \
    CareerLetterSerializer, AdvanceSerializer, BonusSerializer, SalaryCalculationSerializer, SalaryHoldSerializer, \
    AttendanceImportSerializer, AttendanceDetailsSerializer, FinalSettlementSerializer, TaDaSerializer, \
    TravelPlanningSerializer, TravelPlanningLogSerializer, AttendanceStatusMasterSerializer, GraceDetailsSerializer, \
    OTSalaryCalculationSerializer, OTEmployeeListSerializer, DisciplinaryActionSerializer, ExpenseClaimCategorySerializer, \
    ExpenseClaimLinkTypeSerializer,ExpenseClaimSerializer,ExpenseClaimLineSerializer,ExpenseClaimAttachmentSerializer, \
    PettyCashFundSerializer, PettyCashTransactionSerializer

from .models import EmployeeMonthlySalary, GratuityEmployeeForm, Gratuity, CareerLetter, Advance, Bonus, \
    AttendanceImport, SalaryCalculation, SalaryHold, OTSalaryCalculation, OTEmployeeList, AttendanceDetails, \
    EmployeeList, EmployeeMonthlyAllowanceDetails, EmployeeMonthlyDeductionDetails, AllowanceDetails, \
    DeductionDetails, FinalSettlement, TaDa, TravelPlanning, TravelPlanningLog, AttendanceStatusMaster, GraceDetails, \
    DisciplinaryAction, ExpenseClaimCategory, ExpenseClaimLinkType, ExpenseClaim, ExpenseClaimLine, ExpenseClaimAttachment, \
    PettyCashFund, PettyCashTransaction

from hrm_master.models import LeaveEntry, LeaveMasterDetails, HolidayMaster
from security.models import User
from master.views import get_export_file
from django.shortcuts import get_object_or_404

from branch.models import Branch

exception_handler = ExceptionsHandler()
from .api import serializers
import environ
from collections import OrderedDict
import io
import pandas as pd
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
import xlsxwriter
import pdfkit
from django.http import HttpResponse
from django.template.loader import render_to_string

env = environ.Env()
environ.Env.read_env()


class EmployeeMonthlySalaryViewSet(viewsets.ModelViewSet):
    queryset = EmployeeMonthlySalary.objects.filter(
        # Show employee salary setup records (no reason) and approved salary increment records
        Q(reason__isnull=True) | Q(reason='') | Q(approval_status__iexact='approved')
    ).order_by('-modified')
    serializer_class = EmployeeMonthlySalarySerializer
    search_fields = ["employee__first_name", "employee__employee_code", 'net_pay_yearly', 'net_pay_monthly', 'ctc',
                     'employee__designation__designation_name', 'employee__department__department_name','is_active']
    filterset_fields = {
        'id': ['exact', 'in'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                 'istartswith',
                                 'iendswith'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                    'istartswith',
                                    'iendswith'],
        "employee__department__department_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                                  'istartswith',
                                                  'iendswith'],
        "employee__designation__designation_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith',
                                                    'endswith',
                                                    'istartswith',
                                                    'iendswith'],
        "net_pay_yearly": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                           'istartswith',
                           'iendswith'],
        "net_pay_monthly": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
        "ctc": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                'istartswith',
                'iendswith'],
        "b_id": ['exact'],
        "is_active": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        print("request", instance)
        # Assuming `employee` is a foreign key in `EmployeeMonthlyDeductionDetails`
        employee = EmployeeMaster.objects.filter(id=instance.employee.id)
        employee.update(is_sal_created=False)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['GET'], url_path='get_by_id')
    def get_by_id(self, request, client):
        id = request.query_params.get('id')
        if not id:
            return Response({"error": "ID is required"}, status=400)

        queryset = self.filter_queryset(self.get_queryset())
        instance = get_object_or_404(queryset, id=id)

        # Initialize variables for PF and ESI calculations
        allowance_pf = None
        pf_percentage = 0
        isEsiApplicable = False
        esi_percentage = 0
        for earning in instance.gross_earnings.all():
            grade = instance.employee.grade
            if earning.components == 'Conveyance Allowance':
                earning.monthly = grade.conveyance_allowance
            elif earning.components == 'Children Education Allowance':
                earning.monthly = grade.children_education_allowance
            elif earning.components == 'Children Hostel Allowances':
                earning.monthly = grade.children_hostel_allowances
            elif earning.components == 'CCA':
                earning.monthly = grade.cca

            earning.yearly = earning.monthly * 12
            earning.save()

        # Updating deductions
        for deduction in instance.gross_deductions.all():
            if deduction.components.startswith('PF'):
                allowance_pf = EmployeeMonthlyAllowanceDetails.objects.filter(
                    gross_earnings=instance,
                    components='Basic Salary' 
                ).first()

                if allowance_pf:
                    pf_percentage = float(instance.employee.grade.pf_employee_contribution or 0)
                    deduction.components = f"PF ({pf_percentage}%)"
                    deduction.monthly = round(float(allowance_pf.monthly) * pf_percentage / 100)
                else:
                    deduction.monthly = 0

                deduction.yearly = deduction.monthly * 12
                deduction.save()

            elif deduction.components.startswith('ESI'):
                allowance_total = EmployeeMonthlyAllowanceDetails.objects.filter(
                    gross_earnings=instance
                ).aggregate(total=Sum('monthly'))['total'] or 0
                isEsiApplicable = allowance_total < 21000
                esi_percentage = float(instance.employee.grade.esi_employee_share or 0)
                deduction.components = f"ESI ({esi_percentage}%)"
                print("allowance_total1", allowance_total)
                deduction.monthly = round(float(allowance_total) * esi_percentage / 100) if isEsiApplicable else 0
                deduction.yearly = deduction.monthly * 12 if isEsiApplicable else 0
                deduction.save()

        if isEsiApplicable:
            allowance_total = EmployeeMonthlyAllowanceDetails.objects.filter(
                gross_earnings=instance
            ).aggregate(total=Sum('monthly'))['total'] or 0
            instance.esi_employer = round(float(allowance_total) * esi_percentage / 100)
            print("allowance_total", allowance_total)
            instance.esi_employer_yearly = instance.esi_employer * 12
        else:
            instance.esi_employer = 0
            instance.esi_employer_yearly = 0

        if allowance_pf:
            pf_employer = round(float(allowance_pf.monthly) * pf_percentage / 100)
            isPFApplicable = pf_employer < 1800
            instance.pf_employer = pf_employer if isPFApplicable else 1800
        else:
            instance.pf_employer = 0

        instance.pf_employer_yearly = instance.pf_employer * 12
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class SalaryIncrementViewSet(EmployeeMonthlySalaryViewSet):
    """
    Read/write salary increments. Shares the EmployeeMonthlySalary model but
    filters to only records that have a `reason` set (i.e., increments).
    Also exposes the `current_salary` and `approve` actions.
    """
    serializer_class = SalaryIncrementSerializer
    filterset_fields = {
        **EmployeeMonthlySalaryViewSet.filterset_fields,
        'approval_status': ['exact', 'iexact', 'contains', 'icontains'],
        'document_number': ['exact', 'iexact', 'contains', 'icontains'],
    }

    def get_queryset(self):
        # SalaryIncrement list shows all increment records regardless of approval status
        return EmployeeMonthlySalary.objects.filter(
            reason__isnull=False
        ).exclude(reason='').order_by('-modified')

    @action(detail=True, methods=['POST'], url_path='approve')
    def approve(self, request, pk=None, client=None):
        instance = self.get_object()
        if not instance.reason:
            return Response({'error': 'Not a salary increment record'}, status=status.HTTP_400_BAD_REQUEST)
        instance.approval_status = 'approved'
        instance.is_active = True
        instance.save(update_fields=['approval_status', 'is_active'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get('required_fields', '')
            return get_dynamic_serializer_class(EmployeeMonthlySalary, SalaryIncrementSerializer, required_fields.split(','))
        return SalaryIncrementSerializer

    @action(detail=False, methods=['GET'], url_path='current_salary')
    def current_salary(self, request, client):
        from datetime import date as _date
        from django.db.models import Q
        from django.db.models.functions import Coalesce
        from django.db.models import Value

        employee_id = request.query_params.get('employee')
        if not employee_id:
            return Response({'error': 'employee parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        today = _date.today()
        exclude_id = request.query_params.get('exclude_id')
        qs = EmployeeMonthlySalary.objects.filter(
            employee_id=employee_id,
        ).filter(
            Q(effective_date__lte=today) | Q(effective_date__isnull=True)
        )
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        salary_record = qs.annotate(
            eff_sortable=Coalesce('effective_date', Value(_date(1900, 1, 1)))
        ).order_by('-eff_sortable').first()

        if not salary_record:
            return Response({'error': 'No salary record found for this employee'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeMonthlySalarySerializer(salary_record, context={'request': request})
        data = serializer.data
        data['current_gross'] = round(
            sum(float(e.get('monthly', 0) or 0) for e in data.get('gross_earnings', [])), 2
        )
        emp = salary_record.employee
        data['employee_code'] = emp.employee_code if emp else ''
        data['first_name']    = emp.first_name    if emp else ''
        return Response(data)


class CareerLetterViewSet(viewsets.ModelViewSet):
    queryset = CareerLetter.objects.all()
    serializer_class = CareerLetterSerializer
    search_fields = ["career_latter_type", "employee__employee_code","employee__first_name", "employee_name","subject", "date"]
    filterset_fields = {
        'id': ['exact', 'in'],
        "career_latter_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                               'istartswith',
                               'iendswith'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                    'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                    'istartswith',
                                    'iendswith'],
        "employee_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                 'istartswith',
                                 'iendswith'],
        "subject": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                    'istartswith',
                    'iendswith'],
        "date": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(CareerLetter, CareerLetterSerializer,
                                                required_fields.split(','))
        return serializers.CareerLetterSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class AdvanceViewSet(viewsets.ModelViewSet):
    queryset = Advance.objects.all()
    serializer_class = AdvanceSerializer
    search_fields = ['employee__employee_code', 'employee__first_name', 'approval_status', 'advance_amount',
                     'deduction_tenure_months', 'balance_loan_amount']
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee': ['exact', 'in'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                 'iendswith'],
        "advance_amount": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                           'iendswith'],
        "deduction_tenure_months": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "balance_loan_amount": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                'iendswith'],
        'is_active': ['exact', 'in'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
        'b_id': ['exact', 'in'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(Advance, AdvanceSerializer,
                                                required_fields.split(','))
        return serializers.AdvanceSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class BonusViewSet(viewsets.ModelViewSet):
    queryset = Bonus.objects.all().order_by('-modified')
    serializer_class = BonusSerializer
    search_fields = ['grade__grade_code', 'grade__grade_description', 'bonus_months', 'total_bonus_amount', 'date',
                     'is_active', 'approval_status']
    filterset_fields = {
        'id': ['exact', 'in'],
        'is_active': ['exact', 'in'],
        'b_id': ['exact', 'in'],
        "grade__grade_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                              'istartswith',
                              'iendswith'],
        "grade__grade_description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                     'istartswith',
                                     'iendswith'],
        "bonus_months": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "total_bonus_amount": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                               'istartswith',
                               'iendswith'],
        "date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(Bonus, BonusSerializer,
                                                required_fields.split(','))
        return serializers.BonusSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class GratuityViewSet(viewsets.ModelViewSet):
    queryset = Gratuity.objects.all()
    serializer_class = GratuitySerializer
    search_fields = []
    filterset_fields = {
        'id': ['exact', 'in'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class GratuityEmployeeFormViewSet(viewsets.ModelViewSet):
    queryset = GratuityEmployeeForm.objects.all().order_by('employee__doj')
    serializer_class = GratuityEmployeeFormSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ['employee__employee_code', 'employee__first_name', 'total_gratuity_yearly',
                     'total_gratuity_monthly', 'dor', 'is_active']
    filterset_fields = {
        'id': ['exact', 'in'],
        'is_active': ['exact', 'in'],
        'b_id': ['exact', 'in'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                    'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                 'istartswith',
                                 'iendswith'],
        "total_gratuity_yearly": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                  'istartswith',
                                  'iendswith'],
        "total_gratuity_monthly": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                   'istartswith',
                                   'iendswith'],
        "dor": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                'istartswith',
                'iendswith'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(GratuityEmployeeForm, GratuityEmployeeFormSerializer,
                                                required_fields.split(','))
        return serializers.GratuityEmployeeFormSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    @action(detail=False, methods=['GET'], url_path='gratuity_calculation')
    def gratuity_calculation(self, request, client, *args, **kwargs):
        from hrm_main.api.gratuity.gratuity_router import calculate_gratuity
        id = request.query_params.get('id')
        if not id:
            return Response({"error": "ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            gratuity = GratuityEmployeeForm.objects.select_related(
                'employee__designation', 'employee__department', 'employee__grade'
            ).get(id=id)
        except GratuityEmployeeForm.DoesNotExist:
            return Response({"error": "GratuityEmployeeForm not found"}, status=status.HTTP_404_NOT_FOUND)

        if not gratuity.employee or not gratuity.employee.doj:
            return Response({"error": "Employee or date of joining not set"}, status=status.HTTP_400_BAD_REQUEST)

        calc_result = calculate_gratuity(gratuity)

        # Formula errors (< 1 yr service, forfeiture, etc.) are not HTTP errors â€”
        # save the message into calculation_remarks so the HR user sees it in the form
        if calc_result.get('error'):
            error_msg = calc_result['error']
            gratuity.calculation_remarks = f'âš  Not Eligible: {error_msg}'
            gratuity.total_gratuity_yearly  = 0
            gratuity.total_gratuity_monthly = 0
            gratuity.net_gratuity_payable   = 0
            gratuity.save(update_fields=[
                'calculation_remarks',
                'total_gratuity_yearly',
                'total_gratuity_monthly',
                'net_gratuity_payable',
            ])

        # Inject pk into parser_context so ApprovalStageLoader takes the detail branch
        # (gratuity_calculation is a list-level @action â€” kwargs has no pk by default)
        request.parser_context.setdefault('kwargs', {})['pk'] = str(gratuity.id)
        serializer = GratuityEmployeeFormSerializer(gratuity, context={'request': request})
        data = serializer.data
        data['calculation_breakdown'] = calc_result
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], url_path='sync_unpaid_days')
    def sync_unpaid_days(self, request, client, *args, **kwargs):
        """Sync system unpaid days from AttendanceDetails for a gratuity record."""
        from hrm_main.api.gratuity.gratuity_router import _get_unpaid_leave_days_system
        from django.utils import timezone
        id = request.data.get('id')
        if not id:
            return Response({"error": "ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            gratuity = GratuityEmployeeForm.objects.select_related('employee').get(id=id)
        except GratuityEmployeeForm.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        system_days = _get_unpaid_leave_days_system(gratuity.employee, gratuity.b_id)
        gratuity.unpaid_leave_days_system = system_days
        gratuity.unpaid_leave_last_synced = timezone.now().date()
        gratuity.save(update_fields=['unpaid_leave_days_system', 'unpaid_leave_last_synced'])
        return Response({
            'unpaid_leave_days_system': system_days,
            'unpaid_leave_last_synced': gratuity.unpaid_leave_last_synced,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['POST'], url_path='sync_debt')
    def sync_debt(self, request, client, *args, **kwargs):
        """Sync outstanding advance balance from Advance records."""
        from hrm_main.api.gratuity.gratuity_router import _get_outstanding_advance, _get_advance_refs
        id = request.data.get('id')
        if not id:
            return Response({"error": "ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            gratuity = GratuityEmployeeForm.objects.select_related('employee').get(id=id)
        except GratuityEmployeeForm.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        debt = _get_outstanding_advance(gratuity.employee)
        refs = _get_advance_refs(gratuity.employee)
        gratuity.debt_deduction        = debt
        gratuity.debt_deduction_remark = refs
        gratuity.save(update_fields=['debt_deduction', 'debt_deduction_remark'])
        return Response({
            'debt_deduction':        debt,
            'debt_deduction_remark': refs,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='print')
    def print(self, request, pk=None, client=None, *args, **kwargs):
        import datetime as _dt
        from branch.models import Branch
        from print_management.print_utils.template_resolver import resolve_template
        from print_management.print_utils.pdf_renderer import render_pdf_from_template

        instance = self.get_object()
        b_id = request.query_params.get('b_id') or str(instance.b_id or '')

        def fmt_date(d):
            return d.strftime('%d-%b-%Y') if d else '-'

        def fmt_amount(v):
            try:
                return f'{float(v):,.2f}' if v is not None else '0.00'
            except (TypeError, ValueError):
                return '0.00'

        # â”€â”€ branch / company info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        branch              = Branch.objects.filter(id=b_id).first() if b_id else None
        company_name        = (branch.branch_name         or '') if branch else ''
        company_name_arabic = (branch.company_name_arabic or '') if branch else ''
        branch_address      = (branch.registered_address  or '') if branch else ''
        vat_no              = (branch.gst_no               or '') if branch else ''
        phone_no            = (branch.phone_no             or '') if branch else ''
        email               = (branch.email                or '') if branch else ''
        logo_base64         = (branch.images               or '') if branch else ''

        # â”€â”€ employee info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        emp           = instance.employee
        employee_code = (emp.employee_code or '') if emp else ''
        employee_name = (f"{emp.first_name or ''} {emp.last_name or ''}".strip()) if emp else ''
        department    = ''
        designation   = ''
        nationality   = ''
        emirates_id   = ''
        doj           = fmt_date(emp.doj if emp else None)
        if emp:
            try:
                department = emp.department.department_name if emp.department else ''
            except Exception:
                pass
            try:
                designation = emp.designation.designation_name if emp.designation else ''
            except Exception:
                pass
            nationality = getattr(emp, 'nationality', '') or ''
            emirates_id = getattr(emp, 'emirates_id', '') or getattr(emp, 'national_id', '') or ''

        # â”€â”€ display labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        CALC_TYPE_LABELS = {
            'estimate':           'Estimate',
            'final_separation':   'Final Separation',
            'transfer_settlement':'Transfer Settlement',
            'liability_transfer': 'Liability Transfer',
        }
        TERMINATION_LABELS = {
            'normal':     'Normal / Resignation',
            'article_44': 'Terminated â€“ Article 44 (Non-Assault)',
            'article_54': 'Terminated â€“ Article 54 (Gross Misconduct)',
        }
        NOTICE_LABELS = {
            'served':     'Served',
            'waived':     'Waived',
            'not_served': 'Not Served',
            'na':         'N/A',
        }
        CAP_LABELS = {
            'inherit': 'As per Branch Setting',
            'on':      'Forced ON',
            'off':     'Forced OFF (Special Contract)',
        }
        STATUS_LABELS = {
            'draft':       'Draft',
            'calculated':  'Calculated',
            'submitted':   'Submitted',
            'under_review':'Under Review',
            'approved':    'Approved',
            'rejected':    'Rejected',
            'posted':      'Posted',
            'paid':        'Paid / Settled',
            'reversed':    'Reversed',
            'cancelled':   'Cancelled',
        }

        # â”€â”€ approval trail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        approval_stages  = []
        approval_remarks = ''
        try:
            stages_qs = instance.approval_stages.order_by('created')
            for i, stage in enumerate(stages_qs, start=1):
                actioned_by = ''
                try:
                    actioned_by = stage.user_modified or stage.user_created or ''
                    import re as _re
                    actioned_by = _re.sub(r'\s*\(.*?\)\s*$', '', actioned_by).strip()
                except Exception:
                    pass
                approval_stages.append({
                    'seq':          i,
                    'stage_name':   getattr(stage, 'stage_name', '') or getattr(stage, 'approval_stage', '') or f'Stage {i}',
                    'status':       stage.approval_status or '-',
                    'actioned_by':  actioned_by or '-',
                    'actioned_date':fmt_date(getattr(stage, 'approval_date', None) or stage.modified.date() if stage.modified else None),
                    'comments':     stage.comments or '',
                })
            # Collect last non-empty approval remark
            for stage_data in reversed(approval_stages):
                if stage_data['comments']:
                    approval_remarks = stage_data['comments']
                    break
        except Exception:
            pass

        context = {
            # Company
            'company_name':         company_name,
            'company_name_arabic':  company_name_arabic,
            'branch_address':       branch_address,
            'vat_no':               vat_no,
            'phone_no':             phone_no,
            'email':                email,
            'logo_base64':          logo_base64,
            'currency':             'AED',

            # Form identity
            'form_number':          instance.form_number or f'GF-{str(instance.id)[:8]}',
            'print_date':           fmt_date(_dt.date.today()),

            # Employee
            'employee_code':        employee_code or '-',
            'employee_name':        employee_name or '-',
            'department':           department    or '-',
            'designation':          designation   or '-',
            'nationality':          nationality   or '-',
            'emirates_id':          emirates_id   or '-',
            'doj':                  doj,
            'doc':                  fmt_date(instance.doc or (emp.doc if emp else None)),
            'dor':                  fmt_date(instance.dor or (emp.dor if emp else None)),
            'settlement_due_date':  fmt_date(instance.settlement_due_date),

            # Gratuity fields
            'calculation_type_display':      CALC_TYPE_LABELS.get(instance.calculation_type or '', instance.calculation_type or '-'),
            'termination_reason_display':    TERMINATION_LABELS.get(instance.termination_reason or '', instance.termination_reason or '-'),
            'notice_completion_status_display': NOTICE_LABELS.get(instance.notice_completion_status or '', instance.notice_completion_status or '-'),
            'override_cap_display':          CAP_LABELS.get(instance.override_statutory_cap or 'inherit', '-'),
            'present_basic_pay':             fmt_amount(instance.present_basic_pay),
            'salary_source':                 'Manual (HR Override)' if instance.basic_salary_manual_override else 'Auto (Payroll)',
            'service_years_display':         instance.service_years_display or instance.service_years or '-',
            'consider_unpaid_leave':         instance.consider_unpaid_leave,
            'unpaid_leave_days_total':       instance.unpaid_leave_days_total or 0,
            'unpaid_leave_days_manual':      instance.unpaid_leave_days_manual or 0,
            'unpaid_leave_days_system':      instance.unpaid_leave_days_system or 0,
            'total_gratuity_yearly':         fmt_amount(instance.total_gratuity_yearly),
            'total_gratuity_monthly':        fmt_amount(instance.total_gratuity_monthly),
            'net_gratuity_payable':          fmt_amount(instance.net_gratuity_payable),
            'debt_deduction':                fmt_amount(instance.debt_deduction),
            'debt_deduction_remark':         instance.debt_deduction_remark or '',
            'gross_gratuity_before_forfeiture': fmt_amount(instance.gross_gratuity_before_forfeiture),
            'residual_employee_debt':        fmt_amount(instance.residual_employee_debt),
            'gratuity_forfeited':            instance.gratuity_forfeited,
            'forfeiture_ref':                instance.forfeiture_ref or '',
            'calculation_remarks':           instance.calculation_remarks or '',
            'status':                        instance.status or 'draft',
            'status_display':                STATUS_LABELS.get(instance.status or 'draft', instance.status or 'Draft'),
            'approval_status':               instance.approval_status or '-',

            # Approval trail
            'approval_stages':               approval_stages,
            'approval_remarks':              approval_remarks,
        }

        template_obj = resolve_template(
            'GRATUITY_FORM',
            effective_date=_dt.date.today(),
        )
        if not template_obj:
            return Response(
                {'error': 'Print template not found. Run: python manage.py seed_gratuity_form_template'},
                status=404,
            )

        filename = f"Gratuity_Form_{instance.form_number or str(instance.id)[:8]}.pdf"
        pdf_options = {
            'page-size':     'A4',
            'encoding':      'UTF-8',
            'zoom':          '1.0',
            'no-outline':    None,
            'margin-top':    '12mm',
            'margin-bottom': '12mm',
            'margin-left':   '14mm',
            'margin-right':  '14mm',
        }
        return render_pdf_from_template(template_obj, context, filename, inline=True, pdf_options=pdf_options)


class SalaryCalculationViewSet(viewsets.ModelViewSet):
    queryset = SalaryCalculation.objects.all().order_by('-modified')
    serializer_class = SalaryCalculationSerializer
    search_fields = ['employee_type', 'approval_status', 'from_date', 'to_date']
    filterset_fields = {
        'id': ['exact', 'in'],
        "from_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "to_date": ['exact', 'gte', 'lte', 'gt', 'lt'],

        "is_active": ['exact'],
        "b_id": ['exact'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                            'iendswith'],

    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(SalaryCalculation, SalaryCalculationSerializer,
                                                required_fields.split(','))
        return serializers.SalaryCalculationSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    def _salary_export_data(self, pk, selected_fields):
        """Fetch saved salary record and return (instance, title_line1, title_line2, branch_name, columns, rows)."""
        from branch.models import Branch
        from hrm_main.api.serializers import EmployeeListSerializer
        from datetime import date as _date

        instance = SalaryCalculation.objects.get(pk=pk)
        b_id = getattr(instance, 'b_id', None)
        try:
            branch = Branch.objects.get(id=b_id) if b_id else None
            branch_name = branch.branch_name if branch else ''
        except Exception:
            branch_name = ''

        MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
        month = getattr(instance, 'month', None)
        year  = _date.today().year

        # Line 1: branch / company name
        title_line1 = branch_name or 'Salary Register'

        # Line 2: period description with year
        if month:
            title_line2 = f'Salary Register for the Month of {MONTHS[int(month)-1]} {year}'
        else:
            fd = str(getattr(instance, 'from_date', '') or '')
            td = str(getattr(instance, 'to_date', '') or '')
            title_line2 = f'Salary Register  {fd} to {td}'

        # Preserve the order employees were saved in (insertion/created order).
        emp_qs = instance.employee_list.all().order_by('created')
        live = {
            str(r['id']): (r['employee__department__department_name'] or '', r['employee__designation__designation_name'] or '')
            for r in emp_qs.values('id', 'employee__department__department_name', 'employee__designation__designation_name')
        }
        emp_rows = EmployeeListSerializer(emp_qs, many=True).data
        for row in emp_rows:
            dept_name, desig_name = live.get(str(row.get('id', '')), ('', ''))
            if dept_name:
                row['department'] = dept_name
            if desig_name:
                row['designation'] = desig_name
            # Combine first + last name into a single 'first_name' field for export
            fn = (row.get('first_name') or '').strip()
            ln = (row.get('last_name') or '').strip()
            row['first_name'] = f'{fn} {ln}'.strip()

        FIELD_HEADERS = {
            'employee_code':   'Emp Code',
            'first_name':      'Employee Name',
            'employee_type':   'Emp Type',
            'department':      'Department',
            'designation':     'Designation',
            'sponsors':        'Sponsor',
            'working_days':    'W.Days',
            'no_of_days':      'P.Days',
            'leave_days':      'Lv.Days',
            'basic':           'Basic',
            'variable':        'Variable',
            'gross_pay':       'Gross',
            'ot':              'OT',
            'bonus':           'Bonus',
            'other_incentive': 'Incentive',
            'lop_amount':      'LOP',
            'earned':          'Earned',
            'advance':         'Advance',
            'advance_emi':     'Adv.EMI',
            'advance_balance': 'Adv.Bal',
            'deductions_pay':  'Deduct.',
            'net_pay':         'Net Pay',
            'salary_status':   'Status',
            'remarks':         'Remarks',
        }

        if selected_fields:
            # last_name is merged into first_name â€” skip it to avoid a duplicate column
            columns = [{'field': f, 'header': FIELD_HEADERS.get(f, f.replace('_', ' ').title())}
                       for f in selected_fields if f in FIELD_HEADERS and f != 'last_name']
        else:
            columns = [{'field': k, 'header': v} for k, v in FIELD_HEADERS.items()]

        # Serial number always first
        columns = [{'field': '_sno', 'header': 'S.No'}] + columns

        # Always carry grouping fields on rows (even if not in displayed columns)
        # so the PDF can group correctly regardless of column selection.
        # _sno is assigned later (per-group in PDF, global here for Excel/other uses)
        GROUP_FIELDS = ('department', 'designation', 'sponsors')
        rows = []
        for i, row in enumerate(emp_rows):
            r = {'_sno': i + 1}
            r.update({col['field']: row.get(col['field'], '') for col in columns if col['field'] != '_sno'})
            for gf in GROUP_FIELDS:
                if gf not in r:
                    r[gf] = row.get(gf, '')
            rows.append(r)

        return instance, title_line1, title_line2, branch_name, columns, rows

    @action(detail=True, methods=['GET'], url_path='export_salary_excel')
    def export_salary_excel(self, request, client, pk=None):
        import io as _io
        selected_fields = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields.split(',')] if selected_fields else []

        instance, title_line1, title_line2, _, columns, rows = self._salary_export_data(pk, selected_fields)

        import pandas as pd
        from collections import OrderedDict
        ordered_rows = [OrderedDict((c['field'], r.get(c['field'], '')) for c in columns) for r in rows]
        df = pd.DataFrame(ordered_rows) if ordered_rows else pd.DataFrame(columns=[c['field'] for c in columns])
        df.fillna('', inplace=True)

        excel_file = _io.BytesIO()
        workbook  = xlsxwriter.Workbook(excel_file)
        worksheet = workbook.add_worksheet('Salary Register')

        title_format = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 12,
        })
        subtitle_format = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 10,
        })
        header_format = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
        })

        NUMERIC_FIELDS_XL = {
            'no_of_days', 'basic', 'variable', 'gross_pay', 'ot',
            'other_incentive', 'advance', 'advance_emi', 'lop_amount',
            'earned', 'deductions_pay', 'net_pay',
        }

        grand_total_format = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
            'num_format': '#,##0.00',
        })
        grand_label_format = workbook.add_format({
            'bold': True, 'align': 'left', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
        })

        n_cols = len(columns)
        worksheet.merge_range(0, 0, 0, n_cols - 1, title_line1,  title_format)
        worksheet.merge_range(1, 0, 1, n_cols - 1, title_line2, subtitle_format)
        for ci, col in enumerate(columns):
            worksheet.write(2, ci, col['header'], header_format)
        for ri, row in enumerate(df.values, start=3):
            worksheet.write_row(ri, 0, row)

        # Grand total row
        grand_row = 3 + len(rows)
        for ci, col in enumerate(columns):
            if ci == 0:
                worksheet.write(grand_row, ci, 'Grand Total', grand_label_format)
            elif col['field'] in NUMERIC_FIELDS_XL:
                total = sum(float(r.get(col['field'], 0) or 0) for r in rows)
                worksheet.write(grand_row, ci, round(total, 2), grand_total_format)
            else:
                worksheet.write(grand_row, ci, '', grand_total_format)

        workbook.close()
        excel_file.seek(0)
        salary_number = getattr(instance, 'salary_number', '') or ''
        response = HttpResponse(
            content=excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="Salary_{salary_number}.xlsx"'
        return response

    @action(detail=True, methods=['GET'], url_path='export_salary_pdf')
    def export_salary_pdf(self, request, client, pk=None):
        import io as _io
        from collections import OrderedDict
        from datetime import datetime as _dt
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas as _canvas

        selected_fields = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields.split(',')] if selected_fields else []

        instance, title_line1, title_line2, _, columns, rows = self._salary_export_data(pk, selected_fields)

        buffer = _io.BytesIO()
        styles = getSampleStyleSheet()
        BLUE    = colors.HexColor('#004a7c')
        WHITE   = colors.white
        LIGHT   = colors.HexColor('#F2F2F2')
        GREY    = colors.HexColor('#CCCCCC')
        DEPT_BG = colors.HexColor('#E0E0E0')
        TOTAL_BG= colors.HexColor('#D6E4F0')
        BLACK   = colors.black

        PAGE_W, PAGE_H = landscape(A4)
        MARGIN = 6 * mm
        FOOTER_H = 14 * mm
        usable_w = PAGE_W - 2 * MARGIN

        from reportlab.pdfbase.pdfmetrics import stringWidth

        NUMERIC_FIELDS = {
            'no_of_days', 'basic', 'variable', 'gross_pay', 'ot',
            'other_incentive', 'advance', 'advance_emi', 'lop_amount',
            'earned', 'deductions_pay', 'net_pay', 'working_days',
            'leave_days', 'bonus', 'advance_balance',
        }
        TEXT_FIELDS = {'first_name', 'employee_code', 'department',
                       'designation', 'employee_type', 'sponsors', 'remarks', 'salary_status'}

        CELL_FONT      = 'Helvetica'
        HEADER_FONT    = 'Helvetica-Bold'
        CELL_FONT_SIZE = 8
        PAD            = 8  # left+right padding in points

        def _fmt_num(val):
            """Format with commas as thousands separator (1,567,100)."""
            try:
                f = float(val or 0)
                return f'{int(f):,}' if f == int(f) else f'{f:,.2f}'
            except Exception:
                return str(val or '')

        # Measure widest content per column (header vs all data values + grand total)
        col_count  = len(columns)
        col_widths = []

        # Pre-compute per-group totals so we measure the largest group total too
        group_totals = {}
        for row in rows:
            key = row.get('department') or row.get('designation') or row.get('sponsors') or 'all'
            for f in NUMERIC_FIELDS:
                try:
                    group_totals.setdefault(key, {}).setdefault(f, 0)
                    group_totals[key][f] += float(row.get(f, 0) or 0)
                except Exception:
                    pass

        for col in columns:
            field = col['field']
            w = stringWidth(col['header'], HEADER_FONT, CELL_FONT_SIZE) + PAD
            if field == '_sno':
                w = max(w, stringWidth(str(len(rows)), CELL_FONT, CELL_FONT_SIZE) + PAD)
                w = max(w, 16)
            elif field in NUMERIC_FIELDS:
                # Measure each row value (regular font)
                for row in rows:
                    w = max(w, stringWidth(_fmt_num(row.get(field, 0)), CELL_FONT, CELL_FONT_SIZE) + PAD)
                # Measure each group subtotal (bold â€” use HEADER_FONT + extra pad)
                for gt in group_totals.values():
                    w = max(w, stringWidth(_fmt_num(gt.get(field, 0)), HEADER_FONT, CELL_FONT_SIZE) + PAD + 4)
                # Measure grand total (bold â€” use HEADER_FONT + extra pad)
                grand_val = sum(float(r.get(field, 0) or 0) for r in rows)
                w = max(w, stringWidth(_fmt_num(grand_val), HEADER_FONT, CELL_FONT_SIZE) + PAD + 4)
            elif field in TEXT_FIELDS:
                MAX_TEXT = {'first_name': 130, 'department': 90,
                            'designation': 90, 'employee_code': 48, 'employee_type': 65,
                            'sponsors': 65, 'salary_status': 52, 'remarks': 80}
                w = MAX_TEXT.get(field, 80)
            col_widths.append(w)

        assigned_total = sum(col_widths)
        if assigned_total < usable_w:
            # Distribute remaining space only to text columns
            leftover = usable_w - assigned_total
            text_idxs = [i for i, col in enumerate(columns) if col['field'] in TEXT_FIELDS]
            text_total = sum(col_widths[i] for i in text_idxs)
            if text_total > 0:
                for i in text_idxs:
                    col_widths[i] += leftover * (col_widths[i] / text_total)
        elif assigned_total > usable_w:
            scale = usable_w / assigned_total
            col_widths = [w * scale for w in col_widths]

        # Keep references for left-align styling
        sno_col_idx  = next((i for i, c in enumerate(columns) if c['field'] == '_sno'), None)
        name_col_idx = next((i for i, c in enumerate(columns) if c['field'] == 'first_name'), None)

        # Paragraph styles
        title1_style = ParagraphStyle('t1', parent=styles['Normal'],
                                      fontSize=11, fontName='Helvetica-Bold',
                                      alignment=1, spaceAfter=2)
        title2_style = ParagraphStyle('t2', parent=styles['Normal'],
                                      fontSize=10, fontName='Helvetica-Bold',
                                      alignment=1, spaceAfter=6)
        dept_style   = ParagraphStyle('dept', parent=styles['Normal'],
                                      fontSize=8.5, fontName='Helvetica-Bold',
                                      alignment=0, leftIndent=2)
        cell_style   = ParagraphStyle('cell', parent=styles['Normal'],
                                      fontSize=8, fontName='Helvetica',
                                      alignment=1, leading=9, wordWrap=None, splitLongWords=0)
        name_style   = ParagraphStyle('name', parent=styles['Normal'],
                                      fontSize=8, fontName='Helvetica',
                                      alignment=0, leading=9, wordWrap='LTR')
        total_style  = ParagraphStyle('tot', parent=styles['Normal'],
                                      fontSize=8, fontName='Helvetica-Bold',
                                      alignment=1, leading=9, wordWrap=None, splitLongWords=0)
        grand_style  = ParagraphStyle('grand', parent=styles['Normal'],
                                      fontSize=8.5, fontName='Helvetica-Bold',
                                      alignment=1, leading=9, textColor=WHITE,
                                      wordWrap=None, splitLongWords=0)

        # â”€â”€ Determine grouping from saved filter_criteria on the record â”€â”€â”€â”€â”€â”€â”€â”€â”€
        CRITERIA_GROUP_MAP = {
            'department':  ('department', 'Department'),
            'designation': ('designation', 'Designation'),
            'sponsor':     ('sponsors',    'Sponsor'),
        }
        criteria = getattr(instance, 'filter_criteria', None) or ''
        group_field, group_label = CRITERIA_GROUP_MAP.get(criteria, ('department', 'Department'))

        header_row    = [Paragraph(col['header'], ParagraphStyle('h', parent=styles['Normal'],
                          fontSize=8, fontName='Helvetica-Bold', alignment=1,
                          textColor=WHITE, leading=9)) for col in columns]
        table_data      = [header_row]
        dept_row_idxs   = []
        data_row_idxs   = []
        total_row_idxs  = []
        grand_row_idx   = []
        total_span_cmds = []

        # Accumulates across all groups for the grand total
        grand_totals = {col['field']: 0.0 for col in columns if col['field'] in NUMERIC_FIELDS}

        def _render_data_rows(row_list, sno_start=1):
            """Render data rows; S.No starts at sno_start within each group."""
            totals = {col['field']: 0.0 for col in columns if col['field'] in NUMERIC_FIELDS}
            for sno_offset, row in enumerate(row_list):
                data_row_idxs.append(len(table_data))
                row_cells = []
                for col in columns:
                    if col['field'] == '_sno':
                        row_cells.append(Paragraph(str(sno_start + sno_offset), cell_style))
                    elif col['field'] == 'first_name':
                        val = row.get(col['field'], '') or ''
                        row_cells.append(Paragraph(str(val), name_style))
                    elif col['field'] in NUMERIC_FIELDS:
                        val = row.get(col['field'], 0)
                        row_cells.append(Paragraph(_fmt_num(val), cell_style))
                    else:
                        val = row.get(col['field'], '') or ''
                        row_cells.append(Paragraph(str(val), cell_style))
                    if col['field'] in totals:
                        try:
                            totals[col['field']] += float(row.get(col['field'], 0) or 0)
                        except (ValueError, TypeError):
                            pass
                table_data.append(row_cells)
            # Accumulate into grand totals
            for f, v in totals.items():
                grand_totals[f] = grand_totals.get(f, 0.0) + v
            return totals

        def _append_total_row(totals, label='Total'):
            ri = len(table_data)
            total_row_idxs.append(ri)
            # Span label across first 2 cols so it doesn't wrap in the narrow S.No column
            total_cells = [Paragraph(label, total_style), '']
            for col in columns[2:]:
                if col['field'] in totals:
                    total_cells.append(Paragraph(_fmt_num(totals[col['field']]), total_style))
                else:
                    total_cells.append('')
            table_data.append(total_cells)
            # Apply span for label cols
            total_span_cmds.append(('SPAN', (0, ri), (1, ri)))

        def _append_grand_total_row():
            ri = len(table_data)
            grand_row_idx.append(ri)
            cells = [Paragraph('Grand Total', grand_style), '']
            for col in columns[2:]:
                if col['field'] in grand_totals:
                    cells.append(Paragraph(_fmt_num(grand_totals[col['field']]), grand_style))
                else:
                    cells.append('')
            table_data.append(cells)
            total_span_cmds.append(('SPAN', (0, ri), (1, ri)))

        if criteria in CRITERIA_GROUP_MAP:
            # Grouped mode: S.No resets to 1 for each group
            groups = OrderedDict()
            for row in rows:
                key = str(row.get(group_field, '') or 'Unassigned')
                groups.setdefault(key, []).append(row)

            for group_name, group_rows in groups.items():
                dept_row_idxs.append(len(table_data))
                dept_label = Paragraph(f'{group_label}:  <b>{group_name.upper()}</b>', dept_style)
                table_data.append([dept_label] + ['' for _ in range(col_count - 1)])
                totals = _render_data_rows(group_rows, sno_start=1)
                _append_total_row(totals)

            # Grand total after all groups
            _append_grand_total_row()
        else:
            # Flat mode (none / employee_wise / employee_type): single sequence, one total
            totals = _render_data_rows(rows, sno_start=1)
            _append_total_row(totals, label='Grand Total')

        # â”€â”€ Style commands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        style_cmds = [
            ('BACKGROUND',    (0, 0), (-1, 0), BLUE),
            ('TEXTCOLOR',     (0, 0), (-1, 0), WHITE),
            ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0, 0), (-1, -1), 8),
            ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID',          (0, 0), (-1, -1), 0.3, GREY),
            ('TOPPADDING',    (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING',   (0, 0), (-1, -1), 3),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 3),
        ]

        for ri in dept_row_idxs:
            style_cmds += [
                ('BACKGROUND',    (0, ri), (-1, ri), DEPT_BG),
                ('ALIGN',         (0, ri), (-1, ri), 'LEFT'),
                ('SPAN',          (0, ri), (-1, ri)),
                ('TOPPADDING',    (0, ri), (-1, ri), 3),
                ('BOTTOMPADDING', (0, ri), (-1, ri), 3),
            ]

        for ri in total_row_idxs:
            style_cmds += [
                ('BACKGROUND',    (0, ri), (-1, ri), TOTAL_BG),
                ('FONTNAME',      (0, ri), (-1, ri), 'Helvetica-Bold'),
                ('ALIGN',         (0, ri), (1,  ri), 'LEFT'),
                ('TOPPADDING',    (0, ri), (-1, ri), 4),
                ('BOTTOMPADDING', (0, ri), (-1, ri), 4),
                ('MINROWHEIGHT',  (0, ri), (-1, ri), 14),
            ]

        GRAND_BG = colors.HexColor('#004a7c')
        for ri in grand_row_idx:
            style_cmds += [
                ('BACKGROUND',    (0, ri), (-1, ri), GRAND_BG),
                ('TEXTCOLOR',     (0, ri), (-1, ri), WHITE),
                ('FONTNAME',      (0, ri), (-1, ri), 'Helvetica-Bold'),
                ('FONTSIZE',      (0, ri), (-1, ri), 8),
                ('ALIGN',         (0, ri), (1,  ri), 'LEFT'),
                ('TOPPADDING',    (0, ri), (-1, ri), 4),
                ('BOTTOMPADDING', (0, ri), (-1, ri), 4),
            ]

        last_name_col_idx = next((i for i, c in enumerate(columns) if c['field'] == 'last_name'), None)
        for idx, ri in enumerate(data_row_idxs):
            bg = WHITE if idx % 2 == 0 else LIGHT
            style_cmds.append(('BACKGROUND', (0, ri), (-1, ri), bg))
            if name_col_idx is not None:
                style_cmds.append(('ALIGN', (name_col_idx, ri), (name_col_idx, ri), 'LEFT'))
            if last_name_col_idx is not None:
                style_cmds.append(('ALIGN', (last_name_col_idx, ri), (last_name_col_idx, ri), 'LEFT'))

        # Apply label spans (Total / Grand Total label across S.No + next col)
        style_cmds += total_span_cmds

        table = Table(table_data, colWidths=col_widths, repeatRows=1, splitByRow=True)
        table.setStyle(TableStyle(style_cmds))

        # â”€â”€ Page footer callback (Prepared By / Checked By / Approved By + page) â”€â”€
        now_str = _dt.now().strftime('%d/%m/%Y %I:%M:%S %p')

        def draw_footer(canv, doc):
            canv.saveState()
            cx   = PAGE_W / 2
            base = MARGIN + 1 * mm

            # Separator line
            canv.setStrokeColor(GREY)
            canv.setLineWidth(0.5)
            canv.line(MARGIN, base + 16 * mm, PAGE_W - MARGIN, base + 16 * mm)

            # Labels â€” bold
            canv.setFont('Helvetica-Bold', 7.5)
            canv.setFillColor(BLACK)
            canv.drawString(MARGIN,              base + 12 * mm, 'Prepared By')
            canv.drawCentredString(cx,           base + 12 * mm, 'Checked By')
            canv.drawRightString(PAGE_W - MARGIN, base + 12 * mm, 'Approved By')

            # Signature lines
            canv.setStrokeColor(BLACK)
            canv.setLineWidth(0.4)
            sig_len = 40 * mm
            canv.line(MARGIN,          base + 5 * mm, MARGIN + sig_len,          base + 5 * mm)
            canv.line(cx - sig_len/2,  base + 5 * mm, cx + sig_len/2,            base + 5 * mm)
            canv.line(PAGE_W - MARGIN - sig_len, base + 5 * mm, PAGE_W - MARGIN, base + 5 * mm)

            # Page number + date â€” smaller, grey, below signature lines
            canv.setFont('Helvetica', 6.5)
            canv.setFillColor(colors.HexColor('#555555'))
            canv.drawCentredString(cx,            base + 1.5 * mm, f'Page {canv.getPageNumber()}')
            canv.drawRightString(PAGE_W - MARGIN, base + 1.5 * mm, now_str)

            canv.restoreState()

        doc = SimpleDocTemplate(
            buffer, pagesize=landscape(A4),
            leftMargin=MARGIN, rightMargin=MARGIN,
            topMargin=8 * mm, bottomMargin=FOOTER_H + MARGIN,
        )

        story = [
            Paragraph(title_line1, title1_style),
            Paragraph(title_line2, title2_style),
            Spacer(1, 2 * mm),
            table,
        ]
        doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)

        buffer.seek(0)
        salary_number = getattr(instance, 'salary_number', '') or ''
        response = HttpResponse(content=buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Salary_{salary_number}.pdf"'
        return response

    @action(detail=False, methods=['GET'], url_path='warningMessage')
    def warningMessage(self, request, client):
        import calendar as _calendar
        from datetime import date as _date
        employeeType = request.query_params.get('employeeType')
        fromDate = request.query_params.get('fromDate')
        month    = request.query_params.get('month')

        if fromDate and fromDate not in ('null', 'undefined', ''):
            fromDate = datetime.strptime(fromDate, '%d-%m-%Y')
        elif month:
            m = int(month)
            year = _date.today().year
            fromDate = datetime(year, m, 1)
        else:
            fromDate = None

        if fromDate and employeeType:
            existing_calculations = SalaryCalculation.objects.filter(
                employee_type__contains=employeeType,
                from_date__month=fromDate.month,
                from_date__year=fromDate.year,
            )
            # print("g",existing_calculations.count(),(existing_calculations.count() > 1) , not (
            #             existing_calculations.first().approval_status == 'PENDING_APPROVAL' and
            #             existing_calculations.count() == 1
            #     ))
            response = ""
            if existing_calculations.exists():

                if (existing_calculations.count() > 1) or not (
                        existing_calculations.first().approval_status == 'PENDING_APPROVAL' and
                        existing_calculations.count() == 1
                ):
                    response = "More than one calculation exists for this employee type and date range. Please review."

            return Response({'message': response})

    def _consolidated_export_data(self, request, selected_fields=None):
        """Return (title_line1, title_line2, columns, rows, group_by) for APPROVED EmployeeList records.
        Filters: b_id, year, from_month, to_month, employee_id, department, designation."""
        from hrm_main.api.serializers import EmployeeListSerializer
        from branch.models import Branch

        b_id     = request.query_params.get('b_id', '')
        year     = request.query_params.get('year', '')
        month    = request.query_params.get('month', '')
        group_by = request.query_params.get('group_by', 'department')  # department | designation | sponsor | employee | all

        # Map group_by param to the row field used for grouping
        GROUP_FIELD_MAP = {
            'department':  'department',
            'designation': 'designation',
            'sponsor':     'sponsors',
        }
        group_field = GROUP_FIELD_MAP.get(group_by)  # None means no grouping (employee / all)

        GROUP_LABEL_MAP = {
            'department':  'Department',
            'designation': 'Designation',
            'sponsor':     'Sponsor',
        }
        group_label = GROUP_LABEL_MAP.get(group_by, '')

        qs = EmployeeList.objects.filter(salary__approval_status='APPROVED')
        if b_id:
            qs = qs.filter(b_id=b_id)
        if year:
            qs = qs.filter(from_date__year=int(year))
        if month:
            qs = qs.filter(from_date__month=int(month))


        try:
            branch      = Branch.objects.get(id=b_id) if b_id else None
            branch_name = branch.branch_name if branch else ''
        except Exception:
            branch_name = ''

        MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']
        title_line1 = branch_name or 'Consolidated Payslip'
        if year and month:
            title_line2 = f'Consolidated Payslip â€” {MONTHS[int(month)-1]} {year}'
        elif year:
            title_line2 = f'Consolidated Payslip â€” {year}'
        else:
            title_line2 = 'Consolidated Payslip'

        emp_rows = list(EmployeeListSerializer(qs.order_by('id'), many=True).data)

        # Build per-employee allowance totals for the selected month
        allowance_map = {}
        if year and month:
            import datetime as _dt
            import calendar as _cal
            from hrm_master.models import AllowanceAssignment
            from django.db.models import Sum, Q as _Q
            period_start = _dt.date(int(year), int(month), 1)
            last_day = _cal.monthrange(int(year), int(month))[1]
            period_end = _dt.date(int(year), int(month), last_day)
            agg_qs = (AllowanceAssignment.objects
                .filter(is_active=True, approval_status='APPROVED')
                .filter(_Q(from_date__lte=period_end) & (_Q(to_date__gte=period_start) | _Q(to_date__isnull=True)))
                .values('employee_id')
                .annotate(total=Sum('amount')))
            if b_id:
                agg_qs = agg_qs.filter(b_id=b_id)
            allowance_map = {str(row['employee_id']): float(row['total'] or 0) for row in agg_qs}

        FIELD_HEADERS = {
            'employee_code':   'Emp Code',
            'first_name':      'Employee Name',
            'employee_type':   'Employee Type',
            'department':      'Department',
            'designation':     'Designation',
            'sponsors':        'Sponsor',
            'from_date':       'From Date',
            'to_date':         'To Date',
            'working_days':    'Working Days',
            'no_of_days':      'Payable Days',
            'leave_days':      'Leave Days',
            'basic':           'Basic',
            'variable':        'Variable',
            'gross_pay':       'Gross Pay',
            'ot':              'OT',
            'bonus':           'Bonus',
            'other_incentive': 'Other Incentives',
            'lop_amount':      'LOP Amount',
            'earned':          'Earned',
            'advance':         'Advance',
            'advance_emi':     'Advance EMI',
            'advance_balance': 'Advance Balance',
            'deductions_pay':  'Deduction Pay',
            'other_allowances': 'Other Allowances',
            'net_pay':         'Net Pay',
            'salary_status':   'Status',
            'remarks':         'Remarks',
        }

        if selected_fields:
            columns = [{'field': f, 'header': FIELD_HEADERS.get(f, f.replace('_', ' ').title())}
                       for f in selected_fields if f in FIELD_HEADERS]
        else:
            columns = [{'field': k, 'header': v} for k, v in FIELD_HEADERS.items()]

        columns = [{'field': '_sno', 'header': 'S.No'}] + columns

        # Always carry grouping fields on rows (even if not in displayed columns)
        # so PDF grouping is correct regardless of column selection.
        GROUP_FIELDS = ('department', 'designation', 'sponsors')
        rows = []
        for i, row in enumerate(emp_rows):
            r = {'_sno': i + 1}
            r.update({col['field']: row.get(col['field'], '') for col in columns if col['field'] != '_sno'})
            for gf in GROUP_FIELDS:
                if gf not in r:
                    r[gf] = row.get(gf, '')
            emp_id = str(row.get('employee') or row.get('employee_id') or row.get('id') or '')
            r['other_allowances'] = allowance_map.get(emp_id, 0)
            rows.append(r)

        return title_line1, title_line2, columns, rows, group_field, group_label

    @action(detail=False, methods=['GET'], url_path='consolidated_payslip_list')
    def consolidated_payslip_list(self, request, client):
        _, _, columns, rows, group_field, _ = self._consolidated_export_data(request)
        result_columns = [c for c in columns if c['field'] != '_sno']
        # Strip hidden grouping fields not in columns; keep display fields only
        display_fields = {c['field'] for c in result_columns}
        result_rows = [
            {k: v for k, v in row.items() if k != '_sno' and k in display_fields}
            for row in rows
        ]
        return Response({'columns': result_columns, 'rows': result_rows, 'count': len(result_rows)})

    @action(detail=False, methods=['GET'], url_path='consolidated_payslip_excel')
    def consolidated_payslip_excel(self, request, client):
        import io as _io
        from collections import OrderedDict

        selected_fields = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields.split(',')] if selected_fields else []
        title_line1, title_line2, columns, rows, _, _ = self._consolidated_export_data(request, selected_fields)

        import pandas as pd
        ordered_rows = [OrderedDict((c['field'], r.get(c['field'], '')) for c in columns) for r in rows]
        df = pd.DataFrame(ordered_rows) if ordered_rows else pd.DataFrame(columns=[c['field'] for c in columns])
        df.fillna('', inplace=True)

        excel_file = _io.BytesIO()
        workbook   = xlsxwriter.Workbook(excel_file)
        worksheet  = workbook.add_worksheet('Consolidated Payslip')

        title_format    = workbook.add_format({'bold': True, 'align': 'center', 'valign': 'vcenter',
                                               'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 12})
        subtitle_format = workbook.add_format({'bold': True, 'align': 'center', 'valign': 'vcenter',
                                               'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 10})
        header_format   = workbook.add_format({'bold': True, 'align': 'center', 'valign': 'vcenter',
                                               'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF'})

        n_cols = len(columns)
        worksheet.merge_range(0, 0, 0, n_cols - 1, title_line1,  title_format)
        worksheet.merge_range(1, 0, 1, n_cols - 1, title_line2, subtitle_format)
        for ci, col in enumerate(columns):
            worksheet.write(2, ci, col['header'], header_format)
        for ri, row in enumerate(df.values, start=3):
            worksheet.write_row(ri, 0, row)

        workbook.close()
        excel_file.seek(0)
        response = HttpResponse(
            content=excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="Consolidated_Payslip.xlsx"'
        return response

    @action(detail=False, methods=['GET'], url_path='consolidated_payslip_pdf')
    def consolidated_payslip_pdf(self, request, client):
        import io as _io
        from collections import OrderedDict
        from datetime import datetime as _dt
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm

        selected_fields = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields.split(',')] if selected_fields else []
        title_line1, title_line2, columns, rows, group_field, group_label = self._consolidated_export_data(request, selected_fields)

        buffer = _io.BytesIO()
        styles = getSampleStyleSheet()
        BLUE    = colors.HexColor('#004a7c')
        WHITE   = colors.white
        LIGHT   = colors.HexColor('#F2F2F2')
        GREY    = colors.HexColor('#CCCCCC')
        DEPT_BG = colors.HexColor('#E0E0E0')
        TOTAL_BG= colors.HexColor('#D6E4F0')

        PAGE_W, PAGE_H = landscape(A4)
        MARGIN   = 6 * mm
        FOOTER_H = 14 * mm
        usable_w = PAGE_W - 2 * MARGIN
        col_count    = len(columns)
        SNO_W        = 8 * mm
        NAME_W       = 38 * mm
        sno_col_idx  = next((i for i, c in enumerate(columns) if c['field'] == '_sno'), None)
        name_col_idx = next((i for i, c in enumerate(columns) if c['field'] == 'first_name'), None)
        fixed_w      = (SNO_W if sno_col_idx is not None else 0) + (NAME_W if name_col_idx is not None else 0)
        fixed_count  = (1 if sno_col_idx is not None else 0) + (1 if name_col_idx is not None else 0)
        remaining    = max(col_count - fixed_count, 1)
        base_width   = (usable_w - fixed_w) / remaining
        col_widths   = []
        for i in range(col_count):
            if i == sno_col_idx:   col_widths.append(SNO_W)
            elif i == name_col_idx: col_widths.append(NAME_W)
            else:                  col_widths.append(base_width)

        NUMERIC_FIELDS = {'no_of_days', 'basic', 'variable', 'gross_pay', 'ot',
                          'other_incentive', 'advance', 'advance_emi', 'lop_amount',
                          'deductions_pay', 'net_pay'}

        title1_style = ParagraphStyle('t1', parent=styles['Normal'], fontSize=11,
                                      fontName='Helvetica-Bold', alignment=1, spaceAfter=2)
        title2_style = ParagraphStyle('t2', parent=styles['Normal'], fontSize=10,
                                      fontName='Helvetica-Bold', alignment=1, spaceAfter=6)
        dept_style   = ParagraphStyle('dept', parent=styles['Normal'], fontSize=7,
                                      fontName='Helvetica-Bold', alignment=0, leftIndent=2)
        cell_style   = ParagraphStyle('cell', parent=styles['Normal'], fontSize=6.5,
                                      fontName='Helvetica', alignment=1, leading=8)
        name_style   = ParagraphStyle('name', parent=styles['Normal'], fontSize=6.5,
                                      fontName='Helvetica', alignment=0, leading=8, wordWrap='LTR')
        total_style  = ParagraphStyle('tot', parent=styles['Normal'], fontSize=6.5,
                                      fontName='Helvetica-Bold', alignment=1, leading=8)

        header_row = [Paragraph(col['header'], ParagraphStyle('h', parent=styles['Normal'],
                       fontSize=6.5, fontName='Helvetica-Bold', alignment=1,
                       textColor=WHITE, leading=8)) for col in columns]
        table_data     = [header_row]
        dept_row_idxs  = []
        data_row_idxs  = []
        total_row_idxs = []

        def _render_rows(row_list):
            """Append data rows into table_data, accumulate totals."""
            totals = {col['field']: 0.0 for col in columns if col['field'] in NUMERIC_FIELDS}
            for row in row_list:
                data_row_idxs.append(len(table_data))
                row_cells = []
                for col in columns:
                    val = row.get(col['field'], '') or ''
                    if col['field'] == 'first_name':
                        row_cells.append(Paragraph(str(val), name_style))
                    else:
                        row_cells.append(Paragraph(str(val), cell_style))
                    if col['field'] in totals:
                        try:
                            totals[col['field']] += float(val or 0)
                        except (ValueError, TypeError):
                            pass
                table_data.append(row_cells)
            return totals

        def _append_total_row(totals):
            total_row_idxs.append(len(table_data))
            total_cells = []
            for i, col in enumerate(columns):
                if i == 0:
                    total_cells.append(Paragraph('Total', total_style))
                elif col['field'] in totals:
                    total_cells.append(Paragraph(f"{totals[col['field']]:,.2f}", total_style))
                else:
                    total_cells.append('')
            table_data.append(total_cells)

        if group_field:
            # Grouped mode: department / designation / sponsor
            groups = OrderedDict()
            for row in rows:
                key = str(row.get(group_field, '') or 'Unassigned')
                groups.setdefault(key, []).append(row)

            for group_name, group_rows in groups.items():
                dept_row_idxs.append(len(table_data))
                dept_label = Paragraph(
                    f'{group_label}:  <b>{group_name.upper()}</b>', dept_style
                )
                table_data.append([dept_label] + ['' for _ in range(col_count - 1)])
                totals = _render_rows(group_rows)
                _append_total_row(totals)
        else:
            # Flat mode: all employees without group headers, single grand total
            totals = _render_rows(rows)
            _append_total_row(totals)

        style_cmds = [
            ('BACKGROUND',    (0, 0), (-1, 0), BLUE),
            ('TEXTCOLOR',     (0, 0), (-1, 0), WHITE),
            ('FONTNAME',      (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0, 0), (-1, -1), 6.5),
            ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID',          (0, 0), (-1, -1), 0.3, GREY),
            ('TOPPADDING',    (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING',   (0, 0), (-1, -1), 2),
            ('RIGHTPADDING',  (0, 0), (-1, -1), 2),
        ]
        for ri in dept_row_idxs:
            style_cmds += [('BACKGROUND', (0, ri), (-1, ri), DEPT_BG),
                           ('ALIGN',      (0, ri), (-1, ri), 'LEFT'),
                           ('SPAN',       (0, ri), (-1, ri)),
                           ('TOPPADDING', (0, ri), (-1, ri), 3),
                           ('BOTTOMPADDING', (0, ri), (-1, ri), 3)]
        for ri in total_row_idxs:
            style_cmds += [('BACKGROUND', (0, ri), (-1, ri), TOTAL_BG),
                           ('FONTNAME',   (0, ri), (-1, ri), 'Helvetica-Bold'),
                           ('TOPPADDING', (0, ri), (-1, ri), 3),
                           ('BOTTOMPADDING', (0, ri), (-1, ri), 3)]
        for idx, ri in enumerate(data_row_idxs):
            bg = WHITE if idx % 2 == 0 else LIGHT
            style_cmds.append(('BACKGROUND', (0, ri), (-1, ri), bg))
            if name_col_idx is not None:
                style_cmds.append(('ALIGN', (name_col_idx, ri), (name_col_idx, ri), 'LEFT'))

        table = Table(table_data, colWidths=col_widths, repeatRows=1, splitByRow=True)
        table.setStyle(TableStyle(style_cmds))

        now_str = _dt.now().strftime('%d/%m/%Y %I:%M:%S %p')

        def draw_footer(canv, doc):
            canv.saveState()
            cx   = PAGE_W / 2
            base = MARGIN + 1 * mm
            canv.setStrokeColor(GREY)
            canv.setLineWidth(0.5)
            canv.line(MARGIN, base + 16 * mm, PAGE_W - MARGIN, base + 16 * mm)
            canv.setFont('Helvetica-Bold', 7)
            canv.setFillColor(colors.HexColor('#333333'))
            for label, x in [('Prepared By', cx - 80 * mm), ('Checked By', cx), ('Approved By', cx + 80 * mm)]:
                canv.drawCentredString(x, base + 12 * mm, label)
                canv.line(x - 25 * mm, base + 5 * mm, x + 25 * mm, base + 5 * mm)
            canv.setFont('Helvetica', 6.5)
            canv.setFillColor(colors.HexColor('#555555'))
            canv.drawCentredString(cx,            base + 1.5 * mm, f'Page {canv.getPageNumber()}')
            canv.drawRightString(PAGE_W - MARGIN, base + 1.5 * mm, now_str)
            canv.restoreState()

        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                                leftMargin=MARGIN, rightMargin=MARGIN,
                                topMargin=8 * mm, bottomMargin=FOOTER_H + MARGIN)
        story = [Paragraph(title_line1, title1_style), Paragraph(title_line2, title2_style),
                 Spacer(1, 2 * mm), table]
        doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)

        buffer.seek(0)
        response = HttpResponse(content=buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Consolidated_Payslip.pdf"'
        return response


class SalaryHoldViewSet(viewsets.ModelViewSet):
    queryset         = SalaryHold.objects.all().order_by('-modified')
    serializer_class = SalaryHoldSerializer
    search_fields    = ['employee_names', 'reason', 'remarks']
    filterset_fields = {
        'b_id':           ['exact'],
        'is_active':      ['exact'],
        'hold_from_date': ['exact', 'gte', 'lte'],
        'hold_to_date':   ['exact', 'gte', 'lte'],
        'released_on':    ['isnull', 'exact'],
    }
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get('required_fields', '')
            return get_dynamic_serializer_class(SalaryHold, SalaryHoldSerializer, required_fields.split(','))
        return SalaryHoldSerializer


class OTSalaryCalculationViewSet(viewsets.ModelViewSet):
    queryset = OTSalaryCalculation.objects.all().order_by('-modified')
    serializer_class = OTSalaryCalculationSerializer
    filterset_fields = {
        'id': ['exact', 'in'],
        'from_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'to_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'is_active': ['exact'],
        'b_id': ['exact'],
        'approval_status': ['exact', 'iexact', 'contains', 'icontains'],
        'payroll_type': ['exact', 'iexact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['approval_status', 'from_date', 'to_date', 'payroll_type']

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(OTSalaryCalculation, OTSalaryCalculationSerializer,
                                                required_fields.split(','))
        return serializers.OTSalaryCalculationSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['GET'], url_path='get_ot_employees')
    def get_ot_employees(self, request, client):
        from_date    = request.query_params.get('from_date')
        to_date      = request.query_params.get('to_date')
        b_id         = request.query_params.get('b_id') or getattr(request, 'b_id', None)
        payroll_type = request.query_params.get('payroll_type', 'Operations')
        filter_type  = request.query_params.get('filter_type') or None
        filter_value = request.query_params.get('filter_value') or None

        if not from_date or not to_date:
            return Response({'error': 'from_date and to_date are required'}, status=status.HTTP_400_BAD_REQUEST)

        if payroll_type == 'All':
            from master.api.ot_all_service import ot_salary_calculation_all
            employee_list = ot_salary_calculation_all(
                from_date, to_date, b_id,
                filter_type=filter_type,
                filter_value=filter_value,
            )
        else:
            from master.api.ot_operations_service import ot_salary_calculation_operations
            employee_list = ot_salary_calculation_operations(from_date, to_date, b_id)

        return Response(employee_list)

    @action(detail=False, methods=['GET'], url_path='get_employee_breakdown')
    def get_employee_breakdown(self, request, client):
        """Return saved allowance_breakdown for a specific OTEmployeeList row."""
        ot_employee_list_id = request.query_params.get('ot_employee_list_id')
        if not ot_employee_list_id:
            return Response({'error': 'ot_employee_list_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            row = OTEmployeeList.objects.get(id=ot_employee_list_id)
        except OTEmployeeList.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'employee_code':       row.employee_code,
            'first_name':          row.first_name,
            'last_name':           row.last_name,
            'allowance_breakdown': row.allowance_breakdown or [],
        })

    @action(detail=True, methods=['GET'], url_path='export_ot_excel')
    def export_ot_excel(self, request, client, pk=None):
        import io as _io
        from branch.models import Branch
        from datetime import date as _date

        selected_fields = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields.split(',')] if selected_fields else []

        instance = OTSalaryCalculation.objects.get(pk=pk)
        b_id = getattr(instance, 'b_id', None)
        try:
            branch = Branch.objects.get(id=b_id) if b_id else None
            branch_name = branch.branch_name if branch else ''
        except Exception:
            branch_name = ''

        fd = str(instance.from_date or '')
        td = str(instance.to_date or '')
        title_line1 = branch_name or 'OT Payroll Register'
        title_line2 = f'OT Payroll Register  {fd} to {td}'

        FIELD_HEADERS = {
            'employee_code':  'Emp Code',
            'first_name':     'First Name',
            'last_name':      'Last Name',
            'designation':    'Designation',
            'department':     'Department',
            'gross_salary':   'Gross Salary',
            'total_ot_hours': 'OT Hours',
            'hourly_rate':    'Hourly Rate',
            'ot_amount':      'OT Amount',
            'allowance':      'Allowance',
            'deduction':      'Deduction',
            'net_ot_amount':  'Net OT Amount',
        }

        if selected_fields:
            columns = [{'field': f, 'header': FIELD_HEADERS.get(f, f.replace('_', ' ').title())}
                       for f in selected_fields if f in FIELD_HEADERS]
        else:
            columns = [{'field': k, 'header': v} for k, v in FIELD_HEADERS.items()]

        columns = [{'field': '_sno', 'header': 'S.No'}] + columns

        NUMERIC_FIELDS = {'gross_salary', 'total_ot_hours', 'hourly_rate', 'ot_amount',
                          'allowance', 'deduction', 'net_ot_amount'}

        rows_qs = instance.ot_employee_list.all().order_by('created')
        rows = []
        for i, row in enumerate(rows_qs):
            r = {'_sno': i + 1}
            for col in columns:
                if col['field'] == '_sno':
                    continue
                r[col['field']] = getattr(row, col['field'], '') or ''
            rows.append(r)

        import pandas as pd
        from collections import OrderedDict
        ordered_rows = [OrderedDict((c['field'], r.get(c['field'], '')) for c in columns) for r in rows]
        df = pd.DataFrame(ordered_rows) if ordered_rows else pd.DataFrame(columns=[c['field'] for c in columns])
        df.fillna('', inplace=True)

        excel_file = _io.BytesIO()
        workbook  = xlsxwriter.Workbook(excel_file)
        worksheet = workbook.add_worksheet('OT Payroll Register')

        title_fmt = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 12,
        })
        subtitle_fmt = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 10,
        })
        header_fmt = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
        })
        num_fmt = workbook.add_format({'num_format': '#,##0.00', 'border': 1})
        cell_fmt = workbook.add_format({'border': 1})
        total_lbl_fmt = workbook.add_format({
            'bold': True, 'align': 'left', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
        })
        total_num_fmt = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
            'num_format': '#,##0.00',
        })

        n_cols = len(columns)
        worksheet.merge_range(0, 0, 0, n_cols - 1, title_line1, title_fmt)
        worksheet.merge_range(1, 0, 1, n_cols - 1, title_line2, subtitle_fmt)

        for ci, col in enumerate(columns):
            worksheet.write(2, ci, col['header'], header_fmt)

        for ri, row_vals in enumerate(df.values, start=3):
            for ci, (col, val) in enumerate(zip(columns, row_vals)):
                if col['field'] in NUMERIC_FIELDS:
                    try:
                        worksheet.write_number(ri, ci, float(val or 0), num_fmt)
                    except Exception:
                        worksheet.write(ri, ci, val, cell_fmt)
                else:
                    worksheet.write(ri, ci, val, cell_fmt)

        # Grand total row
        grand_row = 3 + len(rows)
        for ci, col in enumerate(columns):
            if ci == 0:
                worksheet.write(grand_row, ci, 'Grand Total', total_lbl_fmt)
            elif col['field'] in NUMERIC_FIELDS:
                total = sum(float(r.get(col['field'], 0) or 0) for r in rows)
                worksheet.write_number(grand_row, ci, total, total_num_fmt)
            else:
                worksheet.write(grand_row, ci, '', total_lbl_fmt)

        workbook.close()
        excel_file.seek(0)
        filename = f'OT_Payroll_{instance.ot_payroll_number or pk}.xlsx'
        response = HttpResponse(
            excel_file.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class AttendanceImportViewSet(viewsets.ModelViewSet):
    queryset = AttendanceImport.objects.all().order_by('-modified')
    serializer_class = AttendanceImportSerializer
    search_fields = ['import_code', 'date', 'is_active']
    filterset_fields = {
        'id': ['exact', 'in'],
        "date": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith'],
        "import_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                        'istartswith',
                        'iendswith'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(AttendanceImport, AttendanceImportSerializer,
                                                required_fields.split(','))
        return serializers.AttendanceImportSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

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
                    queryset = queryset.filter(query_filter)

            offset = int(request.query_params.get('offset', 0))
            limit = int(request.query_params.get('limit', 10))  # Set a default limit, e.g., 10
            total_count = queryset.count()
            queryset = queryset[offset:limit]
            # Calculate whether there are more items after the current page
            has_more = total_count > limit
            serializer = self.get_serializer(queryset, many=True)
            # child_serializer = AttendanceImportSerializer
            # serializer = child_serializer(queryset, many=True)
            # print("serializer", serializer.data)
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

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    @action(detail=False, methods=['post'], url_path='employee_month_list_import')
    def employee_month_list_import(self, request, *args, **kwargs):
        attendance_data = request.data.get('import_file')
        b_id = request.query_params.get('b_id')
        data = pd.read_csv(attendance_data)
        extracted_data = []
        start_index = 5
        skip_count = 1
        process_count = 5
        employee_data = {}
        date_and_days = {}
        emp_list = {}
        date_base = ''
        hrm_service = importlib.import_module('hrm_main.api.service')
        hrm_entry_signal = hrm_service.HRMSignal
        for index, row in data.iterrows():
            if index == 1:
                date_and_days.update(hrm_entry_signal.on_month_extract(row.tolist()))
            elif index == 2:
                date_and_days.update(hrm_entry_signal.on_month_days_extract(row.tolist()))
            elif start_index <= index < start_index + process_count:
                if index == start_index:
                    employee_data.update(hrm_entry_signal.on_employee_details_extract(row.tolist()))
                elif index == start_index + 1:
                    employee_data.update(hrm_entry_signal.on_employee_login_time_extract(row.tolist()))
                elif index == start_index + 2:
                    employee_data.update(hrm_entry_signal.on_employee_logout_time_extract(row.tolist()))
                elif index == start_index + 3:
                    employee_data.update(hrm_entry_signal.on_employee_working_time_extract(row.tolist()))
                elif index == start_index + 4:
                    employee_data.update(hrm_entry_signal.on_employee_attendance_status_time_extract(row.tolist()))
                    # start_index = 0
                    days = list(map(str, range(1, len(date_and_days.get('days')) + 1)))
                    date_base = date_and_days.get('date')

                    for i, day in enumerate(days):
                        date = f"{day.zfill(2)}{date_base[3:]}"
                        date_obj = datetime.strptime(date, "%d/%m/%Y")
                        formatted_date = date_obj.strftime("%Y-%m-%d")
                        attendance = AttendanceDetails.objects.filter(
                            employee_code=employee_data['employee_code'], date=formatted_date
                        ).first()
                        if attendance:
                            pass
                        else:
                            record = {
                                'date': date,
                                'employee_code': employee_data['employee_code'],
                                'employee_name': employee_data['employee_name'],
                                'login_time': employee_data['login_times'][i],
                                'logout_time': employee_data['logout_times'][i],
                                'working_time': employee_data['working_times'][i],
                                'status': employee_data['status_data'][i]
                            }
                            extracted_data.append(record)
                    employee_data = {}

            if index == start_index + process_count + skip_count - 1:
                start_index += process_count + skip_count
        date_obj = datetime.strptime(date_base.replace(':', ''), '%d/%m/%Y')
        formatted_date = date_obj.strftime('%d-%m-%Y')
        emp_list = {
            "attendance_details": extracted_data,
            "date": formatted_date,
            'import_file': request.data.get('import_file'),
            "file_name": request.data.get('file_name'),
            "b_id": b_id
        }
        # print("request.data.get('b_id')", request.data.get('b_id'))
        serializer = AttendanceImportSerializer(data=emp_list, context={'request': request})
        if serializer.is_valid(raise_exception=True):
            instance = serializer.save()
            updated_serializer = AttendanceImportSerializer(instance)
        return Response(updated_serializer.data, status=status.HTTP_201_CREATED)


class FinalSettlementViewSet(viewsets.ModelViewSet):
    queryset = FinalSettlement.objects.all().order_by('-modified')
    serializer_class = FinalSettlementSerializer
    search_fields = ['employee__first_name', 'dor', 'notice_period',
                     'is_active', 'approval_status']
    filterset_fields = {
        'id': ['exact', 'in'],
        'is_active': ['exact', 'in'],
        'b_id': ['exact', 'in'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                 'istartswith',
                                 'iendswith'],
        "dor": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "notice_period": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                          'istartswith',
                          'iendswith'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(FinalSettlement, FinalSettlementSerializer,
                                                required_fields.split(','))
        return serializers.FinalSettlementSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    def generate_unique_id(self):
        random_number = random.randint(1000000000000, 9999999999999)
        return str(random_number) + 'A'

    @action(detail=False, methods=['GET'], url_path='employee_final_settlement')
    def employee_final_settlement(self, request, client):
        employee_id = request.query_params.get('employee')

        if employee_id is not None:
            try:
                # Fetch employee details
                employee_details = EmployeeMaster.objects.filter(id=employee_id).values(
                    'first_name', 'dob', 'doc', 'doj', 'dor',
                    'department__department_name', 'designation__designation_name', 'grade__grade_code'
                ).first()
                if employee_details:
                    date_fields = ['dob', 'doc', 'doj', 'dor']
                    for field in date_fields:
                        if employee_details.get(field):
                            employee_details[field] = employee_details[field].strftime('%d-%m-%Y')
                # Fetch employee monthly salary
                employee_monthly_sal = EmployeeMonthlySalary.objects.filter(employee=employee_id).first()
                net_pay_monthly = employee_monthly_sal.net_pay_monthly if employee_monthly_sal else 0

                # Calculate employee's monthly allowance sum
                employee_allowance_montly_sum = EmployeeMonthlyAllowanceDetails.objects.filter(
                    gross_earnings__employee=employee_id
                ).aggregate(total_monthly=Sum('monthly'))['total_monthly'] or 0
                # Fetch employee deduction details
                employee_deduction_details = list(EmployeeMonthlyDeductionDetails.objects.filter(
                    gross_deductions__employee=employee_id
                ).values('components', 'monthly'))

                # Process deductions to include unique ID
                employee_deduction_details = self._deductions_default_details(employee_deduction_details)

                # Get advance details
                advance_details = Advance.objects.filter(employee=employee_id, balance_loan_amount__gt=0).aggregate(
                    total_balance=Sum('balance_loan_amount')
                )['total_balance'] or 0

                # Append advance details as a custom component in deductions
                employee_deduction_details.append({
                    'id': self.generate_unique_id(),
                    'components': 'Salary Advance',
                    'monthly': advance_details
                })

                # Construct response
                response_data = {
                    'employee_details': employee_details,
                    'employee_allowance_montly_sum': employee_allowance_montly_sum,
                    'employee_deduction_details': employee_deduction_details,
                    'net_Amount_monthly': net_pay_monthly
                }

                return Response(response_data, status=200)
            except EmployeeMaster.DoesNotExist:
                return Response({'error': 'Employee not found'}, status=404)

        return Response({'error': 'Employee ID not provided'}, status=400)

    def _deductions_default_details(self, deductions_details_data):
        return [
            {
                'id': self.generate_unique_id(),
                'components': item_data['components'],
                'monthly': item_data['monthly'],
            }
            for item_data in deductions_details_data
        ]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_list(request, client):
    str_date = request.query_params.get('date')
    employee_id = request.query_params.get('employee_id')
    b_id = request.query_params.get('b_id')
    try:
        payslip_list = []
        date = datetime.strptime(str_date, '%d-%m-%Y')
        branch_details=Branch.objects.get(id=b_id)
        employee_details = EmployeeMaster.objects.get(id=employee_id)
        updated_serializer = EmployeeMasterSerializer(employee_details)
        hrm_service = importlib.import_module('hrm_main.api.service')
        hrm_entry_signal = hrm_service.HRMSignal
        pay_slip_queryset = EmployeeList.objects.filter(
            Q(from_date__year=date.year) | Q(to_date__year=date.year),
            employee=employee_id, salary__approval_status='APPROVED'
        )
        print("pay_slip_queryset", pay_slip_queryset)

        # Populating pay slip details
        for pay_slip in pay_slip_queryset:
            gross_earnings_list = list(AllowanceDetails.objects.filter(
                allowance_salary=pay_slip.id
            ).values('components', 'monthly'))
            gross_deductions_list = list(DeductionDetails.objects.filter(
                deduction_salary=pay_slip.id
            ).values('components', 'monthly'))
            # Filter out items where 'components' is 'TDS'
            filtered_deductions_list = [deduction for deduction in gross_deductions_list if
                                        deduction['components'] != 'TDS']
            paired_list = []
            earnings = []
            deductions = []
            working_days = hrm_entry_signal.get_working_days_pay_silp_month_based_on_employee(pay_slip.from_date, pay_slip.to_date,employee_details, b_id)
            el_leave_month, cl_leave_month, bl_el_leave_month, bl_cl_leave_month = hrm_entry_signal.leave_details_count(
                pay_slip.from_date, pay_slip.to_date, employee_id)
            earnings.extend([
                {'components': 'OT', 'monthly': pay_slip.ot},
                {'components': 'Other Incentive', 'monthly': pay_slip.other_incentive},
                {'components': 'Bonus', 'monthly': pay_slip.bonus},
                {'components': 'Advance', 'monthly': pay_slip.advance}
            ])

            deductions.extend([
                {'components': 'Advance EMI', 'monthly': pay_slip.advance_emi},
                {'components': 'Lop Amount', 'monthly': pay_slip.lop_amount}
            ])
            # gross_earnings_list.extend(earnings)
            # filtered_deductions_list.extend(deductions)
            # paired_list = get_paired_list(gross_earnings_list, filtered_deductions_list, paired_list)
            combined_earnings = gross_earnings_list + earnings
            combined_deductions = filtered_deductions_list + deductions
            net_pay_words = hrm_entry_signal.number_to_words(round(pay_slip.net_pay))
            # print("net_pay_words", net_pay_words)
            paired_list = get_paired_list(combined_earnings, combined_deductions, paired_list)

            # â”€â”€ Build context for Adroit template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            media_url = f"{request.scheme}://{request.get_host()}/media"
            logo_url  = f"{media_url}/print-images/gateway_logo.png"

            # Clean employee dict with resolved FK names
            emp_obj = employee_details  # EmployeeMaster instance
            emp = {
                'employee_code':        emp_obj.employee_code or '',
                'first_name':           emp_obj.first_name or '',
                'employee_type':        emp_obj.employee_type or '',
                'department_name':      emp_obj.department.department_name if emp_obj.department_id else '',
                'designation_name':     emp_obj.designation.designation_name if emp_obj.designation_id else '',
                'payment_method':       emp_obj.payment_method or '-',
                'wps_establishment_id': emp_obj.wps_establishment_id or '-',
                'bank_name':            emp_obj.bank_name or '-',
                'bank_routing_no':      emp_obj.bank_routing_no or '-',
                'iban_no':              emp_obj.iban_no or '-',
                'sponsors':             emp_obj.sponsors or '',
            }

            # Pre-compute named allowances using case-insensitive substring match
            # so "Travel Allowance", "Travel allowance", "travel allowance" etc. all match
            def _amt_contains(keyword):
                kw = keyword.lower()
                return sum(
                    float(e.get('monthly') or 0) for e in gross_earnings_list
                    if kw in (e.get('components') or '').lower()
                )

            def _is_known(comp):
                c = (comp or '').lower()
                return any(k in c for k in ('basic', 'travel', 'education', 'housing', 'transport', 'food'))

            basic_salary        = _amt_contains('basic')
            travel_allowance    = _amt_contains('travel')
            education_allowance = _amt_contains('education')
            housing_allowance   = _amt_contains('housing')
            transport_allowance = _amt_contains('transport')
            food_allowance      = _amt_contains('food')
            other_allowance     = sum(
                float(e.get('monthly') or 0) for e in gross_earnings_list
                if not _is_known(e.get('components', ''))
            )

            leave_absent_days = max(0, int(working_days or 0) - int(pay_slip.no_of_days or 0))
            earned_salary = (float(pay_slip.gross_pay or 0)
                             + float(pay_slip.ot or 0)
                             + float(pay_slip.other_incentive or 0)
                             + float(pay_slip.bonus or 0))

            rendered_template = render(request, 'generate_payslip_adroit.html', {
                'pay_slip':             pay_slip,
                'employee_details':     updated_serializer.data,
                'emp':                  emp,
                'working_days':         working_days,
                'paired_list':          paired_list,
                'el_leave_month':       el_leave_month,
                'cl_leave_month':       cl_leave_month,
                'bl_el_leave_month':    bl_el_leave_month,
                'bl_cl_leave_month':    bl_cl_leave_month,
                'net_pay_words':        net_pay_words,
                'branch_details':       branch_details,
                'MEDIA_URL':            media_url,
                'logo_url':             logo_url,
                'basic_salary':         basic_salary,
                'travel_allowance':     travel_allowance,
                'education_allowance':  education_allowance,
                'housing_allowance':    housing_allowance,
                'transport_allowance':  transport_allowance,
                'food_allowance':       food_allowance,
                'other_allowance':      other_allowance,
                'leave_absent_days':    leave_absent_days,
                'earned_salary':        earned_salary,
            })

            # print("render tmplate", rendered_template.content)
            rendered_content = rendered_template.content
            temp_file_path = tempfile.mktemp(suffix='.html')
            with open(temp_file_path, 'wb') as temp_file:
                temp_file.write(rendered_content)

            # pdf_file_name = f"employee_{employee_id}_{pay_slip.from_date.strftime('%Y-%m-%d')}_payslip.pdf"
            pdf_file_name = f"{pay_slip.from_date.strftime('%B %Y')} Payslip.pdf"
            pdf_file_path = os.path.join(settings.PDF_STORAGE_PATH, pdf_file_name)

            pdfkit.from_file(temp_file_path, pdf_file_path,
                             configuration=pdfkit.configuration(wkhtmltopdf=env('WK_HTML_TO_PDF')))
            payslip_list.append({
                "date": pay_slip.from_date,
                "pdf_url": f"{request.scheme}://{request.get_host()}/media/payslip-generation/{pdf_file_name}"
            })

        response_data = ({
            "response_code": status.HTTP_200_OK,
            "response_message": "Success",
            "results": payslip_list
        })

        return JsonResponse(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        response_data = ({
            "response_code": status.HTTP_400_BAD_REQUEST,
            "response_message": "Failed",
            "results": str(e)
        })
    return JsonResponse(response_data, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payslip_zip(request, client):
    import zipfile as zf
    str_date = request.query_params.get('date')
    employee_id = request.query_params.get('employee_id')
    b_id = request.query_params.get('b_id')
    months_param = request.query_params.get('months', '')
    try:
        date = datetime.strptime(str_date, '%d-%m-%Y')
        selected_months = (
            [int(m) for m in months_param.split(',') if m.strip().isdigit()]
            if months_param else list(range(1, 13))
        )
        branch_details = Branch.objects.get(id=b_id)
        employee_details = EmployeeMaster.objects.get(id=employee_id)
        updated_serializer = EmployeeMasterSerializer(employee_details)
        hrm_service = importlib.import_module('hrm_main.api.service')
        hrm_entry_signal = hrm_service.HRMSignal
        pay_slip_queryset = EmployeeList.objects.filter(
            Q(from_date__year=date.year) | Q(to_date__year=date.year),
            employee=employee_id, salary__approval_status='APPROVED'
        )
        pdf_paths = []
        for pay_slip in pay_slip_queryset:
            if pay_slip.from_date.month not in selected_months:
                continue
            gross_earnings_list = list(AllowanceDetails.objects.filter(
                allowance_salary=pay_slip.id).values('components', 'monthly'))
            gross_deductions_list = list(DeductionDetails.objects.filter(
                deduction_salary=pay_slip.id).values('components', 'monthly'))
            filtered_deductions_list = [d for d in gross_deductions_list if d['components'] != 'TDS']
            earnings = [
                {'components': 'OT', 'monthly': pay_slip.ot},
                {'components': 'Other Incentive', 'monthly': pay_slip.other_incentive},
                {'components': 'Bonus', 'monthly': pay_slip.bonus},
                {'components': 'Advance', 'monthly': pay_slip.advance},
            ]
            deductions = [
                {'components': 'Advance EMI', 'monthly': pay_slip.advance_emi},
                {'components': 'Lop Amount', 'monthly': pay_slip.lop_amount},
            ]
            working_days = hrm_entry_signal.get_working_days_pay_silp_month_based_on_employee(
                pay_slip.from_date, pay_slip.to_date, employee_details, b_id)
            el_leave_month, cl_leave_month, bl_el_leave_month, bl_cl_leave_month = hrm_entry_signal.leave_details_count(
                pay_slip.from_date, pay_slip.to_date, employee_id)
            net_pay_words = hrm_entry_signal.number_to_words(round(pay_slip.net_pay))
            paired_list = get_paired_list(gross_earnings_list + earnings, filtered_deductions_list + deductions, [])
            rendered_template = render(request, 'generate_payslip.html', {
                'pay_slip': pay_slip,
                'employee_details': updated_serializer.data,
                'working_days': working_days,
                'paired_list': paired_list,
                'el_leave_month': el_leave_month,
                'cl_leave_month': cl_leave_month,
                'bl_el_leave_month': bl_el_leave_month,
                'bl_cl_leave_month': bl_cl_leave_month,
                'net_pay_words': net_pay_words,
                'branch_details': branch_details,
                'MEDIA_URL': f"{request.scheme}://{request.get_host()}/media",
            })
            temp_file_path = tempfile.mktemp(suffix='.html')
            with open(temp_file_path, 'wb') as f:
                f.write(rendered_template.content)
            pdf_file_name = f"{pay_slip.from_date.strftime('%B %Y')} Payslip.pdf"
            pdf_file_path = os.path.join(settings.PDF_STORAGE_PATH, pdf_file_name)
            pdfkit.from_file(temp_file_path, pdf_file_path,
                             configuration=pdfkit.configuration(wkhtmltopdf=env('WK_HTML_TO_PDF')))
            if os.path.exists(pdf_file_path):
                pdf_paths.append((pdf_file_path, pdf_file_name))
        if not pdf_paths:
            return JsonResponse({'error': 'No payslips found for the selected months.'}, status=400)
        zip_buffer = io.BytesIO()
        with zf.ZipFile(zip_buffer, 'w', zf.ZIP_DEFLATED) as zip_file:
            for pdf_path, pdf_name in pdf_paths:
                zip_file.write(pdf_path, pdf_name)
        zip_buffer.seek(0)
        emp_name = employee_details.first_name.replace(' ', '_')
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="Payslips_{emp_name}_{date.year}.zip"'
        return response
    except Exception as e:
        return JsonResponse({
            'response_code': status.HTTP_400_BAD_REQUEST,
            'response_message': 'Failed',
            'results': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


def get_paired_list(gross_earnings_list, gross_deductions_list, paired_list):
    # print("get_paired_list", paired_list)
    max_length = max(len(gross_earnings_list), len(gross_deductions_list))
    for i in range(max_length):
        earnings = gross_earnings_list[i] if i < len(gross_earnings_list) else None
        deductions = gross_deductions_list[i] if i < len(gross_deductions_list) else None
        paired_list.append((earnings, deductions))
    return paired_list


class TaDaViewSet(viewsets.ModelViewSet):
    queryset = TaDa.objects.all().order_by('-modified')
    serializer_class = TaDaSerializer
    search_fields = ['employee__employee_code', 'employee_first_name', 'employee_department_name',
                     'employee_designation_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        'tada_number': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                        'iendswith'],
        'employee': ['exact', 'in'],
        'employee__employee_code': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "employee_first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                'iendswith'],
        "employee_department_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                     'istartswith',
                                     'iendswith'],
        "employee_designation_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                      'istartswith',
                                      'iendswith'],
        "is_active": ['exact'],
        'approval_status': ['exact'],
        "b_id": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    # REQUIRED FIELDS
    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(TaDa, TaDaSerializer,
                                                required_fields.split(','))
        return serializers.TaDaSerializer

    # EXCEL
    @action(detail=False, methods=['GET'], url_path='get-list-by-user/export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    @action(detail=False, methods=['GET'], url_path='get-list-by-user')
    def get_list_user(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        user_id = request.query_params.get('user_id')
        user = User.objects.get(id=user_id)

        if user.is_superuser == True:
            queryset = self.filter_queryset(self.get_queryset())
        else:
            if user.employee is not None:
                queryset = queryset.filter(employee=user.employee.id)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class TravelPlanningViewSet(viewsets.ModelViewSet):
    queryset = TravelPlanning.objects.all().order_by('-modified')
    serializer_class = TravelPlanningSerializer
    search_fields = ['plan_number', 'from_date', 'to_date', 'employee', 'place_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        'plan_number': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                        'iendswith'],
        'employee': ['exact', 'in'],
        'from_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'to_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'place_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    # REQUIRED FIELDS
    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(TravelPlanning, TravelPlanningSerializer,
                                                required_fields.split(','))
        return serializers.TravelPlanningSerializer

    # EXCEL
    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class TravelPlanningLogViewSet(viewsets.ModelViewSet):
    queryset = TravelPlanningLog.objects.all().order_by('-modified')
    serializer_class = TravelPlanningLogSerializer
    search_fields = ['travel_planning', 'checkin_date', 'checkout_date']
    filterset_fields = {
        'id': ['exact', 'in'],
        'travel_planning': ['exact', 'in'],
        'travel_planning__plan_number': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                         'istartswith',
                                         'iendswith'],
        'travel_planning__place_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                        'istartswith',
                                        'iendswith'],
        'checkin_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'checkout_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        "is_active": ['exact'],
        "b_id": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    # REQUIRED FIELDS
    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(TravelPlanningLog, TravelPlanningLogSerializer,
                                                required_fields.split(','))
        return serializers.TravelPlanningLogSerializer

    # EXCEL
    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


class AttendanceStatusMasterViewSet(viewsets.ModelViewSet):
    queryset = AttendanceStatusMaster.objects.all().order_by('-modified')
    serializer_class = AttendanceStatusMasterSerializer
    search_fields = ['status_name','code', 'type', 'description']
    filterset_fields = {
        'id': ['exact', 'in'],
        "code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                 'istartswith',
                                 'iendswith'],
        "status_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                    'istartswith',
                                    'iendswith'],

        "description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',  
                       'istartswith', 'iendswith'],
        "type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith', 'in'],                   
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

class GraceDetailsViewSet(viewsets.ModelViewSet):
    queryset = GraceDetails.objects.all().order_by('-modified')
    serializer_class = GraceDetailsSerializer
    search_fields = ["type", "description", "emp_type", "emp_group","emp_reporting"]
    filterset_fields = {
        'id': ['exact', 'in'],
        "type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                        'istartswith',
                        'iendswith'],
        "emp_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith'],
        "description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith'],

        "from_date": ['exact', 'lt', 'gt', 'lte', 'gte'], 
        "to_date": ['exact', 'lt', 'gt', 'lte', 'gte'],   
        "emp_group": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                 'istartswith',
                 'iendswith'],
        "emp_reporting": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                      'istartswith',
                      'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact'],
        "shift": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]


class DisciplinaryActionViewSet(viewsets.ModelViewSet):
    queryset = DisciplinaryAction.objects.all().order_by('-modified')
    serializer_class = DisciplinaryActionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ['employee__first_name', 'employee__employee_code', 'reference_no', 'violation_type', 'penalty_type']
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee': ['exact', 'in'],
        'employee__employee_code': ['exact', 'icontains'],
        'penalty_type': ['exact', 'in'],
        'affects_pay': ['exact'],
        'approval_status': ['exact', 'in'],
        'from_date': ['exact', 'gte', 'lte'],
        'to_date': ['exact', 'gte', 'lte'],
        'is_active': ['exact'],
        'b_id': ['exact'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=True, methods=['get'], url_path='print')
    def print(self, request, pk=None, client=None):
        import datetime as _dt
        from branch.models import Branch
        from print_management.print_utils.template_resolver import resolve_template
        from print_management.print_utils.pdf_renderer import render_pdf_from_template

        instance = self.get_object()
        b_id = request.query_params.get('b_id')

        def fmt_date(d):
            return d.strftime('%d-%b-%Y') if d else '-'

        PENALTY_LABELS = {
            'verbal_warning':  'Verbal Warning',
            'written_warning': 'Written Warning',
            'show_cause':      'Show Cause Notice',
            'pay_deduction':   'Pay Deduction',
            'suspension':      'Suspension Without Pay',
            'termination':     'Termination',
        }

        # â”€â”€ branch / company info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        branch              = Branch.objects.filter(id=b_id).first() if b_id else None
        company_name        = (branch.branch_name         or '') if branch else ''
        company_name_arabic = (branch.company_name_arabic or '') if branch else ''
        branch_address      = (branch.registered_address  or '') if branch else ''
        vat_no              = (branch.gst_no               or '') if branch else ''
        phone_no            = (branch.phone_no             or '') if branch else ''
        email               = (branch.email                or '') if branch else ''
        logo_base64         = (branch.images               or '') if branch else ''

        # â”€â”€ employee info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        emp             = instance.employee
        employee_code   = (emp.employee_code or '') if emp else ''
        employee_name   = (f"{emp.first_name or ''} {emp.last_name or ''}".strip()) if emp else ''
        department      = (emp.department.department_name   if emp and emp.department   else '')
        designation     = (emp.designation.designation_name if emp and emp.designation  else '')

        # â”€â”€ approval remarks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        approval_remarks = ''
        try:
            stage = instance.approval_stages.order_by('-modified').first()
            if stage:
                approval_remarks = stage.comments or ''
        except Exception:
            pass

        context = {
            'company_name':         company_name,
            'company_name_arabic':  company_name_arabic,
            'branch_address':       branch_address,
            'vat_no':               vat_no,
            'phone_no':             phone_no,
            'email':                email,
            'logo_base64':          logo_base64,

            'reference_no':         instance.reference_no or '-',
            'print_date':           fmt_date(_dt.date.today()),

            'employee_code':        employee_code or '-',
            'employee_name':        employee_name or '-',
            'department':           department    or '-',
            'designation':          designation   or '-',

            'violation_type':       instance.violation_type or '-',
            'penalty_type_display': PENALTY_LABELS.get(instance.penalty_type, instance.penalty_type or '-'),
            'from_date':            fmt_date(instance.from_date),
            'to_date':              fmt_date(instance.to_date),
            'affects_pay_display':  'Yes' if instance.affects_pay else 'No',
            'approval_status':      instance.approval_status or '-',
            'approval_remarks':     approval_remarks,
            'description':          instance.description or '',
        }

        template_obj = resolve_template(
            'DISCIPLINARY_ACTION',
            effective_date=_dt.date.today(),
            # branch_id=int(b_id) if b_id else None,
        )
        if not template_obj:
            from rest_framework.response import Response
            return Response(
                {'error': 'Print template not found. Run: python manage.py seed_disciplinary_action_template'},
                status=404,
            )

        filename = f"Disciplinary_Action_{instance.reference_no or instance.id}.pdf"
        pdf_options = {
            'page-size':     'A4',
            'encoding':      'UTF-8',
            'zoom':          '1.0',
            'no-outline':    None,
            'margin-top':    '12mm',
            'margin-bottom': '12mm',
            'margin-left':   '14mm',
            'margin-right':  '14mm',
        }
        return render_pdf_from_template(template_obj, context, filename, inline=True, pdf_options=pdf_options)




class ExpenseClaimCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseClaimCategory.objects.all().order_by('name')
    serializer_class = ExpenseClaimCategorySerializer

    search_fields = [
        'name','code','is_active',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],
        'name': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],
        'code': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],
        'requires_receipt': ['exact'],
        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                ExpenseClaimCategory,
                ExpenseClaimCategorySerializer,
                required_fields.split(',')
            )

        return ExpenseClaimCategorySerializer


class ExpenseClaimLinkTypeViewSet(viewsets.ModelViewSet):
    queryset = ExpenseClaimLinkType.objects.select_related(
        'content_type'
    ).all().order_by('order', 'label')

    serializer_class = ExpenseClaimLinkTypeSerializer

    search_fields = [
        'label',
        'content_type__app_label',
        'content_type__model',
        'display_field',
        'search_url',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],
        'label': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],
        'content_type': ['exact', 'in'],
        'display_field': [
            'exact',
            'iexact',
            'icontains',
        ],
        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                ExpenseClaimLinkType,
                ExpenseClaimLinkTypeSerializer,
                required_fields.split(',')
            )

        return ExpenseClaimLinkTypeSerializer



class ExpenseClaimLineViewSet(viewsets.ModelViewSet):
    queryset = ExpenseClaimLine.objects.select_related(
        'claim',
        'category',
        'link_type',
        'linked_content_type',
    ).all().order_by('id')

    serializer_class = ExpenseClaimLineSerializer

    search_fields = [
        'vendor_name',
        'description',
        'category__name',
        'category__code',
        'claim__claim_no',
        'claim__claim_name',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],
        'claim': ['exact', 'in'],
        'category': ['exact', 'in'],
        'expense_date': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],
        'receipt_attached': ['exact'],
        'link_type': ['exact', 'in'],
        'linked_content_type': ['exact', 'in'],
        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                ExpenseClaimLine,
                ExpenseClaimLineSerializer,
                required_fields.split(',')
            )

        return ExpenseClaimLineSerializer


class ExpenseClaimAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ExpenseClaimAttachment.objects.select_related(
        'claim'
    ).all().order_by('-created')

    serializer_class = ExpenseClaimAttachmentSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    search_fields = [
        'file_name',
        'claim__claim_no',
        'claim__claim_name',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],
        'claim': ['exact', 'in'],
        'file_name': [
            'exact',
            'iexact',
            'icontains',
        ],
        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                ExpenseClaimAttachment,
                ExpenseClaimAttachmentSerializer,
                required_fields.split(',')
            )

        return ExpenseClaimAttachmentSerializer


class ExpenseClaimViewSet(viewsets.ModelViewSet):
    queryset = ExpenseClaim.objects.select_related(
        'claimant',
        'claimant__department',
        'claimant__designation',
        'submitted_by',
    ).prefetch_related(
        'lines',
        'attachments',
    ).all().order_by('-created')

    serializer_class = ExpenseClaimSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    search_fields = [
        'claim_no',
        'claim_name',
        'claimant__employee_code',
        'claimant__first_name',
        'submitted_by__employee_code',
        'submitted_by__first_name',
        'business_purpose',
        'status',
        'approval_status',
        'payment_reference',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],

        'claim_no': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'claim_name': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'claimant': ['exact', 'in'],

        'submitted_by': ['exact', 'in'],

        'claimant__employee_code': [
            'exact',
            'iexact',
            'icontains',
        ],

        'claimant__first_name': [
            'exact',
            'iexact',
            'icontains',
            'istartswith',
        ],

        'total_claimed': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'period_from': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'period_to': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'paid_by': [
            'exact',
            'iexact',
        ],

        'status': [
            'exact',
            'iexact',
            'in',
        ],

        'approval_status': [
            'exact',
            'iexact',
            'contains',
            'icontains',
        ],

        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                ExpenseClaim,
                ExpenseClaimSerializer,
                required_fields.split(',')
            )

        return ExpenseClaimSerializer

    @action(detail=True,methods=['GET'],url_path='compute-totals')
    def compute_totals(self, request, pk=None, client=None):
        claim = self.get_object()

        total_claimed = claim.lines.aggregate(
            total=Sum('amount')
        ).get('total') or 0

        advance_amount = claim.advance_amount or 0

        net_payable = total_claimed - advance_amount

        excess_to_return = (
            abs(net_payable)
            if net_payable < 0
            else 0
        )

        claim.total_claimed = total_claimed
        claim.net_payable = net_payable
        claim.excess_to_return = excess_to_return

        claim.save(
            update_fields=[
                'total_claimed',
                'net_payable',
                'excess_to_return',
            ]
        )

        serializer = self.get_serializer(claim)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['GET'], url_path='print')
    def print(self, request, pk=None, client=None, *args, **kwargs):
        import datetime as _dt
        from branch.models import Branch
        from print_management.print_utils.template_resolver import resolve_template
        from print_management.print_utils.pdf_renderer import render_pdf_from_template

        claim = self.get_object()
        b_id = request.query_params.get('b_id') or str(claim.b_id or '')

        def fmt_date(d):
            return d.strftime('%d-%b-%Y') if d else '-'

        def fmt_amount(v):
            try:
                return f'{float(v):,.2f}' if v is not None else '0.00'
            except (TypeError, ValueError):
                return '0.00'

        # â”€â”€ branch / company info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        branch              = Branch.objects.filter(id=b_id).first() if b_id else None
        company_name        = (branch.branch_name         or '') if branch else ''
        company_name_arabic = (branch.company_name_arabic or '') if branch else ''
        branch_address      = (branch.registered_address  or '') if branch else ''
        vat_no              = (branch.gst_no               or '') if branch else ''
        phone_no            = (branch.phone_no             or '') if branch else ''
        email               = (branch.email                or '') if branch else ''
        logo_base64         = (branch.images               or '') if branch else ''

        def employee_display(emp):
            if not emp:
                return {'code': '-', 'name': '-', 'department': '-', 'designation': '-'}
            name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            department = ''
            designation = ''
            try:
                department = emp.department.department_name if emp.department else ''
            except Exception:
                pass
            try:
                designation = emp.designation.designation_name if emp.designation else ''
            except Exception:
                pass
            return {
                'code': emp.employee_code or '-',
                'name': name or '-',
                'department': department or '-',
                'designation': designation or '-',
            }

        claimant_info = employee_display(claim.claimant)
        submitted_by_info = employee_display(claim.submitted_by)

        STATUS_LABELS = {
            'DRAFT':             'Draft',
            'SUBMITTED':         'Submitted',
            'MANAGER_APPROVED':  'Manager Approved',
            'HR_APPROVED':       'HR Approved',
            'FINANCE_APPROVED':  'Finance Approved',
            'PAID':              'Paid',
            'REJECTED':          'Rejected',
        }
        PAID_BY_LABELS = {
            'OUT_OF_POCKET': 'Out of Pocket',
            'CASH_ADVANCE':  'Cash Advance',
            'PETTY_CASH':    'Petty Cash',
            'COMPANY_CARD':  'Company Card',
        }

        # â”€â”€ expense lines â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        lines = []
        for line in claim.lines.select_related('category').order_by('id'):
            lines.append({
                'expense_date':     fmt_date(line.expense_date),
                'category':         line.category.name if line.category else '-',
                'vendor_name':      line.vendor_name or '-',
                'description':      line.description or '',
                'amount':           fmt_amount(line.amount),
                'receipt_attached': line.receipt_attached,
            })

        # â”€â”€ approval trail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        approval_stages = []
        try:
            for i, stage in enumerate(claim.approval_stages.order_by('order', 'id'), start=1):
                actioned_date = stage.approval_date
                if hasattr(actioned_date, 'date'):
                    actioned_date = actioned_date.date()
                approval_stages.append({
                    'seq':           i,
                    'stage_name':    stage.stage_name or f'Stage {i}',
                    'status':        stage.approval_status or '-',
                    'actioned_by':   stage.approval_by or '-',
                    'actioned_date': fmt_date(actioned_date),
                    'comments':      stage.comments or '',
                })
        except Exception:
            pass

        context = {
            # Company
            'company_name':        company_name,
            'company_name_arabic': company_name_arabic,
            'branch_address':      branch_address,
            'vat_no':              vat_no,
            'phone_no':            phone_no,
            'email':               email,
            'logo_base64':         logo_base64,
            'currency':            'AED',

            # Claim identity
            'claim_no':            claim.claim_no or f'EXP-{str(claim.id)}',
            'claim_name':          claim.claim_name or '-',
            'print_date':          fmt_date(_dt.date.today()),

            # Claimant
            'claimant':            claimant_info,
            'submitted_by':        submitted_by_info,

            # Header fields
            'period_from':         fmt_date(claim.period_from),
            'period_to':           fmt_date(claim.period_to),
            'business_purpose':    claim.business_purpose or '-',
            'paid_by_display':     PAID_BY_LABELS.get(claim.paid_by or '', claim.paid_by or '-'),
            'petty_cash_fund_no':  claim.petty_cash_fund.fund_no if claim.petty_cash_fund_id else '',
            'petty_cash_fund_holder': (
                claim.petty_cash_fund.holder.first_name
                if claim.petty_cash_fund_id and claim.petty_cash_fund.holder else ''
            ),
            'advance_reference':   claim.advance_reference or '-',
            'advance_amount':      fmt_amount(claim.advance_amount),

            # Lines
            'lines':                lines,

            # Totals
            'total_claimed':       fmt_amount(claim.total_claimed),
            'net_payable':         fmt_amount(claim.net_payable),
            'excess_to_return':    fmt_amount(claim.excess_to_return),

            # Status / payment
            'status':               claim.status or 'DRAFT',
            'status_display':       STATUS_LABELS.get(claim.status or 'DRAFT', claim.status or 'Draft'),
            'rejection_reason':     claim.rejection_reason or '',
            'payment_reference':    claim.payment_reference or '-',
            'payment_date':         fmt_date(claim.payment_date),
            'remarks':              claim.remarks or '',

            # Approval trail
            'approval_stages':      approval_stages,
        }

        template_obj = resolve_template(
            'EXPENSE_CLAIM',
            effective_date=_dt.date.today(),
        )
        if not template_obj:
            return Response(
                {'error': 'Print template not found. Run: python manage.py seed_expense_claim_template'},
                status=404,
            )

        filename = f"Expense_Claim_{claim.claim_no or str(claim.id)}.pdf"
        pdf_options = {
            'page-size':     'A4',
            'encoding':      'UTF-8',
            'zoom':          '1.0',
            'no-outline':    None,
            'margin-top':    '12mm',
            'margin-bottom': '12mm',
            'margin-left':   '14mm',
            'margin-right':  '14mm',
        }
        return render_pdf_from_template(template_obj, context, filename, inline=True, pdf_options=pdf_options)


# ============================================================
# Petty Cash Module
# ============================================================


class PettyCashFundViewSet(viewsets.ModelViewSet):
    queryset = PettyCashFund.objects.select_related(
        'holder',
    ).prefetch_related(
        'transactions',
    ).all().order_by('-created')

    serializer_class = PettyCashFundSerializer

    search_fields = [
        'fund_no',
        'holder__employee_code',
        'holder__first_name',
        'status',
    ]

    filterset_fields = {
        'id': ['exact', 'in'],

        'fund_no': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'holder': [
            'exact',
            'in',
        ],

        'holder__first_name': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'holder__employee_code': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'fund_date': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'opening_balance': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'current_balance': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'status': [
            'exact',
            'iexact',
            'in',
        ],

        'approval_status': [
            'exact',
            'iexact',
            'contains',
            'icontains',
        ],

        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                PettyCashFund,
                PettyCashFundSerializer,
                required_fields.split(',')
            )

        return PettyCashFundSerializer

    @action(detail=True, methods=['POST'], url_path='replenish')
    def replenish(self, request, pk=None, client=None):
        fund = self.get_object()

        amount = request.data.get('amount')

        if not amount or float(amount) <= 0:
            return Response(
                {'error': 'amount must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        txn_serializer = PettyCashTransactionSerializer(
            data={
                'fund': fund.id,
                'transaction_type': 'CREDIT',
                'source_type': 'REPLENISHMENT',
                'amount': amount,
                'transaction_date': request.data.get('date') or datetime.now().date(),
                'reference': request.data.get('reference', ''),
                'remarks': request.data.get('remarks', ''),
            },
            context=self.get_serializer_context(),
        )
        txn_serializer.is_valid(raise_exception=True)
        txn_serializer.save()
        fund.refresh_from_db()

        return Response(
            self.get_serializer(fund).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['POST'], url_path='close-fund')
    def close_fund(self, request, pk=None, client=None):
        fund = self.get_object()

        force = request.data.get('force', False)
        current_balance = fund.current_balance or 0

        if float(current_balance) != 0 and not force:
            return Response(
                {'error': 'Fund balance must be zero before closing. Pass force=true to override.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        fund.status = 'CLOSED'

        if request.data.get('remarks'):
            fund.remarks = request.data.get('remarks')

        fund.save(update_fields=['status', 'remarks'])

        return Response(
            self.get_serializer(fund).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['GET'], url_path='statement')
    def statement(self, request, pk=None, client=None):
        fund = self.get_object()

        transactions = fund.transactions.all().order_by(
            'transaction_date',
            'created'
        )

        running_balance = 0
        rows = []

        for txn in transactions:
            amount = txn.amount or 0

            if txn.transaction_type == 'CREDIT':
                running_balance += amount
            else:
                running_balance -= amount

            rows.append({
                'id': txn.id,
                'transaction_date': txn.transaction_date,
                'transaction_type': txn.transaction_type,
                'source_type': txn.source_type,
                'amount': amount,
                'reference': txn.reference,
                'remarks': txn.remarks,
                'expense_claim': txn.expense_claim_id,
                'expense_claim_no': (
                    txn.expense_claim.claim_no
                    if txn.expense_claim_id else None
                ),
                'running_balance': running_balance,
            })

        return Response({
            'fund_no': fund.fund_no,
            'holder': fund.holder_id,
            'current_balance': fund.current_balance,
            'transactions': rows,
        })


class PettyCashTransactionViewSet(viewsets.ModelViewSet):
    queryset = PettyCashTransaction.objects.select_related(
        'fund',
        'expense_claim',
    ).all().order_by('-transaction_date', '-created')

    serializer_class = PettyCashTransactionSerializer

    # search_fields = [
    #     'fund__fund_no',
    #     'reference',
    #     'remarks',
    #     'expense_claim__claim_no',
    # ]

    search_fields = [
        'fund__fund_no',
        'transaction_type',
        'source_type',
        'reference',
        'remarks',
        'expense_claim__claim_no',
    ]


    filterset_fields = {
        'id': ['exact', 'in'],
        'fund': ['exact', 'in'],

        'fund__fund_no': [
            'exact',
            'iexact',
            'contains',
            'icontains',
            'startswith',
            'istartswith',
        ],

        'transaction_type': ['exact', 'iexact', 'in'],
        'source_type': ['exact', 'iexact', 'in'],

        'transaction_date': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'amount': [
            'exact',
            'gte',
            'lte',
            'gt',
            'lt',
        ],

        'reference': [
            'exact',
            'iexact',
            'contains',
            'icontains',
        ],

        'expense_claim': ['exact', 'in'],
        'is_active': ['exact'],
        'b_id': ['exact', 'in'],
    }

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        DynamicSearchFilter,
    ]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            required_fields = self.request.query_params.get(
                'required_fields',
                ''
            )

            return get_dynamic_serializer_class(
                PettyCashTransaction,
                PettyCashTransactionSerializer,
                required_fields.split(',')
            )

        return PettyCashTransactionSerializer

    def perform_destroy(self, instance):
        fund = instance.fund
        instance.delete()
        PettyCashTransactionSerializer()._recompute_fund_balance(fund)