from django.db import models, router
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError
from django.db.models.deletion import Collector
from rest_framework import serializers


class Protect_Permanent_Delete_Mixin(models.Model):
    def delete(self, using=None, keep_parents=False):
        # Check if any related objects exist that reference the current record
        protected_object = set()
        for related_object in self._meta.related_objects:
            # remote_field.on_delete == models.PROTECT
            if isinstance(related_object.field, models.ForeignKey):
                accessor_name = related_object.get_accessor_name()
                related_manager = getattr(self, accessor_name)
                print(related_manager.values_list('is_active', flat=True),related_manager)
                if related_manager.exists() and related_object.field.remote_field.on_delete == models.PROTECT:
                    if related_manager.filter(is_active=True).exists():
                        print("related_manager",related_manager)
                        protected_object.add(related_object.related_model._meta.verbose_name)

        # Set the flag to False if related objects exist
        if len(protected_object) > 0:
            error_message = f"Cannot deactivate this record because it is referenced by {', '.join(protected_object)}."
            raise serializers.ValidationError(error_message)

        else:
            super().delete(using=using, keep_parents=keep_parents)

    class Meta:
        abstract = True
