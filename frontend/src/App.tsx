
import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Fingerprint,
  Gauge,
  GitCompareArrows,
  History,
  Languages,
  Image,
  Info,
  KeyRound,
  Link2,
  LockKeyhole,
  Bookmark,
  Menu,
  QrCode,
  ScanLine,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
  UserCheck,
  UploadCloud,
  UserRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react"
import { analyze, addReadingOnChain, readTimeline, verifyIntegrity } from "./chain"
import { useTimeline } from "./useTimeline"
import { useSigner } from "./useSigner"

type Status = "Verified" | "Partially Verified" | "Suspicious"
type RecordItem = {
  id: string
  date: string
  type: string
  km: number
  issuer: string
  issuerType: string
  evidence: number
  flagged?: string
  notes?: string
}
type Vehicle = {
  key: "A" | "B" | "C"
  name: string
  year: number
  fuel: string
  vin: string
  plate: string
  status: Status
  created: string
  summary: string
  records: RecordItem[]
}

const issuerTypes: Record<string, string> = {
  "Sunrise Hyundai": "Authorised dealer",
  "Metro Maruti": "Authorised dealer",
  "Prime Tata": "Authorised dealer",
  "Raj Auto Works": "Independent garage",
  "SafeGuard General Insurance": "Insurer",
  "TrustCheck Inspections": "Inspection provider",
  "AutoVerify Inspections": "Inspection provider",
}
const makeRecord = (
  id: string,
  date: string,
  type: string,
  km: number,
  issuer: string,
  evidence = 2,
  flagged?: string,
): RecordItem => ({
  id,
  date,
  type,
  km,
  issuer,
  issuerType: issuerTypes[issuer],
  evidence,
  flagged,
  notes: type.includes("Service")
    ? "Routine service completed. Odometer photographed at check-in."
    : "Reading checked and supporting evidence attached.",
})

const vehicles: Vehicle[] = [
  {
    key: "A",
    name: "Hyundai Creta SX",
    year: 2019,
    fuel: "Petrol",
    vin: "MA1ABCDEFGA91742",
    plate: "MH 12 ** 4821",
    status: "Suspicious",
    created: "14 Mar 2019",
    summary:
      "Suspicious. The latest reading (55,310 km) is lower than a verified reading from 2023 (71,800 km). The records are intact; the history itself doesn't add up.",
    records: [
      makeRecord(
        "A-0001",
        "14 Mar 2019",
        "Delivery inspection",
        12,
        "Sunrise Hyundai",
      ),
      makeRecord("A-0002", "02 Oct 2019", "Service", 5900, "Sunrise Hyundai"),
      makeRecord("A-0003", "18 Apr 2020", "Service", 11200, "Sunrise Hyundai"),
      makeRecord(
        "A-0004",
        "11 Jan 2021",
        "Insurance claim · minor rear-bumper and tail-lamp repair",
        20500,
        "SafeGuard General Insurance",
        3,
      ),
      makeRecord(
        "A-0005",
        "03 Feb 2021",
        "Service",
        19900,
        "Raj Auto Works",
        2,
        "Conflicts with other source",
      ),
      makeRecord("A-0006", "08 Mar 2022", "Service", 44300, "Raj Auto Works"),
      makeRecord(
        "A-0007",
        "25 Feb 2023",
        "Resale inspection",
        71800,
        "TrustCheck Inspections",
        3,
      ),
      makeRecord(
        "A-0008",
        "18 Sep 2026",
        "Resale inspection",
        55310,
        "AutoVerify Inspections",
        3,
        "Lower than previous reading",
      ),
    ],
  },
  {
    key: "B",
    name: "Maruti Baleno Delta",
    year: 2020,
    fuel: "Petrol",
    vin: "MA3ABCDEFXC30517",
    plate: "MH 14 ** 1190",
    status: "Partially Verified",
    created: "22 Jun 2020",
    summary:
      "Partially Verified. The records we have are consistent, but a 25-month gap and limited sources mean parts of the history can't be confirmed.",
    records: [
      makeRecord(
        "B-0001",
        "22 Jun 2020",
        "Delivery inspection",
        18,
        "Metro Maruti",
      ),
      makeRecord("B-0002", "15 Dec 2020", "Service", 5400, "Metro Maruti"),
      makeRecord("B-0003", "10 Jun 2021", "Service", 10900, "Metro Maruti"),
      makeRecord("B-0004", "04 Jul 2022", "Service", 24100, "Metro Maruti"),
      makeRecord(
        "B-0005",
        "12 Aug 2024",
        "Resale inspection",
        52600,
        "TrustCheck Inspections",
      ),
    ],
  },
  {
    key: "C",
    name: "Tata Nexon XZ+",
    year: 2021,
    fuel: "Petrol",
    vin: "MATABCDEFXF77203",
    plate: "MH 31 ** 7745",
    status: "Verified",
    created: "20 Nov 2021",
    summary:
      "Verified. 9 records from 4 issuers agree. Mileage rises steadily and no long gaps or conflicts were found.",
    records: [
      makeRecord(
        "C-0001",
        "20 Nov 2021",
        "Delivery inspection",
        9,
        "Prime Tata",
      ),
      makeRecord("C-0002", "15 Apr 2022", "Service", 6100, "Prime Tata"),
      makeRecord("C-0003", "12 Nov 2022", "Service", 12400, "Prime Tata"),
      makeRecord(
        "C-0004",
        "05 Mar 2023",
        "Insurance renewal inspection",
        16700,
        "SafeGuard General Insurance",
      ),
      makeRecord("C-0005", "21 Oct 2023", "Service", 23900, "Raj Auto Works"),
      makeRecord("C-0006", "14 Jun 2024", "Service", 31200, "Prime Tata"),
      makeRecord(
        "C-0007",
        "09 Mar 2025",
        "Inspection",
        40500,
        "TrustCheck Inspections",
      ),
      makeRecord("C-0008", "11 Oct 2025", "Service", 46800, "Prime Tata"),
      makeRecord(
        "C-0009",
        "02 Jul 2026",
        "Resale inspection",
        52300,
        "TrustCheck Inspections",
      ),
    ],
  },
]

const IconForStatus = ({ status }: { status: Status }) =>
  status === "Verified" ? (
    <ShieldCheck size={16} />
  ) : status === "Suspicious" ? (
    <ShieldAlert size={16} />
  ) : (
    <AlertCircle size={16} />
  )
const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`status ${status.toLowerCase().replace(" ", "-")}`}>
    <IconForStatus status={status} />
    {status}
  </span>
)
const Button = ({
  children,
  onClick,
  kind = "primary",
  disabled = false,
  type = "button",
}: any) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`btn ${kind}`}
  >
    {children}
  </button>
)
const PageFooter = () => (
  <footer>
    <span>
      Vehicle Passport shows how well a vehicle's history is supported by
      evidence. It does not replace a physical inspection.
    </span>
    <b>Prototype • simulated data</b>
  </footer>
)

function VehicleIllustration({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div
      className={`vehicle-illustration vehicle-${vehicle.key.toLowerCase()}`}
    >
      <span className="vehicle-label">Vehicle {vehicle.key}</span>
      <svg viewBox="0 0 240 100" aria-label={`${vehicle.name} illustration`}>
        {vehicle.key === "B" ? (
          <path d="M30 64 L47 43 Q58 30 88 28 L150 28 Q171 30 190 50 L211 58 L218 72 L22 72 Z" />
        ) : vehicle.key === "C" ? (
          <path d="M25 66 L41 38 Q49 23 81 21 L159 21 Q181 27 197 51 L216 58 L221 73 L20 73 Z" />
        ) : (
          <path d="M22 65 L39 35 Q49 19 82 18 L165 18 Q188 25 199 52 L219 59 L222 74 L18 74 Z" />
        )}
        <circle cx="62" cy="73" r="16" />
        <circle cx="181" cy="73" r="16" />
        <path
          className="window"
          d="M61 38 Q70 27 91 27 L155 27 L177 49 L52 49 Z"
        />
      </svg>
      <span
        className={`vehicle-seal ${vehicle.status.toLowerCase().replace(" ", "-")}`}
      >
        <IconForStatus status={vehicle.status} />
        {vehicle.status}
      </span>
    </div>
  )
}

