"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deriveCasePrice, deriveLotSizeLabel, isPositiveInteger } from "@/lib/packing-math";
import { formatCurrency } from "@/lib/utils";

export function packingUnitsError(value: string): string | null {
  if (value === "") return null;
  return isPositiveInteger(Number(value))
    ? null
    : "Units per case must be a positive integer";
}

export function PackingDerivedFields({
  packingSize,
  unitsPerCase,
  pricePerUnit,
  disabled,
  onUnitsPerCaseChange,
}: {
  packingSize: string;
  unitsPerCase: string;
  pricePerUnit: number | null;
  disabled?: boolean;
  onUnitsPerCaseChange: (value: string) => void;
}) {
  const unitsNum = unitsPerCase === "" ? null : Number(unitsPerCase);
  const error = packingUnitsError(unitsPerCase);
  const liveLotSize = deriveLotSizeLabel(packingSize, unitsNum);
  const liveCasePrice = deriveCasePrice(pricePerUnit, unitsNum);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="unitsPerCase">Units per Case</Label>
        <Input
          id="unitsPerCase"
          type="number"
          min={1}
          step={1}
          value={unitsPerCase}
          disabled={disabled}
          onChange={(e) => onUnitsPerCaseChange(e.target.value)}
          placeholder="e.g. 3"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label>Lot size (derived)</Label>
        <Input value={liveLotSize || "—"} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label>Case price (derived)</Label>
        <Input
          value={liveCasePrice == null ? "—" : formatCurrency(liveCasePrice)}
          disabled
          readOnly
        />
      </div>
    </>
  );
}
