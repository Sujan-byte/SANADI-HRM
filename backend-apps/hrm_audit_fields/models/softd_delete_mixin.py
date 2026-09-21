

from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

class SoftDeleteMixin(models.Model):
    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete: Set is_active=False and cascade deactivate related objects,
        unless they're protected by on_delete=PROTECT.
        """
        protected_object = set()

        for related_object in self._meta.related_objects:
            field = related_object.field
            accessor_name = related_object.get_accessor_name()

            if isinstance(field, models.OneToOneField):
                try:
                    related_instance = getattr(self, accessor_name)
                    if related_instance and getattr(related_instance, 'is_active', True):
                        if field.remote_field.on_delete == models.PROTECT:
                            protected_object.add(related_object.related_model._meta.verbose_name)
                        else:
                            related_instance.is_active = False
                            related_instance.save()
                except ObjectDoesNotExist:
                    pass

            elif isinstance(field, models.ForeignKey):
                related_manager = getattr(self, accessor_name)
                if related_manager.exists():
                    if field.remote_field.on_delete == models.PROTECT:
                        if related_manager.filter(is_active=True).exists():
                            protected_object.add(related_object.related_model._meta.verbose_name)
                    else:
                        related_manager.filter(is_active=True).update(is_active=False)

        if protected_object:
            raise serializers.ValidationError(
                f"Cannot deactivate this record because it is referenced by: {', '.join(protected_object)}."
            )

        self.is_active = False
        self.save()

    def reactivate(self):
        """
        Reactivate this record and all related inactive records.
        Skips related objects that don't have an is_active field.
        """
        for related_object in self._meta.related_objects:
            field = related_object.field
            accessor_name = related_object.get_accessor_name()

            if isinstance(field, models.OneToOneField):
                try:
                    related_instance = getattr(self, accessor_name)
                    if related_instance and not getattr(related_instance, 'is_active', True):
                        if hasattr(related_instance, 'reactivate'):
                            related_instance.reactivate()
                        elif hasattr(related_instance, 'is_active'):
                            related_instance.is_active = True
                            related_instance.save()
                except ObjectDoesNotExist:
                    pass

            elif isinstance(field, models.ForeignKey):
                related_manager = getattr(self, accessor_name)
                for obj in related_manager.all():
                    if not getattr(obj, 'is_active', True):
                        if hasattr(obj, 'reactivate'):
                            obj.reactivate()
                        else:
                            obj.is_active = True
                            obj.save()

