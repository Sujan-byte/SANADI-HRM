from django.db import models


class FormDisablingBase(models.Model):
    formDisabled = models.BooleanField(default=False)

    class Meta:
        abstract = True

    @classmethod
    def disable_form(cls, key_name,job_id, model_name,value):
        filter_kwargs = {key_name: job_id}
        related_models = model_name.objects.filter(**filter_kwargs)
        if related_models.exists():
            related_models.update(formDisabled=value)
