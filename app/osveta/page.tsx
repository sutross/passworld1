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
  title: string; link: string; pubDate: string; source: string; category: string; isForeign?: boolean
}
interface RssSource {
  name: string; url: string; proxyUrl: string; category: string; isForeign?: boolean; count?: number
}

// =============================================================================
// RSS ZDROJE — primárně české, na konci max 2 zahraniční
// =============================================================================

const RSS_SOURCES: RssSource[] = [
  { name:"NÚKIB",               url:"https://www.nukib.cz/cs/rss/",                       proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.nukib.cz/cs/rss/")+"&count=4",                       category:"Varování",  isForeign:false, count:4 },
  { name:"Národní CERT",        url:"https://www.csirt.cz/rss/news/",                     proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.csirt.cz/rss/news/")+"&count=4",                     category:"CERT",      isForeign:false, count:4 },
  { name:"Root.cz — Bezpečnost",url:"https://www.root.cz/rss/clanky/bezpecnost/",        proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.root.cz/rss/clanky/bezpecnost/")+"&count=4",        category:"Bezpečnost",isForeign:false, count:4 },
  { name:"Lupa.cz",             url:"https://www.lupa.cz/rss/clanky/",                   proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.lupa.cz/rss/clanky/")+"&count=4",                   category:"Zprávy",    isForeign:false, count:4 },
  { name:"SecurityWorld.cz",    url:"https://www.securityworld.cz/rss/",                 proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.securityworld.cz/rss/")+"&count=4",                 category:"Bezpečnost",isForeign:false, count:4 },
  { name:"Živě.cz — Bezpečnost",url:"https://www.zive.cz/rss/sc-47/",                   proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.zive.cz/rss/sc-47/")+"&count=4",                   category:"Zprávy",    isForeign:false, count:4 },
  { name:"Bleeping Computer",   url:"https://www.bleepingcomputer.com/feed/",             proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://www.bleepingcomputer.com/feed/")+"&count=3",             category:"Mezinárodní",isForeign:true, count:3 },
  { name:"The Hacker News",     url:"https://feeds.feedburner.com/TheHackersNews",        proxyUrl:"https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent("https://feeds.feedburner.com/TheHackersNews")+"&count=3",        category:"Mezinárodní",isForeign:true, count:3 },
]

const FALLBACK_NEWS: NewsItem[] = [
  { title:"NÚKIB varuje před novou vlnou phishingových útoků na české instituce",  link:"#", pubDate:new Date().toISOString(), source:"NÚKIB",           category:"Varování",  isForeign:false },
  { title:"Národní CERT vydal upozornění na kritickou zranitelnost v routerech",   link:"#", pubDate:new Date().toISOString(), source:"Národní CERT",    category:"CERT",      isForeign:false },
  { title:"Root.cz: Jak fungují passkeys a proč nahrazují hesla",                  link:"#", pubDate:new Date().toISOString(), source:"Root.cz",         category:"Bezpečnost",isForeign:false },
  { title:"SecurityWorld: Ransomware útoky na české firmy vzrostly o 40 %",        link:"#", pubDate:new Date().toISOString(), source:"SecurityWorld.cz",category:"Bezpečnost",isForeign:false },
  { title:"Živě.cz: Google zavádí passkeys jako výchozí přihlašování",             link:"#", pubDate:new Date().toISOString(), source:"Živě.cz",         category:"Zprávy",    isForeign:false },
  { title:"Lupa.cz: Databáze 10 miliard hesel unikla na dark web",                 link:"#", pubDate:new Date().toISOString(), source:"Lupa.cz",         category:"Úniky dat", isForeign:false },
  { title:"Critical OpenSSL vulnerability patched — update immediately",            link:"#", pubDate:new Date().toISOString(), source:"Bleeping Computer",category:"Mezinárodní",isForeign:true },
  { title:"LockBit ransomware group resurfaces under new identity",                 link:"#", pubDate:new Date().toISOString(), source:"The Hacker News", category:"Mezinárodní",isForeign:true },
]

// =============================================================================
// HOOK: RSS
// =============================================================================

function useRssNews() {
  const [news, setNews]               = useState<NewsItem[]>(FALLBACK_NEWS)
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError]             = useState(false)

  const parse = useCallback((data: any, name: string, cat: string, foreign: boolean): NewsItem[] => {
    try {
      if (data.status !== "ok" || !Array.isArray(data.items)) return []
      return data.items.map((i: any) => ({ title:i.title?.trim()||"Bez názvu", link:i.link?.trim()||"#", pubDate:i.pubDate||new Date().toISOString(), source:name, category:cat, isForeign:foreign }))
    } catch { return [] }
  }, [])

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(false)
    const fetches = RSS_SOURCES.map(async s => {
      try {
        const r = await fetch(s.proxyUrl, { signal: AbortSignal.timeout(5000) })
        if (!r.ok) return [] as NewsItem[]
        return parse(await r.json(), s.name, s.category, s.isForeign ?? false)
      } catch { return [] as NewsItem[] }
    })
    const settled = await Promise.allSettled(fetches)
    const cz: NewsItem[] = [], foreign: NewsItem[] = []
    settled.forEach(r => { if (r.status !== "fulfilled") return; r.value.forEach(i => i.isForeign ? foreign.push(i) : cz.push(i)) })
    const sort = (a: NewsItem, b: NewsItem) => { try { return new Date(b.pubDate).getTime()-new Date(a.pubDate).getTime() } catch { return 0 } }
    cz.sort(sort); foreign.sort(sort)
    const all = [...cz, ...foreign]
    if (all.length > 0) { setNews(all.slice(0,20)); setError(false) } else setError(true)
    setLastUpdated(new Date()); setLoading(false)
  }, [parse])

  useEffect(() => { fetch_(); const iv = setInterval(fetch_, 30*60*1000); return () => clearInterval(iv) }, [fetch_])
  return { news, loading, lastUpdated, error, refresh: fetch_ }
}

// =============================================================================
// NEWS TICKER
// =============================================================================

function NewsTicker({ news }: { news: NewsItem[] }) {
  const items = [...news, ...news]
  return (
    <div className="osv-ticker">
      <div className="osv-ticker-label"><Radio className="h-3 w-3" /><span>LIVE</span></div>
      <div className="osv-ticker-track">
        <div className="osv-ticker-inner">
          {items.map((item, i) => (
            <a key={i} href={item.link !== "#" ? item.link : undefined} target="_blank" rel="noopener noreferrer" className="osv-ticker-item">
              <span className={`osv-ticker-cat ${item.isForeign ? "foreign" : ""}`}>{item.isForeign ? "🌍 " : ""}{item.category}</span>
              <span className="osv-ticker-title">{item.title}</span>
              <span className="osv-ticker-sep">◆</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDESHOW
// =============================================================================

function NewsSlideshow({ news, loading, lastUpdated, error, onRefresh }: {
  news: NewsItem[]; loading: boolean; lastUpdated: Date | null; error: boolean; onRefresh: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)
  const ivRef = useRef<NodeJS.Timeout | null>(null)
  const items = news.slice(0, 8)
  const next = useCallback(() => setCurrent(c => (c+1)%items.length), [items.length])
  const prev = useCallback(() => setCurrent(c => (c-1+items.length)%items.length), [items.length])
  useEffect(() => { if (!playing) { if (ivRef.current) clearInterval(ivRef.current); return }; ivRef.current = setInterval(next, 5000); return () => { if (ivRef.current) clearInterval(ivRef.current) } }, [playing, next])
  useEffect(() => { setCurrent(0) }, [news])
  const fmt = (d: string) => { try { return new Date(d).toLocaleDateString("cs-CZ",{day:"numeric",month:"short",year:"numeric"}) } catch { return "" } }
  const item = items[current] || items[0]
  if (!item) return null

  return (
    <div className="osv-slideshow">
      <div className="osv-ss-header">
        <div className="osv-ss-header-left">
          <div className="osv-ss-dot" />
          <span className="osv-ss-label">Aktuální zprávy z kyberbezpečnosti</span>
          {error   && <span className="osv-ss-badge err">offline — záloha</span>}
          {loading && <span className="osv-ss-badge loading">načítám…</span>}
        </div>
        <div className="osv-ss-header-right">
          {lastUpdated && <span className="osv-ss-time">{lastUpdated.toLocaleTimeString("cs-CZ",{hour:"2-digit",minute:"2-digit"})}</span>}
          <button onClick={onRefresh} disabled={loading} className="osv-ss-refresh" title="Načíst nové zprávy">
            <RefreshCw className={`h-3.5 w-3.5 ${loading?"animate-spin":""}`} />
          </button>
        </div>
      </div>

      <div className="osv-slide-card" onClick={() => item.link !== "#" && window.open(item.link,"_blank")} style={{ cursor: item.link !== "#" ? "pointer" : "default" }}>
        <div className="osv-slide-meta">
          <span className={`osv-slide-cat ${item.isForeign?"foreign":""}`}>{item.isForeign?"🌍 ":""}{item.category}</span>
          <span className="osv-slide-source">{item.source}</span>
          <span className="osv-slide-date">{fmt(item.pubDate)}</span>
        </div>
        <h2 className="osv-slide-title">{item.title}</h2>
        {item.link !== "#" && <div className="osv-slide-link"><ExternalLink className="h-3.5 w-3.5" /><span>Číst celý článek</span></div>}
        <div className="osv-slide-prog"><div key={`${current}-${playing}`} className="osv-slide-prog-fill" style={{ animationDuration: playing?"5s":"0s", animationPlayState: playing?"running":"paused" }} /></div>
      </div>

      <div className="osv-ss-nav">
        <button onClick={prev} className="osv-ss-nav-btn"><ChevronLeft className="h-4 w-4" /></button>
        <div className="osv-ss-dots">{items.map((_,i) => <button key={i} className={`osv-ss-dot-btn ${i===current?"active":""}`} onClick={() => setCurrent(i)} />)}</div>
        <button onClick={next} className="osv-ss-nav-btn"><ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => setPlaying(v=>!v)} className={`osv-ss-play ${playing?"active":""}`}>{playing?"⏸":"▶"}</button>
      </div>

      <div className="osv-news-grid">
        {items.map((n,i) => (
          <a key={i} href={n.link !== "#" ? n.link : undefined} target="_blank" rel="noopener noreferrer"
            className={`osv-news-card ${i===current?"active":""}`}
            onClick={e => { e.preventDefault(); setCurrent(i) }}>
            <span className={`osv-news-cat ${n.isForeign?"foreign":""}`}>{n.isForeign?"🌍 ":""}{n.category}</span>
            <span className="osv-news-title">{n.title}</span>
            <span className="osv-news-source">{n.source} · {fmt(n.pubDate)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// ACCORDION
// =============================================================================

interface OsvetaSection { id: string; icon: React.ReactNode; title: string; color: string; content: React.ReactNode }

function OsvetaAccordion({ sections }: { sections: OsvetaSection[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="osv-accordion">
      {sections.map(s => (
        <div key={s.id} className={`osv-acc-item ${open===s.id?"open":""}`}>
          <button className="osv-acc-trigger" onClick={() => setOpen(open===s.id?null:s.id)}>
            <div className="osv-acc-trigger-left">
              <div className="osv-acc-icon" style={{ background:s.color+"22", color:s.color }}>{s.icon}</div>
              <span className="osv-acc-title">{s.title}</span>
            </div>
            <ChevronDown className={`osv-acc-chevron ${open===s.id?"open":""}`} />
          </button>
          <div className={`osv-acc-body ${open===s.id?"open":""}`}>
            <div className="osv-acc-content">{s.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// SEKCE OBSAHU
// =============================================================================

const SECTIONS: OsvetaSection[] = [
  {
    id: "co-je-silne-heslo", icon: <Key className="h-5 w-5" />, title: "Co dělá heslo skutečně silným?", color: "#4ade80",
    content: (
      <div className="osv-grid-2">
        <div>
          <h4 className="osv-h4">Tři pilíře silného hesla</h4>
          <div className="osv-pillars">
            {[{ label:"Délka", value:"12+ znaků", desc:"Každý znak exponenciálně zvyšuje počet kombinací", icon:"📏" },
              { label:"Náhodnost", value:"Bez vzorů", desc:"Žádná jména, data, slova ze slovníku", icon:"🎲" },
              { label:"Unikátnost", value:"1 heslo = 1 účet", desc:"Jeden únik nesmí kompromitovat vše ostatní", icon:"🔑" }
            ].map(p => (
              <div key={p.label} className="osv-pillar">
                <span className="osv-pillar-icon">{p.icon}</span>
                <div><div className="osv-pillar-label">{p.label}: <strong>{p.value}</strong></div><div className="osv-pillar-desc">{p.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="osv-h4">Příklady síly hesla</h4>
          <div className="osv-examples">
            {[{ pwd:"heslo123",strength:5,label:"Katastrofické",color:"#ef4444" },
              { pwd:"Heslo123!",strength:20,label:"Velmi slabé",color:"#f97316" },
              { pwd:"M0jePsíč3kR3x!",strength:55,label:"Průměrné",color:"#eab308" },
              { pwd:"xK9#mPq2$xLwR4@n",strength:92,label:"Silné",color:"#4ade80" },
              { pwd:"kočka-tramvaj-modrý-klavír-7",strength:98,label:"Výborná passphrase",color:"#34d399" }
            ].map(e => (
              <div key={e.pwd} className="osv-example">
                <code className="osv-example-pwd">{e.pwd}</code>
                <div className="osv-example-bar-wrap"><div className="osv-example-bar" style={{ width:`${e.strength}%`, background:e.color }} /></div>
                <span className="osv-example-label" style={{ color:e.color }}>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "entropie", icon: <Calculator className="h-5 w-5" />, title: "Entropie: matematika za bezpečností hesla", color: "#06b6d4",
    content: (
      <div className="osv-grid-2">
        <div>
          <h4 className="osv-h4">Co je entropie?</h4>
          <p className="osv-p">Entropie měří nepředvídatelnost hesla v bitech. Více bitů = více pokusů útočník potřebuje = bezpečnější heslo.</p>
          <div className="osv-formula">
            <div className="osv-formula-title">Zjednodušený vzorec:</div>
            <div className="osv-formula-eq">H ≈ L × log₂(C)</div>
            <div className="osv-formula-vars"><span><strong>H</strong> = entropie v bitech</span><span><strong>L</strong> = délka hesla</span><span><strong>C</strong> = velikost znakové sady</span></div>
          </div>
          <div className="osv-charsets">
            {[{ chars:"a–z", size:26, color:"#ef4444" },{ chars:"a–z, A–Z", size:52, color:"#f97316" },{ chars:"a–z, A–Z, 0–9", size:62, color:"#eab308" },{ chars:"vše vč. !@#$%", size:95, color:"#4ade80" }].map(c => (
              <div key={c.chars} className="osv-charset">
                <code className="osv-charset-chars">{c.chars}</code>
                <div className="osv-charset-bar-wrap"><div className="osv-charset-bar" style={{ width:`${(c.size/95)*100}%`, background:c.color }} /></div>
                <span style={{ color:c.color, fontSize:"12px", fontWeight:500 }}>{c.size} znaků</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="osv-h4">Čas prolomení podle entropie</h4>
          <div className="osv-crack-table">
            {[{ bits:"< 40", rating:"Kriticky slabé", time:"Sekundy", color:"#ef4444" },
              { bits:"40–60", rating:"Slabé", time:"Hodiny až dny", color:"#f97316" },
              { bits:"60–80", rating:"Dobré", time:"Roky", color:"#eab308" },
              { bits:"80–128", rating:"Silné", time:"Miliony let", color:"#4ade80" },
              { bits:"> 128", rating:"Vojenská úroveň", time:"Věk vesmíru+", color:"#34d399" }
            ].map(r => (
              <div key={r.bits} className="osv-crack-row">
                <span className="osv-crack-bits" style={{ color:r.color }}>{r.bits} b</span>
                <span className="osv-crack-rating" style={{ color:r.color }}>{r.rating}</span>
                <span className="osv-crack-time">{r.time}</span>
              </div>
            ))}
          </div>
          <div className="osv-note">⚡ GPU (RTX 4090) zvládne ~10 miliard MD5 hashů za sekundu</div>
        </div>
      </div>
    ),
  },
  {
    id: "typy-utoku", icon: <AlertTriangle className="h-5 w-5" />, title: "Jak útočníci kradou hesla", color: "#ef4444",
    content: (
      <div className="osv-attacks">
        {[
          { name:"Brute Force", icon:"⚡", color:"#ef4444", desc:"Systematické zkoušení každé kombinace. Moderní GPU: 10 miliard pokusů/s.", obrana:"Heslo 12+ znaků → miliardy let prolomení" },
          { name:"Slovníkový útok", icon:"📖", color:"#f97316", desc:"Zkouší miliony reálných hesel z uniklých databází (RockYou: 14M hesel) + variace.", obrana:"Žádná slovní hesla, žádné vzory jako Heslo123!" },
          { name:"Phishing", icon:"🎣", color:"#eab308", desc:"Falešná přihlašovací stránka — zadáte heslo sami. Nejsilnější heslo nepomůže.", obrana:"Vždy zkontrolujte URL. Hardwarový klíč (FIDO2)." },
          { name:"Credential Stuffing", icon:"📋", color:"#8b5cf6", desc:"Uniklé heslo z webu A zkouší bot automaticky na webech B, C, D…", obrana:"Každý účet musí mít unikátní heslo. Správce hesel." },
          { name:"Rainbow Tables", icon:"🌈", color:"#06b6d4", desc:"Předpočítané tabulky hashů — prolomení trvá milisekundy, ne hodiny.", obrana:"Weby musí používat salt + moderní hashování (bcrypt, Argon2)." },
          { name:"Keylogger", icon:"🖱️", color:"#4ade80", desc:"Malware zachytává každé stisknutí klávesy. Běží neviditelně na pozadí.", obrana:"Aktuální antivirus. FIDO2 klíč zachrání účet i při keyloggeru." },
        ].map(a => (
          <div key={a.name} className="osv-attack-card" style={{ borderColor:a.color+"44" }}>
            <div className="osv-attack-header"><span className="osv-attack-icon">{a.icon}</span><span className="osv-attack-name" style={{ color:a.color }}>{a.name}</span></div>
            <p className="osv-attack-desc">{a.desc}</p>
            <div className="osv-attack-obrana"><Shield className="h-3.5 w-3.5" style={{ color:a.color }} /><span>{a.obrana}</span></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "best-practices", icon: <CheckCircle className="h-5 w-5" />, title: "Doporučené postupy", color: "#4ade80",
    content: (
      <div className="osv-grid-2">
        <div>
          <h4 className="osv-h4 green">✓ Co dělat</h4>
          {["Minimálně 12–16 znaků na každé heslo","Passphrase: náhodná slova oddělená pomlčkou","Unikátní heslo pro každý jednotlivý účet","Správce hesel (Bitwarden, 1Password, KeePassXC)","Dvoufaktorová autentizace (2FA) všude kde je","Pravidelná kontrola v databázích úniků (HIBP)","Hardwarový klíč (YubiKey) pro kritické účty"].map(item => (
            <div key={item} className="osv-do-item"><CheckCircle className="h-4 w-4 osv-do-icon" /><span>{item}</span></div>
          ))}
        </div>
        <div>
          <h4 className="osv-h4 red">✗ Čemu se vyhýbat</h4>
          {["Slovníková slova, jména, místa v heslech","Osobní informace (datum narození, jméno mazlíčka)","Sekvence: 123456, qwerty, abcdef","Substituce: @ místo a, 3 místo e — jsou ve slovnících","Stejné heslo na více místech","Ukládání hesel v prohlížeči bez masterkey","Posílání hesel přes SMS, e-mail, chat"].map(item => (
            <div key={item} className="osv-dont-item"><XCircle className="h-4 w-4 osv-dont-icon" /><span>{item}</span></div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "spravci-hesel", icon: <Database className="h-5 w-5" />, title: "Správci hesel — proč a který vybrat", color: "#3b82f6",
    content: (
      <div>
        <p className="osv-p">Správce hesel vygeneruje a zapamatuje silné unikátní heslo pro každý účet. Vy si pamatujete jen jedno hlavní heslo.</p>
        <div className="osv-managers">
          {[{ name:"Bitwarden", type:"Open-source, cloud", price:"Zdarma / Premium", pros:["Auditovaný kód","E2E šifrování","Sdílení hesel"], best:true },
            { name:"1Password", type:"Komerční, cloud", price:"~3 $/měsíc", pros:["Travel mode","Watchtower","Rodinné plány"], best:false },
            { name:"KeePassXC", type:"Open-source, lokální", price:"Zdarma", pros:["Offline databáze","Žádný cloud","Maximální kontrola"], best:false },
            { name:"Proton Pass", type:"Open-source, cloud", price:"Zdarma / Plus", pros:["Aliasy e-mailů","Švýcarské servery","Zero-knowledge"], best:false }
          ].map(m => (
            <div key={m.name} className={`osv-manager-card ${m.best?"best":""}`}>
              {m.best && <div className="osv-manager-badge">Doporučujeme</div>}
              <div className="osv-manager-name">{m.name}</div>
              <div className="osv-manager-type">{m.type}</div>
              <div className="osv-manager-price">{m.price}</div>
              <div className="osv-manager-pros">{m.pros.map(p => <div key={p} className="osv-manager-pro">✓ {p}</div>)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "mfa", icon: <Smartphone className="h-5 w-5" />, title: "Vícefaktorová autentizace (MFA / 2FA)", color: "#8b5cf6",
    content: (
      <div>
        <p className="osv-p">MFA přidává druhý faktor — i se správným heslem se útočník nedostane dovnitř bez fyzického přístupu k vašemu zařízení.</p>
        <div className="osv-mfa-levels">
          {[{ rank:1, name:"Hardwarový klíč (FIDO2/WebAuthn)", desc:"YubiKey, Google Titan. Fyzický token, odolný phishingu. Nejbezpečnější.", level:"Nejvyšší", color:"#4ade80" },
            { rank:2, name:"Autentizační aplikace (TOTP)", desc:"Google Authenticator, Authy, Aegis. Časové kódy generované offline.", level:"Vysoká", color:"#06b6d4" },
            { rank:3, name:"Push notifikace", desc:"Microsoft Authenticator, Duo. Potvrzení na telefonu při přihlášení.", level:"Střední", color:"#3b82f6" },
            { rank:4, name:"SMS kódy", desc:"Jednorázový kód přes SMS. Lepší než nic — ale zranitelné SIM swappingem.", level:"Nízká", color:"#f97316" }
          ].map(f => (
            <div key={f.rank} className="osv-mfa-row">
              <div className="osv-mfa-rank" style={{ background:f.color+"22", color:f.color }}>#{f.rank}</div>
              <div className="osv-mfa-body"><div className="osv-mfa-name">{f.name}</div><div className="osv-mfa-desc">{f.desc}</div></div>
              <div className="osv-mfa-level" style={{ color:f.color }}>{f.level}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "statistiky", icon: <TrendingUp className="h-5 w-5" />, title: "Statistiky a realita úniků dat", color: "#f97316",
    content: (
      <div>
        <div className="osv-stats">
          {[{ value:"81 %", label:"úniků dat způsobeno slabými nebo ukradenými hesly", source:"Verizon DBIR 2023" },
            { value:"65 %", label:"lidí používá stejné heslo na více místech", source:"Google Security Survey" },
            { value:"600M+", label:"uniklých hesel v databázi HaveIBeenPwned", source:"HIBP" },
            { value:"$4.35M", label:"průměrná cena úniku dat pro organizaci", source:"IBM 2023" }
          ].map(s => (
            <div key={s.value} className="osv-stat-card">
              <div className="osv-stat-value">{s.value}</div>
              <div className="osv-stat-label">{s.label}</div>
              <div className="osv-stat-source">Zdroj: {s.source}</div>
            </div>
          ))}
        </div>
        <h4 className="osv-h4" style={{ marginTop:"1.5rem" }}>Největší úniky v historii</h4>
        <div className="osv-breaches">
          {[{ name:"Collection #1–5", year:"2019", count:"2,2 miliardy", desc:"kombinací email/heslo" },
            { name:"Yahoo", year:"2013–14", count:"3 miliardy", desc:"účtů kompromitováno" },
            { name:"LinkedIn", year:"2012/21", count:"700 milionů", desc:"profilů vystaveno" },
            { name:"Facebook", year:"2019", count:"533 milionů", desc:"uživatelských záznamů" },
            { name:"RockYou2024", year:"2024", count:"10 miliard", desc:"hesel v jediném souboru" }
          ].map(b => (
            <div key={b.name} className="osv-breach-row">
              <span className="osv-breach-year">{b.year}</span>
              <span className="osv-breach-name">{b.name}</span>
              <span className="osv-breach-count">{b.count}</span>
              <span className="osv-breach-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// =============================================================================
// STYLY
// =============================================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@300;400;500;600&display=swap');

  .osv-page * { box-sizing: border-box; }
  .osv-page { font-family: 'Sora', sans-serif; min-height: 100vh; }

  /* TICKER */
  .osv-ticker { display:flex; align-items:center; background:oklch(0.12 0.02 160); border-bottom:1px solid oklch(0.55 0.12 160 / 0.3); height:34px; overflow:hidden; position:sticky; top:64px; z-index:40; }
  .osv-ticker-label { display:flex; align-items:center; gap:4px; padding:0 12px; background:oklch(0.55 0.12 160); color:white; font-size:11px; font-weight:700; letter-spacing:0.1em; height:100%; flex-shrink:0; font-family:'JetBrains Mono',monospace; }
  .osv-ticker-track { flex:1; overflow:hidden; height:100%; }
  .osv-ticker-inner { display:flex; align-items:center; height:100%; animation:osv-ticker 80s linear infinite; white-space:nowrap; width:max-content; }
  @keyframes osv-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .osv-ticker-inner:hover { animation-play-state:paused; }
  .osv-ticker-item { display:inline-flex; align-items:center; gap:8px; padding:0 20px 0 0; font-size:12px; color:oklch(0.85 0.01 180); text-decoration:none; transition:color 0.2s; }
  .osv-ticker-item:hover { color:oklch(0.65 0.12 160); }
  .osv-ticker-cat { font-size:10px; font-weight:700; color:oklch(0.65 0.12 160); text-transform:uppercase; letter-spacing:0.05em; background:oklch(0.55 0.12 160 / 0.15); padding:1px 6px; border-radius:4px; flex-shrink:0; font-family:'JetBrains Mono',monospace; }
  .osv-ticker-cat.foreign { color:oklch(0.65 0.1 270); background:oklch(0.5 0.1 270 / 0.15); }
  .osv-ticker-title { max-width:380px; overflow:hidden; text-overflow:ellipsis; }
  .osv-ticker-sep { color:oklch(0.35 0.04 180); }

  /* HERO */
  .osv-hero { text-align:center; padding:40px 16px 32px; max-width:700px; margin:0 auto; }
  .osv-hero-badge { display:inline-flex; align-items:center; gap:6px; background:oklch(0.55 0.12 160 / 0.1); border:1px solid oklch(0.55 0.12 160 / 0.25); border-radius:20px; padding:4px 14px; font-size:11px; color:oklch(0.65 0.12 160); font-family:'JetBrains Mono',monospace; margin-bottom:16px; letter-spacing:0.04em; }
  .osv-hero-dot { width:6px; height:6px; border-radius:50%; background:oklch(0.65 0.12 160); animation:osv-pulse 2s ease-in-out infinite; }
  @keyframes osv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
  .osv-hero-title { font-size:clamp(24px,4vw,34px); font-weight:600; margin-bottom:10px; }
  .osv-hero-sub { font-size:14px; color:var(--muted-foreground); line-height:1.6; }

  /* MAIN */
  .osv-main { max-width:960px; margin:0 auto; padding:0 16px 64px; display:flex; flex-direction:column; gap:24px; }

  /* SLIDESHOW */
  .osv-slideshow { background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; padding:18px; }
  .osv-ss-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .osv-ss-header-left { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .osv-ss-dot { width:8px; height:8px; border-radius:50%; background:oklch(0.55 0.12 160); animation:osv-pulse 2s ease-in-out infinite; }
  .osv-ss-label { font-size:12px; font-weight:500; color:var(--muted-foreground); }
  .osv-ss-badge { font-size:10px; padding:2px 6px; border-radius:4px; font-family:'JetBrains Mono',monospace; }
  .osv-ss-badge.err { background:oklch(0.5 0.18 30 / 0.15); color:oklch(0.5 0.18 30); }
  .osv-ss-badge.loading { background:oklch(0.55 0.12 160 / 0.15); color:oklch(0.65 0.12 160); }
  .osv-ss-header-right { display:flex; align-items:center; gap:8px; }
  .osv-ss-time { font-size:11px; color:var(--muted-foreground); font-family:'JetBrains Mono',monospace; }
  .osv-ss-refresh { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:transparent; border:1px solid var(--border); color:var(--muted-foreground); cursor:pointer; transition:all 0.15s; }
  .osv-ss-refresh:hover { background:var(--muted); color:var(--foreground); }
  .osv-ss-refresh:disabled { opacity:0.4; cursor:not-allowed; }

  .osv-slide-card { background:var(--background); border:1px solid var(--border); border-radius:12px; padding:18px 20px; min-height:120px; transition:border-color 0.2s; position:relative; overflow:hidden; margin-bottom:10px; }
  .osv-slide-card:hover { border-color:oklch(0.55 0.12 160 / 0.4); }
  .osv-slide-meta { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
  .osv-slide-cat { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; background:oklch(0.55 0.12 160 / 0.15); color:oklch(0.65 0.12 160); padding:2px 8px; border-radius:4px; font-family:'JetBrains Mono',monospace; }
  .osv-slide-cat.foreign { background:oklch(0.5 0.1 270 / 0.15); color:oklch(0.65 0.1 270); }
  .osv-slide-source { font-size:11px; color:var(--muted-foreground); }
  .osv-slide-date { font-size:10px; color:var(--muted-foreground); margin-left:auto; font-family:'JetBrains Mono',monospace; }
  .osv-slide-title { font-size:17px; font-weight:600; line-height:1.4; margin-bottom:10px; }
  .osv-slide-link { display:flex; align-items:center; gap:4px; font-size:12px; color:oklch(0.55 0.12 160); }
  .osv-slide-prog { position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--border); }
  .osv-slide-prog-fill { height:100%; background:oklch(0.55 0.12 160); animation:osv-prog linear forwards; width:0%; }
  @keyframes osv-prog { from{width:0%} to{width:100%} }

  .osv-ss-nav { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
  .osv-ss-nav-btn { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; background:var(--muted); border:1px solid var(--border); color:var(--foreground); cursor:pointer; transition:background 0.15s; }
  .osv-ss-nav-btn:hover { background:var(--accent); }
  .osv-ss-dots { display:flex; align-items:center; gap:4px; flex:1; justify-content:center; }
  .osv-ss-dot-btn { width:6px; height:6px; border-radius:50%; background:var(--border); border:none; cursor:pointer; transition:all 0.2s; }
  .osv-ss-dot-btn.active { background:oklch(0.55 0.12 160); transform:scale(1.4); }
  .osv-ss-play { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; background:var(--muted); border:1px solid var(--border); cursor:pointer; font-size:11px; transition:background 0.15s; }
  .osv-ss-play.active { background:oklch(0.55 0.12 160 / 0.15); }

  .osv-news-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:6px; }
  .osv-news-card { background:var(--background); border:1px solid var(--border); border-radius:8px; padding:9px 11px; display:flex; flex-direction:column; gap:4px; cursor:pointer; text-decoration:none; transition:all 0.15s; }
  .osv-news-card:hover, .osv-news-card.active { border-color:oklch(0.55 0.12 160 / 0.5); background:oklch(0.55 0.12 160 / 0.06); }
  .osv-news-cat { font-size:10px; font-weight:700; color:oklch(0.65 0.12 160); text-transform:uppercase; letter-spacing:0.06em; font-family:'JetBrains Mono',monospace; }
  .osv-news-cat.foreign { color:oklch(0.65 0.1 270); }
  .osv-news-title { font-size:11px; line-height:1.45; color:var(--foreground); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .osv-news-source { font-size:10px; color:var(--muted-foreground); margin-top:auto; }

  /* OSVĚTA SEKCE */
  .osv-section-header { display:flex; align-items:center; gap:12px; }
  .osv-section-icon { width:38px; height:38px; border-radius:10px; background:oklch(0.55 0.12 160 / 0.1); display:flex; align-items:center; justify-content:center; color:oklch(0.65 0.12 160); flex-shrink:0; }
  .osv-section-title { font-size:20px; font-weight:600; }
  .osv-section-sub { font-size:12px; color:var(--muted-foreground); }

  /* ACCORDION */
  .osv-accordion { display:flex; flex-direction:column; gap:6px; }
  .osv-acc-item { background:var(--card); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color 0.2s; }
  .osv-acc-item.open { border-color:oklch(0.55 0.12 160 / 0.35); }
  .osv-acc-trigger { width:100%; display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:transparent; border:none; cursor:pointer; text-align:left; transition:background 0.15s; }
  .osv-acc-trigger:hover { background:var(--muted); }
  .osv-acc-trigger-left { display:flex; align-items:center; gap:10px; }
  .osv-acc-icon { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .osv-acc-title { font-size:14px; font-weight:500; text-align:left; }
  .osv-acc-chevron { width:17px; height:17px; color:var(--muted-foreground); transition:transform 0.3s; flex-shrink:0; }
  .osv-acc-chevron.open { transform:rotate(180deg); }
  .osv-acc-body { max-height:0; overflow:hidden; transition:max-height 0.4s cubic-bezier(0.4,0,0.2,1); }
  .osv-acc-body.open { max-height:2000px; }
  .osv-acc-content { padding:0 18px 18px; border-top:1px solid var(--border); padding-top:16px; }

  /* CONTENT STYLES */
  .osv-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  @media (max-width:640px) { .osv-grid-2 { grid-template-columns:1fr; } .osv-news-grid { grid-template-columns:1fr 1fr; } }
  .osv-h4 { font-size:11px; font-weight:600; margin-bottom:10px; color:var(--muted-foreground); text-transform:uppercase; letter-spacing:0.08em; font-family:'JetBrains Mono',monospace; }
  .osv-h4.green { color:oklch(0.55 0.12 160); }
  .osv-h4.red { color:oklch(0.5 0.18 30); }
  .osv-p { font-size:13px; color:var(--muted-foreground); line-height:1.6; margin-bottom:14px; }

  .osv-pillars { display:flex; flex-direction:column; gap:8px; }
  .osv-pillar { display:flex; align-items:flex-start; gap:10px; padding:10px; background:var(--background); border:1px solid var(--border); border-radius:8px; }
  .osv-pillar-icon { font-size:18px; flex-shrink:0; }
  .osv-pillar-label { font-size:12px; font-weight:500; }
  .osv-pillar-desc { font-size:11px; color:var(--muted-foreground); margin-top:2px; }

  .osv-examples { display:flex; flex-direction:column; gap:8px; }
  .osv-example { display:flex; align-items:center; gap:8px; }
  .osv-example-pwd { font-size:11px; font-family:'JetBrains Mono',monospace; min-width:150px; color:var(--foreground); }
  .osv-example-bar-wrap { flex:1; height:3px; background:var(--border); border-radius:2px; overflow:hidden; }
  .osv-example-bar { height:100%; border-radius:2px; }
  .osv-example-label { font-size:11px; font-weight:500; min-width:110px; text-align:right; }

  .osv-formula { background:var(--background); border:1px solid var(--border); border-radius:8px; padding:12px 14px; margin-bottom:14px; }
  .osv-formula-title { font-size:10px; color:var(--muted-foreground); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.06em; }
  .osv-formula-eq { font-size:18px; font-family:'JetBrains Mono',monospace; font-weight:700; color:oklch(0.65 0.12 160); margin-bottom:8px; }
  .osv-formula-vars { display:flex; gap:12px; flex-wrap:wrap; font-size:11px; color:var(--muted-foreground); font-family:'JetBrains Mono',monospace; }

  .osv-charsets { display:flex; flex-direction:column; gap:7px; }
  .osv-charset { display:flex; align-items:center; gap:8px; }
  .osv-charset-chars { font-family:'JetBrains Mono',monospace; font-size:11px; min-width:115px; color:var(--foreground); }
  .osv-charset-bar-wrap { flex:1; height:3px; background:var(--border); border-radius:2px; overflow:hidden; }
  .osv-charset-bar { height:100%; border-radius:2px; }

  .osv-crack-table { display:flex; flex-direction:column; gap:4px; }
  .osv-crack-row { display:flex; align-items:center; gap:10px; padding:7px 10px; background:var(--background); border:1px solid var(--border); border-radius:6px; font-size:12px; }
  .osv-crack-bits { font-family:'JetBrains Mono',monospace; font-weight:700; min-width:56px; font-size:11px; }
  .osv-crack-rating { font-weight:500; flex:1; }
  .osv-crack-time { font-size:11px; color:var(--muted-foreground); }
  .osv-note { margin-top:8px; font-size:11px; color:var(--muted-foreground); background:var(--background); border:1px solid var(--border); padding:7px 10px; border-radius:6px; font-family:'JetBrains Mono',monospace; }

  .osv-attacks { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px; }
  .osv-attack-card { background:var(--background); border:1px solid; border-radius:10px; padding:12px 14px; }
  .osv-attack-header { display:flex; align-items:center; gap:7px; margin-bottom:7px; }
  .osv-attack-icon { font-size:16px; }
  .osv-attack-name { font-size:13px; font-weight:600; }
  .osv-attack-desc { font-size:11px; color:var(--muted-foreground); line-height:1.5; margin-bottom:8px; }
  .osv-attack-obrana { display:flex; align-items:flex-start; gap:5px; font-size:11px; color:var(--foreground); background:var(--muted); padding:7px 9px; border-radius:6px; }

  .osv-do-item, .osv-dont-item { display:flex; align-items:flex-start; gap:8px; padding:7px 0; border-bottom:1px solid var(--border); font-size:12px; }
  .osv-do-item:last-child, .osv-dont-item:last-child { border-bottom:none; }
  .osv-do-icon { color:oklch(0.55 0.12 160); flex-shrink:0; margin-top:2px; }
  .osv-dont-icon { color:oklch(0.5 0.18 30); flex-shrink:0; margin-top:2px; }

  .osv-managers { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:8px; margin-top:14px; }
  .osv-manager-card { background:var(--background); border:1px solid var(--border); border-radius:10px; padding:12px 14px; position:relative; }
  .osv-manager-card.best { border-color:oklch(0.55 0.12 160 / 0.4); background:oklch(0.55 0.12 160 / 0.04); }
  .osv-manager-badge { position:absolute; top:-8px; right:10px; background:oklch(0.55 0.12 160); color:white; font-size:9px; font-weight:700; padding:2px 8px; border-radius:4px; font-family:'JetBrains Mono',monospace; text-transform:uppercase; letter-spacing:0.06em; }
  .osv-manager-name { font-size:14px; font-weight:600; margin-bottom:3px; }
  .osv-manager-type { font-size:11px; color:var(--muted-foreground); margin-bottom:3px; }
  .osv-manager-price { font-size:11px; font-weight:500; margin-bottom:8px; color:oklch(0.65 0.12 160); font-family:'JetBrains Mono',monospace; }
  .osv-manager-pro { font-size:11px; color:var(--muted-foreground); padding:1px 0; }

  .osv-mfa-levels { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
  .osv-mfa-row { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; background:var(--background); border:1px solid var(--border); border-radius:8px; }
  .osv-mfa-rank { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; font-family:'JetBrains Mono',monospace; }
  .osv-mfa-body { flex:1; }
  .osv-mfa-name { font-size:13px; font-weight:500; margin-bottom:2px; }
  .osv-mfa-desc { font-size:11px; color:var(--muted-foreground); line-height:1.5; }
  .osv-mfa-level { font-size:11px; font-weight:600; flex-shrink:0; font-family:'JetBrains Mono',monospace; }

  .osv-stats { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:8px; }
  .osv-stat-card { background:var(--background); border:1px solid var(--border); border-radius:10px; padding:14px; }
  .osv-stat-value { font-size:26px; font-weight:700; color:oklch(0.65 0.12 160); margin-bottom:4px; font-family:'JetBrains Mono',monospace; }
  .osv-stat-label { font-size:12px; color:var(--foreground); line-height:1.4; margin-bottom:6px; }
  .osv-stat-source { font-size:10px; color:var(--muted-foreground); font-family:'JetBrains Mono',monospace; }

  .osv-breaches { display:flex; flex-direction:column; gap:4px; }
  .osv-breach-row { display:flex; align-items:center; gap:10px; padding:7px 10px; background:var(--background); border:1px solid var(--border); border-radius:6px; font-size:12px; flex-wrap:wrap; }
  .osv-breach-year { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted-foreground); min-width:58px; }
  .osv-breach-name { font-weight:500; min-width:110px; }
  .osv-breach-count { font-weight:700; color:oklch(0.5 0.18 30); min-width:95px; font-family:'JetBrains Mono',monospace; font-size:11px; }
  .osv-breach-desc { font-size:11px; color:var(--muted-foreground); }

  /* CTA */
  .osv-cta { text-align:center; padding:32px; background:var(--card); border:1px solid var(--border); border-radius:16px; }
  .osv-cta-title { font-size:20px; font-weight:600; margin-bottom:8px; }
  .osv-cta-sub { font-size:13px; color:var(--muted-foreground); margin-bottom:20px; line-height:1.6; }
  .osv-cta-btns { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
  .osv-cta-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:500; cursor:pointer; text-decoration:none; transition:all 0.15s; }
  .osv-cta-btn.primary { background:oklch(0.55 0.12 160); color:white; border:1px solid oklch(0.55 0.12 160); }
  .osv-cta-btn.primary:hover { background:oklch(0.6 0.14 160); }
  .osv-cta-btn.secondary { background:transparent; color:var(--foreground); border:1px solid var(--border); }
  .osv-cta-btn.secondary:hover { background:var(--muted); }
`

// =============================================================================
// STRÁNKA
// =============================================================================

export default function OsvetaPage() {
  const { news, loading, lastUpdated, error, refresh } = useRssNews()

  return (
    <div className="min-h-screen osv-page">
      <Navigation />
      <style>{STYLES}</style>

      <NewsTicker news={news} />

      <div className="osv-hero">
        <div className="osv-hero-badge"><div className="osv-hero-dot" /><Radio style={{width:12,height:12}} /> Živé zprávy + vzdělávání</div>
        <h1 className="osv-hero-title">Svět kybernetické bezpečnosti</h1>
        <p className="osv-hero-sub">Aktuální zprávy primárně z českých zdrojů a kompletní průvodce ochranou vašich hesel.</p>
      </div>

      <div className="osv-main">
        <NewsSlideshow news={news} loading={loading} lastUpdated={lastUpdated} error={error} onRefresh={refresh} />

        <div>
          <div className="osv-section-header">
            <div className="osv-section-icon"><BookOpen style={{width:18,height:18}} /></div>
            <div>
              <div className="osv-section-title">Vzdělávání o bezpečnosti hesel</div>
              <div className="osv-section-sub">Klikněte na téma pro rozbalení</div>
            </div>
          </div>
        </div>

        <OsvetaAccordion sections={SECTIONS} />

        <div className="osv-cta">
          <div className="osv-cta-title">Aplikujte znalosti v praxi</div>
          <p className="osv-cta-sub">Otestujte svá hesla nebo si nechte vygenerovat nová — vše probíhá lokálně, žádná data neopustí váš prohlížeč.</p>
          <div className="osv-cta-btns">
            <Link href="/generator" className="osv-cta-btn primary"><Key style={{width:15,height:15}} /> Generátor hesel</Link>
            <Link href="/test" className="osv-cta-btn secondary"><Shield style={{width:15,height:15}} /> Analyzátor síly hesla</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
