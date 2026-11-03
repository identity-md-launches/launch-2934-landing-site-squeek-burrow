import { useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { HamsterState, Layer } from "../art/scene";
import { SCENE_H, SCENE_W, buildHamster, buildScene } from "../art/scene";

const SCENE_LAYERS = buildScene();

const STATES: Record<HamsterState, { label: string; speed: string; art: string }> = {
  running: {
    label: "Running",
    speed: "×3",
    art: "Pixel art: a hamster runs on a spinning wheel above its burrow.",
  },
  napping: {
    label: "Napping",
    speed: "×0.1",
    art: "Pixel art: the hamster naps in a still wheel under a dusk sky.",
  },
};

function LayerRects({ layer }: { layer: Layer }) {
  const style = layer.frame
    ? ({ "--frame": layer.frame.index, "--frames": layer.frame.count } as CSSProperties)
    : undefined;
  return (
    <g
      className={layer.frame ? `px-frame px-frame--${layer.frame.group}` : undefined}
      data-frame={layer.frame?.index}
      style={style}
    >
      {layer.rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={`var(--px-${r.role})`} />
      ))}
    </g>
  );
}

/**
 * The hero art plus a two-state preview of the wheel. It is a preview only:
 * the game itself reads the real wheel, this page does not.
 */
export function WheelScene() {
  const [state, setState] = useState<HamsterState>("running");
  const hamster = useMemo(() => buildHamster(state), [state]);
  const labelId = useId();

  return (
    <figure className="scene" data-state={state}>
      <svg
        className="scene__art"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={STATES[state].art}
      >
        {SCENE_LAYERS.map((layer) => (
          <LayerRects key={layer.id} layer={layer} />
        ))}
        {hamster.map((layer) => (
          <LayerRects key={`${state}-${layer.id}`} layer={layer} />
        ))}
      </svg>
      <figcaption className="scene__controls">
        <div className="scene__controls-head">
          <span id={labelId} className="scene__toggle-label">
            Preview the hamster
          </span>
          <p className="scene__speed" role="status">
            Burrow speed <strong className="scene__speed-value">{STATES[state].speed}</strong>
          </p>
        </div>
        <div className="segmented" role="group" aria-labelledby={labelId}>
          {(Object.keys(STATES) as HamsterState[]).map((key) => (
            <button
              key={key}
              type="button"
              className="segmented__option"
              aria-pressed={state === key}
              onClick={() => setState(key)}
            >
              {STATES[key].label}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
