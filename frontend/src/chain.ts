import { ethers } from "ethers"
import data from "./contract.json"

const RPC = "http://127.0.0.1:8545"
const AGENT = "http://localhost:3001"

const vinHash = (vin: string) => ethers.keccak256(ethers.toUtf8Bytes(vin))

async function ensureHardhat() {
  const eth = (window as any).ethereum
  if (!eth) throw new Error("MetaMask not found")
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x7a69" }] })
  } catch (e: any) {
    if (e.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x7a69",
          chainName: "Hardhat Local",
          rpcUrls: ["http://127.0.0.1:8545"],
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
        }],
      })
    } else throw e
  }
}

export async function readTimeline(vin: string) {
  const provider = new ethers.JsonRpcProvider(RPC)
  const c = new ethers.Contract(data.address, data.abi, provider)
  const rows = await c.getTimeline(vinHash(vin))
  return rows.map((r: any, i: number) => ({
    index: i,
    km: Number(r.km),
    issuer: (data.issuers as Record<string, string>)[r.issuer] ?? r.issuer,
    issuerAddress: r.issuer as string,
    flagged: r.flagged,
    isCorrection: r.isCorrection,
    evidenceHash: r.evidenceHash as string,
        timestamp: Number(r.timestamp),
    correctsIndex: Number(r.correctsIndex),
  }))
}

export async function addReadingOnChain(vin: string, km: number, evidenceText: string) {
  await ensureHardhat()
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  const c = new ethers.Contract(data.address, data.abi, signer)
const tx = await c.addReading(
  vinHash(vin),
  km,
  ethers.keccak256(ethers.toUtf8Bytes(evidenceText)),
  { gasLimit: 300000 }
)
  const receipt = await tx.wait()
  return receipt.hash as string
}

export async function analyze(vin: string) {
  const r = await fetch(`${AGENT}/api/analyze/${vin}`)
  if (!r.ok) throw new Error("agent error")
  return r.json()
}
export async function verifyIntegrity(vin: string) {
  const rows = await readTimeline(vin)
  let max = 0
  let flagOk = 0
  let hashOk = 0
  rows.forEach((e: any) => {
    const expectedFlag = !e.isCorrection && e.km < max
    if (!e.isCorrection && !expectedFlag) max = e.km
    if (e.isCorrection || expectedFlag === e.flagged) flagOk++
    const seedHash = ethers.keccak256(ethers.toUtf8Bytes(`${vin}-${e.km}-evidence`))
    if (seedHash === e.evidenceHash) hashOk++
  })
  return { total: rows.length, flagOk, hashOk }
}
export async function addCorrectionOnChain(vin: string, originalIndex: number, km: number, evidenceText: string) {
  await ensureHardhat()
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  const c = new ethers.Contract(data.address, data.abi, signer)
  const tx = await c.addCorrection(vinHash(vin), originalIndex, km, ethers.keccak256(ethers.toUtf8Bytes(evidenceText)))
  const receipt = await tx.wait()
  return receipt.hash as string
}