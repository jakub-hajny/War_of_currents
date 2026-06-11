const { useState, useEffect, useRef } = React;

/* ============================================================
   ✏️  VAŠE OTÁZKY — upravte před hodinou!
   ============================================================ */
const QUESTIONS = {
  easy: [
    { question: "Jaká je základní jednotka SI pro termodynamickou teplotu?",
      options: { A: "Stupeň Celsia", B: "Kelvin", C: "Fahrenheit", D: "Joule" }, correct: "B" },
    { question: "Jak se nazývá děj, při kterém je objem plynu konstantní?",
      options: { A: "Izotermický", B: "Izobarický", C: "Izochorický", D: "Adiabatický" }, correct: "C" },
    { question: "Která částice s kladným nábojem se nachází v jádře atomu?",
      options: { A: "Elektron", B: "Neutron", C: "Proton", D: "Foton" }, correct: "C" },
    { question: "Jaká je základní jednotka práce a energie v soustavě SI?",
      options: { A: "Watt", B: "Newton", C: "Pascal", D: "Joule" }, correct: "D" },
    { question: "Který přístroj se používá k měření velikosti elektrického proudu?",
      options: { A: "Voltmetr", B: "Ampérmetr", C: "Ohmmetr", D: "Kalorimetr" }, correct: "B" },
  ],
  medium: [
    { question: "Plyn při stálém tlaku zdvojnásobí svůj objem. Jak se změní jeho termodynamická teplota?",
      options: { A: "Zmenší se na polovinu", B: "Nezmění se", C: "Zdvojnásobí se", D: "Čtyřnásobně vzroste" }, correct: "C" },
    { question: "Vodičem o délce 0,5 m v magnetickém poli o indukci 2 T protéká proud 3 A. Jak velká magnetická síla na něj působí (vodič je kolmý na čáry)?",
      options: { A: "1,5 N", B: "3 N", C: "6 N", D: "0,75 N" }, correct: "B" },
    { question: "Kolik tepla je potřeba k ohřátí 2 kg vody o 10 °C? (Měrná tepelná kapacita vody je cca 4200 J/(kg·K))",
      options: { A: "8 400 J", B: "42 000 J", C: "84 000 J", D: "420 000 J" }, correct: "C" },
    { question: "Jaká je rychlost v m/s, pokud automobil jede stálou rychlostí 90 km/h?",
      options: { A: "25 m/s", B: "30 m/s", C: "15 m/s", D: "90 m/s" }, correct: "A" },
    { question: "Jaký celkový odpor mají dva rezistory o hodnotách 20 Ω a 30 Ω zapojené za sebou (sériově)?",
      options: { A: "10 Ω", B: "12 Ω", C: "50 Ω", D: "600 Ω" }, correct: "C" },
  ],
  hard: [
    { question: "Ideální plyn izotermicky zmenší svůj objem na třetinu. Jak se změní jeho tlak?",
      options: { A: "Klesne na třetinu", B: "Zůstane stejný", C: "Vzroste třikrát", D: "Vzroste devětkrát" }, correct: "C" },
    { question: "Při izobarickém ději s ideálním plynem o počátečním objemu 2 l vzroste teplota z 27 °C na 327 °C. Jaký bude nový objem?",
      options: { A: "4 l", B: "24 l", C: "1 l", D: "12 l" }, correct: "A" },
    { question: "Jaká je frekvence střídavého proudu, pokud jeho perioda kmitání trvá přesně 0,02 sekundy?",
      options: { A: "20 Hz", B: "50 Hz", C: "60 Hz", D: "100 Hz" }, correct: "B" },
    { question: "O kolik milimetrů se prodlouží 10m ocelový nosník při zahřátí o 50 °C? (Součinitel teplotní délkové roztažnosti oceli je 1,2 × 10⁻⁵ K⁻¹)",
      options: { A: "0,6 mm", B: "1,2 mm", C: "6 mm", D: "12 mm" }, correct: "C" },
    { question: "Jaká magnetická indukce B vznikne uprostřed 0,5 m dlouhé cívky s 500 závity, kterou protéká proud 2 A? (Permeabilitu vakua uvažujte jako 4π × 10⁻⁷ N/A²)",
      options: { A: "0,4π mT", B: "0,8π mT", C: "1,6π mT", D: "2,5π mT" }, correct: "B" },
  ],
};

