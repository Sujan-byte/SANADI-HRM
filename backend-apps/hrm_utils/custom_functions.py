# naming_conventions.py
import importlib, json, random, re, requests, base64, io, xlsxwriter, ast
import pandas as pd

from datetime import datetime
from urllib.parse import urljoin
from xml.sax.saxutils import escape as xml_escape
from rest_framework import serializers
from hrm_utils.number_constuctor import NumberConstructor
from collections import OrderedDict

from django.utils import timezone
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpResponse
from django.db.models import Q
from django.db import connection
from reportlab.pdfgen import canvas     #related to pdf page number
from reportlab.lib.units import inch, cm, mm   #related to pdf


def custom_sql(query, **kwargs):
    stored_procedure_function = kwargs.get('stored_procedure_function', None)
    cursor = connection.cursor()
    if stored_procedure_function:
        cursor.execute(stored_procedure_function)
    cursor.execute(query)
    final_list = {}
    columns = [col[0] for col in cursor.description]
    for col in columns:
        final_list[col] = []
    for row in cursor.fetchall():
        for i in range(len(row)):
            final_list[columns[i]].append(str(row[i]))
    return final_list

def get_revision_chain_ids(model, instance=None, base_revised_fk=None):
   
    root = None
    if instance is not None and getattr(instance, 'base_revised_fk_id', None):
        root = instance.base_revised_fk
    elif instance is not None and getattr(instance, 'is_revised', False):
        root = instance
    elif base_revised_fk is not None:
        root = base_revised_fk

    if root is None:
        return []

    while root.base_revised_fk:
        root = root.base_revised_fk

    chain_ids = [root.id]
    current = root
    while True:
        child = model.objects.filter(base_revised_fk=current).first()
        if not child:
            break
        chain_ids.append(child.id)
        current = child

    return chain_ids


def snake_case_to_camel_case(name):
    words = name.split('_')
    return words[0] + ''.join(word.capitalize() for word in words[1:])


def camel_case_to_snake_case(name):
    # Use regular expressions to split CamelCase into words
    words = re.findall(r'[A-Z][a-z0-9]*', name)
    # Join the words with underscores and make them lowercase
    snake_case = '_'.join(word.lower() for word in words)
    return snake_case


def get_dynamic_serializer_class(base_model, base_serializer, required_fields):
    class DynamicSerializer(base_serializer):
        class Meta:
            model = base_model
            fields = required_fields

    return DynamicSerializer


def context_data_on_create(self):
    request_obj = dict()
    request_obj['created'] = timezone.now()
    request_obj['modified'] = timezone.now()
    if 'request' in self.context and self.context['request'].user:
        request_obj['user_created'] = self.context['request'].user.first_name + '(' + self.context[
            'request'].user.email + ')'
        # request_obj['device'] = self.context['request'].META.get('HTTP_USER_AGENT')
        request_obj['user_modified'] = self.context['request'].user.first_name + '(' + self.context[
            'request'].user.email + ')'
        request_obj['uc_id'] = self.context['request'].user.id if self.context['request'].user else None
        request_obj['um_id'] = self.context['request'].user.id if self.context['request'].user else None
        request_obj['ip_address'] = get_client_ip(self)
    return request_obj


def context_data_on_update(self):
    request_obj = dict()
    request_obj['modified'] = timezone.now()
    # request_obj['device'] = self.context['request'].META.get('HTTP_USER_AGENT')
    if 'request' in self.context and self.context['request'].user:
        request_obj['user_modified'] = str(self.context['request'].user)
        request_obj['um_id'] = self.context['request'].user.id if self.context['request'].user else None
        request_obj['ip_address'] = get_client_ip(self)
    return request_obj


def get_client_ip(self):
    x_forwarded_for = self.context.get('request').META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[-1].strip()
    else:
        ip = self.context.get('request').META.get('REMOTE_ADDR')
    return ip


