from django.db import models
from rest_framework import serializers


def handle_empty_fields(data, model=None, serializer=None):
    fields = {}

    # Get fields from the model
    if model:
        fields = {field.name: field for field in model._meta.get_fields()}

    # Get fields from the serializer
    if serializer:

        fields.update(serializer.fields)

    for field_name, field in fields.items():
        if field_name in data:
            value = data[field_name]

            # Convert empty string to None for DateFields
            if isinstance(field, (models.DateField, serializers.DateField)):
                data[field_name] = None if value == "" else value

            # Convert empty string to 0 for Numeric Fields
            elif isinstance(field, (models.FloatField, models.IntegerField, models.DecimalField,
                                    serializers.FloatField, serializers.IntegerField, serializers.DecimalField)):
                data[field_name] = 0 if value == "" else value

            # Convert empty string to empty string for Char & Text Fields
            elif isinstance(field, (models.CharField, models.TextField, serializers.CharField)):
                data[field_name] = value.strip() if isinstance(value, str) else value

            # Convert empty string to boolean for BooleanFields
            elif isinstance(field, (models.BooleanField, serializers.BooleanField)):
                if isinstance(value, str):
                    data[field_name] = value.lower() in ['true', '1', 'yes']

            # Convert empty string to empty list for List Fields
            elif isinstance(field, (serializers.ListField, serializers.ManyRelatedField, models.ManyToManyField)):
                if value == "":
                    data[field_name] = []

            # Convert empty string to empty list for Nested Serializers (many=True)
            elif isinstance(field, serializers.ListSerializer) or getattr(field, 'many', False):
                if value == "":
                    data[field_name] = []

    return data
