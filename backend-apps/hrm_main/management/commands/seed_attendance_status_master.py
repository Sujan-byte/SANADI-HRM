import json
from pathlib import Path

from django.core.management.base import BaseCommand

from hrm_main.models import AttendanceStatusMaster

SEED_FILE = Path(__file__).resolve().parents[3] / 'seed_files' / 'attendance_status_master.json'


class Command(BaseCommand):
    help = 'Seed default Attendance Status Master entries from seed_files/attendance_status_master.json'

    def handle(self, *args, **options):
        with open(SEED_FILE, encoding='utf-8') as f:
            seeds = json.load(f)

        # `code` is the model's own unique field (not branch-scoped, unlike most other
        # HRM master data) - match on it alone so this is safe to run again on any host,
        # any number of times, without creating duplicates.
        for item in seeds:
            obj, created = AttendanceStatusMaster.objects.update_or_create(
                code=item['code'],
                defaults={
                    'status_name': item['status_name'],
                    'type': item['type'],
                    'is_paid': item['is_paid'],
                    'description': item['description'],
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {obj.code} - {obj.status_name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated: {obj.code} - {obj.status_name}"))

        self.stdout.write(self.style.SUCCESS(f"Attendance Status Master seeded successfully ({len(seeds)} entries)."))
