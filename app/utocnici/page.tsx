"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Key, TestTube } from "lucide-react"

// =============================================================================
// TYPY
// =============================================================================

interface Step { label: string; desc: string }

interface AttackData {
  id: string
  icon: string
  title: string
  subtitle: string
  danger: "Kritické" | "Vysoké" | "Střední"
  accentColor: string
  steps: Step[]
  animLabel: string
  animType: string
  tipText: string
}

// =============================================================================
// DATA
// =============================================================================

const ATTACKS: AttackData[] = [
  {
    id: "brute", icon: "⚡",
    title: "Útok hrubou silou", subtitle: "Zkouší každou kombinaci znaků",
    danger: "Kritické", accentColor: "#ef4444",
    steps: [
      { label: "Útočník najde přihlašovací formulář", desc: "Vyhledá webovou stránku nebo aplikaci s přihlašovacím polem. Cíl: vaše heslo." },
      { label: "Spustí automatizovaný program", desc: "Speciální software zkouší hesla automaticky — tisíce za sekundu, 24/7 bez přestávky." },
      { label: "Zkouší kombinace systematicky", desc: "Začne od 'aaa', pokračuje 'aab', 'aac'… projde každou možnou kombinaci znaků." },
      { label: "Nalezne shodu — přihlásí se", desc: "Jakmile program narazí na vaše heslo, útočník okamžitě dostane přístup k vašemu účtu." },
    ],
    animLabel: "Program zkouší:", animType: "brute",
    tipText: "Heslo 12+ znaků prodlouží dobu útoku z minut na stovky let.",
  },
  {
    id: "dict", icon: "📖",
    title: "Slovníkový útok", subtitle: "Zkouší běžná slova a jejich variace",
    danger: "Kritické", accentColor: "#f97316",
    steps: [
      { label: "Stáhne seznam reálných hesel", desc: "RockYou seznam obsahuje 14 milionů hesel z reálných úniků — volně dostupný." },
      { label: "Program přidá chytré variace", desc: "Automaticky zkouší heslo1, Heslo!, h3sl0, HESLO123 — všechny vzory jsou ve slovníku." },
      { label: "Zkouší miliony hesel za sekundu", desc: "Je to 100× rychlejší než brute force, protože zkouší jen reálná hesla." },
      { label: "Vaše 'chytré' heslo selže", desc: "Heslo123!, Passworld@ nebo Léto2024 jsou ve slovnících. Útočník je prolomí za sekundy." },
    ],
    animLabel: "Ze slovníku zkouší:", animType: "dict",
    tipText: "Žádná slovní hesla. Heslo musí být náhodné — ne 'chytré'.",
  },
  {
    id: "phishing", icon: "🎣",
    title: "Phishing", subtitle: "Podvodná přihlašovací stránka",
    danger: "Kritické", accentColor: "#eab308",
    steps: [
      { label: "Vytvoří falešnou stránku", desc: "Zkopíruje přihlašovací stránku banky nebo Googlu — pixel po pixelu. Vypadá identicky." },
      { label: "Pošle podvodný e-mail", desc: "'Váš účet byl pozastaven.' Odkaz vede na falešnou stránku, ne na originál." },
      { label: "Oběť zadá heslo sama", desc: "Uživatel zadá jméno a heslo — a odešle je přímo útočníkovi. Nic netuší." },
      { label: "Útočník se přihlásí", desc: "Ani nejsilnější heslo nepomůže — zadali jste ho sami na falešné stránce." },
    ],
    animLabel: "Falešné URL:", animType: "phishing",
    tipText: "Vždy kontrolujte URL v adresním řádku. Hardwarový klíč (FIDO2) je phishing-proof.",
  },
  {
    id: "stuffing", icon: "📋",
    title: "Credential stuffing", subtitle: "Uniklá hesla zkoušená všude",
    danger: "Vysoké", accentColor: "#8b5cf6",
    steps: [
      { label: "Někde dojde k úniku dat", desc: "LinkedIn, Adobe, Facebook — hesla milionů uživatelů uniknou na internet." },
      { label: "Koupí seznam na dark webu", desc: "Miliardy kombinací email+heslo jsou k dispozici za pár dolarů." },
      { label: "Bot zkouší heslo na jiných webech", desc: "Automaticky testuje na Gmailu, bankovnictví, e-shopu. Spoléhá na opakování hesel." },
      { label: "Jeden únik = všechny účty", desc: "Stejné heslo na 5 místech = jeden únik kompromituje vše. Útočník to ví." },
    ],
    animLabel: "Bot zkouší na webech:", animType: "stuffing",
    tipText: "Každý účet musí mít unikátní heslo. Správce hesel to za vás vyřeší.",
  },
  {
    id: "rainbow", icon: "🌈",
    title: "Rainbow table útok", subtitle: "Předpočítané hashe hesel",
    danger: "Vysoké", accentColor: "#06b6d4",
    steps: [
      { label: "Web ukládá hesla jako hash", desc: "'kocka123' → '5f4dcc3b5aa765d6…'. Vypadá bezpečně, ale bez soli je zranitelné." },
      { label: "Útočník má obří tabulku hashů", desc: "Někdo předem spočítal hashe milionů hesel. Vyhledávání trvá milisekundy." },
      { label: "Porovná hash s tabulkou", desc: "Hash '5f4dcc3b…' najde v tabulce a okamžitě ví: heslo je 'password'." },
      { label: "Heslo odhaleno bez lámání", desc: "Rainbow table mění prolomení hashů na prosté vyhledávání. Sekundy, ne hodiny." },
    ],
    animLabel: "Vyhledává v tabulce:", animType: "rainbow",
    tipText: "Weby musí používat salt + bcrypt/Argon2. Rainbow tables pak přestanou fungovat.",
  },
  {
    id: "keylogger", icon: "🖱️",
    title: "Keylogger / malware", subtitle: "Zachytává každý stisk klávesy",
    danger: "Střední", accentColor: "#4ade80",
    steps: [
      { label: "Zařízení se nakazí nechtěně", desc: "Nelegální software, podezřelý odkaz nebo příloha v e-mailu. Virus se nainstaluje tiše." },
      { label: "Keylogger běží nepozorovaně", desc: "Zaznamenává každý stisk klávesy. Vy nic nevidíte, nic se nezpomaluje." },
      { label: "Zadáte heslo do pole", desc: "V tu chvíli keylogger zaznamená: 'h-e-s-l-o-1-2-3'. S kontextem — na jakém webu." },
      { label: "Záznamy odeslány útočníkovi", desc: "Pravidelně nebo v reálném čase jsou klávesy odeslány na server útočníka." },
    ],
    animLabel: "Keylogger zaznamenal:", animType: "keylogger",
    tipText: "Aktuální antivirus. FIDO2 klíč zachrání účet i při aktivním keyloggeru.",
  },
]

