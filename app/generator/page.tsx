"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, RefreshCw, ShieldCheck, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// ZNAKOVÉ SADY
// =============================================================================

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=",
}

// =============================================================================
// WEB WORKER CODE (Inline Blob)
// =============================================================================
// Přidán parametr `minimums` — objekt { sada: minPočet }.
// Worker garantuje minimální počet znaků z každé sady před výplní zbytku.
// Fisher-Yates shuffle zajišťuje uniformní distribuci pozic garantovaných znaků.
// =============================================================================

const GENERATOR_WORKER_CODE = `
self.onmessage = function(e) {
  const { length, charsets, minimums, requestId } = e.data;

  if (
    typeof requestId !== 'number' ||
    typeof length !== 'number' ||
    !Array.isArray(charsets)
  ) {
    self.postMessage({ requestId: requestId ?? -1, password: "" });
    return;
  }

  const activeSets = charsets.filter(s => typeof s === 'string' && s.length > 0);
  if (length <= 0 || activeSets.length === 0) {
    self.postMessage({ requestId, password: "" });
    return;
  }

  // minimums: pole stejné délky jako charsets, např. [1, 1, 2, 2]
  const mins = Array.isArray(minimums) ? minimums : activeSets.map(() => 1);

  const fullCharset = activeSets.join("");
  const result = [];

  function getSecureRandomInt(max) {
    if (max <= 0) throw new RangeError('max must be > 0, got ' + max);
    if (max === 1) return 0;
    const buffer = new Uint32Array(1);
    const limit = 0xFFFFFFFF - (0xFFFFFFFF % max);
    let val;
    do {
      crypto.getRandomValues(buffer);
      val = buffer[0];
    } while (val >= limit);
    return val % max;
  }

  function secureShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 1. GARANCE: Z každé sady vygeneruj požadovaný minimální počet znaků.
  //    Pokud by součet minimálních znaků překročil délku hesla,
  //    proporcionálně zkrátíme každý minimum (zachová poměry).
  const totalMins = mins.reduce((a, b) => a + b, 0);
  const scaleFactor = totalMins > length ? length / totalMins : 1;

  for (let i = 0; i < activeSets.length; i++) {
    const set = activeSets[i];
    const count = Math.max(1, Math.round((mins[i] || 1) * scaleFactor));
    for (let j = 0; j < count && result.length < length; j++) {
      result.push(set[getSecureRandomInt(set.length)]);
    }
  }

  // 2. VÝPLŇ: Zbývající pozice vyplní rovnoměrně z celé abecedy.
  const remaining = length - result.length;
  if (remaining > 0) {
    const cLen = fullCharset.length;
    const maxU32 = 0xFFFFFFFF;
    const limit = maxU32 - (maxU32 % cLen);
    const buffer = new Uint32Array(Math.ceil(remaining * 1.25));
    let bIdx = buffer.length;
    let added = 0;
    while (added < remaining) {
      if (bIdx >= buffer.length) {
        crypto.getRandomValues(buffer);
        bIdx = 0;
      }
      const val = buffer[bIdx++];
      if (val < limit) {
        result.push(fullCharset[val % cLen]);
        added++;
      }
    }
  }

  // 3. MÍCHÁNÍ: Uniformní distribuce — nikdo neví kde jsou garantované znaky.
  secureShuffle(result);

  self.postMessage({ requestId, password: result.join("") });
};
`

// =============================================================================
// VÝPOČET ENTROPIE
// =============================================================================
// Zahrnuje penalizaci za minimální znaky — garantované pozice mají nižší
// entropii než volně zvolené pozice z celé abecedy.
// =============================================================================

const calculateActualEntropy = (
  length: number,
  charsets: string[],
  minimums: number[],
): number => {
  if (charsets.length === 0 || length === 0) return 0
  const C = charsets.join("").length
  if (C === 0) return 0

  const totalMins = minimums.reduce((a, b) => a + b, 0)
  const scaleFactor = totalMins > length ? length / totalMins : 1

  // Entropie garantovaných pozic (každá sada přispívá log2(|sady|) na pozici)
  let guaranteedEntropy = 0
  let guaranteedCount = 0
  charsets.forEach((set, i) => {
    const count = Math.max(1, Math.round((minimums[i] || 1) * scaleFactor))
    guaranteedEntropy += count * Math.log2(Math.max(set.length, 1))
    guaranteedCount += count
  })

  // Entropie volných pozic
  const freePositions = Math.max(length - guaranteedCount, 0)
  const freeEntropy = freePositions * Math.log2(C)

  // Entropie shufflu — log2(length!)
  let shuffleEntropy = 0
  for (let i = 2; i <= length; i++) shuffleEntropy += Math.log2(i)

  return Math.floor(guaranteedEntropy + freeEntropy + shuffleEntropy)
}

