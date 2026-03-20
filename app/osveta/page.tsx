"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import {
  Shield, Key, ExternalLink, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, Database, Smartphone, BookOpen, TrendingUp,
  CheckCircle, XCircle, Calculator, ChevronDown, Radio,
} from "lucide-react"

// =============================================================================
// TYPY
// =============================================================================

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
  category: string
  isForeign?: boolean
}

interface RssSource {
  name: string
  url: string
  proxyUrl: string
  category: string
  isForeign?: boolean
  count?: number
}

// =============================================================================
// RSS ZDROJE
// Primárně české zdroje, na konci max. 2 zahraniční
// Paralelní načítání přes rss2json.com (rychlé, má vlastní cache)
// =============================================================================

const RSS_SOURCES: RssSource[] = [
  // ===== ČESKÉ ZDROJE =====
  {
    name: "NÚKIB",
    url: "https://www.nukib.cz/cs/rss/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.nukib.cz/cs/rss/") + "&count=4",
    category: "Varování",
    isForeign: false,
    count: 4,
  },
  {
    name: "Národní CERT",
    url: "https://www.csirt.cz/rss/news/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.csirt.cz/rss/news/") + "&count=4",
    category: "CERT",
    isForeign: false,
    count: 4,
  },
  {
    name: "Root.cz — Bezpečnost",
    url: "https://www.root.cz/rss/clanky/bezpecnost/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.root.cz/rss/clanky/bezpecnost/") + "&count=4",
    category: "Bezpečnost",
    isForeign: false,
    count: 4,
  },
  {
    name: "Lupa.cz",
    url: "https://www.lupa.cz/rss/clanky/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.lupa.cz/rss/clanky/") + "&count=4",
    category: "Zprávy",
    isForeign: false,
    count: 4,
  },
  {
    name: "SecurityWorld.cz",
    url: "https://www.securityworld.cz/rss/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.securityworld.cz/rss/") + "&count=4",
    category: "Bezpečnost",
    isForeign: false,
    count: 4,
  },
  {
    name: "Živě.cz — Bezpečnost",
    url: "https://www.zive.cz/rss/sc-47/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.zive.cz/rss/sc-47/") + "&count=4",
    category: "Zprávy",
    isForeign: false,
    count: 4,
  },
  // ===== ZAHRANIČNÍ ZDROJE (max 2) =====
  {
    name: "Bleeping Computer",
    url: "https://www.bleepingcomputer.com/feed/",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.bleepingcomputer.com/feed/") + "&count=3",
    category: "Mezinárodní",
    isForeign: true,
    count: 3,
  },
  {
    name: "The Hacker News",
    url: "https://feeds.feedburner.com/TheHackersNews",
    proxyUrl: "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://feeds.feedburner.com/TheHackersNews") + "&count=3",
    category: "Mezinárodní",
    isForeign: true,
    count: 3,
  },
]

// =============================================================================
// FALLBACK ZPRÁVY — zobrazí se okamžitě než doběhne RSS
// =============================================================================

const FALLBACK_NEWS: NewsItem[] = [
  { title: "NÚKIB varuje před novou vlnou phishingových útoků na české instituce", link: "#", pubDate: new Date().toISOString(), source: "NÚKIB", category: "Varování", isForeign: false },
  { title: "Národní CERT vydal upozornění na kritickou zranitelnost v routerech", link: "#", pubDate: new Date().toISOString(), source: "Národní CERT", category: "CERT", isForeign: false },
  { title: "Root.cz: Jak fungují passkeys a proč nahrazují hesla", link: "#", pubDate: new Date().toISOString(), source: "Root.cz", category: "Bezpečnost", isForeign: false },
  { title: "SecurityWorld: Ransomware útoky na české firmy vzrostly o 40 %", link: "#", pubDate: new Date().toISOString(), source: "SecurityWorld.cz", category: "Bezpečnost", isForeign: false },
  { title: "Živě.cz: Google zavádí passkeys jako výchozí přihlašování", link: "#", pubDate: new Date().toISOString(), source: "Živě.cz", category: "Zprávy", isForeign: false },
  { title: "Lupa.cz: Databáze 10 miliard hesel unikla na dark web", link: "#", pubDate: new Date().toISOString(), source: "Lupa.cz", category: "Úniky dat", isForeign: false },
  { title: "Critical OpenSSL vulnerability patched — update immediately", link: "#", pubDate: new Date().toISOString(), source: "Bleeping Computer", category: "Mezinárodní", isForeign: true },
  { title: "LockBit ransomware group resurfaces under new identity", link: "#", pubDate: new Date().toISOString(), source: "The Hacker News", category: "Mezinárodní", isForeign: true },
]

// =============================================================================
// HOOK: Načítání RSS feedů
// — okamžitý fallback, paralelní fetch, timeout 5s
// =============================================================================

