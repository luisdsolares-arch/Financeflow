from fastapi import APIRouter

from app.api.v1 import (
	routes_auth,
	routes_bank,
	routes_budget,
	routes_dashboard,
	routes_payments,
	routes_settings,
	routes_suggestions,
	routes_transactions,
)


api_router = APIRouter()
api_router.include_router(routes_auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(routes_dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(routes_transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(routes_budget.router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(routes_suggestions.router, prefix="/suggestions", tags=["Suggestions"])
api_router.include_router(routes_bank.router, prefix="/bank", tags=["Open Banking"])
api_router.include_router(routes_payments.router, prefix="/payments", tags=["Payments Assistant"])
api_router.include_router(routes_settings.router, prefix="/settings", tags=["Settings"])
