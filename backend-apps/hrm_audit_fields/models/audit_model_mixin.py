import arrow
import socket
import os

from django.apps import apps as django_apps
from django.conf import settings
from django.db import models

from ..constants import AUDIT_MODEL_UPDATE_FIELDS
from ..fields import HostnameModificationField, UserField


def utcnow():
    return arrow.utcnow().datetime


def update_device_fields(instance):
    device_id = getattr(settings, "DEVICE_ID", None)
    try:
        app_config = django_apps.get_app_config("edc_device")
    except LookupError:
        pass
    else:
        device_id = device_id or app_config.device_id

    if not instance.id:
        device_created = device_id or "00"
    else:
        device_created = instance.device_created
    device_modified = device_id or "00"
    return device_created, device_modified


class AuditModelMixin(models.Model):
    """Base model class for all models. Adds created and modified'
    values for user, date and hostname (computer).
    """

    get_latest_by = "modified"

    created = models.DateTimeField(blank=True, default=utcnow)

    modified = models.DateTimeField(blank=True, default=utcnow)
    user_created = models.CharField(max_length=200, null=True, blank=True)
    user_modified = models.CharField(max_length=200, null=True, blank=True)
    uc_id = models.IntegerField(null=True, default=None, blank=True)
    um_id = models.IntegerField(null=True, default=None, blank=True)
    c_id = models.IntegerField(null=True, default=None, blank=True)
    decimal = models.FloatField(default=0.0,null=True, blank=True)
    # device = models.CharField(max_length=200, null=True, blank=True)
    ip_address = models.CharField(max_length=200, null=True, blank=True)
    # w_id = models.IntegerField(null=True, default=None, blank=True)  # Warehouse ID @TODO Need to add warehouse foreign key.
    b_id = models.IntegerField(null=True, default=None, blank=True)
    # hostuser_created = UserField(
    #     max_length=50,
    #     blank=True,
    #     verbose_name="user created",
    #     help_text="Updated by admin.save_model",
    # )
    #
    # hostuser_modified = UserField(
    #     max_length=50,
    #     blank=True,
    #     verbose_name="user modified",
    #     help_text="Updated by admin.save_model",
    # )
    #
    # hostname_created = models.CharField(
    #     max_length=60,
    #     blank=True,
    #     default=socket.gethostname,
    #     help_text="System field. (modified on create only)",
    # )
    #
    # hostname_modified = HostnameModificationField(
    #     max_length=50, blank=True, help_text="System field. (modified on every save)"
    # )

    # device_created = models.CharField(max_length=10, blank=True)
    #
    # device_modified = models.CharField(max_length=10, blank=True)

    objects = models.Manager()

    def save(self, *args, **kwargs):
        request = kwargs.pop('request', None)
        if request and hasattr(request, 'user'):
            user_id = getattr(request.user, 'id', None)

            if not self.pk:
                self.uc_id = user_id
            self.um_id = user_id
            if request:
                # set user_created to logged-in user's details
                self.hostuser_created = os.environ['username']
                self.hostuser_modified = os.environ['username']

        super().save(*args, **kwargs)

    @property
    def verbose_name(self):
        return self._meta.verbose_name

    class Meta:
        get_latest_by = "modified"
        ordering = ("-modified", "-created")
        abstract = True
