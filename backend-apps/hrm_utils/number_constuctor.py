from datetime import date
from datetime import datetime
from master.models import AppSettings
from branch.models import Branch
from sequences import get_next_value, get_last_value
from enum import Enum
from hrm_utils.constants import PADDING_LENGTHS,CUSTOM_CODES,CUSTOM_CODE, NumberConstructorConstants
import fiscalyear, re
from rest_framework import serializers
from django.db.models.functions import Length

class NumberConstructor():

    @classmethod
    def generate_next_sequence(self, construction_format: Enum, condition: dict = {}, b_id=None) -> str:
        """
        The function used to generate the number format based on the construction format 
        return @String
        """
        
        branch_id = None
        self.condition = condition
        # branch Wise appkey logic
        # construction_prefix = AppSettings.objects.filter(app_key=construction_format.value,b_id=b_id)

        # global logic
        construction_prefix = AppSettings.objects.filter(app_key=construction_format.value)
        number_global_setting = AppSettings.objects.filter(app_key=NumberConstructorConstants.GLOBAL_NUMBERING.value).values_list('app_value', flat=True).first()
        if number_global_setting == 'True':
            branch_id = None    
        
        
        year_object = self.generate_fiscal_year()
        branch_settings = Branch.objects.filter(
            id=branch_id,
            is_active=True
        ).values('fiscal_from_date', 'fiscal_to_date').first()
        if branch_settings:
            from_year = branch_settings['fiscal_from_date'].year if branch_settings.get('fiscal_from_date') else str(year_object.get('from_year'))[-2:]
            to_year = branch_settings['fiscal_to_date'].year if branch_settings.get('fiscal_to_date') else str(year_object.get('to_year'))[-2:]
        else:
            from_year =str(year_object.get('from_year'))[-2:]
            to_year = str(year_object.get('to_year'))[-2:]
            
        if construction_prefix.exists():
            self.app_value = construction_prefix[0].app_value
            if number_global_setting == 'True' and construction_prefix[0].branchwise_sequence == False:
                sequence_name = f"{self.app_value}"
            elif number_global_setting == 'True' and construction_prefix[0].branchwise_sequence:
                sequence_name = f"{self.app_value}_{branch_id}" 
            else:
                sequence_name = f"{self.app_value}_{branch_id}"

            generated_sequence = 0
            # LAST SEQUENCE
            if condition.get('last_sequence', False):
                generated_sequence = get_last_value(sequence_name=sequence_name)
                generated_sequence = (generated_sequence or 0) + 1
            # NEXT SEQUENCE
            else:
                generated_sequence = get_next_value(sequence_name=sequence_name, initial_value=1)
            padding_length = construction_prefix[0].sequence_length
            separator = construction_prefix[0].seperator or ""
            length = padding_length if padding_length else 4
            # CONDITIONS
            if condition.get('custom', None):
                custom_value = condition.get('custom', '')
                from_year = year_object.get('from_year', 0000)
                to_year = year_object.get('to_year', 0000)
                if construction_prefix[0].fiscal_year_required:
                    if condition.get('text_fiscal_year', None):
                        return f"{custom_value}/{condition.get('text_fiscal_year', '')[:4].upper()}/{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}"
                    elif condition.get('text_fiscal_year_quarter', None):
                        return f"{custom_value}/{condition.get('text_fiscal_year_quarter', '')[:4].upper()}/{year_object.get('quarter_value')}-{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}" if (condition.get('text_fiscal_year_quarter', None) != 'False') else f"{custom_value}/{year_object.get('quarter_value')}-{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}"
                    elif condition.get('text_value_year_sequence', None):
                        return f"{str(self.app_value)}/{custom_value}/{str(from_year)[-2:]}-{str(to_year)[-2:]}/{str(generated_sequence).zfill(length)}" if (custom_value != 'False') else f"{str(self.app_value)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}/{str(generated_sequence).zfill(length)}"
                else:
                    return f"{str(self.app_value)}{separator}{str(generated_sequence).zfill(length)}"
            else:
                return f"{str(self.app_value)}{separator}{str(generated_sequence).zfill(length)}"
            # if condition.get('custom', None):
            #     custom_value = condition.get('custom', '')
            #     from_year = year_object.get('from_year', 0000)
            #     to_year = year_object.get('to_year', 0000)
            #     if condition.get('text_fiscal_year', None):
            #         return f"{custom_value}/{condition.get('text_fiscal_year', '')[:4].upper()}/{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}"
            #     elif condition.get('text_fiscal_year_quarter', None):
            #         return f"{custom_value}/{condition.get('text_fiscal_year_quarter', '')[:4].upper()}/{year_object.get('quarter_value')}-{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}" if (condition.get('text_fiscal_year_quarter', None) != 'False') else f"{custom_value}/{year_object.get('quarter_value')}-{str(generated_sequence).zfill(3)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}"
            #     elif condition.get('text_value_year_sequence', None):
            #         return f"{str(self.app_value)}/{custom_value}/{str(from_year)[-2:]}-{str(to_year)[-2:]}/{str(generated_sequence).zfill(length)}" if (custom_value != 'False') else f"{str(self.app_value)}/{str(from_year)[-2:]}-{str(to_year)[-2:]}/{str(generated_sequence).zfill(length)}"
            # else:
            #     if condition.get('fiscal_year', False):
            #         current_year = date.today().year
            #         current_time = datetime.now().strftime('%H:%M')
            #         generated_sequence = get_next_value(sequence_name=sequence_name, initial_value=1)
            #         return str(self.app_value) + separator + str(current_year) + separator + str(
            #             generated_sequence).zfill(2) + ' ' + current_time
            #     elif condition.get('four', None):
            #         if construction_format.value in CUSTOM_CODES:
            #             return f"{self.app_value}{str(generated_sequence).zfill(length)}"
            #         elif condition.get('sequence_letter', None):
            #             return self.generate_sequence_letter()
            #         return f"{self.app_value}{separator}{str(generated_sequence).zfill(length)}"
            #     elif condition.get('four_fiscal_year', None):
            #         if construction_format.value in CUSTOM_CODE:
            #             return f"{self.app_value}{str(from_year)[-2:]}{str(to_year)[-2:]}{str(generated_sequence).zfill(length)}"
            #         return f"{self.app_value}/{str(from_year)[-2:]}-{str(to_year)[-2:]}/{str(generated_sequence).zfill(length)}"
            #     elif condition.get('text_fiscal_year', None):
            #         return f"{self.app_value}/{condition.get('text_fiscal_year', '')[:4].upper()}/{str(generated_sequence).zfill(3)}/{str(year_object.get('from_year'))[-2:]}-{str(year_object.get('to_year'))[-2:]}"
            #     elif condition.get('text_fiscal_year_quarter', None):
            #         return f"{self.app_value}/{condition.get('text_fiscal_year_quarter', '')[:4].upper()}/{year_object.get('quarter_value')}-{str(generated_sequence).zfill(3)}/{str(year_object.get('from_year'))[-2:]}-{str(year_object.get('to_year'))[-2:]}"
            #     else:
            #         return str(self.app_value) + separator + str(generated_sequence)
        else:
            print('else')
            raise Exception(f"App key: {construction_format.value} does not exist")    

    @classmethod
    def get_next_sequence_without_format(cls, sequence_name):
        generated_sequence = get_next_value(sequence_name=sequence_name, initial_value=1)
        return str(generated_sequence)
    
    @classmethod
    def generate_fiscal_year(self):
        today = date.today()
        current_year = today.year

        fiscal_year_start_month = 4 

        if today.month >= fiscal_year_start_month:
            from_year = current_year
            to_year = current_year + 1
        else:
            from_year = current_year - 1
            to_year = current_year
            
        quarter = self.check_quarter(today.month)
            
        year_object = { 'from_year': from_year, 
                        'to_year': to_year, 
                        'quarter': quarter.get('quarter', ''),
                        'quarter_value': quarter.get('quarter_value', ''), }
        # print('generate_fiscal_year', year_object)
        return year_object
        
    @classmethod
    def check_quarter(self, month):
        quarter_map = {
            1: "A",  # Q1: April to June
            2: "B",  # Q2: July to September
            3: "C",  # Q3: October to December
            4: "D",  # Q4: January to March
        }

        if month in [4, 5, 6]:
            quarter = 1
        elif month in [7, 8, 9]:
            quarter = 2
        elif month in [10, 11, 12]:
            quarter = 3
        else: 
            quarter = 4

        quarter_value = quarter_map[quarter]
        return { "quarter": quarter, "quarter_value": quarter_value, }

    @classmethod
    def generate_sequence_letter(self):
        prefix_value = AppSettings.objects.filter(app_key=NumberConstructorConstants.MANAGING_CENTER_NUMBERING.value).values_list('app_value', flat=True).first()
        managing_center = self.condition.get('managing_center', '') or ""
        
        if prefix_value and managing_center.startswith(prefix_value):
            managing_center = managing_center[len(prefix_value):]

        sequence_prefix = f"{self.app_value}{managing_center}"
        # print('sequence_prefix', sequence_prefix)
        last_item_code = ProductMaster.objects.filter(
            item_code__startswith=sequence_prefix
        ).annotate(length=Length('item_code')).order_by('-length', '-item_code').values_list('item_code', flat=True).first()

        last_design_code = DesignProductMaster.objects.filter(
            ident_no__startswith=sequence_prefix
        ).annotate(length=Length('ident_no')).order_by('-length', '-ident_no').values_list('ident_no', flat=True).first()
        
        # print('codes', last_item_code, last_design_code)
        last_code = max(filter(None, [last_item_code, last_design_code]), default=None)
        # print('last_code', last_code)
        if last_code:
            last_letter_sequence, numeric_part = self.extract_letter_and_number(last_code)
            # print('sequence_number', last_letter_sequence, numeric_part)
            last_sequence_number = int(numeric_part) if numeric_part.isdigit() else 0
            generated_sequence = last_sequence_number + 1
            if generated_sequence > 999:
                generated_sequence = 1 
                last_letter_sequence = self.increment_letter_sequence(last_letter_sequence) 
        else:
            generated_sequence = 1
            last_letter_sequence = "A"

        sequence_number = str(generated_sequence).zfill(3)
        # print('sequence_number', sequence_number, sequence_prefix, last_letter_sequence)
        return f"{sequence_prefix}{last_letter_sequence}{sequence_number}"
    
    @classmethod
    def increment_letter_sequence(self, sequence):
        """
        Increments an alphabetical sequence:
            - 'A'  â†’ 'B'
            - 'Z'  â†’ 'AA'
            - 'AZ' â†’ 'BA'
            - 'ZZ' â†’ 'AAA'
            - 'AA' â†’ 'AB'
            - 'AAA' â†’ 'AAB'
        """
        if not sequence:
            return "A"

        sequence = list(sequence.upper())  
        
        i = len(sequence) - 1  
        while i >= 0:
            if sequence[i] != 'Z':  
                sequence[i] = chr(ord(sequence[i]) + 1)
                return "".join(sequence)
            sequence[i] = 'A' 
            i -= 1

        return "A" + "".join(sequence) 
    
    @classmethod
    def extract_letter_and_number(self, code):
        """
        Extracts the letter sequence and numeric sequence from a given code.
        Example:
            - "A001"   â†’ ("A", "001")
            - "AZ999"  â†’ ("AZ", "999")
            - "A0"     â†’ ("A", "0")  (Fix case of "A0")
        """
        match = re.search(r"([A-Z]+)(\d+)$", code) 
        if match:
            return match.group(1), match.group(2)  
        return "A", "000" 