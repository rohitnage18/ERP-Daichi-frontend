"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryOption,
  isPesticideCategoryLabel,
  splitProductCategories,
} from "@/lib/product-categories";

const PESTICIDE_GROUP = "__pesticide__";

type Props = {
  categories: CategoryOption[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  required?: boolean;
};

/**
 * Category *: other product categories first, then Pesticide.
 * When Pesticide is chosen, show the 4 A–D pesticide type options.
 */
export function ProductCategorySelect({
  categories,
  value,
  onChange,
  disabled,
  required,
}: Props) {
  const { other, pesticide } = useMemo(
    () => splitProductCategories(categories),
    [categories]
  );

  const selectedIsPesticide = useMemo(() => {
    const selected = categories.find((c) => c.id === value);
    return selected ? isPesticideCategoryLabel(selected.label || selected.name || "") : false;
  }, [categories, value]);

  const primaryValue = selectedIsPesticide ? PESTICIDE_GROUP : value || "";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Category {required ? "*" : ""}</Label>
        <Select
          value={primaryValue || undefined}
          disabled={disabled}
          onValueChange={(v) => {
            if (v === PESTICIDE_GROUP) {
              // Default to first pesticide type (A) when entering the group
              const first = pesticide[0];
              onChange(first?.id || "");
              return;
            }
            onChange(v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {other.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
            {pesticide.length > 0 && (
              <SelectItem value={PESTICIDE_GROUP}>Pesticide</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedIsPesticide && (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/50 p-3">
          <Label>Pesticide type *</Label>
          <Select
            value={value || undefined}
            disabled={disabled}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pesticide type" />
            </SelectTrigger>
            <SelectContent>
              {pesticide.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            A Insecticides · B Weedicides · C Fungicides · D PGR
          </p>
        </div>
      )}
    </div>
  );
}
