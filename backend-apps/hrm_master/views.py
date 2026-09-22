# views.py
import ast
import importlib
# In your Django ViewSet (likely in views.py of HRM app)
import requests
from rest_framework.decorators import action
from django.db.models.functions import Cast, Concat, Coalesce

from django.forms.models import model_to_dict

from rest_framework import serializers as rest_serializer

from rest_framework.response import Response
import logging
import json
from calendar import monthrange
from datetime import date
from itertools import chain
from venv import logger
from django.db.models import Case, When, Value, IntegerField, F, CharField, Sum, Func
import random
from collections import OrderedDict
from datetime import time, timedelta, date
from datetime import datetime
import traceback
from sqlite3 import DatabaseError, IntegrityError
from django.db import transaction
from django.db.models import Q, Sum, Exists, Prefetch, OuterRef, Subquery 
from django.db.models.functions import Cast
from django.shortcuts import get_object_or_404
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from backend.filters.custom_filter import DynamicSearchFilter
from hrm_utils.exceptions.utils import api_exception_handler
from django.utils import timezone as tz
from hrm_master.models import Department, Designation, Grade, EmployeeMaster, EmployeeDocumentsDetails, DocumentTypeMaster, LeaveMaster, LeaveEntry, LeaveDetails, HolidayMaster, LeaveMasterDetails, ShiftTimings, LeaveApplication, LeavePolicyDetail, LeavePolicy, SalaryComponents, AllowanceMaster, AllowanceAssignment, ShiftMaster, LeaveExtension
from master.models import Editor, AppSettings, GlobalMaster, FormSettings
from master.api.serializers import (EditorSerializer, GlobalMasterSerializer, AppSettingsSerializer, FormSettingsSerializer)
from hrm_master.api.serializers import (DepartmentSerializer, DesignationSerializer, EmployeeDocumentsDetailsSerializer, DocumentTypeMasterSerializer, GradeSerializer, EmployeeMasterSerializer, LeaveMasterSerializer, LeaveEntrySerializer, LeaveDetailsSerializer, HolidayMasterSerializer, LeaveMasterDetailsSerializer, ShiftTimingsSerializer, LeaveApplicationSerializer, LeavePolicyDetailSerializer, LeavePolicySerializer, SalaryComponentsSerializer, AllowanceMasterSerializer, AllowanceAssignmentSerializer, LeaveExtensionSerializer)
from rest_framework.mixins import ListModelMixin
from rest_framework.response import Response
from rest_framework import viewsets, status
from hrm_utils.constants import NumberConstructorConstants
from hrm_utils.exception_handler import ExceptionsHandler, ApiException
from hrm_utils.number_constuctor import NumberConstructor
from hrm_utils.custom_functions import get_dynamic_serializer_class, generate_unique_id,CustomFunction
import io
import pandas as pd
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
import xlsxwriter

import re
import zipfile
from collections import defaultdict
import calendar
import json
from openpyxl import load_workbook
from datetime import date, datetime, timedelta

from rest_framework import filters, serializers, response, viewsets, status, permissions
from . import models
from security.models import User
from hrm_main.models import GratuityEmployeeForm
from .api.serializers import (LeaveReversalRequestSerializer, ShiftMasterSerializer, TicketMasterSerializer)
from hrm_master.models import (LeaveReversalRequest, ShiftMaster, TicketMaster)
from .api.serializers import (TicketMasterSerializer)
from hrm_master.models import (TicketMaster)
from hrm_utils.custom_model_viewset import CustomModelViewSet
from hrm_utils.custom_model_viewset import CustomModelViewSet as BaseCustomModelViewSet
from hrm_audit_fields.approval_stages.approval_stages_viewset import MultiApprovalStagesViewSetMixin

from hrm_main.models import AttendanceStatusMaster
from django.db.models import Q

exception_handler = ExceptionsHandler()
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.paginator import Paginator
from .api import serializers
from .api.service import MasterService, get_leave_master_custom_excel
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
master_service = importlib.import_module('hrm_master.api.service')
leave_entry_signal = master_service.MasterSignal


