import { ROUTES } from "../router";
import { PlayButton } from "../components/PlayButton";
import { WheelScene } from "../components/WheelScene";

const WHEEL_FACTS = [
  {
    title: "Hamster running",
    body: "Every chamber in your burrow produces three times as fast.",
  },
  {
    title: "Hamster napping",
    body: "Production drops to a tenth until the hamster wakes up.",
  },
  {
    title: "You are away",
    body: "Chambers keep earning at base speed for up to 8 hours.",
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero__inner">
          <div className="hero__copy">
            <h1 id="hero-title" tabIndex={-1}>
              Dig while the hamster runs
            </h1>
            <p className="lead">
              An idle game whose burrow runs at triple speed when the real Squeekchain hamster runs on its wheel, and
              slows when it naps.
            </p>
            <div className="actions">
              <PlayButton />
              <a className="text-link" href={ROUTES["how-to-play"].hash}>
                How to play
              </a>
            </div>
            <p className="note">Free in your browser. No wallet or sign-up; progress saves on your device.</p>
          </div>
          <WheelScene />
        </div>
      </section>

      <section className="band band--soil" aria-labelledby="wheel-title">
        <div className="wrap">
          <h2 id="wheel-title">One real wheel sets the pace</h2>
          <ul className="fact-grid">
            {WHEEL_FACTS.map((fact) => (
              <li key={fact.title} className="fact">
                <h3>{fact.title}</h3>
                <p>{fact.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
