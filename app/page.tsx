import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Shield, Key, TestTube, Lock, Eye, Zap, Search, AlertTriangle, BookOpen } from "lucide-react"

// =============================================================================
// HOMEPAGE — redesign matching terminal aesthetic
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600&display=swap');

  .hp * { box-sizing: border-box; }
  .hp { font-family: 'Sora', sans-serif; min-height: 100vh; padding: 56px 16px 80px; }

  /* HERO */
  .hp-hero { max-width: 720px; margin: 0 auto 72px; text-align: center; }
  .hp-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: oklch(0.55 0.12 160 / 0.1); border: 1px solid oklch(0.55 0.12 160 / 0.25);
    border-radius: 20px; padding: 5px 16px; font-size: 12px;
    color: oklch(0.65 0.12 160); font-family: 'JetBrains Mono', monospace;
    margin-bottom: 28px; letter-spacing: 0.04em;
  }
  .hp-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: oklch(0.65 0.12 160);
    animation: hp-pulse 2s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes hp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

  .hp-title {
    font-size: clamp(36px, 6vw, 62px);
    font-weight: 600; line-height: 1.12; margin-bottom: 6px;
    letter-spacing: -0.02em;
  }
  .hp-title-accent {
    font-family: 'JetBrains Mono', monospace;
    color: oklch(0.65 0.12 160); font-weight: 700;
    display: block;
  }
  .hp-sub {
    font-size: clamp(15px, 2vw, 18px); color: var(--muted-foreground);
    line-height: 1.65; max-width: 540px; margin: 20px auto 36px;
  }

  .hp-cta-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .hp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 500;
    text-decoration: none; cursor: pointer; transition: all 0.18s;
    border: 1px solid; letter-spacing: 0.01em;
  }
  .hp-btn.primary {
    background: oklch(0.55 0.12 160); color: white;
    border-color: oklch(0.55 0.12 160);
    box-shadow: 0 4px 14px oklch(0.55 0.12 160 / 0.25);
  }
  .hp-btn.primary:hover {
    background: oklch(0.6 0.14 160);
    box-shadow: 0 6px 20px oklch(0.55 0.12 160 / 0.35);
    transform: translateY(-1px);
  }
  .hp-btn.secondary {
    background: transparent; color: var(--foreground);
    border-color: var(--border);
  }
  .hp-btn.secondary:hover { background: var(--muted); transform: translateY(-1px); }

  /* CARDS GRID */
  .hp-grid {
    max-width: 960px; margin: 0 auto 72px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  }
  @media (max-width: 768px) { .hp-grid { grid-template-columns: 1fr; } }
  @media (min-width: 769px) and (max-width: 1024px) { .hp-grid { grid-template-columns: 1fr 1fr; } }

  .hp-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 14px;
    text-decoration: none; transition: all 0.2s; position: relative; overflow: hidden;
  }
  .hp-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 16px;
    opacity: 0; transition: opacity 0.2s;
  }
  .hp-card:hover { transform: translateY(-3px); }
  .hp-card:hover::before { opacity: 1; }

  .hp-card.green:hover { border-color: oklch(0.55 0.12 160 / 0.5); box-shadow: 0 8px 24px oklch(0.55 0.12 160 / 0.1); }
  .hp-card.blue:hover  { border-color: oklch(0.55 0.12 220 / 0.5); box-shadow: 0 8px 24px oklch(0.55 0.12 220 / 0.1); }
  .hp-card.purple:hover{ border-color: oklch(0.55 0.1 280 / 0.5);  box-shadow: 0 8px 24px oklch(0.55 0.1 280 / 0.1); }
  .hp-card.red:hover   { border-color: oklch(0.55 0.18 30 / 0.5);  box-shadow: 0 8px 24px oklch(0.55 0.18 30 / 0.1); }
  .hp-card.cyan:hover  { border-color: oklch(0.55 0.1 200 / 0.5);  box-shadow: 0 8px 24px oklch(0.55 0.1 200 / 0.1); }

  .hp-card-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .hp-card-icon.green  { background: oklch(0.55 0.12 160 / 0.12); color: oklch(0.65 0.12 160); }
  .hp-card-icon.blue   { background: oklch(0.55 0.12 220 / 0.12); color: oklch(0.65 0.12 220); }
  .hp-card-icon.purple { background: oklch(0.55 0.1 280 / 0.12);  color: oklch(0.65 0.1 280); }
  .hp-card-icon.red    { background: oklch(0.55 0.18 30 / 0.12);  color: oklch(0.6 0.18 30); }
  .hp-card-icon.cyan   { background: oklch(0.55 0.1 200 / 0.12);  color: oklch(0.65 0.1 200); }

  .hp-card-title { font-size: 15px; font-weight: 600; line-height: 1.3; }
  .hp-card-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.6; flex: 1; }
  .hp-card-link { font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 4px; margin-top: auto; }
  .hp-card.green  .hp-card-link { color: oklch(0.65 0.12 160); }
  .hp-card.blue   .hp-card-link { color: oklch(0.65 0.12 220); }
  .hp-card.purple .hp-card-link { color: oklch(0.65 0.1 280); }
  .hp-card.red    .hp-card-link { color: oklch(0.6 0.18 30); }
  .hp-card.cyan   .hp-card-link { color: oklch(0.65 0.1 200); }

  /* TRUST PILLARS */
  .hp-trust { max-width: 760px; margin: 0 auto; }
  .hp-trust-title {
    text-align: center; font-size: clamp(18px, 3vw, 24px);
    font-weight: 600; margin-bottom: 32px; letter-spacing: -0.01em;
  }
  .hp-trust-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  @media (max-width: 600px) { .hp-trust-grid { grid-template-columns: 1fr; } }

  .hp-trust-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .hp-trust-icon {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .hp-trust-icon.green  { background: oklch(0.55 0.12 160 / 0.12); color: oklch(0.65 0.12 160); }
  .hp-trust-icon.blue   { background: oklch(0.55 0.12 220 / 0.12); color: oklch(0.65 0.12 220); }
  .hp-trust-icon.amber  { background: oklch(0.6 0.15 80 / 0.12);   color: oklch(0.65 0.15 80); }
  .hp-trust-name { font-size: 14px; font-weight: 500; }
  .hp-trust-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.55; }

  /* STAT BAR */
  .hp-stat-bar {
    max-width: 960px; margin: 0 auto 72px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 28px;
    display: flex; align-items: center; justify-content: space-around;
    flex-wrap: wrap; gap: 16px;
  }
  .hp-stat { text-align: center; }
  .hp-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: oklch(0.65 0.12 160); }
  .hp-stat-label { font-size: 11px; color: var(--muted-foreground); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
  .hp-stat-div { width: 1px; height: 36px; background: var(--border); }
  @media (max-width: 500px) { .hp-stat-div { display: none; } }
`

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <style>{STYLES}</style>

      <div className="hp">

        {/* HERO */}
        <div className="hp-hero">
          <div className="hp-badge">
            <div className="hp-badge-dot" />
            Zero-knowledge · CSPRNG · k-Anonymity
          </div>
          <h1 className="hp-title">
            Chraňte svou
            <span className="hp-title-accent">digitální identitu</span>
          </h1>
          <p className="hp-sub">
            Profesionální nástroje pro zabezpečení hesel navržené s kryptografickou přesností.
            Generujte, testujte a ověřujte svá hesla — vše lokálně ve vašem prohlížeči.
          </p>
          <div className="hp-cta-row">
            <Link href="/generator" className="hp-btn primary">
              <Key style={{ width: 17, height: 17 }} />
              Vygenerovat heslo
            </Link>
            <Link href="/test" className="hp-btn secondary">
              <Search style={{ width: 17, height: 17 }} />
              Analyzovat heslo
            </Link>
          </div>
        </div>

        {/* STAT BAR */}
        <div className="hp-stat-bar">
          {[
            { val: "600M+", label: "Uniklých hesel v HIBP" },
            { val: "128-bit", label: "Max. entropie generátoru" },
            { val: "0 B", label: "Data odeslaná na server" },
            { val: "5 znaků", label: "SHA-1 prefix k-Anonymity" },
          ].map((s, i, arr) => (
            <>
              <div key={s.val} className="hp-stat">
                <div className="hp-stat-val">{s.val}</div>
                <div className="hp-stat-label">{s.label}</div>
              </div>
              {i < arr.length - 1 && <div key={`d${i}`} className="hp-stat-div" />}
            </>
          ))}
        </div>

        {/* FEATURE CARDS */}
        <div className="hp-grid">
          <Link href="/generator" className="hp-card green">
            <div className="hp-card-icon green"><Key style={{ width: 22, height: 22 }} /></div>
            <div className="hp-card-title">Generátor hesel</div>
            <div className="hp-card-desc">Kryptograficky silná hesla s nastavitelnou délkou, znakovými sadami a minimálními počty. CSPRNG + Fisher-Yates shuffle.</div>
            <div className="hp-card-link">Vygenerovat heslo →</div>
          </Link>

          <Link href="/test" className="hp-card blue">
            <div className="hp-card-icon blue"><TestTube style={{ width: 22, height: 22 }} /></div>
            <div className="hp-card-title">Analyzátor síly hesla</div>
            <div className="hp-card-desc">Lokální analýza odolnosti (zxcvbn) kombinovaná s kontrolou v databázi 600M+ uniklých hesel přes HIBP k-Anonymity.</div>
            <div className="hp-card-link">Analyzovat heslo →</div>
          </Link>

          <Link href="/utocnici" className="hp-card red">
            <div className="hp-card-icon red"><AlertTriangle style={{ width: 22, height: 22 }} /></div>
            <div className="hp-card-title">Metody útoků</div>
            <div className="hp-card-desc">Interaktivní přehled útočných technik — brute force, phishing, credential stuffing a další. Krok za krokem bez žargonu.</div>
            <div className="hp-card-link">Zjistit jak útočníci myslí →</div>
          </Link>

          <Link href="/osveta" className="hp-card cyan">
            <div className="hp-card-icon cyan"><BookOpen style={{ width: 22, height: 22 }} /></div>
            <div className="hp-card-title">Osvěta & zprávy</div>
            <div className="hp-card-desc">Živé zprávy z českých kyberbezpečnostních zdrojů (NÚKIB, CERT, Root.cz) + kompletní průvodce bezpečností hesel.</div>
            <div className="hp-card-link">Přečíst aktuální zprávy →</div>
          </Link>

          <div className="hp-card" style={{ gridColumn: "span 2", cursor: "default" }}>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center", height: "100%" }}>
              {[
                { icon: <Eye style={{ width: 20, height: 20 }} />, title: "Nulové znalosti", desc: "Všechny operace probíhají na straně klienta. Vaše hesla nikdy neopustí vaše zařízení.", color: "green" },
                { icon: <Shield style={{ width: 20, height: 20 }} />, title: "Šifrované kontroly", desc: "Úniky dat ověřujeme přes k-Anonymity — odesíláme pouze 5 znaků SHA-1 hashe.", color: "blue" },
                { icon: <Zap style={{ width: 20, height: 20 }} />, title: "Okamžité výsledky", desc: "Generování a analýza hesel v reálném čase — žádný server, žádná latence.", color: "amber" },
              ].map(f => (
                <div key={f.title} style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className={`hp-trust-icon ${f.color}`} style={{ margin: 0 }}>{f.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
