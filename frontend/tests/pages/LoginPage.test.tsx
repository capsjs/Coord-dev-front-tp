import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { LoginPage } from "../../src/pages/LoginPage";
import { useAuth } from "../../src/auth/useAuth";
import { ApiError } from "../../src/api/client";

vi.mock("../../src/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const loginMock = vi.fn();

function renderPage(
  initialEntry:
    | string
    | {
        pathname: string;
        state: { from: string };
      } = "/login",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/events" element={<p>Liste des événements</p>} />
        <Route path="/profile" element={<p>Profil utilisateur</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillForm() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "jean@example.com" },
  });

  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "password123" },
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue(undefined);

    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: loginMock,
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("affiche le formulaire de connexion", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Connexion" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Se connecter" }),
    ).toBeInTheDocument();
  });

  it("connecte l'utilisateur et redirige vers les événements", async () => {
    renderPage();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "jean@example.com",
        password: "password123",
      });
    });

    expect(await screen.findByText("Liste des événements")).toBeInTheDocument();
  });

  it("redirige vers la page initialement demandée", async () => {
    renderPage({
      pathname: "/login",
      state: { from: "/profile" },
    });

    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Profil utilisateur")).toBeInTheDocument();
  });

  it("affiche le message d'erreur de l'API", async () => {
    loginMock.mockRejectedValue(new ApiError(401, "Identifiants incorrects"));

    renderPage();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Identifiants incorrects",
    );

    expect(
      screen.getByRole("heading", { name: "Connexion" }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur générique en cas d'erreur inattendue", async () => {
    loginMock.mockRejectedValue(new Error("Erreur inconnue"));

    renderPage();
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Une erreur est survenue",
    );
  });
});
