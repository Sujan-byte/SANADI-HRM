from django.forms.models import model_to_dict
from django.db.models import F


def detect_field_changes(instance, fields=None):
    if not instance.pk:
        return False

    model = instance.__class__
    old = model.objects.get(pk=instance.pk)

    if not fields:
        fields = [f.name for f in instance._meta.fields]

    old_data = model_to_dict(old, fields=fields)
    new_data = model_to_dict(instance, fields=fields)
    print("old data",old_data,new_data)
    return old_data != new_data


def bump_version(instance, field_name="version"):
    print("obj",instance.__class__.objects)
    instance.__class__.objects.filter(pk=instance.pk).update(
        **{field_name: F(field_name) + 1}
    )
    instance.refresh_from_db()


def bump_parent_version(instance, parent_field, version_field="version"):
    parent = getattr(instance, parent_field, None)
    if parent:
        parent.__class__.objects.filter(pk=parent.pk).update(
            **{version_field: F(version_field) + 1}
        )


def track_changes(
    instance,
    fields=None,
    bump_self=False,
    parent_field=None,
):
    changed = detect_field_changes(instance, fields)
    print("changed",changed)
    if not changed:
        return False

    if bump_self:
        bump_version(instance)

    if parent_field:
        bump_parent_version(instance, parent_field)

    return True