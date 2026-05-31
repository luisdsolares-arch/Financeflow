from collections import defaultdict


def build_financial_advice(total_income: float, total_expenses: float, categorized_expenses: dict[str, float]) -> list[dict]:
    tips: list[dict] = []

    expense_ratio = (total_expenses / total_income) if total_income > 0 else 1
    surplus_ratio = ((total_income - total_expenses) / total_income) if total_income > 0 else 0

    if expense_ratio > 0.7:
        highest = sorted(categorized_expenses.items(), key=lambda x: x[1], reverse=True)[:2]
        focus_categories = ", ".join(cat for cat, _ in highest) if highest else "gastos variables"
        tips.append(
            {
                "type": "risk_alert",
                "title": "Alerta de Riesgo Financiero",
                "message": (
                    "Tus gastos superan el 70% de tus ingresos mensuales. "
                    f"Prioriza recortes en: {focus_categories}."
                ),
                "actions": [
                    "Define topes semanales por categoria.",
                    "Pausa suscripciones de bajo uso durante 30 dias.",
                ],
            }
        )

    needs = categorized_expenses.get("Vivienda", 0) + categorized_expenses.get("Servicios", 0) + categorized_expenses.get("Transporte", 0)
    wants = categorized_expenses.get("Entretenimiento", 0) + categorized_expenses.get("Comida", 0)
    savings = max(total_income - total_expenses, 0)

    needs_pct = (needs / total_income * 100) if total_income else 0
    wants_pct = (wants / total_income * 100) if total_income else 0
    savings_pct = (savings / total_income * 100) if total_income else 0

    tips.append(
        {
            "type": "rule_50_30_20",
            "title": "Diagnostico 50/30/20",
            "message": (
                f"Necesidades: {needs_pct:.1f}% (objetivo 50%), "
                f"Deseos: {wants_pct:.1f}% (objetivo 30%), "
                f"Ahorro/Inversion: {savings_pct:.1f}% (objetivo 20%)."
            ),
            "actions": [
                "Si necesidades >50%, renegocia costos fijos.",
                "Si deseos >30%, reduce gastos discrecionales.",
                "Si ahorro <20%, automatiza transferencias a fondo de ahorro.",
            ],
        }
    )

    if surplus_ratio > 0.25:
        tips.append(
            {
                "type": "investment_flash",
                "title": "Flash de Conocimiento",
                "message": "Mantienes un superavit >25%. Considera fondo de emergencia de 3 a 6 meses y micro-ahorros automáticos.",
                "actions": [
                    "Crear subcuenta de emergencia.",
                    "Programar ahorro automatico semanal.",
                    "Evaluar instrumentos de bajo riesgo.",
                ],
            }
        )

    return tips


def aggregate_expenses_by_category(transactions: list) -> dict[str, float]:
    totals = defaultdict(float)
    for transaction in transactions:
        if transaction.type == "expense":
            totals[transaction.category] += abs(transaction.amount)
    return dict(totals)
