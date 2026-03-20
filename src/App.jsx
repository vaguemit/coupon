import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────
const COUPONS = [
  { id: 'movie',   icon: '🎬', name: 'movie night',      desc: "your choice. i'll watch without a word." },
  { id: 'vent',    icon: '🫂', name: 'vent pass',        desc: 'i listen. no fixing, no advice. just here.' },
  { id: 'kiss',    icon: '💋', name: 'kiss on demand',   desc: 'no context needed.' },
  { id: 'cook',    icon: '👨‍🍳', name: 'i cook',          desc: 'one meal, cooked by me. your request.' },
  { id: 'game',    icon: '🎮', name: 'game night',       desc: 'your pick of the game. i play properly.' },
  { id: 'massage', icon: '💆', name: 'head massage',     desc: 'on demand. no negotiation.' },
  { id: 'drive',   icon: '🌙', name: 'late night drive', desc: 'just us, no destination.' },
];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const readStorage = () => {
  try {
    if (window.storage?.getItem) {
      const raw = window.storage.getItem('redemptions');
      return JSON.parse(raw || '[]');
    }
    return JSON.parse(window.localStorage.getItem('redemptions') || '[]');
  } catch { return []; }
};

const writeStorage = (data) => {
  try {
    const value = JSON.stringify(data);
    if (window.storage?.setItem) {
      window.storage.setItem('redemptions', value, { shared: true });
    } else {
      window.localStorage.setItem('redemptions', value);
    }
    window.dispatchEvent(new Event('storage_update'));
    return true;
  } catch { return false; }
};

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999',
    width: '100vw', height: '100vh',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#C9847A', '#FAF7F2', '#7A3B3B', '#E8C1BB'];
  const particles = Array.from({ length: 80 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 200,
    y: canvas.height * 0.6,
    vx: (Math.random() - 0.5) * 14,
    vy: -(Math.random() * 10 + 8),
    size: Math.random() * 7 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 12,
    aspect: Math.random() * 0.6 + 0.4,
  }));

  const startTime = Date.now();
  let rafId;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > 1500) { canvas.remove(); return; }
    const opacity = elapsed > 1000 ? Math.max(0, 1 - (elapsed - 1000) / 500) : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size * p.aspect / 2, p.size, p.size * p.aspect);
      ctx.restore();
    });
    rafId = requestAnimationFrame(animate);
  }
  animate();
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.emoji { font-size: 18px; font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif; }

/* ── AUTH ── */
.auth-wrap {
  min-height: 100vh;
  background: #FAF7F2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: #FAF7F2;
  border: 0.5px solid #E0D8D0;
  border-radius: 16px;
  padding: 2.5rem;
}

.auth-card.shake { animation: shake 400ms ease-in-out; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%,60%  { transform: translateX(-7px); }
  40%,80%  { transform: translateX(7px); }
}

.auth-title {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-weight: 400;
  font-size: 28px;
  color: #7A3B3B;
  text-align: center;
  margin-bottom: 4px;
  line-height: 1.2;
}

.auth-sub {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #A89F98;
  text-align: center;
  margin-bottom: 2rem;
}

