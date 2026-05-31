import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SuggestionsPage from "./SuggestionsPage";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(() =>
      Promise.resolve({
        data: {
          advice: [
            {
              type: "risk_alert",
              title: "Alerta de Riesgo Financiero",
              message: "Tus gastos superan el 70% de tus ingresos.",
              actions: ["Recorta entretenimiento"],
            },
          ],
        },
      })
    ),
  },
}));

describe("SuggestionsPage", () => {
  it("renderiza tarjetas de consejos desde API", async () => {
    render(
      <BrowserRouter>
        <SuggestionsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/alerta de riesgo financiero/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/recorta entretenimiento|baja gastos discrecionales/i)).toBeInTheDocument();
  });
});