def convert_form_data(data):
    if isinstance(data, dict):
        return {k: convert_form_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_form_data(item) for item in data]
    elif isinstance(data, str):
        if data == "null" or data == "undefined":
            return None
        elif data == "true":
            return True
        elif data == "false":
            return False
        else:
            return data
    else:
        return data


def convert_date_to_nstring(date):
    date = date.strftime('%Y%m%d')
    return date


def generate_unique_id():
    random_number = random.randint(1000000000000, 9999999999999)
    return str(random_number) + 'A'


def get_serializer_class(app_name, serializer_name):
    try:
        serializers_module = importlib.import_module(f'{app_name}.api.serializers')

        serializer_class = getattr(serializers_module, serializer_name)

        return serializer_class
    except (ImportError, AttributeError) as e:
        raise ImportError(f"Serializer '{serializer_name}' not found in '{app_name}.serializers'") from e


# VALIDATE NATION
def validate_nation(country, state, state_code, **kwargs):
    if country not in ['', None]:
        if country == 'India':
            if state in ['', None]:
                if 'type' in kwargs:
                    if kwargs['type'] == 'dict':
                        raise serializers.ValidationError({'state': 'Please select state'})
                    elif kwargs['type'] == 'str':
                        raise serializers.ValidationError(f"Please select state")
            elif state not in ['', None] and state_code in ['', None, 0]:
                if 'type' in kwargs:
                    if kwargs['type'] == 'dict':
                        raise serializers.ValidationError({'state_code': 'Please select state code'})
                    elif kwargs['type'] == 'str':
                        raise serializers.ValidationError(f"Please select state code")


# VALIDATE PHONE NUMBER
def phone_number_validate(data, **kwargs):
    if data not in ['', None]:
        phone_regex = r'^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}?\)?)[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})?$'
        if not re.match(phone_regex, data):
            if 'error_value' in kwargs:
                value = kwargs.get('error_value')
                if 'type' in kwargs:
                    if kwargs['type'] == 'dict':
                        raise serializers.ValidationError({"data": f"{data} You have entered Invalid {value} format"})
                    elif kwargs['type'] == 'str':
                        raise serializers.ValidationError(f"{data} You have entered Invalid {value} format")


# VALIDATE TAX NUMBER
def tax_number_validate(data, **kwargs):
    if data not in ['', None]:
        tax_regex = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        if not re.match(tax_regex, data):
            if 'error_value' in kwargs:
                value = kwargs.get('error_value')
                if 'type' in kwargs:
                    if kwargs['type'] == 'dict':
                        raise serializers.ValidationError({"data": f"{data} You have entered Invalid {value} format"})
                    elif kwargs['type'] == 'str':
                        raise serializers.ValidationError(f"{data} You have entered Invalid {value} format")


# VALIDATE EMAIL
def email_validate(data, **kwargs):
    if data not in ['', None]:
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data):
            if 'error_value' in kwargs:
                value = kwargs.get('error_value')
                if 'type' in kwargs:
                    if kwargs['type'] == 'dict':
                        raise serializers.ValidationError({"data": f"{data} You have entered Invalid {value} format"})
                    elif kwargs['type'] == 'str':
                        raise serializers.ValidationError(f"{data} You have entered Invalid {value} format")


# SET DEFAULT VALUES
class DefaultValue:
    # POP KEYS
    def pop_keys(self, data, child_keys, default_value=[]):
        child_list = []
        for key in child_keys:
            # print('key', key, key in data)
            child_list.append(dict(
                key = key,
                is_present = key in data,
                data = data.get(key, default_value) or default_value
            ))
            data.pop(key, None)
        return data, child_list

    # SET JSON LOADS
    def json_loads(self, validated_data, child_keys):
        for item in child_keys:
            if item['is_present']:
                if isinstance(item['data'], str):
                    validated_data[item['key']] = json.loads(item['data'])
                else:
                    validated_data[item['key']] = item['data']

        return validated_data
    
    # SET CHILD TABLES
    def add_keys(self, validated_data, child_keys):
        for item in child_keys:
            if item['is_present']:
                validated_data[item['key']] = item['data']
        return validated_data
    
    # SET TO DEFAULT VALUE
    def set_default_value(self, data, keys_to_check, default_value=0):
        for key in keys_to_check:
            if key in data:
                data[key] = data[key] if data[key] not in ["", None, "null"] else default_value
        return data
    

