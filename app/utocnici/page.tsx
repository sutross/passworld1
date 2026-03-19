"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { Key, TestTube, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

// =============================================================================
// TYPY
// =============================================================================

interface Step {
  label: string
  desc: string
}

interface AttackData {
  id: string
  icon: string
  iconBg: string
  title: string
  subtitle: string
  danger: "Kritické" | "Vysoké" | "Střední"
  dangerClass: string
  progressColor: string
  steps: Step[]
  animLabel: string
  animType: string
  tipColor: string
  tipBg: string
  tipText: string
}

// =============================================================================
// DATA ÚTOKŮ
// =============================================================================

const ATTACKS: AttackData[] = [
  {
    id: "brute",
    icon: "⚡",
    iconBg: "oklch(0.97 0.01 30)",
    title: "Útok hrubou silou",
    subtitle: "Zkouší každou kombinaci znaků",
    danger: "Kritické",
    dangerClass: "danger-critical",
    progressColor: "oklch(0.5 0.18 30)",
    steps: [
      {
        label: "Útočník najde přihlašovací formulář",
        desc: "Vyhledá webovou stránku nebo aplikaci s přihlašovacím polem. Cíl: vaše heslo.",
      },
      {
        label: "Spustí automatizovaný program",
        desc: "Speciální software zkouší hesla automaticky — tisíce za sekundu, 24/7 bez přestávky.",
      },
      {
        label: "Zkouší kombinace systematicky",
        desc: "Začne od 'aaa', pokračuje 'aab', 'aac'… projde každou možnou kombinaci znaků.",
      },
      {
        label: "Nalezne shodu — přihlásí se",
        desc: "Jakmile program narazí na vaše heslo, útočník okamžitě dostane přístup k vašemu účtu.",
      },
    ],
    animLabel: "Program zkouší tato hesla:",
    animType: "brute",
    tipBg: "oklch(0.97 0.01 30)",
    tipColor: "oklch(0.35 0.14 30)",
    tipText:
      "Obrana: heslo delší než 12 znaků prodlouží dobu útoku z minut na stovky let. Zapněte limitování pokusů na webu.",
  },
  {
    id: "dict",
    icon: "📖",
    iconBg: "oklch(0.97 0.03 80)",
    title: "Slovníkový útok",
    subtitle: "Zkouší běžná slova a jejich variace",
    danger: "Kritické",
    dangerClass: "danger-critical",
    progressColor: "oklch(0.55 0.13 80)",
    steps: [
      {
        label: "Útočník si stáhne slovník hesel",
        desc: "Existují volně dostupné seznamy s miliony nejčastějších hesel. RockYou: 14 milionů hesel z reálných úniků.",
      },
      {
        label: "Program přidá chytré variace",
        desc: "Automaticky přidává číslice na konec, mění 'a' za '@', 'e' za '3', přidává velká písmena na začátek.",
      },
      {
        label: "Zkouší hesla ze seznamu",
        desc: "Místo náhodných kombinací zkouší jen reálná hesla — je to 100× rychlejší než brute force.",
      },
      {
        label: "Vaše 'chytré' heslo selže",
        desc: "Heslo123!, Passworld@ nebo Léto2024 jsou ve slovnících. Útočník je prolomí za sekundy.",
      },
    ],
    animLabel: "Program zkouší ze slovníku:",
    animType: "dict",
    tipBg: "oklch(0.97 0.03 80)",
    tipColor: "oklch(0.4 0.12 80)",
    tipText: "Obrana: nepoužívejte slovní hesla. Heslo musí být náhodné — ne 'chytré'. Použijte náš generátor.",
  },
  {
    id: "phishing",
    icon: "🎣",
    iconBg: "oklch(0.97 0.02 50)",
    title: "Phishing",
    subtitle: "Podvodná přihlašovací stránka",
    danger: "Kritické",
    dangerClass: "danger-critical",
    progressColor: "oklch(0.5 0.15 50)",
    steps: [
      {
        label: "Útočník vytvoří falešnou stránku",
        desc: "Zkopíruje přihlašovací stránku banky, Googlu nebo Facebooku — pixel po pixelu. Vypadá identicky.",
      },
      {
        label: "Pošle podvodný e-mail",
        desc: "'Váš účet byl pozastaven, přihlaste se ihned.' Odkaz vede na falešnou stránku, ne na originál.",
      },
      {
        label: "Oběť zadá heslo sama",
        desc: "Vypadá to jako normální přihlášení. Uživatel zadá jméno a heslo — a odešle je přímo útočníkovi.",
      },
      {
        label: "Útočník má přihlašovací údaje",
        desc: "Ani nejsilnější heslo nepomůže — zadali jste ho sami. Útočník se přihlásí k vašemu účtu.",
      },
    ],
    animLabel: "Falešné URL v podvodném e-mailu:",
    animType: "phishing",
    tipBg: "oklch(0.97 0.02 50)",
    tipColor: "oklch(0.35 0.13 50)",
    tipText:
      "Obrana: vždy kontrolujte URL v adresním řádku. Nepoužívejte odkazy z e-mailů — přejděte na stránku ručně.",
  },
  {
    id: "stuffing",
    icon: "📋",
    iconBg: "oklch(0.97 0.02 220)",
    title: "Credential stuffing",
    subtitle: "Uniklá hesla zkoušená na jiných webech",
    danger: "Vysoké",
    dangerClass: "danger-high",
    progressColor: "oklch(0.55 0.12 220)",
    steps: [
      {
        label: "Někde dojde k úniku dat",
        desc: "Velký web (LinkedIn, Adobe, Facebook) je napaden a hesla milionů uživatelů uniknou na internet.",
      },
      {
        label: "Útočník koupí seznam přihlašovacích dat",
        desc: "Na dark webu jsou miliardy kombinací email+heslo k dostání za pár dolarů. Snadno dostupné.",
      },
      {
        label: "Bot zkouší stejné heslo na jiných webech",
        desc: "Automaticky zkouší kombinaci na Gmailu, bankovnictví, e-shopu. Spoléhá, že máte stejné heslo všude.",
      },
      {
        label: "Jeden únik = všechny účty",
        desc: "Používáte-li stejné heslo na 5 místech, jeden únik kompromituje všechny. Útočník to ví.",
      },
    ],
    animLabel: "Bot zkouší uniklé heslo na webech:",
    animType: "stuffing",
    tipBg: "oklch(0.97 0.02 220)",
    tipColor: "oklch(0.35 0.1 220)",
    tipText:
      "Obrana: každý účet musí mít unikátní heslo. Používejte správce hesel — pamatuje za vás.",
  },
  {
    id: "rainbow",
    icon: "🌈",
    iconBg: "oklch(0.97 0.02 270)",
    title: "Rainbow table útok",
    subtitle: "Předpočítané hashe hesel",
    danger: "Vysoké",
    dangerClass: "danger-high",
    progressColor: "oklch(0.55 0.13 270)",
    steps: [
      {
        label: "Web ukládá hesla jako hash",
        desc: "Heslo 'kocka123' se uloží jako nečitelný řetězec: '5f4dcc3b5aa765d6…'. Vypadá bezpečně.",
      },
      {
        label: "Útočník má tabulku předpočítaných hashů",
        desc: "Někdo předem spočítal hashe milionů hesel a uložil je do obří tabulky. Vyhledávání trvá milisekundy.",
      },
      {
        label: "Porovná uniklý hash s tabulkou",
        desc: "Hash '5f4dcc3b…' najde v tabulce a okamžitě ví: toto heslo je 'kocka123'. Žádné lámání.",
      },
      {
        label: "Heslo odhaleno bez čekání",
        desc: "Rainbow table mění prolomení hashů na prosté vyhledávání. Sekundy, ne hodiny.",
      },
    ],
    animLabel: "Vyhledávání v rainbow tabulce:",
    animType: "rainbow",
    tipBg: "oklch(0.97 0.02 270)",
    tipColor: "oklch(0.35 0.1 270)",
    tipText:
      "Obrana: weby musí přidávat náhodný 'salt' ke každému heslu před hashováním — tím rainbow tables přestanou fungovat.",
  },
  {
    id: "keylogger",
    icon: "🖱️",
    iconBg: "oklch(0.97 0.02 145)",
    title: "Keylogger / malware",
    subtitle: "Zachytává každý stisk klávesy",
    danger: "Střední",
    dangerClass: "danger-medium",
    progressColor: "oklch(0.5 0.12 145)",
    steps: [
      {
        label: "Zařízení se nakazí nechtěně",
        desc: "Stáhnete nelegální software, kliknete na podezřelý odkaz nebo otevřete přílohu. Virus se nainstaluje.",
      },
      {
        label: "Keylogger běží na pozadí nepozorovaně",
        desc: "Zaznamenává každý stisk klávesy. Vy nic nevidíte, nic se nezpomaluje. Virus tiše čeká.",
      },
      {
        label: "Zadáte heslo do přihlašovacího pole",
        desc: "V tu chvíli keylogger zaznamená: 'k-o-c-k-a-1-2-3'. Kompletní heslo s kontextem (na jakém webu).",
      },
      {
        label: "Záznamy jsou odeslány útočníkovi",
        desc: "Pravidelně nebo v reálném čase jsou klávesy odeslány na server útočníka. Heslo je prozrazeno.",
      },
    ],
    animLabel: "Keylogger zaznamenal stisknuté klávesy:",
    animType: "keylogger",
    tipBg: "oklch(0.97 0.02 145)",
    tipColor: "oklch(0.3 0.1 145)",
    tipText:
      "Obrana: aktuální antivirový software a nestahovat z neznámých zdrojů. Hardwarový klíč (FIDO2) zachrání účet i při aktivním keyloggeru.",
  },
]

