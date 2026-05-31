from datetime import date
from math import ceil

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    date: date
    description: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=80)
    type: str = Field(pattern="^(income|expense)$")
    is_automated: bool = False


class TransactionUpdate(BaseModel):
    amount: float
    date: date
    description: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=80)
    type: str = Field(pattern="^(income|expense)$")


class PlannedExpenseCreate(BaseModel):
    description: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=80)
    amount: float = Field(gt=0)
    due_date: date
    recurrence_type: str = Field(pattern="^(one_time|weekly|monthly)$")
    planning_mode: str = Field(pattern="^(weekly|monthly)$")
    reminder_days_before: int = Field(ge=1, le=60, default=7)


class PlannedExpenseUpdate(BaseModel):
    description: str = Field(min_length=2, max_length=255)
    category: str = Field(min_length=2, max_length=80)
    amount: float = Field(gt=0)
    due_date: date
    recurrence_type: str = Field(pattern="^(one_time|weekly|monthly)$")
    planning_mode: str = Field(pattern="^(weekly|monthly)$")
    reminder_days_before: int = Field(ge=1, le=60, default=7)
    is_active: bool = True


class PlannedExpenseResponse(BaseModel):
    id: int
    description: str
    category: str
    amount: float
    due_date: date
    recurrence_type: str
    planning_mode: str
    reminder_days_before: int
    is_active: bool
    days_until_due: int
    recommended_weekly_saving: float
    recommended_monthly_saving: float


class FinancialGoalCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0, default=0)
    target_date: date
    priority: str = Field(pattern="^(low|medium|high)$", default="medium")


class FinancialGoalUpdate(BaseModel):
    current_amount: float = Field(ge=0)
    is_active: bool = True


class FinancialGoalEdit(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0, default=0)
    target_date: date
    priority: str = Field(pattern="^(low|medium|high)$", default="medium")
    is_active: bool = True


class BudgetCreate(BaseModel):
    category: str
    limit_amount: float = Field(gt=0)
    month_year: str = Field(pattern=r"^\d{4}-\d{2}$")


class BankAuthRequest(BaseModel):
    public_token: str
    institution_name: str
    account_type: str
    last_four: str = Field(min_length=4, max_length=4)


class WebhookEvent(BaseModel):
    event_type: str
    user_id: int
    account_id: int
    provider_payload: dict


class AutoPaymentCreate(BaseModel):
    account_id: int
    name: str = Field(min_length=2, max_length=120)
    amount: float = Field(gt=0)
    max_amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=80)
    day_of_month: int = Field(ge=1, le=28)
    reminder_days_before: int = Field(ge=1, le=10, default=3)
    description_template: str = Field(min_length=2, max_length=255)


class AutoPaymentToggle(BaseModel):
    is_active: bool


class NotificationRead(BaseModel):
    is_read: bool = True


class UserSettingsPayload(BaseModel):
    profile_name: str = Field(min_length=2, max_length=120)
    profile_email: str = Field(min_length=5, max_length=255)
    currency: str = Field(min_length=3, max_length=10)
    monthly_savings_goal: float = Field(ge=0, le=100)
    weekly_budget_alert_threshold: float = Field(ge=0, le=100)
    require_2fa_for_sensitive_actions: bool
    notify_email: bool
    notify_push: bool
    notify_payment_reminders: bool
    auto_sync_bank_daily: bool
    payment_assistant_enabled: bool
    default_payment_limit: float = Field(ge=0)
    dark_mode: bool


class UserSettingsResponse(UserSettingsPayload):
    user_id: int
