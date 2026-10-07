
# Vehicle Passport

### A Tamper-Evident History for Used Cars

**_The meter can lie. The record can't._**

*Team Parallax · PCET's Pimpri Chinchwad College of Engineering, Department of Computer Engineering · DecentraHack*

Vehicle Passport is a tamper-evident, VIN-linked vehicle history system designed to make used-car records more trustworthy.

It creates an append-only history of vehicle mileage, service records, corrections, and supporting evidence. Instead of relying only on the dashboard reading or scattered records, buyers can view a verifiable timeline and receive an explained verdict about whether the vehicle's history is **Verified**, **Partially Verified**, or **Suspicious**.

---

## Problem

Used-car buyers often have to rely on the odometer and seller-provided records. Odometers can be rolled back, while vehicle records are usually scattered across garages, insurers, manufacturers, and inspection centres, where they are easy to lose, hide or edit.

A car's past affects its price, safety and resale value. Hidden mileage manipulation, accident/repair history and missing records can cause buyers to overpay, inherit unexpected problems, and make vehicles harder to value accurately.

Existing tools provide useful pieces (registration/history data, inspections, probability scores), but they offer only a snapshot or a single source of information. They do not provide a shared, tamper-evident, multi-source mileage timeline with evidence-based explanations.

**Who is affected:** used-car buyers, honest sellers, lenders and insurers.

### Market context

- **7M+** used cars are expected to be sold in India in FY27 (CRISIL).
- **~26%** of used-car sales go through organised players (CRISIL).

Manipulable data + fragmented records + limited verification → information asymmetry.

Vehicle Passport brings multiple records together into one tamper-evident timeline with evidence-backed investigation.

---

## Solution

Vehicle Passport works by:

- Linking vehicle records to a hashed VIN
- Allowing approved issuers to add signed mileage and evidence records
- Allowing owners to upload supporting documents such as service and insurance records
- Storing records in an append-only blockchain ledger
- Flagging suspicious lower mileage readings instead of silently overwriting history
- Preserving corrections while keeping the original record
- Running rule-based analysis to detect rollback, history gaps and conflicting readings
- Using an AI layer to explain the verdict in simple language (with a template fallback)
- Allowing owners to share the vehicle passport through a QR/link
- Comparing up to 3 vehicles side by side (checks passed, latest verified reading, longest gap)

### What makes it different

| Differentiator | Description |
|---|---|
| **Provenance, not just history** | Every important vehicle record is tied to its source and preserved as a tamper-evident timeline, making silent changes detectable. |
| **Reconciliation, not just a score** | Records from multiple sources are cross-checked to detect contradictions, missing evidence and suspicious mileage patterns, and the verdict is explained. |
| **Evidence-backed verdicts** | The verdict links to the supporting evidence rather than showing a bare score. |

---

## Architecture

### 1. Presentation Layer

- React + Vite
- TypeScript
- Role-based views: **Buyer, Owner, Issuer**
- Passport, Proof Ledger, Investigation and Vehicle Comparison views

### 2. Blockchain Integration

- **ethers.js** for blockchain interaction
- VIN and evidence hashing
- Contract calls and on-chain data reading
- MetaMask for signing issuer transactions

### 3. Smart Contract

- **Solidity**
- Append-only vehicle records indexed by hashed VIN
- Approved-issuer access control (only approved issuers can write)
- Lower mileage readings are flagged rather than rejected or overwritten
- Corrections link to original records without modifying them
- Each record stores km, issuer, evidence hash and flag
- Evidence is represented by keccak256 hashes
- Full vehicle timeline can be retrieved from the contract

### 4. Blockchain Network

- Local **Hardhat** network
- Chain ID: 31337
- Reset and redeployment support for development and demos

### 5. Analysis Service

- **Node.js** backend
- REST API for vehicle analysis
- Deterministic rule engine checks:
  - Mileage rollback
  - History gaps
  - Conflicting readings
- Reads blockchain data without modifying it

### 6. AI Explanation Layer

