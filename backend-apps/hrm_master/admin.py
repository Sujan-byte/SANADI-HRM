from django.contrib import admin
from hrm_master.models import ProfessionalTaxSlab


@admin.register(ProfessionalTaxSlab)
class ProfessionalTaxSlabAdmin(admin.ModelAdmin):
    list_display = ('min_salary', 'max_salary', 'tax_amount')