function Header({
  role,
  setRole,
  go,
}: {
  role: string
  setRole: (x: string) => void
  go: (x: string) => void
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => setRole("Buyer")}>
        <span className="brandmark">
          <Fingerprint size={22} />
        </span>
        <span>Vehicle Passport</span>
      </button>
      <div className="role-control">
        <span>Demo mode: switch role</span>
        <div className="role-switch">
          {["Buyer", "Owner", "Issuer"].map((r) => (
            <button
              key={r}
              className={role === r ? "active" : ""}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <button className="how-link" onClick={() => go("how")}>
        <Info size={17} /> How it works
      </button>
    </header>
  )
}

function Landing({ open, setRole, go }: any) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <Sparkles size={15} /> Evidence, not guesswork
          </div>
          <h1>
            Know whether a used car's history <em>actually makes sense.</em>
          </h1>
          <p>
            A tamper-evident, multi-source history with evidence you can check.
          </p>
          <div className="hero-actions">
            <Button
              onClick={() => {
                setRole("Buyer")
                go("open")
              }}
            >
              <Search size={18} /> Check a vehicle
            </Button>
            <Button kind="secondary" onClick={() => setRole("Owner")}>
              <Car size={18} /> I'm selling a car
            </Button>
            <Button kind="ghost" onClick={() => setRole("Issuer")}>
              <Stamp size={18} /> I'm an issuer
            </Button>
          </div>
          <div className="trust-note">
            <LockKeyhole size={15} /> Records are tamper-evident—not
            automatically true. We verify issuers, evidence and agreement across
            sources.
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="kicker">Explore the prototype</span>
              <h2>Try a demo vehicle</h2>
            </div>
            <span className="muted">
              Three histories. Three different outcomes.
            </span>
          </div>
          <div className="vehicle-grid">
            {vehicles.map((v) => (
              <button
                className="vehicle-card"
                key={v.key}
                onClick={() => open(v, true)}
              >
                <div className="car-visual">
                  <VehicleIllustration vehicle={v} />
                </div>
                <div className="vehicle-card-body">
                  <StatusBadge status={v.status} />
                  <h3>
                    {v.year} {v.name}
                  </h3>
                  <p>
                    {v.records.length} signed records · VIN ••••••
                    {v.vin.slice(-6)}
                  </p>
                  <span className="open-link">
                    Open passport <ArrowRight size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="steps">
          {[
            [
              Stamp,
              "Issuers sign records",
              "Identity and evidence travel with every entry.",
            ],
            [
              LockKeyhole,
              "Ledger keeps them intact",
              "Changes or deletions become detectable.",
            ],
            [
              Sparkles,
              "Agent investigates",
              "Sources, progression, gaps and conflicts are checked.",
            ],
            [
              ShieldCheck,
              "Buyer sees the evidence",
              "A clear status links back to every record.",
            ],
          ].map(([I, t, d]: any, i) => (
            <div className="step" key={t}>
              <span>{i + 1}</span>
              <I size={22} />
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </section>
      </main>
      <PageFooter />
    </>
  )
}

function OpenPassport({ vehicle, done, openDirect, onBack }: any) {
  const [tab, setTab] = useState("scan")
  const [scan, setScan] = useState("idle")
  const [vin, setVin] = useState("")
  const [error, setError] = useState("")
  const startScan = () => {
    setScan("scanning")
    setTimeout(() => {
      setScan("done")
      setTimeout(done, 350)
    }, 2000)
  }
  const submit = () => {
    const found = vehicles.find((v) =>
      vin.toUpperCase().includes(v.vin.slice(-6)),
    )
    found ? openDirect(found) : setError("No passport found for this VIN")
  }
  return (
    <>
      <main className="narrow page-pad">
        <button className="back" onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </button>
        <div className="page-title">
          <span className="iconbox">
            <ScanLine />
          </span>
          <h1>Open a vehicle passport</h1>
          <p>Scan the seller's QR code or enter a VIN or passport link.</p>
        </div>
        <div className="tabs">
          <button
            className={tab === "scan" ? "active" : ""}
            onClick={() => setTab("scan")}
          >
            <QrCode size={17} /> Scan QR
          </button>
          <button
            className={tab === "paste" ? "active" : ""}
            onClick={() => setTab("paste")}
          >
            <Link2 size={17} /> Paste link / VIN
          </button>
        </div>
        <div className="scan-card">
          {tab === "scan" ? (
            <>
              <div className={`viewfinder ${scan}`}>
                <Camera size={38} />
                <div className="corners" />
                {scan === "scanning" && <div className="scanline" />}
                <span>
                  {scan === "scanning"
                    ? "Scanning…"
                    : "Position a QR code inside the frame"}
                </span>
              </div>
              <Button onClick={startScan} disabled={scan === "scanning"}>
                {scan === "scanning" ? (
                  <>
                    <span className="spinner" /> Checking passport
                  </>
                ) : (
                  <>
                    <ScanLine size={18} /> Start demo scan
                  </>
                )}
              </Button>
              <button className="text-link" onClick={() => setScan("failed")}>
                Preview scan failed state
              </button>
              {scan === "failed" && (
                <div className="inline-error">
                  <XCircle />
                  Scan failed. Make sure the code is clear and try again.
                  <Button kind="secondary" onClick={startScan}>
                    Retry
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <label>
                VIN or passport link
                <input
                  value={vin}
                  onChange={(e) => {
                    setVin(e.target.value)
                    setError("")
                  }}
                  placeholder={`Try ${vehicle.vin.slice(-6)}`}
                />
              </label>
              {error && (
                <p className="field-error">
                  <AlertCircle /> {error}
                </p>
              )}
              <Button onClick={submit}>
                <Search size={18} /> Find passport
              </Button>
              <button
                className="text-link"
                onClick={() =>
                  setError(
                    "This shared link has expired. Ask the owner for a new one.",
                  )
                }
              >
                Preview expired link state
              </button>
            </>
          )}
        </div>
      </main>
      <PageFooter />
    </>
  )
}

const checksFor = (v: Vehicle) => {
  if (v.key === "A")
    return [
      [
        "Source comparison",
        "warning",
        "A small 600 km conflict appears across two sources.",
        "A-0004,A-0005",
      ],
      [
        "Mileage progression",
        "fail",
        "The latest 55,310 km reading is 16,490 km lower than the verified 71,800 km reading.",
        "A-0007,A-0008",
      ],
      [
        "Usage plausibility",
        "fail",
        "Earlier use averaged about 18,000 km a year. At that pace, today's reading should be above 1,00,000 km; this is an estimate.",
        "A-0007,A-0008",
      ],
      [
        "Missing periods",
        "warning",
        "No participating issuer added a record for 43 months before the latest inspection. There was also an 11-month gap in 2022–2023.",
        "A-0006,A-0007,A-0008",
      ],
      [
        "Conflicting evidence",
        "fail",
        "The latest reading contradicts records supplied by three issuers.",
        "A-0004,A-0007,A-0008",
      ],
      [
        "Ownership history",
        "warning",
        "Two recorded owners are visible. The latest transfer is not independently verified.",
        "A-0001,A-0008",
      ],
      [
        "Loan / lien status",
        "warning",
        "No active lien is reported, but no recent lender confirmation is attached.",
        "A-0008",
      ],
      [
        "Accident & insurance claims",
        "warning",
        "One minor rear-bumper and tail-lamp claim is recorded with insurer evidence.",
        "A-0004",
      ],
    ]
  if (v.key === "B")
    return [
      [
        "Source comparison",
        "warning",
        "Only two issuers contributed records, and no insurer record is available.",
        "B-0001,B-0005",
      ],
      [
        "Mileage progression",
        "pass",
        "Readings rise consistently from 18 km to 52,600 km.",
        "B-0001,B-0005",
      ],
      [
        "Usage plausibility",
        "pass",
        "Usage averages about 13,000 km a year and follows the vehicle's earlier pace.",
        "B-0002,B-0005",
      ],
      [
        "Missing periods",
        "warning",
        "There are no participating issuer records for 25 months between July 2022 and August 2024.",
        "B-0004,B-0005",
      ],
      [
        "Conflicting evidence",
        "pass",
        "No submitted records conflict.",
        "B-0005",
      ],
      [
        "Ownership history",
        "pass",
        "One recorded owner is linked to this passport.",
        "B-0001",
      ],
      [
        "Loan / lien status",
        "pass",
        "No active loan or lien is reported in the participating records.",
        "B-0005",
      ],
      [
        "Accident & insurance claims",
        "warning",
        "No claim is recorded, but no insurer has contributed to this passport.",
        "B-0005",
      ],
    ]
  return [
    [
      "Source comparison",
      "pass",
      "Nine records from four issuer types support the history.",
      "C-0001,C-0009",
    ],
    [
      "Mileage progression",
      "pass",
      "Mileage rises steadily from 9 km to 52,300 km.",
      "C-0001,C-0009",
    ],
    [
      "Usage plausibility",
      "pass",
      "Usage averages about 11,000 km a year and matches the vehicle's past pace.",
      "C-0003,C-0009",
    ],
    [
      "Missing periods",
      "pass",
      "No gap between records is longer than 9 months.",
      "C-0007,C-0009",
    ],
    [
      "Conflicting evidence",
      "pass",
      "No submitted records conflict.",
      "C-0009",
    ],
    [
      "Ownership history",
      "pass",
      v.records.some((r) => r.type.includes("Ownership"))
        ? "Two recorded owners are linked by a two-party signed transfer."
        : "One recorded owner is linked to this passport with no conflicting transfer.",
      v.records.some((r) => r.type.includes("Ownership"))
        ? "C-0001,C-0010"
        : "C-0001",
    ],
    [
      "Loan / lien status",
      "pass",
      "No active loan or lien is reported in the participating records.",
      "C-0009",
    ],
    [
      "Accident & insurance claims",
      "pass",
      "No accident claim is on file, and insurer inspection evidence is present.",
      "C-0004,C-0009",
    ],
  ]
}

const hindiSummaries: Record<string, string> = {
  A: "संदिग्ध। नवीनतम रीडिंग (55,310 किमी) 2023 की सत्यापित रीडिंग (71,800 किमी) से कम है। रिकॉर्ड सुरक्षित हैं; लेकिन इतिहास मेल नहीं खाता।",
  B: "आंशिक रूप से सत्यापित। उपलब्ध रिकॉर्ड एक-दूसरे से मेल खाते हैं, लेकिन 25 महीने का अंतर और सीमित स्रोत होने के कारण इतिहास के कुछ हिस्सों की पुष्टि नहीं हो सकती।",
  C: "सत्यापित। 4 जारीकर्ताओं के 9 रिकॉर्ड एक-दूसरे से मेल खाते हैं। माइलेज लगातार बढ़ता है और कोई लंबा अंतर या विरोध नहीं मिला।",
}

const hindiChecks: Record<string, string> = {
  "Source comparison": "अलग-अलग स्रोतों से मिले रिकॉर्ड की तुलना की गई।",
  "Mileage progression": "समय के साथ ओडोमीटर रीडिंग के क्रम की जाँच की गई।",
  "Usage plausibility":
    "वाहन के पिछले उपयोग के आधार पर माइलेज की व्यावहारिकता जाँची गई।",
  "Missing periods": "ऐसे समय खोजे गए जिनमें किसी सहभागी जारीकर्ता का रिकॉर्ड नहीं है।",
  "Conflicting evidence": "एक-दूसरे से मेल न खाने वाले प्रमाणों की जाँच की गई।",
  "Ownership history": "रिकॉर्ड में उपलब्ध मालिकों और हस्तांतरणों की जाँच की गई।",
  "Loan / lien status": "उपलब्ध रिकॉर्ड में ऋण या लियन की स्थिति जाँची गई।",
  "Accident & insurance claims": "दुर्घटना और बीमा दावों के रिकॉर्ड की जाँच की गई।",
}

function Verdict({ v, investigate, language }: any) {
  const isHindi = language === "hi"
  return (
    <div className={`verdict ${v.status.toLowerCase().replace(" ", "-")}`}>
      <div className="guilloche" />
      <div className="verdict-top">
        <span className="tiny-label">INVESTIGATION RESULT</span>
        <StatusBadge status={v.status} />
      </div>
      <h2>{isHindi ? hindiSummaries[v.key] : v.summary}</h2>
      <p>
        <b>{isHindi ? "इसका क्या अर्थ है:" : "What this means:"}</b>{" "}
        {isHindi
          ? v.status === "Verified"
            ? "सहभागी स्रोत एक-दूसरे का समर्थन करते हैं। माइलेज लगातार बढ़ता है और कोई अस्पष्ट अंतर नहीं है।"
            : v.status === "Suspicious"
              ? "निर्णय लेने से पहले सहायक रिकॉर्ड खोलें। विरोध सुरक्षित रखा गया है और स्पष्ट रूप से चिन्हित है।"
              : "उपलब्ध रिकॉर्ड मेल खाते हैं, लेकिन पूरी अवधि या पर्याप्त प्रकार के स्रोत शामिल नहीं हैं।"
          : v.status === "Verified"
            ? "The participating sources support one another, with steady mileage and no unexplained gaps."
            : v.status === "Suspicious"
              ? "Open the supporting records before deciding. A contradiction is preserved and clearly flagged—not hidden or overwritten."
              : "The available records agree, but they do not cover the whole period or enough source types."}
      </p>
      <Button kind="secondary" onClick={investigate}>
        {isHindi ? "यह स्थिति क्यों?" : "Why this status?"}{" "}
        <ArrowRight size={16} />
      </Button>
    </div>
  )
}

function MileageChart({ v, openRecord }: any) {
  const [hovered, setHovered] = useState<any>(null)
  const max = Math.max(...v.records.map((r: RecordItem) => r.km), 1)
  const w = 680,
    h = 240,
    p = 52
  const pts = v.records.map((r: RecordItem, i: number) => ({
    x: p + (i * (w - p * 2)) / Math.max(v.records.length - 1, 1),
    y: h - p - (r.km / max) * (h - p * 2),
    r,
  }))
  const line = pts.map((q: any) => `${q.x},${q.y}`).join(" ")
  return (
    <div className="card chart-card">
      <div className="card-head">
        <div>
          <span className="kicker">Odometer history</span>
          <h2>Mileage over time</h2>
        </div>
        <span className="estimate">
          Estimated from this vehicle's own past usage
        </span>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Mileage chart">
          <defs>
            <pattern
              id="hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M-2 2L2-2M0 8L8 0M6 10L10 6"
                stroke="#d9e2ef"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const value = Math.round((max * (3 - i)) / 3 / 1000) * 1000
            const y = p + i * ((h - p * 2) / 3)
            return (
              <g key={i}>
                <line x1={p} x2={w - p} y1={y} y2={y} className="gridline" />
                <text
                  x={p - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="axis-label"
                >
                  {value.toLocaleString("en-IN")}
                </text>
              </g>
            )
          })}
          <text x="12" y="22" className="axis-title">
            km
          </text>
          {v.key === "A" && (
            <rect
              x={pts[6].x}
              y={p}
              width={pts[7].x - pts[6].x}
              height={h - p * 2}
              fill="url(#hatch)"
            />
          )}
          <path
            d={`M${p} ${h - p - 10} Q${w / 2} ${h / 2 + 15} ${w - p} ${p + 15} L${w - p} ${p + 55} Q${w / 2} ${h / 2 + 55} ${p} ${h - p + 10}Z`}
            className="expected"
          />
          <polyline points={line} className="chartline" />
          {pts.map((q: any, i: number) => (
            <g
              key={q.r.id}
              onClick={() => openRecord(q.r)}
              onMouseEnter={() => setHovered(q)}
              onMouseLeave={() => setHovered(null)}
              className="point"
            >
              {q.r.flagged?.includes("Lower") && (
                <line
                  x1={pts[i - 1].x}
                  y1={pts[i - 1].y}
                  x2={q.x}
                  y2={q.y}
                  className="dropline"
                />
              )}
              <circle
                cx={q.x}
                cy={q.y}
                r={q.r.flagged ? 7 : 5}
                className={
                  q.r.flagged
                    ? "flagged"
                    : q.r.issuerType.includes("dealer")
                      ? "dealer"
                      : "other"
                }
              />
              <title>
                {q.r.date}: {q.r.km.toLocaleString("en-IN")} km · {q.r.issuer}
              </title>
            </g>
          ))}
          {pts.map((q: any, i: number) => {
            const year = q.r.date.slice(-4)
            const previous = i ? pts[i - 1].r.date.slice(-4) : ""
            return year !== previous ? (
              <text
                key={`year-${q.r.id}`}
                x={q.x}
                y={h - 14}
                textAnchor="middle"
                className="axis-label"
              >
                {year}
              </text>
            ) : null
          })}
        </svg>
        {hovered && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hovered.x / w) * 100}%`,
              top: `${Math.max(hovered.y - 24, 8)}px`,
            }}
          >
            <b>{hovered.r.km.toLocaleString("en-IN")} km</b>
            <span>{hovered.r.date}</span>
            <span>{hovered.r.issuer}</span>
            <code>{hovered.r.id}</code>
          </div>
        )}
      </div>
      <div className="legend">
        {v.records.some((r: RecordItem) =>
          r.issuerType?.includes("dealer"),
        ) && (
          <span>
            <i className="dot dealer" />
            Dealer
          </span>
        )}
        {v.records.some(
          (r: RecordItem) => !r.issuerType?.includes("dealer"),
        ) && (
          <span>
            <i className="dot other" />
            Independent / inspection
          </span>
        )}
        {v.records.some((r: RecordItem) => r.flagged?.includes("Lower")) && (
          <span>
            <i className="dot flagged" />
            Lower reading
          </span>
        )}
        {(v.key === "A" || v.key === "B") && (
          <span>
            <i className="hatch" />
            Missing period
          </span>
        )}
      </div>
    </div>
  )
}

function Overview({ v, setTab, openRecord, jump, language, ownerCount }: any) {
  const latest = v.records[v.records.length - 1]
  const verified = v.key === "A" ? v.records[6] : latest
  const displayedOwnerCount = v.key === "A" ? 2 : ownerCount
  return (
    <div className="tab-content">
      <Verdict
        v={v}
        investigate={() => setTab("investigation")}
        language={language}
      />
      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <span className="kicker">Eight evidence checks</span>
              <h2>Checks at a glance</h2>
            </div>
          </div>
          <div className="check-list">
            {checksFor(v).map((c: any) => (
              <button onClick={() => jump(c[0])} key={c[0]}>
                <Severity level={c[1]} />
                <span>
                  <b>{c[0]}</b>
                  <small>{c[2]}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="card facts">
          <span className="kicker">Passport summary</span>
          <h2>Key details</h2>
          <div className="fact-grid">
            <div>
              <small>Latest verified</small>
              <b>{verified.km.toLocaleString("en-IN")} km</b>
            </div>
            {latest !== verified && (
              <div>
                <small>Latest submitted</small>
                <b className="danger-text">
                  {latest.km.toLocaleString("en-IN")} km
                </b>
              </div>
            )}
            <div>
              <small>Records</small>
              <b>{v.records.length}</b>
            </div>
            <div>
              <small>Issuers</small>
              <b>{new Set(v.records.map((r: RecordItem) => r.issuer)).size}</b>
            </div>
            <div>
              <small>Recorded owners</small>
              <b>{displayedOwnerCount}</b>
            </div>
            <div className="wide">
              <small>Accident / major repair records</small>
              <b>
                {v.key === "A" ? "1 minor insurance repair" : "None on file"}
              </b>
              <em>
                “None on file” means none were reported by participating
                issuers.
              </em>
            </div>
          </div>
        </div>
      </div>
      <MileageChart v={v} openRecord={openRecord} />
    </div>
  )
}

function Severity({ level }: { level: string }) {
  return (
    <span className={`severity ${level}`}>
      {level === "pass" ? (
        <CheckCircle2 />
      ) : level === "fail" ? (
        <XCircle />
      ) : (
        <AlertCircle />
      )}
      <b>
        {level === "pass"
          ? "Pass"
          : level === "fail"
            ? "Needs attention"
            : "Warning"}
      </b>
    </span>
  )
}

type TrustTier = 1 | 2 | 3
function TrustTierBadge({ tier }: { tier: TrustTier }) {
  const [open, setOpen] = useState(false)
  const labels = {
    1: ["Tier 1", "Verified Authority"],
    2: ["Tier 2", "Verified Business"],
    3: ["Tier 3", "Self-reported · Unverified"],
  }
  return (
    <span className="tier-wrap">
      <span
        className={`tier-badge tier-${tier}`}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((x) => !x)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            setOpen((x) => !x)
          }
        }}
      >
        {tier === 3 ? <AlertCircle /> : <BadgeCheck />}
        {labels[tier][0]} · {labels[tier][1]}
      </span>
      {open && (
        <span className="tier-popover" onClick={(e) => e.stopPropagation()}>
          <b>Trust tier legend</b>
          <span>
            <i className="tier-dot tier-1" />
            <strong>Tier 1 · Verified Authority</strong>
            <small>OEM, insurer or government</small>
          </span>
          <span>
            <i className="tier-dot tier-2" />
            <strong>Tier 2 · Verified Business</strong>
            <small>Inspection company or verified garage</small>
          </span>
          <span>
            <i className="tier-dot tier-3" />
            <strong>Tier 3 · Self-reported</strong>
            <small>Owner upload · Unverified</small>
          </span>
        </span>
      )}
    </span>
  )
}

function trustTierForRecord(record: RecordItem): TrustTier {
  if (record.issuerType?.includes("ownership")) return 3
  if (
    record.issuerType?.includes("dealer") ||
    record.issuerType === "Insurer" ||
    record.issuerType === "Government"
  )
    return 1
  return 2
}

function Timeline({ v, openRecord, highlight }: any) {
  const [filter, setFilter] = useState("All")
  const [flagged, setFlagged] = useState(false)
  const chainEntries = useTimeline(v.vin)
  const live = (r: RecordItem, idx: number) => {
    const e = chainEntries ? chainEntries[idx] : null
    return e
      ? {
          ...r,
          km: e.km,
          issuer: e.issuer,
          flagged: e.flagged ? "Lower than previous reading" : undefined,
        }
      : r
  }
  const list = [...v.records]
    .map(live)
    .reverse()
    .filter(
      (r) =>
        (filter === "All" || r.type.includes(filter)) &&
        (!flagged || r.flagged),
    )
  return (
    <div className="tab-content">
      <div className="filterbar">
        <div>
          <b>{list.length} records</b>
          <span>Newest first</span>
        </div>
        <div className="filter-chips">
          {["All", "Service", "Inspection", "Insurance", "Ownership"].map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={flagged}
            onChange={(e) => setFlagged(e.target.checked)}
          />
          <span />
          Flagged only
        </label>
      </div>
      {list.length === 0 ? (
        <div className="empty">
          <FileText />
          <h2>No records yet</h2>
          <p>Records matching these filters will appear here.</p>
        </div>
      ) : (
        <div className="timeline">
          {list.map((r, i) => (
            <div key={r.id}>
              <button
                id={r.id}
                className={`record-card ${
                  highlight === r.id ? "highlight" : ""
                }`}
                onClick={() => openRecord(r)}
              >
                <div className="seal">
                  <Stamp size={22} />
                  <small>SIGNED</small>
                </div>
                <div className="record-main">
                  <div className="record-top">
                    <span className="event-icon">
                      {r.type.includes("Ownership") ? (
                        <UserCheck />
                      ) : r.type.includes("Service") ? (
                        <Wrench />
                      ) : r.type.includes("Insurance") ? (
                        <ShieldCheck />
                      ) : (
                        <Gauge />
                      )}
                    </span>
                    <div>
                      <span className="kicker">{r.type}</span>
                      <h3>
                        {r.date} ·{" "}
                        <span className="tabular">
                          {r.km.toLocaleString("en-IN")} km
                        </span>
                      </h3>
                    </div>
                  </div>
                  <p>
                    <b>{r.issuer}</b>
                    <span className="chip">{r.issuerType}</span>
                    <TrustTierBadge tier={trustTierForRecord(r)} />
                  </p>
                  <div className="chips">
                    <span className="chip signed">
                      <BadgeCheck /> Signed • Entry #{r.id}
                    </span>
                    <span className="chip">
                      <Image /> {r.evidence} evidence files
                    </span>
                    {r.flagged && (
                      <span className="chip flag">
                        <AlertCircle />
                        {r.flagged}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight />
              </button>
              {((v.key === "A" && r.id === "A-0008") ||
                (v.key === "B" && r.id === "B-0005")) && (
                <div className="gap">
                  <Clock3 />
                  {v.key === "A" ? "43" : "25"} months, no records
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Investigation({ v, openSupport, language, ownerNote }: any) {
  const [ran, setRan] = useState(false)
  const [action, setAction] = useState<"" | "seller" | "inspection" | "photo">(
    "",
  )
  const [copied, setCopied] = useState(false)
  const isHindi = language === "hi"
  const sellerMessage = `Hi, I'm reviewing the Vehicle Passport for the ${v.year} ${v.name}. Could you please explain the ${
    v.key === "A"
      ? "gap since 2023 and the latest odometer reading"
      : "missing period in the service history"
  }?`
  const [agent, setAgent] = useState<any>(null)
  const [agentError, setAgentError] = useState(false)
  useEffect(() => {
    let cancelled = false
    setRan(false)
    setAgent(null)
    setAgentError(false)
    const minDelay = new Promise((r) => setTimeout(r, 1400))
    Promise.all([analyze(v.vin), minDelay])
      .then(([res]) => {
        if (!cancelled) {
          setAgent(res)
          setRan(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgentError(true)
          setRan(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [v.vin])
  const steps = [
    "Collected records",
    "Compared sources",
    "Checked mileage progression",
    "Checked usage plausibility",
    "Looked for missing periods",
    "Reviewed conflicting evidence",
    "Checked ownership history",
    "Checked loan / lien status",
    "Reviewed claims",
    "Result",
  ]
  return (
    <div className="tab-content">
      <div className="agent-card">
        <div className="agent-head">
          <span>
            <Sparkles />
          </span>
          <div>
            <span className="kicker">AI Investigation Agent</span>
            <h2>
              {ran ? "Investigation complete" : "Reviewing the evidence…"}
            </h2>
          </div>
        </div>
        <div className="agent-steps">
          {steps.map((s, i) => (
            <div className={ran || i < 3 ? "done" : ""} key={s}>
              <span>
                {ran || i < 3 ? (
                  <Check size={13} />
                ) : i === 3 ? (
                  <span className="spinner" />
                ) : null}
              </span>
              <small>{s}</small>
            </div>
          ))}
        </div>
      </div>
      {agent && (
        <div
          style={{
            border: "1px solid #d7dde8",
            borderRadius: 12,
            padding: 16,
            margin: "16px 0",
            background: "#fff",
          }}
        >
          <span className="kicker">Live check · read from the contract</span>
          <h3 style={{ margin: "6px 0" }}>{agent.status}</h3>
          <p>{agent.explanation}</p>
          <ul>
            {agent.findings.map((f: string) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {agentError && (
        <p>Couldn't reach the agent server. Is it running on port 3001?</p>
      )}
      <div className="findings">
        <div className="section-heading">
          <div>
            <span className="kicker">
              {isHindi ? "यह स्थिति क्यों?" : "Why this status?"}
            </span>
            <h2>
              {isHindi ? "आठ जाँच, सरल भाषा में" : "Eight checks, explained"}
            </h2>
          </div>
        </div>
        {checksFor(v).map((c: any) => (
          <article
            id={`finding-${c[0].replaceAll(" ", "-")}`}
            className="finding"
            key={c[0]}
          >
            <Severity level={c[1]} />
            <div>
              <h3>
                {isHindi
                  ? {
                      "Source comparison": "स्रोतों की तुलना",
                      "Mileage progression": "माइलेज का क्रम",
                      "Usage plausibility": "उपयोग की व्यावहारिकता",
                      "Missing periods": "रिकॉर्ड में अंतर",
                      "Conflicting evidence": "विरोधी प्रमाण",
                      "Ownership history": "मालिकाना इतिहास",
                      "Loan / lien status": "ऋण / लियन स्थिति",
                      "Accident & insurance claims": "दुर्घटना और बीमा दावे",
                    }[c[0]]
                  : c[0]}
              </h3>
              <p>{isHindi ? hindiChecks[c[0]] : c[2]}</p>
              {ownerNote && v.key === "A" && c[0] === "Mileage progression" && (
                <div className="owner-note">
                  <UserRound />
                  <div>
                    <b>Owner's note, not verified by an issuer</b>
                    <p>
                      <strong>{ownerNote.reason}:</strong> {ownerNote.text}
                    </p>
                    {ownerNote.document && (
                      <span>
                        <FileText />
                        {ownerNote.document}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <small>{isHindi ? "सहायक रिकॉर्ड" : "Supporting records"}</small>
              <div className="support">
                {c[3].split(",").map((id: string) => (
                  <button key={id} onClick={() => openSupport(id)}>
                    <FileCheck2 />
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="result-card">
        <StatusBadge status={v.status} />
        <h3>{isHindi ? "आप क्या कर सकते हैं" : "What you can do"}</h3>
        <div className="investigation-actions">
          <Button kind="secondary" onClick={() => setAction("seller")}>
            <Send /> Ask the seller
          </Button>
          <Button kind="secondary" onClick={() => setAction("inspection")}>
            <Search /> Request independent inspection
          </Button>
          {v.key === "A" && (
            <Button kind="secondary" onClick={() => setAction("photo")}>
              <Image /> View dashboard photo (A-0008)
            </Button>
          )}
        </div>
      </div>
      <p className="explained">
        <Info />
        {isHindi
          ? "कोई अंक नहीं—हर निष्कर्ष ऐसे रिकॉर्ड से जुड़ा है जिसे आप खोल सकते हैं।"
          : "Explained, not scored. Every conclusion points to records you can open."}
      </p>
      {action && (
        <div
          className="overlay modal-overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setAction("")}
        >
          <div className="action-modal">
            <div className="drawer-head">
              <div>
                <span className="kicker">NEXT STEP</span>
                <h2>
                  {action === "seller"
                    ? "Ask the seller"
                    : action === "inspection"
                      ? "Independent inspection partners"
                      : "Evidence · A-0008"}
                </h2>
              </div>
              <button onClick={() => setAction("")}>
                <X />
              </button>
            </div>
            {action === "seller" && (
              <>
                <label>
                  Prefilled message
                  <textarea value={sellerMessage} readOnly />
                </label>
                <div className="modal-actions">
                  <Button
                    kind="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(sellerMessage)
                      setCopied(true)
                    }}
                  >
                    <Copy />
                    {copied ? "Copied" : "Copy message"}
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(sellerMessage)}`,
                        "_blank",
                      )
                    }
                  >
                    <Send />
                    Share on WhatsApp
                  </Button>
                </div>
              </>
            )}
            {action === "inspection" && (
              <div className="partner-list">
                {[
                  [
                    "TrustCheck Inspections",
                    "Next slot: Tomorrow, 10:30",
                    "₹1,499",
                  ],
                  [
                    "AutoVerify Inspections",
                    "Next slot: Friday, 14:00",
                    "₹1,299",
                  ],
                ].map((p) => (
                  <article key={p[0]}>
                    <span>
                      <BadgeCheck />
                    </span>
                    <div>
                      <b>{p[0]}</b>
                      <small>{p[1]}</small>
                    </div>
                    <strong>{p[2]}</strong>
                    <Button onClick={() => setAction("")}>Select</Button>
                  </article>
                ))}
              </div>
            )}
            {action === "photo" && (
              <>
                <div className="evidence-photo">
                  <Gauge />
                  <b>55,310</b>
                  <span>km</span>
                </div>
                <div className="evidence-meta">
                  <p>
                    <b>Signed by</b>
                    <span>AutoVerify Inspections</span>
                  </p>
                  <p>
                    <b>Content hash</b>
                    <HashCopy
                      full="0x84bd591ec67a9205fda1d3367f21fa"
                      short="0x84bd...21fa"
                    />
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function HashCopy({ full, short }: { full: string; short: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="hash-copy" title={full}>
      <code>{short}</code>
      <button
        aria-label="Copy full hash"
        onClick={() => {
          navigator.clipboard?.writeText(full)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
      >
        {copied ? <Check /> : <Copy />}
      </button>
    </span>
  )
}

function Proof({ v, setTab }: any) {
  const [state, setState] = useState("idle")
   const entries = useTimeline(v.vin)
     const [report, setReport] = useState<any>(null)
    const verify = () => {
    setState("checking")
    verifyIntegrity(v.vin)
      .then((r) => { setReport(r); setState("done") })
      .catch(() => setState("idle"))
  }
  return (
    <div className="tab-content">
      <div className="integrity card">
        <span className={`integrity-icon ${state}`}>
          <Fingerprint />
        </span>
        <div>
          <span className="kicker">Tamper-evidence check</span>
          <h2>
            {state === "done"
              ? `All ${entries ? entries.length : v.records.length} entries are intact.`
              : "Verify this passport's integrity"}
          </h2>
          <p>
  {state === "done"
    ? report
      ? `Contract rules replayed: ${report.flagOk}/${report.total} flags match. Evidence hashes recomputed: ${report.hashOk}/${report.total} match.`
      : "No record has been altered or deleted."
    : "Recalculate every content hash and follow the chain from first entry to latest."}
</p>
        </div>
        <Button onClick={verify} disabled={state === "checking"}>
          {state === "checking" ? (
            <>
              <span className="spinner" /> Verifying entries…
            </>
          ) : state === "done" ? (
            <>
              <Check /> Integrity verified
            </>
          ) : (
            <>
              <Fingerprint /> Verify integrity
            </>
          )}
        </Button>
      </div>
      {v.key === "A" && (
        <div className="nuance">
          <AlertCircle />
          <div>
            <b>Intact does not mean consistent.</b>
            <p>
              The records are unchanged, but the history itself contains a
              contradiction.
            </p>
          </div>
          <button onClick={() => setTab("investigation")}>
            See Investigation <ArrowRight />
          </button>
        </div>
      )}
      <div className="card ledger">
        <div className="card-head">
          <div>
            <span className="kicker">
              {entries ? "Live ledger · read from the chain" : "Demo ledger (simulated)"}
            </span>
                        <h2>Append-only record chain</h2>
          </div>
        </div>
        {entries ? (
          entries.map((e: any) => (
            <div className="ledger-row" key={e.index}>
              <span className="chain">
                <Link2 />
              </span>
              <b>#{e.index + 1}</b>
              <HashCopy
                full={e.evidenceHash}
                short={`${e.evidenceHash.slice(0, 6)}...${e.evidenceHash.slice(-4)}`}
              />
              <span className="tabular">{e.km.toLocaleString("en-IN")} km</span>
              <span>{e.issuer}</span>
              {e.flagged && (
                <span className="chip flag">
                  <AlertCircle />
                  Flagged
                </span>
              )}
            </div>
          ))
        ) : v.records.map((r: RecordItem, i: number) => {          const fullHash = `0x${(r.id.charCodeAt(0) * 9281 + i * 771).toString(16).padEnd(62, "a")}${(r.km % 65535).toString(16).padStart(4, "0")}`
          const previousHash = i
            ? `0x${(v.records[i - 1].id.charCodeAt(0) * 9281 + (i - 1) * 771).toString(16).padEnd(62, "b")}`
            : "Genesis"
          return (
            <div className="ledger-row" key={r.id}>
              <span className="chain">
                <Link2 />
              </span>
              <b>{r.id}</b>
              <HashCopy
                full={fullHash}
                short={`${fullHash.slice(0, 6)}...${fullHash.slice(-4)}`}
              />
              {i ? (
                <HashCopy
                  full={previousHash}
                  short={`Prev: ${previousHash.slice(0, 6)}…`}
                />
              ) : (
                <small>Prev: Genesis</small>
              )}
              <span>{r.date}, 10:30 UTC</span>
              <span>{r.issuer}</span>
            </div>
          )
        })}
      </div>
      <div className="why-card">
        <div>
          <span className="kicker">Why blockchain?</span>
          <h2>Integrity is one layer of trust</h2>
          <p>
            Blockchain makes alteration detectable. It does not prove a reading
            is true. Trust comes from issuer identity, supporting evidence and
            cross-source checks.
          </p>
        </div>
        <div className="layer-stack">
          {[
            "Issuer trust",
            "Supporting evidence",
            "Tamper-evident ledger",
            "Cross-source AI checks",
          ].map((x, i) => (
            <span key={x}>
              <b>0{i + 1}</b>
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecordDrawer({
  record,
  close,
}: {
  record: RecordItem
  close: () => void
}) {
  const [lightbox, setLightbox] = useState(false)
  const [verify, setVerify] = useState("idle")
  const fullHash = `0x${(record.km * 17).toString(16).padEnd(58, "c")}${record.id.replace("-", "").toLowerCase()}`
  const hash = `${fullHash.slice(0, 6)}...${fullHash.slice(-6)}`
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <span className="kicker">Signed record · {record.id}</span>
            <h2>{record.type}</h2>
          </div>
          <button onClick={close}>
            <X />
          </button>
        </div>
        {record.flagged && (
          <div className="drawer-alert">
            <AlertCircle />
            <div>
              <b>{record.flagged}</b>
              <p>The entry is preserved and visible while it is reviewed.</p>
            </div>
          </div>
        )}
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{record.date}</dd>
          </div>
          <div>
            <dt>Odometer</dt>
            <dd className="tabular">{record.km.toLocaleString("en-IN")} km</dd>
          </div>
          <div>
            <dt>Issuer</dt>
            <dd>
              {record.issuer}
              <span className="verified-issuer">
                <BadgeCheck />
                Verified issuer
              </span>
              <small>
                ID ISS-
                {record.issuer === "AutoVerify Inspections" ? "2087" : "1042"}
              </small>
            </dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{record.notes}</dd>
          </div>
        </dl>
        <div className="evidence">
          <span className="kicker">Evidence · {record.evidence} files</span>
          <div className="evidence-grid">
            <button
              onClick={() => setLightbox(true)}
              className="dashboard-photo"
            >
              <small>DASHBOARD PHOTO</small>
              <b>{record.km.toLocaleString("en-IN")}</b>
              <span>km</span>
              <Gauge />
            </button>
            <button onClick={() => setLightbox(true)} className="invoice">
              <FileText />
              <b>Service invoice</b>
              <small>PDF · verified upload</small>
            </button>
          </div>
        </div>
        <div className="provenance">
          <span className="kicker">Provenance</span>
          <p>
            <b>Entry ID</b>
            <code>{record.id}</code>
          </p>
          <p>
            <b>Content hash</b>
            <HashCopy full={fullHash} short={hash} />
          </p>
          <p>
            <b>Previous hash</b>
            <HashCopy
              full="0x7b2e411ac930f4d881177f0cf3842900275e682c3a410ca22198813d91a4"
              short="0x7b2e...91a4"
            />
          </p>
          <p>
            <b>Timestamp</b>
            <span>{record.date}, 10:30:00 UTC</span>
          </p>
          <p>
            <b>Signature</b>
            <span>Signed by {record.issuer}</span>
          </p>
        </div>
        <Button
          onClick={() => {
            setVerify("checking")
            setTimeout(() => setVerify("done"), 1200)
          }}
          disabled={verify === "checking"}
        >
          {verify === "done" ? (
            <>
              <CheckCircle2 /> Hash matches · entry intact
            </>
          ) : verify === "checking" ? (
            <>
              <span className="spinner" /> Recalculating hash…
            </>
          ) : (
            <>
              <Fingerprint /> Verify this entry
            </>
          )}
        </Button>
        {record.flagged?.includes("Correction") && (
          <div className="correction-pair">
            <div>
              <small>Original (preserved)</small>
              <b>{record.km.toLocaleString("en-IN")} km</b>
            </div>
            <div>
              <small>Correction</small>
              <b>Under verification</b>
            </div>
          </div>
        )}
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(false)}>
            <button>
              <X />
            </button>
            <div className="big-dashboard">
              <Gauge />
              <b>{record.km.toLocaleString("en-IN")}</b>
              <span>km</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function downloadVehicleReport(v: Vehicle) {
  const lines = [
    "Vehicle Passport",
    `${v.year} ${v.name}`,
    v.summary,
    `Latest verified: ${(v.key === "A" ? 71800 : v.records.filter((r) => !r.flagged).at(-1)!.km).toLocaleString("en-IN")} km`,
    `Records: ${v.records.length}`,
  ]
  const text = lines
    .join("  |  ")
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/[()\\]/g, "\\$&")
  const stream = `BT /F1 14 Tf 50 760 Td (${text}) Tj ET`
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ]
  let pdf = "%PDF-1.4\n",
    offsets = [0]
  objects.forEach((o) => {
    offsets.push(pdf.length)
    pdf += o + "\n"
  })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((x) => String(x).padStart(10, "0") + " 00000 n ")
    .join("\n")}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `vehicle-passport-${v.key}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function Passport({
  v,
  initialTab,
  onOpen,
  setSelected,
  ownerCount = 1,
  onBack,
  ownerNote,
}: any) {
  const [tab, setTab] = useState(initialTab || "overview")
  const [record, setRecord] = useState<RecordItem | null>(null)
  const [highlight, setHighlight] = useState("")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [shortlisted, setShortlisted] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareKeys, setCompareKeys] = useState<string[]>([v.key])
  const support = (id: string) => {
    setTab("timeline")
    setHighlight(id)
    setTimeout(
      () =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80,
    )
  }
  const jump = (name: string) => {
    setTab("investigation")
    setTimeout(
      () =>
        document
          .getElementById(`finding-${name.replaceAll(" ", "-")}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80,
    )
  }
  return (
    <>
      <main className="passport-shell">
        <button className="back page-back" onClick={onBack}>
          <ArrowLeft size={17} /> Back
        </button>
        <section className="passport-head">
          <div>
            <span className="kicker">DIGITAL VEHICLE PASSPORT</span>
            <h1>
              {v.year} {v.name}
            </h1>
            <p>
              {v.fuel} · {v.plate} · VIN ••••••{v.vin.slice(-6)}
            </p>
          </div>
          <div className="passport-meta">
            <span>
              <b>{v.records.length}</b> records
            </span>
            <span>
              <b>{new Set(v.records.map((r: RecordItem) => r.issuer)).size}</b>{" "}
              issuers
            </span>
            <span>
              Created <b>{v.created}</b>
            </span>
          </div>
          <div className="language-toggle" aria-label="Language">
            <Languages size={16} />
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button
              className={language === "hi" ? "active" : ""}
              onClick={() => setLanguage("hi")}
            >
              हिंदी
            </button>
          </div>
        </section>
        <div className="buyer-actions">
          <Button kind="secondary" onClick={() => downloadVehicleReport(v)}>
            <Download />
            Download report (PDF)
          </Button>
          <Button kind="secondary" onClick={() => setShortlisted((x) => !x)}>
            <Bookmark />
            {shortlisted ? "Saved to shortlist" : "Save to shortlist"}
          </Button>
          <Button kind="secondary" onClick={() => setCompareOpen(true)}>
            <GitCompareArrows />
            Compare
          </Button>
        </div>
        <div className="passport-tabs">
          {[
            ["overview", "Overview"],
            ["timeline", "Timeline"],
            ["investigation", "Investigation"],
            ["proof", "Proof"],
          ].map(([id, label]) => (
            <button
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <Overview
            v={v}
            setTab={setTab}
            openRecord={setRecord}
            jump={jump}
            language={language}
            ownerCount={ownerCount}
          />
        )}
        {tab === "timeline" && (
          <Timeline v={v} openRecord={setRecord} highlight={highlight} />
        )}
        {tab === "investigation" && (
          <Investigation
            v={v}
            openSupport={support}
            language={language}
            ownerNote={ownerNote}
          />
        )}
        {tab === "proof" && <Proof v={v} setTab={setTab} />}
      </main>
      {record && <RecordDrawer record={record} close={() => setRecord(null)} />}
      {compareOpen && (
        <div
          className="overlay modal-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setCompareOpen(false)
          }
        >
          <div className="action-modal compare-modal">
            <div className="drawer-head">
              <div>
                <span className="kicker">COMPARE UP TO 3</span>
                <h2>Vehicle comparison</h2>
              </div>
              <button onClick={() => setCompareOpen(false)}>
                <X />
              </button>
            </div>
            <div className="compare-picker">
              {vehicles.map((car) => (
                <label key={car.key}>
                  <input
                    type="checkbox"
                    checked={compareKeys.includes(car.key)}
                    disabled={
                      !compareKeys.includes(car.key) && compareKeys.length === 3
                    }
                    onChange={(e) =>
                      setCompareKeys((keys) =>
                        e.target.checked
                          ? [...keys, car.key]
                          : keys.filter((k) => k !== car.key),
                      )
                    }
                  />
                  {car.name}
                </label>
              ))}
            </div>
            <div className="compare-grid">
              {vehicles
                .filter((car) => compareKeys.includes(car.key))
                .map((car) => {
                  const checks = checksFor(car)
                  const latest =
                    car.key === "A" ? 71800 : car.records.at(-1)!.km
                  return (
                    <article key={car.key}>
                      <StatusBadge status={car.status} />
                      <h3>{car.name}</h3>
                      <p>
                        <small>Checks passed</small>
                        <b>
                          {checks.filter((c) => c[1] === "pass").length} of 8
                        </b>
                      </p>
                      <p>
                        <small>Latest verified</small>
                        <b>{latest.toLocaleString("en-IN")} km</b>
                      </p>
                      <p>
                        <small>Longest gap</small>
                        <b>
                          {car.key === "A"
                            ? "43 months"
                            : car.key === "B"
                              ? "25 months"
                              : "No gap over 9 months"}
                        </b>
                      </p>
                    </article>
                  )
                })}
            </div>
          </div>
        </div>
      )}
      <PageFooter />
    </>
  )
}

function OwnershipTransfer({
  vehicle,
  complete,
  cancel,
}: {
  vehicle: Vehicle
  complete: () => void
  cancel: () => void
}) {
  const [step, setStep] = useState(1)
  const [buyer, setBuyer] = useState("Meera Shah")
  const [signing, setSigning] = useState(false)
  const sign = () => {
    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      if (step === 2) complete()
      else setStep(2)
    }, 900)
  }
  return (
    <main className="owner-shell page-pad transfer-page">
      <button className="back" onClick={cancel}>
        <ArrowLeft /> Back to my vehicles
      </button>
      <div className="transfer-title">
        <span className="kicker">DUAL-SIGNATURE TRANSFER</span>
        <h1>Sell this vehicle</h1>
        <p>
          Both people sign the same transfer. The passport keeps a permanent
          ownership event without exposing private identity details to buyers.
        </p>
      </div>
      <div className="vehicle-found">
        <Car />
        <div>
          <StatusBadge status={vehicle.status} />
          <h3>
            {vehicle.year} {vehicle.name}
          </h3>
          <p>
            {vehicle.plate} · VIN ••••••{vehicle.vin.slice(-6)}
          </p>
        </div>
      </div>
      <div className="dual-sign card">
        <div className="signature-progress">
          <div className={step > 1 ? "done" : "active"}>
            <span>{step > 1 ? <Check /> : "1"}</span>
            <b>Seller signs</b>
            <small>Aarav · current owner</small>
          </div>
          <div className={step === 2 ? "active" : ""}>
            <span>2</span>
            <b>Buyer signs</b>
            <small>{buyer || "New owner"}</small>
          </div>
        </div>
        {step === 1 ? (
          <div className="signature-panel">
            <UserCheck />
            <h2>Confirm as seller</h2>
            <p>
              I confirm that I am transferring this vehicle passport to the
              buyer named below.
            </p>
            <label>
              Buyer's name
              <input value={buyer} onChange={(e) => setBuyer(e.target.value)} />
            </label>
            <Button disabled={!buyer || signing} onClick={sign}>
              {signing ? <span className="spinner" /> : <KeyRound />}
              Sign as Aarav
            </Button>
          </div>
        ) : (
          <div className="signature-panel">
            <UserCheck />
            <h2>Buyer confirmation</h2>
            <p>
              {buyer}, confirm receipt of the vehicle and its complete digital
              passport.
            </p>
            <div className="signed-by">
              <CheckCircle2 />
              Seller signature verified · Aarav
            </div>
            <Button disabled={signing} onClick={sign}>
              {signing ? <span className="spinner" /> : <KeyRound />}
              Sign as {buyer}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

function Owner({
  openBuyer,
  onTransfer,
  openRoadmap,
  transferredVehicle,
  ownerNote,
  onOwnerNote,
}: any) {
  const [share, setShare] = useState<Vehicle | null>(null)
  const [transfer, setTransfer] = useState<Vehicle | null>(null)
  const [request, setRequest] = useState("idle")
  const [hidden, setHidden] = useState(true)
  const [photos, setPhotos] = useState(true)
  const [toast, setToast] = useState("")
  const [explainOpen, setExplainOpen] = useState(false)
  const [reason, setReason] = useState("Instrument cluster replaced")
  const [explanation, setExplanation] = useState("")
  const [explanationDoc, setExplanationDoc] = useState("")
  const [revoked, setRevoked] = useState(false)
  const copy = () => {
    setToast("Passport link copied")
    setTimeout(() => setToast(""), 1800)
  }
  if (transfer) {
    return (
      <>
        <OwnershipTransfer
          vehicle={transfer}
          cancel={() => setTransfer(null)}
          complete={() => {
            onTransfer(transfer)
            setTransfer(null)
            setToast(
              `Transferred to Meera Shah · ${transfer.name} timeline updated`,
            )
          }}
        />
        <PageFooter />
      </>
    )
  }
  return (
    <>
      <main className="owner-shell page-pad">
        <div className="owner-welcome">
          <div>
            <span className="kicker">OWNER PORTAL</span>
            <h1>Good morning, Aarav</h1>
            <p>Manage and share your vehicle passports.</p>
          </div>
          <span className="avatar">
            <UserRound />
          </span>
        </div>
        <div className="flagged-owner-card card">
          <span>
            <ShieldAlert />
          </span>
          <div>
            <span className="kicker">FLAGGED RECORD · VEHICLE A</span>
            <h2>55,310 km needs context</h2>
            <p>
              {ownerNote
                ? "Your explanation is visible to buyers as an unverified owner note."
                : "Add context for buyers without changing the signed record."}
            </p>
          </div>
          <Button kind="secondary" onClick={() => setExplainOpen(true)}>
            {ownerNote ? "Edit explanation" : "Add explanation"}
          </Button>
        </div>
        <div className="section-heading">
          <div>
            <h2>My vehicles</h2>
          </div>
          <span>2 vehicles</span>
        </div>
        <div className="owner-vehicles">
          {[vehicles[2], vehicles[1]].map((v) => (
            <article
              className={`owner-card ${
                transferredVehicle === v.key ? "transferred" : ""
              }`}
              key={v.key}
            >
              <div className="car-thumb">
                <Car />
              </div>
              <div>
                {transferredVehicle === v.key ? (
                  <span className="status transferred-label">
                    <UserCheck />
                    Transferred to Meera Shah
                  </span>
                ) : (
                  <StatusBadge status={v.status} />
                )}
                <h2>
                  {v.year} {v.name}
                </h2>
                <p>
                  {v.plate} · {v.records.length} signed records
                </p>
              </div>
              {transferredVehicle === v.key ? (
                <div className="owner-actions">
                  <Button
                    kind="secondary"
                    onClick={() => openBuyer(v, "timeline")}
                  >
                    <History />
                    View transfer in timeline
                  </Button>
                </div>
              ) : (
                <div className="owner-actions">
                  <Button
                    onClick={() => {
                      setRevoked(false)
                      setShare(v)
                    }}
                  >
                    <Share2 />
                    Share passport
                  </Button>
                  <Button kind="secondary" onClick={() => setTransfer(v)}>
                    <KeyRound />
                    Sell this vehicle
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="strengthen">
          <span>
            <Sparkles />
          </span>
          <div>
            <span className="kicker">Strengthen your passport</span>
            <h2>25 months have no records.</h2>
            <p>Ask an issuer to add a signed entry for your Maruti Baleno.</p>
            {request === "sent" && (
              <span className="pending">
                <Clock3 />
                Request pending · sent to Metro Maruti
              </span>
            )}
          </div>
          <Button
            kind="secondary"
            onClick={() => setRequest(request === "idle" ? "pick" : "sent")}
          >
            {request === "idle"
              ? "Request a record"
              : request === "pick"
                ? "Send to Metro Maruti"
                : "Request sent"}
          </Button>
        </div>
        <div className="reminders card">
          <div className="card-head">
            <div>
              <span className="kicker">REMINDERS</span>
              <h2>Keep records up to date</h2>
            </div>
            <Button kind="secondary" onClick={() => setRequest("pick")}>
              <Send />
              Request a record
            </Button>
          </div>
          <div className="reminder-grid">
            {[
              ["Insurance renewal", "18 Oct 2026", "Due in 28 days"],
              ["PUC certificate", "04 Nov 2026", "Due in 45 days"],
              ["Scheduled service", "At 55,000 km", "2,700 km remaining"],
            ].map((item) => (
              <div key={item[0]}>
                <Clock3 />
                <span>
                  <b>{item[0]}</b>
                  <small>{item[1]}</small>
                </span>
                <em>{item[2]}</em>
              </div>
            ))}
          </div>
        </div>
        <button className="roadmap-banner" onClick={openRoadmap}>
          <span>
            <Bell />
          </span>
          <div>
            <span className="kicker">COMING NEXT · ROADMAP</span>
            <h2>Safety recall alerts for the current owner</h2>
            <p>Preview notifications, dealer booking and recall clearance.</p>
          </div>
          <ChevronRight />
        </button>
        {share && (
          <div className="overlay">
            <aside className="share-sheet">
              <div className="drawer-head">
                <div>
                  <span className="kicker">SHARE PASSPORT</span>
                  <h2>{share.name}</h2>
                </div>
                <button onClick={() => setShare(null)}>
                  <X />
                </button>
              </div>
              <button
                className="qr"
                onClick={() => openBuyer(share)}
                disabled={revoked}
                aria-label="Open shared passport as buyer"
              >
                <QrCode />
                <span>
                  VEHICLE
                  <br />
                  PASSPORT
                </span>
              </button>
              <p className={`share-link ${revoked ? "revoked" : ""}`}>
                {revoked
                  ? "Link revoked"
                  : `vehiclepassport.demo/${share.vin.slice(-6).toLowerCase()}`}{" "}
                <button onClick={copy}>
                  <Copy />
                </button>
              </p>
              <div className="share-options">
                <label>
                  <span>
                    <b>Hide registration number</b>
                    <small>Buyers see {share.plate.slice(0, 5)} ** ****</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                  />
                </label>
                <label>
                  <span>
                    <b>Include evidence photos</b>
                    <small>Documents remain protected</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={photos}
                    onChange={(e) => setPhotos(e.target.checked)}
                  />
                </label>
                <label>
                  <span>
                    <b>Link expiry</b>
                    <small>Control how long this link works</small>
                  </span>
                  <select>
                    <option>24 hours</option>
                    <option>7 days</option>
                    <option>30 days</option>
                  </select>
                </label>
              </div>
              <div className="share-actions">
                <Button onClick={copy} disabled={revoked}>
                  <Copy />
                  Copy link
                </Button>
                <Button
                  kind="secondary"
                  disabled={revoked}
                  onClick={() => setToast("Share options opened · simulated")}
                >
                  <Share2 />
                  Share
                </Button>
              </div>
              <Button
                kind="secondary"
                onClick={() => {
                  setRevoked(true)
                  setToast("Shared link revoked")
                }}
              >
                <XCircle />
                Revoke link
              </Button>
              <Button
                kind="ghost"
                disabled={revoked}
                onClick={() => openBuyer(share)}
              >
                Preview what buyers see <ArrowRight />
              </Button>
              <div className="access-log">
                <span>
                  <History />
                  Access log
                </span>
                {[
                  ["2 hours ago", "Buyer · shared link"],
                  ["Yesterday, 18:42", "Buyer · QR scan"],
                  ["12 Sep, 09:14", "Owner preview"],
                ].map((row) => (
                  <p key={row[0]}>
                    <b>{row[0]}</b>
                    <small>{row[1]}</small>
                  </p>
                ))}
              </div>
            </aside>
          </div>
        )}
        {explainOpen && (
          <div className="overlay modal-overlay">
            <div className="action-modal">
              <div className="drawer-head">
                <div>
                  <span className="kicker">OWNER RESPONSE</span>
                  <h2>Add explanation</h2>
                </div>
                <button onClick={() => setExplainOpen(false)}>
                  <X />
                </button>
              </div>
              <label>
                Reason
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option>Instrument cluster replaced</option>
                  <option>Data-entry error</option>
                  <option>Vehicle used off-road</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Explanation
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain what happened in your own words…"
                />
              </label>
              <button
                className={`upload ${explanationDoc ? "complete" : ""}`}
                onClick={() =>
                  setExplanationDoc("instrument-cluster-invoice.pdf")
                }
              >
                <UploadCloud />
                <b>{explanationDoc || "Optional document upload"}</b>
                <span>
                  {explanationDoc ? "Attached · simulated" : "PDF or image"}
                </span>
              </button>
              <div className="modal-actions">
                <Button kind="secondary" onClick={() => setExplainOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!explanation}
                  onClick={() => {
                    onOwnerNote({
                      reason,
                      text: explanation,
                      document: explanationDoc,
                    })
                    setExplainOpen(false)
                    setToast("Owner explanation added for buyers")
                  }}
                >
                  Save explanation
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      {toast && (
        <div className="toast">
          <CheckCircle2 />
          {toast}
        </div>
      )}
      <PageFooter />
    </>
  )
}

function Issuer({ selected, viewTimeline, onRecordAdded }: any) {
  const [screen, setScreen] = useState("dashboard")
    const signerName = useSigner()
  const [step, setStep] = useState(1)
  const [vehicle, setVehicle] = useState<Vehicle>(selected)
  const [km, setKm] = useState("")
  const [type, setType] = useState("Odometer reading")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")
  const [evidence, setEvidence] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [signing, setSigning] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [txError, setTxError] = useState("")
  const [result, setResult] = useState("")
  const [correction, setCorrection] = useState("form")
  const [outcome, setOutcome] = useState("Under verification")
  const [recordSearch, setRecordSearch] = useState("")
  const [apiVisible, setApiVisible] = useState(false)
  const [bulkReady, setBulkReady] = useState(false)
  const [bulkSubmitted, setBulkSubmitted] = useState(false)
  const [selectedIssuer, setSelectedIssuer] = useState<any>(null)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [licenceUploaded, setLicenceUploaded] = useState(false)
  const [ownerIdUploaded, setOwnerIdUploaded] = useState(false)
  const [issuerRows, setIssuerRows] = useState([
    {
      name: "Hyundai Authorised Network",
      type: "OEM",
      tier: 1 as TrustTier,
      status: "Approved",
      branches: 42,
    },
    {
      name: "ICICI Lombard",
      type: "Insurer",
      tier: 1 as TrustTier,
      status: "Approved",
      branches: 1,
    },
    {
      name: "RTO Pune",
      type: "Government",
      tier: 1 as TrustTier,
      status: "Approved",
      branches: 1,
    },
    {
      name: "Bosch Car Service",
      type: "Inspection Company",
      tier: 2 as TrustTier,
      status: "Approved",
      branches: 12,
    },
    {
      name: "Sharma Auto Works",
      type: "Independent Garage",
      tier: 2 as TrustTier,
      status: "Approved",
      branches: 1,
    },
    {
      name: "Raj Motors",
      type: "Independent Garage",
      tier: 2 as TrustTier,
      status: "Pending",
      branches: 1,
    },
  ])
  const [correctionItems, setCorrectionItems] = useState([
    ["COR-019", "Honda City ZX", "Data-entry error", "Pending"],
    ["COR-020", "Mahindra XUV700", "Instrument cluster replaced", "Pending"],
  ])
  const [recentRecords, setRecentRecords] = useState([
    ["AV-0184", "Hyundai Creta SX", "18 Sep 2026", "55,310 km", "Flagged"],
    ["AV-0183", "Tata Nexon XZ+", "02 Jul 2026", "52,300 km", "Accepted"],
    ["AV-0182", "Maruti Baleno Delta", "12 Aug 2024", "52,600 km", "Accepted"],
    [
      "AV-0181",
      "Honda City ZX",
      "24 Jun 2026",
      "41,220 km",
      "Correction pending",
    ],
  ])
  const latest = vehicle.key === "A" ? 71800 : vehicle.records.at(-1)!.km
  const resetWizard = () => {
    setStep(1)
    setVehicle(selected)
    setKm("")
    setType("Odometer reading")
    setDate(new Date().toISOString().slice(0, 10))
    setNotes("")
    setEvidence(false)
    setConfirm(false)
    setSigning(false)
    setResult("")
    setCorrection("form")
    setOutcome("Under verification")
  }
  const openAdd = () => {
    resetWizard()
    setScreen("add")
  }
  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"
    const submit = async () => {
    setTxError("")
    setTxHash("")
    setSigning(true)
    try {
      const evidenceText = `${vehicle.vin}|${type}|${km}|${date}|dashboard-photo.jpg`
      const hash = await addReadingOnChain(vehicle.vin, Number(km), evidenceText)
      setTxHash(hash)

      // Let the chain decide whether it is flagged
      const rows = await readTimeline(vehicle.vin)
      const flagged = !!rows[rows.length - 1]?.flagged

      const entryId = `AV-${String(185 + recentRecords.length - 4).padStart(4, "0")}`
      setResult(flagged ? "flagged" : "accepted")
      setRecentRecords((r) => [
        [
          entryId,
          vehicle.name,
          formattedDate,
          `${Number(km).toLocaleString("en-IN")} km`,
          flagged ? "Flagged" : "Accepted",
        ],
        ...r,
      ])
      const newRecord = makeRecord(
        entryId,
        formattedDate,
        type,
        Number(km),
        "Sunrise Hyundai",
        1,
        flagged ? "Lower than previous reading" : undefined,
      )
      newRecord.notes = notes || "Signed entry submitted by Sunrise Hyundai."
      onRecordAdded?.(vehicle, newRecord)
    } catch (err: any) {
      const msg =
        err?.code === "ACTION_REJECTED"
          ? "You rejected the request in MetaMask."
          : err?.reason ||
            err?.shortMessage ||
            err?.info?.error?.message ||
            err?.message ||
            "Transaction failed."
      setTxError(String(msg))
    } finally {
      setSigning(false)
    }
  }
  const dashboard = (
    <>
      <div className="issuer-title">
        <div>
          <span className="kicker">ISSUER CONSOLE</span>
          <h1>Records dashboard</h1>
          <p>Signed entries submitted by your organisation.</p>
        </div>
        <Button onClick={openAdd}>
          <FileCheck2 />
          Add record
        </Button>
      </div>
      <div className="stats">
        <div>
          <span>
            <FileText />
          </span>
          <small>Records added</small>
          <b>{184 + Math.max(0, recentRecords.length - 4)}</b>
          <em>+12 this month</em>
        </div>
        <div>
          <span className="warn">
            <AlertCircle />
          </span>
          <small>Flagged this month</small>
          <b>3</b>
          <em>Needs review</em>
        </div>
        <div>
          <span>
            <Clock3 />
          </span>
          <small>Pending corrections</small>
          <b>2</b>
          <em>Awaiting verification</em>
        </div>
      </div>
      <div className="card table-card">
        <div className="card-head">
          <div>
            <h2>Recent records</h2>
            <span className="muted">Latest signed submissions</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Reading</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map((r) => (
              <tr key={r[0]}>
                {r.map((x, i) => (
                  <td key={x}>
                    {i === 4 ? (
                      <span
                        className={`table-status ${x.toLowerCase().replace(" ", "-")}`}
                      >
                        {x === "Accepted" ? <CheckCircle2 /> : <AlertCircle />}
                        {x}
                      </span>
                    ) : (
                      x
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="api-panel card">
        <span>
          <KeyRound />
        </span>
        <div>
          <span className="kicker">API ACCESS</span>
          <h2>Issuer integration key</h2>
          <p>
            Use this simulated key to submit signed records from an inspection
            system.
          </p>
          <code>
            {apiVisible ? "vp_demo_iss2087_8f31c92a" : "vp_demo_••••••••••••"}
          </code>
        </div>
        <div>
          <Button kind="secondary" onClick={() => setApiVisible((x) => !x)}>
            {apiVisible ? "Hide key" : "Reveal key"}
          </Button>
          <Button
            kind="ghost"
            onClick={() =>
              navigator.clipboard?.writeText("vp_demo_iss2087_8f31c92a")
            }
          >
            <Copy />
            Copy
          </Button>
        </div>
      </div>
    </>
  )
  const allRecords = (
    <>
      <div className="issuer-title">
        <div>
          <span className="kicker">ISSUER CONSOLE</span>
          <h1>All records</h1>
          <p>Search signed submissions by entry, vehicle or status.</p>
        </div>
      </div>
      <div className="record-search">
        <Search />
        <input
          value={recordSearch}
          onChange={(e) => setRecordSearch(e.target.value)}
          placeholder="Search records…"
        />
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Reading</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords
              .filter((r) =>
                r.join(" ").toLowerCase().includes(recordSearch.toLowerCase()),
              )
              .map((r) => (
                <tr key={r[0]}>
                  {r.map((x, i) => (
                    <td key={`${r[0]}-${i}`}>
                      {i === 4 ? (
                        <span
                          className={`table-status ${x.toLowerCase().replace(" ", "-")}`}
                        >
                          {x === "Accepted" ? (
                            <CheckCircle2 />
                          ) : (
                            <AlertCircle />
                          )}
                          {x}
                        </span>
                      ) : (
                        x
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
  const correctionsPage = (
    <>
      <div className="issuer-title">
        <div>
          <span className="kicker">ISSUER CONSOLE</span>
          <h1>Corrections</h1>
          <p>
            Review evidence without deleting or overwriting the original entry.
          </p>
        </div>
      </div>
      <div className="correction-list">
        {correctionItems.map((item, index) => (
          <article className="card" key={item[0]}>
            <div>
              <span
                className={`chip ${item[3] === "Accepted" ? "signed" : "flag"}`}
              >
                {item[3] === "Accepted" ? (
                  <CheckCircle2 />
                ) : item[3] === "Rejected" ? (
                  <XCircle />
                ) : (
                  <AlertCircle />
                )}
                {item[3]}
              </span>
              <h2>{item[1]}</h2>
              <p>
                <b>{item[0]}</b> · {item[2]}
              </p>
              <small>
                Original entry and replacement evidence are both preserved.
              </small>
            </div>
            {item[3] === "Pending" && (
              <div>
                <Button
                  kind="secondary"
                  onClick={() =>
                    setCorrectionItems((items) =>
                      items.map((x, i) =>
                        i === index ? [...x.slice(0, 3), "Rejected"] : x,
                      ),
                    )
                  }
                >
                  Reject
                </Button>
                <Button
                  onClick={() =>
                    setCorrectionItems((items) =>
                      items.map((x, i) =>
                        i === index ? [...x.slice(0, 3), "Accepted"] : x,
                      ),
                    )
                  }
                >
                  Accept
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  )
  const bulkPage = (
    <>
      <div className="issuer-title">
        <div>
          <span className="kicker">ISSUER CONSOLE</span>
          <h1>Bulk upload (CSV)</h1>
          <p>Validate multiple records before signing and appending them.</p>
        </div>
      </div>
      {!bulkReady ? (
        <button
          className="upload bulk-upload"
          onClick={() => setBulkReady(true)}
        >
          <UploadCloud />
          <b>Choose CSV file</b>
          <span>Use demo-records.csv to preview validation</span>
        </button>
      ) : (
        <div className="card table-card bulk-preview">
          <div className="card-head">
            <div>
              <span className="kicker">VALIDATION PREVIEW</span>
              <h2>demo-records.csv · 3 rows</h2>
            </div>
            <span className="status verified">
              <CheckCircle2 />
              Ready to submit
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>VIN</th>
                <th>Date</th>
                <th>Odometer</th>
                <th>Validation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>••••••F77203</td>
                <td>18 Sep 2026</td>
                <td>54,120 km</td>
                <td>
                  <span className="chip signed">
                    <Check />
                    Valid
                  </span>
                </td>
              </tr>
              <tr>
                <td>2</td>
                <td>••••••C30517</td>
                <td>18 Sep 2026</td>
                <td>58,940 km</td>
                <td>
                  <span className="chip signed">
                    <Check />
                    Valid
                  </span>
                </td>
              </tr>
              <tr>
                <td>3</td>
                <td>••••••A91742</td>
                <td>18 Sep 2026</td>
                <td>54,900 km</td>
                <td>
                  <span className="chip flag">
                    <AlertCircle />
                    Will be flagged
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="bulk-actions">
            <Button
              kind="secondary"
              onClick={() => {
                setBulkReady(false)
                setBulkSubmitted(false)
              }}
            >
              Choose another file
            </Button>
            <Button onClick={() => setBulkSubmitted(true)}>
              <KeyRound />
              Sign and submit 3 records
            </Button>
          </div>
          {bulkSubmitted && (
            <div className="inline-success">
              <CheckCircle2 />3 records signed and submitted. One was appended
              with a review flag.
            </div>
          )}
        </div>
      )}
    </>
  )
  const updateIssuerStatus = (name: string, status: string) =>
    setIssuerRows((rows) =>
      rows.map((row) => (row.name === name ? { ...row, status } : row)),
    )
  const approvedIssuersPage = (
    <>
      <div className="issuer-title">
        <div>
          <span className="kicker">PLATFORM ADMIN</span>
          <h1>Approved Issuers</h1>
          <p>Review organisations that can sign Vehicle Passport records.</p>
        </div>
        <Button
          onClick={() => {
            setApplicationSubmitted(false)
            setScreen("apply-issuer")
          }}
        >
          <Stamp /> Apply to become an issuer
        </Button>
      </div>
      <div className="issuer-hierarchy card">
        <div>
          <span>
            <ShieldCheck />
          </span>
          <b>Platform Admin</b>
        </div>
        <ArrowRight />
        <div>
          <span>
            <Stamp />
          </span>
          <b>Organisation</b>
        </div>
        <ArrowRight />
        <div>
          <span>
            <Wrench />
          </span>
          <b>Branch / Workshop</b>
        </div>
        <p>We approve organisations. Organisations add their own branches.</p>
      </div>
      <div className="card table-card issuer-admin-table">
        <table>
          <thead>
            <tr>
              <th>Issuer name</th>
              <th>Type</th>
              <th>Trust Tier</th>
              <th>Status</th>
              <th>Branches count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issuerRows.map((row) => (
              <tr key={row.name}>
                <td>
                  <b>{row.name}</b>
                </td>
                <td>{row.type}</td>
                <td>
                  <TrustTierBadge tier={row.tier} />
                </td>
                <td>
                  <span className={`table-status ${row.status.toLowerCase()}`}>
                    {row.status === "Approved" ? (
                      <CheckCircle2 />
                    ) : (
                      <AlertCircle />
                    )}
                    {row.status}
                  </span>
                </td>
                <td>
                  {row.branches} {row.branches === 1 ? "branch" : "branches"}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      kind="secondary"
                      onClick={() => setSelectedIssuer(row)}
                    >
                      View
                    </Button>
                    {row.status === "Pending" && (
                      <>
                        <Button
                          onClick={() =>
                            updateIssuerStatus(row.name, "Approved")
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          kind="ghost"
                          onClick={() =>
                            updateIssuerStatus(row.name, "Suspended")
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
  const issuerApplicationPage = (
    <>
      <button className="back" onClick={() => setScreen("issuers")}>
        <ArrowLeft />
        Back to approved issuers
      </button>
      <div className="issuer-title">
        <div>
          <span className="kicker">ISSUER ONBOARDING</span>
          <h1>Apply to become an issuer</h1>
          <p>Submit your organisation for platform-admin verification.</p>
        </div>
      </div>
      {applicationSubmitted ? (
        <div className="submission-result accepted issuer-application-success">
          <span>
            <ShieldCheck />
          </span>
          <span className="application-status">
            <Clock3 />
            Pending verification
          </span>
          <h1>Application submitted.</h1>
          <p>
            Status: <b>Pending verification.</b>
          </p>
          <div className="application-tracker">
            <span className="done">
              <i>
                <Check />
              </i>
              <b>Submitted</b>
            </span>
            <span className="active">
              <i>2</i>
              <b>Under review</b>
            </span>
            <span>
              <i>3</i>
              <b>Approved</b>
            </span>
          </div>
          <Button kind="secondary" onClick={() => setScreen("issuers")}>
            Return to approved issuers
          </Button>
        </div>
      ) : (
        <form
          className="wizard card issuer-application"
          onSubmit={(e) => {
            e.preventDefault()
            setApplicationSubmitted(true)
          }}
        >
          <div className="form-grid">
            <label>
              Business name
              <input required placeholder="Organisation name" />
            </label>
            <label>
              Business type
              <select required defaultValue="">
                <option value="" disabled>
                  Select type
                </option>
                <option>OEM</option>
                <option>Insurer</option>
                <option>Inspection Company</option>
                <option>Independent Garage</option>
                <option>Government</option>
              </select>
            </label>
            <label>
              GST number
              <input required placeholder="27ABCDE1234F1Z5" />
            </label>
            <label>
              City
              <input required placeholder="Pune" />
            </label>
            <label>
              Contact email
              <input
                required
                type="email"
                placeholder="operations@business.in"
              />
            </label>
            <label>
              Contact phone
              <input required type="tel" placeholder="+91 98765 43210" />
            </label>
            <label className="full">
              Wallet / ID for signing records <small>Optional</small>
              <input placeholder="0x… or signing identity" />
            </label>
          </div>
          <div className="application-uploads">
            <button
              type="button"
              className={`upload ${licenceUploaded ? "complete" : ""}`}
              onClick={() => setLicenceUploaded(true)}
            >
              <UploadCloud />
              <b>
                {licenceUploaded
                  ? "business-licence.pdf"
                  : "Business licence upload"}
              </b>
              <span>
                {licenceUploaded
                  ? "Attached · simulated"
                  : "PDF or image required"}
              </span>
            </button>
            <button
              type="button"
              className={`upload ${ownerIdUploaded ? "complete" : ""}`}
              onClick={() => setOwnerIdUploaded(true)}
            >
              <UploadCloud />
              <b>{ownerIdUploaded ? "owner-id.pdf" : "Owner ID upload"}</b>
              <span>
                {ownerIdUploaded
                  ? "Attached · simulated"
                  : "PDF or image required"}
              </span>
            </button>
          </div>
          <div className="application-tracker">
            <span className="active">
              <i>1</i>
              <b>Submitted</b>
            </span>
            <span>
              <i>2</i>
              <b>Under review</b>
            </span>
            <span>
              <i>3</i>
              <b>Approved</b>
            </span>
          </div>
          <Button type="submit" disabled={!licenceUploaded || !ownerIdUploaded}>
            <Send />
            Submit application
          </Button>
        </form>
      )}
    </>
  )
  return (
    <>
      <main className="issuer-layout">
        <aside className="issuer-side">
          <div className="brand">
            <span className="brandmark">
              <Fingerprint />
            </span>
            <span>Vehicle Passport</span>
          </div>
          <div className="issuer-persona">
            <span>AV</span>
            <div>
              <b>{signerName}</b>
              <small>
                <BadgeCheck />
                Verified Issuer · ID ISS-2087
              </small>
            </div>
          </div>
          <nav>
            <button
              className={screen === "dashboard" ? "active" : ""}
              onClick={() => {
                if (screen !== "dashboard") resetWizard()
                setScreen("dashboard")
              }}
            >
              <Gauge />
              Dashboard
            </button>
            <button
              className={screen === "add" ? "active" : ""}
              onClick={openAdd}
            >
              <FileCheck2 />
              Add record
            </button>
            <button
              className={screen === "records" ? "active" : ""}
              onClick={() => {
                if (screen !== "records") resetWizard()
                setScreen("records")
              }}
            >
              <History />
              All records
            </button>
            <button
              className={screen === "corrections" ? "active" : ""}
              onClick={() => {
                if (screen !== "corrections") resetWizard()
                setScreen("corrections")
              }}
            >
              <ClipboardCheck />
              Corrections
            </button>
            <button
              className={screen === "bulk" ? "active" : ""}
              onClick={() => {
                resetWizard()
                setScreen("bulk")
              }}
            >
              <UploadCloud />
              Bulk upload (CSV)
            </button>
            <button
              className={screen === "issuers" ? "active" : ""}
              onClick={() => {
                resetWizard()
                setScreen("issuers")
              }}
            >
              <ShieldCheck />
              Approved issuers
            </button>
            <button
              className={screen === "apply-issuer" ? "active" : ""}
              onClick={() => {
                resetWizard()
                setApplicationSubmitted(false)
                setScreen("apply-issuer")
              }}
            >
              <UserCheck />
              Apply as issuer
            </button>
          </nav>
          <div className="side-note">
            <LockKeyhole />
            <b>Signing securely</b>
            <p>
              Your issuer key signs each record before it reaches the ledger.
            </p>
          </div>
        </aside>
        <section className="issuer-content">
          {screen === "dashboard" ? (
            dashboard
          ) : screen === "records" ? (
            allRecords
          ) : screen === "corrections" ? (
            correctionsPage
          ) : screen === "bulk" ? (
            bulkPage
          ) : screen === "issuers" ? (
            approvedIssuersPage
          ) : screen === "apply-issuer" ? (
            issuerApplicationPage
          ) : (
            <>
              <button
                className="back"
                onClick={() => {
                  resetWizard()
                  setScreen("dashboard")
                }}
              >
                <ArrowLeft />
                Back to dashboard
              </button>
              <div className="issuer-title">
                <div>
                  <span className="kicker">NEW SIGNED ENTRY</span>
                  <h1>Add a vehicle record</h1>
                </div>
              </div>
              {!result && screen !== "correction" && (
                <>
                  <div className="wizard-steps">
                    {["Vehicle", "Details", "Review & sign"].map((s, i) => (
                      <div className={step >= i + 1 ? "active" : ""} key={s}>
                        <span>{step > i + 1 ? <Check /> : i + 1}</span>
                        <b>{s}</b>
                      </div>
                    ))}
                  </div>
                  <div className="wizard card">
                    {step === 1 && (
                      <div>
                        <span className="kicker">STEP 1 OF 3</span>
                        <h2>Find the vehicle</h2>
                        <label>
                          Vehicle VIN
                          <select
                            value={vehicle.key}
                            onChange={(e) => {
                              setVehicle(
                                vehicles.find((v) => v.key === e.target.value)!,
                              )
                              setKm("")
                              setType("Odometer reading")
                              setDate(new Date().toISOString().slice(0, 10))
                              setNotes("")
                              setEvidence(false)
                              setConfirm(false)
                            }}
                          >
                            {vehicles.map((v) => (
                              <option value={v.key} key={v.key}>
                                {v.vin} · {v.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="vehicle-found">
                          <Car />
                          <div>
                            <StatusBadge status={vehicle.status} />
                            <h3>
                              {vehicle.year} {vehicle.name}
                            </h3>
                            <p>VIN ••••••{vehicle.vin.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="latest-read">
                          <small>Latest verified reading</small>
                          <b>{latest.toLocaleString("en-IN")} km</b>
                          <span>
                            {vehicle.key === "A"
                              ? "25 Feb 2023 · TrustCheck Inspections"
                              : vehicle.records.at(-1)!.date +
                                " · " +
                                vehicle.records.at(-1)!.issuer}
                          </span>
                          <div className="mini-line">
                            {vehicle.records.slice(-5).map((r, i) => (
                              <i
                                key={r.id}
                                style={{ height: `${20 + i * 11}px` }}
                              >
                                <small>{r.km.toLocaleString("en-IN")}</small>
                              </i>
                            ))}
                          </div>
                        </div>
                        <Button onClick={() => setStep(2)}>
                          Continue <ArrowRight />
                        </Button>
                      </div>
                    )}
                    {step === 2 && (
                      <div>
                        <span className="kicker">STEP 2 OF 3</span>
                        <h2>Record details</h2>
                        <div className="form-grid">
                          <label>
                            Record type
                            <select
                              value={type}
                              onChange={(e) => setType(e.target.value)}
                            >
                              <option>Odometer reading</option>
                              <option>Service</option>
                              <option>Inspection</option>
                              <option>Accident / major repair</option>
                              <option>Resale inspection</option>
                            </select>
                          </label>
                          <label>
                            Date
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                            />
                          </label>
                          <label>
                            Odometer (km)
                            <input
                              className="tabular"
                              type="number"
                              value={km}
                              onChange={(e) => setKm(e.target.value)}
                            />
                          </label>
                          <label className="full">
                            Notes
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes about this record…"
                            />
                          </label>
                        </div>
                        {km && Number(km) < latest && (
                          <div className="prewarn live-warning">
                            <AlertCircle />
                            <span>
                              <b>
                                Lower than the latest verified reading (
                                {latest.toLocaleString("en-IN")} km).
                              </b>
                              <p>This record will be flagged for review.</p>
                            </span>
                          </div>
                        )}
                        <button
                          className={`upload ${evidence ? "complete" : ""}`}
                          onClick={() => setEvidence(true)}
                        >
                          <UploadCloud />
                          <b>
                            {evidence
                              ? "dashboard-photo.jpg attached"
                              : "Drop evidence here or browse"}
                          </b>
                          <span>
                            {evidence
                              ? "2.4 MB · Ready to sign"
                              : "Dashboard photo required for odometer readings"}
                          </span>
                        </button>
                        <div className="wizard-actions">
                          <Button kind="secondary" onClick={() => setStep(1)}>
                            Back
                          </Button>
                          <Button
                            disabled={!evidence || !km || !date}
                            onClick={() => setStep(3)}
                          >
                            Review record <ArrowRight />
                          </Button>
                        </div>
                        {(!evidence || !km) && (
                          <p className="review-helper">
                            {!km
                              ? "Enter an odometer reading to continue"
                              : "Add a dashboard photo to continue"}
                          </p>
                        )}
                      </div>
                    )}
                    {step === 3 && (
                      <div>
                        <span className="kicker">STEP 3 OF 3</span>
                        <h2>Review and sign</h2>
                        <div className="review-grid">
                          <p>
                            <small>Vehicle</small>
                            <b>
                              {vehicle.year} {vehicle.name}
                            </b>
                          </p>
                          <p>
                            <small>Record</small>
                            <b>{type}</b>
                          </p>
                          <p>
                            <small>Date</small>
                            <b>{formattedDate}</b>
                          </p>
                          <p>
                            <small>Odometer</small>
                            <b>{Number(km).toLocaleString("en-IN")} km</b>
                          </p>
                          <p>
                            <small>Evidence</small>
                            <b>dashboard-photo.jpg</b>
                          </p>
                          <p>
                            <small>Signer</small>
                            <b>{signerName}</b>
                          </p>
                        </div>
                        {Number(km) < latest && (
                          <div className="prewarn">
                            <AlertCircle />
                            <span>
                              <b>
                                This reading is lower than the latest verified
                                reading.
                              </b>
                              <p>
                                It will be appended and flagged. The earlier
                                record will not be changed.
                              </p>
                            </span>
                          </div>
                        )}
                        <label className="confirm">
                          <input
                            type="checkbox"
                            checked={confirm}
                            onChange={(e) => setConfirm(e.target.checked)}
                          />
                          I confirm this record is accurate and the evidence is
                          authentic.
                        </label>
                        <div className="wizard-actions">
                          <Button kind="secondary" onClick={() => setStep(2)}>
                            Back
                          </Button>
                          <Button
                            disabled={!confirm || signing}
                            onClick={submit}
                          >
                            {signing ? (
                              <>
                                <span className="spinner" />
                                Signing record…
                              </>
                            ) : (
                              <>
                                <KeyRound />
                                Sign with issuer key
                              </>
                            )}
                          </Button>
                        </div>
                        {txError && (
                          <p style={{ color: "#dc2626", marginTop: 12 }}>
                            {txError}
                          </p>
                        )}
                        {signing && (
                          <div className="signing-flow">
                            {[
                              "Hashing evidence",
                              `Signing as ${signerName}`,
                              "Appending to ledger",
                              "Confirmed",
                            ].map((s, i) => (
                              <span
                                key={s}
                                style={{ animationDelay: `${i * 0.45}s` }}
                              >
                                <Check />
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {result && screen !== "correction" && (
                <div className={`submission-result ${result}`}>
                  <span>
                    {result === "flagged" ? <ShieldAlert /> : <ShieldCheck />}
                  </span>
                  <StatusBadge
                    status={result === "flagged" ? "Suspicious" : "Verified"}
                  />
                  <h1>
                    {result === "flagged"
                      ? "Inconsistency flagged"
                      : "Record accepted"}
                  </h1>
                  {result === "flagged" ? (
                    <p>
                      Entry {recentRecords[0][0]} was appended and flagged.{" "}
                      <b>{Number(km).toLocaleString("en-IN")} km</b> is lower
                      than the latest verified reading of{" "}
                      <b>{latest.toLocaleString("en-IN")} km</b> (
                      {vehicle.key === "A"
                        ? "25 Feb 2023 · TrustCheck Inspections"
                        : `${vehicle.records.at(-1)!.date} · ${vehicle.records.at(-1)!.issuer}`}
                      ). The earlier record has not been changed.
                    </p>
                  ) : (
                                      <p>
                      Entry {recentRecords[0][0]} was signed and appended with
                      hash {txHash.slice(0, 10)}...{txHash.slice(-6)}.
                    </p>
                  )}
                  {txHash && (
                    <p>
                      On-chain transaction: {txHash.slice(0, 10)}...
                      {txHash.slice(-6)}
                    </p>
                  )}
                  <div>
                    <Button
                      kind="secondary"
                      onClick={() => {
                        setResult("")
                        setStep(2)
                      }}
                    >
                      Review reading
                    </Button>
                    {result === "flagged" ? (
                      <Button onClick={() => setScreen("correction")}>
                        Start correction request <ArrowRight />
                      </Button>
                    ) : (
                      <Button onClick={() => viewTimeline(vehicle)}>
                        View updated timeline
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {screen === "correction" && (
                <div className="correction-screen card">
                  <span className="kicker">CORRECTION & VERIFICATION</span>
                  <h2>Request a linked correction</h2>
                  <div className="preserved">
                    <AlertCircle />
                    <div>
                      <small>
                        Original (preserved) · {recentRecords[0][0]}
                      </small>
                      <b>{Number(km).toLocaleString("en-IN")} km</b>
                      <p>
                        This signed entry stays visible and cannot be
                        overwritten.
                      </p>
                    </div>
                  </div>
                  {correction === "form" ? (
                    <>
                      <label>
                        Reason
                        <select>
                          <option>Instrument cluster replaced</option>
                          <option>Data-entry error</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <label>
                        Explanation
                        <textarea
                          placeholder="Explain why this reading needs correction…"
                          defaultValue="Instrument cluster was replaced after an electrical fault. Replacement invoice attached."
                        />
                      </label>
                      <button className="upload complete">
                        <UploadCloud />
                        <b>cluster-replacement-invoice.pdf</b>
                        <span>Evidence attached</span>
                      </button>
                      <Button onClick={() => setCorrection("tracking")}>
                        <Send />
                        Submit for verification
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="correction-tracker">
                        {["Submitted", "Under verification", outcome].map(
                          (x, i) => (
                            <span
                              className={
                                i < 2 || outcome !== "Under verification"
                                  ? "done"
                                  : ""
                              }
                              key={i}
                            >
                              <i>{i < 2 ? <Check /> : 3}</i>
                              <b>{x}</b>
                            </span>
                          ),
                        )}
                      </div>
                      <div className="demo-control">
                        <small>Demo control: show outcome</small>
                        <Button
                          kind="secondary"
                          onClick={() => setOutcome("Approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          kind="ghost"
                          onClick={() => setOutcome("Rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                      {outcome !== "Under verification" && (
                        <div className={`outcome ${outcome.toLowerCase()}`}>
                          {outcome === "Approved" ? (
                            <CheckCircle2 />
                          ) : (
                            <XCircle />
                          )}
                          <div>
                            <b>Correction {outcome.toLowerCase()}</b>
                            <p>
                              {outcome === "Approved"
                                ? "A correction is now linked. The original remains preserved and visible."
                                : "The original entry remains flagged and preserved."}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      {selectedIssuer && (
        <div
          className="overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setSelectedIssuer(null)
          }
        >
          <aside className="drawer issuer-detail-drawer">
            <div className="drawer-head">
              <div>
                <span className="kicker">APPROVED ORGANISATION</span>
                <h2>{selectedIssuer.name}</h2>
              </div>
              <button onClick={() => setSelectedIssuer(null)}>
                <X />
              </button>
            </div>
            <div className="issuer-detail-summary">
              <TrustTierBadge tier={selectedIssuer.tier} />
              <span
                className={`table-status ${selectedIssuer.status.toLowerCase()}`}
              >
                {selectedIssuer.status === "Approved" ? (
                  <CheckCircle2 />
                ) : (
                  <AlertCircle />
                )}
                {selectedIssuer.status}
              </span>
            </div>
            <dl>
              <div>
                <dt>Organisation type</dt>
                <dd>{selectedIssuer.type}</dd>
              </div>
              <div>
                <dt>Organisation ID</dt>
                <dd>
                  ORG-{selectedIssuer.name.slice(0, 3).toUpperCase()}-2087
                </dd>
              </div>
              <div>
                <dt>Registered city</dt>
                <dd>Pune, Maharashtra</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  compliance@
                  {selectedIssuer.name.toLowerCase().replaceAll(" ", "")}.in
                </dd>
              </div>
            </dl>
            <div className="issuer-detail-section">
              <span className="kicker">DOCUMENTS SUBMITTED</span>
              {[
                ["GST certificate", "Verified"],
                ["Business licence", "Verified"],
                ["Owner ID", "Verified"],
              ].map((doc) => (
                <p key={doc[0]}>
                  <FileCheck2 />
                  <b>{doc[0]}</b>
                  <span>
                    <CheckCircle2 />
                    {doc[1]}
                  </span>
                </p>
              ))}
            </div>
            <div className="issuer-detail-section">
              <span className="kicker">BRANCHES / WORKSHOPS</span>
              {Array.from(
                { length: Math.min(selectedIssuer.branches, 4) },
                (_, i) => (
                  <p key={i}>
                    <Wrench />
                    <b>
                      {i === 0
                        ? "Pune Central"
                        : i === 1
                          ? "Baner Workshop"
                          : i === 2
                            ? "Pimpri Branch"
                            : "Hadapsar Workshop"}
                    </b>
                    <span>BR-{String(i + 1).padStart(3, "0")}</span>
                  </p>
                ),
              )}
              {selectedIssuer.branches > 4 && (
                <small>
                  + {selectedIssuer.branches - 4} more branches managed by the
                  organisation
                </small>
              )}
            </div>
            <Button
              kind="secondary"
              disabled={selectedIssuer.status === "Suspended"}
              onClick={() => {
                updateIssuerStatus(selectedIssuer.name, "Suspended")
                setSelectedIssuer({ ...selectedIssuer, status: "Suspended" })
              }}
            >
              <ShieldAlert />
              {selectedIssuer.status === "Suspended"
                ? "Issuer suspended"
                : "Suspend issuer"}
            </Button>
          </aside>
        </div>
      )}
      <PageFooter />
    </>
  )
}

function How({ go, back }: any) {
  return (
    <>
      <main className="how-page">
        <button className="back" onClick={back}>
          <ArrowLeft />
          Back
        </button>
        <section className="how-hero">
          <span className="kicker">HOW IT WORKS</span>
          <h1>A vehicle history you can inspect, not just trust.</h1>
          <p>
            Every conclusion stays connected to signed records and supporting
            evidence.
          </p>
        </section>
        <section className="problem">
          <div>
            <span className="kicker">THE PROBLEM</span>
            <h2>
              A dashboard can show one number. The history can tell another
              story.
            </h2>
            <p>
              A display reading of 55,000 km may look plausible even when
              earlier evidence records 1,20,000 km. Vehicle Passport preserves
              both facts and flags the contradiction without accusing anyone.
            </p>
          </div>
          <div className="odometer-illus">
            <Gauge />
            <small>DASHBOARD</small>
            <b>55,000</b>
            <span>km</span>
            <em>Earlier signed record: 1,20,000 km</em>
          </div>
        </section>
        <section className="four-layers">
          <span className="kicker">FOUR LAYERS OF TRUST</span>
          <h2>Blockchain is part of the answer—not the whole answer.</h2>
          <div>
            {[
              ["01", "Issuer trust", "Know who added the record."],
              ["02", "Supporting evidence", "Open the photos and documents."],
              ["03", "Tamper-evident ledger", "Detect alteration or deletion."],
              [
                "04",
                "Cross-source AI checks",
                "Compare progression, gaps and conflicts.",
              ],
            ].map((x) => (
              <article key={x[0]}>
                <b>{x[0]}</b>
                <h3>{x[1]}</h3>
                <p>{x[2]}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="does-card">
          <div>
            <ShieldCheck />
            <h2>What blockchain does</h2>
            <ul>
              <li>Makes alteration detectable</li>
              <li>Keeps append-only provenance</li>
              <li>Lets anyone verify integrity</li>
            </ul>
          </div>
          <div>
            <AlertCircle />
            <h2>What it does not do</h2>
            <ul>
              <li>Prove a reading is true</li>
              <li>Replace issuer trust</li>
              <li>Replace evidence or physical inspection</li>
            </ul>
            <p>That is why Vehicle Passport combines all four layers.</p>
          </div>
        </section>
        <div className="center">
          <Button onClick={() => go("open")}>
            Check a vehicle <ArrowRight />
          </Button>
        </div>
      </main>
      <PageFooter />
    </>
  )
}

function RecallRoadmap({ back }: { back: () => void }) {
  const [state, setState] = useState<"alert" | "booked" | "clear">("alert")
  return (
    <>
      <main className="how-page roadmap-page">
        <button className="back" onClick={back}>
          <ArrowLeft /> Back to Owner
        </button>
        <section className="roadmap-head">
          <span className="roadmap-pill">COMING NEXT · ROADMAP</span>
          <h1>
            Recall alerts that follow the vehicle—not an old mailing list.
          </h1>
          <p>
            A future module for sending safety notices only to the passport's
            current verified owner, then preserving signed completion.
          </p>
        </section>
        <section className="roadmap-demo">
          <div className="phone">
            <div className="phone-top" />
            <div className="phone-time">9:41</div>
            <div className="phone-notification">
              <span>
                <Fingerprint />
              </span>
              <div>
                <small>VEHICLE PASSPORT · NOW</small>
                <b>Safety recall: your vehicle may be affected</b>
                <p>
                  A steering component recall may apply to your 2021 Tata Nexon
                  XZ+. Check eligibility and book with a dealer.
                </p>
              </div>
            </div>
            <div className="phone-card">
              <StatusBadge status="Verified" />
              <h3>2021 Tata Nexon XZ+</h3>
              <p>Sent securely to current owner Aarav</p>
              {state === "alert" && (
                <Button onClick={() => setState("booked")}>
                  Book dealer visit
                </Button>
              )}
              {state === "booked" && (
                <>
                  <div className="booking-confirmed">
                    <CheckCircle2 /> Visit booked · Prime Tata
                  </div>
                  <Button onClick={() => setState("clear")}>
                    Simulate dealer completion
                  </Button>
                </>
              )}
              {state === "clear" && (
                <span className="recall-clear">
                  <ShieldCheck /> Recall-clear · dealer signed
                </span>
              )}
            </div>
          </div>
          <div className="roadmap-copy">
            <span className="kicker">PROPOSED FLOW</span>
            <h2>From notice to signed clearance</h2>
            {[
              [
                "1",
                "Target current owner",
                "Ownership history routes the alert to the right person.",
              ],
              [
                "2",
                "Book with a dealer",
                "The owner chooses a participating authorised dealer.",
              ],
              [
                "3",
                "Dealer signs completion",
                "A recall-clear entry is appended with evidence and provenance.",
              ],
            ].map(([n, title, copy]) => (
              <div className="roadmap-step" key={n}>
                <span>{n}</span>
                <div>
                  <b>{title}</b>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
            <div className="roadmap-note">
              <Info />
              <p>
                <b>Roadmap concept only.</b> No live manufacturer recall data or
                notifications are connected in this prototype.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </>
  )
}

export default function App() {
  const [role, setRoleState] = useState("Buyer")
  const [view, setView] = useState("landing")
  const [returnView, setReturnView] = useState("landing")
  const [selected, setSelected] = useState(vehicles[0])
  const [scanVehicle, setScanVehicle] = useState(vehicles[0])
  const [initialTab, setInitialTab] = useState("overview")
  const [transferredVehicle, setTransferredVehicle] = useState<string | null>(
    null,
  )
  const [issuedRecords, setIssuedRecords] =
    useState<Record<string, RecordItem[]>>({})
  const [ownerNote, setOwnerNote] = useState<any>(null)
  const go = (x: string) => {
    if (x !== view) setReturnView(view)
    setView(x)
  }
  const setRole = (r: string) => {
    setReturnView(view)
    setRoleState(r)
    setView(r === "Buyer" ? "landing" : r === "Owner" ? "owner" : "issuer")
  }
  const open = (v: Vehicle, scan = false) => {
    setSelected(v)
    setReturnView(view)
    if (scan) {
      setScanVehicle(v)
      setView("open")
    } else setView("passport")
  }
  const buyerPreview = (v: Vehicle, tab = "overview") => {
    setSelected(v)
    setReturnView("owner")
    setRoleState("Buyer")
    setInitialTab(tab)
    setView("passport")
  }
  const passportVehicle = useMemo(() => {
    const appended = issuedRecords[selected.key] || []
    if (transferredVehicle !== selected.key)
      return appended.length
        ? { ...selected, records: [...selected.records, ...appended] }
        : selected
    const latestReading = selected.records.at(-1)!.km
    const transferRecord = makeRecord(
      `${selected.key}-${String(selected.records.length + 1).padStart(4, "0")}`,
      "18 Sep 2026",
      "Ownership transfer",
      latestReading,
      "Aarav & Meera Shah",
      2,
    )
    transferRecord.issuerType = "Dual-signed ownership"
    transferRecord.notes =
      "Seller and buyer signatures verified. Previous ownership remains preserved."
    return {
      ...selected,
      records: [...selected.records, ...appended, transferRecord],
    }
  }, [selected, transferredVehicle, issuedRecords])
  return (
    <div className="app">
      <Header role={role} setRole={setRole} go={go} />
      {view === "landing" && <Landing open={open} setRole={setRole} go={go} />}
      {view === "open" && (
        <OpenPassport
          vehicle={scanVehicle}
          done={() => open(scanVehicle)}
          openDirect={open}
          onBack={() => setView(returnView)}
        />
      )}
      {view === "passport" && (
        <Passport
          key={selected.key + initialTab + transferredVehicle}
          v={passportVehicle}
          initialTab={initialTab}
          onOpen={open}
          setSelected={setSelected}
          ownerCount={selected.key === transferredVehicle ? 2 : 1}
          onBack={() => setView(returnView)}
          ownerNote={ownerNote}
        />
      )}
      {view === "owner" && (
        <Owner
          openBuyer={buyerPreview}
          onTransfer={(v: Vehicle) => {
            setTransferredVehicle(v.key)
          }}
          transferredVehicle={transferredVehicle}
          openRoadmap={() => setView("roadmap")}
          ownerNote={ownerNote}
          onOwnerNote={setOwnerNote}
        />
      )}
      {view === "issuer" && (
        <Issuer
          selected={selected}
          onRecordAdded={(v: Vehicle, r: RecordItem) =>
            setIssuedRecords((current) => ({
              ...current,
              [v.key]: [...(current[v.key] || []), r],
            }))
          }
          viewTimeline={(v: Vehicle) => {
            setSelected(v)
            setReturnView("issuer")
            setRoleState("Buyer")
            setInitialTab("timeline")
            setView("passport")
          }}
        />
      )}
      {view === "how" && <How go={go} back={() => setView(returnView)} />}
      {view === "roadmap" && <RecallRoadmap back={() => setView("owner")} />}
    </div>
  )
}