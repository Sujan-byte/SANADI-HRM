from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType

from branch.models import Branch
from hrm_main.models import ExpenseClaimLinkType


class Command(BaseCommand):
    help = 'Seed default Expense Claim Link Types'

    def handle(self, *args, **options):

        seeds = [
            {
                'order': 1,
                'label': 'Project',
                'app': 'master',
                'model': 'projectmaster',
                'display_field': 'project_name',
                'search_url': '/master/project-master/',
            },
            {
                'order': 2,
                'label': 'Equipment',
                'app': 'master',
                'model': 'equipmentmaster',
                'display_field': 'equipment_name',
                'search_url': '/master/equipment-master/',
            },
            {
                'order': 3,
                'label': 'Site',
                'app': 'master',
                'model': 'sitemaster',
                'display_field': 'site_name',
                'search_url': '/master/site-master/',
            },
            {
                'order': 4,
                'label': 'Maintenance Request',
                'app': 'workshop',
                'model': 'maintenancerequest',
                'display_field': 'request_no',
                'search_url': '/workshop/maintenance-requests/',
            },
            {
                'order': 5,
                'label': 'Purchase Order',
                'app': 'purchase',
                'model': 'purchaseorder',
                'display_field': 'form_code',
                'search_url': '/purchase/purchase-order/',
            },
            {
                'order': 6,
                'label': 'Vendor / Party',
                'app': 'master',
                'model': 'partymaster',
                'display_field': 'party_name',
                'search_url': '/master/party-master/',
            },
            {
                'order': 7,
                'label': 'Job Card',
                'app': 'workshop',
                'model': 'workshopjobcard',
                'display_field': 'card_no',
                'search_url': '/workshop/workshop-job-cards/',
            },
        ]

        branches = Branch.objects.all()

        for branch in branches:

            for item in seeds:

                content_type = ContentType.objects.get(
                    app_label=item['app'],
                    model=item['model']
                )

                obj, created = ExpenseClaimLinkType.objects.update_or_create(
                    label=item['label'],
                    b_id=branch.id,
                    defaults={
                        'content_type': content_type,
                        'display_field': item['display_field'],
                        'search_url': item['search_url'],
                        'order': item['order'],
                        'is_active': True,
                    }
                )

                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created: {obj.label} (branch {branch.id})"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Updated: {obj.label} (branch {branch.id})"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                'Expense Claim Link Types seeded successfully.'
            )
        )