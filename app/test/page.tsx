"use client"

import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react"
import { Navigation } from "@/components/navigation"
import {
  ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle,
  Skull, TestTube, Zap, Info, AlertTriangle, Shield, AlertCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core"
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common"
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en"

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

interface StructuralCheck {
  label: string
  passed: boolean
}

interface AnalysisResult {
  score: number
  // AUDIT FIX C-03: Přejmenováno na 'resistanceBits' a opatřeno komentářem.
  // Toto NENÍ Shannon entropie — je to log2(zxcvbn.guesses), tedy odhad
  // odolnosti vůči prohledávání dle zxcvbn modelu útoku.
  resistanceBits: number
  crackTime: string
  feedback: string[]
  warning: string | null
  checks: StructuralCheck[]
  pwnedCount: number
  isPwned: boolean
  isCheckingPwned: boolean
  // AUDIT FIX M-05: Nové pole pro rozlišení chyby API od "nenalezeno"
  hibpError: boolean
}

// =============================================================================
// KONSTANTY
// =============================================================================

const RESISTANCE_THRESHOLDS = {
  CRITICAL: 40,
  WEAK: 60,
  STRONG: 80,
  IMMUNIZED: 128,
}

const MAX_PASSWORD_LENGTH = 128

// =============================================================================
// AUDIT FIX M-04: Leet-speak normalizace pro slabá slova
// =============================================================================
const normalizeLeet = (s: string): string =>
  s.toLowerCase()
    .replace(/4/g, "a").replace(/3/g, "e").replace(/1/g, "i")
    .replace(/0/g, "o").replace(/5/g, "s").replace(/@/g, "a")
    .replace(/\$/g, "s").replace(/7/g, "t").replace(/!/g, "i")

const CUSTOM_WEAK_WORDS = [
  "skibidi", "sigma", "gyatt", "rizz", "passworld", "admin",
  "password", "heslo", "qwerty", "letmein", "iloveyou",
]

// =============================================================================
// ZXCVBN KONFIGURACE
// =============================================================================

const zxcvbnOpts = {
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
    userInputs: CUSTOM_WEAK_WORDS,
  },
}
zxcvbnOptions.setOptions(zxcvbnOpts)

// =============================================================================
// PŘEKLADOVÉ FUNKCE
// =============================================================================

const translateWarning = (warning: string | undefined): string | null => {
  if (!warning) return null
  const t: Record<string, string> = {
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
  return t[warning] || warning
}

const translateSuggestion = (suggestion: string): string => {
  const t: Record<string, string> = {
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
  return t[suggestion] || suggestion
}

const translateCrackTime = (time: string | undefined): string => {
  if (!time) return "Okamžitě"
  const lower = time.toLowerCase()
  if (lower.includes("less than a second") || lower === "instant" || lower.includes("instantly")) return "Okamžitě"
  const units: [string, string, string, string][] = [
    ["second", "sekunda", "sekundy", "sekund"],
    ["minute", "minuta", "minuty", "minut"],
    ["hour", "hodina", "hodiny", "hodin"],
    ["day", "den", "dny", "dní"],
    ["month", "měsíc", "měsíce", "měsíců"],
    ["year", "rok", "roky", "let"],
  ]
  for (const [en, one, few, many] of units) {
    if (lower.includes(en)) {
      const match = time.match(/(\d+)/)
      if (match) {
        const n = parseInt(match[1])
        if (n === 1) return `1 ${one}`
        if (n >= 2 && n <= 4) return `${n} ${few}`
        return `${n} ${many}`
      }
      return `Pár ${many}`
    }
  }
  if (lower.includes("centur")) {
    const match = time.match(/(\d+)/)
    return match ? `${match[1]} století` : "Staletí"
  }
  return time
}

// =============================================================================
// AUDIT FIX M-05: HIBP check — rozlišuje chybu API od "nenalezeno"
// =============================================================================
// Původní implementace při chybě API vracela { isPwned: false }, což vedlo
// k zobrazení falešně bezpečného "Heslo nebylo nalezeno". Nyní propagujeme
// chybu volajícímu a zobrazíme varování o nedostupnosti služby.
// =============================================================================

type HibpResult =
  | { status: "found"; count: number }
  | { status: "not_found" }
  | { status: "error"; reason: string }

async function checkHIBP(password: string, signal: AbortSignal): Promise<HibpResult> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-1", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()

    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal,
      cache: "default",
    })

    if (!response.ok) {
      if (response.status === 429) return { status: "error", reason: "rate_limited" }
      if (response.status >= 500) return { status: "error", reason: "server_error" }
      return { status: "error", reason: `http_${response.status}` }
    }

    const text = await response.text()
    const regex = new RegExp(`^${suffix}:([0-9]+)`, "m")
    const match = text.match(regex)

    return match
      ? { status: "found", count: parseInt(match[1], 10) }
      : { status: "not_found" }
  } catch (err: any) {
    if (err.name === "AbortError") throw err
    return { status: "error", reason: "network_error" }
  }
}