// =============================================================================
// HELPER
// =============================================================================

const getSecureRandomInt = (max: number): number => {
  if (max <= 1) return 0
  const buffer = new Uint32Array(1)
  const limit = 0xffffffff - (0xffffffff % max)
  let v: number
  do {
    crypto.getRandomValues(buffer)
    v = buffer[0]
  } while (v >= limit)
  return v % max
}

// =============================================================================
// TYPY
// =============================================================================

type OptionsKey = keyof typeof CHARSETS

interface MinimumCounts {
  uppercase: number
  lowercase: number
  numbers: number
  symbols: number
}

// =============================================================================
// UI COMPONENT
// =============================================================================

export default function GeneratorPage() {
  const [password, setPassword] = useState("")
  const [displayedPassword, setDisplayedPassword] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  // Minimální počty znaků pro každou sadu (výchozí: 1 pro každou)
  const [minimums, setMinimums] = useState<MinimumCounts>({
    uppercase: 1,
    lowercase: 1,
    numbers: 1,
    symbols: 1,
  })

  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const clipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityListenerRef = useRef<(() => void) | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const { toast } = useToast()

  useEffect(() => {
    const blob = new Blob([GENERATOR_WORKER_CODE], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    workerRef.current = new Worker(url)

    workerRef.current.onmessage = (e) => {
      const data = e.data
      if (
        typeof data !== "object" ||
        data === null ||
        typeof data.requestId !== "number" ||
        typeof data.password !== "string" ||
        data.password.length > 128
      ) {
        console.warn("Worker: nevalidní zpráva, ignoruji.")
        return
      }
      const { requestId, password: newPwd } = data
      if (requestId !== requestIdRef.current) return
      if (newPwd) {
        setPassword(newPwd)
        animatePasswordRef.current?.(newPwd)
      }
    }

    return () => {
      workerRef.current?.terminate()
      URL.revokeObjectURL(url)
      if (animationRef.current) clearInterval(animationRef.current)
      if (clipboardTimeoutRef.current) clearTimeout(clipboardTimeoutRef.current)
      if (visibilityListenerRef.current) {
        document.removeEventListener("visibilitychange", visibilityListenerRef.current)
      }
    }
  }, [])

  const animatePasswordRef = useRef<((pwd: string) => void) | null>(null)

  const copyToClipboard = useCallback(
    async (textToCopy: string) => {
      if (!textToCopy) return
      try {
        await navigator.clipboard.writeText(textToCopy)
        if (clipboardTimeoutRef.current) clearTimeout(clipboardTimeoutRef.current)
        if (visibilityListenerRef.current) {
          document.removeEventListener("visibilitychange", visibilityListenerRef.current)
          visibilityListenerRef.current = null
        }
        const clearClipboard = async () => {
          try {
            const current = await navigator.clipboard.readText()
            if (current === textToCopy) await navigator.clipboard.writeText("")
          } catch {
            try { await navigator.clipboard.writeText("") } catch { /* focused */ }
          }
          if (visibilityListenerRef.current) {
            document.removeEventListener("visibilitychange", visibilityListenerRef.current)
            visibilityListenerRef.current = null
          }
        }
        const handleVisibilityChange = () => {
          if (document.visibilityState === "hidden") clearClipboard()
        }
        visibilityListenerRef.current = handleVisibilityChange
        document.addEventListener("visibilitychange", handleVisibilityChange)
        clipboardTimeoutRef.current = setTimeout(clearClipboard, 30_000)
        toast({
          title: "Zkopírováno!",
          description: "Heslo bude smazáno za 30 sekund nebo při přepnutí záložky.",
          duration: 3000,
        })
      } catch {
        toast({ title: "Chyba", description: "Nelze přistoupit ke schránce.", variant: "destructive" })
      }
    },
    [toast],
  )

  const animatePassword = useCallback(
    (finalPassword: string) => {
      const fullCharset = Object.entries(options)
        .filter(([, v]) => v)
        .map(([k]) => CHARSETS[k as OptionsKey])
        .join("")
      if (!fullCharset) return
      if (animationRef.current) clearInterval(animationRef.current)
      setIsAnimating(true)
      setDisplayedPassword("")
      let currentIndex = 0
      let scrambleCount = 0
      const maxScrambles = 3
      animationRef.current = setInterval(() => {
        if (currentIndex >= finalPassword.length) {
          if (animationRef.current) clearInterval(animationRef.current)
          setDisplayedPassword(finalPassword)
          setIsAnimating(false)
          return
        }
        let display = finalPassword.slice(0, currentIndex)
        if (scrambleCount < maxScrambles) {
          display += fullCharset[getSecureRandomInt(fullCharset.length)]
          scrambleCount++
        } else {
          display += finalPassword[currentIndex]
          currentIndex++
          scrambleCount = 0
        }
        for (let i = currentIndex + (scrambleCount < maxScrambles ? 1 : 0); i < finalPassword.length; i++) {
          display += fullCharset[getSecureRandomInt(fullCharset.length)]
        }
        setDisplayedPassword(display)
      }, 25)
    },
    [options],
  )

  useEffect(() => { animatePasswordRef.current = animatePassword }, [animatePassword])

  const handleGenerate = useCallback(() => {
    const activeKeys = Object.entries(options)
      .filter(([, v]) => v)
      .map(([k]) => k as OptionsKey)

    if (activeKeys.length === 0) {
      toast({ title: "Chyba", description: "Vyberte alespoň jeden typ znaků.", variant: "destructive" })
      return
    }

    // Validace: součet minimálních znaků nesmí přesáhnout délku hesla
    const totalMins = activeKeys.reduce((sum, k) => sum + minimums[k], 0)
    if (totalMins > length) {
      toast({
        title: "Konflikt nastavení",
        description: `Součet minimálních znaků (${totalMins}) přesahuje délku hesla (${length}). Zvyšte délku nebo snižte minima.`,
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const charsets = activeKeys.map((k) => CHARSETS[k])
    const mins = activeKeys.map((k) => minimums[k])

    workerRef.current?.postMessage({
      length,
      charsets,
      minimums: mins,
      requestId: ++requestIdRef.current,
    })
  }, [length, options, minimums, toast])

  // Aktivní sady a jejich minima pro výpočet entropie
  const activeEntries = Object.entries(options)
    .filter(([, v]) => v)
    .map(([k]) => k as OptionsKey)
  const activeCharsets = activeEntries.map((k) => CHARSETS[k])
  const activeMins = activeEntries.map((k) => minimums[k])

  // Celkový součet minimálních znaků pro validační indikátor
  const totalMins = activeEntries.reduce((sum, k) => sum + minimums[k], 0)
  const minsExceedLength = totalMins > length

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
              <ShieldCheck className="h-3 w-3" />
              <span>Enterprise CSPRNG Algorithm</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Generátor hesel</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Vytvořte matematicky silná hesla přímo ve vašem prohlížeči bez odesílání dat na server.
            </p>
          </div>

          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur border-primary/10 shadow-lg">

            {/* Vygenerované heslo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Vygenerované heslo</Label>
                {password && (
                  <span className="text-xs text-muted-foreground animate-in fade-in">
                    Entropie: ~{calculateActualEntropy(length, activeCharsets, activeMins)} bitů
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="font-mono text-lg tracking-wide p-4 rounded-lg bg-background border border-input min-h-[56px] flex items-center break-all select-all transition-colors group-hover:border-primary/50 overflow-hidden">
                    {displayedPassword ? (
                      <span className={isAnimating ? "text-primary" : ""}>
                        {displayedPassword.split("").map((char, i) => (
                          <span
                            key={i}
                            className={`inline-block transition-all duration-100 ${
                              isAnimating && i >= password.slice(0, displayedPassword.length).length - 1
                                ? "text-accent scale-110" : ""
                            }`}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/50 text-sm italic select-none">
                        <Lock className="h-4 w-4" />
                        Nastavte parametry a klikněte na generovat
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(password)}
                  disabled={!password || isAnimating}
                  className="h-14 w-14 shrink-0 border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
                  title="Zkopírovat do schránky"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Délka hesla */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Délka hesla</Label>
                <span className={`font-mono text-lg font-bold px-3 py-1 rounded transition-colors ${
                  minsExceedLength
                    ? "text-destructive bg-destructive/10"
                    : "text-primary bg-primary/10"
                }`}>
                  {length}
                </span>
              </div>
              <Slider
                value={[length]}
                onValueChange={(v) => setLength(v[0])}
                min={8}
                max={64}
                step={1}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>8 znaků</span>
                <span>64 znaků</span>
              </div>
            </div>

            {/* Znakové sady + minima */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Povolené znaky a minimální počty</Label>
                {minsExceedLength && (
                  <span className="text-xs text-destructive font-medium">
                    Součet minimálních znaků ({totalMins}) &gt; délka ({length})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries({
                  uppercase: { label: "Velká písmena", hint: "(A-Z)" },
                  lowercase: { label: "Malá písmena", hint: "(a-z)" },
                  numbers: { label: "Číslice", hint: "(0-9)" },
                  symbols: { label: "Speciální znaky", hint: "(!@#)" },
                }) as [OptionsKey, { label: string; hint: string }][]).map(([key, data]) => (
                  <div
                    key={key}
                    className={`rounded-lg border transition-colors ${
                      options[key]
                        ? "bg-secondary/30 border-transparent hover:border-border"
                        : "bg-muted/20 border-transparent opacity-60"
                    }`}
                  >
                    {/* Řádek s checkboxem */}
                    <div className="flex items-center space-x-3 p-3 pb-2">
                      <Checkbox
                        id={key}
                        checked={options[key]}
                        onCheckedChange={(c) => setOptions((o) => ({ ...o, [key]: !!c }))}
                      />
                      <Label htmlFor={key} className="flex-1 cursor-pointer font-normal">
                        {data.label}{" "}
                        <span className="text-muted-foreground ml-1">{data.hint}</span>
                      </Label>
                    </div>

                    {/* Selector minimálního počtu — zobrazí se jen pokud je sada aktivní */}
                    {options[key] && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16">Min. počet:</span>
                          <div className="flex items-center gap-1">
                            {/* Tlačítko minus */}
                            <button
                              onClick={() =>
                                setMinimums((m) => ({
                                  ...m,
                                  [key]: Math.max(1, m[key] - 1),
                                }))
                              }
                              className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-accent border border-border text-sm font-bold transition-colors"
                              title="Snížit minimum"
                            >
                              −
                            </button>

                            {/* Aktuální hodnota */}
                            <span className={`w-7 text-center text-sm font-mono font-bold transition-colors ${
                              minsExceedLength ? "text-destructive" : "text-primary"
                            }`}>
                              {minimums[key]}
                            </span>

                            {/* Tlačítko plus */}
                            <button
                              onClick={() =>
                                setMinimums((m) => ({
                                  ...m,
                                  [key]: Math.min(10, m[key] + 1),
                                }))
                              }
                              className="w-6 h-6 rounded flex items-center justify-center bg-muted hover:bg-accent border border-border text-sm font-bold transition-colors"
                              title="Zvýšit minimum"
                            >
                              +
                            </button>
                          </div>

                          {/* Vizuální indikátor */}
                          <div className="flex gap-0.5 ml-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-sm transition-colors ${
                                  i < minimums[key]
                                    ? minsExceedLength
                                      ? "bg-destructive"
                                      : "bg-primary"
                                    : "bg-border"
                                }`}
                              />
                            ))}
                            {minimums[key] > 5 && (
                              <span className="text-xs text-muted-foreground ml-0.5">
                                +{minimums[key] - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generovat */}
            <Button
              onClick={handleGenerate}
              disabled={minsExceedLength}
              className="w-full h-12 text-base shadow-md transition-all hover:scale-[1.01] disabled:hover:scale-100"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Vygenerovat bezpečné heslo
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Hesla jsou generována lokálně pomocí{" "}
                <code>crypto.getRandomValues()</code>.<br />
                Žádná data nejsou odesílána na server. Schránka se vyčistí za 30 sekund nebo při přepnutí záložky.
              </p>
            </div>

          </Card>
        </div>
      </main>
    </div>
  )
}
