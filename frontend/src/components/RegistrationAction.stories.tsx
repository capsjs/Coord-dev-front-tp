import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router";
import { expect, mocked } from "storybook/test";
import { demoAuth, demoUser } from "../../.storybook/fixtures";
import {
  getMyRegistrations,
  registerToEvent,
  unregisterFromEvent,
} from "../api/registrations";
import { AuthContext } from "../auth/authContext";
import type { Event } from "../types/event";
import type { Role } from "../types/user";
import { RegistrationAction } from "./RegistrationAction";

const day = 24 * 60 * 60 * 1_000;
const event: Event = {
  id: 42,
  title: "Atelier React",
  description: "Découvrir les composants React en équipe.",
  date: new Date(Date.now() + 7 * day).toISOString(),
  location: "Paris",
  price: 0,
  currency: "EUR",
  capacity: 20,
  remainingSeats: 5,
  organizerId: 2,
  organizer: { id: 2, name: "Sacha Bernard" },
};

const meta = {
  title: "Composants/Action d’inscription",
  component: RegistrationAction,
  args: { event },
  decorators: [
    (Story, { parameters }) => {
      const role: Role | undefined = parameters.role;
      return (
        <AuthContext.Provider value={demoAuth(role ? demoUser(role) : null)}>
          <MemoryRouter initialEntries={[`/events/${event.id}`]}>
            <Routes>
              <Route path="/events/:id" element={<Story />} />
              <Route path="/login" element={<h1>Connexion</h1>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    },
  ],
  beforeEach: () => {
    mocked(getMyRegistrations).mockResolvedValue([]);
    mocked(registerToEvent).mockImplementation(async (eventId) => ({
      eventId,
      userId: 1,
      createdAt: new Date().toISOString(),
    }));
    mocked(unregisterFromEvent).mockResolvedValue(undefined);
  },
} satisfies Meta<typeof RegistrationAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visiteur: Story = {};

export const ParticipantNonInscrit: Story = {
  parameters: { role: "participant" },
};

export const InscriptionConfirmee: Story = {
  ...ParticipantNonInscrit,
  name: "Inscription confirmée",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "S'inscrire" }),
    );
    await expect(await canvas.findByRole("status")).toHaveTextContent(
      "Inscription confirmée.",
    );
  },
};

export const ParticipantInscrit: Story = {
  parameters: { role: "participant" },
  beforeEach: () => {
    mocked(getMyRegistrations).mockResolvedValue([event]);
  },
};

export const DesinscriptionConfirmee: Story = {
  ...ParticipantInscrit,
  name: "Désinscription confirmée",
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "Se désinscrire" }),
    );
    await expect(await canvas.findByRole("status")).toHaveTextContent(
      "Désinscription confirmée.",
    );
  },
};

export const EvenementPasse: Story = {
  name: "Événement passé",
  args: { event: { ...event, date: new Date(Date.now() - day).toISOString() } },
};

export const Complet: Story = {
  parameters: { role: "participant" },
  args: { event: { ...event, remainingSeats: 0 } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Complet")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "S'inscrire" }),
    ).toBeNull();
  },
};

export const InscritSurEvenementComplet: Story = {
  name: "Inscrit sur un événement complet",
  parameters: { role: "participant" },
  args: { event: { ...event, remainingSeats: 0 } },
  beforeEach: () => {
    mocked(getMyRegistrations).mockResolvedValue([
      { ...event, remainingSeats: 0 },
    ]);
  },
};

export const Organisateur: Story = {
  name: "Organisateur (action masquée)",
  parameters: { role: "organizer" },
};

export const Chargement: Story = {
  parameters: { role: "participant" },
  beforeEach: () => {
    mocked(getMyRegistrations).mockReturnValue(new Promise(() => {}));
  },
};

export const ErreurDeVerification: Story = {
  name: "Erreur de vérification",
  parameters: { role: "participant" },
  beforeEach: () => {
    mocked(getMyRegistrations).mockRejectedValue(
      new Error("Impossible de vérifier votre inscription."),
    );
  },
};
