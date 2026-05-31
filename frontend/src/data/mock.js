export const fallbackSummary = {
  net_balance: 14250.4,
  monthly_income: 4200,
  monthly_expenses: 2810,
  saving_capacity_pct: 33.1,
  expenses_by_category: {
    Vivienda: 1100,
    Comida: 450,
    Transporte: 320,
    Servicios: 510,
    Entretenimiento: 430,
  },
  recent_transactions: [
    { date: "2026-05-29", concept: "Nomina", category: "Salario", type: "income", amount: 3500 },
    { date: "2026-05-28", concept: "STARBUCKS COFFEE CA", category: "Comida", type: "expense", amount: 14.9 },
    { date: "2026-05-27", concept: "Renta apartamento", category: "Vivienda", type: "expense", amount: 1100 },
  ],
};

export const fallbackSuggestions = [
  {
    type: "risk_alert",
    title: "Alerta de Riesgo Financiero",
    message: "Tus gastos están cerca del umbral del 70%. Evalúa reducir suscripciones de bajo valor.",
    actions: ["Agrupa gastos hormiga", "Define un límite semanal para ocio"],
  },
  {
    type: "rule_50_30_20",
    title: "Diagnóstico 50/30/20",
    message: "Necesidades 52%, Deseos 31%, Ahorro 17%. Ajusta ocio en -3%.",
    actions: ["Baja gastos discrecionales", "Automatiza ahorro el día de pago"],
  },
];
