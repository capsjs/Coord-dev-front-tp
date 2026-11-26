import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { demoAuth, demoUser } from "../../.storybook/fixtures";
import { AuthContext } from "../auth/authContext";
import type { User } from "../types/user";
import { Layout } from "./Layout";

const meta = {
  title: "Composants/Structure de page",
  component: Layout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

function LayoutScenario({ initialUser }: { initialUser: User | null }) {
  const [user, setUser] = useState(initialUser);

  return (
    <AuthContext.Provider
      value={{ ...demoAuth(user), logout: () => setUser(null) }}
    >
      <MemoryRouter initialEntries={["/events"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<h1>Accueil</h1>} />
            <Route path="/events" element={<h1>Événements</h1>} />
            <Route path="/login" element={<h1>Connexion</h1>} />
            <Route path="/register" element={<h1>Inscription</h1>} />
            <Route path="/profile" element={<h1>Mon profil</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

export const Visiteur: Story = {
  render: () => <LayoutScenario initialUser={null} />,
};
export const OrganisateurConnecte: Story = {
  name: "Organisateur connecté",
  render: () => <LayoutScenario initialUser={demoUser("organizer")} />,
};
