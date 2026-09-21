from collections import OrderedDict
import babel.numbers
from rest_framework import viewsets, status, serializers
from rest_framework.response import Response
import io, os, ast, xlsxwriter, tempfile, pdfkit, environ
import pandas as pd
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import action
from multiprocessing import Pool
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from hrm_audit_fields.models.Protect_Delete_Mixin import ProtectDeleteMixin, ProtectWithDeleteMixin
from django.core.exceptions import ValidationError
from hrm_utils.model_enum import ModelEnum
from hrm_utils.serializer_enum import SerializerEnum
from datetime import datetime
env = environ.Env()
environ.Env.read_env()

def process_item(item, export_fields, decimal=None):
    """Processes a single item to match export fields."""
    # return {field['field']: item.get(field['field'], None) for field in export_fields}
    formatted = {}
    for field in export_fields:
        key = field['field']
        value = item.get(key)
        if key == "created" and value:
            try:
                dt = datetime.fromisoformat(str(value))
                hours24 = dt.hour
                ampm = "PM" if hours24 >= 12 else "AM"
                hours12 = hours24 % 12 or 12

                value = (
                    f"{dt.day:02d}-{dt.month:02d}-{dt.year} "
                    f"{hours12:02d}:{dt.minute:02d} {ampm}"
                )
            except Exception:
                pass
        field_type = field.get('type')
        format_pattern = field.get('format', '1.0-0')
        locale_str = field.get('locale', 'en_IN').replace('-', '_')

        # ðŸ‘‡ If a global `decimal` query param is provided, override the per-field
        # format so every numeric field uses the same precision.
        if decimal is not None and field_type == 'number':
            format_pattern = f'1.{decimal}-{decimal}'

        if field_type == 'number' and value is not None:
            try:
                value = float(value)
                min_frac = int(format_pattern.split('-')[0].split('.')[1])
                max_frac = int(format_pattern.split('-')[1])
                # ðŸ‘‡ Choose grouping pattern based on locale
                grouping = "#,##,##0" if locale_str.lower() == "en_in" else "#,##0"
                decimal_pattern = f"{grouping}.{('0' * min_frac) + ('#' * (max_frac - min_frac))}"
                # print('locale_str:', locale_str)
                # print('decimal_pattern:', decimal_pattern)
                value = babel.numbers.format_decimal(value, format=decimal_pattern, locale=locale_str)
                # print('value:', value)
            except Exception as e:
                print(f"[format error] {key}: {value} â†’ {e}")

        formatted[key] = value
    return formatted

