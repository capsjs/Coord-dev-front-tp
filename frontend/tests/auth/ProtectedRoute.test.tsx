import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { ProtectedRoute } from "../../src/auth/ProtectedRoute";
import { useAuth } from "../../src/auth/useAuth";
import type { AuthContextValue } from "../../src/auth/authContext";
import type { User } from "../../src/types/user";

vi.mock("../../src/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const mockUser: User = {
  id: 1,
  name: "Jean Dupont",
  email: "jean@example.com",
  role: "organizer",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

// Permet de changer la session pour chaque test
function mockAuth(user: User | null, loading = false) {
  const auth: AuthContextValue = {
    user,
    loading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };

  mockedUseAuth.mockReturnValue(auth);
}

function renderProtectedRoute(roles?: Array<User["role"]>) {
  return render(
    <MemoryRouter initialEntries={["/events/new"]}>
      <Routes>
        <Route path="/login" element={<p>Page de connexion</p>} />

        <Route element={<ProtectedRoute roles={roles} />}>
          <Route path="/events/new" element={<p>Formulaire de création</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le chargement pendant la vérification de session", () => {
    mockAuth(null, true);

    renderProtectedRoute();

    expect(screen.getByText("Chargement…")).toBeInTheDocument();

    expect(
      screen.queryByText("Formulaire de création"),
    ).not.toBeInTheDocument();
  });

  it("redirige un visiteur vers la connexion", async () => {
    mockAuth(null);

    renderProtectedRoute();

    expect(await screen.findByText("Page de connexion")).toBeInTheDocument();

    expect(
      screen.queryByText("Formulaire de création"),
    ).not.toBeInTheDocument();
  });

  it("autorise un utilisateur connecté", () => {
    mockAuth(mockUser);

    renderProtectedRoute();

    expect(screen.getByText("Formulaire de création")).toBeInTheDocument();
  });

  it("refuse l'accès si le rôle n'est pas autorisé", () => {
    mockAuth({
      ...mockUser,
      role: "participant",
    });

    renderProtectedRoute(["organizer", "admin"]);

    expect(
      screen.getByText("Vous n'avez pas accès à cette page."),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Formulaire de création"),
    ).not.toBeInTheDocument();
  });

  it("autorise l'accès si le rôle correspond", () => {
    mockAuth({
      ...mockUser,
      role: "organizer",
    });

    renderProtectedRoute(["organizer", "admin"]);

    expect(screen.getByText("Formulaire de création")).toBeInTheDocument();
  });
});
