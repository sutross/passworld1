"use client"

import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react"
import { Navigation } from "@/components/navigation"
import {
  ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle,
  Skull, TestTube, Zap, Info, AlertTriangle, Shield, AlertCircle,
} from "lucide-react"
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core"
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common"
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en"

// =============================================================================
// INTERFACES
// =============================================================================

interface StructuralCheck { label: string; passed: boolean }

interface AnalysisResult {
  score: number
  resistanceBits: number
  crackTime: string
  feedback: string[]
  warning: string | null
  checks: StructuralCheck[]
  pwnedCount: number
  isPwned: boolean
  isCheckingPwned: boolean
  hibpError: boolean
}

// =============================================================================
// KONSTANTY
// =============================================================================

const THRESHOLDS = { CRITICAL: 40, WEAK: 60, STRONG: 80, IMMUNIZED: 128 }
const MAX_LENGTH = 128

const normalizeLeet = (s: string) =>
  s.toLowerCase()
    .replace(/4/g,"a").replace(/3/g,"e").replace(/1/g,"i")
    .replace(/0/g,"o").replace(/5/g,"s").replace(/@/g,"a")
    .replace(/\$/g,"s").replace(/7/g,"t").replace(/!/g,"i")

const WEAK_WORDS = ["skibidi","sigma","gyatt","rizz","passworld","admin","password","heslo","qwerty","letmein","iloveyou"]

zxcvbnOptions.setOptions({
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: { ...zxcvbnCommonPackage.dictionary, ...zxcvbnEnPackage.dictionary, userInputs: WEAK_WORDS },
})

// =============================================================================
// PŘEKLADY
// =============================================================================

const WARN_MAP: Record<string, string> = {
  "Straight rows of keys are easy to guess.": "Rovné řady kláves jsou snadno odhadnutelné.",
  "Short keyboard patterns are easy to guess.": "Krátké klávesové vzory jsou snadno odhadnutelné.",
  'Repeats like "aaa" are easy to guess.': "Opakující se znaky jako 'aaa' jsou velmi slabé.",
  'Repeats like "abcabcabc" are only slightly harder to guess than "abc".': "Opakující se vzory jsou snadno odhadnutelné.",
  'Sequences like "abc" or "6543" are easy to guess.': "Sekvence jako 'abc' nebo '123' jsou snadno odhadnutelné.",
  "Recent years are easy to guess.": "Nedávné letopočty jsou snadno odhadnutelné.",
  "Dates are often easy to guess.": "Data jsou snadno odhadnutelná.",
  "This is a top-10 common password.": "Toto je jedno z 10 nejčastějších hesel.",
  "This is a top-100 common password.": "Toto je jedno ze 100 nejčastějších hesel.",
  "This is a very common password.": "Toto je velmi běžné heslo.",
  "This is similar to a commonly used password.": "Toto je podobné běžně používanému heslu.",
  "A word by itself is easy to guess.": "Samotné slovo je snadno odhadnutelné.",
  "Names and surnames by themselves are easy to guess.": "Jména a příjmení jsou snadno odhadnutelná.",
  "Common names and surnames are easy to guess.": "Běžná jména jsou snadno odhadnutelná.",
}

const SUGG_MAP: Record<string, string> = {
  "Add another word or two. Uncommon words are better.": "Přidejte další, méně obvyklá slova.",
  "Use a longer keyboard pattern with more turns.": "Použijte delší vzor s více změnami směru.",
  "Avoid repeated words and characters.": "Vyhněte se opakování slov a znaků.",
  "Avoid sequences.": "Nepoužívejte sekvence.",
  "Avoid recent years.": "Nepoužívejte nedávné letopočty.",
  "Avoid years that are associated with you.": "Nepoužívejte roky spojené s vaší osobou.",
  "Avoid dates and years that are associated with you.": "Nepoužívejte data spojená s vaší osobou.",
  "Capitalization doesn't help very much.": "Velká písmena příliš nepomáhají.",
  "All-uppercase is almost as easy to guess as all-lowercase.": "Vše velkými je téměř stejně slabé jako vše malými.",
  "Reversed words aren't much harder to guess.": "Obrácená slova nejsou o moc těžší uhodnout.",
  "Predictable substitutions like '@' instead of 'a' don't help very much.": "Předvídatelné náhrady jako '@' za 'a' příliš nepomáhají.",
  "Use a few words, avoid common phrases.": "Použijte více slov, vyhněte se běžným frázím.",
  "No need for symbols, digits, or uppercase letters.": "Bezpečné heslo lze vytvořit i bez speciálních znaků.",
}

