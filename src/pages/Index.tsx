import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "@/styles/portfolio.css";
import type { AssetClass, FieldDef, Loan, Lot, LotStatus, ModalConfig, Property, PropertyStatus, TabId } from "@/types";
import { fmt, ltvOf, nid, pct, realizedPL } from "@/lib/portfolio";
import { seedProperties } from "@/data/seed";
import DashboardView from "@/components/portfolio/DashboardView";
import PropertiesView from "@/components/portfolio/PropertiesView";
import LandView from "@/components/portfolio/LandView";
import LoansView from "@/components/portfolio/LoansView";
import DealPanel from "@/components/portfolio/DealPanel";
import FormModal from "@/components/portfolio/FormModal";

const TABS: { id: TabId; label: string }[] = [
  { id: "dash", label: "Dashboard" },
  { id: "props", label: "Properties" },
  { id: "land", label: "Land & Lots" },
  { id: "loans", label: "Loans & LTV" },
];

const LOAN_TYPE_OPTIONS = [
  { v: "Mortgage", t: "Mortgage" },
  { v: "Line of Credit", t: "Line of Credit" },
  { v: "Construction", t: "Construction" },
  { v: "Other", t: "Other" },
];

function propertyFields(): FieldDef[] {
  return [
    { key: "name", label: "Property name", ph: "e.g. 42 Maple Ave" },
    { key: "addr", label: "Address", ph: "Street, town" },
    {
      key: "class",
      label: "Asset class",
      type: "select",
      options: [
        { v: "flip", t: "Fix & Flip" },
        { v: "rental", t: "Long-Term Rental" },
        { v: "land", t: "Land Development" },
      ],
    },
    { key: "acquired", label: "Acquired (month)", type: "month" },
    { key: "purchase", label: "Purchase price", type: "money", ph: "0" },
    { key: "valuation", label: "Current valuation", type: "money", ph: "0" },
    { key: "projSale", label: "Projected sale price (flip)", type: "money", ph: "0", showIf: (v) => v.class === "flip" },
    { key: "noi", label: "Net operating income / yr (rental)", type: "money", ph: "0", showIf: (v) => v.class === "rental" },
  ];
}

