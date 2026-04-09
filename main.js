
document.addEventListener('DOMContentLoaded', function () {

  var moodInput  = document.getElementById('moodInput');
  var genBtn     = document.getElementById('genBtn');
  var output     = document.getElementById('output');
  var copyCSS    = document.getElementById('copyCSS');
  var copyTW     = document.getElementById('copyTW');

  var sliders = {
    dark:  { range: document.getElementById('darkSlider'),  val: document.getElementById('darkVal')  },
    warm:  { range: document.getElementById('warmSlider'),  val: document.getElementById('warmVal')  },
    bold:  { range: document.getElementById('boldSlider'),  val: document.getElementById('boldVal')  },
    play:  { range: document.getElementById('playSlider'),  val: document.getElementById('playVal')  },
    sharp: { range: document.getElementById('sharpSlider'), val: document.getElementById('sharpVal') },
    dens:  { range: document.getElementById('densSlider'),  val: document.getElementById('densVal')  },
  };

  Object.keys(sliders).forEach(function (key) {
    sliders[key].range.addEventListener('input', function () {
      sliders[key].val.textContent = this.value;
      if (output.classList.contains('visible')) {
        generate();
      }
    });
  });

  genBtn.addEventListener('click', function () {
    generate();
  });

  moodInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') generate();
  });

  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var preset = this.getAttribute('data-preset');
      moodInput.value = preset;
      generate();
    });
  });

  copyCSS.addEventListener('click', function () {
    copyCode('cssBox', copyCSS);
  });
  copyTW.addEventListener('click', function () {
    copyCode('twBox', copyTW);
  });



  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) {
      var k = (n + h / 30) % 12;
      var c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * c).toString(16).padStart(2, '0');
    }
    return '#' + f(0) + f(8) + f(4);
  }

  function hexLuminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    function toL(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
  }

  function contrastColor(hex) {
    return hexLuminance(hex) > 0.35 ? '#1a1a18' : '#f4f1ec';
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function getVal(key) {
    return parseInt(sliders[key].range.value);
  }

  function setSlider(key, value) {
    sliders[key].range.value = value;
    sliders[key].val.textContent = value;
  }



  function parseKeywords(text) {
    var t = text.toLowerCase();
    function is(words) { return words.some(function (w) { return t.indexOf(w) !== -1; }); }

    if      (is(['dark','moody','noir','night','deep','black','shadow','midnight'])) setSlider('dark', 80);
    else if (is(['light','bright','white','airy','minimal','clean','fresh','pastel'])) setSlider('dark', 18);

    if      (is(['warm','cozy','amber','autumn','golden','earthy','rust','coffee','terracotta'])) setSlider('warm', 78);
    else if (is(['cool','cold','ice','blue','steel','clinical','navy','ocean','arctic'])) setSlider('warm', 18);

    if      (is(['bold','loud','brutalist','strong','heavy','editorial','high contrast','vivid'])) setSlider('bold', 82);
    else if (is(['soft','subtle','muted','pastel','gentle','delicate','quiet'])) setSlider('bold', 22);

    if      (is(['playful','fun','colorful','bubbly','cute','cheerful','vibrant','energetic'])) setSlider('play', 80);
    else if (is(['serious','corporate','professional','formal','luxury','refined','elegant'])) setSlider('play', 18);

    if      (is(['sharp','angular','brutalist','grid','geometric','structured','precise'])) setSlider('sharp', 82);
    else if (is(['round','bubbly','pill','organic','fluid','flowing'])) setSlider('sharp', 15);

    if      (is(['dense','packed','busy','rich','layered','complex'])) setSlider('dens', 78);
    else if (is(['airy','spacious','minimal','open','whitespace','sparse'])) setSlider('dens', 18);
  }


  function buildSystem() {
    var dark  = getVal('dark');
    var warm  = getVal('warm');
    var bold  = getVal('bold');
    var play  = getVal('play');
    var sharp = getVal('sharp');
    var dens  = getVal('dens');

    var baseLight = clamp(100 - dark * 0.78, 8, 96);
    var hue = warm > 50 ? 30 + (warm - 50) * 0.5 : 210 - (50 - warm) * 0.8;
    var sat = clamp(10 + bold * 0.55 + play * 0.2, 5, 92);
    var accentHue = (hue + (play > 50 ? 55 + play * 0.4 : 28)) % 360;
    var accentSat = clamp(sat + 12, 30, 98);

    var bg        = hslToHex(hue, clamp(sat * 0.08, 2, 12),   baseLight);
    var surface   = hslToHex(hue, clamp(sat * 0.10, 2, 14),   clamp(baseLight * 0.88, 7, 94));
    var neutral   = hslToHex(hue, clamp(sat * 0.15, 3, 20),   clamp(baseLight * 0.78, 10, 88));
    var secondary = hslToHex(hue, clamp(sat * 0.45, 8, 60),   clamp(baseLight * 0.65, 15, 80));
    var primary   = hslToHex(hue, clamp(sat,         20, 90), clamp(baseLight * 0.38, 8, 55));
    var accent    = hslToHex(accentHue, accentSat,             clamp(45 + play * 0.12, 32, 65));

    var radius  = sharp > 60 ? clamp(10 - (sharp - 60) * 0.12, 2, 8) : clamp(4 + (60 - sharp) * 0.22, 4, 24);
    var spacing = dens > 50  ? clamp(24 - (dens - 50) * 0.2, 10, 24) : clamp(24 + (50 - dens) * 0.28, 24, 40);

    var fontPairs = [
      { heading: "'Playfair Display'",   body: "'DM Sans'" },
      { heading: "'Bebas Neue'",          body: "'Source Sans 3'" },
      { heading: "'Fraunces'",            body: "'Nunito'" },
      { heading: "'Space Mono'",          body: "'DM Sans'" },
      { heading: "'Lilita One'",          body: "'Nunito'" },
      { heading: "'Cormorant Garamond'",  body: "'DM Sans'" },
      { heading: "'DM Serif Display'",    body: "'Source Sans 3'" },
      { heading: "'Righteous'",           body: "'Nunito'" },
    ];

    var fontIdx = 0;
    if      (bold > 70 && play < 40)  fontIdx = 1;
    else if (dark > 65 && play < 50)  fontIdx = 5;
    else if (play > 72)               fontIdx = 4;
    else if (sharp > 68)              fontIdx = 3;
    else if (warm > 65 && play > 40)  fontIdx = 2;
    else if (bold < 35 && dark < 40)  fontIdx = 6;
    else if (play > 55 && warm > 45)  fontIdx = 7;

    var headingWeight  = bold > 65 ? 700 : bold < 30 ? 400 : 600;
    var letterSpacing  = sharp > 60 ? '0.06em' : play > 60 ? '-0.01em' : '0em';

    return {
      bg: bg, surface: surface, neutral: neutral,
      secondary: secondary, primary: primary, accent: accent,
      radius: Math.round(radius),
      spacing: Math.round(spacing),
      fonts: fontPairs[fontIdx],
      headingWeight: headingWeight,
      letterSpacing: letterSpacing,
    };
  }



  function generate() {
    var text = moodInput.value.trim();
    if (text) parseKeywords(text);

    var sys = buildSystem();

    output.classList.add('visible');

    // palette
    var swatches = [
      { color: sys.bg,        name: 'bg' },
      { color: sys.surface,   name: 'surface' },
      { color: sys.neutral,   name: 'neutral' },
      { color: sys.secondary, name: 'secondary' },
      { color: sys.primary,   name: 'primary' },
      { color: sys.accent,    name: 'accent' },
    ];

    document.getElementById('paletteRow').innerHTML = swatches.map(function (sw) {
      var tc = contrastColor(sw.color);
      return '<div class="swatch" style="background:' + sw.color + '">'
        + '<div class="swatch-label">'
        + '<span class="swatch-name" style="color:' + tc + '">' + sw.name + '</span>'
        + '<span class="swatch-hex" style="color:' + tc + '">' + sw.color + '</span>'
        + '</div></div>';
    }).join('');

    // tokens
    var tokens = [
      { key: '📐 border radius',   val: sys.radius + 'px' },
      { key: '📏 base spacing',    val: sys.spacing + 'px' },
      { key: '🔠 heading font',    val: sys.fonts.heading.replace(/'/g, '') },
      { key: '📝 body font',       val: sys.fonts.body.replace(/'/g, '') },
      { key: '⚖️ heading weight',  val: sys.headingWeight },
      { key: '↔️ letter spacing',  val: sys.letterSpacing },
    ];

    document.getElementById('tokenGrid').innerHTML = tokens.map(function (t) {
      return '<div class="token-card">'
        + '<div class="token-key">' + t.key + '</div>'
        + '<div class="token-val">' + t.val + '</div>'
        + '</div>';
    }).join('');

    // live preview
    var card = document.getElementById('previewCard');
    card.style.background   = sys.bg;
    card.style.borderColor  = sys.neutral;
    card.style.borderRadius = sys.radius + 'px';
    card.style.padding      = sys.spacing + 'px ' + Math.round(sys.spacing * 1.4) + 'px';

    var eyebrow = document.getElementById('prevEyebrow');
    eyebrow.style.color      = sys.secondary;
    eyebrow.style.fontFamily = sys.fonts.body + ', sans-serif';

    var heading = document.getElementById('prevHeading');
    heading.style.color         = sys.primary;
    heading.style.fontFamily    = sys.fonts.heading + ', serif';
    heading.style.fontWeight    = sys.headingWeight;
    heading.style.letterSpacing = sys.letterSpacing;

    var bodyEl = document.getElementById('prevBody');
    bodyEl.style.color      = contrastColor(sys.bg) === '#1a1a18' ? 'rgba(26,26,24,0.6)' : 'rgba(244,241,236,0.6)';
    bodyEl.style.fontFamily = sys.fonts.body + ', sans-serif';

    ['prevTag1', 'prevTag2'].forEach(function (id) {
      var tag = document.getElementById(id);
      tag.style.background   = sys.secondary;
      tag.style.color        = contrastColor(sys.secondary);
      tag.style.fontFamily   = sys.fonts.body + ', sans-serif';
      tag.style.borderRadius = (sys.radius * 3) + 'px';
    });

    var btn = document.getElementById('prevBtn');
    btn.style.background   = sys.accent;
    btn.style.color        = contrastColor(sys.accent);
    btn.style.fontFamily   = sys.fonts.body + ', sans-serif';
    btn.style.fontWeight   = '600';
    btn.style.borderRadius = sys.radius + 'px';

    // css output
    document.getElementById('cssBox').textContent = [
      ':root {',
      '  --color-bg:        ' + sys.bg + ';',
      '  --color-surface:   ' + sys.surface + ';',
      '  --color-neutral:   ' + sys.neutral + ';',
      '  --color-secondary: ' + sys.secondary + ';',
      '  --color-primary:   ' + sys.primary + ';',
      '  --color-accent:    ' + sys.accent + ';',
      '',
      '  --radius:          ' + sys.radius + 'px;',
      '  --spacing:         ' + sys.spacing + 'px;',
      '  --spacing-lg:      ' + (sys.spacing * 2) + 'px;',
      '  --spacing-sm:      ' + Math.round(sys.spacing * 0.5) + 'px;',
      '',
      '  --font-heading:    ' + sys.fonts.heading + ', serif;',
      '  --font-body:       ' + sys.fonts.body + ', sans-serif;',
      '  --fw-heading:      ' + sys.headingWeight + ';',
      '  --ls-heading:      ' + sys.letterSpacing + ';',
      '}',
    ].join('\n');

    // tailwind output
    document.getElementById('twBox').textContent = [
      '// tailwind.config.js',
      'module.exports = {',
      '  theme: {',
      '    extend: {',
      '      colors: {',
      "        bg:        '" + sys.bg + "',",
      "        surface:   '" + sys.surface + "',",
      "        neutral:   '" + sys.neutral + "',",
      "        secondary: '" + sys.secondary + "',",
      "        primary:   '" + sys.primary + "',",
      "        accent:    '" + sys.accent + "',",
      '      },',
      '      borderRadius: {',
      "        DEFAULT: '" + sys.radius + "px',",
      '      },',
      '      spacing: {',
      "        base: '" + sys.spacing + "px',",
      '      },',
      '      fontFamily: {',
      '        heading: [' + sys.fonts.heading + ", 'serif'],",
      '        body:    [' + sys.fonts.body    + ", 'sans-serif'],",
      '      },',
      '    },',
      '  },',
      '}',
    ].join('\n');
  }

  function copyCode(boxId, btn) {
    var text = document.getElementById(boxId).textContent;
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'copied ✓';
      setTimeout(function () { btn.textContent = orig; }, 1800);
    });
  }

}); // end DOMContentLoaded
