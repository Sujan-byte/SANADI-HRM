import re
import logging
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from hrm_master.models import LeavePolicy, LeaveMaster, LeaveMasterDetails, EmployeeMaster, LeavePolicyDetail
from django.db.models import Sum 
from django.db import transaction
from hrm_master.models import LeaveApplication
from django.core.mail import send_mail
from backend import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from branch.models import Branch
from django.db.models import Q



# @receiver(post_save, sender=LeavePolicy, weak=False)
# def leave_policy_post_save(sender, instance, created, **kwargs):
#     if hasattr(instance, '_processing_signal'):
#         return
#
#     instance._processing_signal = True
#     b_id = getattr(instance, 'b_id', None) or kwargs.get('b_id')
#
#     def process_leave_policy():
#         instance.refresh_from_db()
#         leave_details = LeavePolicyDetail.objects.filter(leave_policy=instance)
#         total_days = leave_details.aggregate(total=Sum('number_of_days'))['total'] or 0
#         leave_type_name = instance.type_of_leave.status_name if instance.type_of_leave else "Default"
#
#         # Build dynamic filters
#         filters = Q(b_id=b_id)
#         if instance.employee_type and instance.employee_type != 'All':
#             filters &= Q(employee_type=instance.employee_type)
#         if instance.employee_group and instance.employee_group != 'All':
#             filters &= Q(employee_group=instance.employee_group)
#         if instance.employee_reporting and instance.employee_reporting != 'All':
#             filters &= Q(employee_reporting=instance.employee_reporting)
#
#         # Get all matching employees
#         all_employees = EmployeeMaster.objects.filter(filters)
#
#         # Process employees in bulk
#         for employee in all_employees:
#             with transaction.atomic():  # Wrap per-employee operations in a transaction
#                 # Create/update LeaveMaster
#                 leave_master, _ = LeaveMaster.objects.get_or_create(
#                     employee=employee,
#                     defaults={
#                         'total_allocated_leaves': total_days,
#                         'total_available_leaves': total_days,
#                         'total_utilized_leaves': 0,
#                         'b_id': b_id
#                     }
#                 )
#
#                 # Create/update LeaveMasterDetails
#                 leave_detail, detail_created = LeaveMasterDetails.objects.get_or_create(
#                     leave_master=leave_master,
#                     leave_type=leave_type_name,
#                     defaults={
#                         'allocated_leaves': total_days,
#                         'available_leaves': total_days,
#                         'utilized_leaves': 0,
#                         'b_id': b_id
#                     }
#                 )
#
#                 if not detail_created:
#                     leave_detail.allocated_leaves = total_days
#                     leave_detail.available_leaves = total_days
#                     leave_detail.save()
#
#                 # Aggregate after all details operations
#                 aggregates = LeaveMasterDetails.objects.filter(
#                     leave_master=leave_master
#                 ).aggregate(
#                     allocated_sum=Sum('allocated_leaves'),
#                     available_sum=Sum('available_leaves'),
#                     utilized_sum=Sum('utilized_leaves')
#                 )
#
#                 # Update LeaveMaster
#                 leave_master.total_allocated_leaves = aggregates['allocated_sum'] or 0
#                 leave_master.total_available_leaves = aggregates['available_sum'] or 0
#                 leave_master.total_utilized_leaves = aggregates['utilized_sum'] or 0
#                 leave_master.save()
#
#         if hasattr(instance, '_processing_signal'):
#             delattr(instance, '_processing_signal')
#
#     transaction.on_commit(process_leave_policy)


def get_branch_name(branch_id):
    """Cache branch name lookup to avoid repeated queries"""
    if not hasattr(get_branch_name, '_cache'):
        get_branch_name._cache = {}

    if branch_id not in get_branch_name._cache:
        branch = Branch.objects.filter(id=branch_id).first()
        get_branch_name._cache[branch_id] = branch.branch_name if branch else 'Amigo HRM'

    return get_branch_name._cache[branch_id]


def parse_user_created(user_created):
    """Extract name and email from user_created string"""
    if match := re.match(r'^(.*?)\s*\((.*?)\)$', user_created):
        return match.groups()
    return user_created, None


def build_common_context(instance, created_user_name, approver_name,data):
    """Shared context for all email templates"""
    base_context={
        'employee_name': instance.employee_name,
        'leave_type': 'Annual Leave',
        'creator_name': created_user_name,
        'approver_name': approver_name,
        'leave_days': instance.leave_days_applied,
        'approval_link': 'http://sanadi.localhost:4200/app/login/',
        'company_name': get_branch_name(instance.b_id),
    }
    if data:
        base_context.update(data)

    return base_context


