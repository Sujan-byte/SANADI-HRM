from django.urls import path, include
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
router.register("hrm", HRMDashboardViewSet, basename="hrm")
# router.register("erpupdate", ERPDashboardUpdateViewSet, basename="erpupdate")

urlpatterns = (
    path("", include(router.urls)),
    path('dashboard-counts', dashboard_counts, name="dashboard_counts"),
    path('dashboard-leave-today', today_leave_details, name="dashboard_leave_today"),
)