class DepartmentViewSet(CustomModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = Department.objects.all().order_by('-modified')
    serializer_class = DepartmentSerializer
    search_fields = ['department_code', 'department_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        'department_code': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                            'iendswith'],
        'department_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                            'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact'],
    }

    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(Department, DepartmentSerializer,
                                                required_fields.split(','))
        return DepartmentSerializer

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

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()

    @action(detail=False, methods=['GET'], url_path='get_auto_generated_code')
    def get_auto_generated_code(self, request, client):
        master_service = importlib.import_module('hrm_master.api.service')
        master_signal = master_service.MasterSignal
        auto_generated_code = master_signal.get_auto_generated_code()
        result = {'department_code': auto_generated_code}
        return JsonResponse(result)


class DesignationViewSet(viewsets.ModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = Designation.objects.all().order_by('-modified')
    serializer_class = DesignationSerializer
    search_fields = ['designation_code', 'designation_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        "designation_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                             'iendswith'],
        "designation_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                             'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(Designation, DesignationSerializer,
                                                required_fields.split(','))
        return DesignationSerializer

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

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()


class GradeViewSet(viewsets.ModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = Grade.objects.all().order_by('-modified')
    serializer_class = GradeSerializer
    search_fields = ['grade_code', 'grade_description', ]
    # 'esi_employer_share', 'pf_employer_contribution',
    #                  'conveyance_allowance', 'cca', 'children_hostel_allowances', 'children_education_allowance']
    filterset_fields = {
        'id': ['exact', 'in'],
        "grade_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],
        "grade_description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                              'iendswith'],

        # 'esi_employer_share': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
        #                        'iendswith'],
        # 'pf_employer_contribution': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #                              'istartswith',
        #                              'iendswith'],
        # 'children_education_allowance': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #                                  'istartswith',
        #                                  'iendswith'],
        # 'conveyance_allowance': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #                          'istartswith',
        #                          'iendswith'],
        # 'cca': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #         'istartswith',
        #         'iendswith'],
        # 'children_hostel_allowances': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #                                'istartswith',
        #                                'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(Grade, GradeSerializer,
                                                required_fields.split(','))
        return serializers.GradeSerializer

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

    
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()


class EmployeeMasterViewSet(viewsets.ModelViewSet):
    # remove_b_id_for_all_branch_user = True
    queryset = EmployeeMaster.objects.all()
    serializer_class = EmployeeMasterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['employee_code', 'first_name', 'modified']
    ordering = ['-modified']
    search_fields = ['employee_code', 'first_name', 'last_name', 'department__department_name', 'designation__designation_name',
                     'gender', 'dob', "employee_type", 'is_sal_created', 'grade__grade_description', 'biometric_key','cicpa_expiry_date',
                     'doj', 'sponsors', 'emirates_id_no', 'emirates_id_expiry_date','cicpa_number','license_number','is_available','primary_equipment_specialization','shift_one','shift_two','shift_three','is_under_leave','local_mobile_number','employee_status','reporting']
    filterset_fields = {
        'id': ['exact', 'in'],
        'is_available' : ['exact','in','iexact', 'contains','icontains'],
        "grade": ['exact', 'in'],
        "employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "employee_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],  
          
        "first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],

        "last_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                            'iendswith'],
                            
        "sponsors": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                     'iendswith'],
        "department__department_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                        'istartswith',
                                        'iendswith','in'],
        "designation__designation_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                          'istartswith','in',
                                          'iendswith'],
        "gender": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                   'istartswith',
                   'iendswith'],
        "local_mobile_number": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        'istartswith',
        'iendswith'],
        # "primary_equipment_specialization":  ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        #            'istartswith',
        #            'iendswith'],
        "dob": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                'istartswith',
                'iendswith'],
        'cicpa_expiry_date': ['exact', 'lt', 'gt', 'lte', 'gte'],
        "cicpa_number": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                'iendswith'],
        "employee_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "grade__grade_description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                                     'istartswith',
                                     'iendswith'],
        "is_under_leave":  ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],                                   
        "is_active": ['exact'],
        "is_sal_created": ['exact'],
        "b_id": ['exact','in'],
        "system_user": ['exact'],
        "device_id": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                      'iendswith'],
        "biometric_key": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "doj": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                'iendswith'],
        "emirates_id_no": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                           'iendswith'],
        "emirates_id_expiry_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "license_number": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        "shift_one": ['exact', 'in','iexact'],
        "shift_two": ['exact', 'in','iexact'],
        "shift_three": ['exact', 'in','iexact'],
        "user__id": ['exact'],
        "reporting": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(EmployeeMaster, EmployeeMasterSerializer,
                                                required_fields.split(','))
        return serializers.EmployeeMasterSerializer

    def perform_create(self, serializer):
        from branch.models import Branch
        b_id = getattr(self.request, 'b_id', None) or self.request.data.get('b_id')
        branch = Branch.objects.filter(id=b_id).first()
        if not branch or branch.employee_activation_flow == 'direct':
            serializer.save(employee_status='Available')
        else:
            serializer.save(employee_status='Onboarding')

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
    


    @action(detail=False, methods=['GET'], url_path='employee-filter-sales')
    def simple_filter_employees(self, request, client=None):
        """
        Simple filter that always includes specific employee by code
        """
        # Get base queryset
        base_queryset = self.get_queryset()
        
        # Get the employee code from query params, default to 'E10002'
        # employee_code = request.query_params.get('always_include_employee', 'E10002')
        employee_code = request.query_params.get('always_include_employee', 'E10002,E10376')
        employee_code_list = [code.strip() for code in employee_code.split(',') if code.strip()]
        
        # Debug: Check if employee exists in base queryset
        # employee_exists = base_queryset.filter(employee_code=employee_code).exists()
        # print(f"Employee {employee_code} in base queryset: {employee_exists}")
        
        # if employee_exists:
        #     employee_obj = base_queryset.filter(employee_code=employee_code).first()
        #     print(f"Employee {employee_code} details - is_active: {employee_obj.is_active}, designation: {employee_obj.designation.designation_name if employee_obj.designation else 'None'}")
                
        special_employee_queryset = base_queryset.filter(employee_code__in=employee_code_list)

        print(f"Always include employee codes: {employee_code_list}")
        print(f"Special employees found: {list(special_employee_queryset.values_list('employee_code', flat=True))}")
        # Apply the view's filters
        queryset = self.filter_queryset(base_queryset)
        
        # Add 'required_fields' and 'always_include_employee' to exclude params
        EXCLUDE_PARAMS = ['page_size', 'page', 'search_key', 'ordering', 'sort', 'limit', 'offset', 'required_fields', 'always_include_employee', 'w_id']

        # Build filter dictionary
        filter_kwargs = {}
        for param_name, param_value in request.query_params.items():
            if (param_value not in ['', 'null', 'undefined', 'None'] and param_name not in EXCLUDE_PARAMS):
                if param_value.lower() in ['true','false']:
                    filter_kwargs[param_name] = param_value.lower() == 'true'
                else:
                    filter_kwargs[param_name] = param_value
        
        print(f"Applying filters: {filter_kwargs}")
        print(f"Always including employee: {employee_code}")

        # Get filtered results
        if filter_kwargs:
            filtered_queryset = queryset.filter(**filter_kwargs)
        else:
            filtered_queryset = queryset.all()
        
        # Get the specified employee from the ORIGINAL base queryset
        # special_employee_queryset = base_queryset.filter(employee_code=employee_code)
        
        # Get IDs from both querysets
        filtered_ids = list(filtered_queryset.values_list('id', flat=True))
        special_employee_ids = list(special_employee_queryset.values_list('id', flat=True))
        
        # Combine IDs and remove duplicates
        all_ids = list(set(filtered_ids + special_employee_ids))
        
        # Get the final queryset in the correct order
        final_queryset = base_queryset.filter(id__in=all_ids).order_by('id')
        
        print(f"Filtered count: {filtered_queryset.count()}")
        # print(f"Employee {employee_code} exists: {special_employee_queryset.exists()}")
        print(f"Final queryset count: {final_queryset.count()}")
        # print(f"Employee {employee_code} in final: {final_queryset.filter(employee_code=employee_code).exists()}")
        print(f"Special employees exist: {special_employee_queryset.exists()}")
        print(f"Special employees in final: {list(final_queryset.filter(employee_code__in=employee_code_list).values_list('employee_code', flat=True))}")
        
        page = self.paginate_queryset(final_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(final_queryset, many=True)
        return Response(serializer.data)
        
    def filter_employees_on_leave(self, queryset):
        """
        Filter out employees who are on approved leave today
        """
        from django.utils import timezone
        from django.db.models import Exists, OuterRef
        
        today = timezone.now().date()
        
        # # Subquery to find employees on approved leave today
        # on_leave_subquery = LeaveEntry.objects.filter(
        #     employee=OuterRef('pk'),
        #     approval_status='APPROVED',
        #     from_date__lte=today,
        #     to_date__gte=today
        # )

                
        # Exclude employees who are on leave
        # queryset = queryset.exclude(Exists(on_leave_subquery))
    
        
        # 1. Employees on leave from LeaveEntry
        on_leave_entry = LeaveEntry.objects.filter(
            employee=OuterRef('pk'),
            approval_status='APPROVED',
            from_date__lte=today,
            to_date__gte=today,
            is_extension=False
        )
        
        # 2. Employees on leave from LeaveApplication
        on_leave_application = LeaveApplication.objects.filter(
            employee_code=OuterRef('pk'),
            approval_status='APPROVED',
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today
        )
        
        # 3. Extended Leave query
        on_leave_entry_extended  = LeaveEntry.objects.filter(
            employee=OuterRef('pk'),
            approval_status='APPROVED',
            is_extension=True,  # Extended leave flag
            from_date__lte=today,
            extended_to_date__gte=today  # Extended end date
        )

        
        # 4. Employees with approved reversal (for BOTH leave types)
        has_reversal = LeaveReversalRequest.objects.filter(
            employee=OuterRef('pk'),
            approval_status='APPROVED',
            reverse_from_date__lte=today,
            reverse_to_date__gte=today
        ).filter(
            # Either leave_entry OR leave_application
            Q(leave_entry__from_date__lte=today, leave_entry__to_date__gte=today) |
            Q(leave_application__new_leave_start_date__lte=today, 
            leave_application__new_leave_end_date__gte=today)
        )
        
        # FINAL: Include if:
        # - NOT on any leave, OR
        # - On leave but has approved reversal
        queryset = queryset.filter(
            ~(Exists(on_leave_entry) | 
            Exists(on_leave_application) | 
            Exists(on_leave_entry_extended)) |
            Exists(has_reversal)
        )
        
            
        return queryset

    # custom full (first name + last name serach for all op dropdowns)
    def filter_queryset(self, queryset):
        is_operator_dropdown = (
            self.request.query_params.get('request_type') == 'operator_dropdown'
        )

        search_value = self.request.query_params.get('search', '').strip()

        if is_operator_dropdown and search_value:

            # Apply all existing filters except DRF SearchFilter.
            # Search is handled below manually for operator dropdown.
            for backend in self.filter_backends:
                if backend == filters.SearchFilter:
                    continue

                queryset = backend().filter_queryset(
                    self.request,
                    queryset,
                    self,
                )

            search_filter = (
                Q(first_name__icontains=search_value)
                | Q(last_name__icontains=search_value)
                | Q(employee_code__icontains=search_value)
                | Q(local_mobile_number__icontains=search_value)
            )

            # Only build/use full-name logic when user actually searches
            # multiple words, e.g. "DILBAG SINGH".
            search_parts = search_value.split()

            if len(search_parts) > 1:
                from django.db.models import Value
                from django.db.models.functions import Concat, Coalesce

                queryset = queryset.annotate(
                    full_name=Concat(
                        Coalesce('first_name', Value('')),
                        Value(' '),
                        Coalesce('last_name', Value('')),
                    )
                )

                search_filter |= Q(full_name__icontains=search_value)

            return queryset.filter(search_filter)

        return super().filter_queryset(queryset)
        
        
    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get('primary_equipment_specialization', None)
        # Check for specific dropdown type
        is_operator_dropdown = self.request.query_params.get('request_type') == 'operator_dropdown'
        sales_params = self.request.query_params.get('designation__designation_name')
        is_sales = False
        if sales_params == 'sales executive':  
            is_sales = True
        
        exclude_on_leave = self.request.query_params.get('exclude_on_leave') == 'true'

        # Handle branch user logic (skip for dropdown requests)
        if getattr(user, 'all_branch_user', False) and not is_operator_dropdown:
            self.request.b_id = self.request.query_params.get('b_id')
            self.request._mutable = True
            self.request.query_params._mutable = True
            self.request.query_params.pop('b_id', None)
            self.request.query_params._mutable = False
        
        # Apply category filter only for operator dropdown requests
        if category is not None and is_operator_dropdown:
            print("Applying dropdown filter for operator", category)
            self.queryset = self.queryset.extra(
                where=["primary_equipment_specialization @> %s"],
                params=[f'[{{"key": "{category}"}}]']
            )

        if exclude_on_leave:
            print("Filtering out employees on leave")
            self.queryset = self.filter_employees_on_leave(self.queryset)

        # custom filter virtual 'display_employee_status' field.
        self.queryset = self.apply_display_status_filter(self.queryset)
        
        # Return appropriate queryset
        if is_operator_dropdown:
            base = self.queryset.distinct()
        else:
            base = super().get_queryset()

        # Apply ordering from query param if provided (supports OrderingFilter).
        # .distinct() is intentionally removed here — it conflicts with ORDER BY
        # on non-SELECT columns in PostgreSQL. Distinct behaviour is preserved
        # by the model-level queryset and filterset.
        ordering = self.request.query_params.get('ordering')
        if ordering:
            allowed = {'employee_code', '-employee_code', 'first_name', '-first_name', 'modified', '-modified'}
            if ordering in allowed:
                base = base.order_by(ordering)
            else:
                base = base.order_by('-modified')
        else:
            base = base.order_by('-modified')

        return base
    

    @action(detail=False, methods=['GET'], url_path='employee_salary')
    def employee_salary(self, request, *args, **kwargs):
        from_date       = request.query_params.get('from_date')
        to_date         = request.query_params.get('to_date')
        month           = request.query_params.get('month')
        b_id            = getattr(request, 'b_id', None) or request.query_params.get('b_id')
        employee_type   = request.query_params.get('employee_type')
        employee_ids    = request.query_params.get('employee')
        designation_ids = request.query_params.get('designation')
        department_ids  = request.query_params.get('department')
        sponsor_values  = request.query_params.get('sponsor')
        # Exclude employees with 0 payable days (default: True)
        _excl_str = request.query_params.get('exclude_zero_payable', 'true')
        exclude_zero_payable = _excl_str.lower() != 'false'
        # Derive from_date/to_date from month when not explicitly provided
        if month and (not from_date or from_date in ('null', 'undefined', '')):
            import calendar
            from datetime import date as _date
            m = int(month)
            year = _date.today().year
            last_day = calendar.monthrange(year, m)[1]
            from_date = f"01-{m:02d}-{year}"
            to_date   = f"{last_day:02d}-{m:02d}-{year}"

        if not (from_date and to_date) or from_date in ('null', 'undefined'):
            return Response([])

        master_service = importlib.import_module('hrm_master.api.service')
        sal_signal = master_service.MasterSignal
        sal_signal.validate_dates(from_date, to_date)

        if employee_type:
            results = sal_signal.salary_calculation(employee_type, from_date, to_date, b_id, exclude_zero_payable)
        elif employee_ids:
            results = sal_signal.salary_calculation_by_employees(employee_ids, from_date, to_date, b_id, exclude_zero_payable)
        elif designation_ids:
            results = sal_signal.salary_calculation_by_designation(designation_ids, from_date, to_date, b_id, exclude_zero_payable)
        elif department_ids:
            results = sal_signal.salary_calculation_by_department(department_ids, from_date, to_date, b_id, exclude_zero_payable)
        elif sponsor_values:
            results = sal_signal.salary_calculation_by_sponsor(sponsor_values, from_date, to_date, b_id, exclude_zero_payable)
        else:
            # No filter — load all active employees for this branch
            results = sal_signal.salary_calculation_all(from_date, to_date, b_id, exclude_zero_payable)

        # Inject other_allowances (total) and other_allowances_detail (per-allowance list)
        # Calculation is type-aware:
        #   fixed_per_day  → amount × present_days
        #   monthly_fixed  → amount (full month, no proration)
        #   hourly         → rate × (total_worked_minutes / 60)
        try:
            from hrm_master.models import AllowanceAssignment
            from django.db.models import Q as _Q
            import datetime as _dt
            _parse = lambda s: _dt.datetime.strptime(s, '%d-%m-%Y').date() if s else None
            period_start = _parse(from_date)
            period_end   = _parse(to_date)
            if period_start and period_end:
                detail_qs = AllowanceAssignment.objects.filter(
                    is_active=True, approval_status='APPROVED'
                ).filter(
                    _Q(from_date__lte=period_end) & (_Q(to_date__gte=period_start) | _Q(to_date__isnull=True))
                ).values('employee_id', 'allowance_name', 'allowance_type', 'amount', 'rate')
                if b_id:
                    detail_qs = detail_qs.filter(b_id=b_id)

                # Build a quick lookup from the results: employee_id -> (present_days, total_worked_minutes)
                emp_attendance_map = {}  # employee_id (str) -> {present_days, worked_minutes}
                for row in (results or []):
                    _eid = str(row.get('employee') or row.get('employee_id') or '')
                    if _eid:
                        emp_attendance_map[_eid] = {
                            'present_days':    int(row.get('no_of_days') or 0),
                            'worked_minutes':  float(row.get('total_worked_minutes') or 0),
                        }

                # Build per-employee: computed amount + detail list
                allowance_total_map  = {}   # employee_id -> float total
                allowance_detail_map = {}   # employee_id -> [{name, amount}, ...]
                for rec in detail_qs:
                    _eid      = str(rec['employee_id'])
                    _name     = rec['allowance_name'] or 'Allowance'
                    _atype    = rec['allowance_type'] or 'monthly_fixed'
                    _amount   = float(rec['amount'] or 0)   # used for fixed_per_day / monthly_fixed
                    _rate     = float(rec['rate']   or 0)   # used for hourly

                    _att = emp_attendance_map.get(_eid, {})
                    _present_days   = _att.get('present_days', 0)
                    _worked_minutes = _att.get('worked_minutes', 0)

                    if _atype == 'fixed_per_day':
                        computed_amt = round(_amount * _present_days, 2)
                    elif _atype == 'hourly':
                        _worked_hours = round(_worked_minutes / 60, 4)
                        computed_amt  = round(_rate * _worked_hours, 2)
                    else:  # monthly_fixed (or any unknown type) — full amount
                        computed_amt = _amount

                    allowance_total_map[_eid]  = allowance_total_map.get(_eid, 0) + computed_amt
                    allowance_detail_map.setdefault(_eid, []).append({'name': _name, 'amount': computed_amt})

                for row in (results or []):
                    emp_id = str(row.get('employee') or row.get('employee_id') or row.get('id') or '')
                    row['other_allowances']        = round(allowance_total_map.get(emp_id, 0), 2)
                    row['other_allowances_detail'] = allowance_detail_map.get(emp_id, [])
        except Exception:
            pass

        return Response(results)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        LeaveMaster = models.LeaveMaster.objects.filter(employee=instance.id)
        LeaveMaster.update(is_active=False)
        GratuityEmployee = GratuityEmployeeForm.objects.filter(employee=instance.id)
        instance.is_active = False  
        instance.save()             
        GratuityEmployee.update(is_active=False)
        # self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    @action(detail=False,methods=['POST'], url_path='passport_image')
    def upload_passport_image(self,request,*args,**kwrgs):
        try:
            if 'image' not in request.FILES:
                # print("request.FILES",request.FILES)
                return Response({'error' : 'No image file provided'},status=400)
            
            file = request.FILES['image']
            # print("file",file)
            files = {'image' : (file.name,file.read(), file.content_type)}
            # print("files",files)
            data = {
                'api_key': 'SANADI123',
            }

            response = requests.post('http://195.229.138.24/pps/detect',
                                    files=files,
                                    data=data,
                                    timeout=180
                                      )
            response.raise_for_status()
            print("response",response)
            passport_data = response.json()
            print("passport data",passport_data)
            return  Response(
                {
                    'success': True,
                    'data': passport_data,

                }
            )
        except requests.exceptions.Timeout:
            return Response({
                "success": False,
                "error": "PassPort Timeout. Please try again"
            },status=504)
        except requests.exceptions.RequestException:
            return Response({
                "success": False,
                "error": "PassPort Service Error"
            },status=500)
        except Exception as e:
            return Response({
                "success": False,
                "error": f'Server Error : {str(e)}'
            },status=500)


    @action(detail=False, methods=['POST'], url_path='emirates_image')
    def upload_emirates_image(self, request, *args, **kwargs): 
        try:
            # 1. Get the uploaded file from request
            if 'image' not in request.FILES:
                return Response({'error': 'No image file provided'}, status=400)
            
            file = request.FILES['image']
            
            # 2. Get parameters from request
            side = request.POST.get('side', 'front')
            
            # 3. Prepare for external API call
            files = {'image': (file.name, file.read(), file.content_type)}
            data = {
                'api_key': 'SANADI123',  # Your API key - keep on server
                'side': side
            }
                        
            # 4. Call the external OCR API
            response = requests.post(
                'http://195.229.138.24/ocr/emirates_detect',
                files=files,
                data=data,
                timeout=60
            )
            
            # 5. Check if external API call was successful
            response.raise_for_status()
            
            # 6. Parse and return the response
            ocr_data = response.json()
            
            logger.info(f"Emirates successful for {file.name}: {ocr_data}")
            
            # Return the extracted data
            return Response({
                'success': True,
                'data': ocr_data,
                'id_number': ocr_data.get('id_number'),
                'issuing_date': ocr_data.get('issuing_date'),
                'expiry_date': ocr_data.get('expiry_date')
            })
            
        except requests.exceptions.Timeout:
            logger.error(f"OCR API timeout for {file.name if 'file' in locals() else 'unknown'}")
            return Response({
                'success': False,
                'error': 'Emirates Upload service timeout. Please try again.'
            }, status=504)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Emirates API error: {str(e)}")
            return Response({
                'success': False,
                'error': f'Emirates service error: {str(e)}'
            }, status=500)
            
        except Exception as e:
            logger.error(f"Server error in Emirates OCR: {str(e)}")
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}'
            }, status=500)


    @action(detail=False, methods=['GET'], url_path='grade_details')
    def grade_details(self, request, *args, **kwargs):
        id = request.query_params.get('id')
        b_id = request.query_params.get('b_id')
        queryset = self.filter_queryset(self.get_queryset().filter(id=id))
        try:
            instance = queryset.first()
            grade_object = Grade.objects.get(id=instance.grade.id) 
        except Grade.DoesNotExist:
            return Response({"error": "Grade not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = EmployeeMasterSerializer(instance)
        grade_serializer = GradeSerializer(grade_object)

        # Construct the response data
        response_data = {
            "employee_data": serializer.data,
            "grade_data": grade_serializer.data,
        }

        return Response(response_data)

    @action(detail=True, methods=['get'])
    def employees_for_leave(self, request, pk=None, client=None):
        """
        Get employee details for leave application with ticket information.
        """
        try:
            employee = self.queryset.get(pk=pk, is_active=True)
            ticket_master_obj = TicketMaster.objects.filter(employee=employee).first()  # Fixed typo
            leave_master_obj = LeaveMasterDetails.objects.filter(leave_master__employee=employee,
                                                                 leave_type='Annual Leave').last()
            last_leave_application = LeaveApplication.objects.filter(employee_code=employee,
                                                                     approval_status="APPROVED").order_by('id').last()
            response_data = {
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "doj": employee.doj.strftime('%d-%m-%Y') if employee.doj else None,
                "home_mobile_number": employee.home_mobile_number,
                "local_mobile_no": employee.local_mobile_number,
                "passport_expiry_date": employee.passport_expiry_date.strftime(
                    '%d-%m-%Y') if employee.passport_expiry_date else None,
                "visa_expiry_date": employee.visa_expiry_date.strftime(
                    '%d-%m-%Y') if employee.visa_expiry_date else None,
                "emirates_id_expiry_date": employee.emirates_id_expiry_date.strftime(
                    '%d-%m-%Y') if employee.emirates_id_expiry_date else None,
                "labour_card_expiry_date": employee.labour_card_expiry_date.strftime(
                    '%d-%m-%Y') if employee.labour_card_expiry_date else None,
                "job_loss_insurance_expiry_date": employee.job_loss_insurance_expiry_date.strftime(
                    '%d-%m-%Y') if employee.job_loss_insurance_expiry_date else None,
                "department_id": employee.department.id if employee.department else None,
                "department_code": employee.department.department_code if employee.department else None,
                "department_name": employee.department.department_name if employee.department else None,
                "next_ticket_eligible_period": ticket_master_obj.next_ticket_eligible_period if ticket_master_obj else '',
                "ticket_eligible_month": ticket_master_obj.ticket_eligible_month if ticket_master_obj else '',
                "ticket_sector": ticket_master_obj.ticket_sector if ticket_master_obj else '',
                'lop': last_leave_application.late_early_days_by if last_leave_application and last_leave_application.late_early_days_by and float(
                    last_leave_application.late_early_days_by) < 0 else "0",
                "leave_days_eligible": leave_master_obj.available_leaves if leave_master_obj else 0,
                "leave_approved_start_date": (
                    last_leave_application.leave_approved_start_date.strftime('%d-%m-%Y')
                    if last_leave_application and last_leave_application.leave_approved_start_date
                    else None
                ),
                "leave_approved_end_date": (
                    last_leave_application.leave_approved_end_date.strftime('%d-%m-%Y')
                    if last_leave_application and last_leave_application.leave_approved_end_date
                    else None
                ),
                "leave_approved_days": (
                    last_leave_application.leave_approved_days if last_leave_application else None
                ),
                "was_on_leave_till": (
                    last_leave_application.was_on_leave_till.strftime('%d-%m-%Y')
                    if last_leave_application and last_leave_application.was_on_leave_till
                    else None
                ),
                "resume_duty_on": (
                    last_leave_application.resume_duty_on.strftime('%d-%m-%Y')
                    if last_leave_application and last_leave_application.resume_duty_on
                    else None
                ),
                "ticket_period": (
                    last_leave_application.ticket_period_for if last_leave_application else None
                ),
                "ticket_provided_by": (
                    last_leave_application.ticket_provided_by if last_leave_application else None
                )

            }

            return Response(response_data, status=status.HTTP_200_OK)
        except EmployeeMaster.DoesNotExist:
            return Response({"message": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'], url_path='cicpaRenewalforWorkers')
    def employee_cicpa_renewal(self, request, *args, **kwargs):
        try:
            today = date.today()
            upcoming_renewal_date = today + timedelta(days=30)

            search_query = request.query_params.get('search')

            filters = Q(cicpa_expiry_date__gte=today, cicpa_expiry_date__lte=upcoming_renewal_date,is_active=True)

            if search_query:
                try:
                    search_date = datetime.strptime(search_query, '%d-%m-%Y').date()
                except ValueError:
                    search_date = None
                filters &= (
                        Q(employee_code__icontains=search_query) |
                        Q(first_name__icontains=search_query) |
                        Q(cicpa_number__icontains=search_query) |
                        (Q(cicpa_expiry_date=search_date) if search_date else Q())
                )

            queryset = EmployeeMaster.objects.filter(filters).order_by('cicpa_expiry_date')

            # Apply pagination if set
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = EmployeeMasterSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = EmployeeMasterSerializer(queryset, many=True)
            return Response({'results': serializer.data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=False, methods=['GET'], url_path='others')
    def others_doc_renewal(self, request, *args, **kwargs):
        try:
            today = date.today()
            upcoming_renewal_date = today + timedelta(days=30)
            search_query = request.query_params.get('search')
            document_name_filter = request.query_params.get('document_name')

            # Filter employee documents with expiry within the next 30 days
            filters = Q(document_valid_upto__gte=today, document_valid_upto__lte=upcoming_renewal_date, is_active=True)

            if search_query:
                filters &= (
                    Q(employee_document__employee_code__icontains=search_query) |
                    Q(employee_document__first_name__icontains=search_query) |
                    Q(document_name__icontains=search_query) |
                    Q(document_number__icontains=search_query) |
                    Q(document_valid_upto__icontains=search_query)
                )

            # Add document name filter - use exact match instead of icontains
            if document_name_filter and document_name_filter != 'all':
                filters &= Q(document_name=document_name_filter)

            queryset = EmployeeDocumentsDetails.objects.filter(filters).select_related('employee_document').order_by('document_valid_upto')

            from django.db.models import Count

            document_names_query = EmployeeDocumentsDetails.objects.filter(
                document_valid_upto__gte=today,
                document_valid_upto__lte=upcoming_renewal_date,
                is_active=True
            ).exclude(
                document_name__isnull=True
            ).exclude(
                document_name=''
            ).values(
                'document_name'
            ).annotate(
                count=Count('document_name')
            ).order_by('document_name')

            unique_document_names = [item['document_name'] for item in document_names_query]

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = EmployeeDocumentsDetailsSerializer(page, many=True, context={'request': request})
                response = self.get_paginated_response(serializer.data)
                response.data['document_names'] = unique_document_names
                return response

            serializer = EmployeeDocumentsDetailsSerializer(queryset, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'document_names': unique_document_names
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    #Operator release
    @action(detail=True, methods=["post"], url_path="release")
    def release(self, request, pk=None, **kwargs):
        """
        Release an employee. Accepts extra kwargs like 'client' if passed by router/middleware.
        """
        employee = self.get_object()  
        data = request.data.copy()
        data["employee"] = employee.id

        serializer = EmployeeReleaseSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "status": "success",
                "message": f"{employee.first_name} released successfully",
                "id": employee.id,  
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


    def apply_display_status_filter(self, queryset):
        """
        Handles filtering for the virtual 'display_employee_status' field.
        Since it's a SerializerMethodField (not a real DB field), we intercept
        it here and map it to real DB conditions before DjangoFilterBackend runs.
        """
        display_status_value = None

        for key, value in self.request.query_params.items():
            if 'display_employee_status' in key:
                display_status_value = value.strip().lower()
                self.request.query_params._mutable = True
                self.request.query_params.pop(key)
                self.request.query_params._mutable = False
                break

        if not display_status_value:
            return queryset

        from django.db.models import Exists, OuterRef
        from django.utils import timezone
        today = timezone.now().date()

        active_leave_entry_qs = LeaveEntry.objects.filter(
            employee=OuterRef('pk'),
            approval_status='APPROVED',
            is_active=True,
            from_date__lte=today,
            to_date__gte=today
        ).exclude(
            id__in=LeaveReversalRequest.objects.filter(
                approval_status='APPROVED',
                is_active=True,
                leave_entry__isnull=False,
                reverse_from_date__lte=today,
                reverse_to_date__gte=today
            ).values_list('leave_entry_id', flat=True)
        )

        active_leave_app_qs = LeaveApplication.objects.filter(
            employee_code=OuterRef('pk'),
            approval_status='APPROVED',
            is_active=True,
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today
        ).exclude(
            id__in=LeaveReversalRequest.objects.filter(
                approval_status='APPROVED',
                is_active=True,
                leave_application__isnull=False,
                reverse_from_date__lte=today,
                reverse_to_date__gte=today
            ).values_list('leave_application_id', flat=True)
        )

        has_active_leave = Exists(active_leave_entry_qs) | Exists(active_leave_app_qs)

        status_map = {
            'on leave':   lambda qs: qs.filter(is_under_leave=True).filter(has_active_leave),
            'not joined': lambda qs: qs.filter(is_under_leave=True).exclude(has_active_leave),
            'available':  lambda qs: qs.filter(is_under_leave=False, is_available=True),
            'on hire':    lambda qs: qs.filter(is_under_leave=False, is_available=False),
        }

        filter_fn = status_map.get(display_status_value)
        if filter_fn:
            queryset = filter_fn(queryset)

        return queryset

class DocumentTypeMasterViewSet(viewsets.ModelViewSet):
    """ViewSet for the Document Type Master lookup (Employee documents only)"""
    queryset = DocumentTypeMaster.objects.all().order_by("-modified", "-id")
    serializer_class = DocumentTypeMasterSerializer

    search_fields = [
        "doc_type_code",
        "doc_type_name",
        "remarks",
    ]

    filterset_fields = {
        "id": ["exact", "in"],
        "doc_type_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        "doc_type_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        "expiry_required": ["exact"],
        "is_active": ["exact", "in"],
    }

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_queryset(self):
        queryset = super().get_queryset()

        expiry_required = self.request.query_params.get("expiry_required")
        if expiry_required:
            value = expiry_required.lower()
            if value in ["true", "yes", "required"]:
                queryset = queryset.filter(expiry_required=True)
            elif value in ["false", "no", "not required"]:
                queryset = queryset.filter(expiry_required=False)

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        DocumentTypeMaster.objects.filter(pk=instance.pk).update(is_active=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveEntryViewSet(MultiApprovalStagesViewSetMixin, CustomModelViewSet):
    queryset = LeaveEntry.objects.all().order_by('-modified')
    serializer_class = LeaveEntrySerializer
    search_fields = ['employee__employee_code', 'employee__first_name', 'no_of_days',
                     'from_date', 'to_date', 'approval_status', 'approval_remarks','leave_type__status_name'] 
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee': ['exact', 'in'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                 'iendswith'],
        # "leave_type__leave_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
        #                            'iendswith'],
        "no_of_days": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],

        "leave_type__status_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
            'iendswith'],
            
        "from_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "to_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],

        "approval_remarks": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        'istartswith', 'iendswith'], 
        "is_active": ['exact'],
        "b_id": ['exact'],
        'employee__user__id': ['exact', 'in'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(LeaveEntry, LeaveEntrySerializer,
                                                required_fields.split(','))
        return serializers.LeaveEntrySerializer
    
        
    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False
        return super().get_queryset().distinct()

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
                queryset = queryset.filter(Q(employee=user.employee.id) |
                                           Q(employee__first_reporting_authority__id=user.employee.id) |
                                           Q(employee__second_reporting_authority__id=user.employee.id))
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['GET'], url_path='get_leave_applied_by_reporting_authority')
    def get_leave_applied_by_reporting_authority(self, request, client):
        approval_stages_user = request.query_params.get('approval_stages__user')
        b_id = request.query_params.get('b_id')

        leave_entry_queryset = (LeaveEntry.objects.filter(is_active=True, b_id=b_id, approval_status="PENDING_APPROVAL").filter(
            Q(employee__first_reporting_authority__user__id=approval_stages_user) |
            Q(approval_stages__created_user=approval_stages_user)
        ).exclude(employee__user=approval_stages_user).distinct('id')
        .annotate(e_code_name=Concat(F("employee__employee_code"),Value(" - "),F("employee__first_name")), emp_type=F("employee__employee_type"),form=Value("leave_entry"), leave_types=F("leave_type__status_name"), leave_days=F("no_of_days"))
        .values("id", "e_code_name", "leave_types", "from_date", "to_date", "leave_days", "approval_remarks", "emp_type", "modified","form"))

        leave_application_queryset = (LeaveApplication.objects.filter(is_active=True, b_id=b_id, approval_status="PENDING_APPROVAL").filter(
            Q(employee_code__first_reporting_authority__user__id=approval_stages_user) |
            Q(approval_stages__created_user=approval_stages_user)
        ).exclude(employee_code__user=approval_stages_user).distinct('id')
        .annotate(e_code_name=Concat(F("employee_code__employee_code"),Value(" - "),F("employee_code__first_name")), emp_type=F("employee_code__employee_type"),
            leave_types=Value("Annual Leave") , from_date=F("leave_approved_start_date"), to_date=F("leave_approved_end_date"),form=Value("leave_application"), leave_days=F("leave_approved_days"))
        .values("id", "e_code_name", "leave_types", "from_date", "to_date",
            "leave_days", "approval_remarks", "emp_type", "modified","form"))
        combined = list(chain(leave_entry_queryset, leave_application_queryset))
        combined_sorted = sorted(combined, key=lambda x: x.get('modified', datetime.min))
        return Response(combined_sorted)


    @action(detail=False, methods=["post"], url_path="bulk-approve")
    def bulk_approve(self, request, client=None):
        items = request.data

        updated_entries = []

        for item in items:
            pk = item.get("id")
            form = item.get("form")

            if not pk or not form:
                raise rest_serializer.ValidationError(f"Missing 'id' or 'form' in item: {item}")

            data = {
                'approval_stage_status': "APPROVED",
                'stage_name': "Approver",
                'approval_permission_code': [
                    "hrm_master.custom_approval_stage_initiator",
                    "hrm_master.custom_approval_stage_approver"
                ]
            }

            try:
                if form == "leave_entry":
                    instance = LeaveEntry.objects.get(pk=pk)
                    instance_data = model_to_dict(instance)
                    merged_data = {**instance_data, **data}
                    serializer = LeaveEntrySerializer(instance, data=merged_data, partial=True, context={'request':request})

                elif form == "leave_application":
                    instance = LeaveApplication.objects.get(pk=pk)
                    instance_data = model_to_dict(instance)
                    merged_data = {**instance_data, **data}
                    serializer = LeaveApplicationSerializer(instance, data=merged_data, partial=True,context={'request':request})
                else:
                    raise rest_serializer.ValidationError(f"Invalid form value '{form}' for item ID {pk}")

                serializer.is_valid(raise_exception=True)
                serializer.save()
                updated_entries.append(pk)

            except LeaveEntry.DoesNotExist:
                raise rest_serializer.ValidationError(f"LeaveEntry with ID {pk} does not exist")
            except LeaveApplication.DoesNotExist:
                raise rest_serializer.ValidationError(f"LeaveApplication with ID {pk} does not exist")
            except Exception as e:
                raise rest_serializer.ValidationError(f"Unexpected error for ID {pk}: {str(e)}")

        return Response({
            "approved": updated_entries,
            "message": "All items approved successfully"
        }, status=status.HTTP_200_OK)


class LeaveDetailsViewSet(viewsets.ModelViewSet):
    queryset = LeaveDetails.objects.all().order_by('-modified')
    serializer_class = LeaveDetailsSerializer
    search_fields = []
    filterset_fields = {
        'id': ['exact', 'in'],
        'grade': ['exact', 'in'],
        "leave_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]


class LeaveReversalRequestViewSet(MultiApprovalStagesViewSetMixin, CustomModelViewSet):
    queryset = LeaveReversalRequest.objects.all().order_by('-modified')
    serializer_class = LeaveReversalRequestSerializer
    search_fields = ['employee__employee_code','employee__first_name', 'reverse_from_date',
                     'reverse_to_date', 'approval_status','leave_entry__leave_type__status_name', 'reason_for_reversal']
    filterset_fields = {
        'id': ['exact', 'in'],
        "is_active": ['exact'],
        "leave_entry": ['exact'],
        'employee': ['exact', 'in'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                 'iendswith'],
        "reverse_from_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "reverse_to_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],

        "reason_for_reversal": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                               'istartswith', 'iendswith'],  

        "approval_remarks": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
        'istartswith', 'iendswith'], 
                            
        "leave_entry__leave_type__status_name":['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
        "initiator_reviewer__user": ['exact', 'in'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(LeaveReversalRequest, LeaveReversalRequestSerializer,
                                                required_fields.split(','))
        return serializers.LeaveReversalRequestSerializer

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


class LeaveMasterViewSet(CustomModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = LeaveMaster.objects.all().order_by('-modified')
    serializer_class = LeaveMasterSerializer
    search_fields = ['employee__employee_code', 'employee__first_name', 'employee__last_name', 'total_available_leaves',
                     'total_allocated_leaves', 'total_utilized_leaves','employee__employee_group','employee__department__department_name','employee__employee_type','employee__reporting', 'employee__dob']
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee': ['exact', 'in'],
        "employee__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        "employee__first_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                 'iendswith'],
        "employee__employee_group":  ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                 'iendswith'],
        'employee__last_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                'iendswith'],
        'total_available_leaves': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                   'iendswith'],
        'total_allocated_leaves': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                   'iendswith'],
        'total_utilized_leaves': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                  'iendswith'],

        "employee__department__department_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 
                                                  'istartswith', 'iendswith'],
        
        # Employee Type (direct field in EmployeeMaster)
        "employee__employee_type": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                    'iendswith'],
        
        # Reporting (direct field in EmployeeMaster)
        "employee__reporting": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                                'iendswith'],
        
        # Date of Birth (direct field in EmployeeMaster)
        "employee__dob": ['exact', 'gte', 'lte', 'gt', 'lt'],
        

        "is_active": ['exact'],
        "b_id": ['exact']
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]


    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()

    @action(detail=False, methods=['get'], url_path='by-user-or-manager')
    def by_user_or_manager(self, request, client=None):
        user_id = request.query_params.get('user')

        if not user_id:
            return Response({'detail': '"user" query parameter is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        queryset = self.queryset.filter(
            Q(employee__first_reporting_authority__user__id=user_id) |
            Q(employee__user__id=user_id)
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(LeaveMaster, LeaveMasterSerializer,
                                                required_fields.split(','))
        return serializers.LeaveMasterSerializer

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

    @action(detail=False, methods=['GET'], url_path='export_custom_excel')
    def export_custom_excel(self, request, client):
        employee = request.query_params.get('employee')
        leave_master_instance = LeaveMaster.objects.filter(employee=employee).first()
        leave_details = (LeaveMasterDetails.objects.filter(leave_master=leave_master_instance.id)
                         .values("leave_master__employee__employee_code",
                                 "leave_master__employee__first_name",
                                 "financial_year",
                                 "opening_balance",
                                 "allocated_leaves",
                                 "utilized_leaves",
                                 "available_leaves",
                                 "carry_forward_days",
                                 "lapse_days"))
        last_leave_details = LeaveMasterDetails.objects.filter(leave_master=leave_master_instance.id).last()
        calender_to = ""
        if last_leave_details:
            year = last_leave_details.financial_year.split('-')[1]
            calender_to = date(int(year), 3, 31).strftime("%d-%b-%Y")

        total_leave_details = LeaveMasterDetails.objects.filter(leave_master=leave_master_instance.id).aggregate(
            total_opening_balance=Sum("opening_balance"),
            total_allocated_leaves=Sum("allocated_leaves"),
            total_utilized_leaves=Sum("utilized_leaves"),
            total_available_leaves=Sum("available_leaves"),
            total_carry_forward_days=Sum("carry_forward_days"),
            total_lapse_days=Sum("lapse_days"),
        )
        export = dict(
            leave_master__employee__employee_code="Emp Code",
            leave_master__employee__first_name="Name",
            financial_year="Period",
            opening_balance="Leave Opening Balance",
            allocated_leaves="Leave Credit",
            utilized_leaves="Leave Availed",
            available_leaves="Leave Closing Balance",
            carry_forward_days="Carry forward days",
            lapse_days="Lapse Days",
        )
        return get_leave_master_custom_excel(leave_master_instance, leave_details, "Leave Master", export,
                                             total_leave_details, calender_to)


class LeaveMasterDetailsViewSet(viewsets.ModelViewSet):
    queryset = LeaveMasterDetails.objects.all().order_by('-modified')
    serializer_class = LeaveMasterDetailsSerializer
    search_fields = []
    filterset_fields = {
        'id': ['exact', 'in'],
        'leave_master__employee__id': ['exact', 'in'],
        'leave_type': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact'],
        'leave_master__employee__user__id': ['exact', 'in'],
        'financial_year': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                           'iendswith'],
        # 'leave_master__leave_policy_key__type_of_leave': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
        #                           'iendswith'],
    }
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False, methods=['GET'], url_path='get_available_leaves_from_leave_type')
    def get_available_leaves_from_leave_type(self, request, *args, **kwargs):
        status_name = request.query_params.get('status_name')
        employee = request.query_params.get('employee')
        b_id = request.query_params.get('b_id')

        attendence = AttendanceStatusMaster.objects.filter(status_name=status_name).first()
        leave = LeaveMasterDetails.objects.filter(leave_master__employee__id=employee, leave_type=status_name).last()
        serializer = self.get_serializer(leave)
        response_data = dict(
            leave_data=serializer.data,
            attendence=attendence.id,
            status_name=attendence.status_name,
            
        )
        if leave:
            if leave.leave_policy_key:
                response_data['type_of_days'] = leave.leave_policy_key.type_of_days
                response_data['allow_half_day'] = leave.leave_policy_key.allow_half_day
            else:
                response_data['allow_half_day'] = False
        else:
            response_data['allow_half_day'] = False
        return Response(response_data)

    @action(detail=False, methods=['GET'], url_path='get_availed_leave_info')
    def get_availed_leave_info(self, request, *args, **kwargs):
        lmd_id = request.query_params.get('leave_master_details_id')
        lmd_instance = LeaveMasterDetails.objects.get(id=lmd_id)
        le = (LeaveEntry.objects.filter(employee=lmd_instance.leave_master.employee,
                                        leave_type__status_name=lmd_instance.leave_type,
                                        approval_status="APPROVED")
              .values("from_date", "to_date", "no_of_days", "weekly_off_days", "holiday_days"))
        la = []
        if lmd_instance.leave_type == "Annual Leave":
            la = (LeaveApplication.objects.filter(employee_code=lmd_instance.leave_master.employee,
                                                  approval_status="APPROVED")
                  .annotate(
                from_date=F("leave_approved_start_date"),
                to_date=F("leave_approved_end_date"),
                no_of_days_alias=F("leave_approved_days"),
            ).values(
                "from_date", "to_date"
            ).annotate(
                no_of_days=F("no_of_days_alias"),
                weekly_off_days=Value(str(0)),
                holiday_days=Value(str(0))
            ).values("from_date", "to_date", "no_of_days", "weekly_off_days", "holiday_days"))
        combined = list(chain(le, la))
        data = dict(
            count=len(combined),
            results=combined
        )
        return Response(data)
        # page = self.paginate_queryset(combined)
        # return self.get_paginated_response(page)

    @action(detail=False, methods=['GET'], url_path='get_availed_leave_info/export_excel')
    def export_excel(self, request, client):
        query_params = self.request.query_params.dict()
        fileName = query_params.pop('fileName', None)
        lmd_id = request.query_params.get('leave_master_details_id')
        lmd_instance = LeaveMasterDetails.objects.get(id=lmd_id)
        le = (LeaveEntry.objects.filter(employee=lmd_instance.leave_master.employee,
                                        leave_type__status_name=lmd_instance.leave_type,
                                        approval_status="APPROVED")
              .annotate(e_code=F("employee__employee_code"), first_name=F("employee__first_name"),
                        function=F("employee__department__department_name"),
                        period=Value(str(lmd_instance.financial_year)),
                        status=Value(str(lmd_instance.leave_type)),
                        # from_date_str=Cast("from_date", output_field=CharField()),
                        # to_date_str=Cast("to_date", output_field=CharField()),
                        from_date_str=ToChar(F("from_date")),
                        to_date_str=ToChar(F("to_date")),
                        )
              .values("from_date_str", "to_date_str", "no_of_days", "e_code", "first_name", "period", "function",
                      "status", "weekly_off_days", "holiday_days"))
        la = []
        if lmd_instance.leave_type == "Annual Leave":
            la = (LeaveApplication.objects.filter(employee_code=lmd_instance.leave_master.employee,
                                                  approval_status="APPROVED")
                  .annotate(
                no_of_days_alias=F("leave_approved_days"),
                e_code=F("employee_code__employee_code"),
                first_name=F("employee_code__first_name"),
                function=F("employee_code__department__department_name"),
                period=Value(str(lmd_instance.financial_year)),
                status=Value(str(lmd_instance.leave_type)),
                # from_date_str=Cast("leave_approved_start_date", output_field=CharField()),
                from_date_str=ToChar(F("leave_approved_start_date")),
                to_date_str=ToChar(F("leave_approved_end_date")),
                # to_date_str=Cast("leave_approved_end_date", output_field=CharField()),
            ).values(
                "from_date_str", "to_date_str", "e_code", "first_name", "period", "function", "status"
            ).annotate(
                no_of_days=F("no_of_days_alias"),
                weekly_off_days=Value(0),
                holiday_days=Value(0)
            ).values("from_date_str", "to_date_str", "no_of_days", "e_code", "first_name", "period", "function",
                     "status", "weekly_off_days", "holiday_days"))
        combined = list(chain(le, la))
        export = dict(
            period="Period",
            e_code="Ecode",
            first_name="Name",
            function="Function",
            from_date_str="Leave Start Date",
            to_date_str="Leave End Date",
            no_of_days="Leave Days",
            weekly_off_days="Weekly Off Days",
            holiday_days="Holiday Days",
            status="Status"
        )
        return get_export_file(combined, fileName, export)