// =============================================================================
// ANIMAČNÍ SEKVENCE
// =============================================================================

const ANIM_SEQUENCES: Record<string, string[]> = {
  brute: ["aaaa", "aaab", "aaac", "aaba", "abaa", "abba", "password", "letmein", "qwerty1", "iloveyou", "monkey1", "welcome1", "login123", "abc12345", "12345678"],
  dict: ["heslo", "heslo1", "heslo123", "Heslo123!", "H3sl0!23", "password", "p@ssword", "P@ssw0rd!", "letmein", "l3tm3in!", "qwerty", "Qwerty1!", "Admin123!", "kocka", "Kocka2024!"],
  phishing: ["g00gle.com/login", "gooogle.com", "google-security.net", "accounts-google.verify-now.com", "secure-google-login.tk", "google.com.login-verify.ru", "googIe.com (velké I jako l)", "accounts.g00gle.com"],
  stuffing: ["gmail.com ✗", "facebook.com ✗", "netflix.com ✗", "amazon.com ✗", "bank.cz ✗", "instagram.com ✗", "paypal.com ✗", "icloud.com ✗", "seznam.cz ✓ PŘÍSTUP ZÍSKÁN!"],
  rainbow: ["hash 5f4dcc3b… → 'password'", "hash e10adc39… → '123456'", "hash 25d55ad2… → '12345678'", "hash 827ccb0e… → '12345'", "hash d8578edf… → 'qwerty'", "hash 96e79218… → '111111'", "NALEZENO: váš hash → 'kocka123'"],
  keylogger: ["[chrome] g-m-a-i-l-.-c-o-m", "[gmail] j-m-e-n-o-@-e-m-a-i-l-.-c-z", "[gmail] h-e-s-l-o-1-2-3", "[bank.cz] r-o-d-n-é-č-í-s-l-o", "[bank.cz] p-i-n-:-1-2-3-4", "ODESLÁNO na útočníkův server ✓"],
}

