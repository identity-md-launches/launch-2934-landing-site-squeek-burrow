import type { Route } from "../router";
import { ROUTES } from "../router";
import { PixelSprite } from "./PixelSprite";
import { FAVICON_RECTS } from "../art/scene";

export function SiteHeader({ route }: { route: Route }) {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <a className="brand" href={ROUTES.home.hash} aria-current={route === "home" ? "page" : undefined}>
          <PixelSprite rects={FAVICON_RECTS} width={16} height={16} className="brand__mark" />
          <span>Squeek Burrow</span>
        </a>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li>
              <a href={ROUTES["how-to-play"].hash} aria-current={route === "how-to-play" ? "page" : undefined}>
                How to play
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
