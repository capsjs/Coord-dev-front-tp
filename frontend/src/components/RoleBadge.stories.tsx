import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoleBadge } from "./RoleBadge";

const meta = {
  title: "Composants/Badge de rôle",
  component: RoleBadge,
  argTypes: {
    role: {
      control: "select",
      options: ["admin", "organizer", "participant"],
    },
  },
} satisfies Meta<typeof RoleBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Administrateur: Story = { args: { role: "admin" } };
export const Organisateur: Story = { args: { role: "organizer" } };
export const Participant: Story = { args: { role: "participant" } };