const translateCrackTime = (time?: string): string => {
  if (!time) return "Okamžitě"
  const l = time.toLowerCase()
  if (l.includes("less than a second") || l === "instant" || l.includes("instantly")) return "Okamžitě"
  const units: [string, string, string, string][] = [
    ["second","sekunda","sekundy","sekund"],["minute","minuta","minuty","minut"],
    ["hour","hodina","hodiny","hodin"],["day","den","dny","dní"],
    ["month","měsíc","měsíce","měsíců"],["year","rok","roky","let"],
  ]
  for (const [en,one,few,many] of units) {
    if (l.includes(en)) {
      const m = time.match(/(\d+)/)
      if (m) { const n = parseInt(m[1]); return n===1?`1 ${one}`:n<=4?`${n} ${few}`:`${n} ${many}` }
      return `Pár ${many}`
    }
  }
  if (l.includes("centur")) { const m = time.match(/(\d+)/); return m?`${m[1]} století`:"Staletí" }
  if (l.includes("millenni")) return "Tisíciletí"
  return time
}

// =============================================================================
// HIBP
// =============================================================================

type HibpResult = { status:"found"; count:number } | { status:"not_found" } | { status:"error"; reason:string }

async function checkHIBP(password: string, signal: AbortSignal): Promise<HibpResult> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password))
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("").toUpperCase()
    const prefix = hex.slice(0,5), suffix = hex.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { signal, cache:"default" })
    if (!res.ok) return { status:"error", reason: res.status===429?"rate_limited":res.status>=500?"server_error":`http_${res.status}` }
    const text = await res.text()
    const m = text.match(new RegExp(`^${suffix}:([0-9]+)`,"m"))
    return m ? { status:"found", count:parseInt(m[1],10) } : { status:"not_found" }
  } catch (e: any) {
    if (e.name==="AbortError") throw e
    return { status:"error", reason:"network_error" }
  }
}

// =============================================================================
// HELPER: barva podle odolnosti
// =============================================================================

function resistanceColor(bits: number, isPwned?: boolean): string {
  if (isPwned) return "#ef4444"
  if (bits < THRESHOLDS.CRITICAL) return "#ef4444"
  if (bits < THRESHOLDS.WEAK)     return "#f97316"
  if (bits < THRESHOLDS.STRONG)   return "#eab308"
  if (bits < THRESHOLDS.IMMUNIZED) return "#4ade80"
  return "#34d399"
}

function resistanceLabel(bits: number, isPwned?: boolean): string {
  if (isPwned) return "Kompromitované!"
  if (bits < THRESHOLDS.CRITICAL) return "Kriticky slabé"
  if (bits < THRESHOLDS.WEAK)     return "Slabé"
  if (bits < THRESHOLDS.STRONG)   return "Dobré"
  if (bits < THRESHOLDS.IMMUNIZED) return "Silné"
  return "Vojenská úroveň"
}

