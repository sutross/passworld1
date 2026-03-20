"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Copy, RefreshCw, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// ZNAKOVÉ SADY
// =============================================================================

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers:   "0123456789",
  symbols:   "!@#$%^&*()_+-=",
} as const

type CharsetKey = keyof typeof CHARSETS

// =============================================================================
// WEB WORKER
// =============================================================================

const WORKER_CODE = `
self.onmessage = function(e) {
  const { length, charsets, minimums, requestId } = e.data
  if (typeof requestId !== 'number' || typeof length !== 'number' || !Array.isArray(charsets)) {
    self.postMessage({ requestId: requestId ?? -1, password: "" }); return
  }
  const active = charsets.filter(s => typeof s === 'string' && s.length > 0)
  if (length <= 0 || active.length === 0) { self.postMessage({ requestId, password: "" }); return }
  const mins = Array.isArray(minimums) ? minimums : active.map(() => 1)
  const full = active.join("")
  const result = []
  function rnd(max) {
    if (max <= 0) throw new RangeError('max <= 0')
    if (max === 1) return 0
    const buf = new Uint32Array(1)
    const lim = 0xFFFFFFFF - (0xFFFFFFFF % max)
    let v; do { crypto.getRandomValues(buf); v = buf[0] } while (v >= lim)
    return v % max
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i+1); [a[i],a[j]]=[a[j],a[i]] }
  }
  const totalMins = mins.reduce((a,b)=>a+b,0)
  const scale = totalMins > length ? length/totalMins : 1
  for (let i = 0; i < active.length; i++) {
    const cnt = Math.max(1, Math.round((mins[i]||1)*scale))
    for (let j = 0; j < cnt && result.length < length; j++) result.push(active[i][rnd(active[i].length)])
  }
  const rem = length - result.length
  if (rem > 0) {
    const cLen = full.length, lim = 0xFFFFFFFF - (0xFFFFFFFF % cLen)
    const buf = new Uint32Array(Math.ceil(rem*1.25))
    let bi = buf.length, added = 0
    while (added < rem) {
      if (bi >= buf.length) { crypto.getRandomValues(buf); bi = 0 }
      const v = buf[bi++]
      if (v < lim) { result.push(full[v % cLen]); added++ }
    }
  }
  shuffle(result)
  self.postMessage({ requestId, password: result.join("") })
}
`

// =============================================================================
// VÝPOČET ENTROPIE
// =============================================================================

function calcEntropy(length: number, charsets: string[], minimums: number[]): number {
  if (!charsets.length || !length) return 0
  const C = charsets.join("").length
  if (!C) return 0
  const totalMins = minimums.reduce((a, b) => a + b, 0)
  const scale = totalMins > length ? length / totalMins : 1
  let guaranteed = 0, gCount = 0
  charsets.forEach((set, i) => {
    const cnt = Math.max(1, Math.round((minimums[i] || 1) * scale))
    guaranteed += cnt * Math.log2(Math.max(set.length, 1))
    gCount += cnt
  })
  const free = Math.max(length - gCount, 0) * Math.log2(C)
  let shuffle = 0
  for (let i = 2; i <= length; i++) shuffle += Math.log2(i)
  return Math.floor(guaranteed + free + shuffle)
}

// =============================================================================
// HELPER
// =============================================================================

function secureRandom(max: number): number {
  if (max <= 1) return 0
  const buf = new Uint32Array(1)
  const lim = 0xffffffff - (0xffffffff % max)
  let v: number
  do { crypto.getRandomValues(buf); v = buf[0] } while (v >= lim)
  return v % max
}

function entropyColor(bits: number): string {
  if (bits < 40) return "#ef4444"
  if (bits < 60) return "#f97316"
  if (bits < 80) return "#eab308"
  if (bits < 128) return "#4ade80"
  return "#34d399"
}

function entropyLabel(bits: number): string {
  if (bits < 40) return "Kriticky slabé"
  if (bits < 60) return "Slabé"
  if (bits < 80) return "Dobré"
  if (bits < 128) return "Silné"
  return "Vojenská úroveň"
}

// =============================================================================
// TYPY
// =============================================================================

interface MinCounts { uppercase: number; lowercase: number; numbers: number; symbols: number }