const ROUNDS = [
  { key: "easy",   label: "KOLO 1", subtitle: "Základní pojmy",    time: 45, swing: 5,  badge: "#4ade80" },
  { key: "medium", label: "KOLO 2", subtitle: "Aplikovaná fyzika", time: 40, swing: 8,  badge: "#fbbf24" },
  { key: "hard",   label: "KOLO 3", subtitle: "Pokročilé úlohy",   time: 30, swing: 12, badge: "#f87171" },
];

/* ── zvuk ────────────────────────────────────────────────────── */
let _actx = null;
const getCtx = () => {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  if (_actx.state === "suspended") _actx.resume();
  return _actx;
};
const note = (ctx, freq, t0, dur, vol = 0.28, wave = "sine") => {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = wave; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.05);
};
const sfx = (name) => {
  try {
    const ctx = getCtx(), t = ctx.currentTime;
    if      (name === "correct") { note(ctx,523,t,.12); note(ctx,659,t+.13,.13); note(ctx,784,t+.26,.35); }
    else if (name === "wrong")   { note(ctx,280,t,.14,.3,"sawtooth"); note(ctx,180,t+.14,.3,.3,"sawtooth"); }
    else if (name === "tick")    { note(ctx,880,t,.04,.13,"square"); }
    else if (name === "timeup")  { [400,320,220].forEach((f,i)=>note(ctx,f,t+i*.13,.12,.25,"square")); }
    else if (name === "select")  { note(ctx,660,t,.07,.1); }
    else if (name === "round")   { [392,523,659,784].forEach((f,i)=>note(ctx,f,t+i*.13,.22)); }
    else if (name === "win")     { [523,659,784,1047,784,1047].forEach((f,i)=>note(ctx,f,t+i*.14,.28)); }
  } catch (_) {}
};

/* ── pomocné funkce ──────────────────────────────────────────── */
const doShuffle = (q) => {
  const a = Object.entries(q.options).map(([letter, text]) => ({ letter, text }));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const EC = "#f97316", TC = "#38bdf8";
const AUTO_DELAY   = 1000;   // ms after time-up before auto-grading
const AUTO_ADVANCE = 3500;   // ms showing result before auto-advancing

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700&family=Rajdhani:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #07070f; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes flashIn { 0%{opacity:0;transform:scale(0.85)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.18} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(0.7)} 60%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  @keyframes deplete { from{width:100%} to{width:0%} }
  button { font-family: inherit; }
  button:not(:disabled):hover { filter: brightness(1.18); }
`;

/* ── Ukazatel podpory ────────────────────────────────────────── */
function PercentBar({ pct }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ color:EC, fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:17 }}>{pct}%</span>
        <span style={{ color:"rgba(255,255,255,0.2)", fontSize:10, letterSpacing:"0.2em", fontFamily:"'Rajdhani',sans-serif" }}>VEŘEJNÁ PODPORA</span>
        <span style={{ color:TC, fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:17 }}>{100-pct}%</span>
      </div>
      <div style={{ position:"relative", height:30, borderRadius:9999, overflow:"hidden", background:"#121224", boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct}%`, background:"linear-gradient(90deg,#c2410c,#f97316,#fbbf24)", transition:"width 0.9s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:"3px 0 14px rgba(249,115,22,0.6)" }} />
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:`${100-pct}%`, background:"linear-gradient(270deg,#075985,#38bdf8,#bae6fd)", transition:"width 0.9s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:"-3px 0 14px rgba(56,189,248,0.6)" }} />
        <div style={{ position:"absolute", top:0, bottom:0, left:"50%", width:2, background:"rgba(255,255,255,0.18)", transform:"translateX(-50%)" }} />
      </div>
    </div>
  );
}