// =============================================================================
// KOMPONENTA KARTY
// =============================================================================

function AttackCard({ attack }: { attack: AttackData }) {
  const [open, setOpen] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [animText, setAnimText] = useState("")
  const [animPrev, setAnimPrev] = useState("")
  const [progress, setProgress] = useState(0)
  const animRef = useRef<NodeJS.Timeout | null>(null)
  const stepTimers = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    if (!open) {
      setVisibleSteps([])
      setProgress(0)
      setAnimText("")
      setAnimPrev("")
      if (animRef.current) clearInterval(animRef.current)
      stepTimers.current.forEach(clearTimeout)
      stepTimers.current = []
      return
    }

    // Animace kroků
    attack.steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i])
        setProgress(Math.round(((i + 1) / attack.steps.length) * 100))
      }, 300 + i * 500)
      stepTimers.current.push(t)
    })

    // Textová animace
    const seq = ANIM_SEQUENCES[attack.animType] || []
    let idx = 0
    const run = () => {
      setAnimPrev(seq[(idx - 1 + seq.length) % seq.length] || "")
      setAnimText(seq[idx % seq.length])
      idx++
    }
    run()
    animRef.current = setInterval(run, 900)

    return () => {
      if (animRef.current) clearInterval(animRef.current)
      stepTimers.current.forEach(clearTimeout)
    }
  }, [open, attack])

  const dangerLabel =
    attack.danger === "Kritické"
      ? "danger-critical"
      : attack.danger === "Vysoké"
      ? "danger-high"
      : "danger-medium"

  return (
    <div
      className={`attack-card ${open ? "attack-card--open" : ""}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="attack-card__header">
        <div className="attack-card__icon" style={{ background: attack.iconBg }}>
          {attack.icon}
        </div>
        <div className="attack-card__info">
          <div className="attack-card__title">{attack.title}</div>
          <div className="attack-card__subtitle">{attack.subtitle}</div>
        </div>
        <span className={`attack-card__badge ${dangerLabel}`}>{attack.danger}</span>
      </div>

      <div className="attack-card__hint">
        <span className={`attack-card__chevron ${open ? "attack-card__chevron--open" : ""}`}>▾</span>
        <span>Klikni pro animaci útoku</span>
      </div>

      <div className={`attack-card__scene ${open ? "attack-card__scene--open" : ""}`}>
        <div className="attack-card__scene-inner">
          {/* Kroky */}
          <div className="attack-steps">
            {attack.steps.map((step, i) => (
              <div
                key={i}
                className={`attack-step ${visibleSteps.includes(i) ? "attack-step--visible" : ""}`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {i < attack.steps.length - 1 && <div className="attack-step__line" />}
                <div
                  className="attack-step__num"
                  style={{ background: attack.iconBg, color: attack.tipColor }}
                >
                  {i + 1}
                </div>
                <div className="attack-step__body">
                  <div className="attack-step__label">{step.label}</div>
                  <div className="attack-step__desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="attack-progress">
            <div
              className="attack-progress__fill"
              style={{ width: `${progress}%`, background: attack.progressColor }}
            />
          </div>

          {/* Animace */}
          <div className="attack-anim">
            <div className="attack-anim__label">{attack.animLabel}</div>
            <div className="attack-anim__content">
              {animPrev && <span className="attack-anim__prev">{animPrev}</span>}
              <span className="attack-anim__current">{animText}</span>
              <span className="attack-anim__cursor" />
            </div>
          </div>

          {/* Tip */}
          <div
            className="attack-tip"
            style={{ background: attack.tipBg, color: attack.tipColor }}
          >
            <span className="attack-tip__icon">🛡️</span>
            <span>{attack.tipText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HLAVNÍ STRÁNKA
// =============================================================================

export default function UtocniciPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <style>{`
        .attack-card {
          background: var(--card);
          border: 0.5px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
        }
        .attack-card:hover {
          border-color: oklch(0.45 0.08 190);
          transform: translateY(-2px);
        }
        .attack-card--open {
          border-color: oklch(0.45 0.08 190);
        }
        .attack-card__header {
          padding: 16px 20px 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .attack-card__icon {
          width: 38px; height: 38px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .attack-card__info { flex: 1; min-width: 0; }
        .attack-card__title { font-size: 15px; font-weight: 500; }
        .attack-card__subtitle { font-size: 12px; color: var(--muted-foreground); margin-top: 2px; }
        .attack-card__badge {
          font-size: 11px; padding: 3px 8px;
          border-radius: 6px; font-weight: 500;
          flex-shrink: 0; white-space: nowrap;
        }
        .danger-critical { background: oklch(0.97 0.02 30); color: oklch(0.35 0.14 30); }
        .danger-high { background: oklch(0.97 0.03 80); color: oklch(0.4 0.12 80); }
        .danger-medium { background: oklch(0.97 0.02 145); color: oklch(0.3 0.1 145); }
        .attack-card__hint {
          padding: 0 20px 12px;
          font-size: 12px; color: var(--muted-foreground);
          display: flex; align-items: center; gap: 4px;
        }
        .attack-card__chevron { transition: transform 0.3s; display: inline-block; }
        .attack-card__chevron--open { transform: rotate(180deg); }
        .attack-card__scene {
          max-height: 0; overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .attack-card__scene--open { max-height: 700px; }
        .attack-card__scene-inner {
          border-top: 0.5px solid var(--border);
          padding: 16px 20px 20px;
        }
        .attack-steps { display: flex; flex-direction: column; gap: 0; }
        .attack-step {
          display: flex; gap: 12px; padding: 10px 0;
          opacity: 0; transform: translateX(-8px);
          transition: opacity 0.35s, transform 0.35s;
          position: relative;
        }
        .attack-step--visible { opacity: 1; transform: none; }
        .attack-step__line {
          position: absolute; left: 13px; top: 38px;
          width: 1px; bottom: 0;
          background: var(--border);
        }
        .attack-step__num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 500; flex-shrink: 0;
          position: relative; z-index: 1;
        }
        .attack-step__body { flex: 1; padding-top: 3px; }
        .attack-step__label { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
        .attack-step__desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.55; }
        .attack-progress {
          height: 3px; background: var(--border); border-radius: 2px;
          overflow: hidden; margin: 14px 0;
        }
        .attack-progress__fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        .attack-anim {
          background: var(--muted); border: 0.5px solid var(--border);
          border-radius: 8px; padding: 12px 14px; min-height: 72px;
        }
        .attack-anim__label {
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--muted-foreground); margin-bottom: 6px;
        }
        .attack-anim__prev {
          display: block; font-family: var(--font-mono, monospace);
          font-size: 11px; color: var(--muted-foreground); opacity: 0.5;
          margin-bottom: 2px;
        }
        .attack-anim__current {
          font-family: var(--font-mono, monospace); font-size: 13px;
        }
        .attack-anim__cursor {
          display: inline-block; width: 8px; height: 14px;
          background: currentColor; vertical-align: middle; margin-left: 2px;
          animation: blink-cursor 1s infinite;
        }
        @keyframes blink-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        .attack-tip {
          margin-top: 14px; padding: 10px 14px; border-radius: 8px;
          font-size: 12px; line-height: 1.55;
          display: flex; gap: 8px; align-items: flex-start;
        }
        .attack-tip__icon { flex-shrink: 0; font-size: 14px; }
      `}</style>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono">
              <span>⚠️</span>
              <span>Jak útočníci kradou hesla</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Metody útoků na hesla
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Klikněte na každou kartu a zjistěte přesně, jak útočníci postupují
              — krok za krokem, bez technického žargonu.
            </p>
          </div>

          {/* Karty */}
          <div className="grid gap-4 md:grid-cols-2">
            {ATTACKS.map((attack) => (
              <AttackCard key={attack.id} attack={attack} />
            ))}
          </div>

         {/* CTA */}
          <div className="text-center p-8 rounded-xl border border-primary/20 bg-card/50 space-y-4">
            <h2 className="text-2xl font-bold">Teď víte, jak útočníci myslí</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Nejlepší obrana je silné, unikátní heslo pro každý účet.
              Otestujte svá stávající hesla nebo si nechte vygenerovat nové.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button asChild size="lg">
                <Link href="/generator">
                  <Key className="mr-2 h-5 w-5" />
                  Vygenerovat bezpečné heslo
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
                <Link href="/test">
                  <TestTube className="mr-2 h-5 w-5" />
                  Otestovat sílu hesla
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}