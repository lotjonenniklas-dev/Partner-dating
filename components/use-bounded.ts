"use client"

import { useState } from "react"
import { LIST_PAGE } from "@/lib/crowd"

export function useBounded<T>(items: T[], page = LIST_PAGE) {
  const [limit, setLimit] = useState(page)
  const shown = items.length <= limit ? items : items.slice(0, limit)
  return {
    shown,
    hidden: items.length - shown.length,
    more: () => setLimit((value) => value + page),
  }
}
