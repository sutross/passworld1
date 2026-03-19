import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BookOpen,
  Shield,
  Key,
  Lock,
  Eye,
  AlertTriangle,
  Skull,
  Clock,
  Database,
  Cpu,
  Binary,
  TrendingUp,
  Users,
  Brain,
  Fingerprint,
  Server,
  Zap,
  Target,
  FileWarning,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Globe,
  ChevronRight,
  Calculator,
  Hash,
  Layers,
  Network,
  CheckCircle,
  XCircle,
  TestTube,
} from "lucide-react"

// =============================================================================
// EDUCATION PAGE COMPONENT
// =============================================================================
// Komplexní vzdělávací stránka o bezpečnosti hesel. Obsahuje 8 hlavních sekcí:
// 
// 1. STATISTIKY - Krutá realita úniků dat a jejich dopad
// 2. TYPY ÚTOKŮ - Brute force, slovníkové, rainbow tables, credential stuffing
// 3. ENTROPIE - Matematické základy síly hesla s praktickými příklady
// 4. PSYCHOLOGIE - Proč lidé volí slabá hesla a kognitivní zkreslení
// 5. BEST PRACTICES - Doporučené postupy pro tvorbu a správu hesel
// 6. SPRÁVCI HESEL - Přehled a doporučení password managerů
// 7. MFA - Vícefaktorová autentizace a její typy
// 8. NAŠE NÁSTROJE - Propojení s funkcemi této aplikace
//
// Stránka je statická (Server Component) pro optimální SEO a rychlé načítání.
// =============================================================================

