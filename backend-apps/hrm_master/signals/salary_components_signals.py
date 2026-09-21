from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from branch.models import Branch
from hrm_utils.constants import NumberConstructorConstants
from hrm_utils.number_constuctor import NumberConstructor
from hrm_master.models import SalaryComponents
from master.models import AppSettings


@receiver(post_save, sender=Branch)
def preload_salary_component_on_branch_creation(sender, instance, created, **kwargs):
    if created:
        # Define your salary components clearly, grouped by type
        salary_objects = [
            {"type": "Allowance", "component": "Basic Salary", "order": 1},
            {"type": "Allowance", "component": "Housing Allowance", "order": 2},
            {"type": "Allowance", "component": "Transportation Allowance", "order": 3},
            {"type": "Allowance", "component": "Utility Allowance", "order": 4},
            {"type": "Allowance", "component": "Meal/Food Allowance", "order": 5},
            {"type": "Allowance", "component": "Cost of Living Allowance (COLA)", "order": 6},
            {"type": "Allowance", "component": "Company Accommodation", "order": 7},
            {"type": "Allowance", "component": "Company Vehicle or Car Allowance", "order": 8},
            {"type": "Allowance", "component": "Medical Insurance", "order": 9},
            {"type": "Allowance", "component": "Air Ticket Allowance", "order": 10},
            {"type": "Allowance", "component": "Education Allowance", "order": 11},
            {"type": "Allowance", "component": "Mobile/Internet Allowance", "order": 12},
            {"type": "Allowance", "component": "Relocation Allowance", "order": 13},
            {"type": "Deduction", "component": "Loan Repayments", "order": 1},
            {"type": "Deduction", "component": "Absenteeism or Unpaid Leave", "order": 2},
            {"type": "Deduction", "component": "Fines or Penalties", "order": 3},
            {"type": "Deduction", "component": "Sick Leave Unpaid", "order": 4},
            {"type": "Deduction", "component": "Personal Expenses Reimbursement", "order": 5},
            {"type": "Deduction", "component": "End of Service Gratuity Advance Deductions", "order": 6},
        ]

        # Only for the newly created branch, not all branches
        for item in salary_objects:
            SalaryComponents.objects.update_or_create(
                # group_name=item["type"],
                component=item["component"],
                order=item["order"],
                b_id=instance.id,
            )


# @receiver(post_migrate)
def preload_salary_component_on_branch_creation(sender, **kwargs):
    salary_objects = [
        {"type": "Allowance", "component": "Basic Salary", "order": 1},
        {"type": "Allowance", "component": "Housing Allowance", "order": 2},
        {"type": "Allowance", "component": "Transportation Allowance", "order": 3},
        {"type": "Allowance", "component": "Utility Allowance", "order": 4},
        {"type": "Allowance", "component": "Meal/Food Allowance", "order": 5},
        {"type": "Allowance", "component": "Cost of Living Allowance (COLA)", "order": 6},
        {"type": "Allowance", "component": "Company Accommodation", "order": 7},
        {"type": "Allowance", "component": "Company Vehicle or Car Allowance", "order": 8},
        {"type": "Allowance", "component": "Medical Insurance", "order": 9},
        {"type": "Allowance", "component": "Air Ticket Allowance", "order": 10},
        {"type": "Allowance", "component": "Education Allowance", "order": 11},
        {"type": "Allowance", "component": "Mobile/Internet Allowance", "order": 12},
        {"type": "Allowance", "component": "Relocation Allowance", "order": 13},
        {"type": "Deduction", "component": "Loan Repayments", "order": 1},
        {"type": "Deduction", "component": "Absenteeism or Unpaid Leave", "order": 2},
        {"type": "Deduction", "component": "Fines or Penalties", "order": 3},
        {"type": "Deduction", "component": "Sick Leave Unpaid", "order": 4},
        {"type": "Deduction", "component": "Personal Expenses Reimbursement", "order": 5},
        {"type": "Deduction", "component": "End of Service Gratuity Advance Deductions", "order": 6},
    ]

    for branch in Branch.objects.all():
        for item in salary_objects:
            SalaryComponents.objects.update_or_create(
                type=item["type"],
                component=item["component"],
                order=item["order"],
                b_id=branch.id,
                defaults={}  # Ensures existing ones are not overwritten
            )
