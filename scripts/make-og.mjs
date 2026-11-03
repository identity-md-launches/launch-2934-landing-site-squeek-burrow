// Draws public/og-image.png (1200 x 630) and public/favicon.svg from the same pixel model the hero uses.
// No dependencies: Node 24 strips the types from src/art/scene.ts, and the PNG is encoded with zlib.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildScene, buildHamster, PALETTE, SCENE_W, SCENE_H, FAVICON_RECTS } from "../src/art/scene.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

const W = 1200, H = 630;
const px = new Uint8Array(W * H * 3);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const fill = (x, y, w, h, hex) => {
  const [r, g, b] = rgb(hex);
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++)
    for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
};

// Scene, scaled 8x, at the right; the background extends its sky bands and soil to the left edge.
const S = 8, ox = W - SCENE_W * S - 24, oy = H - SCENE_H * S;
fill(0, 0, W, oy + 16 * S, PALETTE.sky1);
fill(0, oy + 16 * S, W, 16 * S, PALETTE.sky2);
fill(0, oy + 32 * S, W, 14 * S, PALETTE.sky3);
fill(0, oy + 46 * S, W, H, PALETTE.soil);
fill(0, oy + 46 * S, W, 2 * S, PALETTE.grass);
fill(0, oy + 60 * S, W, H, PALETTE.soilDark);
const layers = [...buildScene(), ...buildHamster("running")].filter((l) => !l.frame || l.frame.index === 0);
for (const layer of layers) for (const r of layer.rects) fill(ox + r.x * S, oy + r.y * S, r.w * S, r.h * S, PALETTE[r.role]);

// Title in a 5 x 7 bitmap font.
const FONT = {
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
};
const text = (str, x, y, s, hex, shadow) => {
  let cx = x;
  for (const ch of str) {
    const g = FONT[ch];
    g.forEach((row, ry) => [...row].forEach((bit, rx) => {
      if (bit !== "1") return;
      if (shadow) fill(cx + rx * s + s / 2, y + ry * s + s / 2, s, s, shadow);
      fill(cx + rx * s, y + ry * s, s, s, hex);
    }));
    cx += 6 * s;
  }
};
text("SQUEEK", 64, 150, 12, PALETTE.outline);
text("BURROW", 64, 260, 12, PALETTE.wood);

// PNG encoding.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(join(pub, "og-image.png"), png);

// Favicon: hamster head on a sky tile.
const favicon = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`,
  `<rect width="16" height="16" rx="2" fill="${PALETTE.sky3}"/>`,
  ...FAVICON_RECTS.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${PALETTE[r.role]}"/>`),
  `</svg>`,
].join("");
writeFileSync(join(pub, "favicon.svg"), `${favicon}\n`);
console.log(`og-image.png ${png.length} bytes, favicon.svg ${favicon.length} bytes`);
