const { ethers, artifacts } = require("hardhat");
const fs = require("fs");

const ISSUERS = [
  "Sunrise Hyundai", "Metro Maruti", "Prime Tata", "Raj Auto Works",
  "SafeGuard General Insurance", "TrustCheck Inspections", "AutoVerify Inspections",
];

// [issuerIndex, km]
const CARS = {
  MA1ABCDEFGA91742: [[0,12],[0,5900],[0,11200],[4,20500],[3,19900],[3,44300],[5,71800],[6,55310]], // rollback
  MA3ABCDEFXC30517: [[1,18],[1,5400],[1,10900],[1,24100],[5,52600]],                               // thin history
  MATABCDEFXF77203: [[2,9],[2,6100],[2,12400],[4,16700],[3,23900],[2,31200],[5,40500],[2,46800],[5,52300]], // clean
};

async function main() {
  const signers = await ethers.getSigners();
  const issuerSigners = ISSUERS.map((_, i) => signers[i + 1]);

  const F = await ethers.getContractFactory("VehiclePassport");
  const c = await F.deploy(issuerSigners.map((s) => s.address), ISSUERS);
  await c.waitForDeployment();

  for (const [vin, rows] of Object.entries(CARS)) {
    const vinHash = ethers.keccak256(ethers.toUtf8Bytes(vin));
    for (const [i, km] of rows) {
      const ev = ethers.keccak256(ethers.toUtf8Bytes(`${vin}-${km}-evidence`));
      await (await c.connect(issuerSigners[i]).addReading(vinHash, km, ev)).wait();
    }
  }

  const artifact = await artifacts.readArtifact("VehiclePassport");
  fs.writeFileSync(
    "frontend/src/contract.json",
    JSON.stringify(
      {
        address: await c.getAddress(),
        abi: artifact.abi,
        issuers: Object.fromEntries(issuerSigners.map((s, i) => [s.address, ISSUERS[i]])),
      },
      null,
      2
    )
  );
  console.log("Deployed at", await c.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
