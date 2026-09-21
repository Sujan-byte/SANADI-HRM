
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

class MultiApprovalMixinBase(models.base.ModelBase):
    """
    A custom metaclass to dynamically create approval stages tables for models
    inheriting from MultiApprovalMixin.
    """
    NOT_APPROVED = 'NOT_APPROVED'
    APPROVED = 'APPROVED'
    PENDING_APPROVAL = 'PENDING_APPROVAL'
    REJECTED = 'REJECTED'
    CANCELLED = 'CANCELLED'
    APPROVAL_STATUS_CHOICES = [
        (NOT_APPROVED, 'Not Approved'),
        (APPROVED, 'Approved'),
        (PENDING_APPROVAL, 'Pending Approval'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled')
    ]
    APPROVAL_STATUS_DICT=dict(APPROVAL_STATUS_CHOICES)
    OPEN_RE_ENTRY = 'open_re_entry'
    PREVIOUS_FLOW_RE_ENTRY = 'previous_flow_re_entry'
    REJECTION_CHOICES = [
        (OPEN_RE_ENTRY, 'Anybody can take up the form and re-enter.'),
        (PREVIOUS_FLOW_RE_ENTRY, 'Only the previous approval flow stages can re-enter.')
    ]

    def __new__(cls, name, bases, attrs):
        model_class = super().__new__(cls, name, bases, attrs)

        if attrs.get('Meta', None) and getattr(attrs['Meta'], 'abstract', False):
            return model_class

        if issubclass(type(model_class), MultiApprovalMixinBase):
                User = get_user_model()
                app_label = model_class._meta.app_label
                related_model_name = f"{name}ApprovalStages"
                approval_model_name = f"{name}ApprovalStages"

                fields = {
                    'id': models.AutoField(primary_key=True),
                    'related_object': models.ForeignKey(
                        model_class,
                        on_delete=models.CASCADE,
                        related_name="approval_stages"
                    ),
                    'stage_name': models.CharField(max_length=255),
                    'permission_code':models.CharField(max_length=255),
                    'approval_status': models.CharField(
                        max_length=50,
                        choices=MultiApprovalMixinBase.APPROVAL_STATUS_CHOICES,
                        default=MultiApprovalMixinBase.PENDING_APPROVAL
                    ),
                    'created_user': models.ForeignKey(
                        User, on_delete=models.SET_NULL, null=True, blank=True, related_name=f"{name}_created_user"
                    ),
                    'approved_user': models.ForeignKey(
                        User, on_delete=models.SET_NULL, null=True, blank=True, related_name=f"{name}_approved_user"
                    ),
                    'approval_by': models.CharField(max_length=500, null=True, blank=True),
                    'approval_date': models.DateTimeField(null=True, blank=True),
                    'modified_date': models.DateTimeField(null=True, blank=True,default=timezone.now),
                    'comments': models.TextField(null=True, blank=True),
                    'order': models.PositiveIntegerField(default=0),
                    '__module__': model_class.__module__,
                    'Meta': type('Meta', (), {
                        'app_label': app_label,
                        'db_table': f"{app_label.lower()}_{approval_model_name.lower()}",
                        'default_permissions': {}
                    })
                }
                type(related_model_name, (models.Model,), fields)
                # apps.register_model(app_label, approval_model)
        return model_class

    default_permissions = {}