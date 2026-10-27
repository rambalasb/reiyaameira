// Shared helpers for every page in Reiya's Lab.
// Each game page loads this with <script src="shared.js"></script>.

// ---------- the list of games ----------
// To add a new game: make a new .html file in this folder, then add a line here.
// It will show up in the Lab and get its own sticker automatically.
const GAMES = [
  { id: "number-pop",       title: "Number Pop",       emoji: "🫧", sticker: "🦄", type: "math",    desc: "Pop the bubble with the answer" },
  { id: "times-table-race", title: "Times-Table Race", emoji: "🏁", sticker: "⭐", type: "math",    desc: "How many in 60 seconds?" },
  { id: "make-10",          title: "Make 10",          emoji: "🔟", sticker: "🍭", type: "math",    desc: "Find two cards that add up to 10" },
  { id: "shop-keeper",      title: "Shop Keeper",      emoji: "🛒", sticker: "🧁", type: "math",    desc: "Pay with the right coins" },
  { id: "clock-matcher",    title: "Clock Matcher",    emoji: "🕒", sticker: "🐱", type: "math",    desc: "Move the clock hands" },
  { id: "fraction-pizza",   title: "Fraction Pizza",   emoji: "🍕", sticker: "🍓", type: "math",    desc: "Color in the right slices" },
  { id: "sink-or-float",    title: "Sink or Float",    emoji: "🛟", sticker: "🐬", type: "science", desc: "Guess, then drop it in the water" },
  { id: "feed-the-animal",  title: "Feed the Animal",  emoji: "🦁", sticker: "🐼", type: "science", desc: "Plants, meat, or both?" },
  { id: "planet-sizes",     title: "Planet Line-Up",   emoji: "🪐", sticker: "🚀", type: "science", desc: "Put the planets in order" },
  { id: "mix-colors",       title: "Mix the Colors",   emoji: "🎨", sticker: "🌈", type: "science", desc: "Red + blue makes...?" },
  { id: "plant-grower",     title: "Plant Grower",     emoji: "🌱", sticker: "🌻", type: "science", desc: "Water, sunshine and time" },
  { id: "weather-dress-up", title: "Weather Dress-Up", emoji: "🌦️", sticker: "🎀", type: "science", desc: "Pick clothes for the weather" },
  { id: "spelling-bee",     title: "Spelling Bee",     emoji: "🐝", sticker: "🐝", type: "words",   desc: "Listen, then spell the word" },
  { id: "pattern-finder",   title: "Pattern Finder",   emoji: "🔮", sticker: "🦋", type: "words",   desc: "What comes next?" },
  { id: "maze",             title: "Unicorn Maze",     emoji: "🧭", sticker: "🍉", type: "words",   desc: "Help the unicorn find the rainbow" },
  { id: "memory-match",     title: "Memory Match",     emoji: "🃏", sticker: "🌸", type: "words",   desc: "Flip cards and find the pairs" },
];

const Lab = (() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- saving things in this browser ----------
  function load(key, fallback) {
    try {
      const value = localStorage.getItem("lab:" + key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("lab:" + key, JSON.stringify(value)); } catch {}
  }

  // ---------- random helpers ----------
  const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- stickers + best scores ----------
  const stickers = () => load("stickers", {});

  function updateStickerCount() {
    const have = Object.keys(stickers()).length;
    document.querySelectorAll("[data-sticker-count]").forEach(el => {
      el.textContent = `🏅 ${have} / ${GAMES.length}`;
      el.title = "Stickers collected";
    });
  }

  // Call this when a game is finished: it gives the sticker and throws confetti.
  function win(gameId) {
    const all = stickers();
    const game = GAMES.find(g => g.id === gameId);
    const isNew = !all[gameId];
    all[gameId] = true;
    save("stickers", all);
    updateStickerCount();
    sound("win");
    confetti();
    toast(isNew ? `New sticker! ${game.sticker} It's in your sticker book.` : `You did it again! ${game.sticker}`);
  }

  // Remembers the best score. Use lowerIsBetter for things like "fewest moves".
  function best(key, score, lowerIsBetter = false) {
    const old = load("best:" + key, null);
    const isNew = old === null || (lowerIsBetter ? score < old : score > old);
    if (isNew) save("best:" + key, score);
    return { best: isNew ? score : old, isNew };
  }

  // ---------- sounds (made by the browser, no files needed) ----------
  let audio;
  function sound(kind) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { yes: [660, 880], no: [240, 180], win: [523, 659, 784, 1047] }[kind];
      notes.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const t = audio.currentTime + i * 0.11;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch {}
  }

  // The browser reads words out loud.
  const canSpeak = "speechSynthesis" in window;
  function say(text) {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const words = new SpeechSynthesisUtterance(text);
    words.rate = 0.85;
    speechSynthesis.speak(words);
  }

  // ---------- messages ----------
  function feedback(el, text, good) {
    el.textContent = text;
    el.className = "feedback " + (good ? "good" : "bad");
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast pop-in";
    t.setAttribute("role", "status");
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth; // restarts the animation
    el.classList.add("shake");
  }

  // ---------- confetti ----------
  const colors = ["#ff9ec7", "#ff77b0", "#c9a7ff", "#9ee6cf", "#a7d8ff", "#ffe08a"];
  let canvas, ctx, pieces = [], running = false;

  function setupCanvas() {
    canvas = document.createElement("canvas");
    canvas.className = "lab-confetti";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    addEventListener("resize", resize);
    resize();
  }

  function burst(x, y, count, spread, angle) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const speed = 6 + Math.random() * 9;
      pieces.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: pick(colors),
        life: 0
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(p => p.y < innerHeight + 40 && p.life < 400);
    for (const p of pieces) {
      p.vy += 0.22;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(tick);
    else running = false;
  }

  function confetti() {
    if (reduceMotion) return;
    if (!canvas) setupCanvas();
    const w = innerWidth, h = innerHeight;
    burst(w / 2, h * 0.45, 140, Math.PI * 2, 0);
    setTimeout(() => {
      burst(0, h * 0.7, 80, 0.9, -Math.PI / 3);
      burst(w, h * 0.7, 80, 0.9, -2 * Math.PI / 3);
    }, 300);
  }

  updateStickerCount();

  return { load, save, rand, pick, shuffle, stickers, win, best, sound, canSpeak, say, feedback, toast, shake, confetti };
})();
