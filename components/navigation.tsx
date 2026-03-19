"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Key, Search, TestTube, BookOpen, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// NAVIGATION COMPONENT
// =============================================================================
// Hlavní navigační lišta aplikace. Sticky pozice zajišťuje viditelnost
// při scrollování. Backdrop blur vytváří moderní "glass" efekt.
// =============================================================================

// Konfigurace navigačních položek - centralizované pro snadnou údržbu
const navItems = [
  { href: "/", label: "Domů", icon: Home },
  { href: "/generator", label: "Generátor", icon: Key },
  { href: "/test", label: "Analýza hesla", icon: TestTube },
  { href: "/osveta", label: "Osvěta", icon: BookOpen },
]

export function Navigation() {
  // Získání aktuální cesty pro zvýraznění aktivní položky
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo s gradientovým textem */}
          <Link href="/" className="flex items-center gap-2 font-mono text-lg font-bold">
            <Shield className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              PASSWORLD
            </span>
          </Link>

          {/* Navigační odkazy - responzivní zobrazení (ikony vždy, text pouze na sm+) */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              // Detekce aktivní stránky pro vizuální zvýraznění
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
                    "hover:bg-primary/10 hover:text-primary",
                    isActive && "bg-primary/20 text-primary font-medium",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