@receiver(post_save, sender=LeaveApplication)
def send_leave_notification(sender, instance, created, **kwargs):
    previous_instance_approval_status =kwargs.get('previous_instance_approval_status',ApprovalModelMixin.PENDING_APPROVAL)
    if 'request' not in kwargs or previous_instance_approval_status == ApprovalModelMixin.APPROVED:
        return

    request = kwargs['request']
    data = kwargs['data']

    employee = instance.employee_code
    approver = employee.first_reporting_authority if employee.first_reporting_authority is not None else request.user
    created_user_name, created_email = parse_user_created(instance.user_created)
    delegated_reviewer = instance.delegated_reviewer
    last_reviewer_obj = instance.approval_stages.filter(stage_name='Approver').last()

    def _send_notification():
        if created:
            common_context = build_common_context(instance, created_user_name, approver.first_name,data)
            send_leave_request_notification(
                instance,
                approver.email,
                created_email,
                employee.email,
                common_context
            )
        elif delegated_reviewer and not instance.delegated_reviewer_mail_sent and last_reviewer_obj.approval_status == 'APPROVED':
            common_context = build_common_context(instance, created_user_name, delegated_reviewer.first_name, data)

            common_context['approver_notes'] = last_reviewer_obj.comments
            common_context['fra_name'] = request.user.first_name
            send_leave_delegated_reviewer_notification(
                instance,
                request.user.email,
                created_email,
                employee.email,
                delegated_reviewer.email,
                common_context
            )
            instance.delegated_reviewer_mail_sent = True
            instance.save(update_fields=['delegated_reviewer_mail_sent'])
        elif instance.approval_status == 'APPROVED':
            common_context = build_common_context(instance, created_user_name, request.user.first_name,data)
            approved_obj = instance.approval_stages.filter(approval_status='APPROVED').last()
            if approved_obj:
                common_context['approver_notes'] = approved_obj.comments
            send_leave_approval_notification(
                instance,
                employee.email,
                request.user.email,
                created_email,
                common_context
            )
        elif instance.approval_status == 'REJECTED':
            common_context = build_common_context(instance, created_user_name, request.user.first_name,data)
            rejected_obj=instance.approval_stages.filter(approval_status='REJECTED').last()
            if rejected_obj:
                common_context['rejection_reason'] = rejected_obj.comments
            send_leave_rejection_notification(
                instance,
                employee.email,
                request.user.email,
                created_email,
                common_context
            )

    def _send_notification_best_effort():
        # Best-effort: a leave application must save successfully even if the host
        # hasn't provided its own email_templates/*.html (this plugin doesn't bundle
        # any - they're expected to be host-provided, same as the SMTP settings).
        try:
            _send_notification()
        except Exception:
            logger.warning("Skipping leave-application email notification - could not send", exc_info=True)

    transaction.on_commit(_send_notification_best_effort)


def send_leave_request_notification(instance, approver_email, created_email, employee_email, context):
    send_template_email(
        subject=f"Leave Approval Needed: {instance.employee_name}",
        template_name='email_templates/leave_request.html',
        context=context,
        to_emails=[approver_email],
        cc=[created_email, employee_email]
    )


def send_leave_approval_notification(instance, employee_email, approver_email, created_email, context):

    print("context",context)
    send_template_email(
        subject=f"Leave Approved: {instance.employee_name}",
        template_name='email_templates/leave_approved.html',
        context=context,
        to_emails=[approver_email],
        cc=[created_email, employee_email]
    )

def send_leave_delegated_reviewer_notification(instance, reviewer_email, created_email, employee_email, delegated_reviewer_mail, context):
    send_template_email(
        subject=f"Leave Approval Needed: {instance.employee_code.first_name}",
        template_name='email_templates/delegated_reviewer.html',
        context=context,
        to_emails=[delegated_reviewer_mail],
        cc=[created_email, employee_email, reviewer_email]
    )


def send_leave_rejection_notification(instance, employee_email, approver_email, created_email, context):
    send_template_email(
        subject=f"Leave Rejected: {instance.employee_name}",
        template_name='email_templates/leave_rejected.html',
        context=context,
        to_emails=[created_email],
        cc=[approver_email, employee_email]
    )


def send_template_email(subject, template_name, context, to_emails, cc=None):
    """
    Sends an email using HTML template with plain text fallback
    """
    if not to_emails:
        return

    html_message = render_to_string(template_name, context)
    plain_message = strip_tags(html_message)
    recipients = to_emails

    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipients,
        cc=cc,
    )

    if html_message:
        email.attach_alternative(html_message, "text/html")

    email.send(fail_silently=False)