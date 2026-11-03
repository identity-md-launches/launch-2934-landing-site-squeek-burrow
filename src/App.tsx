import { useEffect, useRef } from "react";
import { ROUTES, useRoute } from "./router";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { HomePage } from "./pages/HomePage";
import { HowToPlayPage } from "./pages/HowToPlayPage";

export function App() {
  const route = useRoute();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = ROUTES[route].title;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // A route change is a new page: start at the top and move focus to its heading.
    window.scrollTo(0, 0);
    mainRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [route]);

  const skipToMain = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#main" onClick={skipToMain}>
        Skip to content
      </a>
      <SiteHeader route={route} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        {route === "home" ? <HomePage /> : <HowToPlayPage />}
      </main>
      <SiteFooter />
    </>
  );
}