function useRssNews() {
  // Fallback zobrazíme okamžitě, RSS přepíše jakmile doběhne
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)

  const parseRss2Json = useCallback(
    (data: any, sourceName: string, category: string, isForeign: boolean): NewsItem[] => {
      try {
        if (data.status !== "ok" || !Array.isArray(data.items)) return []
        return data.items.map((item: any) => ({
          title: item.title?.trim() || "Bez názvu",
          link: item.link?.trim() || "#",
          pubDate: item.pubDate || new Date().toISOString(),
          source: sourceName,
          category,
          isForeign,
        }))
      } catch {
        return []
      }
    },
    [],
  )

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(false)

    // Všechny zdroje PARALELNĚ — celková doba = nejpomalejší zdroj (max 5s)
    const fetches = RSS_SOURCES.map(async (source) => {
      try {
        const response = await fetch(source.proxyUrl, {
          signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) return []
        const data = await response.json()
        return parseRss2Json(data, source.name, source.category, source.isForeign ?? false)
      } catch {
        return [] as NewsItem[]
      }
    })

    const settled = await Promise.allSettled(fetches)
    const czechItems: NewsItem[] = []
    const foreignItems: NewsItem[] = []

    settled.forEach((result) => {
      if (result.status !== "fulfilled" || result.value.length === 0) return
      result.value.forEach((item) => {
        if (item.isForeign) foreignItems.push(item)
        else czechItems.push(item)
      })
    })

    // Seřadit každou skupinu podle data
    const sortByDate = (a: NewsItem, b: NewsItem) => {
      try { return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime() }
      catch { return 0 }
    }
    czechItems.sort(sortByDate)
    foreignItems.sort(sortByDate)

    // České zprávy napřed, zahraniční na konci
    const allItems = [...czechItems, ...foreignItems]

    if (allItems.length > 0) {
      setNews(allItems.slice(0, 20))
      setError(false)
    } else {
      setError(true)
      // Fallback zůstane
    }

    setLastUpdated(new Date())
    setLoading(false)
  }, [parseRss2Json])

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  return { news, loading, lastUpdated, error, refresh: fetchNews }
}

// =============================================================================
// KOMPONENTA: News Ticker
// =============================================================================

