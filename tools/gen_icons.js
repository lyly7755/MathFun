/* Build-time only, not shipped (see CLAUDE.md tools/ convention). Generates the
   PWA icon PNGs into icons/ from scratch - no image libraries are available in
   this environment, so this hand-rolls a minimal PNG encoder (zlib does the
   actual compression; we only need to be correct about chunk framing + CRC32).
   Run: node tools/gen_icons.js */
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var OUT = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

/* ---------- PNG encoding ---------- */
var CRC_TABLE = (function () {
  var t = [];
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  var typeBuf = Buffer.from(type, 'ascii');
  var len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  var sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGBA, no interlace
  var raw = Buffer.alloc((width * 4 + 1) * height);
  for (var y = 0; y < height; y++) {
    var rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  var idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- drawing helpers (2x supersampled for antialiasing) ---------- */
function inPolygon(x, y, pts) {
  var inside = false;
  for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
function starPoints(cx, cy, rOuter, rInner) {
  var pts = [];
  for (var i = 0; i < 10; i++) {
    var r = (i % 2 === 0) ? rOuter : rInner;
    var a = -Math.PI / 2 + i * Math.PI / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
function mix(a, b, t) { return a + (b - a) * t; }
function hex(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
var BG_TOP = hex('#241a15'), BG_BOTTOM = hex('#181210'), GOLD = hex('#ffd166'), GOLD_EDGE = hex('#c98f2e');

function renderIcon(size) {
  var ss = 2, W = size * ss, H = size * ss;
  var buf = Buffer.alloc(size * size * 4);
  var star = starPoints(W / 2, H / 2, W * 0.34, W * 0.34 * 0.5);
  for (var py = 0; py < size; py++) {
    for (var px = 0; px < size; px++) {
      var rSum = 0, gSum = 0, bSum = 0, hits = 0;
      for (var sy = 0; sy < ss; sy++) {
        for (var sx = 0; sx < ss; sx++) {
          var x = px * ss + sx + 0.5, y = py * ss + sy + 0.5;
          var bgT = y / H;
          var r = mix(BG_TOP[0], BG_BOTTOM[0], bgT), g = mix(BG_TOP[1], BG_BOTTOM[1], bgT), b = mix(BG_TOP[2], BG_BOTTOM[2], bgT);
          if (inPolygon(x, y, star)) {
            var edgeT = Math.min(1, (Math.hypot(x - W / 2, y - H / 2) / (W * 0.34)));
            r = mix(GOLD[0], GOLD_EDGE[0], edgeT); g = mix(GOLD[1], GOLD_EDGE[1], edgeT); b = mix(GOLD[2], GOLD_EDGE[2], edgeT);
          }
          rSum += r; gSum += g; bSum += b; hits++;
        }
      }
      var i = (py * size + px) * 4;
      buf[i] = Math.round(rSum / hits); buf[i + 1] = Math.round(gSum / hits); buf[i + 2] = Math.round(bSum / hits); buf[i + 3] = 255;
    }
  }
  return buf;
}

[192, 512].forEach(function (size) {
  var png = encodePNG(size, size, renderIcon(size));
  fs.writeFileSync(path.join(OUT, 'icon-' + size + '.png'), png);
  console.log('wrote icons/icon-' + size + '.png (' + png.length + ' bytes)');
});
var apple = encodePNG(180, 180, renderIcon(180));
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), apple);
console.log('wrote icons/apple-touch-icon.png (' + apple.length + ' bytes)');
