from django.db.models import Q
import json

class MultiApprovalStagesViewSetMixin:

    def get_queryset(self):
        queryset = super().get_queryset()
        filters = self.get_filter_conditions()
        if filters:
            queryset = queryset.filter(filters).distinct()
        return queryset

#---------OLD CODE---------------
    # def get_filter_conditions(self):
    #     filter_conditions = None
    #     user = self.request.query_params.get('approval_stages__user', None)
    #     if user:
    #         condition1 = Q(approval_stages__created_user__id=user)
    #         # TODO NOTE: For future projects, the "first reporting authority" should replace the "reporting authority,"
    #         # TODO and the "second reporting authority" should be removed. Ensure standardization across the implementation.
    #         condition2 = Q(approval_stages__approved_user__employee__first_reporting_authority__user__id=user)
    #         filter_conditions = condition1 | condition2
    #     return filter_conditions
# ---------OLD CODE---------------

    def get_filter_conditions(self):
        filter_conditions = None
        user = self.request.query_params.get('approval_stages__user', None)
        required_filter = self.request.query_params.get('required_filter', None) #here we are getting multiple key,value pairs

        instance = self.queryset.first()

        if not instance or not hasattr(instance, 'get_approval_stage_config'):
            config=None
        else:
            config = instance.get_approval_stage_config()

        if user:
            condition1 = Q(approval_stages__created_user__id=user)
            #TODO NOTE: For future projects, the "first reporting authority" should replace the "reporting authority,"
            #TODO and the "second reporting authority" should be removed. Ensure standardization across the implementation.
            if config and config.get('forward_on_creation'):
                condition2 = Q(approval_stages__created_user__employee__first_reporting_authority__user__id=user)
            else:
                condition2 = Q(approval_stages__approved_user__employee__first_reporting_authority__user__id=user)

            filter_conditions = condition1 | condition2

            if config and config.get("assign_to_field", None):
                assign_to_field = config.get("assign_to_field")
                print("assign to field", assign_to_field)
                condition3 = Q(**{f"{assign_to_field}__employee__first_reporting_authority__user__id": user})
                condition4 = Q(**{f"{assign_to_field}__id": user})
                filter_conditions |= (condition3 | condition4)

        if required_filter:
            required_filter = json.loads(required_filter)

        if required_filter is not None:
            # ------ start by combining all conditions in `required_filter` with AND ------------
            condition = Q()
            for key, value in required_filter.items():
                condition &= Q(**{key: value})
            # ----- combine the AND conditions with the existing filter_conditions using OR------
            filter_conditions |= condition
        print("filter conditions",filter_conditions)
        return filter_conditions
