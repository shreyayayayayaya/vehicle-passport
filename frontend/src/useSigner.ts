import { useEffect, useState } from "react"
import contract from "./contract.json"

export function useSigner() {
  const [name, setName] = useState("Not connected")

  useEffect(() => {
    const eth = (window as any).ethereum
    if (!eth) return
    const update = (accounts: string[]) => {
      const a = accounts?.[0]?.toLowerCase()
      if (!a) return setName("Not connected")
      const issuers = contract.issuers as Record<string, string>
      const match = Object.keys(issuers).find((k) => k.toLowerCase() === a)
      setName(match ? issuers[match] : "Not an approved issuer")
    }
    eth.request({ method: "eth_requestAccounts" }).then(update).catch(() => {})
    eth.on?.("accountsChanged", update)
    return () => eth.removeListener?.("accountsChanged", update)
  }, [])

  return name
}