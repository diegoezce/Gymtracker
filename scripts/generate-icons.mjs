// Genera los íconos PWA como PNG crudo (sin dependencias de imagen).
// Dibuja una barra con discos, estilo "hierro", sobre el fondo de la app.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const FONDO = [0x14, 0x12, 0x0f];
const SODIO = [0xff, 0xb6, 0x27];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = chunk("IDAT", deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function setPixel(rgba, width, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= width) return;
  const i = (y * width + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function fillRect(rgba, width, x0, y0, x1, y1, color) {
  for (let y = Math.max(0, y0); y < y1; y++) {
    for (let x = Math.max(0, x0); x < x1; x++) {
      setPixel(rgba, width, x, y, color);
    }
  }
}

function drawBarbell(size, { padding = 0 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  fillRect(rgba, size, 0, 0, size, size, FONDO);

  const usable = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;

  const barH = usable * 0.09;
  const barX0 = padding + usable * 0.16;
  const barX1 = padding + usable * 0.84;
  fillRect(rgba, size, barX0, cy - barH / 2, barX1, cy + barH / 2, SODIO);

  const plateW = usable * 0.1;
  const plateH = usable * 0.5;
  fillRect(rgba, size, padding + usable * 0.1, cy - plateH / 2, padding + usable * 0.1 + plateW, cy + plateH / 2, SODIO);
  fillRect(rgba, size, padding + usable * 0.9 - plateW, cy - plateH / 2, padding + usable * 0.9, cy + plateH / 2, SODIO);

  const collarW = usable * 0.035;
  const collarH = usable * 0.3;
  fillRect(rgba, size, padding + usable * 0.1 + plateW, cy - collarH / 2, padding + usable * 0.1 + plateW + collarW, cy + collarH / 2, SODIO);
  fillRect(rgba, size, padding + usable * 0.9 - plateW - collarW, cy - collarH / 2, padding + usable * 0.9 - plateW, cy + collarH / 2, SODIO);

  return rgba;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [192, 512]) {
  const rgba = drawBarbell(size);
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), encodePNG(size, size, rgba));
}

// Maskable: más padding para respetar el área segura del sistema.
const maskable = drawBarbell(512, { padding: 512 * 0.14 });
writeFileSync(join(OUT_DIR, "icon-maskable-512.png"), encodePNG(512, 512, maskable));

console.log("Íconos generados en", OUT_DIR);