export default function EducationPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* ===== HEADER SECTION ===== */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono">
              <BookOpen className="h-4 w-4" />
              <span>Komplexní průvodce bezpečností hesel</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Svět hesel: Kompletní osvěta</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto text-balance leading-relaxed">
              Pochopte, proč jsou hesla kritickým prvkem vaší digitální bezpečnosti, jaké hrozby existují a jak se před
              nimi efektivně chránit.
            </p>
          </div>

          {/* ===== TABLE OF CONTENTS ===== */}
          {/* Interaktivní obsah s anchor linky pro rychlou navigaci */}
          <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Obsah dokumentace
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {[
                { href: "#statistiky", label: "Statistiky a realita" },
                { href: "#typy-utoku", label: "Typy útoků na hesla" },
                { href: "#entropie", label: "Entropie a matematika hesel" },
                { href: "#psychologie", label: "Psychologie hesel" },
                { href: "#best-practices", label: "Doporučené postupy" },
                { href: "#spravci-hesel", label: "Správci hesel" },
                { href: "#mfa", label: "Vícefaktorová autentizace" },
                { href: "#nase-nastroje", label: "Naše nástroje" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 p-2 rounded hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4 text-primary" />
                  {item.label}
                </a>
              ))}
            </div>
          </Card>

          {/* ===== SECTION 1: STATISTIKY A KRUTÁ REALITA ===== */}
          {/* Šokující data o únicích hesel a jejich ekonomickém dopadu */}
          <section id="statistiky" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Skull className="h-5 w-5 text-destructive" />
              </div>
              Krutá realita: Statistiky úniků dat
            </h2>

            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Každý den dochází k tisícům pokusů o prolomení hesel. Databáze HaveIBeenPwned, kterou využívá naše
                aplikace, obsahuje přes <strong className="text-foreground">600 milionů</strong> uniklých hesel z
                reálných bezpečnostních incidentů.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <div className="text-3xl font-bold text-red-500 mb-2">81%</div>
                <p className="text-sm text-muted-foreground">
                  úniků dat je způsobeno slabými nebo ukradenými hesly (Verizon DBIR 2023)
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <div className="text-3xl font-bold text-orange-500 mb-2">123456</div>
                <p className="text-sm text-muted-foreground">
                  je stále nejpoužívanější heslo na světě, následované "password" a "qwerty"
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <div className="text-3xl font-bold text-yellow-500 mb-2">65%</div>
                <p className="text-sm text-muted-foreground">
                  lidí používá stejné heslo pro více účtů (Google Security Survey)
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <div className="text-3xl font-bold text-purple-500 mb-2">$4.35M</div>
                <p className="text-sm text-muted-foreground">
                  je průměrná cena jednoho úniku dat pro organizaci (IBM Cost of Data Breach 2023)
                </p>
              </Card>
            </div>

            <Card className="p-6 bg-card/50 backdrop-blur border-destructive/20">
              <h3 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Největší úniky hesel v historii
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "Collection #1-5",
                    year: "2019",
                    count: "2.2 miliardy",
                    desc: "záznamů email/heslo kombinací",
                  },
                  { name: "Yahoo", year: "2013-2014", count: "3 miliardy", desc: "účtů kompromitováno" },
                  { name: "LinkedIn", year: "2012/2021", count: "700 milionů", desc: "profilů vystaveno" },
                  { name: "Facebook", year: "2019", count: "533 milionů", desc: "uživatelských záznamů" },
                  { name: "Adobe", year: "2013", count: "153 milionů", desc: "špatně šifrovaných hesel" },
                ].map((breach, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground font-mono w-16">{breach.year}</div>
                    <div className="flex-1">
                      <span className="font-semibold">{breach.name}</span>
                      <span className="text-muted-foreground"> – </span>
                      <span className="text-destructive font-bold">{breach.count}</span>
                      <span className="text-muted-foreground"> {breach.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ===== SECTION 2: TYPY ÚTOKŮ NA HESLA ===== */}
          {/* Detailní popis útočných technik: brute force, dictionary, rainbow tables, 
              credential stuffing, phishing a keyloggery */}
          <section id="typy-utoku" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              Typy útoků na hesla
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Útočníci používají různé techniky k prolomení hesel. Pochopení těchto metod je klíčové pro vytváření
              odolných hesel.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Brute Force */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-orange-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Cpu className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Útok hrubou silou (Brute Force)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Systematické zkoušení všech možných kombinací znaků
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Moderní GPU (např. RTX 4090) dokáže otestovat{" "}
                    <strong className="text-foreground">až 10 miliard</strong> hashů za sekundu při útoku na MD5. Pro
                    SHA-256 je to přibližně 1 miliarda hashů/s.
                  </p>
                  <div className="p-3 rounded bg-background/50 font-mono text-xs">
                    <div className="text-muted-foreground">Příklad času prolomení (8 znaků, malá písmena):</div>
                    <div>
                      26^8 = 208 miliard kombinací ÷ 10B/s = <span className="text-orange-500">~21 sekund</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dictionary Attack */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Slovníkový útok (Dictionary Attack)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Použití předem připravených seznamů běžných hesel
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Útočníci používají slovníky obsahující miliony běžných hesel, slov, jmen a jejich variací.
                    Nejznámější je <strong className="text-foreground">RockYou</strong> seznam s 14 miliony reálných
                    hesel.
                  </p>
                  <div className="p-3 rounded bg-background/50">
                    <div className="text-muted-foreground text-xs mb-2">Běžné transformace ve slovnících:</div>
                    <div className="font-mono text-xs space-y-1">
                      <div>heslo → h3sl0, H3SL0, heslo123, heslo!, Heslo2024</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rainbow Tables */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Database className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Rainbow Tables</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Předpočítané tabulky hashů pro rychlé vyhledání
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Místo výpočtu hashů v reálném čase útočník použije předpočítanou tabulku, kde vyhledá hash a získá
                    původní heslo. Obrana: <strong className="text-foreground">salt</strong> (náhodná data přidaná k
                    heslu před hashováním).
                  </p>
                  <div className="p-3 rounded bg-background/50 font-mono text-xs">
                    <div className="text-green-500">S solí: hash(heslo + "x7Kp2") ≠ hash(heslo + "m9Qw4")</div>
                    <div className="text-red-500">Bez soli: hash(heslo) = vždy stejný výsledek</div>
                  </div>
                </div>
              </Card>

              {/* Credential Stuffing */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Network className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Credential Stuffing</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Použití uniklých přihlašovacích údajů na jiných službách
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Útočníci automaticky zkoušejí uniklé kombinace email/heslo na stovkách webů. Pokud používáte stejné
                    heslo všude, <strong className="text-destructive">jeden únik = kompromitace všech účtů</strong>.
                  </p>
                  <div className="p-3 rounded bg-background/50 text-xs">
                    <div className="text-muted-foreground">Průběh útoku:</div>
                    <div className="mt-1">Únik z webu A → Bot testuje na Gmail, Facebook, Amazon, banky...</div>
                  </div>
                </div>
              </Card>

              {/* Phishing */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Phishing a sociální inženýrství</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manipulace uživatele k dobrovolnému prozrazení hesla
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Falešné přihlašovací stránky, podvodné emaily nebo telefonáty. Ani nejsilnější heslo nepomůže, pokud
                    ho zadáte na útočníkovu stránku.
                  </p>
                  <div className="p-3 rounded bg-background/50 text-xs">
                    <div className="text-cyan-500">
                      Obrana: Kontrolujte URL, používejte 2FA, nikdy neklikejte na odkazy v emailech
                    </div>
                  </div>
                </div>
              </Card>

              {/* Keylogger */}
              <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Fingerprint className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Keyloggery a malware</h3>
                    <p className="text-sm text-muted-foreground mt-1">Software zachycující stisknuté klávesy</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Škodlivý software nainstalovaný na vašem zařízení může zachytit každé stisknutí klávesy včetně
                    hesel.
                  </p>
                  <div className="p-3 rounded bg-background/50 text-xs">
                    <div className="text-emerald-500">
                      Obrana: Aktualizovaný OS a antivirus, nestahovat z neznámých zdrojů, hardwarové klíče (FIDO2)
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* ===== SECTION 3: ENTROPIE A MATEMATIKA HESEL ===== */}
          {/* Vysvětlení konceptu entropie, vzorce, znakové sady a praktické příklady.
              Tato sekce je klíčová pro pochopení, proč délka a složitost hesla záleží. */}
          <section id="entropie" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-cyan-500" />
              </div>
              Entropie: Matematika síly hesla
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Entropie měří "náhodnost" nebo "nepředvídatelnost" hesla v bitech. Čím vyšší entropie, tím více pokusů
              útočník potřebuje k prolomení.
            </p>

            <Card className="p-6 bg-card/50 backdrop-blur border-cyan-500/20 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Binary className="h-5 w-5 text-cyan-500" />
                Jak se počítá síla hesla?
              </h3>
              
              {/* Jednoduché vysvětlení */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Entropie</strong> je číslo, které říká, jak těžké je heslo uhodnout. 
                  Čím vyšší číslo, tím bezpečnější heslo. Měří se v <strong className="text-foreground">bitech</strong>.
                </p>
              </div>

              {/* Vzorec s vizuálním vysvětlením */}
              <div className="space-y-4">
                <h4 className="font-semibold">Jednoduchý vzorec:</h4>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 text-center border border-border">
                    <div className="text-3xl font-bold text-cyan-500 mb-2">Délka</div>
                    <div className="text-sm text-muted-foreground">Kolik znaků má heslo</div>
                    <div className="mt-2 font-mono text-lg">L</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/50 text-center border border-border flex flex-col justify-center">
                    <div className="text-3xl font-bold text-muted-foreground">×</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background/50 text-center border border-border">
                    <div className="text-3xl font-bold text-emerald-500 mb-2">Složitost</div>
                    <div className="text-sm text-muted-foreground">Kolik různých znaků lze použít</div>
                    <div className="mt-2 font-mono text-lg">log₂(C)</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Výsledný vzorec:</div>
                  <div className="text-xl font-mono">
                    <span className="text-cyan-500 font-bold">Entropie</span> = 
                    <span className="text-cyan-500"> Délka hesla</span> × 
                    <span className="text-emerald-500"> Složitost znakové sady</span>
                  </div>
                </div>
              </div>

              {/* Znaková sada vysvětlení */}
              <div className="space-y-3">
                <h4 className="font-semibold">Co je "složitost znakové sady"?</h4>
                <p className="text-sm text-muted-foreground">
                  Závisí na tom, jaké typy znaků v hesle používáte:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-background/50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-lg">26</div>
                    <div>
                      <div className="font-medium text-sm">Pouze malá písmena</div>
                      <div className="text-xs text-muted-foreground">a-z (slabé)</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-lg">52</div>
                    <div>
                      <div className="font-medium text-sm">+ velká písmena</div>
                      <div className="text-xs text-muted-foreground">a-z, A-Z (lepší)</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-lg">62</div>
                    <div>
                      <div className="font-medium text-sm">+ číslice</div>
                      <div className="text-xs text-muted-foreground">a-z, A-Z, 0-9 (dobré)</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-background/50 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-lg">95</div>
                    <div>
                      <div className="font-medium text-sm">+ speciální znaky</div>
                      <div className="text-xs text-muted-foreground">Vše včetně !@#$% (nejlepší)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Praktický příklad */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-cyan-500" />
                  Praktický příklad
                </h4>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Máte heslo:</div>
                    <div className="font-mono text-lg p-2 rounded bg-background/50 text-center">Kx9#mP2@qL5*nR7!</div>
                    <div className="text-xs text-muted-foreground text-center">16 znaků, všechny typy</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Výpočet:</div>
                    <div className="font-mono text-sm p-2 rounded bg-background/50 space-y-1">
                      <div>Délka: <span className="text-cyan-500">16</span></div>
                      <div>Znaková sada: <span className="text-emerald-500">95</span> (všechny typy)</div>
                      <div>Složitost: log₂(95) ≈ <span className="text-emerald-500">6.57</span></div>
                      <div className="border-t border-border pt-1 mt-1">
                        Entropie: 16 × 6.57 = <span className="text-primary font-bold">~105 bitů</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-center text-muted-foreground mt-2">
                  <span className="text-primary font-semibold">105 bitů</span> = extrémně silné heslo, 
                  prolomení by trvalo miliardy let
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Čas potřebný k prolomení podle entropie
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">Entropie</th>
                      <th className="text-left py-2 px-3">Hodnocení</th>
                      <th className="text-left py-2 px-3">Čas (10B hashů/s)</th>
                      <th className="text-left py-2 px-3">Příklad</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3 text-red-500 font-mono">&lt;40 bitů</td>
                      <td className="py-2 px-3">Kriticky slabé</td>
                      <td className="py-2 px-3">Sekundy až minuty</td>
                      <td className="py-2 px-3 font-mono">heslo123</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3 text-orange-500 font-mono">40-60 bitů</td>
                      <td className="py-2 px-3">Nedostačující</td>
                      <td className="py-2 px-3">Hodiny až dny</td>
                      <td className="py-2 px-3 font-mono">Heslo123!</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3 text-yellow-500 font-mono">60-80 bitů</td>
                      <td className="py-2 px-3">Dobré</td>
                      <td className="py-2 px-3">Roky až staletí</td>
                      <td className="py-2 px-3 font-mono">K9#mPq2$xL</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 px-3 text-emerald-500 font-mono">80-128 bitů</td>
                      <td className="py-2 px-3">Bezpečné</td>
                      <td className="py-2 px-3">Miliony let</td>
                      <td className="py-2 px-3 font-mono">xK9#mPq2$xLwR4@n</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-500 font-mono">&gt;128 bitů</td>
                      <td className="py-2 px-3">Vojenská úroveň</td>
                      <td className="py-2 px-3">Věk vesmíru+</td>
                      <td className="py-2 px-3 font-mono">Kryptograficky neprolomitelné</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* ===== SECTION 4: PSYCHOLOGIE HESEL ===== */}
          {/* Proč lidé volí slabá hesla, kognitivní zkreslení a iluze bezpečnosti */}
          <section id="psychologie" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-500" />
              </div>
              Psychologie hesel: Proč volíme špatně
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Lidský mozek není navržen pro vytváření a pamatování náhodných řetězců. Naše přirozené tendence vedou k
              předvídatelným vzorům, které útočníci dobře znají.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Osobní informace
                </h3>
                <p className="text-sm text-muted-foreground">
                  Jména, data narození, domácí mazlíčci, oblíbené týmy – vše, co útočník najde na sociálních sítích.
                </p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Předvídatelné vzory
                </h3>
                <p className="text-sm text-muted-foreground">
                  Velké písmeno na začátku, čísla na konci, záměna "a" za "@", "e" za "3" – všechny tyto vzory jsou ve
                  slovnících.
                </p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-purple-500" />
                  Klávesnicové vzory
                </h3>
                <p className="text-sm text-muted-foreground">
                  qwerty, asdfgh, 123456, zxcvbn – sekvence kláves vedle sebe jsou extrémně slabé.
                </p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Sezónní hesla
                </h3>
                <p className="text-sm text-muted-foreground">
                  Léto2024, Zima2023, Jaro! – útočníci vědí, že lidé mění hesla podle ročních období.
                </p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-purple-500" />
                  Minimální úsilí
                </h3>
                <p className="text-sm text-muted-foreground">
                  Lidé volí nejkratší heslo splňující požadavky. "8 znaků s číslem" = "heslo123".
                </p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur border-purple-500/20 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  Opakování hesel
                </h3>
                <p className="text-sm text-muted-foreground">
                  Jedno "silné" heslo pro všechno = jeden únik kompromituje všechny účty.
                </p>
              </Card>
            </div>
          </section>

          {/* ===== SECTION 5: DOPORUČENÉ POSTUPY (BEST PRACTICES) ===== */}
          {/* Co dělat a čemu se vyhnout při tvorbě a správě hesel */}
          <section id="best-practices" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              Doporučené postupy pro silná hesla
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Co dělat
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <div>
                          <strong>Minimálně 12-16 znaků</strong> – délka je nejdůležitější faktor. Každý znak
                          exponenciálně zvyšuje bezpečnost.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <div>
                          <strong>Používejte passphrase</strong> – náhodná kombinace 4-6 slov (např.
                          "kočka-tramvaj-modrý-klavír") je bezpečnější a zapamatovatelnější.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <div>
                          <strong>Unikátní heslo pro každý účet</strong> – používejte správce hesel pro generování a
                          ukládání.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <div>
                          <strong>Aktivujte dvoufaktorovou autentizaci</strong> – i kdyby heslo uniklo, útočník se
                          nedostane dovnitř.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <div>
                          <strong>Pravidelně kontrolujte úniky</strong> – použijte naši kontrolu úniku dat nebo službu
                          HaveIBeenPwned.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Database className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Čemu se vyhnout
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="text-red-500 font-bold shrink-0">×</span>
                        <div>
                          <strong>Slovníková slova a jména</strong> – "Administrator", "Heslo", "Praha" jsou ve všech
                          slovnících.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-red-500 font-bold shrink-0">×</span>
                        <div>
                          <strong>Osobní informace</strong> – datum narození, jména členů rodiny, PSČ, telefonní čísla.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-red-500 font-bold shrink-0">×</span>
                        <div>
                          <strong>Sekvence a vzory</strong> – 123456, qwerty, abcdef, aaaa1111.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-red-500 font-bold shrink-0">×</span>
                        <div>
                          <strong>Jednoduché substituce</strong> – p@ssw0rd, h3sl0, @ místo a – jsou ve slovnících.
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-red-500 font-bold shrink-0">×</span>
                        <div>
                          <strong>Ukládání hesel v prohlížeči</strong> – bez hlavního hesla jsou čitelná. Používejte
                          dedikovaného správce.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* ===== SECTION 6: SPRÁVCI HESEL (PASSWORD MANAGERS) ===== */}
          {/* Proč používat password manager a přehled doporučených řešení */}
          <section id="spravci-hesel" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-blue-500" />
              </div>
              Správci hesel: Vaše první linie obrany
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              Správce hesel je aplikace, která bezpečně ukládá a generuje silná, unikátní hesla pro všechny vaše účty.
              Potřebujete si pamatovat pouze jedno hlavní heslo.
            </p>

            <Card className="p-6 bg-card/50 backdrop-blur border-blue-500/20 space-y-4">
              <h3 className="text-lg font-semibold">Jak správce hesel funguje</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 space-y-2">
                  <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-sm">1. Šifrovaný trezor</h4>
                  <p className="text-xs text-muted-foreground">
                    Všechna hesla jsou šifrována AES-256 pomocí vašeho hlavního hesla
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 space-y-2">
                  <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-sm">2. Auto-generování</h4>
                  <p className="text-xs text-muted-foreground">
                    Generuje náhodná 20-30+ znaková hesla pro každý nový účet
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 space-y-2">
                  <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-sm">3. Synchronizace</h4>
                  <p className="text-xs text-muted-foreground">Bezpečná synchronizace mezi všemi vašimi zařízeními</p>
                </div>
              </div>
            </Card>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Bitwarden", desc: "Open-source, zdarma, auditovaný", color: "blue" },
                { name: "1Password", desc: "Prémiové funkce, rodinné plány", color: "cyan" },
                { name: "KeePassXC", desc: "Offline, lokální databáze", color: "emerald" },
                { name: "Proton Pass", desc: "Od tvůrců ProtonMail, E2E šifrování", color: "purple" },
              ].map((pm, i) => (
                <Card key={i} className={`p-4 bg-card/50 backdrop-blur border-${pm.color}-500/20 space-y-2`}>
                  <h4 className="font-semibold">{pm.name}</h4>
                  <p className="text-xs text-muted-foreground">{pm.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* ===== SECTION 7: VÍCEFAKTOROVÁ AUTENTIZACE (MFA/2FA) ===== */}
          {/* Typy druhého faktoru a jejich bezpečnostní úrovně */}
          <section id="mfa" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-teal-500" />
              </div>
              Vícefaktorová autentizace (MFA/2FA)
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed">
              MFA přidává další vrstvu ochrany. I kdyby útočník získal vaše heslo, bez druhého faktoru se nedostane do
              účtu.
            </p>

            <Card className="p-6 bg-card/50 backdrop-blur border-teal-500/20 space-y-4">
              <h3 className="text-lg font-semibold">Typy druhého faktoru (od nejbezpečnějšího)</h3>
              <div className="space-y-3">
                {[
                  {
                    name: "Hardwarový klíč (FIDO2/WebAuthn)",
                    desc: "YubiKey, Google Titan – fyzický klíč odolný proti phishingu",
                    security: "Nejvyšší",
                    color: "emerald",
                  },
                  {
                    name: "Autentizační aplikace (TOTP)",
                    desc: "Google Authenticator, Authy – časově omezené kódy",
                    security: "Vysoká",
                    color: "teal",
                  },
                  {
                    name: "Push notifikace",
                    desc: "Microsoft Authenticator, Duo – potvrzení na telefonu",
                    security: "Střední",
                    color: "blue",
                  },
                  {
                    name: "SMS kódy",
                    desc: "Jednorázové kódy přes SMS – lepší než nic, ale zranitelné SIM swapem",
                    security: "Nízká",
                    color: "orange",
                  },
                ].map((factor, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-lg bg-background/50 border-l-4 border-${factor.color}-500`}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{factor.name}</h4>
                      <p className="text-sm text-muted-foreground">{factor.desc}</p>
                    </div>
                    <div
                      className={`text-xs font-bold text-${factor.color}-500 px-2 py-1 rounded bg-${factor.color}-500/10`}
                    >
                      {factor.security}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ===== SECTION 8: NAŠE NÁSTROJE ===== */}
          {/* Propojení s funkcemi aplikace: generátor, kontrola úniku, test síly */}
          <section id="nase-nastroje" className="space-y-6 scroll-mt-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Naše nástroje: Technické detaily
            </h2>

            <div className="grid gap-6">
              <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Generátor hesel</h3>
                    <p className="text-sm text-muted-foreground">
                      Používá{" "}
                      <code className="px-1.5 py-0.5 rounded bg-background font-mono text-xs">
                        crypto.getRandomValues()
                      </code>{" "}
                      – kryptograficky bezpečný generátor náhodných čísel (CSPRNG) implementovaný v prohlížeči.
                      Algoritmus Rejection Sampling eliminuje "Modulo Bias", což zajišťuje perfektní rovnoměrné
                      rozložení znaků.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/generator">Vyzkoušet generátor →</Link>
                </Button>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-secondary/20 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Database className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Kontrola úniku dat</h3>
                    <p className="text-sm text-muted-foreground">
                      Implementuje <strong>k-Anonymity</strong> protokol. Vaše heslo je hashováno SHA-1 lokálně,
                      odesíláme pouze prvních 5 znaků hashe na HaveIBeenPwned API. Ze zbývajících odpovědí (typicky
                      stovky hashů) lokálně vyhledáme shodu. Vaše plné heslo ani hash nikdy neopustí zařízení.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/test">Analyzovat heslo →</Link>
                </Button>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-accent/20 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Server className="h-6 w-6 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Komplexní analýza hesla</h3>
                    <p className="text-sm text-muted-foreground">
                      Využívá knihovnu <strong>zxcvbn-ts</strong> pro analýzu síly hesla a <strong>HIBP API</strong> pro kontrolu v databázích úniků.
                      Detekuje slovníková slova, klávesnicové vzory, opakování, leet speak transformace a další slabiny.
                      Výpočet entropie je založen na skutečném počtu pokusů (guesses), nikoliv teoretické složitosti.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/test">Otestovat heslo →</Link>
                </Button>
              </Card>
            </div>
          </section>

          {/* Final CTA */}
          <Card className="p-8 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-primary/20 text-center space-y-4">
            <h2 className="text-2xl font-bold">Začněte chránit svá hesla ještě dnes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bezpečnost začíná u silných hesel. Využijte naše nástroje k vytvoření, otestování a ověření vašich hesel –
              vše probíhá lokálně ve vašem prohlížeči.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link href="/generator">
                  <Key className="mr-2 h-5 w-5" />
                  Vygenerovat heslo
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
                <Link href="/test">
                  <TestTube className="mr-2 h-5 w-5" />
                  Otestovat sílu
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