const ANIM_SEQ: Record<string, string[]> = {
  brute:     ["aaaa","aaab","aaac","aaba","abaa","password","letmein","qwerty1","iloveyou","monkey1","login123","12345678"],
  dict:      ["heslo","heslo1","Heslo123!","H3sl0!23","p@ssword","P@ssw0rd!","l3tm3in!","Kocka2024!","Admin123!","qwerty"],
  phishing:  ["g00gle.com/login","gooogle.com","google-security.net","accounts-google.verify-now.com","googIe.com (I≠l)"],
  stuffing:  ["gmail.com ✗","facebook.com ✗","netflix.com ✗","amazon.com ✗","bank.cz ✗","paypal.com ✗","seznam.cz ✓ PŘÍSTUP!"],
  rainbow:   ["hash 5f4dcc3b → 'password'","hash e10adc39 → '123456'","hash 25d55ad2 → '12345678'","NALEZENO → 'kocka123'"],
  keylogger: ["[chrome] g-m-a-i-l-.-c-o-m","[gmail] h-e-s-l-o-1-2-3","[bank.cz] p-i-n-:-1-2-3-4","ODESLÁNO na server ✓"],
}

// =============================================================================
// STYLY
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600&display=swap');

  .atk-page * { box-sizing: border-box; }
  .atk-page { font-family: 'Sora', sans-serif; min-height: 100vh; padding: 32px 16px 64px; }

  /* HERO */
  .atk-hero { max-width: 900px; margin: 0 auto 32px; text-align: center; }
  .atk-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: oklch(0.5 0.18 30 / 0.1); border: 1px solid oklch(0.5 0.18 30 / 0.25);
    border-radius: 20px; padding: 4px 14px; font-size: 11px;
    color: oklch(0.6 0.18 30); font-family: 'JetBrains Mono', monospace;
    margin-bottom: 16px; letter-spacing: 0.04em;
  }
  .atk-title { font-size: clamp(24px,4vw,36px); font-weight: 600; margin-bottom: 10px; }
  .atk-sub { font-size: 14px; color: var(--muted-foreground); line-height: 1.6; max-width: 560px; margin: 0 auto; }

  /* GRID */
  .atk-grid { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 10px; }
  @media (max-width: 820px) { .atk-grid { grid-template-columns: 1fr; } }

  /* CARD */
  .atk-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden; cursor: pointer;
    transition: border-color 0.2s, transform 0.15s;
  }
  .atk-card:hover { transform: translateY(-2px); }
  .atk-card.open { transform: none; }

  .atk-header { padding: 14px 16px 10px; display: flex; align-items: center; gap: 12px; }
  .atk-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .atk-info { flex: 1; min-width: 0; }
  .atk-title-text { font-size: 14px; font-weight: 600; }
  .atk-subtitle { font-size: 11px; color: var(--muted-foreground); margin-top: 1px; }
  .atk-badge-danger {
    font-size: 10px; font-weight: 700; padding: 3px 8px;
    border-radius: 5px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.05em;
  }

  .atk-hint { padding: 0 16px 10px; font-size: 11px; color: var(--muted-foreground); display: flex; align-items: center; gap: 4px; }
  .atk-chevron { transition: transform 0.3s; display: inline-block; font-style: normal; font-size: 10px; }
  .atk-chevron.open { transform: rotate(180deg); }

  /* SCENE */
  .atk-scene { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1); }
  .atk-scene.open { max-height: 600px; }
  .atk-scene-inner { border-top: 1px solid var(--border); padding: 14px 16px 16px; }

  /* STEPS */
  .atk-steps { display: flex; flex-direction: column; }
  .atk-step {
    display: flex; gap: 10px; padding: 8px 0;
    opacity: 0; transform: translateX(-6px);
    transition: opacity 0.3s, transform 0.3s; position: relative;
  }
  .atk-step.visible { opacity: 1; transform: none; }
  .atk-step-line { position: absolute; left: 11px; top: 32px; width: 1px; bottom: 0; background: var(--border); }
  .atk-step-num {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; flex-shrink: 0;
    position: relative; z-index: 1; font-family: 'JetBrains Mono', monospace;
  }
  .atk-step-body { flex: 1; padding-top: 2px; }
  .atk-step-label { font-size: 12px; font-weight: 500; margin-bottom: 2px; }
  .atk-step-desc { font-size: 11px; color: var(--muted-foreground); line-height: 1.5; }

  /* PROGRESS */
  .atk-progress { height: 2px; background: var(--border); border-radius: 1px; margin: 10px 0 12px; overflow: hidden; }
  .atk-progress-fill { height: 100%; border-radius: 1px; transition: width 0.4s ease; }

  /* TERMINAL */
  .atk-terminal {
    background: var(--background); border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden; margin-bottom: 12px;
  }
  .atk-terminal-bar { padding: 6px 10px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 5px; }
  .atk-terminal-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); }
  .atk-terminal-label { font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.06em; margin-left: 4px; }
  .atk-terminal-body { padding: 10px 12px; min-height: 60px; }
  .atk-terminal-prev { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted-foreground); opacity: 0.4; margin-bottom: 2px; display: block; }
  .atk-terminal-cur { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--foreground); }
  .atk-terminal-cursor { display: inline-block; width: 7px; height: 13px; background: currentColor; vertical-align: middle; margin-left: 2px; animation: atk-blink 1s infinite; }
  @keyframes atk-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* TIP */
  .atk-tip { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 8px; border: 1px solid; font-size: 12px; line-height: 1.5; }
  .atk-tip-icon { font-size: 14px; flex-shrink: 0; }

  /* CTA */
  .atk-cta { max-width: 900px; margin: 24px auto 0; text-align: center; padding: 32px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; }
  .atk-cta-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  .atk-cta-sub { font-size: 13px; color: var(--muted-foreground); margin-bottom: 20px; line-height: 1.6; }
  .atk-cta-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .atk-cta-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 10px; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none;
    transition: all 0.15s;
  }
  .atk-cta-btn.primary { background: oklch(0.55 0.12 160); color: white; border: 1px solid oklch(0.55 0.12 160); }
  .atk-cta-btn.primary:hover { background: oklch(0.6 0.14 160); }
  .atk-cta-btn.secondary { background: transparent; color: var(--foreground); border: 1px solid var(--border); }
  .atk-cta-btn.secondary:hover { background: var(--muted); }