// =============================================================================
// HLAVNÍ KOMPONENTA
// =============================================================================

export default function SecurityTestPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const [, startTransition] = useTransition()

  const clearSensitiveData = useCallback(() => {
    setPassword("")
    setResult(null)
    if (abortControllerRef.current) abortControllerRef.current.abort()
  }, [])

  useEffect(() => {
    if (!password) {
      setResult(null)
      return
    }

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    // 1. Lokální zxcvbn analýza (200ms debounce)
    const localTimer = setTimeout(() => {
      const zResult = zxcvbn(password)

      // AUDIT FIX C-03: Správně pojmenovaná proměnná a cappovaná hodnota.
      // log2(guesses) je zxcvbn-model odolnost, NIKOLI Shannon entropie.
      const rawResistanceBits = Math.log2(zResult.guesses)
      const resistanceBits = Math.min(
        Math.round(rawResistanceBits * 100) / 100,
        200, // Display cap — zxcvbn cappuje guesses na 10^100 ≈ 332 bitů
      )

      // Normalizace skóre z odolnosti (piecewise, spojitá funkce)
      const getNormalizedScore = (bits: number): number => {
        if (bits < 40) return (bits / 40) * 20
        if (bits < 80) return 20 + ((bits - 40) / 40) * 50
        return Math.min(100, 70 + ((bits - 80) / 48) * 30)
      }

      let finalScore = getNormalizedScore(resistanceBits)

      // AUDIT FIX M-03: Odstraněna dvojí penalizace score.
      // Původní kód aplikoval `finalScore *= 0.5` pro zxcvbn.score <= 1,
      // ale finalScore již vychází ze zxcvbn.guesses (stejný zdroj jako score).
      // Dvojí penalizace způsobovala skoky a nekonzistentní výsledky.

      // AUDIT FIX M-04: Leet-speak normalizace pro detekci slabých slov
      const normalizedPwd = normalizeLeet(password)
      const containsWeakWord = CUSTOM_WEAK_WORDS.some((w) => normalizedPwd.includes(normalizeLeet(w)))
      if (containsWeakWord && finalScore > 10) finalScore = Math.min(finalScore, 10)

      const checks: StructuralCheck[] = [
        { label: "Délka (ideálně 12+)", passed: password.length >= 12 },
        { label: "Velká a malá písmena", passed: /[A-Z]/.test(password) && /[a-z]/.test(password) },
        { label: "Číslice", passed: /[0-9]/.test(password) },
        { label: "Speciální znaky", passed: /[^A-Za-z0-9]/.test(password) },
      ]

      startTransition(() => {
        setResult({
          score: Math.round(finalScore),
          resistanceBits,
          crackTime: translateCrackTime(
            zResult.crackTimesDisplay?.offlineFastHashing1e10PerSecond as string,
          ),
          feedback: (zResult.feedback.suggestions || []).map(translateSuggestion),
          warning: containsWeakWord
            ? "Toto heslo obsahuje běžně známé slovo a je extrémně slabé."
            : translateWarning(zResult.feedback.warning),
          checks,
          pwnedCount: 0,
          isPwned: false,
          isCheckingPwned: true,
          hibpError: false,
        })
      })
    }, 200)

    // 2. Síťová HIBP kontrola (800ms debounce)
    const networkTimer = setTimeout(async () => {
      try {
        const hibpResult = await checkHIBP(password, controller.signal)
        if (controller.signal.aborted) return

        startTransition(() => {
          setResult((prev) => {
            if (!prev) return null

            if (hibpResult.status === "found") {
              return {
                ...prev,
                score: 0,
                warning: `Toto heslo bylo nalezeno ${hibpResult.count.toLocaleString()}x v databázích úniků!`,
                isPwned: true,
                pwnedCount: hibpResult.count,
                isCheckingPwned: false,
                hibpError: false,
              }
            }

            if (hibpResult.status === "not_found") {
              return { ...prev, isPwned: false, pwnedCount: 0, isCheckingPwned: false, hibpError: false }
            }

            // AUDIT FIX M-05: Chyba API — nezobrazujeme falešné "nenalezeno"
            return { ...prev, isCheckingPwned: false, hibpError: true }
          })
        })
      } catch (err: any) {
        if (err.name !== "AbortError") {
          startTransition(() => {
            setResult((prev) => (prev ? { ...prev, isCheckingPwned: false, hibpError: true } : null))
          })
        }
      }
    }, 800)

    return () => {
      clearTimeout(localTimer)
      clearTimeout(networkTimer)
      controller.abort()
    }
  }, [password])

  const strengthTheme = useMemo(() => {
    if (!result) return { color: "text-muted-foreground", bg: "bg-muted", label: "Čekám na heslo..." }
    if (result.isPwned) return { color: "text-red-500", bg: "bg-red-600", label: "Kompromitované!" }

    const { resistanceBits } = result
    if (resistanceBits < RESISTANCE_THRESHOLDS.CRITICAL)
      return { color: "text-red-500", bg: "bg-red-600", label: "Kriticky slabé" }
    if (resistanceBits < RESISTANCE_THRESHOLDS.WEAK)
      return { color: "text-orange-500", bg: "bg-orange-500", label: "Nedostačující" }
    if (resistanceBits < RESISTANCE_THRESHOLDS.STRONG)
      return { color: "text-yellow-500", bg: "bg-yellow-500", label: "Dobré" }
    if (resistanceBits < RESISTANCE_THRESHOLDS.IMMUNIZED)
      return { color: "text-emerald-400", bg: "bg-emerald-500", label: "Bezpečné" }
    return { color: "text-cyan-400", bg: "bg-cyan-500", label: "Vojenská úroveň" }
  }, [result])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
              <TestTube className="h-3 w-3" />
              <span>Komplexní bezpečnostní analýza</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Analyzátor síly hesla</h1>
            <p className="text-muted-foreground text-sm">
              Kombinace odolnostní analýzy (zxcvbn) a kontroly v databázích úniků (HIBP).
            </p>
          </div>

          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-xl border-primary/10 shadow-2xl">
            {/* Jak to funguje */}
            <div className="space-y-3 text-sm text-muted-foreground border-b border-border pb-6">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">Jak to funguje:</h4>
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>Heslo je analyzováno lokálně přímo ve vašem prohlížeči.</li>
                <li>Paralelně kontrolujeme heslo v databázi 600M+ uniklých hesel (HIBP).</li>
                <li>Používáme k-Anonymity: odesíláme pouze 5 znaků SHA-1 hashe.</li>
                <li>Vaše heslo nikdy neopustí prohlížeč v čitelné formě.</li>
              </ul>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Testované heslo</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={MAX_PASSWORD_LENGTH}
                  className="h-14 pr-12 font-mono text-lg transition-all focus:ring-2 focus:ring-primary/20"
                  placeholder="Zadejte heslo k analýze..."
                  autoComplete="new-password"
                  data-lpignore="true"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5 opacity-50" />
                    : <Eye className="w-5 h-5 opacity-50" />}
                </Button>
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">{password.length}/{MAX_PASSWORD_LENGTH}</span>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                {/* Score Header */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className={`text-4xl font-mono font-black ${strengthTheme.color}`}>
                        {result.score}%
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
                        Bezpečnostní index
                      </span>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${strengthTheme.color} border-current/20`}>
                      {strengthTheme.label}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-inner shadow-inner">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${strengthTheme.bg}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="flex items-center gap-2 mb-1 opacity-60">
                      <Zap className="w-3 h-3" />
                      {/* AUDIT FIX C-03: Správný label — odolnost dle zxcvbn modelu, ne Shannon entropie */}
                      <p className="text-[10px] uppercase font-bold">Odolnost (zxcvbn model)</p>
                    </div>
                    <p className="text-xl font-mono font-bold">
                      {result.resistanceBits} <span className="text-xs opacity-50">bitů</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-tight">
                      log₂(odhadovaných pokusů útočníka)
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="flex items-center gap-2 mb-1 opacity-60">
                      <Skull className="w-3 h-3" />
                      <p className="text-[10px] uppercase font-bold">Rychlý útok (GPU)</p>
                    </div>
                    <p className="text-xl font-mono font-bold truncate">{result.crackTime}</p>
                  </div>
                </div>

                {/* HIBP Status */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
                    Stav v databázích úniků
                  </h3>

                  {result.isCheckingPwned ? (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      <div>
                        <p className="text-sm font-medium">Kontroluji v HaveIBeenPwned...</p>
                        <p className="text-xs text-muted-foreground">Používám k-Anonymity protokol</p>
                      </div>
                    </div>
                  ) : result.hibpError ? (
                    /* AUDIT FIX M-05: Zobrazení chyby API místo falešného "nenalezeno" */
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-yellow-500">Kontrola nedostupná</h4>
                          <p className="text-sm text-yellow-400/80">
                            Nepodařilo se spojit s HIBP API. Výsledek nelze ověřit — zkuste to znovu.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : result.isPwned ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-500 mb-1">Heslo bylo kompromitováno!</h4>
                          <p className="text-sm text-red-400/80">
                            Nalezeno {result.pwnedCount.toLocaleString()}x v databázích uniklých hesel.
                            Toto heslo NIKDY nepoužívejte.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex gap-3 items-center">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-400">
                            Heslo nebylo nalezeno v únicích
                          </h4>
                          <p className="text-xs text-emerald-300/70">
                            Zkontrolováno v databázi 600M+ hesel
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Structural checks */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
                    Kontrola struktury hesla
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {result.checks.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm p-3 rounded-lg bg-background/30 border border-border/20"
                      >
                        <span className={c.passed ? "text-foreground" : "text-muted-foreground"}>
                          {c.label}
                        </span>
                        {c.passed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <XCircle className="w-4 h-4 text-muted-foreground/30" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings and feedback */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
                    Nalezené problémy a doporučení
                  </h3>

                  {result.warning && !result.isPwned && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <Skull className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-400 mb-1">Kritický problém</h4>
                          <p className="text-sm text-red-300/80">{result.warning}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.feedback.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <Info className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-amber-400 mb-2">
                            Doporučení ke zlepšení
                          </h4>
                          <ul className="space-y-2">
                            {result.feedback.map((f, i) => (
                              <li key={i} className="text-sm text-amber-200/70 flex gap-2 items-start">
                                <span className="text-amber-400 mt-0.5">-</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.feedback.length === 0 && !result.warning && !result.isPwned && !result.hibpError && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex gap-3 items-center">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-400">Výborně!</h4>
                          <p className="text-sm text-emerald-300/70">Nebyly nalezeny žádné známé slabiny.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-primary/20 hover:bg-primary/5 bg-transparent"
                    onClick={clearSensitiveData}
                  >
                    Vymazat heslo a začít znovu
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}