# CONVERT IMAGE
class ImageConversion:
    # CHECK IMAGE
    def check_image(self, data, key='file', name='file_name', type='file_type'):
        if key in data and isinstance(data, dict):
            file_content = data[key]
            if isinstance(file_content, str) and ';base64,' in file_content:
                image_file = self.convert_base64(data[key], data[name], data[type])
                # print("image_file", image_file, data[name])
                return image_file
            else:
                return None
        
    # CONVERT BASE64
    def convert_base64(self, image, file_name, file_type):
        format, data = image.split(';base64,')
        # Decode the base64 image data
        file_data = base64.b64decode(data)

        # Create a BytesIO object from the decoded data
        file_io = io.BytesIO(file_data)

        # Create the InMemoryUploadedFile instance
        content_file = InMemoryUploadedFile(
            file_io,
            field_name=None,
            name=file_name,
            content_type=file_type,
            size=len(file_data),
            charset=None
        )
        return content_file
    
    # IMAGE TO INTERNAL VALUE
    def to_internal_value(self, data, key='file', name='file_name', type='file_type'):
        image = data.get(key, None)
        if image is not None:
            data[key] = self.check_image(data, key=key, name=name, type=type)
        return data
    
    # IMAGE VALIDATE FOR 5MB
    def validate(self, attrs, key):
        file = attrs.get(key)
        if file and file.size > 5 * 1024 * 1024:  # 5 MB
            raise serializers.ValidationError({key: f"{key.replace('_', ' ').title()} size must be 5MB or less."})