- **Gemini**
- Converts the rule engine's result into a simple explanation
- Falls back to a template explanation if Gemini is unavailable
- **The rules determine the verdict; the AI only explains it**

---

## Data Flow

```
Issuer submits a record
        ↓
React Frontend (evidence hashed)
        ↓
ethers.js + MetaMask (transaction signed)
        ↓
Solidity Smart Contract (appends or flags)
        ↓
Append-only Vehicle Timeline
        ↓
Analysis Service
        ↓
Rule Engine
        ↓
AI Explanation
        ↓
Buyer / Owner (status + evidence; owner shares via QR)
```

**Privacy:** the VIN is hashed on-chain; personal data and documents stay off-chain.

### Integrity Verification

The system can verify the integrity of the vehicle history by replaying the contract rules and recomputing evidence hashes, then comparing them with the stored values.

---

## Trust Model

Vehicle Passport separates record integrity from record truth:

- **Blockchain** → makes later alteration detectable
- **Issuer allow-list** → identifies approved issuers
- **Evidence hashes** → prove that referenced evidence has not changed
- **Rule engine** → detects inconsistencies
- **AI layer** → explains the detected issues

> Blockchain cannot prove that an issuer's original reading is truthful. It proves that the record was not silently changed afterwards.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, TypeScript |
| Blockchain | Solidity, Hardhat (local EVM, chain ID 31337) |
| Web3 | ethers.js, MetaMask |
| Backend | Node.js, REST API |
| AI | Gemini (with template fallback) |
| Styling | CSS |
| Development | Git, npm |

---

## Setup

### Prerequisites

Install:

- Node.js
- Git
- MetaMask

### Installation

```bash
git clone <repository-url>
cd vehicle-passport
npm install
cd frontend
npm install
```

Copy `.env.example` to `.env` in the project root and add your Gemini API key:

```bash
cp .env.example .env
```

> ⚠️ Never commit `.env` or your API key to GitHub.

### Start the Project

**1. Start the local blockchain**

```bash
cd vehicle-passport
npx hardhat node
```

**2. Reset/deploy and start the backend**

```bash
npm run reset
node server/index.js
```

**3. Start the frontend**

```bash
cd frontend
npm run dev
```

Open the local URL shown in the terminal by Vite.

### MetaMask

Connect MetaMask to:

| Setting | Value |
|---|---|
| Network | Hardhat Local |
| RPC | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency | ETH |

Import the demo issuer account provided by the Hardhat node.

For a fresh demo, run the reset script before starting the application.

---

## Screenshots

### Vehicle Passport

Add screenshot of the main vehicle passport (passport summary) here.

`![Vehicle Passport](docs/screenshots/passport.png)`

### Proof Ledger

Add screenshot showing the on-chain vehicle timeline.

`![Proof Ledger](docs/screenshots/proof-ledger.png)`

### Investigation

Add screenshot showing the verdict and AI explanation.

`![Investigation](docs/screenshots/investigation.png)`

### Issuer View

Add screenshot of the issuer interface.

`![Issuer View](docs/screenshots/issuer.png)`

### Vehicle Comparison

Add screenshot of the compare-up-to-3 view.

`![Vehicle Comparison](docs/screenshots/comparison.png)`

---

## Example Use Case

Rahul is buying a 2019 used car. The dashboard shows **55,310 km**. He scans the seller's QR and finds an attested 2023 inspection record showing **71,800 km**.

The system detects the inconsistency, marks the mileage history as **Suspicious**, and links Rahul to the supporting record. He can renegotiate the price or walk away from the purchase, and in this case he avoids overpaying.

### Before vs After

| Before | After |
|---|---|
| Trusting the dashboard and the seller's word | AI flags inconsistencies and links the verdict to supporting evidence |
| Service bills, inspection reports and insurance records are stored across different sources | Available records are organised into a single VIN-linked timeline |
| Paper documents and digital entries may be altered or difficult to cross-check | Append-only: lower readings are flagged, original kept |

---

## Team

**Team Name:** Parallax

**Team Members:**

- Palak Chandak
- Sanskruti Karwa
- Shreya R
- Mehek Shaha


