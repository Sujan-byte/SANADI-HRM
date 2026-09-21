from django.core.management.base import BaseCommand
from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details


class Command(BaseCommand):
    help = "Sync attendance. Optionally filter by date range and/or employee codes."

    def add_arguments(self, parser):
        parser.add_argument('start_date', type=str, nargs='?', default=None,
                            help='Start date in YYYY-MM-DD format')
        parser.add_argument('end_date', type=str, nargs='?', default=None,
                            help='End date in YYYY-MM-DD format')
        parser.add_argument('--employees', type=str, default=None,
                            help='Comma-separated employee codes e.g. E10007,E10090')

    def handle(self, *args, **options):
        kwargs = {}
        if options.get('start_date'):
            kwargs['start_date'] = options['start_date']
        if options.get('end_date'):
            kwargs['end_date'] = options['end_date']
        if options.get('employees'):
            kwargs['employee_codes'] = [e.strip() for e in options['employees'].split(',')]

        transfer_attendance_details(**kwargs)
        self.stdout.write(self.style.SUCCESS('Successfully triggered transfer_attendance_details'))
