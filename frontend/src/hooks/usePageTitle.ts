import { useEffect } from "react";

const APP_NAME = "Coord Events";

// Titre de l'onglet propre à chaque page (WCAG 2.4.2) : c'est la première
// chose qu'annonce un lecteur d'écran après un changement de page
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
