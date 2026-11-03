import { AUTHOR_URL, SOURCE_URL } from "../links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        {/* The requester's wording; rendered in capitals by CSS so assistive tech reads words, not letters. */}
        <p className="site-footer__notice">Unofficial. Not affiliated with Squeekchain.</p>
        <ul className="site-footer__links">
          <li>
            <a href={AUTHOR_URL}>Built by @naxweb3</a>
          </li>
          <li>
            <a href={SOURCE_URL}>Source code on GitHub</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
