from django.db import models

from hrm_audit_fields.models import AuditModelMixin, AuditUuidModelMixin
from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from django.db.models import fields
from rest_framework import serializers


def _format_field_name(field_name):
    # Replace underscores with spaces and capitalize each word
    return ' '.join(word.capitalize() for word in field_name.split('_'))


class DynamicValidatorModel(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # print("comes to save")
        # Perform additional checks or modifications before saving
        self.clean()  # Optionally perform validation before saving
        super().save(*args, **kwargs)

    def filter_fields(self):
        model_fields = list(self._meta.fields)
        excluded_fields = [field.name for field in AuditModelMixin._meta.get_fields()]
        excluded_fields.extend([field.name for field in ApprovalModelMixin._meta.get_fields()])
        excluded_fields.extend([field.name for field in AuditUuidModelMixin._meta.get_fields()])
        excluded_fields.extend(['id'])
        return [field for field in model_fields if field.name not in excluded_fields]

    def clean(self):
        model_fields = self.filter_fields()
        row_name = getattr(self, 'row_name', None)
        errors = {}
        for field in model_fields:
            if isinstance(field, models.CharField):
                value = getattr(self, field.attname)
                if not value and (field.null is not True or field.blank is not True):
                    # errors[field.name] = f"{row_name + ' : ' if row_name else ''}{field.name.capitalize()} is required."
                    errors[
                        field.name] = f"{row_name + ' : ' if row_name else ''}{_format_field_name(field.name)} is required."
            elif isinstance(field, models.ForeignKey):
                value = getattr(self, field.attname)
                if not value and field.null is not True:
                    errors[
                        field.name] = f"{row_name + ' : ' if row_name else ''}{_format_field_name(field.name)} is required."
            elif isinstance(field, (models.IntegerField, models.FloatField, models.DecimalField)):
                if field.default == fields.NOT_PROVIDED:
                    value = getattr(self, field.attname)
                    # print("comes here", field.name, value, value == '0')
                    if value is None or value == '0' or value == "" or value == 0:
                        errors[
                            field.name] = f"{row_name + ' : ' if row_name else ''}{_format_field_name(field.name)} is required."

        for field in model_fields:
            if isinstance(field, models.CharField) and field.max_length is not None:
                value = getattr(self, field.attname)
                if isinstance(value, str) and len(value) > field.max_length:
                    errors[field.name] = (f"{_format_field_name(field.name)} length ({len(value)}) "
                                          f"exceeds maximum length ({field.max_length}).")

        if errors:
            errors = dict(list(errors.items())[::-1])  # re-ordering errors to show in priority
            raise serializers.ValidationError(errors)

    def _format_field_name(self, field_name):
        # Replace underscores with spaces and capitalize each word
        return ' '.join(word.capitalize() for word in field_name.split('_'))


class UniqueConstraintValidator(serializers.ModelSerializer):

    def get_unique_fields(self):
        unique_fields = []
        # Get all field names that have unique=True
        for field in self.Meta.model._meta.fields:
            if field.unique:
                unique_fields.append(field)
        return unique_fields

    def validate(self, attrs):
        unique_fields = self.get_unique_fields()

        for field in unique_fields:
            if field.name in attrs:
                value = attrs[field.name]
                if value:
                    model_class = self.Meta.model
                    filter_kwargs = {f"{field.name}__iexact": value}
                    exists_obj = model_class.objects.filter(**filter_kwargs).first()
                    if exists_obj:
                        if self.instance and exists_obj.id == self.instance.id:
                            pass
                        else:
                            raise serializers.ValidationError({
                                                                  field.name: f"This {field.help_text if field.help_text else field.verbose_name.title()} already exists."})

        return super().validate(attrs)
