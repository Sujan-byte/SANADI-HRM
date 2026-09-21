from django.db import models


class RevisionMixin(models.Model):
    base_revised_fk = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+"
    )
    is_revised = models.BooleanField(default=False)
    revise_count = models.IntegerField(default=0)

    revision_note = models.TextField(null=True, blank=True)
    is_lock = models.BooleanField(default=False)

    class Meta:
        abstract = True