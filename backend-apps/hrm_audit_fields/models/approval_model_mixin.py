from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from security.models import User


class ApprovalModelMixin(models.Model):
    """
        Base model for creating the Audit Fields
    """
    NOT_APPROVED = 'NOT_APPROVED'
    APPROVED = 'APPROVED'
    PENDING_APPROVAL = 'PENDING_APPROVAL'
    # SENT_FOR_REVIEW = 'SENT_FOR_REVIEW'
    REJECTED = 'REJECTED'
    CANCELLED = 'CANCELLED'

    APPROVAL_STATUS_CHOICES = [
        (NOT_APPROVED, 'Not Approved'),
        (APPROVED, 'Approved'),
        (PENDING_APPROVAL, 'Pending Approval'),
        # (SENT_FOR_REVIEW, 'Sent For Review'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
    ]
    APPROVAL_STATUS_DICT = dict(APPROVAL_STATUS_CHOICES)
    approval_status = models.CharField(max_length=50, choices=APPROVAL_STATUS_CHOICES, default=PENDING_APPROVAL)
    approval_date = models.DateField(null=True, blank=True)
    approval_by = models.CharField(max_length=500, null=True, blank=True)
    approved_user = models.ForeignKey(User,on_delete=models.SET_NULL, blank=True, null=True, default=None)
    approval_remarks=models.CharField(max_length=255, null=True, blank=True,default="")
    is_finalized = models.BooleanField(default=False)
    class Meta:
        abstract = True

    def clean(self, *args, **kwargs):
        if self.approval_status not in dict(self.APPROVAL_STATUS_CHOICES).keys():
            raise ValidationError('Invalid status supplied for approval status')
        super().clean(*args, **kwargs)