# CUSTOM FUNCTION
class CustomFunction:
    # GET NUMBER FORMAT FOR EXCEL AND PDF
    @staticmethod
    def get_num_format(number_locale: str, decimal: int) -> str:
        """Return the number format string for Excel (xlsxwriter) and babel (PDF).
        Uses Indian grouping (#,##,##0) for en_IN, standard (#,##0) for all others.
        Accepts both dash (en-IN) and underscore (en_IN) locale formats.
        """
        locale_str = number_locale.replace('-', '_')
        grouping = '#,##,##0' if 'IN' in locale_str.upper() else '#,##0'
        return f'{grouping}.{"0" * int(decimal)}'

    # GET NUMBER FORMAT FOR EXCEL AND PDF

    # ESCAPE TEXT BEFORE HANDING IT TO A REPORTLAB Paragraph
    @staticmethod
    def escape_pdf_text(value) -> str:
        """Escape XML special chars (&, <, >) in free-text values (ledger/branch names,
        addresses, narration, etc.) before passing them to reportlab's Paragraph, which
        parses its input as a mini-XML markup language. Unescaped input containing these
        characters raises "paraparser: syntax error: parse ended with N unclosed tags".
        """
        if value is None:
            return ''
        return xml_escape(str(value))
    # ESCAPE TEXT BEFORE HANDING IT TO A REPORTLAB Paragraph

    # AUTO GENERATED CODE
    def generate_code(self, validated_data, key, constants, type=dict(),context=None):
        # print("b_id", context)
        if context is None:
            raise serializers.ValidationError({
                key: "Auto-generated number cannot be generated because the required context is missing."
            })

        request = context.get('request')
        b_id = request.query_params.get('b_id')

        try:
            validated_data[key] = NumberConstructor().generate_next_sequence(constants, type,b_id)
            # print('NumberConstructor', validated_data[key])
        except Exception as e:
            message = e if type.get('custom') else f"App key: {constants.value} does not exist"
            # print('Exception', e)
            raise serializers.ValidationError(message)
        return validated_data 
    
    def generate_required_fields(self, model_name, serializer_name, instance, required_fields='', request=None):
        dynamic_serializer = get_dynamic_serializer_class(
            model_name, 
            serializer_name, 
            required_fields.split(',') if required_fields else '__all__'
            )
        return dynamic_serializer(instance, context={ 'request': request }).data
    
    # EXPORT EXCEL FILE
    def export_excel(self, self_data):
        queryset = self_data.filter_queryset(self_data.get_queryset())
        serializer = self_data.get_serializer(queryset, many=True)
        if 'export_fields' in self_data.request.query_params:
            query_params = self_data.request.query_params.dict()
            export = query_params.pop('export_fields', None)
            fileName = query_params.pop('fileName', None)
            export = ast.literal_eval(export)
        return self.get_export_file(serializer.data, fileName, export)

    def get_export_file(self, data, header, export_fields):
        # Create a DataFrame from the provided data
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
    # EXPORT FILE
    
    # CONVERT DATE
    def convert_date(self, date):
        parsed_date = datetime.strptime(date, '%Y-%m-%d')
        return parsed_date.strftime('%d-%m-%Y')
    # CONVERT DATE
    
    # CLEAN APPROVAL REMARKS
    def clean_approval_remarks(self, remark, key):
        replacements = [
            (f"Pending with {key} Engineer", "Pending with Engineer"),
            (f"Pending with {key} Manager", "Pending with Manager"),
            (f"Pending with {key} Managing Director", "Pending with Managing Director"),
            (f"Approved by {key} Engineer", "Approved by Engineer"),
            (f"Approved by {key} Manager", "Approved by Manager"),
            (f"Approved by {key} Managing Director", "Approved by Managing Director"),
        ]
        
        # Handle exact replacements first
        for old, new in replacements:
            if remark == old:
                return new
        
        # Handle variable user names for Cancelled/Rejected cases
        patterns = [
            (f"Cancelled by {key} Engineer-", "Cancelled by Engineer-"),
            (f"Cancelled by {key} Manager-", "Cancelled by Manager-"),
            (f"Cancelled by {key} Managing Director-", "Cancelled by Managing Director-"),
            (f"Rejected by {key} Engineer-", "Rejected by Engineer-"),
            (f"Rejected by {key} Manager-", "Rejected by Manager-"),
            (f"Rejected by {key} Managing Director-", "Rejected by Managing Director-"),
        ]
        
        for old_prefix, new_prefix in patterns:
            if remark.startswith(old_prefix):
                return remark.replace(old_prefix, new_prefix, 1)
        
        return remark or ''

    def generate_unique_id(self):
        random_number = random.randint(1000000000000, 9999999999999)
        return str(random_number) + 'A'
    