/* ── Hlavní aplikace ─────────────────────────────────────────── */
function App() {
  const [screen,   setScreen]   = useState("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [qIdx,     setQIdx]     = useState(0);
  const [pct,      setPct]      = useState(50);
  const [curTeam,  setCurTeam]  = useState("edison");
  const [selAns,   setSelAns]   = useState(null);
  const [shuffled, setShuffled] = useState(() => doShuffle(QUESTIONS.easy[0]));
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerOn,  setTimerOn]  = useState(false);
  const [timeUp,   setTimeUp]   = useState(false);
  const [gr,       setGr]       = useState(null);

  const timerRef   = useRef(null); // countdown tick
  const agRef      = useRef(null); // auto-grade delay after time-up
  const nextQRef   = useRef(null); // always-fresh nextQ pointer

  // Refs to avoid stale closures inside timer effect
  const curTeamRef = useRef(curTeam);
  const pctRef     = useRef(pct);
  const qRef       = useRef(null);
  const roundRef   = useRef(null);

  const round = ROUNDS[roundIdx];
  const qs    = QUESTIONS[round.key];
  const q     = qs[qIdx];
  const total = qs.length;

  // Keep refs in sync on every render
  curTeamRef.current = curTeam;
  pctRef.current     = pct;
  qRef.current       = q;
  roundRef.current   = round;

  /* ── časovač ─────────────────────────────────────────────── */
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (timerOn) {
      if (timeLeft > 0) {
        if (timeLeft <= 10) sfx("tick");
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      } else {
        // Time is up — auto-grade after a brief pause
        setTimerOn(false);
        setTimeUp(true);
        sfx("timeup");
        agRef.current = setTimeout(() => {
          const team        = curTeamRef.current;
          const currPct     = pctRef.current;
          const sw          = roundRef.current.swing;
          const correctLetter = qRef.current.correct;
          const newPct = team === "edison"
            ? Math.max(0,   currPct - sw)
            : Math.min(100, currPct + sw);
          const winner = team === "edison" ? "tesla" : "edison";
          const msg    = team === "edison"
            ? `Čas vypršel! Tesla získává +${sw}%`
            : `Čas vypršel! Edison získává +${sw}%`;
          sfx("wrong");
          setPct(newPct);
          setGr({ correct: false, msg, winner, correctLetter, autoGraded: true });
          setScreen("graded");
        }, AUTO_DELAY);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [timerOn, timeLeft]);

  /* ── automatický posun po auto-hodnocení ─────────────────── */
  useEffect(() => {
    if (screen === "graded" && gr?.autoGraded) {
      const t = setTimeout(() => nextQRef.current?.(), AUTO_ADVANCE);
      return () => clearTimeout(t);
    }
  }, [screen, gr]);

  /* ── herní logika ────────────────────────────────────────── */
  const beginQ = (rIdx, qI, time) => {
    clearTimeout(agRef.current);
    const newQ = QUESTIONS[ROUNDS[rIdx].key][qI];
    setShuffled(doShuffle(newQ));
    setSelAns(null);
    setTimeUp(false);
    setGr(null);
    setTimeLeft(time);
    setTimerOn(true);
    setScreen("questioning");
  };

  const startQ = () => {
    sfx("round");
    setCurTeam("edison");
    beginQ(roundIdx, 0, round.time);
  };

  const gradeIt = () => {
    if (!selAns) return;
    clearTimeout(agRef.current);   // cancel any pending auto-grade
    clearTimeout(timerRef.current);
    setTimerOn(false);
    const correct = selAns === q.correct;
    const sw      = round.swing;
    let newPct = pct, msg = "", winner = null;
    if (curTeam === "edison") {
      if (correct) { newPct = Math.min(100, pct + sw); msg = `Edison odpověděl správně! +${sw}%`; winner = "edison"; sfx("correct"); }
      else         { newPct = Math.max(0,   pct - sw); msg = `Špatně! Tesla získává +${sw}%`;     winner = "tesla";  sfx("wrong");   }
    } else {
      if (correct) { newPct = Math.max(0,   pct - sw); msg = `Tesla odpověděla správně! +${sw}%`; winner = "tesla";  sfx("correct"); }
      else         { newPct = Math.min(100, pct + sw); msg = `Špatně! Edison získává +${sw}%`;    winner = "edison"; sfx("wrong");   }
    }
    setPct(newPct);
    setGr({ correct, msg, winner, correctLetter: q.correct, autoGraded: false });
    setScreen("graded");
  };

  const nextQ = () => {
    const nQ = qIdx + 1;
    if (nQ >= total) {
      const nR = roundIdx + 1;
      if (nR >= ROUNDS.length) { sfx("win"); setScreen("final"); }
      else { setRoundIdx(nR); setQIdx(0); setCurTeam("edison"); setScreen("roundStart"); }
    } else {
      const nextTeam = curTeam === "edison" ? "tesla" : "edison";
      setQIdx(nQ);
      setCurTeam(nextTeam);
      beginQ(roundIdx, nQ, round.time);
    }
  };
  nextQRef.current = nextQ; // keep ref fresh every render

  const reset = () => {
    clearTimeout(timerRef.current);
    clearTimeout(agRef.current);
    setScreen("intro"); setRoundIdx(0); setQIdx(0); setPct(50);
    setCurTeam("edison"); setSelAns(null);
    setShuffled(doShuffle(QUESTIONS.easy[0]));
    setTimeLeft(60); setTimerOn(false); setTimeUp(false); setGr(null);
  };

  /* ── odvozené hodnoty ────────────────────────────────────── */
  const teamColor = curTeam === "edison" ? EC : TC;
  const teamLabel = curTeam === "edison" ? "💡 Edisonova otázka" : "⚡ Teslova otázka";
  const tColor    = timeLeft > round.time * 0.5 ? "#4ade80"
                  : timeLeft > round.time * 0.25 ? "#fbbf24" : "#f87171";
  const isLow     = timerOn && timeLeft > 0 && timeLeft <= round.time * 0.25;
  const mm        = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss        = String(timeLeft % 60).padStart(2, "0");
  const isLastQ   = qIdx + 1 >= total;
  const isLastR   = roundIdx + 1 >= ROUNDS.length;

  /* ── sdílené styly ───────────────────────────────────────── */
  const page = {
    minHeight:"100vh", background:"#07070f",
    backgroundImage:"radial-gradient(ellipse 50% 80% at 0% 50%,rgba(249,115,22,0.06),transparent 60%),radial-gradient(ellipse 50% 80% at 100% 50%,rgba(56,189,248,0.06),transparent 60%)",
    fontFamily:"'Rajdhani',sans-serif", color:"#fff", display:"flex", flexDirection:"column",
  };
  const card = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14 };

  const header = (
    <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:10 }}>
      <div style={{ display:"grid", gridTemplateColumns:"130px 1fr 130px", gap:16, alignItems:"center", maxWidth:900, margin:"0 auto" }}>
        <div style={{ fontFamily:"'Cinzel Decorative',serif", color:EC, fontSize:13, fontWeight:700 }}>💡 EDISON</div>
        <PercentBar pct={pct} />
        <div style={{ fontFamily:"'Cinzel Decorative',serif", color:TC, fontSize:13, fontWeight:700, textAlign:"right" }}>TESLA ⚡</div>
      </div>
    </div>
  );

  /* ════════════ ÚVODNÍ OBRAZOVKA ════════════ */
  if (screen === "intro") return (
    <div style={{ ...page, alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
      <style>{CSS}</style>
      <p style={{ letterSpacing:"0.3em", fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:10 }}>VÁLKA PROUDŮ</p>
      <h1 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(26px,5vw,52px)", fontWeight:900, marginBottom:40, lineHeight:1.1 }}>
        <span style={{ color:EC, textShadow:"0 0 28px rgba(249,115,22,0.6)" }}>EDISON</span>
        <span style={{ color:"rgba(255,255,255,0.12)", margin:"0 14px" }}>vs</span>
        <span style={{ color:TC, textShadow:"0 0 28px rgba(56,189,248,0.6)" }}>TESLA</span>
      </h1>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:16, maxWidth:760, width:"100%", marginBottom:32, alignItems:"center" }}>
        <div style={{ ...card, padding:"22px 20px", borderColor:"rgba(249,115,22,0.25)", background:"rgba(249,115,22,0.06)" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>💡</div>
          <h2 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:18, color:EC, marginBottom:4 }}>EDISON</h2>
          <div style={{ fontSize:11, letterSpacing:"0.2em", color:"rgba(249,115,22,0.55)", marginBottom:12 }}>TÝM DC</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>Šampion stejnosměrného proudu. Edisonova vize osvítila první elektrickou síť.</p>
        </div>
        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:22, color:"rgba(255,255,255,0.1)" }}>VS</div>
        <div style={{ ...card, padding:"22px 20px", borderColor:"rgba(56,189,248,0.25)", background:"rgba(56,189,248,0.06)" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>⚡</div>
          <h2 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:18, color:TC, marginBottom:4 }}>TESLA</h2>
          <div style={{ fontSize:11, letterSpacing:"0.2em", color:"rgba(56,189,248,0.55)", marginBottom:12 }}>TÝM AC</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>Mistr střídavého proudu. Teslovy inovace proměnily moderní energetiku.</p>
        </div>
      </div>
      <div style={{ maxWidth:560, width:"100%", marginBottom:32 }}><PercentBar pct={50} /></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:500, width:"100%", marginBottom:40 }}>
        {ROUNDS.map(r => (
          <div key={r.key} style={{ ...card, padding:"14px 12px", textAlign:"center" }}>
            <div style={{ color:r.badge, fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, marginBottom:4 }}>{r.label}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>{r.subtitle}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:10 }}>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>⏱ {r.time}s</span>
              <span style={{ fontSize:12, color:r.badge }}>±{r.swing}%</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setScreen("roundStart")} style={{ background:"linear-gradient(135deg,rgba(249,115,22,0.2),rgba(56,189,248,0.2))", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"15px 52px", color:"#fff", fontFamily:"'Cinzel Decorative',serif", fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:"0.08em", boxShadow:"0 0 32px rgba(249,115,22,0.1),0 0 32px rgba(56,189,248,0.1)" }}>
        ZAHÁJIT VÁLKU
      </button>
    </div>
  );

  /* ════════════ ZAČÁTEK KOLA ════════════ */
  if (screen === "roundStart") return (
    <div style={page}>
      <style>{CSS}</style>
      {header}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
        <div style={{ padding:"4px 18px", borderRadius:9999, background:`${round.badge}1a`, border:`1px solid ${round.badge}44`, color:round.badge, fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700, letterSpacing:"0.15em", marginBottom:18, animation:"fadeUp 0.4s ease" }}>{round.label}</div>
        <h2 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(22px,4vw,40px)", fontWeight:900, marginBottom:10, animation:"fadeUp 0.4s 0.08s ease both" }}>{round.subtitle}</h2>
        <p style={{ color:"rgba(255,255,255,0.38)", fontSize:15, marginBottom:4, animation:"fadeUp 0.4s 0.16s ease both" }}>
          {total} otázky · {round.time} sekund · týmy se střídají
        </p>
        <p style={{ color:round.badge, fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700, marginBottom:48, animation:"fadeUp 0.4s 0.24s ease both" }}>
          ±{round.swing}% za správnou odpověď
        </p>
        <button onClick={startQ} style={{ background:round.badge, color:"#07070f", border:"none", borderRadius:12, padding:"14px 48px", fontFamily:"'Cinzel Decorative',serif", fontSize:15, fontWeight:700, cursor:"pointer", letterSpacing:"0.08em", boxShadow:`0 0 30px ${round.badge}55`, animation:"fadeUp 0.4s 0.32s ease both" }}>
          ZAHÁJIT KOLO
        </button>
      </div>
    </div>
  );

  /* ════════════ OTÁZKA + HODNOCENÍ ════════════ */
  if (screen === "questioning" || screen === "graded") {
    const isQ = screen === "questioning";
    const isG = screen === "graded";
    const nextLabel = isLastQ && isLastR ? "Zobrazit výsledky"
                    : isLastQ ? `Zahájit ${ROUNDS[roundIdx+1]?.label}`
                    : "Další otázka →";

    return (
      <div style={page}>
        <style>{CSS}</style>
        {header}
        <div style={{ flex:1, padding:"18px 20px", maxWidth:880, margin:"0 auto", width:"100%", display:"flex", flexDirection:"column", gap:14 }}>

          {/* horní popisky */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ padding:"4px 14px", borderRadius:9999, background:`${teamColor}1a`, border:`1px solid ${teamColor}55`, color:teamColor, fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, letterSpacing:"0.08em" }}>
                {teamLabel}
              </div>
              <div style={{ padding:"4px 12px", borderRadius:9999, background:`${round.badge}18`, border:`1px solid ${round.badge}44`, color:round.badge, fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700 }}>
                {round.label}
              </div>
            </div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontFamily:"'Orbitron',monospace", fontSize:11 }}>{qIdx+1} / {total}</div>
          </div>

          {/* časovač */}
          {isQ && (
            <div style={{ textAlign:"center", padding:"2px 0" }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"clamp(44px,7vw,72px)", fontWeight:900, color:timeUp ? "#f87171" : tColor, lineHeight:1, animation:isLow ? "blink 0.7s infinite" : "none" }}>
                {timeUp ? "ČAS VYPRŠEL" : `${mm}:${ss}`}
              </div>
              {!timeUp
                ? <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:9999, marginTop:8, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(timeLeft/round.time)*100}%`, background:tColor, borderRadius:9999, transition:"width 1s linear,background 0.5s" }} />
                  </div>
                : <p style={{ marginTop:8, fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:"'Rajdhani',sans-serif", animation:"blink 1s infinite" }}>
                    Automatické hodnocení za okamžik…
                  </p>
              }
            </div>
          )}

          {/* otázka + možnosti */}
          <div style={{ ...card, padding:"18px 20px" }}>
            <p style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(15px,2.4vw,19px)", fontWeight:600, lineHeight:1.55, color:"#fff", marginBottom:16 }}>
              {q.question}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {shuffled.map((opt, i) => {
                const isSel   = selAns === opt.letter;
                const isCorr  = isG && opt.letter === gr.correctLetter;
                const isWrong = isG && isSel && !isCorr;
                // On auto-graded, highlight correct even if nobody selected
                const showCorr = isG && opt.letter === gr.correctLetter;

                let bg = "rgba(255,255,255,0.04)", bdr = "rgba(255,255,255,0.08)";
                let txt = "rgba(255,255,255,0.85)", shadow = "none";
                let dotBg = "rgba(255,255,255,0.08)", dotClr = "rgba(255,255,255,0.4)";

                if (showCorr) {
                  bg="rgba(74,222,128,0.14)"; bdr="#4ade80"; txt="#4ade80"; shadow="0 0 14px rgba(74,222,128,0.25)";
                  dotBg="#4ade80"; dotClr="#07070f";
                } else if (isWrong) {
                  bg="rgba(248,113,113,0.14)"; bdr="#f87171"; txt="#f87171";
                  dotBg="#f87171"; dotClr="#07070f";
                } else if (isG) {
                  txt="rgba(255,255,255,0.2)"; bdr="rgba(255,255,255,0.04)";
                } else if (isSel) {
                  bg=`${teamColor}22`; bdr=teamColor; txt="#fff"; shadow=`0 0 14px ${teamColor}35`;
                  dotBg=teamColor; dotClr="#07070f";
                }

                return (
                  <button key={opt.letter} disabled={isG}
                    onClick={() => { if (isQ && !timeUp) { setSelAns(opt.letter); sfx("select"); } }}
                    style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"14px", borderRadius:10, background:bg, border:`1px solid ${bdr}`, color:txt, textAlign:"left", fontSize:"clamp(13px,1.8vw,15px)", fontWeight:600, fontFamily:"'Rajdhani',sans-serif", lineHeight:1.4, cursor:(isQ && !timeUp) ? "pointer" : "default", transition:"all 0.15s", boxShadow:shadow, width:"100%" }}>
                    <span style={{ width:24, height:24, borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", background:dotBg, color:dotClr, fontSize:11, fontWeight:700, flexShrink:0, fontFamily:"'Orbitron',monospace", transition:"all 0.15s" }}>
                      {i+1}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ohodnotit – jen pokud je vybrána odpověď a čas ještě neuplynul */}
          {isQ && selAns && !timeUp && (
            <div style={{ display:"flex", justifyContent:"center", animation:"popIn 0.25s ease" }}>
              <button onClick={gradeIt} style={{ background:`linear-gradient(135deg,${teamColor}35,${teamColor}18)`, border:`1px solid ${teamColor}66`, borderRadius:12, padding:"13px 52px", color:"#fff", fontFamily:"'Cinzel Decorative',serif", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.07em", boxShadow:`0 0 20px ${teamColor}30` }}>
                Ohodnotit ⚡
              </button>
            </div>
          )}

          {/* Výsledek (hodnocení) */}
          {isG && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"center", animation:"flashIn 0.4s ease" }}>
                <p style={{ fontFamily:"'Orbitron',monospace", fontSize:"clamp(13px,2.4vw,17px)", fontWeight:700, letterSpacing:"0.06em", color:gr.winner==="edison" ? EC : gr.winner==="tesla" ? TC : "rgba(255,255,255,0.4)" }}>
                  {gr.msg.toUpperCase()}
                </p>
              </div>

              {/* auto-advance countdown bar */}
              {gr.autoGraded && (
                <div style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:6, fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.1em" }}>
                    AUTOMATICKY POKRAČUJE…
                  </p>
                  <div style={{ height:3, background:"rgba(255,255,255,0.08)", borderRadius:9999, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:"rgba(255,255,255,0.35)", borderRadius:9999, animation:`deplete ${AUTO_ADVANCE}ms linear forwards` }} />
                  </div>
                </div>
              )}

              {/* manual next button */}
              <button onClick={nextQ} style={{ background:isLastQ&&isLastR ? "#4ade80" : round.badge, color:"#07070f", border:"none", borderRadius:12, padding:"14px 44px", fontFamily:"'Cinzel Decorative',serif", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.07em", boxShadow:`0 0 24px ${isLastQ&&isLastR ? "#4ade80" : round.badge}55` }}>
                {nextLabel}
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  /* ════════════ KONEČNÉ VÝSLEDKY ════════════ */
  if (screen === "final") {
    const winColor = pct>50 ? EC : pct<50 ? TC : "rgba(255,255,255,0.4)";
    const winName  = pct>50 ? "EDISON VYHRÁL" : pct<50 ? "TESLA VYHRÁL" : "REMÍZA";
    const winIcon  = pct>50 ? "💡" : "⚡";
    const winMsg   = pct>50 ? "Stejnosměrný proud vyhrál válku proudů!"
                  : pct<50 ? "Střídavý proud vyhrál válku proudů!"
                  : "Válka proudů skončila remízou!";
    const topScore = pct>50 ? pct : 100-pct;
    return (
      <div style={{ ...page, alignItems:"center", justifyContent:"center", padding:24, textAlign:"center" }}>
        <style>{CSS}</style>
        <p style={{ letterSpacing:"0.3em", fontSize:11, color:"rgba(255,255,255,0.2)", marginBottom:14 }}>KONEČNÝ VÝSLEDEK</p>
        <div style={{ fontSize:64, marginBottom:14, animation:"flashIn 0.5s ease" }}>{winIcon}</div>
        <h1 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"clamp(26px,5.5vw,54px)", fontWeight:900, color:winColor, marginBottom:10, textShadow:`0 0 40px ${winColor}70`, animation:"flashIn 0.5s 0.1s ease both" }}>{winName}</h1>
        <p style={{ fontSize:"clamp(13px,2vw,17px)", color:"rgba(255,255,255,0.45)", marginBottom:8, animation:"flashIn 0.5s 0.2s ease both" }}>{winMsg}</p>
        <p style={{ fontFamily:"'Orbitron',monospace", fontSize:"clamp(22px,4vw,36px)", fontWeight:700, color:winColor, marginBottom:48, animation:"flashIn 0.5s 0.3s ease both" }}>{topScore}% podpory</p>
        <div style={{ maxWidth:520, width:"100%", marginBottom:48, animation:"fadeUp 0.5s 0.4s ease both" }}><PercentBar pct={pct} /></div>
        <button onClick={reset} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"13px 44px", color:"rgba(255,255,255,0.65)", fontFamily:"'Cinzel Decorative',serif", fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:"0.07em", animation:"fadeUp 0.5s 0.5s ease both" }}>
          Hrát znovu
        </button>
      </div>
    );
  }

  return null;
}

// Mount the app (Babel standalone + non-module setup expects globals)
const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
