export type AssetClass = "land" | "rental" | "flip";
export type PropertyStatus = "active" | "sold" | "under_contract" | "listed";
export type LotStatus = "sold" | "uc" | "listed" | "avail";

export interface Loan {
  id: string;
  lender: string;
  type: string;
  bal: number;
  rate?: number;
  asof?: string;
}

export interface Lot {
  id: string;
  n: string;
  status: LotStatus;
  list: number;
  basis: number;
  sale?: number;
  date?: string;
}

export interface CostLine {
  id: string;
  c: string;
  a: number;
}

export interface Property {
  id: string;
  name: string;
  class: AssetClass;
  addr: string;
  status: PropertyStatus;
  acquired?: string;
  purchase?: number;
  valuation: number;
  projSale?: number; // flips
  noi?: number; // rentals
  sale?: number;
  saleDate?: string;
  loans: Loan[];
  lots?: Lot[]; // land
  costs?: CostLine[]; // flips
}

export type TabId = "dash" | "props" | "land" | "loans";

export interface FieldOption {
  v: string;
  t: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "money" | "number" | "select" | "date" | "month";
  options?: FieldOption[];
  ph?: string;
  hint?: string;
  /** Hide/show field based on current form values (e.g. flip vs rental fields). */
  showIf?: (values: Record<string, string>) => boolean;
}

export interface ModalConfig {
  title: string;
  fields: FieldDef[];
  initial?: Record<string, string | number | undefined>;
  /** Parsed values (money/number fields are numbers). Return true to close the modal. */
  onSave: (out: Record<string, string | number>) => boolean;
}
