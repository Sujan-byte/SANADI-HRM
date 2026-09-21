# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hrm_main.views import (EmployeeMonthlySalaryViewSet, SalaryIncrementViewSet,
                       GratuityEmployeeFormViewSet, GratuityViewSet, CareerLetterViewSet,
                       AdvanceViewSet, BonusViewSet, SalaryCalculationViewSet, SalaryHoldViewSet,
                       OTSalaryCalculationViewSet, AttendanceImportViewSet, FinalSettlementViewSet,
                       TaDaViewSet, TravelPlanningViewSet, TravelPlanningLogViewSet,
                       AttendanceStatusMasterViewSet, GraceDetailsViewSet, DisciplinaryActionViewSet, ExpenseClaimCategoryViewSet, ExpenseClaimLinkTypeViewSet, ExpenseClaimViewSet, ExpenseClaimLineViewSet, ExpenseClaimAttachmentViewSet,
                       PettyCashFundViewSet, PettyCashTransactionViewSet,)
from rest_framework.routers import DefaultRouter
from .. import views
from ..attendance_detail_views import AttendanceDetailsViewSet, HistoricalAttendanceDetailsViewSet

router = DefaultRouter()
router.register(r"employeeMonthlySalary", EmployeeMonthlySalaryViewSet)
router.register(r"salaryIncrement", SalaryIncrementViewSet)
router.register(r"careerLetter", CareerLetterViewSet)
router.register(r"advance", AdvanceViewSet)
router.register(r"bonus", BonusViewSet)
router.register(r"gratuity", GratuityViewSet)
router.register(r"gratuityEmployeeFrom", GratuityEmployeeFormViewSet)
router.register(r"salaryCalculation", SalaryCalculationViewSet)
router.register(r"salaryHold", SalaryHoldViewSet)
router.register(r"otSalaryCalculation", OTSalaryCalculationViewSet)
router.register(r"attendanceImport", AttendanceImportViewSet)
router.register(r"attendanceDetails", AttendanceDetailsViewSet)
router.register(r"finalSettlement", FinalSettlementViewSet)
router.register(r"taDa", TaDaViewSet)
router.register(r"travel-planning", TravelPlanningViewSet)
router.register(r"travel-planning-log", TravelPlanningLogViewSet)
router.register(r"attendance_status_master", AttendanceStatusMasterViewSet)
router.register(r"historical_attendance_details", HistoricalAttendanceDetailsViewSet)
router.register(r"grace-details", GraceDetailsViewSet)
router.register(r"disciplinary-action", DisciplinaryActionViewSet)

# Expense Claim
router.register(
    r"expense-claim-categories",
    ExpenseClaimCategoryViewSet,
    basename="expense-claim-categories"
)

router.register(
    r"expense-claim-link-types",
    ExpenseClaimLinkTypeViewSet,
    basename="expense-claim-link-types"
)

router.register(
    r"expense-claims",
    ExpenseClaimViewSet,
    basename="expense-claims"
)

router.register(
    r"expense-claim-lines",
    ExpenseClaimLineViewSet,
    basename="expense-claim-lines"
)

router.register(
    r"expense-claim-attachments",
    ExpenseClaimAttachmentViewSet,
    basename="expense-claim-attachments"
)

# Petty Cash
router.register(
    r"petty-cash-funds",
    PettyCashFundViewSet,
    basename="petty-cash-funds"
)

router.register(
    r"petty-cash-transactions",
    PettyCashTransactionViewSet,
    basename="petty-cash-transactions"
)

urlpatterns = [
    path('', include(router.urls)),
    path('payslip_list/', views.payslip_list, name='payslip_list'),
    path('payslip_zip/', views.payslip_zip, name='payslip_zip'),
    # path('sanadi_info/', views.sanadi_notification, name='sanadi_info'),

]
