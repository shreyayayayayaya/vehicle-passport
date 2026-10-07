
**Vehicle Passport**

The meter can lie. The record can't.

Vehicle Passport is a tamper-evident, VIN-linked vehicle history system designed to make used-car records more trustworthy.

It creates an append-only history of vehicle mileage, service records, corrections, and supporting evidence. Instead of relying only on the dashboard reading or scattered records, buyers can view a verifiable timeline and receive an explained verdict about whether the vehicle's history is Clean, Thin History, or Suspicious.

**Problem**

Used-car buyers often have to rely on the odometer and seller-provided records. Odometers can be rolled back, while vehicle records are usually scattered across garages, insurers, manufacturers, and inspection centres.

Existing solutions often provide only a snapshot or a single source of information.

Vehicle Passport brings multiple records together into one tamper-evident timeline with evidence-backed investigation.

**Solution**

Vehicle Passport works by:

Linking vehicle records to a hashed VIN
Allowing approved issuers to add signed mileage and evidence records
Storing records in an append-only blockchain ledger
Flagging suspicious lower mileage readings instead of silently overwriting history
Preserving corrections while keeping the original record
Running rule-based analysis to detect rollback and history gaps
Using an AI layer to explain the verdict in simple language
Allowing owners to share the vehicle passport through a QR/link

**Architecture**

1. Presentation Layer
   
React + Vite

TypeScript

Role-based views: **Buyer, Owner, Issuer**

Passport, Proof Ledger and Investigation views

2. Blockchain Integration
   
**ethers.js** for blockchain interaction

VIN and evidence hashing

Contract calls and on-chain data reading

MetaMask for signing issuer transactions

3. Smart Contract

**Solidity**

Append-only vehicle records indexed by hashed VIN

Approved-issuer access control

Lower mileage readings are flagged rather than rejected

Corrections link to original records without modifying them

Evidence is represented by keccak256 hashes

Full vehicle timeline can be retrieved from the contract

4. Blockchain Network
   
Local **Hardhat** network

Chain ID: 31337

Reset and redeployment support for development and demos

5. Analysis Service
   
**Node.js** backend

REST API for vehicle analysis

Deterministic rule engine checks:
      Mileage rollback
      History gaps
      Conflicting readings
      
Reads blockchain data without modifying it

6. AI Explanation Layer

**Gemini**

Converts the rule engine's result into a simple explanation

The rules determine the verdict; the AI only explains it

**Data Flow**

Issuer

   ↓
   
React Frontend

   ↓
   
ethers.js + MetaMask

   ↓
   
Solidity Smart Contract

   ↓
   
Append-only Vehicle Timeline

   ↓
   
Analysis Service

   ↓
   
Rule Engine

   ↓
   
AI Explanation

   ↓
   
Buyer / Owner

Integrity Verification

The system can verify the integrity of the vehicle history by replaying the contract rules and recomputing evidence hashes, then comparing them with the stored values.

**Trust Model**

Vehicle Passport separates record integrity from record truth:

Blockchain → makes later alteration detectable
Issuer allow-list → identifies approved issuers
Evidence hashes → prove that referenced evidence has not changed
Rule engine → detects inconsistencies
AI layer → explains the detected issues

Blockchain cannot prove that an issuer's original reading is truthful. It proves that the record was not silently changed afterwards.

**Tech Stack**
**Layer**	             **Technologies**
Frontend	          React, Vite, TypeScript
Blockchain	       Solidity, EVM
Web3	             ethers.js, MetaMask
Development        Network	Hardhat
Backend	          Node.js
API	             REST
AI	                Gemini
Styling	          CSS
Development	       Git, npm

**Setup**

**Prerequisites**

Install:

Node.js
Git
MetaMask
Installation
git clone <repository-url>
cd vehicle-passport
npm install
cd frontend
npm install

Add your Gemini API key to the root .env file.

Never commit .env or your API key to GitHub.

Start the Project
**1. Start the local blockchain**

cd vehicle-passport
npx hardhat node

**2. Reset/deploy and start the backend**

npm run reset
node server/index.js

**3. Start the frontend**

cd frontend
npm run dev

Open the local URL shown by Vite, usually:

http://localhost:8443

**MetaMask**

Connect MetaMask to:

Network: Hardhat Local
RPC: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH

Import the demo issuer account provided by the Hardhat node.

For a fresh demo, run the reset script before starting the application.

**Screenshots**
Vehicle Passport

Add screenshot of the main vehicle passport here.




Proof Ledger

Add screenshot showing the on-chain vehicle timeline.




Investigation

Add screenshot showing the verdict and AI explanation.




Issuer View

Add screenshot of the issuer interface.




**Example Use Case**

A buyer is looking at a used car whose dashboard shows:55,310 km

The Vehicle Passport contains an earlier verified record showing:71,800 km

The system detects the inconsistency and marks the vehicle: _Suspicious_

The buyer can see the underlying records and use this information to renegotiate the price or walk away from the purchase.

**Real-World Applications**

Vehicle Passport can be used by:
Used-car marketplaces and dealers
Vehicle inspection companies
Insurance companies
Banks and lenders
Service centres and garages
Used-car buyers and sellers

**Future Scope**

Public blockchain/testnet deployment
Dynamic issuer registry
Connected-car/telematics data
Recall alerts
EV battery health records
Real evidence/document storage
Production authentication
Integration with inspection centres and used-car marketplaces

**Prototype Scope**

The current prototype uses:

A local Hardhat blockchain
A fixed approved-issuer list
Off-chain application data
Demo vehicle records

Production deployment would require a dynamic issuer registry, production authentication, secure evidence storage, and deployment to a public network.

**Team**

Team Name: Parallax

Team Members:

Palak Chandak
Sanskruti Karwa
Shreya R
Mehek Shaha


