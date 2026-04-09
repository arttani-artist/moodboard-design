function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function hexLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toL = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
}

function contrastColor(hex) {
  return hexLuminance(hex) > 0.35 ? '#1a1a18' : '#f4f1ec';
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

// ── slider handling ───────────────────────

function onSlider(valId, value) {
  document.getElementById(valId).textContent = value;
  if (document.getElementById('output').classList.contains('visible')) {
    generate();
  }
}

function getSliders() {
  return {
    dark:  parseInt(document.getElementById('darkSlider').value),
    warm:  parseInt(document.getElementById('warmSlider').value),
    bold:  parseInt(document.getElementById('boldSlider').value),
    play:  parseInt(document.getElementById('playSlider').value),
    sharp: parseInt(document.getElementById('sharpSlider').value),
    dens:  parseInt(document.getElementById('densSlider').value),
  };
}

function setSlider(sliderId, valId, value) {
  document.getElementById(sliderId).value = value;
  document.getElementById(valId).textContent = value;
}

// ── keyword parsing ───────────────────────

function parseKeywords(text) {
  const t = text.toLowerCase();

  const is = words => words.some(w => t.includes(w));

  if (is(['dark','moody','noir','night','deep','black','shadow','midnight','dim'])) setSlider('darkSlider','darkVal', 80);
  else if (is(['light','bright','white','airy','minimal','clean','fresh','pastel'])) setSlider('darkSlider','darkVal', 18);

  if (is(['warm','cozy','amber','autumn','golden','earthy','rust','coffee','terracotta','sand'])) setSlider('warmSlider','warmVal', 78);
  else if (is(['cool','cold','ice','blue','steel','clinical','navy','ocean','arctic'])) setSlider('warmSlider','warmVal', 18);

  if (is(['bold','loud','brutalist','strong','heavy','editorial','high contrast','vivid','intense'])) setSlider('boldSlider','boldVal', 82);
  else if (is(['soft','subtle','muted','pastel','gentle','delicate','quiet','whisper'])) setSlider('boldSlider','boldVal', 22);

  if (is(['playful','fun','colorful','bubbly','cute','cheerful','vibrant','energetic','whimsical'])) setSlider('playSlider','playVal', 80);
  else if (is(['serious','corporate','professional','formal','premium','luxury','refined','elegant','stately'])) setSlider('playSlider','playVal', 18);

  if (is(['sharp','angular','precise','brutalist','grid','geometric','structured'])) setSlider('sharpSlider','sharpVal', 82);
  else if (is(['round','bubbly','soft','pill','organic','fluid','flowing'])) setSlider('sharpSlider','sharpVal', 15);

  if (is(['dense','packed','busy','rich','layered','complex','detailed'])) setSlider('densSlider','densVal', 78);
  else if (is(['airy','spacious','minimal','breathe','open','whitespace','sparse'])) setSlider('densSlider','densVal', 18);
}

// ── system builder ────────────────────────

function buildSystem() {
  const s = getSliders();

  // base lightness: high dark value = low lightness
  const baseLight = clamp(100 - s.dark * 0.78, 8, 96);

  // hue: warm shifts to orange/amber (~30), cool shifts to blue (~210)
  const hue = s.warm > 50
    ? 30 + (s.warm - 50) * 0.5
    : 210 - (50 - s.warm) * 0.8;

  // saturation driven by boldness and playfulness
  const sat = clamp(10 + s.bold * 0.55 + s.play * 0.2, 5, 92);

  // accent hue shift: playful gets a bigger jump
  const accentHue = (hue + (s.play > 50 ? 55 + s.play * 0.4 : 28)) % 360;
  const accentSat = clamp(sat + 12, 30, 98);

  // colors
  const bg        = hslToHex(hue, clamp(sat * 0.08, 2, 12), baseLight);
  const surface   = hslToHex(hue, clamp(sat * 0.1,  2, 14), clamp(baseLight * 0.88, 7, 94));
  const neutral   = hslToHex(hue, clamp(sat * 0.15, 3, 20), clamp(baseLight * 0.78, 10, 88));
  const secondary = hslToHex(hue, clamp(sat * 0.45, 8, 60), clamp(baseLight * 0.65, 15, 80));
  const primary   = hslToHex(hue, clamp(sat,        20, 90), clamp(baseLight * 0.38, 8, 55));
  const accent    = hslToHex(accentHue, accentSat, clamp(45 + s.play * 0.12, 32, 65));

  // border radius: sharp = small radius, round = big
  const radius = s.sharp > 60
    ? clamp(10 - (s.sharp - 60) * 0.12, 2, 8)
    : clamp(4  + (60 - s.sharp) * 0.22, 4, 24);

  // spacing: airy = more space, dense = less
  const spacing = s.dens > 50
    ? clamp(24 - (s.dens - 50) * 0.2, 10, 24)
    : clamp(24 + (50 - s.dens) * 0.28, 24, 40);

  // font pairing selection
  const fontPairs = [
    { heading: "'Playfair Display'",  body: "'DM Sans'" },         // editorial, classic
    { heading: "'Bebas Neue'",         body: "'Source Sans 3'" },   // bold, industrial
    { heading: "'Fraunces'",           body: "'Nunito'" },          // warm, literary
    { heading: "'Space Mono'",         body: "'DM Sans'" },         // tech, brutalist
    { heading: "'Lilita One'",         body: "'Nunito'" },          // playful, loud
    { heading: "'Cormorant Garamond'", body: "'DM Sans'" },         // luxury, refined
    { heading: "'DM Serif Display'",   body: "'Source Sans 3'" },   // clean, modern serif
    { heading: "'Righteous'",          body: "'Nunito'" },          // retro, fun
  ];

  let fontIdx = 0;
  if (s.bold > 70 && s.play < 40)  fontIdx = 1; // brutalist bold
  else if (s.dark > 65 && s.play < 50) fontIdx = 5; // luxury dark
  else if (s.play > 72)             fontIdx = 4; // playful
  else if (s.sharp > 68)            fontIdx = 3; // tech/brutalist
  else if (s.warm > 65 && s.play > 40) fontIdx = 2; // warm literary
  else if (s.bold < 35 && s.dark < 40) fontIdx = 6; // clean minimal
  else if (s.play > 55 && s.warm > 45) fontIdx = 7; // retro fun
  else fontIdx = 0; // default editorial

  const fonts = fontPairs[fontIdx];

  // heading weight
  const headingWeight = s.bold > 65 ? 700 : s.bold < 30 ? 400 : 600;

  // letter spacing
  const letterSpacing = s.sharp > 60 ? '0.06em' : s.play > 60 ? '-0.01em' : '0em';

  return {
    bg, surface, neutral, secondary, primary, accent,
    radius: Math.round(radius),
    spacing: Math.round(spacing),
    fonts,
    headingWeight,
    letterSpacing,
    s,
  };
}

// gen

function generate() {
  const text = document.getElementById('moodInput').value.trim();
  if (text) parseKeywords(text);

  const sys = buildSystem();

  // show output
  const outputEl = document.getElementById('output');
  outputEl.classList.add('visible');

  // palette
  const swatches = [
    { color: sys.bg,        name: 'bg' },
    { color: sys.surface,   name: 'surface' },
    { color: sys.neutral,   name: 'neutral' },
    { color: sys.secondary, name: 'secondary' },
    { color: sys.primary,   name: 'primary' },
    { color: sys.accent,    name: 'accent' },
  ];

  document.getElementById('paletteRow').innerHTML = swatches.map(sw => {
    const tc = contrastColor(sw.color);
    return `
      <div class="swatch" style="background:${sw.color}" title="${sw.name}: ${sw.color}">
        <div class="swatch-label">
          <span class="swatch-name" style="color:${tc}">${sw.name}</span>
          <span class="swatch-hex" style="color:${tc}">${sw.color}</span>
        </div>
      </div>`;
  }).join('');

  // token
  const tokens = [
    { key: '📐 border radius',    val: sys.radius + 'px' },
    { key: '📏 base spacing',     val: sys.spacing + 'px' },
    { key: '🔠 heading font',     val: sys.fonts.heading.replace(/'/g, '') },
    { key: '📝 body font',        val: sys.fonts.body.replace(/'/g, '') },
    { key: '⚖️ heading weight',   val: sys.headingWeight },
    { key: '↔️ letter spacing',   val: sys.letterSpacing },
  ];

  document.getElementById('tokenGrid').innerHTML = tokens.map(t =>
    `<div class="token-card">
      <div class="token-key">${t.key}</div>
      <div class="token-val">${t.val}</div>
    </div>`
  ).join('');

  // preview
  const card = document.getElementById('previewCard');
  card.style.background    = sys.bg;
  card.style.borderColor   = sys.neutral;
  card.style.borderRadius  = sys.radius + 'px';
  card.style.padding       = sys.spacing + 'px ' + (sys.spacing * 1.4) + 'px';

  const eyebrow = document.getElementById('prevEyebrow');
  eyebrow.style.color      = sys.secondary;
  eyebrow.style.fontFamily = sys.fonts.body;

  const heading = document.getElementById('prevHeading');
  heading.style.color         = sys.primary;
  heading.style.fontFamily    = sys.fonts.heading + ', serif';
  heading.style.fontWeight    = sys.headingWeight;
  heading.style.letterSpacing = sys.letterSpacing;

  const body = document.getElementById('prevBody');
  body.style.color      = contrastColor(sys.bg) === '#1a1a18'
    ? 'rgba(26,26,24,0.6)'
    : 'rgba(244,241,236,0.6)';
  body.style.fontFamily = sys.fonts.body;

  [document.getElementById('prevTag1'), document.getElementById('prevTag2')].forEach(tag => {
    tag.style.background   = sys.secondary;
    tag.style.color        = contrastColor(sys.secondary);
    tag.style.fontFamily   = sys.fonts.body;
    tag.style.borderRadius = (sys.radius * 3) + 'px';
  });

  const btn = document.getElementById('prevBtn');
  btn.style.background   = sys.accent;
  btn.style.color        = contrastColor(sys.accent);
  btn.style.fontFamily   = sys.fonts.body;
  btn.style.fontWeight   = '600';
  btn.style.borderRadius = sys.radius + 'px';

  // css vars
  const css = `:root {
  --color-bg:        ${sys.bg};
  --color-surface:   ${sys.surface};
  --color-neutral:   ${sys.neutral};
  --color-secondary: ${sys.secondary};
  --color-primary:   ${sys.primary};
  --color-accent:    ${sys.accent};

  --radius:          ${sys.radius}px;
  --spacing:         ${sys.spacing}px;
  --spacing-lg:      ${sys.spacing * 2}px;
  --spacing-sm:      ${Math.round(sys.spacing * 0.5)}px;

  --font-heading:    ${sys.fonts.heading}, serif;
  --font-body:       ${sys.fonts.body}, sans-serif;
  --fw-heading:      ${sys.headingWeight};
  --ls-heading:      ${sys.letterSpacing};
}`;
  document.getElementById('cssBox').textContent = css;

  // tailwind config
  const tw = `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:        '${sys.bg}',
        surface:   '${sys.surface}',
        neutral:   '${sys.neutral}',
        secondary: '${sys.secondary}',
        primary:   '${sys.primary}',
        accent:    '${sys.accent}',
      },
      borderRadius: {
        DEFAULT: '${sys.radius}px',
      },
      spacing: {
        base: '${sys.spacing}px',
      },
      fontFamily: {
        heading: [${sys.fonts.heading}, 'serif'],
        body:    [${sys.fonts.body}, 'sans-serif'],
      },
    },
  },
}`;
  document.getElementById('twBox').textContent = tw;
}

// preset

function setPreset(text) {
  document.getElementById('moodInput').value = text;
  generate();
}

// copy

function copyCode(boxId, btnId) {
  const text = document.getElementById(boxId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(btnId);
    const orig = btn.textContent;
    btn.textContent = 'copied ✓';
    setTimeout(() => (btn.textContent = orig), 1800);
  });
}
