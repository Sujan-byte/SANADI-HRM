from datetime import date

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from hrm_main.models import ExpenseClaim, PettyCashFund


@receiver(pre_save, sender=ExpenseClaim)
def stash_previous_approval_status(sender, instance, **kwargs):
    """Stash the DB's current approval_status so post_save can detect the transition into APPROVED."""
    if instance.pk:
        instance._previous_approval_status = ExpenseClaim.objects.filter(
            pk=instance.pk
        ).values_list('approval_status', flat=True).first()
    else:
        instance._previous_approval_status = None


@receiver(post_save, sender=ExpenseClaim)
def create_petty_cash_debit_on_approval(sender, instance, created, **kwargs):
    """When a PETTY_CASH claim newly becomes APPROVED, debit its fund exactly once."""
    if created:
        return

    if instance.approval_status != 'APPROVED':
        return

    if getattr(instance, '_previous_approval_status', None) == 'APPROVED':
        return

    if instance.paid_by != 'PETTY_CASH' or not instance.petty_cash_fund_id:
        return

    if instance.petty_cash_txns.filter(source_type='EXPENSE_CLAIM').exists():
        return

    from hrm_main.api.serializers import PettyCashTransactionSerializer

    txn_serializer = PettyCashTransactionSerializer(data={
        'fund': instance.petty_cash_fund_id,
        'transaction_type': 'DEBIT',
        'source_type': 'EXPENSE_CLAIM',
        'amount': instance.total_claimed or 0,
        'transaction_date': date.today(),
        'expense_claim': instance.id,
        'remarks': f'Claim {instance.claim_no or instance.id} approved',
        # No request context exists in a signal handler, so b_id would
        # otherwise be left null — and the frontend filters every list
        # request by b_id, which would silently hide this row.
        'b_id': instance.b_id,
    })
    txn_serializer.is_valid(raise_exception=True)
    txn_serializer.save()


@receiver(pre_save, sender=PettyCashFund)
def stash_previous_fund_approval_status(sender, instance, **kwargs):
    """Stash the DB's current approval_status so post_save can detect the transition into APPROVED."""
    if instance.pk:
        instance._previous_approval_status = PettyCashFund.objects.filter(
            pk=instance.pk
        ).values_list('approval_status', flat=True).first()
    else:
        instance._previous_approval_status = None


@receiver(post_save, sender=PettyCashFund)
def create_opening_transaction_on_approval(sender, instance, created, **kwargs):
    """When a fund is newly APPROVED, record its opening balance exactly once."""
    if created:
        return

    if instance.approval_status != 'APPROVED':
        return

    if getattr(instance, '_previous_approval_status', None) == 'APPROVED':
        return

    opening_balance = instance.opening_balance or 0

    if not opening_balance:
        return

    if instance.transactions.filter(source_type='OPENING').exists():
        return

    from hrm_main.api.serializers import PettyCashTransactionSerializer

    txn_serializer = PettyCashTransactionSerializer(data={
        'fund': instance.id,
        'transaction_type': 'CREDIT',
        'source_type': 'OPENING',
        'amount': opening_balance,
        # The date this money actually became available is the approval
        # date, not the fund's nominal fund_date (which is just whatever
        # date was typed on the form when the fund was created).
        'transaction_date': instance.approval_date or date.today(),
        'remarks': 'Opening balance',
        # No request context exists in a signal handler, so b_id would
        # otherwise be left null — and the frontend filters every list
        # request by b_id, which would silently hide this row.
        'b_id': instance.b_id,
    })
    txn_serializer.is_valid(raise_exception=True)
    txn_serializer.save()

    # The balance recompute above ran on a separately-fetched fund object.
    # `instance` here is the exact object the approval engine keeps using for
    # the rest of this request (e.g. DRF's ModelSerializer.update() calls
    # instance.save() again right after this signal), and a plain save()
    # writes every in-memory field — so without this refresh it would
    # silently overwrite the balance we just computed with its stale value.
    instance.refresh_from_db(fields=['current_balance'])
