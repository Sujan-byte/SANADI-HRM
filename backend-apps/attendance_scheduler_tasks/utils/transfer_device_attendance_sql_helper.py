class SQLHelper:
    def __init__(self, cursor):
        self.cursor = cursor

    def get_previous_weekly_off_instance(self, previous_weekly_off, employee_code):
        """Fetch the record for the previous weekly off."""
        self.cursor.execute("""
            SELECT * FROM public.hrm_attendancedetails
            WHERE date = %s
            AND employee_code = %s
            AND status = '11'
            AND is_consecutive_weekly_off = FALSE
        """, (previous_weekly_off, employee_code))
        return self.cursor.fetchone()

    def get_next_weekly_off_instance(self, next_weekly_off, employee_code, is_consecutive_weekly_off):
        """Fetch the record for the next weekly off."""
        self.cursor.execute("""
            SELECT * FROM public.hrm_attendancedetails
            WHERE date = %s
            AND employee_code = %s
            AND status = '11'
            AND is_consecutive_weekly_off = %s
        """, (next_weekly_off, employee_code, is_consecutive_weekly_off))
        return self.cursor.fetchone()

    def update_is_consecutive_weekly_off(self, date, employee_code, is_consecutive_weekly_off):
        """Update the `is_consecutive_weekly_off` field for a given record."""
        self.cursor.execute("""
            UPDATE public.hrm_attendancedetails
            SET is_consecutive_weekly_off = %s
            WHERE date = %s
            AND employee_code = %s
            AND status = '11'
        """, (is_consecutive_weekly_off, date, employee_code))
