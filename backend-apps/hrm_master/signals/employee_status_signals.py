from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Q

MANAGED_STATUSES = {'Onboarding', 'Documents Pending', 'Salary Setup Pending'}


def recompute_employee_status(employee, b_id):
    """Recompute and store employee_status based on document and salary state.

    Only acts when employee is still in a managed onboarding status.
    Once the employee has moved to On Hire / On Leave / Available etc.
    this function is silent — it will not overwrite operational statuses.
    """
    if employee.employee_status not in MANAGED_STATUSES:
        return

    from branch.models import Branch
    from hrm_main.models import EmployeeMonthlySalary

    branch = Branch.objects.filter(id=b_id).first()
    if not branch or branch.employee_activation_flow == 'direct':
        return
    
    has_docs = employee.employee_documents_details.exists()
    print("has_docs", has_docs)
    has_salary = EmployeeMonthlySalary.objects.filter(
        employee=employee,
        approval_status__iexact='APPROVED',
    ).filter(Q(reason__isnull=True) | Q(reason='')).exists()

    if has_docs and has_salary:
        new_status = 'Available'
    elif has_docs and not has_salary:
        new_status = 'Salary Setup Pending'
    elif not has_docs and has_salary:
        new_status = 'Documents Pending'
    else:
        new_status = 'Onboarding'

    if employee.employee_status != new_status:
        employee.employee_status = new_status
        employee.save(update_fields=['employee_status'])


# ── Signal 1: document uploaded ──────────────────────────────────────────────

@receiver(post_save, sender='hrm_master.EmployeeDocumentsDetails')
def on_document_saved(sender, instance, **kwargs):
    emp = instance.employee_document
    if emp:
        recompute_employee_status(emp, emp.b_id)


# ── Signal 2: document deleted (status may regress) ──────────────────────────

@receiver(post_delete, sender='hrm_master.EmployeeDocumentsDetails')
def on_document_deleted(sender, instance, **kwargs):
    emp = instance.employee_document
    if emp:
        recompute_employee_status(emp, emp.b_id)


# ── Signal 3: salary record saved (approved initial setup only) ───────────────

@receiver(post_save, sender='hrm_main.EmployeeMonthlySalary')
def on_salary_saved(sender, instance, **kwargs):
    is_initial = not instance.reason or instance.reason.strip() == ''
    is_approved = (instance.approval_status or '').upper() == 'APPROVED'
    if not (is_initial and is_approved):
        return
    emp = instance.employee
    if emp:
        recompute_employee_status(emp, emp.b_id)
