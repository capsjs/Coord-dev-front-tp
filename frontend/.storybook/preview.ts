import type { Preview } from "@storybook/react-vite";
import { sb } from "storybook/test";
import "../src/index.css";

sb.mock(import("../src/api/registrations.ts"));

const preview: Preview = {
  parameters: {
    layout: "centered",
  },
};

export default preview;
