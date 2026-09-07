import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { billedUnitsFromCases, casesFromBilledUnits, payableInvoiceTotals } from "./invoice-utils";
import { deriveLotSizeLabel } from "./packing-math";
import { matchesProductSearch } from "./product-search";

describe("billing qty scales with units per case", () => {
  it("qty 1 of 5Kg×3 bills 3 units / 15 kg", () => {
    assert.equal(billedUnitsFromCases(1, 3), 3);
    assert.equal(deriveLotSizeLabel("5 Kg", 3), "5Kg*3 unit=15 kg");
  });

  it("qty 2 of 5Kg×3 bills 6 units / 30 kg", () => {
    assert.equal(billedUnitsFromCases(2, 3), 6);
    assert.equal(deriveLotSizeLabel("5 Kg", 6), "5Kg*6 unit=30 kg");
    assert.equal(casesFromBilledUnits(6, 3), 2);
  });

  it("1kg × 25: qty 1 → 25 units, qty 2 → 50 units", () => {
    assert.equal(billedUnitsFromCases(1, 25), 25);
    assert.equal(billedUnitsFromCases(2, 25), 50);
  });

  it("5kg generic × 5: qty 2 → 10 units", () => {
    assert.equal(billedUnitsFromCases(2, 5), 10);
  });
});

describe("freight is subtracted from payable total", () => {
  it("₹2,000 goods+GST minus ₹200 freight is ₹1,800", () => {
    const payable = payableInvoiceTotals({
      subtotal: 2000,
      totalTax: 0,
      freightCharges: 200,
    });
    assert.equal(payable.goodsTotal, 2000);
    assert.equal(payable.totalAmount, 1800);
  });

  it("screenshot case: 1995 + 49.88 + 49.88 rounded 2095 minus freight 200 is 1895", () => {
    const payable = payableInvoiceTotals({
      subtotal: 1995,
      cgstAmount: 49.88,
      sgstAmount: 49.88,
      igstAmount: 0,
      totalTax: 99.76,
      freightCharges: 200,
    });
    assert.equal(payable.goodsTotal, 2095);
    assert.equal(payable.totalAmount, 1895);
  });

  it("goods + tax 7560 minus freight 200 is 7360", () => {
    const payable = payableInvoiceTotals({
      subtotal: 7200,
      cgstAmount: 180,
      sgstAmount: 180,
      igstAmount: 0,
      totalTax: 360,
      freightCharges: 200,
    });
    assert.equal(payable.totalAmount, 7360);
    assert.equal(payable.roundOff, 0);
  });

  it("rounds goods + tax first, then less freight", () => {
    const payable = payableInvoiceTotals({
      subtotal: 1995,
      cgstAmount: 49.88,
      sgstAmount: 49.88,
      igstAmount: 0,
      totalTax: 99.76,
      freightCharges: 100,
    });
    assert.equal(payable.totalAmount, 1995);
    assert.equal(payable.roundOff, 0.24);
  });

  it("ignores negative freight", () => {
    const payable = payableInvoiceTotals({
      subtotal: 1000,
      totalTax: 50,
      freightCharges: -80,
    });
    assert.equal(payable.totalAmount, 1050);
  });

  it("fuzz: payable never exceeds rounded goods+tax", () => {
    for (let i = 0; i < 200; i++) {
      const subtotal = Math.round(Math.random() * 1e6);
      const tax = Math.round(Math.random() * 1e5);
      const freightRaw = i % 11 === 0 ? -50 : Math.round(Math.random() * 1e5);
      const payable = payableInvoiceTotals({
        subtotal,
        totalTax: tax,
        freightCharges: freightRaw,
      });
      const goods = Math.round(subtotal + tax);
      assert.ok(payable.totalAmount >= 0);
      assert.ok(payable.totalAmount <= goods);
      assert.equal(payable.totalAmount, Math.max(0, goods - Math.max(0, freightRaw)));
    }
  });
});

describe("product search", () => {
  const product = {
    name: "Indicafert [NPK 15:30:15]",
    productCode: "DI-SWSF-012-5KG",
    packingSize: "5 Kg",
    hsnCode: null,
    lotSize: "5Kg*3 unit=15 kg",
  };

  it("matches NPK, packing, and code fragments", () => {
    assert.equal(matchesProductSearch(product, "15:30:15"), true);
    assert.equal(matchesProductSearch(product, "15 30 15"), true);
    assert.equal(matchesProductSearch(product, "5kg"), true);
    assert.equal(matchesProductSearch(product, "swsf012"), true);
    assert.equal(matchesProductSearch(product, "00:60:20"), false);
  });
});
