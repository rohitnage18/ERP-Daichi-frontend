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

describe("freight is not part of payable total", () => {
  it("rounds goods + tax only (freight 100 does not change total)", () => {
    const payable = payableInvoiceTotals({
      subtotal: 1995,
      cgstAmount: 49.88,
      sgstAmount: 49.88,
      igstAmount: 0,
      totalTax: 99.76,
    });
    assert.equal(payable.totalAmount, 2095);
    assert.equal(payable.roundOff, 0.24);
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
