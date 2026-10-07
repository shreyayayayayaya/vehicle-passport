const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VehiclePassport", () => {
  let c, dealer, inspector, rando, vin;
  const ev = ethers.ZeroHash;

  beforeEach(async () => {
    [, dealer, inspector, rando] = await ethers.getSigners();
    const F = await ethers.getContractFactory("VehiclePassport");
    c = await F.deploy([dealer.address, inspector.address], ["Dealer", "Inspector"]);
    vin = ethers.keccak256(ethers.toUtf8Bytes("TESTVIN"));
  });

  it("stores a normal reading unflagged", async () => {
    await c.connect(dealer).addReading(vin, 5000, ev);
    const t = await c.getTimeline(vin);
    expect(t.length).to.equal(1);
    expect(t[0].flagged).to.equal(false);
  });

  it("flags a lower reading and keeps both", async () => {
    await c.connect(dealer).addReading(vin, 71800, ev);
    await c.connect(inspector).addReading(vin, 55310, ev);
    const t = await c.getTimeline(vin);
    expect(t.length).to.equal(2);
    expect(t[0].km).to.equal(71800n);
    expect(t[1].flagged).to.equal(true);
  });

  it("rejects an unapproved issuer", async () => {
    await expect(c.connect(rando).addReading(vin, 100, ev))
      .to.be.revertedWith("Not an approved issuer");
  });

  it("correction preserves the original", async () => {
    await c.connect(dealer).addReading(vin, 71800, ev);
    await c.connect(dealer).addCorrection(vin, 0, 17180, ev);
    const t = await c.getTimeline(vin);
    expect(t.length).to.equal(2);
    expect(t[0].km).to.equal(71800n);
    expect(t[1].isCorrection).to.equal(true);
    expect(t[1].correctsIndex).to.equal(0n);
  });
});