import { PlayButton } from "../components/PlayButton";

const STEPS = [
  {
    title: "Forage seeds",
    body: "Tap Forage, or press Space, to gather seeds by hand. Cheek pouches make every forage bigger.",
  },
  {
    title: "Buy chambers",
    body: "Spend seeds on chambers that gather for you. Each one unlocks the next, and prices rise 15% per purchase.",
  },
  {
    title: "Catch golden seeds",
    body: "Now and then a golden seed floats across the sky. Catch it for about 45 seconds of production at once.",
  },
  {
    title: "Hibernate",
    body: "After 50,000 seeds in one run, hibernate to start over with a permanent +10% production per dream seed.",
  },
];

const QUESTS = [
  {
    title: "Community goal",
    body: "Every player watches the same wheel counter. When it passes a goal while you have the game open, you earn seeds.",
  },
  {
    title: "Running or napping forecast",
    body: "Guess whether the hamster will be running or napping in 5 minutes. A right guess pays seeds, double if you called a change.",
  },
];

export function HowToPlayPage() {
  return (
    <>
      <section className="page-intro" aria-labelledby="how-title">
        <div className="wrap">
          <h1 id="how-title" tabIndex={-1}>
            How to play
          </h1>
          <p className="lead">Four steps take you from an empty burrow to your first permanent bonus.</p>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step__number" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band--soil" aria-labelledby="quests-title">
        <div className="wrap">
          <h2 id="quests-title">Two wheel quests</h2>
          <p className="band__lead">Both quests follow the live wheel and pause when its data cannot be reached.</p>
          <ul className="fact-grid fact-grid--two">
            {QUESTS.map((quest) => (
              <li key={quest.title} className="fact">
                <h3>{quest.title}</h3>
                <p>{quest.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="closing" aria-label="Start playing">
        <div className="wrap closing__inner">
          <p className="closing__text">Your burrow is waiting.</p>
          <PlayButton />
        </div>
      </section>
    </>
  );
}
