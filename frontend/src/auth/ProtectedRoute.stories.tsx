import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { demoAuth, demoUser } from "../../.storybook/fixtures";
import type { Role } from "../types/user";
import { AuthContext } from "./authContext";
import { ProtectedRoute } from "./ProtectedRoute";

function LoginDestination() {
  const location = useLocation();
  return (
    <>
      <h1>Connexion</h1>
      <p>Page demandée : {location.state?.from}</p>
    </>
  );
}

const meta = {
  title: "Composants/Route protégée",
  component: ProtectedRoute,
  args: { roles: ["organizer", "admin"] },
  decorators: [
    (Story, { parameters }) => {
      const role: Role | undefined = parameters.role;
      return (
        <AuthContext.Provider
          value={demoAuth(role ? demoUser(role) : null, parameters.loading)}
        >
          <MemoryRouter initialEntries={["/events/new"]}>
            <Routes>
              <Route element={<Story />}>
                <Route
                  path="/events/new"
                  element={<h1>Créer un événement</h1>}
                />
              </Route>
              <Route path="/login" element={<LoginDestination />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    },
  ],
} satisfies Meta<typeof ProtectedRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chargement: Story = { parameters: { loading: true } };
export const RedirectionConnexion: Story = {
  name: "Redirection vers la connexion",
};
export const AccesAutorise: Story = {
  name: "Accès autorisé",
  parameters: { role: "organizer" },
};
export const AccesRefuse: Story = {
  name: "Accès refusé",
  parameters: { role: "participant" },
};