class CustomModelViewSet(viewsets.ModelViewSet):
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        model_class = type(instance)

        user = request.user
        ip_address = self.get_client_ip(request)
        b_id = request.query_params.get('b_id')

        try:
            if issubclass(model_class, ProtectDeleteMixin):
                # Soft delete with ProtectDeleteMixin
                instance.delete(
                    user=user,
                    ip_address=ip_address,
                    b_id=b_id,
                )
                return Response(status=status.HTTP_204_NO_CONTENT)

            elif issubclass(model_class, ProtectWithDeleteMixin):
                # Hard delete with protection check
                instance.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)

            else:
                # Default hard delete
                return super().destroy(request, *args, **kwargs)

        except ValidationError as e:
            print('ValidationError', str(e))
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        # except serializers.ValidationError as e:
        #     print('serializers ValidationError', str(e.detail))
        #     return Response({'detail': str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


    @staticmethod
    def get_dynamic_serializer_class(base_model, base_serializer, required_fields):
        class DynamicSerializer(base_serializer):
            class Meta:
                model = base_model
                fields = required_fields

        return DynamicSerializer


    def get_serializer_class(self):
        if 'required_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            required_fields = query_params.pop('required_fields', None)
            return self.get_dynamic_serializer_class(self.queryset.model, self.serializer_class, required_fields.split(','))
        return self.serializer_class
    
    @action(detail=False, methods=['GET'], url_path='export')
    def export(self, request, client=None):
        query_params = self.request.query_params.dict()
        queryset = self.filter_queryset(self.get_queryset())  
        serializer = self.get_serializer(queryset, many=True)
        b_id = request.query_params.get('b_id', None)
        branch_objects = ModelEnum.BRANCH.objects.filter(id=b_id).first() if b_id else None
        branch_serializer = SerializerEnum.BRANCH_SERIALIZER(branch_objects).data

        if 'export_fields' in self.request.query_params:
            # print('query_params', query_params)
            export_fields = query_params.pop('export_fields', None)
            file_name = query_params.pop('fileName', 'export.xlsx')
            export_fields = ast.literal_eval(export_fields)
            # Optional global decimal override sent by the frontend so every numeric
            # field is formatted with the same precision (no per-field format needed).
            decimal_param = query_params.get('decimal')
            number_locale = query_params.get('number_locale', "en-US").replace('-', '_')
            try:
                decimal = int(decimal_param) if decimal_param not in (None, '') else None
            except (TypeError, ValueError):
                decimal = None
            if query_params.get('pdf') == 'true':
                # print('pdf', query_params.get('pdf'))
                return self.get_export_pdf(serializer.data, file_name, export_fields, branch_serializer, decimal=decimal)
            elif query_params.get('excel') == 'true':
                # print('excel', query_params.get('excel'))
                return self.get_export_excel(serializer.data, file_name, export_fields, branch_serializer, decimal=decimal, number_locale=number_locale)
        return Response({"detail": "Missing export_fields in query parameters."}, status=400)
    
    # EXPORT EXCEL
    @staticmethod
    def get_export_excel(data, header, export_fields, branch_serializer, decimal=None, number_locale="en_US"):
        """
        Generates an Excel file from provided data, headers, and export fields.

        Args:
            data (list): List of dictionaries containing data to export.
            header (str): Report title.
            export_fields (list): List of dictionaries with 'field' and 'label' for field mapping.

        Returns:
            HttpResponse: Response with the generated Excel file.
        """
        # Use multiprocessing to format data
        # with Pool() as pool:
        #     formatted_data = pool.starmap(process_item, [(item, export_fields) for item in data])
        registered_address = branch_serializer.get('registered_address') or ""
        branch_name = branch_serializer.get('branch_name') or ""

        formatted_data = [process_item(item, export_fields, decimal=decimal) for item in data]

        # Create a DataFrame from the formatted data
        df = pd.DataFrame(formatted_data)
        df.fillna(' ', inplace=True)
        df.replace('', ' ', inplace=True)

        # Create an in-memory Excel file buffer
        excel_file = io.BytesIO()

        # Create an Excel writer using XlsxWriter
        with xlsxwriter.Workbook(excel_file) as workbook:
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
            
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter',
            })
            bold_center = workbook.add_format({'bold': True, 'font_size': 12, 'align': 'center', 'valign': 'vcenter'})
            # Choose the integer-part grouping based on the locale: Indian
            # locales group in pairs (10,00,000) while others group in threes
            # (1,000,000). Matches the convention used in process_item().
            grouping = '#,##,##0' if (number_locale or '').lower() == 'en_in' else '#,##0'
            # If a global decimal is provided, build a matching num_format
            # (e.g. decimal=4 â†’ grouping + '.0000'); else keep the legacy 2-decimal default.
            if decimal is not None and decimal >= 0:
                num_format_str = grouping if decimal == 0 else f"{grouping}.{'0' * decimal}"
            else:
                num_format_str = f"{grouping}.00"
            number_format = workbook.add_format({'num_format': num_format_str, 'align': 'right', 'valign': 'vcenter'})
            wrapped_text_format = workbook.add_format({
                'text_wrap': True,
                'align': 'center',
                'valign': 'vcenter'
            })

            def auto_height(text, base=17):
                lines = text.count('\n') + 1
                return lines * base

            # Title row (Branch Name)
            worksheet.merge_range(0, 0, 0, len(export_fields) - 1, branch_name, bold_center)
            # Registered address (merged + wrapped)
            worksheet.merge_range(1, 0, 1, len(export_fields) - 1, registered_address, wrapped_text_format)
            worksheet.set_row(1, auto_height(registered_address))
            # Header (merged)
            worksheet.merge_range(2, 0, 2, len(export_fields) - 1, header, title_format)

            # Write column headers with labels from export_fields
            for col, field in enumerate(export_fields):
                worksheet.write(3, col, field['label'], header_format)

            # === Data rows ===
            start_data_row = 4    # Data starts AFTER header row
            # Write data rows in chunks for memory efficiency
            for row_idx, row_data in enumerate(df.values, start=start_data_row):
                for col_idx, value in enumerate(row_data):
                    field_type = export_fields[col_idx].get('type')
                    if isinstance(value, list):
                        value = ', '.join(map(str, value))

                    if field_type == 'number':
                        try:
                            worksheet.write_number(row_idx, col_idx, float(str(value).replace(',', '')), number_format)
                        except:
                            # worksheet.write(row_idx, col_idx, value)
                            worksheet.write(row_idx, col_idx, str(value), number_format)
                    else:
                        worksheet.write(row_idx, col_idx, value)

            worksheet.freeze_panes(start_data_row, 0)

        # Reset the buffer's position to the beginning
        excel_file.seek(0)

        # Prepare the HTTP response with the Excel file
        response = HttpResponse(
            content=excel_file,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{header}.xlsx"'
        return response
    
    # EXPORT PDF
    @staticmethod
    def get_export_pdf(data, header, export_fields, branch_serializer, decimal=None):
        """
        Generates a PDF file from provided data, headers, and export fields using pdfkit.

        Args:
            data (list): List of dictionaries containing data to export.
            header (str): Report title.
            export_fields (list): List of dictionaries with 'field' and 'label' for field mapping.

        Returns:
            HttpResponse: Response with the generated PDF file.
        """
        # Process data to match export fields
        # with Pool() as pool:
        #     formatted_data = pool.starmap(process_item, [(item, export_fields) for item in data])
        r_address = branch_serializer.get('registered_address')
        registered_address = r_address.replace('\n', '<br/>') if r_address else ""
        branch_name = branch_serializer.get('branch_name')
        formatted_data = [process_item(item, export_fields, decimal=decimal) for item in data]

        # Step 2: Convert formatted_data to rows using export_fields in label order
        label_headers = [field['label'] for field in export_fields]
        field_keys = [field['field'] for field in export_fields]
        
        table_html = "<table class='table table-bordered'>"
        table_html += "<thead><tr>" + "".join(f"<th>{label}</th>" for label in label_headers) + "</tr></thead><tbody>"

        for item in formatted_data:
            # print("Rendering row:", item)
            table_html += "<tr>"
            for key in field_keys:
                value = item.get(key, '')
                if isinstance(value, list):
                    value = ', '.join(map(str, value))
                field_def = next((f for f in export_fields if f['field'] == key), {})
                css_class = "right" if field_def.get('type') == 'number' else ""
                # print('field_def', field_def, css_class)
                table_html += f"<td class='{css_class}'>{value}</td>"
            table_html += "</tr>"

        table_html += "</tbody></table>"

        # Add a custom header to the PDF
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{header}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                }}
                h1 {{
                    text-align: center;
                    margin-bottom: 20px;
                }}
                h2 {{
                    text-align: center;
                    margin-bottom: 20px;
                    font-weight: normal;
                }}
                p {{
                    text-align: center;
                    font-family: 'Roboto', sans-serif;
                    margin-bottom: 20px;
                    font-weight: 1000;
                }}
                .table {{
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }}

            .table th, .table td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;

                white-space: normal !important;
                word-wrap: break-word;
                overflow-wrap: break-word;
                word-break: break-word;
            }}

            .table th {{
                background-color: #f4f4f4;
                font-weight: bold;
            }}

            .right {{
                text-align: right !important;
                white-space: nowrap;
            }}


            // THIS IS THE OLDER CODE - NOW WE HAVE USED ANOTHER NEW CODE JUST FOR WORD WRAP WHICH IS AT THE TOP//
            //  .table {{
                    width: 100%;
                    border-collapse: collapse;
                }}
                .table th, .table td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }}
                .table th {{
                    background-color: #f4f4f4;
                    font-weight: bold;
                }}
                .right {{ text-align: right !important; }} //

            </style>
        </head>
        <body>
            <h1>{branch_name}</h1>
            <h2>{registered_address}</h2>
            <h1>{header}</h1>
            {table_html}
        </body>
        </html>
        """

        # Save the HTML content to a temporary file
        temp_html_file = tempfile.mktemp(suffix=".html")
        with open(temp_html_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        # Convert the HTML file to PDF
        pdf_file_path = tempfile.mktemp(suffix=".pdf")
        config = pdfkit.configuration(wkhtmltopdf=env('WK_HTML_TO_PDF'))
        pdfkit.from_file(
            temp_html_file,
            pdf_file_path,
            configuration=config,
            options={
                "page-size": "A4",
                "orientation": "Landscape",
                "encoding": "UTF-8",
                "no-outline": None,
                "quiet": ""
                # "enable-local-file-access": "",
                # "no-images": "",
                # "debug-javascript": "",
                # "load-error-handling": "ignore"
            }
        )

        # Read the generated PDF into memory
        with open(pdf_file_path, "rb") as pdf_file:
            pdf_data = io.BytesIO(pdf_file.read())

        # Clean up temporary files
        for temp_file in [temp_html_file, pdf_file_path]:
            try:
                os.remove(temp_file)
            except OSError:
                pass

        # Return the PDF as an HTTP response
        response = HttpResponse(
            content=pdf_data,
            content_type="application/pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{header}.pdf"'
        return response   
    
    # @action(detail=False, methods=['GET'], url_path='export_excel')
    # def export_excel(self, request, client):
    #    return CustomFunction().export_excel(self_data=self)
    
    # USING REPORTLAB
    @staticmethod
    def get_export_pdf_old(data, header, export_fields):
        """
        Generates an Excel file from provided data, headers, and export fields.

        Args:
            data (list): List of dictionaries containing data to export.
            header (str): Report title.
            export_fields (list): List of dictionaries with 'field' and 'label' for field mapping.

        Returns:
            HttpResponse: Response with the generated Excel file.
        """
        # Use multiprocessing to format data
        with Pool() as pool:
            formatted_data = pool.starmap(process_item, [(item, export_fields) for item in data])

        # Create a DataFrame from the formatted data
        df = pd.DataFrame(formatted_data)
        df.fillna(' ', inplace=True)
        df.replace('', ' ', inplace=True)

        # Create an in-memory PDF file buffer
        pdf_file = io.BytesIO()
        pdf = canvas.Canvas(pdf_file, pagesize=letter)

        # Set title
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(200, 750, header)

        # Define initial positions for table content
        x = 50
        y = 700

        # Write column headers
        pdf.setFont("Helvetica-Bold", 12)
        for col, field in enumerate(export_fields):
            pdf.drawString(x + col * 150, y, field['label'])

        # Write data rows in chunks for memory efficiency
        pdf.setFont("Helvetica", 10)
        chunk_size = 1000
        y -= 20

        for start_idx in range(0, len(df), chunk_size):
            chunk = df.iloc[start_idx:start_idx + chunk_size]
            for row_data in chunk.values:
                for col_idx, value in enumerate(row_data):
                    # Handle list values by converting them to comma-separated strings
                    if isinstance(value, list):
                        value = ', '.join(map(str, value))
                    pdf.drawString(x + col_idx * 150, y, str(value))
                y -= 20
                if y < 50:  # Start a new page if content overflows
                    pdf.showPage()
                    pdf.setFont("Helvetica", 10)
                    y = 750

        # Finalize and close the PDF
        pdf.save()
        pdf_file.seek(0)

        # Prepare the HTTP response with the PDF file
        response = HttpResponse(
            content=pdf_file,
            content_type='application/pdf',
        )
        response['Content-Disposition'] = f'attachment; filename="{header}.pdf"'
        return response
    
    # OLD EXPORT
    @action(detail=False, methods=['GET'], url_path='export_excel')
    def export_excel(self, request, client=None):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        if 'export_fields' in self.request.query_params:
            query_params = self.request.query_params.dict()
            export_fields = query_params.pop('export_fields', None)
            file_name = query_params.pop('fileName', 'export.xlsx')
            export_fields = ast.literal_eval(export_fields)
            return self.get_export_file(serializer.data, file_name, export_fields)
        return Response({"detail": "Missing export_fields in query parameters."}, status=400)


    @staticmethod
    def get_export_file(data, header, export_fields):
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

