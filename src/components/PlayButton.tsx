import { GAME_URL } from "../links";

/** The site's one primary action. */
export function PlayButton() {
  return (
    <a className="button button--primary" href={GAME_URL}>
      Play Squeek Burrow
    </a>
  );
}
