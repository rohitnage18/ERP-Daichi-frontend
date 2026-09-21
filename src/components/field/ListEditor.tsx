"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const setAt = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            className="h-11 text-base"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setAt(index, e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            disabled={values.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => onChange([...values, ""])}>
        <Plus className="mr-2 h-4 w-4" />
        Add another
      </Button>
    </div>
  );
}
