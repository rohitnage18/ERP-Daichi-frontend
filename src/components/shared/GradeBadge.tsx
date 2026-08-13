import { Badge } from "@/components/ui/badge";
import type { DealerGrade } from "@/lib/dealer-grade";

const GRADE_CLASS: Record<DealerGrade, string> = {
  A: "bg-green-100 text-green-800 hover:bg-green-100",
  B: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  C: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  D: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  UNGRADED: "bg-slate-100 text-slate-600 hover:bg-slate-100",
};

export function GradeBadge({ grade }: { grade: DealerGrade | string | null | undefined }) {
  const g = (grade || "UNGRADED") as DealerGrade;
  const cls = GRADE_CLASS[g] || GRADE_CLASS.UNGRADED;
  const label = g === "UNGRADED" ? "Ungraded" : g;
  return <Badge className={cls}>{label}</Badge>;
}
