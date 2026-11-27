import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { usePageTitle } from "../../src/hooks/usePageTitle";

describe("usePageTitle", () => {
  it("met le titre de la page suivi du nom de l'application", () => {
    renderHook(() => usePageTitle("Connexion"));

    expect(document.title).toBe("Connexion · Coord Events");
  });

  it("met à jour le titre quand il change", () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), {
      initialProps: { title: "Fiche de l'événement" },
    });

    rerender({ title: "Conférence React" });

    expect(document.title).toBe("Conférence React · Coord Events");
  });
});