class ToChar(Func):
    function = 'TO_CHAR'
    template = "%(function)s(%(expressions)s, 'DD-Mon-YYYY')"
    output_field = CharField()


class HolidayMasterViewSet(viewsets.ModelViewSet):
    queryset = HolidayMaster.objects.all().order_by('-modified')
    serializer_class = HolidayMasterSerializer
    search_fields = ['description']
    filterset_fields = {
        'id': ['exact', 'in'],
        "date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "to_date": ['exact', 'gte', 'lte', 'gt', 'lt'],
        "description": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                        'iendswith'],
        "is_active": ['exact'],
        "approval_status": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                            'istartswith',
                            'iendswith'],
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

    @action(detail=False, methods=['GET'], url_path='get_all_holiday_dates')
    def get_all_holiday_dates(self, request, client):
        now = date.today()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))

        start_of_month = date(year, month, 1)
        end_of_month = date(year, month, monthrange(year, month)[1])

        queryset = self.filter_queryset(
            self.get_queryset().filter(
                Q(date__lte=end_of_month) & Q(to_date__gte=start_of_month)
            )
        )

        all_days = []
        for item in queryset:
            total_days = (item.to_date - item.date).days + 1
            for i in range(total_days):
                current_day = item.date + timedelta(days=i)
                if start_of_month <= current_day <= end_of_month:
                    all_days.append({
                        'date': current_day.isoformat(),
                        'description': item.description  # assuming your model has this field
                    })

        return Response(all_days)



