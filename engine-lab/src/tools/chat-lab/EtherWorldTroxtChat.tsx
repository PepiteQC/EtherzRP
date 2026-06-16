<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TroxT — Etherworld Project</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  :root {
    --ew-cyan:    #22d3ee;
    --ew-purple:  #a855f7;
    --ew-blue:    #3b82f6;
    --ew-indigo:  #4f46e5;
    --ew-green:   #22c55e;
    --ew-pink:    #ec4899;
    --glass:      rgba(5, 8, 20, 0.72);
    --border:     rgba(255,255,255,0.07);
  }

  html, body {
    width:100%; height:100%;
    background:#020612;
    overflow:hidden;
    font-family: Inter, system-ui, sans-serif;
  }

  /* ══════════════════════════════════════
     BACKGROUND UNIVERSE
  ══════════════════════════════════════ */
  .ew-universe {
    position:fixed; inset:0; z-index:0; overflow:hidden;
  }

  /* Deep space gradient */
  .ew-universe__space {
    position:absolute; inset:0;
    background:
      radial-gradient(ellipse 80% 50% at 15% 10%,  rgba(79,70,229,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 85% 85%,  rgba(168,85,247,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 40% 30% at 50% 50%,  rgba(34,211,238,0.06) 0%, transparent 70%),
      #020612;
  }

  /* Animated grid */
  .ew-universe__grid {
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
    animation: gridDrift 25s linear infinite;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }
  @keyframes gridDrift { to { transform: translate(56px, 56px); } }

  /* Scanline */
  .ew-universe__scan {
    position:absolute; inset:0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.08) 3px,
      rgba(0,0,0,0.08) 4px
    );
    pointer-events:none;
  }

  /* Aurora */
  .ew-universe__aurora {
    position:absolute;
    top:-60px; left:-40%; right:-40%;
    height:280px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(79,70,229,0.08) 20%,
      rgba(34,211,238,0.12) 40%,
      rgba(168,85,247,0.10) 60%,
      rgba(236,72,153,0.07) 80%,
      transparent 100%
    );
    filter: blur(35px);
    animation: auroraDance 14s ease-in-out infinite;
  }
  @keyframes auroraDance {
    0%,100% { transform: skewX(-6deg) translateX(-4%) scaleY(1);   opacity:.8; }
    33%     { transform: skewX(4deg)  translateX(3%)  scaleY(1.2); opacity:1;  }
    66%     { transform: skewX(-3deg) translateX(-2%) scaleY(0.9); opacity:.7; }
  }

  /* Floating orbs */
  .ew-orb {
    position:absolute; border-radius:50%;
    filter: blur(70px); animation: orbDrift ease-in-out infinite;
    pointer-events:none;
  }
  .ew-orb--1 { width:480px;height:480px; top:-12%;left:-8%;
    background:radial-gradient(circle, rgba(79,70,229,0.22), transparent 70%);
    animation-duration:18s; }
  .ew-orb--2 { width:380px;height:380px; bottom:-10%;right:-6%;
    background:radial-gradient(circle, rgba(168,85,247,0.20), transparent 70%);
    animation-duration:22s; animation-delay:-7s; }
  .ew-orb--3 { width:260px;height:260px; top:45%;left:55%;
    background:radial-gradient(circle, rgba(34,211,238,0.12), transparent 70%);
    animation-duration:16s; animation-delay:-12s; }
  @keyframes orbDrift {
    0%,100% { transform:translate(0,0) scale(1); }
    25%     { transform:translate(35px,-25px) scale(1.08); }
    50%     { transform:translate(-18px,40px) scale(0.94); }
    75%     { transform:translate(22px,15px) scale(1.04); }
  }

  /* Star field */
  .ew-stars { position:absolute; inset:0; }
  .ew-star {
    position:absolute; border-radius:50%;
    background:#fff; animation: starTwinkle ease-in-out infinite;
  }
  @keyframes starTwinkle {
    0%,100%{ opacity:.15; transform:scale(1);   }
    50%    { opacity:.9;  transform:scale(1.5); }
  }

  /* Particles */
  .ew-particles { position:absolute; inset:0; }
  .ew-particle {
    position:absolute; border-radius:50%;
    animation: particleRise linear infinite;
  }
  @keyframes particleRise {
    0%   { transform:translateY(105vh) scale(0); opacity:0; }
    8%   { opacity:1; }
    92%  { opacity:1; }
    100% { transform:translateY(-8vh) scale(1);  opacity:0; }
  }

  /* ══════════════════════════════════════
     CHAT SHELL
  ══════════════════════════════════════ */
  .ew-chat {
    position:relative; z-index:1;
    width: min(1020px, calc(100vw - 32px));
    height: min(790px, calc(100vh - 32px));
    margin: 16px auto;
    display:grid;
    grid-template-rows: auto auto 1fr auto;
    overflow:hidden;
    color:#f8fafc;
    border-radius:28px;
    border:1px solid rgba(88,220,255,0.14);
    background: var(--glass);
    backdrop-filter: blur(48px) saturate(1.7);
    -webkit-backdrop-filter: blur(48px) saturate(1.7);
    box-shadow:
      0 50px 120px rgba(0,0,0,0.65),
      inset 0 1px 0 rgba(255,255,255,0.07),
      inset 0 0 0 1px rgba(255,255,255,0.03),
      0 0 180px rgba(34,211,238,0.04);
    transition: box-shadow .5s;
  }
  .ew-chat:hover {
    box-shadow:
      0 50px 120px rgba(0,0,0,0.65),
      inset 0 1px 0 rgba(255,255,255,0.09),
      inset 0 0 0 1px rgba(255,255,255,0.04),
      0 0 220px rgba(34,211,238,0.07);
  }

  /* Top glow edge */
  .ew-chat__glow-top {
    position:absolute; top:0; left:0; right:0; height:1px; z-index:5;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(34,211,238,0.5) 30%,
      rgba(168,85,247,0.5) 70%,
      transparent 100%
    );
    animation: glowEdge 6s ease-in-out infinite;
  }
  @keyframes glowEdge {
    0%,100% { opacity:.5; }
    50%     { opacity:1; }
  }

  /* ══════════════════════════════════════
     HEADER
  ══════════════════════════════════════ */
  .ew-chat__header {
    position:relative; z-index:2;
    min-height:80px;
    padding:14px 22px;
    display:flex; align-items:center;
    justify-content:space-between; gap:18px;
    border-bottom:1px solid var(--border);
    background: rgba(4,7,18,0.75);
    backdrop-filter: blur(24px);
  }

  .ew-chat__identity { display:flex; align-items:center; gap:16px; }

  /* TroxT Logo — animated neural core */
  .ew-chat__logo {
    position:relative;
    width:52px; height:52px;
    display:grid; place-items:center;
    border-radius:18px;
    flex-shrink:0;
  }

  .ew-chat__logo-bg {
    position:absolute; inset:0; border-radius:18px;
    background: linear-gradient(135deg, #1e1b4b, #0e7490);
    overflow:hidden;
  }
  .ew-chat__logo-bg::after {
    content:'';
    position:absolute; inset:0;
    background: linear-gradient(135deg,
      transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%
    );
    animation: logoShine 3.5s ease-in-out infinite;
  }
  @keyframes logoShine {
    0%,100%{ transform:translate(-150%,-150%); }
    60%    { transform:translate(150%,150%);   }
  }

  /* Rotating border ring */
  .ew-chat__logo-ring {
    position:absolute; inset:-3px; border-radius:21px;
    background: conic-gradient(
      from 0deg,
      transparent 0%,
      rgba(34,211,238,0.8) 25%,
      transparent 50%,
      rgba(168,85,247,0.6) 75%,
      transparent 100%
    );
    animation: ringRotate 3s linear infinite;
    mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black 0);
  }
  @keyframes ringRotate { to { transform:rotate(360deg); } }

  /* Pulse glow behind logo */
  .ew-chat__logo-pulse {
    position:absolute; inset:-8px; border-radius:26px;
    background: radial-gradient(circle,
      rgba(34,211,238,0.22), rgba(168,85,247,0.15), transparent 70%
    );
    animation: logoPulse 2.5s ease-in-out infinite;
  }
  @keyframes logoPulse {
    0%,100%{ transform:scale(1);   opacity:.5; }
    50%    { transform:scale(1.2); opacity:1;  }
  }

  .ew-chat__logo svg {
    position:relative; z-index:1;
    drop-shadow: 0 0 8px var(--ew-cyan);
  }

  .ew-chat__brand { display:flex; flex-direction:column; }

  .ew-chat__brand-name {
    font-size:17px; font-weight:900;
    letter-spacing:0.14em;
    background: linear-gradient(90deg, #e8fbff 0%, #67e8f9 40%, #c4b5fd 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    line-height:1.1;
  }

  .ew-chat__brand-sub {
    margin-top:4px;
    font-size:9px; font-weight:800;
    letter-spacing:0.28em; text-transform:uppercase;
    color:transparent;
    background: linear-gradient(90deg, rgba(34,211,238,0.6), rgba(168,85,247,0.6));
    -webkit-background-clip:text; background-clip:text;
  }

  /* "Cerveau" badge */
  .ew-chat__core-badge {
    display:inline-flex; align-items:center; gap:5px;
    margin-top:5px;
    padding:3px 9px;
    border-radius:8px;
    background: linear-gradient(90deg,
      rgba(79,70,229,0.2), rgba(168,85,247,0.15)
    );
    border:1px solid rgba(168,85,247,0.2);
    font-size:9px; font-weight:800;
    letter-spacing:0.12em; text-transform:uppercase;
    color:rgba(196,181,253,0.85);
    width:fit-content;
  }
  .ew-chat__core-badge::before {
    content:'';
    width:5px; height:5px; border-radius:50%;
    background:var(--ew-purple);
    box-shadow:0 0 8px var(--ew-purple);
    animation:ew-pulse 1.8s ease-in-out infinite;
  }

  .ew-chat__toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }

  .ew-chat__project-sel {
    display:flex; align-items:center; gap:8px;
    padding:8px 13px;
    border:1px solid rgba(255,255,255,0.07);
    border-radius:14px;
    background:rgba(255,255,255,0.03);
    transition: border-color .3s, background .3s;
  }
  .ew-chat__project-sel:hover {
    border-color:rgba(34,211,238,0.18);
    background:rgba(255,255,255,0.05);
  }
  .ew-chat__project-sel span {
    font-size:9px; font-weight:800;
    text-transform:uppercase; letter-spacing:.15em;
    color:rgba(255,255,255,0.35);
  }
  .ew-chat__project-sel select {
    border:0; outline:0; background:transparent;
    color:#e2f9ff; font:inherit;
    font-size:12px; font-weight:800;
    cursor:pointer;
  }
  .ew-chat__project-sel option { color:#0f172a; }

  .ew-icon-btn {
    width:40px; height:40px;
    display:grid; place-items:center;
    border:1px solid rgba(255,255,255,0.07);
    border-radius:13px;
    color:rgba(255,255,255,0.55);
    background:rgba(255,255,255,0.03);
    cursor:pointer;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    position:relative; overflow:hidden;
  }
  .ew-icon-btn::before {
    content:'';
    position:absolute; inset:0;
    background:radial-gradient(circle at center, rgba(34,211,238,0.15), transparent 70%);
    opacity:0; transition:opacity .25s;
  }
  .ew-icon-btn:hover {
    color:var(--ew-cyan);
    border-color:rgba(34,211,238,0.35);
    transform:translateY(-2px);
    box-shadow:0 6px 20px rgba(34,211,238,0.12);
  }
  .ew-icon-btn:hover::before { opacity:1; }
  .ew-icon-btn svg { position:relative; z-index:1; }

  /* ══════════════════════════════════════
     STATUS BAR
  ══════════════════════════════════════ */
  .ew-chat__status {
    position:relative; z-index:2;
    min-height:38px;
    display:flex; align-items:center; gap:8px;
    padding:0 22px;
    border-bottom:1px solid var(--border);
    background:rgba(4,7,18,0.45);
    font-size:11px; font-weight:700;
    color:rgba(255,255,255,0.45);
  }

  .ew-status-dot {
    width:8px; height:8px; border-radius:50%;
    background:#334155; flex-shrink:0;
    transition: all .4s;
  }
  .ew-status-dot.ready   { background:var(--ew-green);  box-shadow:0 0 10px rgba(34,197,94,.8); }
  .ew-status-dot.thinking{ background:var(--ew-cyan);   box-shadow:0 0 10px rgba(34,211,238,.8); animation:ew-pulse 1s infinite alternate; }
  .ew-status-dot.working { background:var(--ew-purple); box-shadow:0 0 10px rgba(168,85,247,.8); animation:ew-pulse 1s infinite alternate; }
  .ew-status-dot.error   { background:#fb7185; }

  /* Neural processing animation */
  .ew-status-wave {
    display:flex; gap:2px; margin-left:2px;
  }
  .ew-status-wave span {
    width:2px; border-radius:1px;
    background:var(--ew-cyan);
    animation:waveBar 1.2s ease-in-out infinite;
  }
  .ew-status-wave span:nth-child(1){ height:4px;  animation-delay:0s;   }
  .ew-status-wave span:nth-child(2){ height:8px;  animation-delay:.12s; }
  .ew-status-wave span:nth-child(3){ height:12px; animation-delay:.24s; }
  .ew-status-wave span:nth-child(4){ height:8px;  animation-delay:.36s; }
  .ew-status-wave span:nth-child(5){ height:4px;  animation-delay:.48s; }
  @keyframes waveBar {
    0%,100%{ transform:scaleY(.3); opacity:.3; }
    50%    { transform:scaleY(1);  opacity:1;  }
  }

  .ew-chat__status-right { margin-left:auto; display:flex; align-items:center; gap:8px; }

  .ew-model-badge {
    padding:3px 10px; border-radius:8px;
    font-size:9px; font-weight:800;
    letter-spacing:.1em; text-transform:uppercase;
    color:rgba(168,85,247,.9);
    background:rgba(168,85,247,.08);
    border:1px solid rgba(168,85,247,.14);
  }

  .ew-uptime {
    font-size:9px; font-weight:700;
    letter-spacing:.06em;
    color:rgba(34,211,238,.4);
    font-family:'JetBrains Mono',monospace;
  }

  /* ══════════════════════════════════════
     MESSAGES
  ══════════════════════════════════════ */
  .ew-chat__messages {
    position:relative; z-index:1;
    min-height:0; overflow-y:auto;
    padding:26px 22px;
    scrollbar-width:thin;
    scrollbar-color: rgba(34,211,238,.18) transparent;
  }
  .ew-chat__messages::-webkit-scrollbar{ width:4px; }
  .ew-chat__messages::-webkit-scrollbar-track{ background:transparent; }
  .ew-chat__messages::-webkit-scrollbar-thumb{
    background:rgba(34,211,238,.18); border-radius:10px;
  }

  /* Date separator */
  .ew-date-sep {
    display:flex; align-items:center; gap:14px;
    margin:6px 0 22px;
    color:rgba(255,255,255,0.18);
    font-size:10px; font-weight:700;
    letter-spacing:.18em; text-transform:uppercase;
  }
  .ew-date-sep::before,.ew-date-sep::after{
    content:''; flex:1; height:1px;
    background:linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent);
  }

  /* Message row */
  .ew-msg {
    display:flex; align-items:flex-start; gap:12px;
    margin-bottom:22px;
    animation: msgIn .4s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes msgIn {
    from{ opacity:0; transform:translateY(14px); }
    to  { opacity:1; transform:translateY(0); }
  }
  .ew-msg.user { flex-direction:row-reverse; }

  /* Avatar */
  .ew-avatar {
    width:38px; height:38px; flex:0 0 auto;
    display:grid; place-items:center;
    border-radius:13px;
    font-size:13px; font-weight:900;
    transition: transform .3s, box-shadow .3s;
    position:relative;
  }
  .ew-msg:hover .ew-avatar { transform:scale(1.1); }

  .ew-avatar--troxt {
    border:1px solid rgba(34,211,238,.22);
    background: linear-gradient(135deg, #0c1a30, #061320);
    color:var(--ew-cyan);
    box-shadow: 0 0 20px rgba(34,211,238,.08);
  }
  /* Tiny rotating ring on TroxT avatar */
  .ew-avatar--troxt::before {
    content:'';
    position:absolute; inset:-2px; border-radius:15px;
    background: conic-gradient(
      from 0deg,
      transparent, rgba(34,211,238,.7) 25%,
      transparent 50%, rgba(168,85,247,.5) 75%, transparent
    );
    animation: ringRotate 4s linear infinite;
    mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black 0);
  }

  .ew-avatar--user {
    border:1px solid rgba(196,181,253,.18);
    background: linear-gradient(135deg, #1e133a, #140e28);
    color:#c4b5fd;
    box-shadow: 0 0 20px rgba(168,85,247,.08);
  }
  .ew-avatar--system {
    border:1px solid rgba(251,191,36,.18);
    background: rgba(45,33,8,.6);
    color:#fbbf24; font-size:15px;
  }

  /* Bubble */
  .ew-bubble {
    position:relative;
    max-width: min(72%, 680px);
    padding:14px 18px;
    border:1px solid rgba(255,255,255,.06);
    border-radius:6px 18px 18px 18px;
    background: rgba(8,14,30,.88);
    backdrop-filter:blur(12px);
    box-shadow:
      0 8px 32px rgba(0,0,0,.18),
      inset 0 1px 0 rgba(255,255,255,.04);
    transition: transform .3s, box-shadow .3s;
  }
  .ew-msg:hover .ew-bubble {
    transform:translateY(-2px);
    box-shadow: 0 14px 42px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.06);
  }

  /* TroxT bubble — subtle left accent */
  .ew-bubble--troxt::after {
    content:'';
    position:absolute; top:14px; left:-1px;
    width:2px; height:28px; border-radius:2px;
    background: linear-gradient(180deg, var(--ew-cyan), var(--ew-purple));
  }

  .ew-msg.user .ew-bubble {
    border-radius:18px 6px 18px 18px;
    border-color:rgba(139,92,246,.18);
    background: linear-gradient(135deg,
      rgba(79,70,229,.2), rgba(91,33,182,.16)
    );
  }
  .ew-msg.system .ew-bubble {
    border-color:rgba(251,191,36,.14);
    background:rgba(45,33,8,.18);
    border-radius:14px;
    max-width:100%;
  }

  /* Meta row */
  .ew-meta {
    display:flex; align-items:center;
    justify-content:space-between; gap:16px;
    margin-bottom:7px;
  }
  .ew-meta__name {
    font-size:11px; font-weight:800;
    background: linear-gradient(90deg, #e8fbff, #67e8f9 70%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .ew-msg.user .ew-meta__name {
    background: linear-gradient(90deg, #ede0ff, #c4b5fd 70%);
    -webkit-background-clip:text; background-clip:text;
  }
  .ew-meta__time {
    color:rgba(255,255,255,.22);
    font-size:9px; font-weight:600;
    font-family:'JetBrains Mono',monospace;
  }

  /* Text */
  .ew-bubble p {
    margin:0;
    color:rgba(248,250,252,.86);
    white-space:pre-wrap; overflow-wrap:anywhere;
    font-size:13px; line-height:1.72;
  }

  /* Code */
  .ew-code {
    position:relative;
    margin:10px 0 6px;
    padding:14px 16px 14px;
    border-radius:12px;
    background:rgba(0,0,0,.45);
    border:1px solid rgba(255,255,255,.05);
    font-family:'JetBrains Mono',monospace;
    font-size:12px; line-height:1.65;
    color:#67e8f9;
    overflow-x:auto;
  }
  .ew-code__lang {
    position:absolute; top:8px; right:12px;
    font-size:9px; font-weight:700;
    text-transform:uppercase; letter-spacing:.1em;
    color:rgba(255,255,255,.2);
  }
  .ew-code .kw  { color:#c084fc; }
  .ew-code .fn  { color:#60a5fa; }
  .ew-code .str { color:#34d399; }
  .ew-code .cm  { color:rgba(255,255,255,.25); font-style:italic; }
  .ew-code .num { color:#fbbf24; }

  /* Thinking dots */
  .ew-thinking { display:flex; gap:6px; padding:4px 0; }
  .ew-thinking span {
    width:8px; height:8px; border-radius:50%;
    background: linear-gradient(135deg, var(--ew-cyan), var(--ew-purple));
    animation: thinkBounce 1.4s ease-in-out infinite;
  }
  .ew-thinking span:nth-child(2){ animation-delay:.16s; }
  .ew-thinking span:nth-child(3){ animation-delay:.32s; }
  @keyframes thinkBounce {
    0%,80%,100%{ transform:scale(.55); opacity:.25; }
    40%        { transform:scale(1.1);  opacity:1;   }
  }

  /* Actions */
  .ew-actions {
    display:flex; gap:5px; margin-top:9px;
    opacity:0; transition:opacity .25s;
  }
  .ew-msg:hover .ew-actions { opacity:1; }
  .ew-act-btn {
    display:inline-flex; align-items:center; gap:4px;
    padding:4px 10px;
    border:1px solid rgba(255,255,255,.06);
    border-radius:8px;
    background:rgba(255,255,255,.03);
    color:rgba(255,255,255,.32);
    font-size:10px; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .ew-act-btn:hover {
    color:var(--ew-cyan);
    border-color:rgba(34,211,238,.28);
    background:rgba(34,211,238,.06);
  }

  /* Token info */
  .ew-tokens {
    display:inline-flex; align-items:center; gap:5px;
    margin-top:8px; padding:3px 9px; border-radius:7px;
    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.04);
    color:rgba(255,255,255,.2);
    font-size:9px; font-weight:700;
    font-family:'JetBrains Mono',monospace;
  }

  /* ══════════════════════════════════════
     COMPOSER
  ══════════════════════════════════════ */
  .ew-chat__composer {
    position:relative; z-index:2;
    padding:16px 20px;
    border-top:1px solid var(--border);
    background:rgba(4,7,18,.78);
    backdrop-filter:blur(24px);
  }

  .ew-composer-wrap {
    position:relative;
    border:1px solid rgba(34,211,238,.11);
    border-radius:20px;
    background:rgba(2,5,18,.6);
    overflow:hidden;
    transition: border-color .3s, box-shadow .3s;
  }
  .ew-composer-wrap:focus-within {
    border-color:rgba(34,211,238,.32);
    box-shadow:
      0 0 0 3px rgba(34,211,238,.05),
      0 0 50px rgba(34,211,238,.04);
  }
  /* Animated gradient top line on focus */
  .ew-composer-wrap::before {
    content:''; position:absolute;
    top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(34,211,238,.5) 40%,
      rgba(168,85,247,.5) 60%,
      transparent
    );
    opacity:0; transition:opacity .3s;
  }
  .ew-composer-wrap:focus-within::before { opacity:1; }

  .ew-composer-wrap textarea {
    width:100%; min-height:70px; max-height:180px;
    resize:none; outline:none; border:none;
    padding:14px 18px;
    color:#f8fafc; background:transparent;
    font:inherit; font-size:13px; line-height:1.6;
  }
  .ew-composer-wrap textarea::placeholder { color:rgba(255,255,255,.18); }

  .ew-composer-bar {
    display:flex; align-items:center;
    justify-content:space-between; gap:10px;
    padding:6px 10px 10px;
  }
  .ew-composer-left { display:flex; align-items:center; gap:4px; }

  .ew-attach-btn {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 11px; border:none; border-radius:10px;
    background:rgba(255,255,255,.04);
    color:rgba(255,255,255,.32);
    font:inherit; font-size:11px; font-weight:700;
    cursor:pointer; transition:all .2s;
  }
  .ew-attach-btn:hover {
    color:var(--ew-cyan);
    background:rgba(34,211,238,.08);
  }

  .ew-composer-right { display:flex; align-items:center; gap:12px; }

  .ew-char-count {
    font-size:10px; font-weight:600;
    font-family:'JetBrains Mono',monospace;
    color:rgba(255,255,255,.16);
    transition:color .2s;
  }

  .ew-shortcut {
    display:inline-flex; align-items:center; gap:4px;
    color:rgba(255,255,255,.14); font-size:10px; font-weight:600;
  }
  .ew-shortcut kbd {
    padding:2px 6px; border-radius:5px;
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.07);
    font-family:inherit; font-size:9px;
  }

  /* SEND button */
  .ew-send-btn {
    position:relative;
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 22px; border:none; border-radius:14px;
    color:#fff; font:inherit; font-weight:900;
    font-size:12px; letter-spacing:.06em;
    background: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
    cursor:pointer; overflow:hidden;
    box-shadow: 0 4px 22px rgba(79,70,229,.3);
    transition: all .3s cubic-bezier(.4,0,.2,1);
  }
  .ew-send-btn::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg,
      transparent 25%, rgba(255,255,255,.18) 50%, transparent 75%
    );
    transform:translateX(-120%);
    transition:transform .55s;
  }
  .ew-send-btn:hover {
    transform:translateY(-2px);
    box-shadow:0 8px 34px rgba(79,70,229,.42);
  }
  .ew-send-btn:hover::before { transform:translateX(120%); }
  .ew-send-btn:active { transform:translateY(0) scale(.97); }
  .ew-send-btn:disabled { opacity:.28; cursor:not-allowed; transform:none; box-shadow:none; }
  .ew-send-btn svg { position:relative; z-index:1; }

  /* ══════════════════════════════════════
     KEYFRAMES
  ══════════════════════════════════════ */
  @keyframes ew-pulse {
    from{ opacity:.35; } to{ opacity:1; }
  }

  /* ══════════════════════════════════════
     RESPONSIVE
  ══════════════════════════════════════ */
  @media(max-width:720px){
    .ew-chat{
      width:100vw; height:100vh;
      margin:0; border:0; border-radius:0;
    }
    .ew-chat__header{ padding:12px 14px; align-items:flex-start; }
    .ew-project-label,.ew-shortcut{ display:none; }
    .ew-bubble{ max-width:88%; }
    .ew-chat__messages{ padding:16px 12px; }
    .ew-chat__composer{ padding:10px 12px; }
    .ew-chat__brand-name{ font-size:14px; }
    .ew-uptime{ display:none; }
  }
</style>
</head>
<body>

<!-- ═══════════ UNIVERSE BACKGROUND ═══════════ -->
<div class="ew-universe">
  <div class="ew-universe__space"></div>
  <div class="ew-universe__grid"></div>
  <div class="ew-universe__scan"></div>
  <div class="ew-universe__aurora"></div>
  <div class="ew-orb ew-orb--1"></div>
  <div class="ew-orb ew-orb--2"></div>
  <div class="ew-orb ew-orb--3"></div>
  <div class="ew-stars" id="stars"></div>
  <div class="ew-particles" id="particles"></div>
</div>

<!-- ═══════════ CHAT ═══════════ -->
<div class="ew-chat">

  <!-- Glow top edge -->
  <div class="ew-chat__glow-top"></div>

  <!-- ── HEADER ── -->
  <header class="ew-chat__header">
    <div class="ew-chat__identity">

      <!-- TroxT Logo -->
      <div class="ew-chat__logo">
        <div class="ew-chat__logo-pulse"></div>
        <div class="ew-chat__logo-ring"></div>
        <div class="ew-chat__logo-bg"></div>
        <!-- Neural "T" icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="position:relative;z-index:1">
          <path d="M12 3 L12 21" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M5 3 L19 3"  stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="3" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="1.2" fill="#22d3ee"/>
          <path d="M9 12 L5 9"   stroke="#a855f7" stroke-width="1" opacity=".6" stroke-linecap="round"/>
          <path d="M9 12 L5 15"  stroke="#a855f7" stroke-width="1" opacity=".6" stroke-linecap="round"/>
          <path d="M15 12 L19 9"  stroke="#a855f7" stroke-width="1" opacity=".6" stroke-linecap="round"/>
          <path d="M15 12 L19 15" stroke="#a855f7" stroke-width="1" opacity=".6" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="ew-chat__brand">
        <span class="ew-chat__brand-name">TroxT</span>
        <span class="ew-chat__brand-sub">Etherworld Project</span>
        <span class="ew-chat__core-badge">Cerveau du Projet</span>
      </div>
    </div>

    <div class="ew-chat__toolbar">
      <div class="ew-chat__project-sel">
        <span class="ew-project-label">Module</span>
        <select>
          <option>Etherworld Core</option>
          <option>Neural Engine</option>
          <option>Memory Layer</option>
          <option>Interface Hub</option>
        </select>
      </div>

      <button class="ew-icon-btn" title="Historique des sessions">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
      </button>

      <button class="ew-icon-btn" title="Carte neurale">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
        </svg>
      </button>

      <button class="ew-icon-btn" title="Nouvelle session">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- ── STATUS BAR ── -->
  <div class="ew-chat__status">
    <div class="ew-status-dot ready" id="statusDot"></div>
    <span id="statusText">TroxT est actif — Systèmes nominaux</span>
    <div class="ew-status-wave">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="ew-chat__status-right">
      <span class="ew-model-badge">TroxT · Etherworld v1</span>
      <span class="ew-uptime" id="uptime">UP 00:00:00</span>
    </div>
  </div>

  <!-- ── MESSAGES ── -->
  <main class="ew-chat__messages" id="messages">

    <div class="ew-date-sep">Session active — Etherworld Project</div>

    <!-- System boot message -->
    <div class="ew-msg system" style="animation-delay:.05s">
      <div class="ew-avatar ew-avatar--system">⚡</div>
      <div class="ew-bubble">
        <div class="ew-meta">
          <strong class="ew-meta__name" style="background:linear-gradient(90deg,#fef3c7,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
            Système Etherworld
          </strong>
          <time class="ew-meta__time">09:00:00</time>
        </div>
        <p>TroxT initialisé · Cerveau du projet chargé · Mémoire longue restaurée (48 sessions) · Tous les modules Etherworld sont en ligne.</p>
      </div>
    </div>

    <!-- TroxT self-intro -->
    <div class="ew-msg" style="animation-delay:.1s">
      <div class="ew-avatar ew-avatar--troxt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L12 21" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 3L19 3"  stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="1" fill="#22d3ee"/>
        </svg>
      </div>
      <div class="ew-bubble ew-bubble--troxt">
        <div class="ew-meta">
          <strong class="ew-meta__name">TroxT</strong>
          <time class="ew-meta__time">09:00:01</time>
        </div>
        <p>Bonjour. Je suis <strong style="color:#67e8f9">TroxT</strong>, le cerveau central du projet <strong style="color:#c4b5fd">Etherworld</strong>.

Je coordonne tous les modules, mémorise le contexte global et prends les décisions architecturales. Comment puis-je t'aider aujourd'hui ?</p>

        <div class="ew-actions">
          <button class="ew-act-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copier
          </button>
          <button class="ew-act-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Régénérer
          </button>
        </div>
        <div class="ew-tokens">⚡ 94 tokens · 0.2s</div>
      </div>
    </div>

    <!-- User message -->
    <div class="ew-msg user" style="animation-delay:.15s">
      <div class="ew-avatar ew-avatar--user">E</div>
      <div class="ew-bubble">
        <div class="ew-meta">
          <strong class="ew-meta__name">Vous</strong>
          <time class="ew-meta__time">09:01</time>
        </div>
        <p>TroxT, génère le module de routing neural pour Etherworld. Je veux une architecture distribuée avec failover automatique.</p>
      </div>
    </div>

    <!-- TroxT response with code -->
    <div class="ew-msg" style="animation-delay:.2s">
      <div class="ew-avatar ew-avatar--troxt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L12 21" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 3L19 3"  stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="1" fill="#22d3ee"/>
        </svg>
      </div>
      <div class="ew-bubble ew-bubble--troxt">
        <div class="ew-meta">
          <strong class="ew-meta__name">TroxT</strong>
          <time class="ew-meta__time">09:01</time>
        </div>
        <p>Architecture neurale distribuée avec failover — module <code style="color:#67e8f9;font-family:'JetBrains Mono',monospace;font-size:12px">EtherRouter</code> :</p>

        <div class="ew-code">
          <span class="ew-code__lang">typescript</span>
<span class="cm">// EtherRouter — TroxT · Etherworld Core</span>
<span class="kw">export class</span> <span class="fn">EtherRouter</span> {
  <span class="kw">private</span> nodes: <span class="fn">NeuralNode</span>[] = [];
  <span class="kw">private</span> heartbeat = <span class="num">5000</span>; <span class="cm">// ms</span>

  <span class="kw">async</span> <span class="fn">route</span>(payload: <span class="fn">EtherPacket</span>) {
    <span class="kw">const</span> active = <span class="kw">this</span>.nodes
      .<span class="fn">filter</span>(n => n.status === <span class="str">'online'</span>)
      .<span class="fn">sort</span>((a, b) => a.load - b.load);

    <span class="kw">if</span> (!active.length) <span class="kw">throw new</span> <span class="fn">EtherError</span>(<span class="str">'NO_NODE'</span>);

    <span class="kw">try</span> {
      <span class="kw">return await</span> active[<span class="num">0</span>].<span class="fn">process</span>(payload);
    } <span class="kw">catch</span> {
      <span class="cm">// Failover automatique</span>
      <span class="kw">return await</span> <span class="kw">this</span>.<span class="fn">failover</span>(payload, active.<span class="fn">slice</span>(<span class="num">1</span>));
    }
  }
}
        </div>

        <p>Points clés :
• Load balancing automatique sur les nœuds actifs
• Failover en cascade vers le nœud suivant
• Heartbeat toutes les 5s pour détecter les pannes
• Typage fort via <code style="color:#67e8f9;font-family:'JetBrains Mono',monospace;font-size:12px">EtherPacket</code></p>

        <div class="ew-actions">
          <button class="ew-act-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copier
          </button>
          <button class="ew-act-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Régénérer
          </button>
          <button class="ew-act-btn">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            Sauvegarder
          </button>
        </div>
        <div class="ew-tokens">⚡ 612 tokens · 0.8s</div>
      </div>
    </div>

    <!-- User follow-up -->
    <div class="ew-msg user" style="animation-delay:.25s">
      <div class="ew-avatar ew-avatar--user">E</div>
      <div class="ew-bubble">
        <div class="ew-meta">
          <strong class="ew-meta__name">Vous</strong>
          <time class="ew-meta__time">09:03</time>
        </div>
        <p>Ajoute une couche de chiffrement end-to-end sur les paquets Ether.</p>
      </div>
    </div>

    <!-- TroxT thinking -->
    <div class="ew-msg" id="thinkingMsg" style="animation-delay:.3s">
      <div class="ew-avatar ew-avatar--troxt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L12 21" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 3L19 3"  stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="1" fill="#22d3ee"/>
        </svg>
      </div>
      <div class="ew-bubble ew-bubble--troxt">
        <div class="ew-meta">
          <strong class="ew-meta__name">TroxT</strong>
          <time class="ew-meta__time">09:03</time>
        </div>
        <div class="ew-thinking"><span></span><span></span><span></span></div>
      </div>
    </div>

  </main>

  <!-- ── COMPOSER ── -->
  <div class="ew-chat__composer">
    <div class="ew-composer-wrap">
      <textarea
        id="textarea"
        placeholder="Parle à TroxT — Cerveau d'Etherworld…"
        rows="2"
      ></textarea>
      <div class="ew-composer-bar">
        <div class="ew-composer-left">
          <button class="ew-attach-btn">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
            Fichier
          </button>
          <button class="ew-attach-btn">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            Contexte
          </button>
        </div>
        <div class="ew-composer-right">
          <span class="ew-char-count" id="charCount">0 / 8000</span>
          <span class="ew-shortcut"><kbd>⌘</kbd><kbd>↵</kbd></span>
          <button class="ew-send-btn" id="sendBtn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Envoyer à TroxT
          </button>
        </div>
      </div>
    </div>
  </div>

</div><!-- /.ew-chat -->

<script>
/* ═══ STAR FIELD ═══ */
(function(){
  const c = document.getElementById('stars');
  for(let i=0;i<120;i++){
    const s = document.createElement('div');
    s.className='ew-star';
    const size = .5 + Math.random()*2;
    s.style.cssText=`
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      width:${size}px; height:${size}px;
      animation-duration:${2+Math.random()*5}s;
      animation-delay:${-Math.random()*8}s;
    `;
    c.appendChild(s);
  }
})();

/* ═══ PARTICLE SYSTEM ═══ */
(function(){
  const c = document.getElementById('particles');
  const palette=['#22d3ee','#a855f7','#3b82f6','#ec4899','#22c55e'];
  for(let i=0;i<40;i++){
    const p=document.createElement('div');
    p.className='ew-particle';
    const color=palette[Math.floor(Math.random()*palette.length)];
    const size=1+Math.random()*2.5;
    p.style.cssText=`
      left:${Math.random()*100}%;
      width:${size}px; height:${size}px;
      background:${color};
      box-shadow:0 0 6px ${color};
      animation-duration:${9+Math.random()*14}s;
      animation-delay:${-Math.random()*22}s;
    `;
    c.appendChild(p);
  }
})();

/* ═══ UPTIME COUNTER ═══ */
(function(){
  const el = document.getElementById('uptime');
  let s = 0;
  setInterval(()=>{
    s++;
    const h = String(Math.floor(s/3600)).padStart(2,'0');
    const m = String(Math.floor(s%3600/60)).padStart(2,'0');
    const sec = String(s%60).padStart(2,'0');
    el.textContent = `UP ${h}:${m}:${sec}`;
  },1000);
})();

/* ═══ TEXTAREA ═══ */
const ta = document.getElementById('textarea');
const cc = document.getElementById('charCount');
ta.addEventListener('input',function(){
  const n=this.value.length;
  cc.textContent=`${n} / 8000`;
  cc.style.color = n>7500 ? 'rgba(251,113,133,.7)' : 'rgba(255,255,255,.16)';
  this.style.height='auto';
  this.style.height=Math.min(this.scrollHeight,180)+'px';
});

/* ═══ SCROLL TO BOTTOM ═══ */
const msgs = document.getElementById('messages');
msgs.scrollTop = msgs.scrollHeight;

/* ═══ SEND (demo) ═══ */
document.getElementById('sendBtn').addEventListener('click',()=>{
  const v = ta.value.trim();
  if(!v) return;

  // Add user message
  const row = document.createElement('div');
  row.className='ew-msg user';
  row.innerHTML=`
    <div class="ew-avatar ew-avatar--user">E</div>
    <div class="ew-bubble">
      <div class="ew-meta">
        <strong class="ew-meta__name">Vous</strong>
        <time class="ew-meta__time">${new Date().toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</time>
      </div>
      <p>${v.replace(/</g,'&lt;')}</p>
    </div>`;
  msgs.appendChild(row);

  ta.value=''; ta.style.height='auto';
  cc.textContent='0 / 8000';

  // Show thinking
  const think = document.createElement('div');
  think.className='ew-msg';
  think.innerHTML=`
    <div class="ew-avatar ew-avatar--troxt">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L12 21" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 3L19 3"  stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="1" fill="#22d3ee"/>
      </svg>
    </div>
    <div class="ew-bubble ew-bubble--troxt">
      <div class="ew-meta"><strong class="ew-meta__name">TroxT</strong></div>
      <div class="ew-thinking"><span></span><span></span><span></span></div>
    </div>`;
  msgs.appendChild(think);
  msgs.scrollTop = msgs.scrollHeight;

  // Status update
  document.getElementById('statusDot').className='ew-status-dot thinking';
  document.getElementById('statusText').textContent='TroxT traite ta demande…';

  setTimeout(()=>{
    think.remove();
    const rep = document.createElement('div');
    rep.className='ew-msg';
    rep.innerHTML=`
      <div class="ew-avatar ew-avatar--troxt">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L12 21" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 3L19 3"  stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2.5" fill="none" stroke="#67e8f9" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="1" fill="#22d3ee"/>
        </svg>
      </div>
      <div class="ew-bubble ew-bubble--troxt">
        <div class="ew-meta">
          <strong class="ew-meta__name">TroxT</strong>
          <time class="ew-meta__time">${new Date().toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</time>
        </div>
        <p>Reçu. J'intègre ça dans l'architecture <strong style="color:#67e8f9">Etherworld</strong> et je prépare la réponse optimale pour ton projet.</p>
        <div class="ew-tokens">⚡ Traité · Etherworld Core</div>
      </div>`;
    msgs.appendChild(rep);
    msgs.scrollTop = msgs.scrollHeight;
    document.getElementById('statusDot').className='ew-status-dot ready';
    document.getElementById('statusText').textContent='TroxT est actif — Systèmes nominaux';
  }, 1800);
});

/* ═══ KEYBOARD SHORTCUT ═══ */
ta.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){
    document.getElementById('sendBtn').click();
  }
});
</script>
</body>
</html>