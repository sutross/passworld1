import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Key, Search, TestTube, Lock, Eye, Zap } from "lucide-react"

// =============================================================================
// HOMEPAGE COMPONENT
// =============================================================================
// Hlavní vstupní stránka aplikace. Slouží jako rozcestník k jednotlivým
// nástrojům (generátor, kontrola úniku, test síly) a poskytuje přehled
// o bezpečnostních funkcích aplikace.
// =============================================================================

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        {/* ===== HERO SECTION ===== */}
        {/* Hlavní banner s CTA tlačítky pro rychlý přístup k nástrojům */}
        <div className="text-center space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
            <Lock className="h-4 w-4" />
            <span>Zabezpečení na podnikové úrovni</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Chraňte svou digitální
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              identitu
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Profesionální nástroje pro zabezpečení hesel navržené s kryptografickou přesností. Generujte, testujte a
            ověřujte svá hesla pomocí nejmodernějších technologií.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/generator">
                <Key className="h-5 w-5" />
                Vygenerovat heslo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 bg-transparent">
              <Link href="/test">
                <Search className="h-5 w-5" />
                Analyzovat heslo
              </Link>
            </Button>
          </div>
        </div>

        {/* ===== FEATURES GRID ===== */}
        {/* Mřížka karet s přehledem hlavních funkcí aplikace. Každá karta 
            odkazuje na příslušnou stránku s nástrojem. */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-20">
          <Card className="p-6 space-y-4 border-primary/20 bg-card/50 backdrop-blur hover:border-primary/40 transition-all">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Generátor hesel</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vytvářejte kryptograficky bezpečná hesla s nastavitelnou délkou a sadou znaků. Navrženo pro maximální
              entropii.
            </p>
            <Button asChild variant="ghost" className="w-full justify-start text-primary">
              <Link href="/generator">Vygenerovat nyní →</Link>
            </Button>
          </Card>

          <Card className="p-6 space-y-4 border-secondary/20 bg-card/50 backdrop-blur hover:border-secondary/40 transition-all">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Analýza a kontrola úniků</h3>
            <p className="text-muted-foreground leading-relaxed">
              Komplexní analýza síly hesla s kontrolou v databázi 600M+ uniklých hesel pomocí HIBP API.
            </p>
            <Button asChild variant="ghost" className="w-full justify-start text-secondary">
              <Link href="/test">Analyzovat heslo →</Link>
            </Button>
          </Card>

          <Card className="p-6 space-y-4 border-accent/20 bg-card/50 backdrop-blur hover:border-accent/40 transition-all">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TestTube className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">OWASP test síly</h3>
            <p className="text-muted-foreground leading-relaxed">
              Analyzujte sílu hesla pomocí průmyslových standardů OWASP a výpočtu entropie v reálném čase.
            </p>
            <Button asChild variant="ghost" className="w-full justify-start text-accent">
              <Link href="/test">Otestovat nyní →</Link>
            </Button>
          </Card>
        </div>

        {/* ===== SECURITY FEATURES SECTION ===== */}
        {/* Sekce zdůrazňující bezpečnostní aspekty aplikace:
            - Zero-knowledge architektura (vše běží na klientovi)
            - k-Anonymity pro kontrolu úniků
            - Real-time zpracování bez latence serveru */}
        <div className="text-center space-y-8 py-12">
          <h2 className="text-3xl font-bold">Postaveno s ohledem na bezpečnost</h2>

          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold">Nulové znalosti</h4>
              <p className="text-sm text-muted-foreground">
                Všechny operace probíhají na straně klienta. Vaše hesla nikdy neopustí vaše zařízení.
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <h4 className="font-semibold">Šifrované kontroly</h4>
              <p className="text-sm text-muted-foreground">
                Kontroly úniku dat používají k-Anonymity k ochraně vašeho hesla během ověřování.
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <h4 className="font-semibold">Okamžité výsledky</h4>
              <p className="text-sm text-muted-foreground">Generování a analýza hesel v reálném čase bez čekání.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
