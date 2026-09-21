from django.apps import AppConfig


class HrmMasterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hrm_master'

    def ready(self):
        import hrm_master.signals.leave_master_signals
        import hrm_master.signals.leave_entry_signal
        import hrm_master.signals.salary_components_signals
        import hrm_master.signals.employee_status_signals

        # import hrm_master.signals.over_stay_signals  # needs attendance_scheduler_tasks (biometric sync) — not ported, optional/out of scope for now
        # import hrm_master.signals.mark_for_recalculation