.auth-input {
  display: block;
  width: 100%;
  background: transparent;
  border: 0.5px solid #D4C8C0;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #3D2B2B;
  margin-bottom: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.auth-input:focus { border-color: #C9847A; }
.auth-input.err   { border-color: #C9847A; animation: flash 400ms ease; }
@keyframes flash {
  0%,100% { border-color: #D4C8C0; }
  50%     { border-color: #C9847A; }
}

.auth-btn {
  display: block;
  width: 100%;
  background: #7A3B3B;
  color: #FAF7F2;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.25rem;
}
.auth-btn:hover { background: #5C2A2A; }

.auth-err-txt {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #C9847A;
  text-align: center;
  margin-top: 0.75rem;
}

/* ── HARDEE VIEW ── */
.hv-wrap {
  min-height: 100vh;
  background: #FAF7F2;
  position: relative;
}

.grain {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}

.whale-bob {
  position: fixed;
  top: 1.2rem;
  right: 1.5rem;
  font-size: 22px;
  animation: bob 3s ease-in-out infinite;
  z-index: 10;
  font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;
  line-height: 1;
  cursor: default;
  user-select: none;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

.hv-inner {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem;
  position: relative;
  z-index: 2;
}

.logout-btn {
  font-family: Arial, sans-serif;
  font-size: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
  transition: color 0.2s;
  display: block;
}
.logout-btn.light { color: #A89F98; }
.logout-btn.light:hover { color: #7A3B3B; }
.logout-btn.dark  { color: #6B6560; }
.logout-btn.dark:hover  { color: #C9847A; }

.hv-title {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-weight: 400;
  font-size: 32px;
  color: #7A3B3B;
  margin-bottom: 0.3rem;
  line-height: 1.1;
}

.hv-note {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #A89F98;
  line-height: 1.5;
}

.hr { border: none; border-top: 0.5px solid #E0D8D0; margin: 1rem 0 1.5rem; }
.hr-dark { border: none; border-top: 0.5px solid #2A2825; margin: 1.5rem 0; }

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 480px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

.card {
  background: #FFFFFF;
  border: 0.5px solid #E0D8D0;
  border-radius: 16px;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  transition: box-shadow 0.6s ease;
}
.card.pulsing { box-shadow: 0 0 0 3px #C9847A55; }

.card-icon {
  font-size: 20px;
  margin-bottom: 4px;
  font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;
  line-height: 1;
}

.card-title {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-weight: 500;
  font-size: 20px;
  color: #3D2B2B;
  line-height: 1.2;
}

.card-desc {
  font-family: Arial, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #A89F98;
  line-height: 1.5;
}

.badge {
  background: #F5EDE8;
  color: #7A3B3B;
  font-family: Arial, sans-serif;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.redeem-btn {
  margin-top: auto;
  align-self: flex-start;
  background: transparent;
  border: 0.5px solid #C9847A;
  color: #C9847A;
  border-radius: 8px;
  padding: 8px 18px;
  font-family: Arial, sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.redeem-btn:hover { background: #C9847A; color: #FAF7F2; }

/* Modal */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(61,43,43,0.25);
  z-index: 100;
  animation: fadein 250ms ease;
}
@keyframes fadein { from { opacity: 0; } to { opacity: 1; } }

.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  border-top: 0.5px solid #E0D8D0;
  padding: 2rem 1.5rem calc(2rem + env(safe-area-inset-bottom));
  z-index: 101;
  animation: slideup 250ms ease;
}
@keyframes slideup {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.sheet-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 0.5rem;
  font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;
  line-height: 1;
}

.sheet-title {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-size: 22px;
  color: #3D2B2B;
  margin-bottom: 0.25rem;
}

.sheet-sub {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #A89F98;
  margin-bottom: 1.5rem;
}

.sheet-btns { display: flex; gap: 0.75rem; }

.btn-cancel {
  flex: 1;
  background: transparent;
  border: 0.5px solid #E0D8D0;
  color: #A89F98;
  border-radius: 8px;
  padding: 12px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-cancel:hover { background: #F5EDE8; color: #7A3B3B; }

.btn-confirm {
  flex: 1;
  background: #7A3B3B;
  border: none;
  color: #FAF7F2;
  border-radius: 8px;
  padding: 12px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-confirm:hover { background: #5C2A2A; }

/* ── MIT VIEW ── */
.mv-wrap {
  min-height: 100vh;
  background: #0F0E0D;
}

.mv-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem;
  color: #E8E4DC;
}

.mv-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.mv-title {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-weight: 400;
  font-size: 32px;
  color: #E8E4DC;
  line-height: 1.1;
}

.mv-sync {
  font-family: Arial, sans-serif;
  font-size: 11px;
  color: #6B6560;
  white-space: nowrap;
  margin-left: 1rem;
}

.mv-sub {
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #6B6560;
  margin-bottom: 0;
}

.section-label {
  font-family: Arial, sans-serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #6B6560;
  margin-bottom: 0.75rem;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 0.5px solid #2A2825;
}
.status-row:first-child { border-top: 0.5px solid #2A2825; }

.status-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.s-icon {
  font-size: 16px;
  font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;
  line-height: 1;
}

.s-name {
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #E8E4DC;
}

.mv-badge {
  background: #1E1C1A;
  color: #C9847A;
  font-family: Arial, sans-serif;
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 999px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 0.5px solid #2A2825;
  animation: enter 300ms ease both;
}
@keyframes enter {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dot-wrap { margin-top: 5px; flex-shrink: 0; }
.dot-live {
  width: 8px; height: 8px; border-radius: 50%;
  background: #C9847A;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
.dot-dead { width: 8px; height: 8px; border-radius: 50%; background: #2A2825; }
@keyframes pulse-dot {
  0%,100% { transform: scale(1); opacity: 1; }
  50%     { transform: scale(1.55); opacity: 0.5; }
}

.log-name {
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #E8E4DC;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.log-icon {
  font-size: 14px;
  font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;
  line-height: 1;
}
.log-time {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #6B6560;
}

.empty {
  font-family: Arial, sans-serif;
  font-style: italic;
  font-size: 18px;
  color: #6B6560;
  text-align: center;
  padding: 3rem 0;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1E1C1A;
  color: #C9847A;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  z-index: 9000;
  white-space: nowrap;
  animation: fadein 250ms ease;
  pointer-events: none;
}
`;

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [name, setName]     = useState('');
  const [pass, setPass]     = useState('');
  const [shake, setShake]   = useState(false);
  const [error, setError]   = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim().toLowerCase();
    if (n === 'hardee' && pass === 'whale')   return onLogin('hardee');
    if (n === 'mit'    && pass === 'captain') return onLogin('mit');
    setShake(true);
    setError(true);
    setTimeout(() => setShake(false), 420);
  };

  return (
    <div className="auth-wrap">
      <div className={`auth-card${shake ? ' shake' : ''}`}>
        <div className="auth-title">Happy Birthday Bachaa <span className="emoji">🐋</span></div>
        <div className="auth-sub">enter your name and password</div>
        <form onSubmit={submit} noValidate>
          <input
            className={`auth-input${error ? ' err' : ''}`}
            type="text"
            placeholder="name"
            autoComplete="username"
            value={name}
            onChange={e => { setName(e.target.value); setError(false); }}
          />
          <input
            className={`auth-input${error ? ' err' : ''}`}
            type="password"
            placeholder="password"
            autoComplete="current-password"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(false); }}
          />
          <button className="auth-btn" type="submit">enter</button>
        </form>
        {error && <div className="auth-err-txt">wrong credentials, try again</div>}
      </div>
    </div>
  );
}

// ─── HARDEE VIEW ──────────────────────────────────────────────────────────────
function HardeeView({ onLogout, showToast }) {
  const [redemptions, setRedemptions] = useState(() => readStorage());
  const [modal, setModal]             = useState(null); // coupon object
  const [pulsingId, setPulsingId]     = useState(null);

  useEffect(() => {
    const refresh = () => setRedemptions(readStorage());
    window.addEventListener('storage', refresh);
    window.addEventListener('storage_update', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('storage_update', refresh);
    };
  }, []);

  const confirm = () => {
    if (!modal) return;
    const current = readStorage();
    const entry = {
      id: crypto.randomUUID(),
      couponId: modal.id,
      couponName: modal.name,
      redeemedAt: new Date().toISOString(),
    };
    const next = [...current, entry];
    const ok = writeStorage(next);
    setModal(null);
    if (!ok) { showToast('sync failed'); return; }
    setRedemptions(next);
    triggerConfetti();
    setPulsingId(modal.id);
    setTimeout(() => setPulsingId(null), 650);
  };

  return (
    <div className="hv-wrap">
      <div className="grain" aria-hidden />
      <div className="whale-bob" aria-hidden>🐋</div>

      <div className="hv-inner">
        <button className="logout-btn light" onClick={onLogout}>leave</button>

        <h1 className="hv-title">for hardee.</h1>
        <p className="hv-note">hey hardee. these are yours. use them carefully, or don't. — mit 🐋</p>
        <hr className="hr" />

        <div className="grid">
          {COUPONS.map(c => {
            const count = redemptions.filter(r => r.couponId === c.id).length;
            return (
              <div key={c.id} className={`card${pulsingId === c.id ? ' pulsing' : ''}`}>
                <div className="card-icon">{c.icon}</div>
                <div className="card-title">{c.name}</div>
                <div className="card-desc">{c.desc}</div>
                <div className="badge">redeemed {count} {count === 1 ? 'time' : 'times'}</div>
                <button className="redeem-btn" onClick={() => setModal(c)}>redeem</button>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <>
          <div className="overlay" onClick={() => setModal(null)} />
          <div className="sheet" role="dialog" aria-modal="true">
            <span className="sheet-icon">{modal.icon}</span>
            <div className="sheet-title">{modal.name}</div>
            <div className="sheet-sub">redeem this coupon?</div>
            <div className="sheet-btns">
              <button className="btn-cancel" onClick={() => setModal(null)}>cancel</button>
              <button className="btn-confirm" onClick={confirm}>yes, redeem</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MIT VIEW ────────────────────────────────────────────────────────────────
function formatTimestamp(iso) {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const time  = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${month} · ${time}`;
}

function MitView({ onLogout }) {
  const [redemptions, setRedemptions] = useState(() => readStorage());
  const [secsAgo, setSecsAgo]         = useState(0);
  const syncRef = useRef(Date.now());

  useEffect(() => {
    const load = () => {
      setRedemptions(readStorage());
      syncRef.current = Date.now();
      setSecsAgo(0);
    };

    load();
    const poll   = setInterval(load, 10000);
    const ticker = setInterval(() => setSecsAgo(Math.floor((Date.now() - syncRef.current) / 1000)), 1000);

    const onStorageUpdate = () => load();
    window.addEventListener('storage', onStorageUpdate);
    window.addEventListener('storage_update', onStorageUpdate);

    return () => {
      clearInterval(poll);
      clearInterval(ticker);
      window.removeEventListener('storage', onStorageUpdate);
      window.removeEventListener('storage_update', onStorageUpdate);
    };
  }, []);

  const sorted = COUPONS
    .map(c => ({ ...c, count: redemptions.filter(r => r.couponId === c.id).length }))
    .sort((a, b) => b.count - a.count);

  const log = [...redemptions].sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));

  return (
    <div className="mv-wrap">
      <div className="mv-inner">
        <button className="logout-btn dark" onClick={onLogout}>leave</button>

        <div className="mv-top">
          <h1 className="mv-title">captain's log. <span className="emoji" style={{ fontSize: 22 }}>🐋</span></h1>
          <div className="mv-sync">synced {secsAgo}s ago</div>
        </div>
        <p className="mv-sub">tracking hardee's redemptions in real time.</p>
        <hr className="hr-dark" />

        <div className="section-label">coupon status</div>
        <div>
          {sorted.map(c => (
            <div className="status-row" key={c.id}>
              <div className="status-left">
                <span className="s-icon">{c.icon}</span>
                <span className="s-name">{c.name}</span>
              </div>
              <div className="mv-badge">{c.count}</div>
            </div>
          ))}
        </div>

        <hr className="hr-dark" />
        <div className="section-label">redemption log</div>

        {log.length === 0 ? (
          <div className="empty">nothing yet. waiting.</div>
        ) : (
          log.map((entry, i) => {
            const coupon = COUPONS.find(c => c.id === entry.couponId);
            return (
              <div className="log-entry" key={entry.id}>
                <div className="dot-wrap">
                  {i === 0 ? <div className="dot-live" /> : <div className="dot-dead" />}
                </div>
                <div>
                  <div className="log-name">
                    <span className="log-icon">{coupon?.icon ?? '🎟️'}</span>
                    {entry.couponName}
                  </div>
                  <div className="log-time">{formatTimestamp(entry.redeemedAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]   = useState(null);
  const [toast, setToast] = useState('');
  const toastRef          = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {user === null    && <LoginView onLogin={setUser} />}
      {user === 'hardee' && <HardeeView onLogout={() => setUser(null)} showToast={showToast} />}
      {user === 'mit'    && <MitView   onLogout={() => setUser(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