function lotFields(): FieldDef[] {
  return [
    { key: "n", label: "Lot number / name", ph: "e.g. 11" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { v: "avail", t: "Available" },
        { v: "listed", t: "Listed" },
        { v: "uc", t: "Under contract" },
        { v: "sold", t: "Sold" },
      ],
    },
    { key: "list", label: "List price", type: "money", ph: "0" },
    {
      key: "basis",
      label: "Cost basis (allocated)",
      type: "money",
      ph: "0",
      hint: "Share of acquisition + development cost allocated to this lot.",
    },
    { key: "sale", label: "Sale price (if sold)", type: "money", ph: "0", showIf: (v) => v.status === "sold" },
    { key: "date", label: "Sale month (if sold)", type: "month", showIf: (v) => v.status === "sold" },
  ];
}

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function Index() {
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [tab, setTab] = useState<TabId>("dash");
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [openPropId, setOpenPropId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<ReactNode | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const openProp = properties.find((p) => p.id === openPropId) || null;

  const toast = useCallback((msg: ReactNode) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const closeModal = () => setModal(null);
  const closePanel = () => setOpenPropId(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(null);
        setOpenPropId(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const switchTab = (t: TabId) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateProperty = (id: string, updater: (p: Property) => Property) =>
    setProperties((ps) => ps.map((p) => (p.id === id ? updater(p) : p)));

  /* ---------- property forms ---------- */
  const addProperty = (presetClass?: AssetClass) => {
    setModal({
      title: "Add property",
      fields: propertyFields(),
      initial: { class: presetClass || "flip" },
      onSave: (out) => {
        if (!out.name) {
          toast("Name is required");
          return false;
        }
        const cls = out.class as AssetClass;
        const p: Property = {
          id: nid("p"),
          name: String(out.name),
          addr: String(out.addr || ""),
          class: cls,
          status: "active" as PropertyStatus,
          acquired: String(out.acquired || ""),
          purchase: Number(out.purchase) || 0,
          valuation: Number(out.valuation) || 0,
          loans: [],
        };
        if (cls === "flip") {
          p.projSale = Number(out.projSale) || 0;
          p.costs = p.purchase ? [{ id: nid("c"), c: "Acquisition", a: p.purchase }] : [];
        }
        if (cls === "rental") p.noi = Number(out.noi) || 0;
        if (cls === "land") p.lots = [];
        setProperties((ps) => [p, ...ps]);
        closeModal();
        toast(<><b>{p.name}</b> added to the ledger</>);
        if (cls === "land") switchTab("land");
        return true;
      },
    });
  };

  const editProperty = (p: Property) => {
    setModal({
      title: "Edit property",
      fields: propertyFields(),
      initial: { name: p.name, addr: p.addr, class: p.class, acquired: p.acquired, purchase: p.purchase, valuation: p.valuation, projSale: p.projSale, noi: p.noi },
      onSave: (out) => {
        if (!out.name) {
          toast("Name is required");
          return false;
        }
        const cls = out.class as AssetClass;
        updateProperty(p.id, (prev) => {
          const next: Property = {
            ...prev,
            name: String(out.name),
            addr: String(out.addr || ""),
            class: cls,
            acquired: String(out.acquired || ""),
            purchase: Number(out.purchase) || 0,
            valuation: Number(out.valuation) || 0,
          };
          if (cls === "flip") next.projSale = Number(out.projSale) || 0;
          if (cls === "rental") next.noi = Number(out.noi) || 0;
          if (cls === "land" && !next.lots) next.lots = [];
          return next;
        });
        closeModal();
        closePanel();
        toast(<><b>{String(out.name)}</b> updated</>);
        return true;
      },
    });
  };

  const markSold = (p: Property) => {
    setModal({
      title: "Log sale · " + p.name,
      fields: [
        { key: "sale", label: "Sale price", type: "money" },
        { key: "saleDate", label: "Sale month", type: "month" },
      ],
      initial: { sale: p.projSale || p.valuation, saleDate: thisMonth() },
      onSave: (out) => {
        const sale = Number(out.sale) || 0;
        updateProperty(p.id, (prev) => ({ ...prev, status: "sold", sale, saleDate: String(out.saleDate || "") }));
        closeModal();
        closePanel();
        const pl = realizedPL({ ...p, status: "sold", sale }) || 0;
        toast(<>Sold — realized <b>{pl >= 0 ? "+" : "−"}{fmt(Math.abs(pl))}</b></>);
        return true;
      },
    });
  };

  const deleteProperty = (p: Property) => {
    if (!window.confirm("Delete " + p.name + " and all its loans/lots? This cannot be undone in the demo.")) return;
    setProperties((ps) => ps.filter((x) => x.id !== p.id));
    closePanel();
    toast(<><b>{p.name}</b> removed</>);
  };

  /* ---------- loans ---------- */
  const addLoan = (presetPid?: string) => {
    const opts = properties.filter((p) => p.status !== "sold").map((p) => ({ v: p.id, t: p.name }));
    if (!opts.length) {
      toast("Add a property first");
      return;
    }
    setModal({
      title: "Add loan",
      fields: [
        { key: "pid", label: "Property", type: "select", options: opts },
        { key: "lender", label: "Lender", ph: "e.g. Bank of Perry County" },
        { key: "type", label: "Loan type", type: "select", options: LOAN_TYPE_OPTIONS },
        { key: "bal", label: "Current balance", type: "money", ph: "0" },
        { key: "rate", label: "Interest rate %", type: "number", ph: "e.g. 7.25" },
        { key: "asof", label: "Balance as of", type: "date" },
      ],
      initial: { pid: presetPid || opts[0].v, asof: today() },
      onSave: (out) => {
        const p = properties.find((x) => x.id === out.pid);
        if (!p) return false;
        if (!out.lender) {
          toast("Lender is required");
          return false;
        }
        const loan: Loan = {
          id: nid("l"),
          lender: String(out.lender),
          type: String(out.type),
          bal: Number(out.bal) || 0,
          rate: Number(out.rate) || undefined,
          asof: String(out.asof || ""),
        };
        updateProperty(p.id, (prev) => ({ ...prev, loans: [...prev.loans, loan] }));
        closeModal();
        const newLtv = p.valuation ? (p.loans.reduce((s, l) => s + l.bal, 0) + loan.bal) / p.valuation : 0;
        toast(<>Loan added — <b>{p.name}</b> LTV now {pct(newLtv)}</>);
        return true;
      },
    });
  };

  const editLoan = (p: Property, l: Loan) => {
    setModal({
      title: "Update loan · " + l.lender,
      fields: [
        { key: "lender", label: "Lender" },
        { key: "type", label: "Loan type", type: "select", options: LOAN_TYPE_OPTIONS },
        { key: "bal", label: "Current balance", type: "money", hint: "Update this as statements come in — LTV recalculates instantly." },
        { key: "rate", label: "Interest rate %", type: "number" },
        { key: "asof", label: "Balance as of", type: "date" },
      ],
      initial: { lender: l.lender, type: l.type, bal: l.bal, rate: l.rate, asof: l.asof || today() },
      onSave: (out) => {
        updateProperty(p.id, (prev) => ({
          ...prev,
          loans: prev.loans.map((x) =>
            x.id === l.id
              ? { ...x, lender: String(out.lender), type: String(out.type), bal: Number(out.bal) || 0, rate: Number(out.rate) || undefined, asof: String(out.asof || "") }
              : x
          ),
        }));
        closeModal();
        const newDebt = p.loans.reduce((s, x) => s + (x.id === l.id ? Number(out.bal) || 0 : x.bal), 0);
        toast(<>Balance updated — <b>{p.name}</b> LTV {pct(p.valuation ? newDebt / p.valuation : 0)}</>);
        return true;
      },
    });
  };

  /* ---------- lots ---------- */
  const addLot = (p: Property) => {
    const nextN = String((p.lots || []).length + 1);
    setModal({
      title: "Add lot · " + p.name,
      fields: lotFields(),
      initial: { n: nextN, status: "avail" },
      onSave: (out) => {
        const status = out.status as LotStatus;
        const lot: Lot = {
          id: nid("t"),
          n: String(out.n),
          status,
          list: Number(out.list) || 0,
          basis: Number(out.basis) || 0,
          sale: status === "sold" ? Number(out.sale) || 0 : undefined,
          date: status === "sold" ? String(out.date || "") : undefined,
        };
        updateProperty(p.id, (prev) => ({ ...prev, lots: [...(prev.lots || []), lot] }));
        closeModal();
        toast(<>Lot {lot.n} added to <b>{p.name}</b></>);
        return true;
      },
    });
  };

  const editLot = (p: Property, l: Lot) => {
    setModal({
      title: "Lot " + l.n + " · " + p.name,
      fields: lotFields(),
      initial: { n: l.n, status: l.status, list: l.list, basis: l.basis, sale: l.sale, date: l.date },
      onSave: (out) => {
        const status = out.status as LotStatus;
        let soldSale = 0;
        let soldBasis = 0;
        updateProperty(p.id, (prev) => ({
          ...prev,
          lots: (prev.lots || []).map((x) => {
            if (x.id !== l.id) return x;
            const next: Lot = { ...x, n: String(out.n), status, list: Number(out.list) || 0, basis: Number(out.basis) || 0 };
            if (status === "sold") {
              next.sale = Number(out.sale) || next.list;
              next.date = String(out.date) || thisMonth();
              soldSale = next.sale;
              soldBasis = next.basis;
            } else {
              delete next.sale;
              delete next.date;
            }
            return next;
          }),
        }));
        closeModal();
        if (status === "sold") {
          toast(<>Lot {String(out.n)} sold — margin <b>+{fmt(soldSale - soldBasis)}</b></>);
        } else {
          toast(<>Lot {String(out.n)} updated</>);
        }
        return true;
      },
    });
  };

  /* ---------- costs ---------- */
  const addCost = (p: Property) => {
    setModal({
      title: "Add cost line · " + p.name,
      fields: [
        { key: "c", label: "Description", ph: "e.g. Electrical rough-in" },
        { key: "a", label: "Amount", type: "money", ph: "0" },
      ],
      onSave: (out) => {
        if (!out.c) {
          toast("Description required");
          return false;
        }
        updateProperty(p.id, (prev) => ({
          ...prev,
          costs: [...(prev.costs || []), { id: nid("c"), c: String(out.c), a: Number(out.a) || 0 }],
        }));
        closeModal();
        toast("Cost logged");
        return true;
      },
    });
  };

  const removeCost = (p: Property, costId: string) => {
    updateProperty(p.id, (prev) => ({ ...prev, costs: (prev.costs || []).filter((c) => c.id !== costId) }));
  };

  return (
    <div className="pd-app">
      <header>
        <div className="bar">
          <div className="brand">
            <h1>Portfolio Desk<span className="tick"> ▌</span></h1>
            <small>Lapp Holdings · Lobelville, TN</small>
          </div>
          <div className="asof">
            <b>Live position</b>
            <br />
            as of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </header>

      <nav id="tabs">
        {TABS.map((t) => (
          <button key={t.id} aria-selected={tab === t.id} onClick={() => switchTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "dash" && <DashboardView properties={properties} />}
        {tab === "props" && (
          <PropertiesView properties={properties} onOpen={setOpenPropId} onAdd={() => addProperty()} />
        )}
        {tab === "land" && (
          <LandView properties={properties} onAddProject={() => addProperty("land")} onAddLot={addLot} onEditLot={editLot} />
        )}
        {tab === "loans" && (
          <LoansView properties={properties} onAddLoan={() => addLoan()} onEditLoan={editLoan} />
        )}
      </main>

      <footer>
        <span className="demo-flag">Demo · data resets on refresh</span>
        <span>Built for Lapp Holdings &nbsp;—&nbsp; Finesse Web Solutions</span>
      </footer>

      <DealPanel
        property={openProp}
        onClose={closePanel}
        onEdit={editProperty}
        onMarkSold={markSold}
        onAddLoan={(p) => {
          closePanel();
          addLoan(p.id);
        }}
        onDelete={deleteProperty}
        onAddCost={addCost}
        onRemoveCost={removeCost}
      />

      {modal && <FormModal config={modal} onClose={closeModal} />}

      <div className={`toast ${toastVisible ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
