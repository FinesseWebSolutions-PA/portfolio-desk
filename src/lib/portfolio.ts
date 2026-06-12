import type { AssetClass, Property } from "@/types";

export const CLASS_LABEL: Record<AssetClass, string> = {
  land: "Land Development",
  rental: "Long-Term Rental",
  flip: "Fix & Flip",
};

let uid = 100;
export const nid = (p: string) => p + ++uid;

export const fmt = (n?: number) => "$" + Math.round(n || 0).toLocaleString("en-US");
export const pct = (n: number) => (n * 100).toFixed(0) + "%";

export const debtOf = (p: Property) => (p.loans || []).reduce((s, l) => s + (+l.bal || 0), 0);
export const ltvOf = (p: Property) => (p.valuation ? debtOf(p) / p.valuation : 0);
export const eqOf = (p: Property) => (+p.valuation || 0) - debtOf(p);
export const flipCost = (p: Property) => (p.costs || []).reduce((s, c) => s + (+c.a || 0), 0);

export function realizedPL(p: Property): number | null {
  if (p.status !== "sold") return null;
  if (p.class === "flip") return (+(p.sale || 0)) - flipCost(p);
  return (+(p.sale || 0)) - (+(p.purchase || 0));
}

export interface LotRollup {
  sold: number;
  total: number;
  rev: number;
  pl: number;
  remainVal: number;
  remain: number;
}

export function lotRollup(p: Property): LotRollup {
  const lots = p.lots || [];
  const sold = lots.filter((l) => l.status === "sold");
  const rev = sold.reduce((s, l) => s + (+(l.sale || 0)), 0);
  const soldBasis = sold.reduce((s, l) => s + (+l.basis || 0), 0);
  const remain = lots.filter((l) => l.status !== "sold");
  const remainVal = remain.reduce((s, l) => s + (+l.list || 0), 0);
  return { sold: sold.length, total: lots.length, rev, pl: rev - soldBasis, remainVal, remain: remain.length };
}

export const num = (v: string | number): number => {
  const n = parseFloat(String(v).replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
};

export const statusLabel = (s: string) => (s === "under_contract" ? "under contract" : s);
