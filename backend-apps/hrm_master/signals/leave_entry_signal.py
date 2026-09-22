import re
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.core.mail import send_mail
from backend import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from branch.models import Branch
from hrm_master.models import LeaveEntry
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

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
        'employee_name': instance.employee.first_name,
        'leave_type': instance.leave_type.status_name,
        'creator_name': created_user_name,
        'approver_name': approver_name,
        'leave_days': instance.no_of_days,
        'approval_link': 'http://sanadi.localhost:4200/app/login/',
        'company_name': get_branch_name(instance.b_id),
        'form_type':instance.travel_or_leave,
        'request_reason':instance.reason
    }
    if data:
        base_context.update(data)

    return base_context


@receiver(post_save, sender=LeaveEntry)
def send_leave_notification(sender, instance, created, **kwargs):

    if 'request' not in kwargs:
        return

    request = kwargs['request']
    data = kwargs['data']

    employee = instance.employee
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
        # elif delegated_reviewer and not instance.delegated_reviewer_mail_sent and last_reviewer_obj.approval_status=='APPROVED':
        elif (
                delegated_reviewer
                and not instance.delegated_reviewer_mail_sent
                and last_reviewer_obj
                and last_reviewer_obj.approval_status == 'APPROVED'
            ):

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
        # Best-effort: a leave entry must save successfully even if the host hasn't
        # provided its own email_templates/*.html (this plugin doesn't bundle any -
        # they're expected to be host-provided, same as the SMTP settings themselves).
        try:
            _send_notification()
        except Exception:
            logger.warning("Skipping leave-entry email notification - could not send", exc_info=True)

    transaction.on_commit(_send_notification_best_effort)


def send_leave_request_notification(instance, approver_email, created_email, employee_email, context):
    send_template_email(
        subject=f"{instance.travel_or_leave} Approval Needed: {instance.employee.first_name}",
        template_name='email_templates/leave_request.html',
        context=context,
        to_emails=[approver_email],
        cc=[created_email, employee_email]
    )

def send_leave_delegated_reviewer_notification(instance, reviewer_email, created_email, employee_email, delegated_reviewer_mail, context):
    send_template_email(
        subject=f"{instance.travel_or_leave} Approval Needed: {instance.employee.first_name}",
        template_name='email_templates/delegated_reviewer.html',
        context=context,
        to_emails=[delegated_reviewer_mail],
        cc=[created_email, employee_email, reviewer_email]
    )


def send_leave_approval_notification(instance, employee_email, approver_email, created_email, context):

    send_template_email(
        subject=f"{instance.travel_or_leave} request Approved: {instance.employee.first_name}",
        template_name='email_templates/leave_approved.html',
        context=context,
        to_emails=[approver_email],
        cc=[created_email, employee_email]
    )


def send_leave_rejection_notification(instance, employee_email, approver_email, created_email, context):
    send_template_email(
        subject=f"{instance.travel_or_leave} request Rejected: {instance.employee.first_name}",
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