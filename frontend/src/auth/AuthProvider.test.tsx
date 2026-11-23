import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import { getMeRequest, loginRequest, registerRequest } from "../api/auth";
import { getToken, saveToken } from "../api/client";
import type { User } from "../types/user";

// On simule uniquement les requêtes API.
vi.mock("../api/auth", () => ({
  getMeRequest: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMeRequest);
const mockedLogin = vi.mocked(loginRequest);
const mockedRegister = vi.mocked(registerRequest);

const mockUser: User = {
  id: 1,
  name: "Jean Dupont",
  email: "jean@example.com",
  role: "organizer",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

const loginData = {
  email: "jean@example.com",
  password: "password123",
};

// Composant de test utilisant le vrai contexte.
function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{loading ? "Chargement" : "Prêt"}</p>

      <p data-testid="user">{user ? user.name : "Non connecté"}</p>

      <button onClick={() => void login(loginData)}>Connexion</button>

      <button
        onClick={() =>
          void register({
            name: "Jean Dupont",
            ...loginData,
            role: "organizer",
          })
        }
      >
        Inscription
      </button>

      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("démarre sans utilisateur si aucun token n'existe", () => {
    renderProvider();

    expect(screen.getByTestId("user")).toHaveTextContent("Non connecté");

    expect(screen.getByTestId("loading")).toHaveTextContent("Prêt");

    expect(mockedGetMe).not.toHaveBeenCalled();
  });

  it("connecte l'utilisateur et sauvegarde son token", async () => {
    mockedLogin.mockResolvedValue({
      token: "jwt-test",
      user: mockUser,
    });

    renderProvider();

    await act(async () => {
      screen.getByText("Connexion").click();
    });

    expect(mockedLogin).toHaveBeenCalledWith(loginData);

    expect(screen.getByTestId("user")).toHaveTextContent("Jean Dupont");

    expect(getToken()).toBe("jwt-test");
  });

  it("inscrit l'utilisateur et crée une session", async () => {
    mockedRegister.mockResolvedValue({
      token: "jwt-inscription",
      user: mockUser,
    });

    renderProvider();

    await act(async () => {
      screen.getByText("Inscription").click();
    });

    expect(mockedRegister).toHaveBeenCalledWith({
      name: "Jean Dupont",
      ...loginData,
      role: "organizer",
    });

    expect(screen.getByTestId("user")).toHaveTextContent("Jean Dupont");

    expect(getToken()).toBe("jwt-inscription");
  });

  it("déconnecte l'utilisateur et supprime son token", async () => {
    saveToken("jwt-test");
    mockedGetMe.mockResolvedValue(mockUser);

    renderProvider();

    await screen.findByText("Jean Dupont");

    act(() => {
      screen.getByText("Déconnexion").click();
    });

    expect(getToken()).toBeNull();

    expect(screen.getByTestId("user")).toHaveTextContent("Non connecté");
  });

  it("restaure la session avec un token valide", async () => {
    saveToken("jwt-existant");
    mockedGetMe.mockResolvedValue(mockUser);

    renderProvider();

    expect(screen.getByTestId("loading")).toHaveTextContent("Chargement");

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Jean Dupont");
    });

    expect(mockedGetMe).toHaveBeenCalledOnce();

    expect(screen.getByTestId("loading")).toHaveTextContent("Prêt");
  });

  it("supprime un token invalide", async () => {
    saveToken("jwt-expire");

    mockedGetMe.mockRejectedValue(new Error("Session expirée"));

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("Prêt");
    });

    expect(getToken()).toBeNull();

    expect(screen.getByTestId("user")).toHaveTextContent("Non connecté");
  });
});
