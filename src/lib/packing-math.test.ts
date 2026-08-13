import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveCasePrice,
  deriveLotSize,
  deriveLotSizeLabel,
  isPositiveInteger,
} from "./packing-math";

describe("units-per-case live recalculation (product form)", () => {
  it("5kg × 3 units = 15 kg", () => {
    const lot = deriveLotSize(5, "kg", 3);
    assert.equal(lot?.value, 15);
    assert.equal(lot?.label, "15 kg");
  });

  it("changing a 5kg product unitsPerCase 3 → 5 updates lotSize 15kg → 25kg", () => {
    assert.equal(deriveLotSizeLabel("5 Kg", 3), "5Kg*3 unit=15 kg");
    assert.equal(deriveLotSizeLabel("5 Kg", 5), "5Kg*5 unit=25 kg");
    assert.equal(deriveLotSize(5, "kg", 3)?.label, "15 kg");
    assert.equal(deriveLotSize(5, "kg", 5)?.label, "25 kg");
  });

  it("casePrice scales with unitsPerCase once price is set", () => {
    assert.equal(deriveCasePrice(100, 3), 300);
    assert.equal(deriveCasePrice(100, 5), 500);
    assert.equal(deriveCasePrice(null, 3), null);
  });

  it("rejects non-positive / non-integer unitsPerCase", () => {
    assert.equal(isPositiveInteger(0), false);
    assert.equal(isPositiveInteger(3.5), false);
    assert.equal(deriveLotSize(5, "kg", 0), null);
  });
});
