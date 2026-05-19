"use client"

import type { ReactNode } from "react"
import { NebulaProvider } from "@/lib/context"

export function Providers({ children }: { children: ReactNode }) {
  return <NebulaProvider>{children}</NebulaProvider>
}
