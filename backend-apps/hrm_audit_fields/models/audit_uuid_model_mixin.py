from email.policy import default
from django.db import models

from ..fields import UUIDAutoField
from .audit_model_mixin import AuditModelMixin
from simple_history.models import HistoricalRecords
from django.core.exceptions import ValidationError


class AuditUuidModelMixin(AuditModelMixin, models.Model):
    """Base model class for all models using an UUID and not
    an INT for the primary key.
    """

    guid = UUIDAutoField(
        blank=True,
        editable=False,
        help_text="System auto field. UUID primary key.",
    )

    history = HistoricalRecords(inherit=True)
    is_active = models.BooleanField(default=True)

    class Meta(AuditModelMixin.Meta):
        abstract = True


class ApprovalModel(models.Model):
    """
        Base model for creating the Audit Fields 
    """
    APPROVAL_STATUS = ['NOT APPROVED', 'APPROVED', 'PENDING APPROVAL', 'REJECTED']

    approval_status = models.CharField(max_length=50, default="NOT APPROVED")
    approval_date = models.CharField(max_length=50)
    approval_by = models.CharField(max_length=50)

    class Meta:
        abstract = True

    def clean(self, *args, **kwargs):
        if self.approval_status not in ApprovalModel.APPROVAL_STATUS:
            raise ValidationError('Invaild Status Supplied for Approval status ')
        super().clean(*args, **kwargs)
