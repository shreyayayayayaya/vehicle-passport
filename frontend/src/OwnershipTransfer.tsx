import { useState, useSyncExternalStore } from "react"
import { AlertCircle, ArrowLeft, Check, Link2, Send } from "lucide-react"
import "./ownership-transfer.css"

/* ───────────── Types ───────────── */

export type TransferStatus = "pending" | "completed" | "expired" | "cancelled"

export type TransferVehicle = {
  vin: string
  make: string
  model: string
  status: "Verified" | "Partially Verified" | "Suspicious"
  statusReason?: string
  lastVerifiedKm: number
  flaggedCount: number
  ownerName: string
  records: { id: string; km: number; date: string; issuer: string }[]
}

export type TransferRecord = {
  vin: string
  sellerName: string
  buyerName: string
  km: number
  saleDate: string
  sellerSignedAt: string
  buyerSignedAt: string
  txRef: string
  flagged: boolean
}

/* ───────────── Tiny shared store (so Timeline + History update live) ───────────── */

let transfers: TransferRecord[] = []
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => transfers
const addTransfer = (r: TransferRecord) => {
  transfers = [...transfers, r]
  listeners.forEach((l) => l())
}

export function useTransferRecords(vin: string): TransferRecord[] {
  const all = useSyncExternalStore(subscribe, snapshot)
  return all.filter((r) => r.vin === vin)
}

/* ───────────── Helpers ───────────── */

const FEE_LABEL = "Rs. XXX"
const STEPS = ["Seller signed", "Buyer reviewing", "Buyer signed", "Transfer complete"]
const STATUS_LABEL: Record<TransferStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
}

const mask = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((p, i) => (i === 0 ? `${p[0]}***` : `${p[0]}.`))
    .join(" ")

const stamp = () => new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
const randHex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("")
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-")

/* ───────────── Status tracker (reused on both sides) ───────────── */

