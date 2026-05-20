"use client"

import { Home, Library, Users, Disc3, Wifi, WifiOff } from "lucide-react"
import { useNebula } from "@/lib/context"

export function Sidebar({ active, onNavChange }: { active: string; onNavChange: (label: string) => void }) {
  const { roomId, connected, isHost } = useNebula()

  const navItems = [
    { icon: Home, label: "Home" },
    { icon: Library, label: "Library" },
    { icon: Users, label: "Rooms" },
  ]

  return (
    <div className="h-full w-full md:w-16 flex flex-col items-center bg-surface-container-high/40 backdrop-blur-xl border-r border-outline/10 py-5 gap-6 select-none">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
        <Disc3 size={18} className="text-white" />
      </div>

      <div className="flex flex-col items-center gap-3 flex-1">
        {navItems.map((item) => {
          const isActive = active === item.label
          return (
            <button key={item.label}
              onClick={() => onNavChange(item.label)}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary shadow-sm shadow-primary/10"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50"
              }`}
              title={item.label}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              {item.label === "Rooms" && roomId && (
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-high ${connected ? "bg-primary" : "bg-error"}`} />
              )}
            </button>
          )
        })}
      </div>

      {roomId && isHost && (
        <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/30" title="Host" />
      )}
    </div>
  )
}
