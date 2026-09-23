from django.contrib import admin
from hrm_master.models import ProfessionalTaxSlab, GratuityConfigMaster


@admin.register(ProfessionalTaxSlab)
class ProfessionalTaxSlabAdmin(admin.ModelAdmin):
    list_display = ('min_salary', 'max_salary', 'tax_amount')


@admin.register(GratuityConfigMaster)
class GratuityConfigMasterAdmin(admin.ModelAdmin):
    list_display = ('branch', 'gratuity_formula_type', 'gratuity_apply_statutory_cap', 'gratuity_cap_years')
    list_filter = ('gratuity_formula_type', 'gratuity_apply_statutory_cap')
    # b_id is AuditUuidModelMixin's generic per-branch scoping column, unused on this
    # model since `branch` (a real FK) is the actual selector - hide it to avoid a
    # second, redundant "which branch" input on the form.
    exclude = ('b_id',)