// =============================================================================
// PAGE STYLES — inline aby neovlivňovaly zbytek Next.js aplikace
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600&display=swap');

  .gen-page * { box-sizing: border-box; }

  .gen-page {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    padding: 32px 16px 64px;
  }

  /* ===== HERO ===== */
  .gen-hero { max-width: 560px; margin: 0 auto 28px; }
  .gen-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: oklch(0.55 0.12 160 / 0.1);
    border: 1px solid oklch(0.55 0.12 160 / 0.25);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; color: oklch(0.65 0.12 160);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 16px; letter-spacing: 0.04em;
  }
  .gen-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: oklch(0.65 0.12 160);
    animation: gen-pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes gen-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  .gen-title {
    font-size: clamp(22px, 4vw, 30px);
    font-weight: 600; line-height: 1.2;
    margin-bottom: 8px;
  }
  .gen-sub { font-size: 14px; color: var(--muted-foreground); line-height: 1.6; }

  /* ===== CARD ===== */
  .gen-card {
    max-width: 560px; margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
  }

  /* ===== PASSWORD DISPLAY ===== */
  .gen-pwd-section { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
  .gen-pwd-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .gen-pwd-label {
    font-size: 11px; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--muted-foreground);
  }
  .gen-entropy-pill {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-family: 'JetBrains Mono', monospace;
    background: oklch(0.55 0.12 160 / 0.08);
    border: 1px solid oklch(0.55 0.12 160 / 0.2);
    border-radius: 10px; padding: 3px 8px;
    transition: all 0.3s;
  }
  .gen-pwd-box {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 16px;
    min-height: 54px; display: flex; align-items: center;
    gap: 12px; transition: border-color 0.2s;
    cursor: default;
  }
  .gen-pwd-box:hover { border-color: oklch(0.55 0.12 160 / 0.4); }
  .gen-pwd-text {
    flex: 1; font-family: 'JetBrains Mono', monospace;
    font-size: 16px; letter-spacing: 0.06em;
    word-break: break-all; line-height: 1.55;
    user-select: all;
  }
  .gen-pwd-placeholder {
    font-family: 'JetBrains Mono', monospace; font-size: 13px;
    color: var(--muted-foreground); opacity: 0.4;
    font-style: italic; user-select: none;
  }
  .gen-copy-btn {
    width: 34px; height: 34px; flex-shrink: 0;
    border-radius: 8px; border: 1px solid var(--border);
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted-foreground); transition: all 0.15s;
  }
  .gen-copy-btn:hover:not(:disabled) {
    background: oklch(0.55 0.12 160 / 0.1);
    border-color: oklch(0.55 0.12 160 / 0.4);
    color: oklch(0.65 0.12 160);
  }
  .gen-copy-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .gen-copy-btn.copied {
    background: oklch(0.55 0.12 160 / 0.15);
    border-color: oklch(0.55 0.12 160 / 0.5);
    color: oklch(0.65 0.12 160);
  }

  /* Strength bar */
  .gen-strength-bar {
    height: 3px; background: var(--border); border-radius: 2px;
    margin-top: 10px; overflow: hidden;
  }
  .gen-strength-fill {
    height: 100%; border-radius: 2px;
    transition: width 0.5s cubic-bezier(0.34,1.56,0.64,1), background 0.4s;
  }

  /* ===== LENGTH CONTROL ===== */
  .gen-length-section { padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .gen-ctrl-label-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .gen-ctrl-label { font-size: 12px; font-weight: 500; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.08em; }
  .gen-ctrl-val {
    font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700;
    padding: 2px 10px; border-radius: 8px; transition: color 0.2s, background 0.2s;
  }
  .gen-ctrl-val.ok { color: oklch(0.65 0.12 160); background: oklch(0.55 0.12 160 / 0.1); }
  .gen-ctrl-val.warn { color: oklch(0.6 0.2 30); background: oklch(0.6 0.2 30 / 0.1); }

  .gen-slider-wrap { position: relative; height: 20px; display: flex; align-items: center; }
  .gen-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 3px; border-radius: 2px; outline: none;
    cursor: pointer; transition: opacity 0.2s;
    background: linear-gradient(
      to right,
      oklch(0.55 0.12 160) 0%,
      oklch(0.55 0.12 160) var(--pct, 53%),
      var(--border) var(--pct, 53%),
      var(--border) 100%
    );
  }
  .gen-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: oklch(0.65 0.12 160); cursor: pointer;
    border: 2px solid var(--background);
    box-shadow: 0 0 0 1px oklch(0.55 0.12 160 / 0.4);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .gen-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 0 3px oklch(0.55 0.12 160 / 0.2);
  }
  .gen-slider::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    background: oklch(0.65 0.12 160); cursor: pointer;
    border: 2px solid var(--background);
  }
  .gen-slider-ticks { display: flex; justify-content: space-between; margin-top: 6px; }
  .gen-slider-tick { font-size: 10px; color: var(--muted-foreground); opacity: 0.5; font-family: 'JetBrains Mono', monospace; }

  /* ===== CHARSETS ===== */
  .gen-charsets-section { padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .gen-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .gen-section-title { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted-foreground); }
  .gen-total-mins { font-size: 11px; font-family: 'JetBrains Mono', monospace; }
  .gen-total-mins.ok { color: oklch(0.55 0.12 160); }
  .gen-total-mins.warn { color: oklch(0.6 0.2 30); }

  .gen-cs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .gen-cs-item {
    background: var(--background); border: 1px solid var(--border);
    border-radius: 12px; padding: 11px 13px;
    display: flex; flex-direction: column; gap: 9px;
    transition: border-color 0.2s, background 0.2s; cursor: pointer;
  }
  .gen-cs-item.active {
    border-color: oklch(0.55 0.12 160 / 0.3);
    background: oklch(0.55 0.12 160 / 0.04);
  }
  .gen-cs-item.inactive { opacity: 0.5; }

  .gen-cs-top { display: flex; align-items: center; gap: 8px; }
  .gen-cs-checkbox {
    width: 16px; height: 16px; border-radius: 4px;
    border: 1.5px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .gen-cs-checkbox.on {
    background: oklch(0.55 0.12 160);
    border-color: oklch(0.55 0.12 160);
  }
  .gen-cs-name { font-size: 12px; font-weight: 500; }
  .gen-cs-hint { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: var(--muted-foreground); margin-left: auto; opacity: 0.6; }

  .gen-cs-bottom { display: flex; align-items: center; gap: 6px; }
  .gen-cs-min-label { font-size: 10px; color: var(--muted-foreground); }
  .gen-cs-stepper { display: flex; align-items: center; gap: 4px; margin-left: auto; }
  .gen-cs-step-btn {
    width: 20px; height: 20px; border-radius: 5px;
    border: 1px solid var(--border); background: var(--muted);
    color: var(--foreground); font-size: 13px; font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.12s; line-height: 1;
  }
  .gen-cs-step-btn:hover { background: var(--accent); border-color: oklch(0.55 0.12 160 / 0.3); }
  .gen-cs-step-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .gen-cs-count {
    font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700;
    min-width: 18px; text-align: center; transition: color 0.2s;
  }
  .gen-cs-count.ok { color: oklch(0.65 0.12 160); }
  .gen-cs-count.warn { color: oklch(0.6 0.2 30); }

  .gen-cs-dots { display: flex; gap: 3px; align-items: center; }
  .gen-cs-dot {
    width: 8px; height: 3px; border-radius: 2px;
    transition: background 0.2s;
    background: var(--border);
  }
  .gen-cs-dot.filled.ok { background: oklch(0.55 0.12 160); }
  .gen-cs-dot.filled.warn { background: oklch(0.6 0.2 30); }
  .gen-cs-dot-extra { font-size: 9px; color: var(--muted-foreground); font-family: 'JetBrains Mono', monospace; }

  /* ===== CONFLICT WARNING ===== */
  .gen-conflict {
    margin: 0 20px; padding: 10px 14px;
    background: oklch(0.6 0.2 30 / 0.08);
    border: 1px solid oklch(0.6 0.2 30 / 0.25);
    border-radius: 10px; font-size: 12px;
    color: oklch(0.6 0.2 30); display: flex;
    align-items: center; gap: 8px;
    animation: gen-slide-in 0.2s ease;
  }
  @keyframes gen-slide-in { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

  /* ===== GENERATE BUTTON ===== */
  .gen-action-section { padding: 16px 20px 20px; }
  .gen-btn {
    width: 100%; height: 50px; border-radius: 13px;
    border: none; cursor: pointer;
    font-family: 'Sora', sans-serif; font-size: 14px;
    font-weight: 600; letter-spacing: 0.02em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    position: relative; overflow: hidden;
  }
  .gen-btn:not(:disabled) {
    background: oklch(0.55 0.12 160);
    color: oklch(0.98 0 0);
  }
  .gen-btn:not(:disabled):hover {
    background: oklch(0.6 0.14 160);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px oklch(0.55 0.12 160 / 0.3);
  }
  .gen-btn:not(:disabled):active { transform: translateY(0); }
  .gen-btn:disabled {
    background: var(--muted); color: var(--muted-foreground); cursor: not-allowed;
  }
  .gen-btn-spinning { animation: gen-spin 0.6s linear infinite; }
  @keyframes gen-spin { to { transform: rotate(360deg); } }

  .gen-note {
    text-align: center; margin-top: 10px;
    font-size: 11px; color: var(--muted-foreground); opacity: 0.6; line-height: 1.5;
  }
  .gen-note code { font-family: 'JetBrains Mono', monospace; font-size: 10px; }

  /* ===== CHAR COLORING ===== */
  .char-upper { color: oklch(0.65 0.12 220); }
  .char-lower { color: var(--foreground); }
  .char-num   { color: oklch(0.7 0.15 80); }
  .char-sym   { color: oklch(0.65 0.15 30); }

  /* ===== ANIMACE SCRAMBLE ===== */
  .char-scramble { animation: gen-char-in 0.08s ease forwards; }
  @keyframes gen-char-in { from{opacity:0.4;transform:translateY(-2px)} to{opacity:1;transform:none} }
`

// =============================================================================
// POMOCNÁ FUNKCE: Klasifikace znaku pro barevné zvýraznění
// =============================================================================

function charClass(c: string): string {
  if (/[A-Z]/.test(c)) return "char-upper"
  if (/[a-z]/.test(c)) return "char-lower"
  if (/[0-9]/.test(c)) return "char-num"
  return "char-sym"
}

// =============================================================================
// HLAVNÍ KOMPONENTA
// =============================================================================

export default function GeneratorPage() {
  const [password, setPassword] = useState("")
  const [displayed, setDisplayed] = useState<string[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true })
  const [minimums, setMinimums] = useState<MinCounts>({ uppercase: 1, lowercase: 1, numbers: 1, symbols: 1 })

  const animRef    = useRef<NodeJS.Timeout | null>(null)
  const clipRef    = useRef<NodeJS.Timeout | null>(null)
  const visRef     = useRef<(() => void) | null>(null)
  const workerRef  = useRef<Worker | null>(null)
  const reqIdRef   = useRef(0)
  const animFnRef  = useRef<((pwd: string) => void) | null>(null)
  const { toast }  = useToast()

  // Worker init
  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: "application/javascript" })
    const url  = URL.createObjectURL(blob)
    workerRef.current = new Worker(url)

    workerRef.current.onmessage = (e) => {
      const d = e.data
      if (!d || typeof d.requestId !== "number" || typeof d.password !== "string" || d.password.length > 128) return
      if (d.requestId !== reqIdRef.current) return
      if (d.password) {
        setPassword(d.password)
        setIsGenerating(false)
        animFnRef.current?.(d.password)
      }
    }

    return () => {
      workerRef.current?.terminate()
      URL.revokeObjectURL(url)
      if (animRef.current) clearInterval(animRef.current)
      if (clipRef.current) clearTimeout(clipRef.current)
      if (visRef.current) document.removeEventListener("visibilitychange", visRef.current)
    }
  }, [])

  // Scramble animace
  const animatePassword = useCallback((final: string) => {
    const chars = Object.entries(options).filter(([,v]) => v).map(([k]) => CHARSETS[k as CharsetKey]).join("")
    if (!chars) return
    if (animRef.current) clearInterval(animRef.current)

    setIsAnimating(true)
    setDisplayed([])
    let idx = 0, scrambles = 0
    const MAX_SCRAMBLES = 4

    animRef.current = setInterval(() => {
      if (idx >= final.length) {
        clearInterval(animRef.current!)
        setDisplayed(final.split(""))
        setIsAnimating(false)
        return
      }
      const arr: string[] = final.slice(0, idx).split("")
      if (scrambles < MAX_SCRAMBLES) {
        arr.push(chars[secureRandom(chars.length)])
        scrambles++
      } else {
        arr.push(final[idx])
        idx++
        scrambles = 0
      }
      for (let i = idx + (scrambles < MAX_SCRAMBLES ? 1 : 0); i < final.length; i++) {
        arr.push(chars[secureRandom(chars.length)])
      }
      setDisplayed(arr)
    }, 22)
  }, [options])

  useEffect(() => { animFnRef.current = animatePassword }, [animatePassword])

  // Clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      if (clipRef.current) clearTimeout(clipRef.current)
      if (visRef.current) { document.removeEventListener("visibilitychange", visRef.current); visRef.current = null }

      const clear = async () => {
        try { const c = await navigator.clipboard.readText(); if (c === text) await navigator.clipboard.writeText("") }
        catch { try { await navigator.clipboard.writeText("") } catch {} }
        if (visRef.current) { document.removeEventListener("visibilitychange", visRef.current); visRef.current = null }
      }

      const onVis = () => { if (document.visibilityState === "hidden") clear() }
      visRef.current = onVis
      document.addEventListener("visibilitychange", onVis)
      clipRef.current = setTimeout(clear, 30_000)

      toast({ title: "Zkopírováno!", description: "Schránka se vyčistí za 30 sekund.", duration: 2500 })
    } catch {
      toast({ title: "Chyba", description: "Nepodařilo se zkopírovat.", variant: "destructive" })
    }
  }, [toast])

  // Generate
  const handleGenerate = useCallback(() => {
    const active = Object.entries(options).filter(([,v]) => v).map(([k]) => k as CharsetKey)
    if (!active.length) { toast({ title: "Chyba", description: "Vyberte alespoň jednu sadu.", variant: "destructive" }); return }

    const totalMins = active.reduce((s, k) => s + minimums[k], 0)
    if (totalMins > length) {
      toast({ title: "Konflikt", description: `Součet minimálních znaků (${totalMins}) přesahuje délku (${length}).`, variant: "destructive", duration: 4000 })
      return
    }

    setIsGenerating(true)
    const charsets = active.map(k => CHARSETS[k])
    const mins     = active.map(k => minimums[k])
    workerRef.current?.postMessage({ length, charsets, minimums: mins, requestId: ++reqIdRef.current })
  }, [length, options, minimums, toast])

  // Slider PCT pro CSS gradient
  const sliderPct = `${((length - 8) / (64 - 8)) * 100}%`

  // Aktivní sady pro entropii
  const activeKeys    = (Object.keys(options) as CharsetKey[]).filter(k => options[k])
  const activeCharsets = activeKeys.map(k => CHARSETS[k])
  const activeMins    = activeKeys.map(k => minimums[k])
  const entropy       = calcEntropy(length, activeCharsets, activeMins)
  const totalMins     = activeKeys.reduce((s, k) => s + minimums[k], 0)
  const conflict      = totalMins > length
  const eColor        = entropyColor(entropy)
  const eLabel        = entropyLabel(entropy)

  const CHARSET_META: Record<CharsetKey, { label: string; hint: string }> = {
    uppercase: { label: "Velká písmena", hint: "A–Z" },
    lowercase: { label: "Malá písmena",  hint: "a–z" },
    numbers:   { label: "Číslice",       hint: "0–9" },
    symbols:   { label: "Speciální znaky", hint: "!@#" },
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <style>{STYLES}</style>

      <div className="gen-page">

        {/* HERO */}
        <div className="gen-hero">
          <div className="gen-badge">
            <div className="gen-badge-dot" />
            CSPRNG · Rejection Sampling · Fisher-Yates shuffle
          </div>
          <h1 className="gen-title">Generátor bezpečných hesel</h1>
          <p className="gen-sub">
            Kryptograficky silná hesla generovaná lokálně ve vašem prohlížeči.
            Žádná data nejsou odesílána na server.
          </p>
        </div>

        {/* CARD */}
        <div className="gen-card">

          {/* PASSWORD DISPLAY */}
          <div className="gen-pwd-section">
            <div className="gen-pwd-meta">
              <span className="gen-pwd-label">Vygenerované heslo</span>
              {password && (
                <div className="gen-entropy-pill" style={{ borderColor: `${eColor}33`, color: eColor }}>
                  <ShieldCheck style={{ width: 11, height: 11 }} />
                  {entropy} bitů · {eLabel}
                </div>
              )}
            </div>

            <div className="gen-pwd-box">
              {displayed.length > 0 ? (
                <div className="gen-pwd-text">
                  {displayed.map((char, i) => (
                    <span key={i} className={`${charClass(char)} ${isAnimating ? "char-scramble" : ""}`}>
                      {char}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="gen-pwd-placeholder">
                  Nastavte parametry a vygenerujte heslo…
                </div>
              )}
              <button
                className={`gen-copy-btn ${copied ? "copied" : ""}`}
                onClick={() => copyToClipboard(password)}
                disabled={!password || isAnimating}
                title="Zkopírovat do schránky"
              >
                <Copy style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Strength bar */}
            <div className="gen-strength-bar">
              <div
                className="gen-strength-fill"
                style={{
                  width: password ? `${Math.min(100, (entropy / 128) * 100)}%` : "0%",
                  background: eColor,
                }}
              />
            </div>
          </div>

          {/* LENGTH */}
          <div className="gen-length-section">
            <div className="gen-ctrl-label-row">
              <span className="gen-ctrl-label">Délka hesla</span>
              <span className={`gen-ctrl-val ${conflict ? "warn" : "ok"}`}>{length}</span>
            </div>
            <input
              type="range" min={8} max={64} step={1}
              value={length}
              onChange={e => setLength(Number(e.target.value))}
              className="gen-slider"
              style={{ "--pct": sliderPct } as React.CSSProperties}
            />
            <div className="gen-slider-ticks">
              <span className="gen-slider-tick">8</span>
              <span className="gen-slider-tick">16</span>
              <span className="gen-slider-tick">24</span>
              <span className="gen-slider-tick">32</span>
              <span className="gen-slider-tick">48</span>
              <span className="gen-slider-tick">64</span>
            </div>
          </div>

          {/* CHARSETS */}
          <div className="gen-charsets-section">
            <div className="gen-section-header">
              <span className="gen-section-title">Znakové sady &amp; minima</span>
              <span className={`gen-total-mins ${conflict ? "warn" : "ok"}`}>
                {totalMins} / {length} min.
              </span>
            </div>

            <div className="gen-cs-grid">
              {(Object.keys(CHARSETS) as CharsetKey[]).map((key) => {
                const active = options[key]
                const min    = minimums[key]
                const dots   = Math.min(min, 5)
                return (
                  <div
                    key={key}
                    className={`gen-cs-item ${active ? "active" : "inactive"}`}
                    onClick={() => setOptions(o => ({ ...o, [key]: !o[key] }))}
                  >
                    <div className="gen-cs-top">
                      <div className={`gen-cs-checkbox ${active ? "on" : ""}`}>
                        {active && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="gen-cs-name">{CHARSET_META[key].label}</span>
                      <span className="gen-cs-hint">{CHARSET_META[key].hint}</span>
                    </div>

                    {active && (
                      <div className="gen-cs-bottom" onClick={e => e.stopPropagation()}>
                        <span className="gen-cs-min-label">Min.</span>
                        <div className="gen-cs-stepper">
                          <button
                            className="gen-cs-step-btn"
                            disabled={min <= 1}
                            onClick={() => setMinimums(m => ({ ...m, [key]: Math.max(1, m[key] - 1) }))}
                          >−</button>
                          <span className={`gen-cs-count ${conflict ? "warn" : "ok"}`}>{min}</span>
                          <button
                            className="gen-cs-step-btn"
                            disabled={min >= 10}
                            onClick={() => setMinimums(m => ({ ...m, [key]: Math.min(10, m[key] + 1) }))}
                          >+</button>
                        </div>
                        <div className="gen-cs-dots">
                          {Array.from({ length: Math.min(dots, 5) }).map((_, i) => (
                            <div key={i} className={`gen-cs-dot filled ${conflict ? "warn" : "ok"}`} />
                          ))}
                          {Array.from({ length: Math.max(0, 5 - dots) }).map((_, i) => (
                            <div key={`e-${i}`} className="gen-cs-dot" />
                          ))}
                          {min > 5 && <span className="gen-cs-dot-extra">+{min - 5}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* CONFLICT WARNING */}
          {conflict && (
            <div className="gen-conflict">
              <span>⚠</span>
              Součet minimálních znaků ({totalMins}) přesahuje délku hesla ({length}) — zvyšte délku nebo snižte minima.
            </div>
          )}

          {/* GENERATE */}
          <div className="gen-action-section" style={{ paddingTop: conflict ? 12 : 16 }}>
            <button
              className="gen-btn"
              onClick={handleGenerate}
              disabled={conflict || isGenerating}
            >
              <RefreshCw
                style={{ width: 16, height: 16 }}
                className={isGenerating ? "gen-btn-spinning" : ""}
              />
              {isGenerating ? "Generuji…" : "Vygenerovat heslo"}
            </button>
            <p className="gen-note">
              Generováno lokálně · <code>crypto.getRandomValues()</code> · schránka se vyčistí za 30 s
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