# CHILD TABLE FUNCTION
class TableFunction:
    def __init__(self, self_attr):
        self.self_attr = self_attr
        pass
    
    # CHILD TABLE FILE UPLOAD
    def save_table_file(self, model, serializer, instance, list, parent_key, foreign_key='id', delete_function=True):
        self.model = model
        self.serializer = serializer
        self.instance = instance
        self.list = list
        self.table_ids = []
        self.parent_key = parent_key
        self.foreign_key = foreign_key
        self.delete_function = delete_function
        
        for item in list:
            if foreign_key in item and isinstance(item[foreign_key], str):
                item.pop(foreign_key)
                item[parent_key] = self.instance.id
                file_upload_serializer = serializer(data=item, context=self.self_attr.context)
                file_upload_serializer.is_valid(raise_exception=True)
                file_upload_instance = file_upload_serializer.create(
                    file_upload_serializer.validated_data)
                self.table_ids.append(file_upload_instance.id)
            else:
                self.table_ids.append(item[foreign_key])
        if delete_function:
            self.delete_table()
        return True
    
    # CHILD TABLE FILE UPLOAD
    def save_table(self, model, serializer, instance, list, parent_key, foreign_key='id', delete_function=True):
        self.model = model
        self.serializer = serializer
        self.instance = instance
        self.list = list
        self.table_ids = []
        self.parent_key = parent_key
        self.foreign_key = foreign_key
        self.delete_function = delete_function
        
        for item in list:
            if foreign_key in item and isinstance(item[foreign_key], str):
                item.pop(foreign_key)
                item[parent_key] = self.instance.id
                table_serializer = serializer(data=item, context=self.self_attr.context)
                table_serializer.is_valid(raise_exception=True)
                table_instance = table_serializer.create(table_serializer.validated_data)
                self.table_ids.append(table_instance.id)
            else:
                self.table_ids.append(item[foreign_key])
                table_instance = model.objects.get(id=item[foreign_key])
                table_serializer = serializer(instance=table_instance, data=item, context=self.self_attr.context)
                table_serializer.is_valid(raise_exception=True)
                table_serializer.update(table_instance, table_serializer.validated_data)
        if delete_function:
            self.delete_table()
        return True

    def delete_table(self):
        self.model.objects.filter(**{self.parent_key: self.instance}).exclude(**{f'{self.foreign_key}__in': self.table_ids}).delete()


#========= Related to numbering PDF pages example:(Page 1 of 80)=============================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._pages = []

    def showPage(self):
        self._pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._pages)
        for page_num, page_state in enumerate(self._pages, start=1):
            self.__dict__.update(page_state)
            self.setFont("Helvetica", 8)
            # Top-right corner, using actual page dimensions (works for portrait and landscape)
            pw, ph = self._pagesize
            self.drawRightString(pw - 10 * mm, ph - 8 * mm, f"Page {page_num} of {page_count}")
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

#========= Related to numbering PDF pages example:(Page 1 of 80)=============================

def finalize_parents_if_approved(instance, fk_fields: list[str]):

    if getattr(instance, "approval_status", None) != "APPROVED":
        return

    for field_name in fk_fields:
        parent = getattr(instance, field_name, None)
        print("updating is finalized outused",parent,field_name,instance)

        if parent and hasattr(parent, "is_finalized") and not parent.is_finalized:
            print("updating is finalized")
            parent.__class__.objects.filter(pk=parent.pk, is_finalized=False)\
                .update(is_finalized=True)

def get_old_quantity(old_instance, oa_instance, qty):
    """
    Returns the quantity already reserved/deducted from the linked balance
    for this row. The balance is only ever decremented once the parent
    document is APPROVED, so if it wasn't already APPROVED before this
    save, nothing has been reserved yet - old quantity must be 0 regardless
    of whether this save is the one approving it.
    """
    if old_instance.approval_status != 'APPROVED':
        return 0

    return qty

def convert_base64(image, file_name, file_type):
    format, data = image.split(';base64,')
    file_data = base64.b64decode(data)

    file_io = io.BytesIO(file_data)

    content_file = InMemoryUploadedFile(
        file_io,
        field_name=None,
        name=file_name,
        content_type=file_type,
        size=len(file_data),
        charset=None
    )
    return content_file


def format_date_with_day(date_obj):
    """Formats date as [Day] DD-MM-YYYY (e.g., [Sat] 19-02-2025)"""
    return f"[{date_obj.strftime('%a')}] {date_obj.strftime('%d-%m-%Y')}" if date_obj else ""


def remove_permissions(context, perms_to_remove):
    request = context.get('request')
    if not request:
        return
    if not hasattr(request, '_temp_hide_permissions'):
        request._temp_hide_permissions = set()
    request._temp_hide_permissions.update(perms_to_remove)


def add_permissions(context, perms_to_remove):
    request = context.get('request')
    if not request:
        return
    if not hasattr(request, '_added_permissions'):
        request._added_permissions = set()
    request._added_permissions.update(perms_to_remove)
