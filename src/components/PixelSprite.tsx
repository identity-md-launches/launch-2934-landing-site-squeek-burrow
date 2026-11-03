import type { Rect } from "../art/scene";

/** Small decorative sprite from the pixel model; colors come from the --px-* custom properties. */
export function PixelSprite({ rects, width, height, className }: { rects: Rect[]; width: number; height: number; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={`var(--px-${r.role})`} />
      ))}
    </svg>
  );
}