export function TransferTracker({ done, status }: { done: number; status: TransferStatus }) {
  return (
    <div className="ot-tracker-wrap">
      <div className="ot-tracker-head">
        <b>Transfer status</b>
        <span className={`chip ot-status ${status}`}>{STATUS_LABEL[status]}</span>
      </div>
      <div className="ot-tracker">
        {STEPS.map((s, i) => {
          const complete = i < done
          const current = i === done && status === "pending"
          return (
            <div key={s} className={`ot-step ${complete ? "complete" : ""} ${current ? "current" : ""}`}>
              <span className="ot-dot">{complete ? <Check /> : i + 1}</span>
              <span>{s}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Summary({ v }: { v: TransferVehicle }) {
  return (
    <div className="ot-summary">
      <div>
        <small>VIN</small>
        <b className="tabular">{v.vin}</b>
      </div>
      <div>
        <small>Vehicle</small>
        <b>
          {v.make} {v.model}
        </b>
      </div>
      <div>
        <small>AI status</small>
        <span className={`chip ot-ai ${slug(v.status)}`}>{v.status}</span>
      </div>
      <div>
        <small>Records</small>
        <b>{v.records.length}</b>
      </div>
    </div>
  )
}

/* ───────────── Main flow: Step 1 → Tracker → Step 2 → Payment → Complete ───────────── */

export function OwnershipTransferFlow({
  vehicle,
  back,
  onComplete,
}: {
  vehicle: TransferVehicle
  back: () => void
  onComplete?: (r: TransferRecord) => void
}) {  const [stage, setStage] = useState<"start" | "track" | "buyer" | "pay" | "done">("start")
  const [status, setStatus] = useState<TransferStatus>("pending")
  const [form, setForm] = useState({
    buyerName: "",
    contact: "",
    km: "",
    saleDate: new Date().toISOString().slice(0, 10),
  })
  const [confirmed, setConfirmed] = useState(false)
  const [req, setReq] = useState<{ sellerSignedAt: string; code: string; otp: string } | null>(null)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<TransferRecord | null>(null)
  const [side, setSide] = useState<"buyer" | "seller">("buyer")

  const km = Number(form.km)
  const lowKm = form.km !== "" && km < vehicle.lastVerifiedKm
  const canSign =
    form.buyerName.trim() && form.contact.trim() && km > 0 && form.saleDate && confirmed
  const flaggedWarn = vehicle.status === "Suspicious" || vehicle.flaggedCount > 0
  const reason =
    vehicle.statusReason ||
    (vehicle.status === "Suspicious"
      ? "The history contains a reading that conflicts with an earlier verified reading."
      : vehicle.status === "Partially Verified"
        ? "Some records are not backed by evidence from an approved issuer."
        : "Every record is backed by evidence from an approved issuer and the readings are consistent.")

  const set = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value })

  const sign = () => {
    setReq({
      sellerSignedAt: stamp(),
      code: randHex(8),
      otp: String(Math.floor(100000 + Math.random() * 900000)),
    })
    setStatus("pending")
    setStage("track")
  }

  const pay = () => {
    setPaying(true)
    setTimeout(() => {
      const rec: TransferRecord = {
        vin: vehicle.vin,
        sellerName: vehicle.ownerName,
        buyerName: form.buyerName.trim(),
        km,
        saleDate: form.saleDate,
        sellerSignedAt: req!.sellerSignedAt,
        buyerSignedAt: stamp(),
        txRef: `0x${randHex(40)}`,
        flagged: km < vehicle.lastVerifiedKm,
      }
      addTransfer(rec)
      setResult(rec)
            onComplete?.(rec)
      setStatus("completed")
      setPaying(false)
      setStage("done")
    }, 1200)
  }

  const trackerDone = stage === "done" ? 4 : stage === "pay" ? 2 : 1

  return (
    <div className="tab-content ot">
      {stage !== "done" && (
        <button className="ot-link" onClick={back}>
          <ArrowLeft /> Back to vehicle
        </button>
      )}

      {/* ── Step 1: seller starts the transfer ── */}
      {stage === "start" && (
        <div className="card ot-card">
          <span className="kicker">Ownership transfer · Step 1 of 2</span>
          <h2>Transfer passport to new owner</h2>
          <Summary v={vehicle} />
          <div className="ot-grid">
            <label className="ot-field">
              Buyer name
              <input value={form.buyerName} onChange={set("buyerName")} placeholder="Full name" />
            </label>
            <label className="ot-field">
              Buyer phone or email
              <input value={form.contact} onChange={set("contact")} placeholder="+91… or name@email.com" />
            </label>
            <label className="ot-field">
              Odometer reading at handover (km)
              <input type="number" value={form.km} onChange={set("km")} placeholder="e.g. 72400" />
            </label>
            <label className="ot-field">
              Sale date
              <input type="date" value={form.saleDate} onChange={set("saleDate")} />
            </label>
          </div>
          {lowKm && (
            <div className="ot-alert red">
              <AlertCircle />
              <div>
                <b>Lower than the latest verified reading ({vehicle.lastVerifiedKm.toLocaleString("en-IN")} km).</b>
                <p>This transfer entry will be flagged for review.</p>
              </div>
            </div>
          )}
          <label className="ot-check">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I confirm
            the details above are correct.
          </label>
          <button className="ot-btn" disabled={!canSign} onClick={sign}>
            <Send /> Sign and send transfer request
          </button>
          <p className="ot-note">The new owner will see your full passport before accepting.</p>
        </div>
      )}

      {/* ── Status tracker (seller side) ── */}
      {stage === "track" && req && (
        <div className="card ot-card">
          <span className="kicker">Ownership transfer</span>
          <h2>
            {status === "pending"
              ? `Waiting for ${form.buyerName}`
              : status === "cancelled"
                ? "Transfer request cancelled"
                : "Transfer request expired"}
          </h2>
          <TransferTracker done={1} status={status} />
          {status === "pending" ? (
            <>
              <div className="ot-share">
                <p>
                  Request sent to <b>{form.contact}</b>. Signed by you on {req.sellerSignedAt}. It expires in 7 days.
                </p>
                <div className="ot-codes">
                  <span>
                    <small>Link</small>
                    <code>vehiclepassport.app/t/{req.code}</code>
                  </span>
                  <span>
                    <small>One-time code</small>
                    <code>{req.otp}</code>
                  </span>
                </div>
              </div>
              <div className="ot-actions">
                <button className="ot-btn ghost" onClick={() => setStatus("cancelled")}>
                  Cancel request
                </button>
              </div>
              <div className="ot-demo">
                <span>Demo control: continue as</span>
                <button className="ot-btn small" onClick={() => setStage("buyer")}>
                  Open as buyer
                </button>
                <button className="ot-btn small ghost" onClick={() => setStatus("expired")}>
                  Expire request
                </button>
              </div>
            </>
          ) : (
            <div className="ot-actions">
              <button
                className="ot-btn"
                onClick={() => {
                  setStage("start")
                  setConfirmed(false)
                }}
              >
                Start a new request
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: buyer reviews and accepts ── */}
      {(stage === "buyer" || stage === "pay") && req && (
        <div className="card ot-card">
          <span className="kicker">Ownership transfer · Step 2 of 2</span>
          <h2>Review this passport before accepting</h2>
          <TransferTracker done={trackerDone} status={status} />
          <Summary v={vehicle} />
          {flaggedWarn && (
            <div className="ot-alert yellow">
              <AlertCircle />
              <div>
                <b>This vehicle has flagged records.</b>
                <p>Review them before accepting.</p>
              </div>
            </div>
          )}
          <div className="ot-block">
            <b>Why this status</b>
            <p>{reason}</p>
          </div>
          <div className="ot-block">
            <b>Odometer reading entered by the seller</b>
            <p className="tabular">
              {km.toLocaleString("en-IN")} km on {form.saleDate}
              {lowKm && " · lower than the last verified reading"}
            </p>
          </div>
          <div className="ot-block">
            <b>Timeline preview</b>
            {vehicle.records.slice(-5).map((r) => (
              <div className="ot-mini-row" key={r.id}>
                <Link2 />
                <span>{r.id}</span>
                <span className="tabular">{r.km.toLocaleString("en-IN")} km</span>
                <span>{r.date}</span>
                <span>{r.issuer}</span>
              </div>
            ))}
          </div>
          <div className="ot-fee">
            <div>
              <small>Transfer fee: one-time</small>
              <b>{FEE_LABEL}</b>
            </div>
            <p>Then continue with Passport Plus (monthly).</p>
          </div>

          {stage === "buyer" ? (
            <div className="ot-actions">
              <button className="ot-btn" onClick={() => setStage("pay")}>
                Pay and accept transfer
              </button>
              <button
                className="ot-btn ghost"
                onClick={() => {
                  setStatus("cancelled")
                  setStage("track")
                }}
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="ot-pay">
              <b>Payment (mock)</b>
              <p>
                {FEE_LABEL} · one-time transfer fee for {vehicle.make} {vehicle.model}
              </p>
              <div className="ot-actions">
                <button className="ot-btn" disabled={paying} onClick={pay}>
                  {paying ? "Processing payment…" : "Confirm payment and sign"}
                </button>
                <button className="ot-btn ghost" disabled={paying} onClick={() => setStage("buyer")}>
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Transfer complete ── */}
      {stage === "done" && result && (
        <div className="card ot-card">
          <div className="ot-success">
            <span className="ot-dot big">
              <Check />
            </span>
            <div>
              <span className="kicker">Transfer complete</span>
              <h2>Passport transferred to {result.buyerName}</h2>
            </div>
          </div>
          <TransferTracker done={4} status="completed" />
          <div className="ot-sigs">
            <div>
              <small>Seller signature</small>
              <b>{result.sellerName}</b>
              <span>{result.sellerSignedAt}</span>
            </div>
            <div>
              <small>Buyer signature</small>
              <b>{result.buyerName}</b>
              <span>{result.buyerSignedAt}</span>
            </div>
            <div>
              <small>Transaction reference</small>
              <code>
                {result.txRef.slice(0, 10)}…{result.txRef.slice(-6)}
              </code>
              <span>Simulated</span>
            </div>
          </div>
          <div className="ot-demo">
            <span>Demo control: view as</span>
            <button className={`ot-btn small ${side === "buyer" ? "" : "ghost"}`} onClick={() => setSide("buyer")}>
              Buyer
            </button>
            <button className={`ot-btn small ${side === "seller" ? "" : "ghost"}`} onClick={() => setSide("seller")}>
              Seller
            </button>
          </div>
          {side === "buyer" ? (
            <div className="ot-plus">
              <b>Activate Passport Plus</b>
              <ul>
                <li>Share links for buyers and insurers</li>
                <li>Verified report you can download</li>
                <li>Service and recall reminders</li>
              </ul>
              <button className="ot-btn">Activate Passport Plus</button>
            </div>
          ) : (
            <div className="ot-plus">
              <b>You no longer own this passport.</b>
              <p>Your ownership history is saved.</p>
            </div>
          )}
          <div className="ot-actions">
            <button className="ot-btn ghost" onClick={back}>
              Back to vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────── Timeline rows: render inside your existing timeline/ledger list ───────────── */

export function TransferTimelineEntries({ vin }: { vin: string }) {
  const rows = useTransferRecords(vin)
  return (
    <>
      {rows.map((r) => (
        <div className="ledger-row ot-timeline-row" key={r.txRef}>
          <span className="chain">
            <Link2 />
          </span>
          <b>Ownership transferred</b>
          <span>
            {mask(r.sellerName)} → {mask(r.buyerName)}
          </span>
          <span className="tabular">{r.km.toLocaleString("en-IN")} km at handover</span>
          <span>{r.saleDate}</span>
          <span className="chip signed">
            <Check /> Signed by both parties
          </span>
          {r.flagged && (
            <span className="chip flag">
              <AlertCircle />
              Flagged
            </span>
          )}
        </div>
      ))}
    </>
  )
}

/* ───────────── Ownership history panel (passport page) ───────────── */

export function OwnershipHistoryPanel({
  vin,
  currentOwnerName,
  ownedSince = "Registration",
}: {
  vin: string
  currentOwnerName: string
  ownedSince?: string
}) {
  const rows = useTransferRecords(vin)
  const owners = [
    { name: rows.length ? rows[0].sellerName : currentOwnerName, from: ownedSince, to: rows.length ? rows[0].saleDate : "Present" },
    ...rows.map((r, i) => ({
      name: r.buyerName,
      from: r.saleDate,
      to: rows[i + 1] ? rows[i + 1].saleDate : "Present",
    })),
  ]
  return (
    <div className="card ot-history">
      <span className="kicker">Ownership history</span>
      <div className="ot-owners">
        {owners.map((o, i) => {
          const current = i === owners.length - 1
          return (
            <div className={`ot-owner ${current ? "current" : ""}`} key={`${o.name}-${i}`}>
              <small>{current ? "Current owner" : `Owner ${i + 1}`}</small>
              <b>{mask(o.name)}</b>
              <span>
                {o.from} – {o.to}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