function NewsTicker({ news }: { news: NewsItem[] }) {
  const items = [...news, ...news]
  return (
    <div className="news-ticker-wrap">
      <div className="news-ticker-label">
        <Radio className="h-3 w-3" />
        <span>LIVE</span>
      </div>
      <div className="news-ticker-track">
        <div className="news-ticker-inner">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.link !== "#" ? item.link : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="news-ticker-item"
            >
              <span className={`news-ticker-cat ${item.isForeign ? "news-ticker-cat--foreign" : ""}`}>
                {item.isForeign ? "🌍 " : ""}{item.category}
              </span>
              <span className="news-ticker-title">{item.title}</span>
              <span className="news-ticker-sep">◆</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// KOMPONENTA: News Slideshow
// =============================================================================

function NewsSlideshow({ news, loading, lastUpdated, error, onRefresh }: {
  news: NewsItem[]
  loading: boolean
  lastUpdated: Date | null
  error: boolean
  onRefresh: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const items = news.slice(0, 8)

  const next = useCallback(() => setCurrent(c => (c + 1) % items.length), [items.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + items.length) % items.length), [items.length])

  useEffect(() => {
    if (!isPlaying) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(next, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, next])

  // Reset current při změně news (po načtení RSS)
  useEffect(() => { setCurrent(0) }, [news])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" })
    } catch { return "" }
  }

  const item = items[current] || items[0]
  if (!item) return null

  return (
    <div className="slideshow">
      {/* Header */}
      <div className="slideshow-header">
        <div className="slideshow-title-row">
          <div className="slideshow-live-dot" />
          <span className="slideshow-section-label">Aktuální zprávy z kyberbezpečnosti</span>
          {error && <span className="slideshow-offline-badge">offline — záloha</span>}
          {loading && <span className="slideshow-loading-badge">načítám...</span>}
        </div>
        <div className="slideshow-controls-row">
          {lastUpdated && (
            <span className="slideshow-updated">
              {lastUpdated.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={onRefresh} disabled={loading} className="slideshow-refresh-btn" title="Načíst nové zprávy">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Hlavní karta */}
      <div
        className="slide-card"
        onClick={() => item.link !== "#" && window.open(item.link, "_blank")}
        style={{ cursor: item.link !== "#" ? "pointer" : "default" }}
      >
        <div className="slide-meta">
          <span className={`slide-cat ${item.isForeign ? "slide-cat--foreign" : ""}`}>
            {item.isForeign ? "🌍 " : ""}{item.category}
          </span>
          <span className="slide-source">{item.source}</span>
          <span className="slide-date">{formatDate(item.pubDate)}</span>
        </div>
        <h2 className="slide-title">{item.title}</h2>
        {item.link !== "#" && (
          <div className="slide-link">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Číst celý článek</span>
          </div>
        )}
        <div className="slide-progress">
          <div
            key={`${current}-${isPlaying}`}
            className="slide-progress-fill"
            style={{ animationDuration: isPlaying ? "5s" : "0s", animationPlayState: isPlaying ? "running" : "paused" }}
          />
        </div>
      </div>

      {/* Navigace */}
      <div className="slideshow-nav">
        <button onClick={prev} className="slide-nav-btn"><ChevronLeft className="h-4 w-4" /></button>
        <div className="slide-dots">
          {items.map((_, i) => (
            <button key={i} className={`slide-dot ${i === current ? "slide-dot--active" : ""}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
        <button onClick={next} className="slide-nav-btn"><ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => setIsPlaying(v => !v)} className={`slide-play-btn ${isPlaying ? "slide-play-btn--active" : ""}`}>
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      {/* Grid dalších zpráv */}
      <div className="news-grid">
        {items.map((n, i) => (
          <a
            key={i}
            href={n.link !== "#" ? n.link : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`news-card ${i === current ? "news-card--active" : ""}`}
            onClick={(e) => { e.preventDefault(); setCurrent(i) }}
          >
            <span className={`news-card-cat ${n.isForeign ? "news-card-cat--foreign" : ""}`}>
              {n.isForeign ? "🌍 " : ""}{n.category}
            </span>
            <span className="news-card-title">{n.title}</span>
            <span className="news-card-source">{n.source} · {formatDate(n.pubDate)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// KOMPONENTA: Accordion pro osvětu
// =============================================================================

interface OsvetaSection {
  id: string
  icon: React.ReactNode
  title: string
  color: string
  content: React.ReactNode
}

function OsvetaAccordion({ sections }: { sections: OsvetaSection[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="osveta-accordion">
      {sections.map((s) => (
        <div key={s.id} className={`osveta-item ${open === s.id ? "osveta-item--open" : ""}`}>
          <button className="osveta-trigger" onClick={() => setOpen(open === s.id ? null : s.id)}>
            <div className="osveta-trigger-left">
              <div className="osveta-icon" style={{ background: s.color + "22", color: s.color }}>{s.icon}</div>
              <span className="osveta-title">{s.title}</span>
            </div>
            <ChevronDown className={`osveta-chevron ${open === s.id ? "osveta-chevron--open" : ""}`} />
          </button>
          <div className={`osveta-body ${open === s.id ? "osveta-body--open" : ""}`}>
            <div className="osveta-content">{s.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// OBSAH OSVĚTOVÝCH SEKCÍ
// =============================================================================

const OSVETA_SECTIONS: OsvetaSection[] = [
  {
    id: "co-je-silne-heslo",
    icon: <Key className="h-5 w-5" />,
    title: "Co dělá heslo skutečně silným?",
    color: "#10b981",
    content: (
      <div className="osveta-grid-2">
        <div>
          <h4 className="osveta-h4">Tři pilíře silného hesla</h4>
          <div className="osveta-pillars">
            {[
              { label: "Délka", value: "12+ znaků", desc: "Každý znak exponenciálně zvyšuje počet kombinací", icon: "📏" },
              { label: "Náhodnost", value: "Bez vzorů", desc: "Žádná jména, data, slova ze slovníku", icon: "🎲" },
              { label: "Unikátnost", value: "1 heslo = 1 účet", desc: "Jeden únik nesmí kompromitovat vše ostatní", icon: "🔑" },
            ].map((p) => (
              <div key={p.label} className="osveta-pillar">
                <span className="osveta-pillar-icon">{p.icon}</span>
                <div>
                  <div className="osveta-pillar-label">{p.label}: <strong>{p.value}</strong></div>
                  <div className="osveta-pillar-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="osveta-h4">Příklady síly hesla</h4>
          <div className="osveta-examples">
            {[
              { pwd: "heslo123", strength: 5, label: "Katastrofické", color: "#ef4444" },
              { pwd: "Heslo123!", strength: 20, label: "Velmi slabé", color: "#f97316" },
              { pwd: "M0jePsíč3kR3x!", strength: 55, label: "Průměrné", color: "#eab308" },
              { pwd: "xK9#mPq2$xLwR4@n", strength: 92, label: "Silné", color: "#10b981" },
              { pwd: "kočka-tramvaj-modrý-klavír-7", strength: 98, label: "Výborná passphrase", color: "#06b6d4" },
            ].map((e) => (
              <div key={e.pwd} className="osveta-example">
                <code className="osveta-example-pwd">{e.pwd}</code>
                <div className="osveta-example-bar-wrap">
                  <div className="osveta-example-bar" style={{ width: `${e.strength}%`, background: e.color }} />
                </div>
                <span className="osveta-example-label" style={{ color: e.color }}>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "entropie",
    icon: <Calculator className="h-5 w-5" />,
    title: "Entropie: matematika za bezpečností hesla",
    color: "#06b6d4",
    content: (
      <div className="osveta-grid-2">
        <div>
          <h4 className="osveta-h4">Co je entropie?</h4>
          <p className="osveta-p">Entropie měří nepředvídatelnost hesla v bitech. Více bitů = více pokusů útočník potřebuje = bezpečnější heslo.</p>
          <div className="osveta-formula">
            <div className="osveta-formula-title">Zjednodušený vzorec:</div>
            <div className="osveta-formula-eq">H ≈ L × log₂(C)</div>
            <div className="osveta-formula-vars">
              <span><strong>H</strong> = entropie v bitech</span>
              <span><strong>L</strong> = délka hesla</span>
              <span><strong>C</strong> = velikost znakové sady</span>
            </div>
          </div>
          <div className="osveta-charsets">
            {[
              { chars: "a–z", size: 26, color: "#ef4444" },
              { chars: "a–z, A–Z", size: 52, color: "#f97316" },
              { chars: "a–z, A–Z, 0–9", size: 62, color: "#eab308" },
              { chars: "vše vč. !@#$%", size: 95, color: "#10b981" },
            ].map((c) => (
              <div key={c.chars} className="osveta-charset">
                <code className="osveta-charset-chars">{c.chars}</code>
                <div className="osveta-charset-bar-wrap">
                  <div className="osveta-charset-bar" style={{ width: `${(c.size / 95) * 100}%`, background: c.color }} />
                </div>
                <span style={{ color: c.color, fontSize: "12px", fontWeight: 500 }}>{c.size} znaků</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="osveta-h4">Čas prolomení podle entropie</h4>
          <div className="osveta-crack-table">
            {[
              { bits: "< 40", rating: "Kriticky slabé", time: "Sekundy", color: "#ef4444" },
              { bits: "40–60", rating: "Slabé", time: "Hodiny až dny", color: "#f97316" },
              { bits: "60–80", rating: "Dobré", time: "Roky", color: "#eab308" },
              { bits: "80–128", rating: "Silné", time: "Miliony let", color: "#10b981" },
              { bits: "> 128", rating: "Vojenská úroveň", time: "Věk vesmíru+", color: "#06b6d4" },
            ].map((r) => (
              <div key={r.bits} className="osveta-crack-row">
                <span className="osveta-crack-bits" style={{ color: r.color }}>{r.bits} b</span>
                <span className="osveta-crack-rating" style={{ color: r.color }}>{r.rating}</span>
                <span className="osveta-crack-time">{r.time}</span>
              </div>
            ))}
          </div>
          <div className="osveta-note">⚡ GPU (RTX 4090) zvládne ~10 miliard MD5 hashů za sekundu</div>
        </div>
      </div>
    ),
  },
  {
    id: "typy-utoku",
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Jak útočníci kradou hesla",
    color: "#ef4444",
    content: (
      <div className="osveta-attacks">
        {[
          { name: "Brute Force", icon: "⚡", color: "#ef4444", desc: "Systematické zkoušení každé kombinace. Moderní GPU: 10 miliard pokusů/s.", obrana: "Heslo 12+ znaků → miliardy let prolomení" },
          { name: "Slovníkový útok", icon: "📖", color: "#f97316", desc: "Zkouší miliony reálných hesel z uniklých databází (RockYou: 14M hesel) + variace.", obrana: "Žádná slovní hesla, žádné vzory jako Heslo123!" },
          { name: "Phishing", icon: "🎣", color: "#eab308", desc: "Falešná přihlašovací stránka — zadáte heslo sami. Nejsilnější heslo nepomůže.", obrana: "Vždy zkontrolujte URL. Hardwarový klíč (FIDO2)." },
          { name: "Credential Stuffing", icon: "📋", color: "#8b5cf6", desc: "Uniklé heslo z webu A zkouší bot automaticky na webech B, C, D…", obrana: "Každý účet musí mít unikátní heslo. Správce hesel." },
          { name: "Rainbow Tables", icon: "🌈", color: "#06b6d4", desc: "Předpočítané tabulky hashů — prolomení trvá milisekundy, ne hodiny.", obrana: "Weby musí používat salt + moderní hashování (bcrypt, Argon2)." },
          { name: "Keylogger", icon: "🖱️", color: "#10b981", desc: "Malware zachytává každé stisknutí klávesy. Běží neviditelně na pozadí.", obrana: "Aktuální antivirus. FIDO2 klíč zachrání účet i při keyloggeru." },
        ].map((a) => (
          <div key={a.name} className="osveta-attack-card" style={{ borderColor: a.color + "44" }}>
            <div className="osveta-attack-header">
              <span className="osveta-attack-icon">{a.icon}</span>
              <span className="osveta-attack-name" style={{ color: a.color }}>{a.name}</span>
            </div>
            <p className="osveta-attack-desc">{a.desc}</p>
            <div className="osveta-attack-obrana">
              <Shield className="h-3.5 w-3.5" style={{ color: a.color }} />
              <span>{a.obrana}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "best-practices",
    icon: <CheckCircle className="h-5 w-5" />,
    title: "Doporučené postupy — co dělat a čemu se vyhýbat",
    color: "#10b981",
    content: (
      <div className="osveta-grid-2">
        <div>
          <h4 className="osveta-h4 osveta-h4--green">✓ Co dělat</h4>
          {[
            "Minimálně 12–16 znaků na každé heslo",
            "Passphrase: náhodná slova oddělená pomlčkou",
            "Unikátní heslo pro každý jednotlivý účet",
            "Správce hesel (Bitwarden, 1Password, KeePassXC)",
            "Dvoufaktorová autentizace (2FA) všude kde je",
            "Pravidelná kontrola v databázích úniků (HIBP)",
            "Hardwarový klíč (YubiKey) pro kritické účty",
          ].map((item) => (
            <div key={item} className="osveta-do-item">
              <CheckCircle className="h-4 w-4 osveta-do-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="osveta-h4 osveta-h4--red">✗ Čemu se vyhýbat</h4>
          {[
            "Slovníková slova, jména, místa v heslech",
            "Osobní informace (datum narození, jméno mazlíčka)",
            "Sekvence: 123456, qwerty, abcdef",
            "Substituce: @ místo a, 3 místo e — jsou ve slovnících",
            "Stejné heslo na více místech",
            "Ukládání hesel v prohlížeči bez masterkey",
            "Posílání hesel přes SMS, e-mail, chat",
          ].map((item) => (
            <div key={item} className="osveta-dont-item">
              <XCircle className="h-4 w-4 osveta-dont-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "spravci-hesel",
    icon: <Database className="h-5 w-5" />,
    title: "Správci hesel — proč a který vybrat",
    color: "#3b82f6",
    content: (
      <div>
        <p className="osveta-p">Správce hesel vygeneruje a zapamatuje silné unikátní heslo pro každý účet. Vy si pamatujete jen jedno hlavní heslo.</p>
        <div className="osveta-managers">
          {[
            { name: "Bitwarden", type: "Open-source, cloud", price: "Zdarma / Premium", pros: ["Auditovaný kód", "E2E šifrování", "Sdílení hesel"], best: true },
            { name: "1Password", type: "Komerční, cloud", price: "~3 $/měsíc", pros: ["Travel mode", "Watchtower", "Rodinné plány"], best: false },
            { name: "KeePassXC", type: "Open-source, lokální", price: "Zdarma", pros: ["Offline databáze", "Žádný cloud", "Maximální kontrola"], best: false },
            { name: "Proton Pass", type: "Open-source, cloud", price: "Zdarma / Plus", pros: ["Aliasy e-mailů", "Švýcarské servery", "Zero-knowledge"], best: false },
          ].map((m) => (
            <div key={m.name} className={`osveta-manager-card ${m.best ? "osveta-manager-card--best" : ""}`}>
              {m.best && <div className="osveta-manager-badge">Doporučujeme</div>}
              <div className="osveta-manager-name">{m.name}</div>
              <div className="osveta-manager-type">{m.type}</div>
              <div className="osveta-manager-price">{m.price}</div>
              <div className="osveta-manager-pros">
                {m.pros.map((p) => <div key={p} className="osveta-manager-pro">✓ {p}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "mfa",
    icon: <Smartphone className="h-5 w-5" />,
    title: "Vícefaktorová autentizace (MFA / 2FA)",
    color: "#8b5cf6",
    content: (
      <div>
        <p className="osveta-p">MFA přidává druhý faktor — i se správným heslem se útočník nedostane dovnitř bez fyzického přístupu k vašemu zařízení.</p>
        <div className="osveta-mfa-levels">
          {[
            { rank: 1, name: "Hardwarový klíč (FIDO2/WebAuthn)", desc: "YubiKey, Google Titan. Fyzický token, odolný phishingu. Nejbezpečnější.", level: "Nejvyšší", color: "#10b981" },
            { rank: 2, name: "Autentizační aplikace (TOTP)", desc: "Google Authenticator, Authy, Aegis. Časové kódy generované offline.", level: "Vysoká", color: "#06b6d4" },
            { rank: 3, name: "Push notifikace", desc: "Microsoft Authenticator, Duo. Potvrzení na telefonu při přihlášení.", level: "Střední", color: "#3b82f6" },
            { rank: 4, name: "SMS kódy", desc: "Jednorázový kód přes SMS. Lepší než nic — ale zranitelné SIM swappingem.", level: "Nízká", color: "#f97316" },
          ].map((f) => (
            <div key={f.rank} className="osveta-mfa-row">
              <div className="osveta-mfa-rank" style={{ background: f.color + "22", color: f.color }}>#{f.rank}</div>
              <div className="osveta-mfa-body">
                <div className="osveta-mfa-name">{f.name}</div>
                <div className="osveta-mfa-desc">{f.desc}</div>
              </div>
              <div className="osveta-mfa-level" style={{ color: f.color }}>{f.level}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "statistiky",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Statistiky a realita úniků dat",
    color: "#f97316",
    content: (
      <div>
        <div className="osveta-stats">
          {[
            { value: "81 %", label: "úniků dat způsobeno slabými nebo ukradenými hesly", source: "Verizon DBIR 2023" },
            { value: "65 %", label: "lidí používá stejné heslo na více místech", source: "Google Security Survey" },
            { value: "600M+", label: "uniklých hesel v databázi HaveIBeenPwned", source: "HIBP" },
            { value: "$4.35M", label: "průměrná cena úniku dat pro organizaci", source: "IBM 2023" },
          ].map((s) => (
            <div key={s.value} className="osveta-stat-card">
              <div className="osveta-stat-value">{s.value}</div>
              <div className="osveta-stat-label">{s.label}</div>
              <div className="osveta-stat-source">Zdroj: {s.source}</div>
            </div>
          ))}
        </div>
        <h4 className="osveta-h4" style={{ marginTop: "1.5rem" }}>Největší úniky v historii</h4>
        <div className="osveta-breaches">
          {[
            { name: "Collection #1–5", year: "2019", count: "2,2 miliardy", desc: "kombinací email/heslo" },
            { name: "Yahoo", year: "2013–14", count: "3 miliardy", desc: "účtů kompromitováno" },
            { name: "LinkedIn", year: "2012/21", count: "700 milionů", desc: "profilů vystaveno" },
            { name: "Facebook", year: "2019", count: "533 milionů", desc: "uživatelských záznamů" },
            { name: "RockYou2024", year: "2024", count: "10 miliard", desc: "hesel v jediném souboru" },
          ].map((b) => (
            <div key={b.name} className="osveta-breach-row">
              <span className="osveta-breach-year">{b.year}</span>
              <span className="osveta-breach-name">{b.name}</span>
              <span className="osveta-breach-count">{b.count}</span>
              <span className="osveta-breach-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// =============================================================================
// CSS STYLY
// =============================================================================

const PAGE_STYLES = `
  /* ===== NEWS TICKER ===== */
  .news-ticker-wrap {
    display: flex; align-items: center;
    background: oklch(0.12 0.02 160);
    border-bottom: 1px solid oklch(0.55 0.12 160 / 0.3);
    height: 36px; overflow: hidden;
    position: sticky; top: 64px; z-index: 40;
  }
  .news-ticker-label {
    display: flex; align-items: center; gap: 4px;
    padding: 0 12px; background: oklch(0.55 0.12 160);
    color: white; font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; height: 100%; flex-shrink: 0;
  }
  .news-ticker-track { flex: 1; overflow: hidden; height: 100%; }
  .news-ticker-inner {
    display: flex; align-items: center; height: 100%;
    animation: ticker-scroll 80s linear infinite;
    white-space: nowrap; width: max-content;
  }
  @keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .news-ticker-inner:hover { animation-play-state: paused; }
  .news-ticker-item {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 0 20px 0 0; font-size: 12px;
    color: oklch(0.85 0.01 180); text-decoration: none;
    cursor: pointer; transition: color 0.2s;
  }
  .news-ticker-item:hover { color: oklch(0.55 0.12 160); }
  .news-ticker-cat {
    font-size: 10px; font-weight: 700; color: oklch(0.55 0.12 160);
    text-transform: uppercase; letter-spacing: 0.05em;
    background: oklch(0.55 0.12 160 / 0.15);
    padding: 1px 6px; border-radius: 4px; flex-shrink: 0;
  }
  .news-ticker-cat--foreign {
    color: oklch(0.65 0.1 270);
    background: oklch(0.5 0.1 270 / 0.15);
  }
  .news-ticker-title { max-width: 380px; overflow: hidden; text-overflow: ellipsis; }
  .news-ticker-sep { color: oklch(0.35 0.04 180); }

  /* ===== SLIDESHOW ===== */
  .slideshow {
    background: var(--card); border: 0.5px solid var(--border);
    border-radius: 16px; overflow: hidden; padding: 20px;
  }
  .slideshow-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .slideshow-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .slideshow-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: oklch(0.55 0.12 160);
    animation: pulse-live 2s ease-in-out infinite;
  }
  @keyframes pulse-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
  .slideshow-section-label { font-size: 13px; font-weight: 500; color: var(--muted-foreground); }
  .slideshow-offline-badge {
    font-size: 10px; padding: 2px 6px; border-radius: 4px;
    background: oklch(0.5 0.18 30 / 0.15); color: oklch(0.5 0.18 30);
  }
  .slideshow-loading-badge {
    font-size: 10px; padding: 2px 6px; border-radius: 4px;
    background: oklch(0.55 0.12 160 / 0.15); color: oklch(0.55 0.12 160);
  }
  .slideshow-controls-row { display: flex; align-items: center; gap: 8px; }
  .slideshow-updated { font-size: 11px; color: var(--muted-foreground); }
  .slideshow-refresh-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    background: transparent; border: 0.5px solid var(--border);
    color: var(--muted-foreground); cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .slideshow-refresh-btn:hover { background: var(--muted); color: var(--foreground); }
  .slideshow-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .slide-card {
    background: oklch(0.12 0.02 200); border: 0.5px solid var(--border);
    border-radius: 12px; padding: 20px 24px; min-height: 130px;
    transition: border-color 0.2s; position: relative;
    overflow: hidden; margin-bottom: 12px;
  }
  .slide-card:hover { border-color: oklch(0.55 0.12 160 / 0.5); }
  .slide-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
  .slide-cat {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    background: oklch(0.55 0.12 160 / 0.2); color: oklch(0.65 0.12 160);
    padding: 2px 8px; border-radius: 4px;
  }
  .slide-cat--foreign {
    background: oklch(0.5 0.1 270 / 0.15); color: oklch(0.65 0.1 270);
  }
  .slide-source { font-size: 12px; color: var(--muted-foreground); }
  .slide-date { font-size: 11px; color: var(--muted-foreground); margin-left: auto; }
  .slide-title { font-size: 18px; font-weight: 600; line-height: 1.4; margin-bottom: 12px; }
  .slide-link { display: flex; align-items: center; gap: 4px; font-size: 12px; color: oklch(0.55 0.12 160); }
  .slide-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: var(--border); }
  .slide-progress-fill {
    height: 100%; background: oklch(0.55 0.12 160);
    animation: progress-fill linear forwards; width: 0%;
  }
  @keyframes progress-fill { from{width:0%} to{width:100%} }

  .slideshow-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .slide-nav-btn {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: var(--muted); border: 0.5px solid var(--border);
    color: var(--foreground); cursor: pointer; transition: background 0.15s;
  }
  .slide-nav-btn:hover { background: var(--accent); }
  .slide-dots { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .slide-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--border); border: none; cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  .slide-dot--active { background: oklch(0.55 0.12 160); transform: scale(1.4); }
  .slide-play-btn {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: var(--muted); border: 0.5px solid var(--border);
    cursor: pointer; font-size: 12px; transition: background 0.15s;
  }
  .slide-play-btn--active { background: oklch(0.55 0.12 160 / 0.2); }

  .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
  .news-card {
    background: oklch(0.14 0.02 200); border: 0.5px solid var(--border);
    border-radius: 8px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 4px;
    cursor: pointer; text-decoration: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .news-card:hover, .news-card--active {
    border-color: oklch(0.55 0.12 160 / 0.6);
    background: oklch(0.55 0.12 160 / 0.08);
  }
  .news-card-cat {
    font-size: 10px; font-weight: 700; color: oklch(0.55 0.12 160);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .news-card-cat--foreign { color: oklch(0.65 0.1 270); }
  .news-card-title {
    font-size: 12px; line-height: 1.45; color: var(--foreground);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .news-card-source { font-size: 10px; color: var(--muted-foreground); margin-top: auto; }

  /* ===== OSVĚTA ACCORDION ===== */
  .osveta-accordion { display: flex; flex-direction: column; gap: 8px; }
  .osveta-item {
    background: var(--card); border: 0.5px solid var(--border);
    border-radius: 12px; overflow: hidden; transition: border-color 0.2s;
  }
  .osveta-item--open { border-color: oklch(0.45 0.08 190 / 0.6); }
  .osveta-trigger {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; background: transparent; border: none;
    cursor: pointer; text-align: left; transition: background 0.15s;
  }
  .osveta-trigger:hover { background: var(--muted); }
  .osveta-trigger-left { display: flex; align-items: center; gap: 12px; }
  .osveta-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .osveta-title { font-size: 15px; font-weight: 500; text-align: left; }
  .osveta-chevron { width: 18px; height: 18px; color: var(--muted-foreground); transition: transform 0.3s; flex-shrink: 0; }
  .osveta-chevron--open { transform: rotate(180deg); }
  .osveta-body { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1); }
  .osveta-body--open { max-height: 2000px; }
  .osveta-content { padding: 0 20px 20px; border-top: 0.5px solid var(--border); padding-top: 16px; }

  /* ===== OSVĚTA CONTENT ===== */
  .osveta-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media (max-width: 640px) {
    .osveta-grid-2 { grid-template-columns: 1fr; }
    .news-grid { grid-template-columns: 1fr 1fr; }
    .slide-title { font-size: 15px; }
  }
  .osveta-h4 { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.06em; }
  .osveta-h4--green { color: oklch(0.5 0.12 160); }
  .osveta-h4--red { color: oklch(0.5 0.18 30); }
  .osveta-p { font-size: 14px; color: var(--muted-foreground); line-height: 1.6; margin-bottom: 16px; }

  .osveta-pillars { display: flex; flex-direction: column; gap: 10px; }
  .osveta-pillar { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: var(--muted); border-radius: 8px; }
  .osveta-pillar-icon { font-size: 20px; flex-shrink: 0; }
  .osveta-pillar-label { font-size: 13px; font-weight: 500; }
  .osveta-pillar-desc { font-size: 12px; color: var(--muted-foreground); margin-top: 2px; }

  .osveta-examples { display: flex; flex-direction: column; gap: 8px; }
  .osveta-example { display: flex; align-items: center; gap: 8px; }
  .osveta-example-pwd { font-size: 11px; font-family: monospace; min-width: 150px; color: var(--foreground); }
  .osveta-example-bar-wrap { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .osveta-example-bar { height: 100%; border-radius: 2px; }
  .osveta-example-label { font-size: 11px; font-weight: 500; min-width: 110px; text-align: right; }

  .osveta-formula { background: oklch(0.12 0.02 220); border: 0.5px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px; }
  .osveta-formula-title { font-size: 11px; color: var(--muted-foreground); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
  .osveta-formula-eq { font-size: 20px; font-family: monospace; font-weight: 600; color: oklch(0.65 0.12 160); margin-bottom: 8px; }
  .osveta-formula-vars { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--muted-foreground); }

  .osveta-charsets { display: flex; flex-direction: column; gap: 8px; }
  .osveta-charset { display: flex; align-items: center; gap: 8px; }
  .osveta-charset-chars { font-family: monospace; font-size: 12px; min-width: 120px; }
  .osveta-charset-bar-wrap { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .osveta-charset-bar { height: 100%; border-radius: 2px; }

  .osveta-crack-table { display: flex; flex-direction: column; gap: 4px; }
  .osveta-crack-row { display: flex; align-items: center; gap: 12px; padding: 8px 10px; background: var(--muted); border-radius: 6px; font-size: 13px; }
  .osveta-crack-bits { font-family: monospace; font-weight: 600; min-width: 60px; }
  .osveta-crack-rating { font-weight: 500; flex: 1; }
  .osveta-crack-time { font-size: 12px; color: var(--muted-foreground); }
  .osveta-note { margin-top: 10px; font-size: 11px; color: var(--muted-foreground); background: var(--muted); padding: 8px 12px; border-radius: 6px; }

  .osveta-attacks { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
  .osveta-attack-card { background: var(--muted); border: 0.5px solid; border-radius: 10px; padding: 14px; }
  .osveta-attack-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .osveta-attack-icon { font-size: 18px; }
  .osveta-attack-name { font-size: 14px; font-weight: 600; }
  .osveta-attack-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.5; margin-bottom: 8px; }
  .osveta-attack-obrana { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--foreground); background: oklch(0.14 0.02 200); padding: 8px 10px; border-radius: 6px; }

  .osveta-do-item, .osveta-dont-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 0.5px solid var(--border); font-size: 13px; }
  .osveta-do-item:last-child, .osveta-dont-item:last-child { border-bottom: none; }
  .osveta-do-icon { color: oklch(0.55 0.12 160); flex-shrink: 0; margin-top: 2px; }
  .osveta-dont-icon { color: oklch(0.5 0.18 30); flex-shrink: 0; margin-top: 2px; }

  .osveta-managers { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 16px; }
  .osveta-manager-card { background: var(--muted); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; position: relative; }
  .osveta-manager-card--best { border-color: oklch(0.55 0.12 160 / 0.5); background: oklch(0.55 0.12 160 / 0.06); }
  .osveta-manager-badge { position: absolute; top: -8px; right: 10px; background: oklch(0.55 0.12 160); color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
  .osveta-manager-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .osveta-manager-type { font-size: 11px; color: var(--muted-foreground); margin-bottom: 4px; }
  .osveta-manager-price { font-size: 12px; font-weight: 500; margin-bottom: 10px; color: oklch(0.65 0.12 160); }
  .osveta-manager-pro { font-size: 12px; color: var(--muted-foreground); padding: 2px 0; }

  .osveta-mfa-levels { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .osveta-mfa-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: var(--muted); border-radius: 8px; }
  .osveta-mfa-rank { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .osveta-mfa-body { flex: 1; }
  .osveta-mfa-name { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
  .osveta-mfa-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.5; }
  .osveta-mfa-level { font-size: 12px; font-weight: 600; flex-shrink: 0; }

  .osveta-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  .osveta-stat-card { background: var(--muted); border: 0.5px solid var(--border); border-radius: 10px; padding: 16px; }
  .osveta-stat-value { font-size: 28px; font-weight: 700; color: oklch(0.65 0.12 160); margin-bottom: 4px; }
  .osveta-stat-label { font-size: 12px; color: var(--foreground); line-height: 1.4; margin-bottom: 8px; }
  .osveta-stat-source { font-size: 10px; color: var(--muted-foreground); }

  .osveta-breaches { display: flex; flex-direction: column; gap: 4px; }
  .osveta-breach-row { display: flex; align-items: center; gap: 12px; padding: 8px 10px; background: var(--muted); border-radius: 6px; font-size: 13px; flex-wrap: wrap; }
  .osveta-breach-year { font-family: monospace; font-size: 11px; color: var(--muted-foreground); min-width: 60px; }
  .osveta-breach-name { font-weight: 500; min-width: 120px; }
  .osveta-breach-count { font-weight: 700; color: oklch(0.5 0.18 30); min-width: 100px; }
  .osveta-breach-desc { font-size: 12px; color: var(--muted-foreground); }
`

// =============================================================================
// HLAVNÍ STRÁNKA
// =============================================================================

export default function OsvetaPage() {
  const { news, loading, lastUpdated, error, refresh } = useRssNews()

  return (
    <div className="min-h-screen">
      <Navigation />
      <style>{PAGE_STYLES}</style>

      {/* Live news ticker — zobrazí se ihned (fallback) */}
      <NewsTicker news={news} />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Hlavička */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono">
              <Radio className="h-4 w-4" />
              <span>Živé zprávy + vzdělávání</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Svět kybernetické bezpečnosti
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Aktuální zprávy primárně z českých zdrojů a kompletní průvodce ochranou vašich hesel.
            </p>
          </div>

          {/* Slideshow zpráv */}
          <NewsSlideshow
            news={news}
            loading={loading}
            lastUpdated={lastUpdated}
            error={error}
            onRefresh={refresh}
          />

          {/* Sekce osvěty */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Vzdělávání o bezpečnosti hesel</h2>
                <p className="text-muted-foreground text-sm">Klikněte na téma pro rozbalení</p>
              </div>
            </div>
            <OsvetaAccordion sections={OSVETA_SECTIONS} />
          </div>

          {/* CTA */}
          <div className="text-center p-8 rounded-xl border border-primary/20 bg-card/50 space-y-4">
            <h2 className="text-2xl font-bold">Aplikujte znalosti v praxi</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Otestujte svá hesla nebo si nechte vygenerovat nová — vše probíhá lokálně, žádná data neopustí váš prohlížeč.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                href="/generator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Key className="h-5 w-5" />
                Generátor hesel
              </Link>
              <Link
                href="/test"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-transparent hover:bg-accent transition-colors font-medium"
              >
                <Shield className="h-5 w-5" />
                Analyzátor síly hesla
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
