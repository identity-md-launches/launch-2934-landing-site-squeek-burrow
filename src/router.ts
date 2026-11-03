import { useEffect, useState } from "react";

// Hash routing: the export is static, so there is no server to rewrite /how-to-play.
export type Route = "home" | "how-to-play";

export const ROUTES: Record<Route, { hash: string; title: string }> = {
  home: { hash: "#/", title: "Squeek Burrow: an idle game on hamster power" },
  "how-to-play": { hash: "#/how-to-play", title: "How to play Squeek Burrow" },
};

export function parseRoute(hash: string): Route | null {
  if (hash === "" || hash === "#" || hash === "#/") return "home";
  if (hash === "#/how-to-play" || hash === "#/how-to-play/") return "how-to-play";
  // Other "#/..." paths fall back to home; plain anchors such as #main are not routes.
  return hash.startsWith("#/") ? "home" : null;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash) ?? "home");
  useEffect(() => {
    const onHash = () => {
      const next = parseRoute(window.location.hash);
      if (next) setRoute(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}