// =============================================================================
// STYLY
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600&display=swap');

  .tst-page * { box-sizing: border-box; }
  .tst-page { font-family: 'Sora', sans-serif; min-height: 100vh; padding: 32px 16px 64px; }

  .tst-hero { max-width: 580px; margin: 0 auto 28px; }
  .tst-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: oklch(0.55 0.12 160 / 0.1); border: 1px solid oklch(0.55 0.12 160 / 0.25);
    border-radius: 20px; padding: 4px 12px; font-size: 11px;
    color: oklch(0.65 0.12 160); font-family: 'JetBrains Mono', monospace;
    margin-bottom: 16px; letter-spacing: 0.04em;
  }
  .tst-badge-dot { width:6px; height:6px; border-radius:50%; background:oklch(0.65 0.12 160); animation:tst-pulse 2s ease-in-out infinite; flex-shrink:0; }
  @keyframes tst-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  .tst-title { font-size: clamp(22px,4vw,30px); font-weight:600; line-height:1.2; margin-bottom:8px; }
  .tst-sub { font-size:14px; color:var(--muted-foreground); line-height:1.6; }

  .tst-card {
    max-width:580px; margin:0 auto; background:var(--card);
    border:1px solid var(--border); border-radius:20px; overflow:hidden;
  }

  /* HOW IT WORKS */
  .tst-how { padding:18px 20px; border-bottom:1px solid var(--border); }
  .tst-how-title { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted-foreground); margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .tst-how-title svg { color:oklch(0.55 0.12 160); }
  .tst-how-list { display:flex; flex-direction:column; gap:6px; }
  .tst-how-item { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:var(--muted-foreground); line-height:1.5; }
  .tst-how-num { width:16px; height:16px; border-radius:4px; background:oklch(0.55 0.12 160 / 0.15); color:oklch(0.65 0.12 160); font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; font-family:'JetBrains Mono',monospace; }

  /* INPUT */
  .tst-input-section { padding:18px 20px; border-bottom:1px solid var(--border); }
  .tst-input-label { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted-foreground); margin-bottom:10px; display:flex; justify-content:space-between; }
  .tst-input-counter { font-family:'JetBrains Mono',monospace; }
  .tst-input-wrap { position:relative; }
  .tst-input {
    width:100%; height:52px; padding:0 48px 0 16px;
    background:var(--background); border:1px solid var(--border);
    border-radius:12px; font-family:'JetBrains Mono',monospace;
    font-size:16px; color:var(--foreground); outline:none;
    transition:border-color 0.2s; letter-spacing:0.04em;
  }
  .tst-input:focus { border-color:oklch(0.55 0.12 160 / 0.6); }
  .tst-input::placeholder { font-size:13px; font-family:'Sora',sans-serif; font-style:italic; color:var(--muted-foreground); opacity:0.5; letter-spacing:0; }
  .tst-eye-btn {
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:transparent; border:none; cursor:pointer;
    color:var(--muted-foreground); display:flex; align-items:center;
    padding:4px; border-radius:6px; transition:color 0.15s;
  }
  .tst-eye-btn:hover { color:var(--foreground); }

  /* RESULTS */
  .tst-results { padding:18px 20px; display:flex; flex-direction:column; gap:16px; }

  /* Score */
  .tst-score-row { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:8px; }
  .tst-score-num { font-family:'JetBrains Mono',monospace; font-size:42px; font-weight:700; line-height:1; transition:color 0.4s; }
  .tst-score-sub { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--muted-foreground); margin-top:2px; }
  .tst-score-badge { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; padding:4px 10px; border-radius:6px; border:1px solid; transition:all 0.4s; }
  .tst-bar { height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
  .tst-bar-fill { height:100%; border-radius:2px; transition:width 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s; }

  /* Stats grid */
  .tst-stats { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .tst-stat {
    background:var(--background); border:1px solid var(--border);
    border-radius:10px; padding:12px 14px;
  }
  .tst-stat-label { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted-foreground); display:flex; align-items:center; gap:4px; margin-bottom:6px; }
  .tst-stat-val { font-family:'JetBrains Mono',monospace; font-size:18px; font-weight:700; }
  .tst-stat-hint { font-size:9px; color:var(--muted-foreground); margin-top:3px; line-height:1.3; }

  /* Section label */
  .tst-section-label { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--muted-foreground); font-weight:600; margin-bottom:8px; }

  /* HIBP */
  .tst-hibp-loading { display:flex; align-items:center; gap:10px; padding:12px 14px; background:oklch(0.55 0.12 160 / 0.06); border:1px solid oklch(0.55 0.12 160 / 0.2); border-radius:10px; }
  .tst-hibp-spinner { width:16px; height:16px; border-radius:50%; border:2px solid oklch(0.55 0.12 160 / 0.3); border-top-color:oklch(0.55 0.12 160); animation:tst-spin 0.8s linear infinite; flex-shrink:0; }
  @keyframes tst-spin { to{transform:rotate(360deg)} }
  .tst-hibp-text { font-size:12px; color:var(--muted-foreground); }
  .tst-hibp-text strong { color:var(--foreground); font-weight:500; display:block; margin-bottom:1px; }

  .tst-status-box { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:10px; border:1px solid; }
  .tst-status-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .tst-status-title { font-size:13px; font-weight:500; margin-bottom:2px; }
  .tst-status-desc { font-size:11px; line-height:1.5; }

  .tst-status-box.ok    { background:oklch(0.55 0.12 160 / 0.06); border-color:oklch(0.55 0.12 160 / 0.25); }
  .tst-status-box.ok .tst-status-icon { background:oklch(0.55 0.12 160 / 0.15); color:oklch(0.65 0.12 160); }
  .tst-status-box.ok .tst-status-title { color:oklch(0.65 0.12 160); }
  .tst-status-box.ok .tst-status-desc { color:oklch(0.55 0.12 160 / 0.8); }

  .tst-status-box.pwned { background:oklch(0.5 0.18 30 / 0.06); border-color:oklch(0.5 0.18 30 / 0.3); }
  .tst-status-box.pwned .tst-status-icon { background:oklch(0.5 0.18 30 / 0.15); color:oklch(0.6 0.18 30); }
  .tst-status-box.pwned .tst-status-title { color:oklch(0.6 0.18 30); }
  .tst-status-box.pwned .tst-status-desc { color:oklch(0.5 0.18 30 / 0.8); }

  .tst-status-box.warn { background:oklch(0.6 0.15 80 / 0.06); border-color:oklch(0.6 0.15 80 / 0.3); }
  .tst-status-box.warn .tst-status-icon { background:oklch(0.6 0.15 80 / 0.15); color:oklch(0.65 0.15 80); }
  .tst-status-box.warn .tst-status-title { color:oklch(0.65 0.15 80); }
  .tst-status-box.warn .tst-status-desc { color:oklch(0.6 0.15 80 / 0.8); }

  /* Structural checks */
  .tst-checks { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .tst-check {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 12px; background:var(--background);
    border:1px solid var(--border); border-radius:8px; font-size:12px;
    transition:border-color 0.2s;
  }
  .tst-check.passed { border-color:oklch(0.55 0.12 160 / 0.3); }
  .tst-check-label { color:var(--muted-foreground); }
  .tst-check.passed .tst-check-label { color:var(--foreground); }
  .tst-check-icon-ok  { color:oklch(0.55 0.12 160); }
  .tst-check-icon-no  { color:var(--muted-foreground); opacity:0.3; }

  /* Warning box */
  .tst-warning { padding:12px 14px; background:oklch(0.5 0.18 30 / 0.06); border:1px solid oklch(0.5 0.18 30 / 0.25); border-radius:10px; display:flex; gap:10px; }
  .tst-warning-icon { color:oklch(0.6 0.18 30); flex-shrink:0; margin-top:1px; }
  .tst-warning-title { font-size:12px; font-weight:500; color:oklch(0.6 0.18 30); margin-bottom:3px; }
  .tst-warning-text { font-size:12px; color:oklch(0.5 0.18 30 / 0.8); line-height:1.5; }

  /* Feedback */
  .tst-feedback { padding:12px 14px; background:oklch(0.6 0.15 80 / 0.06); border:1px solid oklch(0.6 0.15 80 / 0.2); border-radius:10px; }
  .tst-feedback-title { font-size:12px; font-weight:500; color:oklch(0.65 0.15 80); margin-bottom:8px; display:flex; align-items:center; gap:6px; }
  .tst-feedback-list { display:flex; flex-direction:column; gap:4px; }
  .tst-feedback-item { font-size:12px; color:oklch(0.6 0.15 80 / 0.8); display:flex; gap:6px; line-height:1.5; }
  .tst-feedback-dash { color:oklch(0.65 0.15 80); flex-shrink:0; }

  /* Great box */
  .tst-great { padding:12px 14px; background:oklch(0.55 0.12 160 / 0.06); border:1px solid oklch(0.55 0.12 160 / 0.2); border-radius:10px; display:flex; gap:10px; align-items:center; }
  .tst-great-icon { color:oklch(0.65 0.12 160); flex-shrink:0; }
  .tst-great-title { font-size:13px; font-weight:500; color:oklch(0.65 0.12 160); }
  .tst-great-sub { font-size:11px; color:oklch(0.55 0.12 160 / 0.7); }

  /* Clear button */
  .tst-clear-btn {
    width:100%; height:44px; border-radius:10px;
    border:1px solid var(--border); background:transparent;
    font-family:'Sora',sans-serif; font-size:13px; font-weight:500;
    color:var(--muted-foreground); cursor:pointer;
    transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .tst-clear-btn:hover { background:var(--muted); color:var(--foreground); border-color:oklch(0.55 0.12 160 / 0.3); }

  /* Animate in */
  .tst-results-anim { animation:tst-in 0.25s ease; }
  @keyframes tst-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
`

// =============================================================================
// KOMPONENTA
// =============================================================================

export default function TestPage() {
  const [password, setPassword]   = useState("")
  const [showPwd, setShowPwd]     = useState(false)
  const [result, setResult]       = useState<AnalysisResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [, startTransition]       = useTransition()

  const clear = useCallback(() => {
    setPassword(""); setResult(null)
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!password) { setResult(null); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    const localT = setTimeout(() => {
      const z = zxcvbn(password)
      const rawBits = Math.log2(z.guesses)
      const resistanceBits = Math.min(Math.round(rawBits), 200)

      const score = (() => {
        const b = resistanceBits
        if (b < 40) return (b/40)*20
        if (b < 80) return 20+((b-40)/40)*50
        return Math.min(100, 70+((b-80)/48)*30)
      })()

      const normPwd = normalizeLeet(password)
      const isWeak  = WEAK_WORDS.some(w => normPwd.includes(normalizeLeet(w)))
      let finalScore = isWeak && score > 10 ? Math.min(score, 10) : score

      startTransition(() => setResult({
        score: Math.round(finalScore),
        resistanceBits,
        crackTime: translateCrackTime(z.crackTimesDisplay?.offlineFastHashing1e10PerSecond as string),
        feedback: (z.feedback.suggestions||[]).map(s => SUGG_MAP[s]||s),
        warning: isWeak ? "Toto heslo obsahuje běžně známé slovo a je extrémně slabé."
                       : (z.feedback.warning ? (WARN_MAP[z.feedback.warning]||z.feedback.warning) : null),
        checks: [
          { label: "Délka 12+", passed: password.length >= 12 },
          { label: "Velká + malá", passed: /[A-Z]/.test(password) && /[a-z]/.test(password) },
          { label: "Číslice", passed: /[0-9]/.test(password) },
          { label: "Speciální znaky", passed: /[^A-Za-z0-9]/.test(password) },
        ],
        pwnedCount: 0, isPwned: false, isCheckingPwned: true, hibpError: false,
      }))
    }, 200)

    const netT = setTimeout(async () => {
      try {
        const r = await checkHIBP(password, ctrl.signal)
        if (ctrl.signal.aborted) return
        startTransition(() => setResult(prev => {
          if (!prev) return null
          if (r.status === "found")     return { ...prev, score:0, warning:`Toto heslo bylo nalezeno ${r.count.toLocaleString()}x v databázích úniků!`, isPwned:true, pwnedCount:r.count, isCheckingPwned:false, hibpError:false }
          if (r.status === "not_found") return { ...prev, isPwned:false, pwnedCount:0, isCheckingPwned:false, hibpError:false }
          return { ...prev, isCheckingPwned:false, hibpError:true }
        }))
      } catch(e: any) {
        if (e.name !== "AbortError") startTransition(() => setResult(prev => prev ? { ...prev, isCheckingPwned:false, hibpError:true } : null))
      }
    }, 800)

    return () => { clearTimeout(localT); clearTimeout(netT); ctrl.abort() }
  }, [password])

  const eColor = useMemo(() => result ? resistanceColor(result.resistanceBits, result.isPwned) : "var(--muted-foreground)", [result])
  const eLabel = useMemo(() => result ? resistanceLabel(result.resistanceBits, result.isPwned) : "", [result])

  return (
    <div className="min-h-screen">
      <Navigation />
      <style>{STYLES}</style>

      <div className="tst-page">
        <div className="tst-hero">
          <div className="tst-badge">
            <div className="tst-badge-dot" />
            zxcvbn · HIBP k-Anonymity · SHA-1
          </div>
          <h1 className="tst-title">Analyzátor síly hesla</h1>
          <p className="tst-sub">Lokální analýza odolnosti hesla kombinovaná s kontrolou v databázi 600M+ uniklých hesel.</p>
        </div>

        <div className="tst-card">
          {/* Jak to funguje */}
          <div className="tst-how">
            <div className="tst-how-title">
              <Info style={{ width:14, height:14 }} />
              Jak to funguje
            </div>
            <div className="tst-how-list">
              {[
                "Heslo je analyzováno lokálně ve vašem prohlížeči (zxcvbn model).",
                "SHA-1 hash hesla je vypočítán lokálně, odesíláme jen prvních 5 znaků.",
                "HIBP API vrátí stovky podobných hashů — hledáme shodu lokálně.",
                "Vaše heslo v čitelné formě nikdy neopustí prohlížeč.",
              ].map((t, i) => (
                <div key={i} className="tst-how-item">
                  <div className="tst-how-num">{i+1}</div>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="tst-input-section">
            <div className="tst-input-label">
              <span>Testované heslo</span>
              <span className="tst-input-counter">{password.length} / {MAX_LENGTH}</span>
            </div>
            <div className="tst-input-wrap">
              <input
                className="tst-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                maxLength={MAX_LENGTH}
                placeholder="Zadejte heslo k analýze…"
                autoComplete="new-password"
                data-lpignore="true"
              />
              <button className="tst-eye-btn" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOff style={{width:18,height:18}} /> : <Eye style={{width:18,height:18}} />}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="tst-results tst-results-anim">
              {/* Score */}
              <div>
                <div className="tst-score-row">
                  <div>
                    <div className="tst-score-num" style={{ color: eColor }}>{result.score}%</div>
                    <div className="tst-score-sub">Bezpečnostní index</div>
                  </div>
                  <div className="tst-score-badge" style={{ color: eColor, borderColor: `${eColor}44` }}>
                    {eLabel}
                  </div>
                </div>
                <div className="tst-bar">
                  <div className="tst-bar-fill" style={{ width:`${result.score}%`, background: eColor }} />
                </div>
              </div>

              {/* Stats */}
              <div className="tst-stats">
                <div className="tst-stat">
                  <div className="tst-stat-label">
                    <Zap style={{width:11,height:11}} />
                    Odolnost (zxcvbn)
                  </div>
                  <div className="tst-stat-val" style={{ color: eColor }}>
                    {result.resistanceBits} <span style={{fontSize:12,opacity:0.5,fontWeight:400}}>b</span>
                  </div>
                  <div className="tst-stat-hint">log₂(odhadovaných pokusů útočníka)</div>
                </div>
                <div className="tst-stat">
                  <div className="tst-stat-label">
                    <Skull style={{width:11,height:11}} />
                    Rychlý útok (GPU)
                  </div>
                  <div className="tst-stat-val" style={{fontSize:16}}>{result.crackTime}</div>
                  <div className="tst-stat-hint">RTX 4090 · ~10B MD5 hashů/s</div>
                </div>
              </div>

              {/* HIBP */}
              <div>
                <div className="tst-section-label">Stav v databázích úniků</div>
                {result.isCheckingPwned ? (
                  <div className="tst-hibp-loading">
                    <div className="tst-hibp-spinner" />
                    <div className="tst-hibp-text">
                      <strong>Kontroluji v HaveIBeenPwned…</strong>
                      k-Anonymity protokol · odesílám jen 5 znaků hashe
                    </div>
                  </div>
                ) : result.hibpError ? (
                  <div className="tst-status-box warn">
                    <div className="tst-status-icon"><AlertCircle style={{width:16,height:16}} /></div>
                    <div>
                      <div className="tst-status-title">Kontrola nedostupná</div>
                      <div className="tst-status-desc">Nepodařilo se spojit s HIBP API — zkuste to znovu.</div>
                    </div>
                  </div>
                ) : result.isPwned ? (
                  <div className="tst-status-box pwned">
                    <div className="tst-status-icon"><AlertTriangle style={{width:16,height:16}} /></div>
                    <div>
                      <div className="tst-status-title">Heslo bylo kompromitováno!</div>
                      <div className="tst-status-desc">Nalezeno {result.pwnedCount.toLocaleString()}× v databázích úniků. Toto heslo nikdy nepoužívejte.</div>
                    </div>
                  </div>
                ) : (
                  <div className="tst-status-box ok">
                    <div className="tst-status-icon"><Shield style={{width:16,height:16}} /></div>
                    <div>
                      <div className="tst-status-title">Heslo nebylo nalezeno v únicích</div>
                      <div className="tst-status-desc">Zkontrolováno v databázi 600M+ hesel</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Structural checks */}
              <div>
                <div className="tst-section-label">Struktura hesla</div>
                <div className="tst-checks">
                  {result.checks.map((c, i) => (
                    <div key={i} className={`tst-check ${c.passed?"passed":""}`}>
                      <span className="tst-check-label">{c.label}</span>
                      {c.passed
                        ? <CheckCircle2 className="tst-check-icon-ok" style={{width:15,height:15}} />
                        : <XCircle className="tst-check-icon-no" style={{width:15,height:15}} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              {result.warning && !result.isPwned && (
                <div className="tst-warning">
                  <Skull className="tst-warning-icon" style={{width:16,height:16}} />
                  <div>
                    <div className="tst-warning-title">Kritický problém</div>
                    <div className="tst-warning-text">{result.warning}</div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {result.feedback.length > 0 && (
                <div className="tst-feedback">
                  <div className="tst-feedback-title">
                    <Info style={{width:14,height:14}} />
                    Doporučení ke zlepšení
                  </div>
                  <div className="tst-feedback-list">
                    {result.feedback.map((f, i) => (
                      <div key={i} className="tst-feedback-item">
                        <span className="tst-feedback-dash">—</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Great */}
              {!result.warning && !result.isPwned && !result.hibpError && result.feedback.length === 0 && (
                <div className="tst-great">
                  <ShieldCheck className="tst-great-icon" style={{width:20,height:20}} />
                  <div>
                    <div className="tst-great-title">Výborně!</div>
                    <div className="tst-great-sub">Nebyly nalezeny žádné známé slabiny.</div>
                  </div>
                </div>
              )}

              {/* Clear */}
              <button className="tst-clear-btn" onClick={clear}>
                Vymazat heslo a začít znovu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