class ShiftTimingsViewSet(viewsets.ModelViewSet):
    queryset = ShiftTimings.objects.all()
    serializer_class = ShiftTimingsSerializer
    search_fields = ['shift_code', 'shift_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        "shift_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith',
                       'istartswith',
                       'iendswith'],
        "shift_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                       'iendswith'],
        "is_active": ['exact'],
        "b_id": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(ShiftTimings, ShiftTimingsSerializer,
                                                required_fields.split(','))
        return serializers.ShiftTimingsSerializer


class LeaveApplicationViewSet(MultiApprovalStagesViewSetMixin, CustomModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = LeaveApplication.objects.all().order_by('-modified')
    serializer_class = LeaveApplicationSerializer
    search_fields = ['employee_name', 'department__department_name', 'location', 'travel_sector', 'emergency_contact_no','employee_code__employee_code','approval_remarks']
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee_code': ['exact', 'in'],
        "employee_name": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "employee_code__employee_code": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                          'iendswith'],
        "department__department_name": ['exact', 'startswith', 'endswith', 'istartswith',
                                        'iendswith'],
        # "department": ['exact'],  # Use 'exact' instead of text-based lookups

        "location": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                     'iendswith'],
        "approval_remarks": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                     'iendswith'],
        "new_leave_start_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "new_leave_end_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "leave_days_applied": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "leave_approved": ['exact'],
        "duties_to_be_covered_by_reliver": ['exact'],
        "leave_approved_days": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "passport_expiry_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "visa_expiry_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "eid_expiry_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "labour_card_expiry_date": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "resume_duty_on": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "was_on_leave_from": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "was_on_leave_till": ['exact', 'gt', 'lt', 'gte', 'lte'],
        "is_active": ['exact'],
        "b_id": ['exact'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()


    @action(detail=False, methods=['get'], url_path='today')
    def today_leaves(self, request, client):
        today = date.today()   

        queryset = self.get_queryset().filter(
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today,
            is_active=True
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

   

class LeavePolicyViewSet(viewsets.ModelViewSet):
    queryset = LeavePolicy.objects.all().order_by('-modified')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    serializer_class = LeavePolicySerializer
    search_fields = ['employee_type', 'employee_group', 'employee_reporting', 'type_of_leave__type']
    filterset_fields = {
        'id': ['exact', 'in'],
        'employee_type': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith', 'in'],
        'employee_group': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'employee_reporting': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'type_of_leave': ['exact', 'in'],
        'type_of_leave__type': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'is_active': ['exact'],
        'b_id': ['exact']
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()


    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(LeavePolicy, LeavePolicySerializer,
                                               required_fields.split(','))
        return serializers.LeavePolicySerializer
    
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

    
class TicketMasterViewSet(CustomModelViewSet):
    queryset = TicketMaster.objects.all().order_by('-modified')
    serializer_class = TicketMasterSerializer
    search_fields = []
    filterset_fields = {
        'id': ['exact', 'in'],
        "is_active": ['exact'],
        "employee": ['exact']
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

  
class SalaryComponentsViewSet(viewsets.ModelViewSet):
    # remove_b_id_for_all_branch_user = True 
    queryset = SalaryComponents.objects.all().annotate(
        type_priority=Case(
            When(type='Allowance', then=0),
            When(type='Deduction', then=1),
            output_field=IntegerField()
        )
    ).order_by('type_priority', 'order')
    serializer_class = SalaryComponentsSerializer
    search_fields = ['component', 'type', 'b_id', 'is_active', 'order']
    filterset_fields = {
        'id': ['exact', 'in'],
        'component': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                      'iendswith'],
        'type': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                 'iendswith'],
        "is_active": ['exact'],
        "order": ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith',
                  'iendswith'],
        "b_id": ['exact']
    }

    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(SalaryComponents, SalaryComponentsSerializer,
                                                required_fields.split(','))
        return SalaryComponentsSerializer

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
    
    def get_queryset(self):
        
        user = self.request.user
        if getattr(user, 'all_branch_user', False):
                self.request.b_id = self.request.query_params.get('b_id')
                self.request._mutable = True  # make query_params editable
                self.request.query_params._mutable = True
                self.request.query_params.pop('b_id', None)
                self.request.query_params._mutable = False

        return super().get_queryset().distinct()


class ShiftMasterViewSet(viewsets.ModelViewSet):
    queryset = ShiftMaster.objects.all().order_by('-modified')
    serializer_class = ShiftMasterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['shift_code', 'shift_name', 'notes']
    filterset_fields = {
        'id': ['exact', 'in'],
        'shift_code': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'shift_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'status': ['exact', 'iexact'],
        'start_time': ['exact','iexact', 'gte', 'lte'],
        'end_time': ['exact','iexact', 'gte', 'lte'],
        'grace_period_in': ['exact','iexact', 'gte', 'lte'],
        'grace_period_out': ['exact','iexact', 'gte', 'lte'],
        'max_ot': ['exact','iexact', 'gte', 'lte'],
        'ot_multiplier': ['exact','iexact', 'gte', 'lte'],
        'ot_rounding': ['exact', 'iexact'],
        'is_cross_midnight': ['exact','iexact'],
        'notes': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'is_active': ['exact'],
    }

    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return get_dynamic_serializer_class(ShiftMaster, ShiftMasterSerializer, required_fields.split(','))
        return ShiftMasterSerializer

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)   
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', 'shift_master_export')
            export = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)


    def destroy(self, request, *args, **kwargs):
        """Override to soft delete instead of hard delete"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        print(f"SOFT DELETE: shift {instance.id}, is_active={instance.is_active}")
     
        return Response(status=status.HTTP_204_NO_CONTENT)

  

class LeavePolicyDetailViewSet(viewsets.ModelViewSet):
    queryset = LeavePolicyDetail.objects.all().order_by('-modified')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    serializer_class = LeavePolicyDetailSerializer
    search_fields = ['b_id','leave_policy__type_of_leave__code','id','leave_policy__type_of_leave__status_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        'leave_policy__type_of_leave': ['exact', 'in'],
        'leave_policy__type_of_leave__code': ['exact', 'in'],
        'leave_policy__type_of_leave__status_name': ['exact', 'in'],
        'is_active': ['exact'],
        'b_id': ['exact'],

    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]
    permission_classes = [IsAuthenticated]


class AllowanceMasterViewSet(CustomModelViewSet):
    queryset = AllowanceMaster.objects.all().order_by('-modified')
    serializer_class = AllowanceMasterSerializer
    search_fields = ['allowance_code', 'allowance_name']
    filterset_fields = {
        'id': ['exact', 'in'],
        'allowance_code': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'allowance_name': ['exact', 'iexact', 'contains', 'icontains', 'startswith', 'endswith', 'istartswith', 'iendswith'],
        'is_active': ['exact'],
        'b_id': ['exact'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]


class AllowanceAssignmentViewSet(CustomModelViewSet):
    queryset = (
        AllowanceAssignment.objects
        .select_related('employee__designation', 'employee__department', 'allowance')
        .all()
        .order_by('-created')
    )
    serializer_class = AllowanceAssignmentSerializer
    filterset_fields = {
        'employee':       ['exact'],
        'allowance':      ['exact'],
        'mode':           ['exact'],
        'is_active':      ['exact'],
        'b_id':           ['exact'],
        'batch_id':       ['exact'],
        'from_date':      ['exact', 'gte', 'lte', 'gt', 'lt'],
        'to_date':        ['exact', 'gte', 'lte', 'gt', 'lt'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]
    search_fields   = ['allowance_name', 'allowance_code', 'employee__first_name', 'employee__employee_code']

    @action(detail=False, methods=['GET'], url_path='batch_list')
    def batch_list(self, request, client=None):
        """Return one row per batch_id — paginated the same way as a standard list."""
        from django.db.models import Count, Max
        qs = self.filter_queryset(self.get_queryset())
        batches = (
            qs.values('batch_id', 'assignment_code', 'allowance_id', 'allowance_name', 'allowance_code',
                      'allowance_type', 'mode', 'amount', 'rate',
                      'from_date', 'to_date',
                      'filter_criteria', 'filter_designation_ids', 'filter_department_ids',
                      'approval_status', 'is_active', 'b_id')
            .annotate(employee_count=Count('id'), latest_created=Max('created'))
            .order_by('-latest_created')
        )

        # Apply standard pagination so the frontend gets { count, next, previous, results }
        page = self.paginate_queryset(batches)
        rows = page if page is not None else list(batches)

        result = []
        for b in rows:
            row = dict(b)
            batch_id_str      = str(b['batch_id'])
            row['batch_id']   = batch_id_str
            # id is compound: used by getApiDataByID → GET /{batch_id}/get_by_batch/
            row['id']         = f"{batch_id_str}/get_by_batch"
            row['allowance']  = b['allowance_id']   # keep as int — matches dropdown optionValue
            row['from_date']  = b['from_date'].strftime('%d-%m-%Y') if b['from_date'] else None
            row['to_date']    = b['to_date'].strftime('%d-%m-%Y')   if b['to_date']   else None
            row['amount_display'] = f"{b['rate']}/unit" if b['mode'] == 'auto' else str(b['amount'])
            result.append(row)

        if page is not None:
            return self.get_paginated_response(result)
        return Response(result)

    @action(detail=True, methods=['GET'], url_path='get_by_batch')
    def get_by_batch(self, request, pk=None, client=None):
        """GET /{batch_id}/get_by_batch/
        Return full batch header + employees list for the edit dialog.
        pk is the batch_id UUID.
        """
        batch_id = str(pk)
        records = (
            AllowanceAssignment.objects
            .filter(batch_id=batch_id)
            .select_related('employee__designation', 'employee__department')
        )
        if not records.exists():
            return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

        first = records.first()
        employees = [
            {
                'employee':         str(e.employee_id),
                'employee_code':    e.employee.employee_code or '',
                'employee_name':    f"{e.employee.first_name or ''} {e.employee.last_name or ''}".strip(),
                'designation_name': e.employee.designation.designation_name if e.employee.designation_id else '',
                'department_name':  e.employee.department.department_name   if e.employee.department_id  else '',
                'amount':           str(e.amount),
                'rate':             str(e.rate),
                'remark':           e.remark or '',
            }
            for e in records
        ]

        # Build allowance_default_object so the frontend dropdown pre-populates on edit
        allowance_code = first.allowance_code or ''
        allowance_name = first.allowance_name or ''
        label_parts = [p for p in [allowance_code, allowance_name] if p]
        allowance_default_object = (
            {'id': first.allowance_id, 'label': ' - '.join(label_parts)}
            if first.allowance_id else {}
        )

        return Response({
            # id is the compound string the footer uses to build the PUT URL:
            # url.put + id + '/'  →  /master/allowance-assignment/{batch_id}/bulk_update_by_batch/
            'id':                     f"{batch_id}/bulk_update_by_batch",
            'batch_id':               batch_id,
            'allowance':              first.allowance_id,
            'allowance_code':         allowance_code,
            'allowance_name':         allowance_name,
            'allowance_type':         first.allowance_type or '',
            'mode':                   first.mode or 'manual',
            'amount':                 str(first.amount),
            'rate':                   str(first.rate),
            'from_date':              first.from_date.strftime('%d-%m-%Y') if first.from_date else '',
            'to_date':                first.to_date.strftime('%d-%m-%Y')   if first.to_date   else '',
            'filter_criteria':        first.filter_criteria        or '',
            'filter_designation_ids': first.filter_designation_ids or '',
            'filter_department_ids':  first.filter_department_ids  or '',
            'assignment_code':        first.assignment_code        or '',
            'approval_status':        first.approval_status        or '',
            'is_active':              first.is_active,
            'employees':              employees,
            'allowance_default_object': allowance_default_object,
        })

    @staticmethod
    def _flatten_serializer_errors(errors):
        """Flatten serializer errors (list or dict) into a single human-readable string."""
        messages = []
        if isinstance(errors, list):
            # many=True — errors is a list; non_field_errors sits at the list level
            # as a dict key, or each item is a per-record dict
            for item in errors:
                if isinstance(item, dict):
                    for field, errs in item.items():
                        for e in (errs if isinstance(errs, list) else [errs]):
                            messages.append(str(e))
                elif item:
                    messages.append(str(item))
        elif isinstance(errors, dict):
            for field, errs in errors.items():
                for e in (errs if isinstance(errs, list) else [errs]):
                    messages.append(str(e))
        else:
            messages.append(str(errors))
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for m in messages:
            if m not in seen:
                seen.add(m)
                unique.append(m)
        return ' '.join(unique)

    @action(detail=False, methods=['POST'], url_path='bulk_create')
    def bulk_create(self, request, client=None):
        """Bulk-create one AllowanceAssignment per employee with a shared batch_id."""
        import uuid as _uuid
        from django.utils import timezone as _tz

        data      = request.data
        employees = data.get('employees', [])
        if not employees:
            return Response({'error': 'employees list is required'}, status=status.HTTP_400_BAD_REQUEST)

        batch_id = _uuid.uuid4()
        b_id     = request.tenant.id if hasattr(request, 'tenant') else None

        # Auto-generate assignment code — format: AA-YYYY-MMDD-HHMM
        now   = _tz.localtime()
        assignment_code = f'AA-{now.year}-{now.strftime("%m%d")}-{now.strftime("%H%M")}'

        # Resolve allowance denormalised fields from DB if not sent by frontend
        allowance_id   = data.get('allowance')
        allowance_code = data.get('allowance_code', '')
        allowance_name = data.get('allowance_name', '')
        allowance_type = data.get('allowance_type', '')
        if allowance_id and not (allowance_code and allowance_name):
            try:
                am = AllowanceMaster.objects.get(pk=allowance_id)
                allowance_code = am.allowance_code or ''
                allowance_name = am.allowance_name or ''
                allowance_type = am.allowance_type or ''
            except Exception:
                pass

        common = {
            'allowance':             allowance_id,
            'allowance_code':        allowance_code,
            'allowance_name':        allowance_name,
            'allowance_type':        allowance_type,
            'mode':                  data.get('mode', 'manual'),
            'from_date':             data.get('from_date') or None,
            'to_date':               data.get('to_date') or None,
            'filter_criteria':       data.get('filter_criteria', ''),
            'filter_designation_ids':data.get('filter_designation_ids', ''),
            'filter_department_ids': data.get('filter_department_ids', ''),
            'is_active':             data.get('is_active', True),
        }

        records = [
            {
                **common,
                'employee':        emp.get('employee'),
                'amount':          emp.get('amount', data.get('amount', 0)),
                'rate':            emp.get('rate',   data.get('rate',   0)),
                'remark':          emp.get('remark', '') or '',
                'batch_id':        str(batch_id),
                'assignment_code': assignment_code,
            }
            for emp in employees
        ]

        serializer = AllowanceAssignmentSerializer(data=records, many=True, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': self._flatten_serializer_errors(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'id': str(batch_id), 'batch_id': str(batch_id), 'assignment_code': assignment_code, 'created': len(records)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['PUT', 'PATCH'], url_path='bulk_update_by_batch')
    def bulk_update_by_batch(self, request, pk=None, client=None):
        """PUT /bulk_update_by_batch/{batch_id}/
        Frontend sends raw form.value; backend owns all data construction.
        pk = batch_id from URL — batch_id in body is ignored.

        Two modes:
        1. Approval-only: request body has approval_status but no employees list
           → direct .update() on all batch records, no delete/recreate.
        2. Full update: employees list provided
           → delete existing, recreate via serializer.
        """
        batch_id  = str(pk)
        data      = request.data
        employees = data.get('employees', [])
        new_approval_status = data.get('approval_status')

        batch_qs = AllowanceAssignment.objects.filter(batch_id=batch_id)

        # Preserve assignment_code — never regenerate on update
        existing_code = (
            batch_qs.values_list('assignment_code', flat=True).first()
        ) or ''

        if not employees:
            # Approval-only or status-only update — no employee list to rebuild
            update_fields = {}
            if new_approval_status:
                update_fields['approval_status'] = new_approval_status
            if update_fields:
                batch_qs.update(**update_fields)
            return Response({
                'id':              f"{batch_id}/bulk_update_by_batch",
                'batch_id':        batch_id,
                'assignment_code': existing_code,
                'approval_status': new_approval_status,
                'updated':         batch_qs.count(),
            })

        # ── Full update: employees list provided ─────────────────────────────

        # Always resolve allowance denormalised fields from DB — don't trust frontend cache
        allowance_id = data.get('allowance')
        allowance_code = allowance_name = allowance_type = ''
        if allowance_id:
            try:
                am = AllowanceMaster.objects.get(pk=allowance_id)
                allowance_code = am.allowance_code or ''
                allowance_name = am.allowance_name or ''
                allowance_type = am.allowance_type or ''
            except AllowanceMaster.DoesNotExist:
                pass

        # Delete existing batch then re-create with updated data
        batch_qs.delete()

        common = {
            'allowance':              allowance_id,
            'allowance_code':         allowance_code,
            'allowance_name':         allowance_name,
            'allowance_type':         allowance_type,
            'mode':                   data.get('mode', 'manual'),
            'from_date':              data.get('from_date') or None,
            'to_date':                data.get('to_date') or None,
            'filter_criteria':        data.get('filter_criteria', ''),
            'filter_designation_ids': data.get('filter_designation_ids', ''),
            'filter_department_ids':  data.get('filter_department_ids', ''),
            'is_active':              data.get('is_active', True),
            'batch_id':               batch_id,
            'assignment_code':        existing_code,
        }

        records = [
            {
                **common,
                'employee': emp.get('employee'),
                'amount':   emp.get('amount', data.get('amount', 0)),
                'rate':     emp.get('rate',   data.get('rate',   0)),
                'remark':   emp.get('remark', '') or '',
            }
            for emp in employees
        ]

        serializer = AllowanceAssignmentSerializer(data=records, many=True, context={'request': request})
        if not serializer.is_valid():
            return Response({'error': self._flatten_serializer_errors(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()

        # Apply approval_status to ALL batch records after save — serializer
        # may default it to PENDING_APPROVAL, so override here if user changed it.
        if new_approval_status:
            AllowanceAssignment.objects.filter(batch_id=batch_id).update(
                approval_status=new_approval_status
            )

        return Response({
            'id':              f"{batch_id}/bulk_update_by_batch",
            'batch_id':        batch_id,
            'assignment_code': existing_code,
            'approval_status': new_approval_status,
            'updated':         len(records),
        })

    @action(detail=False, methods=['POST'], url_path='bulk_update')
    def bulk_update(self, request, client=None):
        """POST /bulk_update/ — kept for direct calls; delegates to bulk_update_by_batch."""
        batch_id = request.data.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create a fake pk and reuse bulk_update_by_batch logic
        class _FakeRequest:
            def __init__(self, r): self.__dict__.update(r.__dict__)
        return self.bulk_update_by_batch(request, pk=batch_id, client=client)

    @action(detail=False, methods=['DELETE'], url_path='bulk_delete')
    def bulk_delete(self, request, client=None):
        """Delete all records for a batch_id."""
        batch_id = request.query_params.get('batch_id')
        if not batch_id:
            return Response({'error': 'batch_id required'}, status=status.HTTP_400_BAD_REQUEST)
        count, _ = AllowanceAssignment.objects.filter(batch_id=batch_id).delete()
        return Response({'deleted': count})

    @action(detail=False, methods=['GET'], url_path='filter_employees')
    def filter_employees(self, request, client=None):
        """Return employees for the employee table — employee_wise/designation/department.

        Query params:
          filter_criteria   : 'employee_wise' | 'designation' | 'department'
          employee_ids      : comma-separated employee PKs (used when criteria='employee_wise')
          designation_ids   : comma-separated designation PKs
          department_ids    : comma-separated department PKs
          b_id              : branch/company filter
          default_amount    : float — pre-fill amount column (default 0)
          default_rate      : float — pre-fill rate column   (default 0)
        """
        import uuid as _uuid
        from hrm_master.models import EmployeeMaster
        criteria        = request.query_params.get('filter_criteria', 'employee_wise')
        b_id            = request.query_params.get('b_id')
        employee_ids    = request.query_params.get('employee_ids', '')
        designation_ids = request.query_params.get('designation_ids', '')
        department_ids  = request.query_params.get('department_ids', '')
        default_amount  = float(request.query_params.get('default_amount', 0) or 0)
        default_rate    = float(request.query_params.get('default_rate',   0) or 0)

        qs = EmployeeMaster.objects.filter(is_active=True)
        if b_id:
            qs = qs.filter(b_id=b_id)

        if criteria == 'employee_wise' and employee_ids:
            ids = [i.strip() for i in employee_ids.split(',') if i.strip()]
            qs = qs.filter(id__in=ids)
        elif criteria == 'designation' and designation_ids:
            ids = [i.strip() for i in designation_ids.split(',') if i.strip()]
            qs = qs.filter(designation__id__in=ids)
        elif criteria == 'department' and department_ids:
            ids = [i.strip() for i in department_ids.split(',') if i.strip()]
            qs = qs.filter(department__id__in=ids)

        qs = (
            qs.select_related('designation', 'department')
              .only('id', 'employee_code', 'first_name', 'last_name',
                    'designation__designation_name', 'department__department_name')
              .order_by('first_name', 'last_name')
        )
        result = [
            {
                'table_id':        str(_uuid.uuid4()),          # unique row ID for frontend table
                'employee':        str(emp.id),
                'employee_code':   emp.employee_code or '',
                'employee_name':   f"{emp.first_name or ''} {emp.last_name or ''}".strip(),
                'designation_name': emp.designation.designation_name if emp.designation_id else '',
                'department_name':  emp.department.department_name   if emp.department_id  else '',
                'amount':          default_amount,
                'rate':            default_rate,
                'remark':          '',
            }
            for emp in qs
        ]
        return Response(result)

    @action(detail=False, methods=['GET'], url_path='register')
    def register(self, request, client=None):
        """Register view — active assignments within a date range, paginated."""
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client=None):
        queryset   = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export       = query_params.pop('export_fields', None)
            fileName     = query_params.pop('fileName', None)
            export       = ast.literal_eval(export)
        return get_export_file(serializer.data, fileName, export)

    # ── Allowance Register (consolidated view) ────────────────────────────

    def _allowance_register_data(self, request):
        """Shared helper: filter + group allowance assignments for the register."""
        from django.db.models import Q

        b_id       = request.query_params.get('b_id') or (
            request.tenant.id if hasattr(request, 'tenant') else None
        )
        from_date  = request.query_params.get('from_date')
        to_date    = request.query_params.get('to_date')
        group_by   = request.query_params.get('group_by', 'employee')
        selected_fields_param = request.query_params.get('fields', '')
        selected_fields = [f.strip() for f in selected_fields_param.split(',')] if selected_fields_param else []

        qs = AllowanceAssignment.objects.filter(is_active=True, approval_status='APPROVED')
        if b_id:
            qs = qs.filter(b_id=b_id)
        if from_date:
            qs = qs.filter(from_date__gte=from_date)
        if to_date:
            qs = qs.filter(to_date__lte=to_date)

        qs = qs.select_related('employee__designation', 'employee__department')

        ALL_FIELDS = [
            {'field': 'employee_code',    'header': 'Employee Code'},
            {'field': 'employee_name',    'header': 'Employee Name'},
            {'field': 'designation_name', 'header': 'Designation'},
            {'field': 'department_name',  'header': 'Department'},
            {'field': 'allowance_code',   'header': 'Allowance Code'},
            {'field': 'allowance_name',   'header': 'Allowance Name'},
            {'field': 'allowance_type',   'header': 'Allowance Type'},
            {'field': 'mode',             'header': 'Mode'},
            {'field': 'amount',           'header': 'Amount'},
            {'field': 'rate',             'header': 'Rate'},
            {'field': 'from_date',        'header': 'From Date'},
            {'field': 'to_date',          'header': 'To Date'},
            {'field': 'approval_status',  'header': 'Status'},
        ]

        columns = (
            [c for c in ALL_FIELDS if c['field'] in selected_fields]
            if selected_fields else ALL_FIELDS
        )

        GROUP_FIELD_MAP = {
            'department':  'department_name',
            'designation': 'designation_name',
            'allowance':   'allowance_name',
            'employee':    None,  # flat
        }
        group_field = GROUP_FIELD_MAP.get(group_by)

        rows = []
        for e in qs:
            emp  = e.employee
            desg = emp.designation.designation_name if emp.designation_id else ''
            dept = emp.department.department_name   if emp.department_id  else ''
            name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            mode_label = 'Manual' if e.mode == 'manual' else ('Auto' if e.mode == 'auto' else e.mode or '')
            row = {
                'employee_code':    emp.employee_code or '',
                'employee_name':    name,
                'designation_name': desg,
                'department_name':  dept,
                'allowance_code':   e.allowance_code  or '',
                'allowance_name':   e.allowance_name  or '',
                'allowance_type':   e.allowance_type  or '',
                'mode':             mode_label,
                'amount':           str(e.amount) if e.amount else '0',
                'rate':             str(e.rate)   if e.rate   else '0',
                'from_date':        e.from_date.strftime('%d-%m-%Y') if e.from_date else '',
                'to_date':          e.to_date.strftime('%d-%m-%Y')   if e.to_date   else '',
                'approval_status':  e.approval_status or '',
                # always carry grouping fields
                '_group':           row_val if (row_val := (
                    dept if group_by == 'department' else
                    desg if group_by == 'designation' else
                    (e.allowance_name or '') if group_by == 'allowance' else
                    name
                )) else '',
            }
            rows.append(row)

        # sort by group key then employee
        rows.sort(key=lambda r: (r['_group'], r['employee_code']))

        return columns, rows, group_field

    @action(detail=False, methods=['GET'], url_path='allowance_register_list')
    def allowance_register_list(self, request, client=None):
        """GET /allowance_register_list/ — JSON preview for the dialog table."""
        columns, rows, _ = self._allowance_register_data(request)
        display_fields = {c['field'] for c in columns}
        result_rows = [
            {k: v for k, v in row.items() if k in display_fields}
            for row in rows
        ]
        return Response({'columns': columns, 'rows': result_rows, 'count': len(result_rows)})

    @action(detail=False, methods=['GET'], url_path='allowance_register_excel')
    def allowance_register_excel(self, request, client=None):
        """GET /allowance_register_excel/ — stream an xlsx file."""
        import io as _io
        import xlsxwriter
        from django.http import HttpResponse

        columns, rows, group_field = self._allowance_register_data(request)

        b_id = request.query_params.get('b_id') or (
            request.tenant.id if hasattr(request, 'tenant') else None
        )
        branch_name = ''
        try:
            bu = BusinessUnit.objects.filter(b_id=b_id).first()
            if bu:
                branch_name = bu.business_unit_name or ''
        except Exception:
            pass

        excel_file = _io.BytesIO()
        workbook   = xlsxwriter.Workbook(excel_file)
        worksheet  = workbook.add_worksheet('Allowance Register')

        title_fmt  = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 12,
        })
        sub_fmt    = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'bg_color': '#004a7c', 'font_color': '#FFFFFF', 'font_size': 10,
        })
        hdr_fmt    = workbook.add_format({
            'bold': True, 'align': 'center', 'valign': 'vcenter',
            'border': 1, 'bg_color': '#004a7c', 'font_color': '#FFFFFF',
        })
        grp_fmt    = workbook.add_format({
            'bold': True, 'bg_color': '#E8F0FE', 'border': 1,
        })
        cell_fmt   = workbook.add_format({'border': 1})

        n_cols = len(columns)
        from_date = request.query_params.get('from_date', '')
        to_date   = request.query_params.get('to_date',   '')
        date_range = f"{from_date} to {to_date}" if (from_date or to_date) else 'All Dates'

        worksheet.merge_range(0, 0, 0, n_cols - 1, branch_name or 'Allowance Register', title_fmt)
        worksheet.merge_range(1, 0, 1, n_cols - 1, f'Allowance Register — {date_range}',  sub_fmt)
        for ci, col in enumerate(columns):
            worksheet.write(2, ci, col['header'], hdr_fmt)
            worksheet.set_column(ci, ci, 18)

        r_idx = 3
        current_group = None
        for row in rows:
            grp = row.get('_group', '')
            if group_field and grp != current_group:
                current_group = grp
                worksheet.merge_range(r_idx, 0, r_idx, n_cols - 1, grp or '—', grp_fmt)
                r_idx += 1
            for ci, col in enumerate(columns):
                worksheet.write(r_idx, ci, row.get(col['field'], ''), cell_fmt)
            r_idx += 1

        workbook.close()
        excel_file.seek(0)

        response = HttpResponse(
            excel_file.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="Allowance_Register.xlsx"'
        return response


# ── Item Category ViewSet ─────────────────────────────────────────────────────


class LeaveExtensionViewSet(CustomModelViewSet):
    queryset = LeaveExtension.objects.all().order_by('-modified')
    serializer_class = LeaveExtensionSerializer
    search_fields = [
        'employee__employee_code', 'employee__first_name',
        'extended_to_date', 'approval_status', 'reason',
    ]
    filterset_fields = {
        'id': ['exact', 'in'],
        'is_active': ['exact'],
        'leave_application': ['exact'],
        'leave_entry': ['exact'],
        'employee': ['exact', 'in'],
        'employee__employee_code': ['exact', 'iexact', 'istartswith', 'icontains'],
        'employee__first_name': ['exact', 'iexact', 'istartswith', 'icontains'],
        'extended_to_date': ['exact', 'gte', 'lte', 'gt', 'lt'],
        'approval_status': ['exact', 'iexact', 'icontains'],
        'allow_beyond_eligible': ['exact'],
        'b_id': ['exact'],
    }
    filter_backends = [DjangoFilterBackend, DynamicSearchFilter]
def get_export_file(data, header, export_fields):
    # Create a DataFrame from the provided data
    # print("header", header)
    for item in data:
        # Create an OrderedDict to maintain order according to export_fields
        ordered_item = OrderedDict()

        # Iterate over export_fields
        for col in export_fields:
            # If the field is in the current item, add it to ordered_item
            if col in item:
                ordered_item[col] = item[col]
            else:
                ordered_item[col] = None  # or any default value if field is missing

        # Update item with ordered_item
        item.clear()
        item.update(ordered_item)

    df = pd.DataFrame(data)
    df.fillna(' ', inplace=True)
    df.replace('', ' ', inplace=True)

    # Define the report name
    report_name = f'{header}'

    # Create an in-memory Excel file buffer
    excel_file = io.BytesIO()

    # Create an Excel writer using XlsxWriter engine
    workbook = xlsxwriter.Workbook(excel_file)
    worksheet = workbook.add_worksheet('Sheet1')

    # Define header format
    header_format = workbook.add_format({
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'bg_color': '#2E80BA',
        'font_color': '#FFFFFF',
    })

    # Merge and write the report name as the header
    # head = df.columns
    # worksheet.merge_range(0, 0, 0, len(head) - 1, report_name, header_format)

    # Write column headers
    for col, header_name in enumerate(df.columns):
        if header_name in export_fields:
            title = export_fields[header_name]
            worksheet.write(0, col, title, header_format)

    # Write data rows
    for row, data_row in enumerate(df.values, start=1):
        for col, value in enumerate(data_row):
            if isinstance(value, list):
                value_str = ', '.join(map(str, value))
                worksheet.write(row, col, value_str)
            else:
                worksheet.write(row, col, value)

    # Close the workbook
    workbook.close()

    # Reset the buffer's position to the beginning
    excel_file.seek(0)

    # Prepare the HTTP response with the Excel file
    response = HttpResponse(content=excel_file,
                            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="report.xlsx"'
    return response

def reset_password_employee(request, client):
    data = request.data
    master_service = MasterService()
    reset_employee = data['employee']
    reset_password_employee = data['password']
    employeeData = master_service.reset_password_employee(reset_employee, reset_password_employee, client)
    return JsonResponse(employeeData, safe=False)


