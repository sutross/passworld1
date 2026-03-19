"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, RefreshCw, Key, ShieldCheck, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// ZNAKOVÉ SADY (sdíleno mezi hlavním vláknem a Workerem)
// =============================================================================

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-="
}

// =============================================================================
// WEB WORKER CODE (Inline Blob)
// =============================================================================
// Kryptografické generování hesla běží v separátním vlákně,
// aby neblokoval UI animaci a interakci uživatele.
// Worker používá CSPRNG (crypto.getRandomValues) s Rejection Sampling
// pro eliminaci modulo biasu a Fisher-Yates shuffle pro uniformní distribuci.
// =============================================================================

const GENERATOR_WORKER_CODE = `
self.onmessage = function(e) {
  const { length, charsets, requestId } = e.data;

  const activeSets = charsets.filter(Boolean);
  if (length <= 0 || activeSets.length === 0) {
    self.postMessage({ requestId, password: "" });
    return;
  }

  const fullCharset = activeSets.join("");
  const result = [];

  // Bezpecny nahodny int s Rejection Sampling (eliminace modulo biasu)
  function getSecureRandomInt(max) {
    const buffer = new Uint32Array(1);
    const limit = 0xFFFFFFFF - (0xFFFFFFFF % max);
    let val;
    do {
      crypto.getRandomValues(buffer);
      val = buffer[0];
    } while (val >= limit);
    return val % max;
  }

  // Fisher-Yates shuffle s CSPRNG
  function secureShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 1. GARANCE: Z kazde vybrane sady prave jeden znak
  for (let i = 0; i < activeSets.length && i < length; i++) {
    const set = activeSets[i];
    result.push(set[getSecureRandomInt(set.length)]);
  }

  // 2. VYPLN: Davkove zamitave vzorkovani
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

  // 3. MICHANI: Uniformni distribuce pozic
  secureShuffle(result);

  self.postMessage({ requestId, password: result.join("") });
};
`

// =============================================================================
// HELPER: Bezpečný náhodný int pro UI animaci (hlavní vlákno)
// =============================================================================

const getSecureRandomInt = (max: number): number => {
  const buffer = new Uint32Array(1)
  const limit = 0xFFFFFFFF - (0xFFFFFFFF % max)
  let randomValue
  do {
    crypto.getRandomValues(buffer)
    randomValue = buffer[0]
  } while (randomValue >= limit)
  return randomValue % max
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
  
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const clipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const { toast } = useToast()

  // Inicializace Web Workeru (Inline Blob URL)
  useEffect(() => {
    const blob = new Blob([GENERATOR_WORKER_CODE], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    workerRef.current = new Worker(url)
    
    workerRef.current.onmessage = (e) => {
      const { requestId, password: newPwd } = e.data
      // Ignoruj staré odpovedi (Race Condition prevence)
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
    }
  }, [])
  
  // Ref pro animaci (aby Worker callback měl vždy aktuální verzi)
  const animatePasswordRef = useRef<((pwd: string) => void) | null>(null)

  // Bezpečné kopírování do schránky s auto-mazáním (Transient Clipboard)
  const copyToClipboard = useCallback(async (textToCopy: string) => {
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: "Zkopírováno!",
        description: "Heslo je uloženo. Ze schránky zmizí za 60 sekund.",
        duration: 3000,
      })

      // Vymazat stávající timeout, pokud uživatel klikne dvakrát
      if (clipboardTimeoutRef.current) {
        clearTimeout(clipboardTimeoutRef.current)
      }

      // Vyčištění schránky po 60 sekundách
      clipboardTimeoutRef.current = setTimeout(() => {
        navigator.clipboard.writeText("")
          .catch(err => console.error("Nelze vyčistit schránku:", err))
      }, 60000)

    } catch (err) {
      console.error("Clipboard error:", err)
      toast({
        title: "Chyba",
        description: "Nepodařilo se přistoupit ke schránce.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Zabezpecena UI animace (bezi na hlavnim vlakne pro plynuly 60fps)
  const animatePassword = useCallback((finalPassword: string) => {
    const fullCharset = Object.entries(options)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([key]) => CHARSETS[key as keyof typeof CHARSETS])
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
  }, [options])

  // Sync ref pro Worker callback
  useEffect(() => {
    animatePasswordRef.current = animatePassword
  }, [animatePassword])

  // Odeslani pozadavku do Workeru (generovani bezi v separatnim vlakne)
  const handleGenerate = useCallback(() => {
    const isAnyOptionSelected = Object.values(options).some(val => val)

    if (!isAnyOptionSelected) {
      toast({
        title: "Chyba konfigurace",
        description: "Musíte vybrat alespoň jeden typ znaků.",
        variant: "destructive",
      })
      return
    }

    // Sestavime pole aktivnich znakových sad pro Worker
    const charsets = Object.entries(options)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([key]) => CHARSETS[key as keyof typeof CHARSETS])

    const requestId = ++requestIdRef.current
    workerRef.current?.postMessage({ length, charsets, requestId })
  }, [length, options, toast])

  const totalCharsetLength = Object.entries(options)
    .filter(([_, isEnabled]) => isEnabled)
    .reduce((acc, [key]) => acc + CHARSETS[key as keyof typeof CHARSETS].length, 0)

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
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Vygenerované heslo</Label>
                {password && (
                   <span className="text-xs text-muted-foreground animate-in fade-in">
                     Entropie: ~{Math.floor(length * Math.log2(totalCharsetLength))} bitů
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
                                ? "text-accent scale-110" 
                                : ""
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

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Délka hesla</Label>
                  <span className="font-mono text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                    {length}
                  </span>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0])}
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

              <div className="space-y-3">
                <Label>Povolené znaky</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries({
                    uppercase: { label: "Velká písmena", hint: "(A-Z)" },
                    lowercase: { label: "Malá písmena", hint: "(a-z)" },
                    numbers: { label: "Číslice", hint: "(0-9)" },
                    symbols: { label: "Speciální znaky", hint: "(!@#)" }
                  }).map(([key, data]) => (
                    <div key={key} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-border transition-colors">
                      <Checkbox 
                        id={key} 
                        checked={options[key as keyof typeof options]} 
                        onCheckedChange={(c) => setOptions(o => ({ ...o, [key]: !!c }))} 
                      />
                      <Label htmlFor={key} className="flex-1 cursor-pointer font-normal">
                        {data.label} <span className="text-muted-foreground ml-1">{data.hint}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full h-12 text-base shadow-md transition-all hover:scale-[1.01]" 
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Vygenerovat bezpečné heslo
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Hesla jsou generována lokálně pomocí <code>crypto.getRandomValues()</code>. <br/>
                Žádná data nejsou odesílána na server.
              </p>
            </div>

          </Card>
        </div>
      </main>
    </div>
  )
}
