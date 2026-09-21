from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from hrm_master.models import LeavePolicy, EmployeeMaster, LeavePolicyDetail, LeaveMasterDetails


@receiver(post_save, sender=LeavePolicy)
def handle_policy_change(sender, instance, **kwargs):
    mark_for_recalculation(leave_policy=instance)

@receiver(post_delete, sender=LeavePolicyDetail)
@receiver(post_save, sender=LeavePolicyDetail)
def handle_policy_detail_change(sender, instance, **kwargs):
    mark_for_recalculation(leave_policy=instance.leave_policy)


def mark_for_recalculation(employee=None, leave_policy=None):

    if employee:
        LeaveMasterDetails.objects.filter(leave_master__employee=employee).update(needs_recalculation=True)
    if leave_policy:
        LeaveMasterDetails.objects.filter(
            leave_type=leave_policy.type_of_leave.status_name
        ).update(needs_recalculation=True)