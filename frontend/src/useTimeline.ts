import { useEffect, useState } from "react"
import { readTimeline } from "./chain"

export function useTimeline(vin: string | undefined) {
  const [entries, setEntries] = useState<any[] | null>(null)

  useEffect(() => {
    console.log("useTimeline running for", vin)
    if (!vin) return
    let cancelled = false
    setEntries(null)
    readTimeline(vin)
      .then((e: any) => {
        console.log("readTimeline ok", e)
        if (!cancelled) setEntries(e)
      })
      .catch((err) => {
        console.error("readTimeline failed:", err)
        if (!cancelled) setEntries(null)
      })
    return () => { cancelled = true }
  }, [vin])

  return entries
}