`

// =============================================================================
// KARTA ÚTOKU
// =============================================================================

function AttackCard({ attack }: { attack: AttackData }) {
  const [open, setOpen]           = useState(false)
  const [visible, setVisible]     = useState<number[]>([])
  const [animText, setAnimText]   = useState("")
  const [animPrev, setAnimPrev]   = useState("")
  const [progress, setProgress]   = useState(0)
  const animRef  = useRef<NodeJS.Timeout | null>(null)
  const timers   = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    if (!open) {
      setVisible([]); setProgress(0); setAnimText(""); setAnimPrev("")
      if (animRef.current) clearInterval(animRef.current)
      timers.current.forEach(clearTimeout); timers.current = []
      return
    }
    attack.steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisible(v => [...v, i])
        setProgress(Math.round(((i+1)/attack.steps.length)*100))
      }, 250 + i * 480)
      timers.current.push(t)
    })
    const seq = ANIM_SEQ[attack.animType] || []
    let idx = 0
    const run = () => { setAnimPrev(seq[(idx-1+seq.length)%seq.length]||""); setAnimText(seq[idx%seq.length]); idx++ }
    run(); animRef.current = setInterval(run, 850)
    return () => { if (animRef.current) clearInterval(animRef.current); timers.current.forEach(clearTimeout) }
  }, [open, attack])

  const ac = attack.accentColor
  const dangerBg   = ac + "18"
  const dangerText = ac

  return (
    <div
      className={`atk-card ${open ? "open" : ""}`}
      style={{ borderColor: open ? `${ac}50` : undefined }}
      onClick={() => setOpen(v => !v)}
    >
      <div className="atk-header">
        <div className="atk-icon" style={{ background: ac + "18" }}>{attack.icon}</div>
        <div className="atk-info">
          <div className="atk-title-text">{attack.title}</div>
          <div className="atk-subtitle">{attack.subtitle}</div>
        </div>
        <div className="atk-badge-danger" style={{ background: dangerBg, color: dangerText }}>
          {attack.danger}
        </div>
      </div>

      <div className="atk-hint">
        <span className={`atk-chevron ${open ? "open" : ""}`}>▾</span>
        <span>Klikni pro animaci útoku</span>
      </div>

      <div className={`atk-scene ${open ? "open" : ""}`}>
        <div className="atk-scene-inner">
          <div className="atk-steps">
            {attack.steps.map((step, i) => (
              <div key={i} className={`atk-step ${visible.includes(i) ? "visible" : ""}`}>
                {i < attack.steps.length - 1 && <div className="atk-step-line" />}
                <div className="atk-step-num" style={{ background: ac + "20", color: ac }}>{i+1}</div>
                <div className="atk-step-body">
                  <div className="atk-step-label">{step.label}</div>
                  <div className="atk-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="atk-progress">
            <div className="atk-progress-fill" style={{ width:`${progress}%`, background: ac }} />
          </div>

          <div className="atk-terminal">
            <div className="atk-terminal-bar">
              <div className="atk-terminal-dot" style={{ background: ac + "80" }} />
              <div className="atk-terminal-dot" />
              <div className="atk-terminal-dot" />
              <span className="atk-terminal-label">{attack.animLabel}</span>
            </div>
            <div className="atk-terminal-body">
              {animPrev && <span className="atk-terminal-prev">{animPrev}</span>}
              <span className="atk-terminal-cur">
                {animText}
                <span className="atk-terminal-cursor" style={{ color: ac }} />
              </span>
            </div>
          </div>

          <div className="atk-tip" style={{ background: ac + "0d", borderColor: ac + "33", color: ac }}>
            <span className="atk-tip-icon">🛡</span>
            <span style={{ color: "var(--foreground)", opacity: 0.85 }}>{attack.tipText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STRÁNKA
// =============================================================================

export default function UtocniciPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <style>{STYLES}</style>

      <div className="atk-page">
        <div className="atk-hero">
          <div className="atk-badge">⚠ Jak útočníci kradou hesla</div>
          <h1 className="atk-title">Metody útoků na hesla</h1>
          <p className="atk-sub">
            Klikněte na každou kartu a zjistěte přesně, jak útočníci postupují — krok za krokem, bez technického žargonu.
          </p>
        </div>

        <div className="atk-grid">
          {ATTACKS.map(a => <AttackCard key={a.id} attack={a} />)}
        </div>

        <div className="atk-cta">
          <div className="atk-cta-title">Teď víte, jak útočníci myslí</div>
          <p className="atk-cta-sub">
            Nejlepší obrana je silné, unikátní heslo pro každý účet.<br />
            Otestujte svá stávající hesla nebo si nechte vygenerovat nové.
          </p>
          <div className="atk-cta-btns">
            <Link href="/generator" className="atk-cta-btn primary">
              <Key style={{width:16,height:16}} />
              Vygenerovat bezpečné heslo
            </Link>
            <Link href="/test" className="atk-cta-btn secondary">
              <TestTube style={{width:16,height:16}} />
              Otestovat sílu hesla
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
