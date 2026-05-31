import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthPage from "./AuthPage";

describe("AuthPage", () => {
  it("renderiza formulario de inicio de sesión", () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });
});
