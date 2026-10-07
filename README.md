# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

🚗 Vehicle Passport
The meter can lie. The record can't.

Vehicle Passport is a tamper-evident, VIN-linked vehicle history system designed to make used-car records more trustworthy.

It creates an append-only history of vehicle mileage, service records, corrections, and supporting evidence. Instead of relying only on the dashboard reading or scattered records, buyers can view a verifiable timeline and receive an explained verdict about whether the vehicle's history is Clean, Thin History, or Suspicious.

🎯 Problem

Used-car buyers often have to rely on the odometer and seller-provided records. Odometers can be rolled back, while vehicle records are usually scattered across garages, insurers, manufacturers, and inspection centres.

Existing solutions often provide only a snapshot or a single source of information.

Vehicle Passport brings multiple records together into one tamper-evident timeline with evidence-backed investigation.

💡 Solution

Vehicle Passport works by:

Linking vehicle records to a hashed VIN
Allowing approved issuers to add signed mileage and evidence records
Storing records in an append-only blockchain ledger
Flagging suspicious lower mileage readings instead of silently overwriting history
Preserving corrections while keeping the original record
Running rule-based analysis to detect rollback and history gaps
Using an AI layer to explain the verdict in simple language
Allowing owners to share the vehicle passport through a QR/link

