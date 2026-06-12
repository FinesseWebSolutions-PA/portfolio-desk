import type { Property } from "@/types";
import { CLASS_LABEL, debtOf, eqOf, flipCost, fmt, lotRollup, ltvOf, pct, statusLabel } from "@/lib/portfolio";

interface Props {
  property: Property | null;
  onClose: () => void;
  onEdit: (p: Property) => void;
  onMarkSold: (p: Property) => void;
  onAddLoan: (p: Property) => void;
  onDelete: (p: Property) => void;
  onAddCost: (p: Property) => void;
  onRemoveCost: (p: Property, costId: string) => void;
}

export default function DealPanel({
  property: p,
  onClose,
  onEdit,
  onMarkSold,
  onAddLoan,
  onDelete,
  onAddCost,
  onRemoveCost,
}: Props) {
  return (
    <>
      <div className={`scrim ${p ? "open" : ""}`} onClick={onClose} />
      <aside className={`panel ${p ? "open" : ""}`}>
        {p && (
          <>
            <div className="panel-head">
              <div>
                <h3>{p.name}</h3>
                <div className="addr">{CLASS_LABEL[p.class]} · {p.addr || ""}</div>
              </div>
              <button className="x" onClick={onClose}>×</button>
            </div>
            <div className="panel-body">
              <dl className="kv">
                <dt>Status</dt>
                <dd><span className={`tag ${p.status}`}>{statusLabel(p.status)}</span></dd>
                <dt>Acquired</dt>
                <dd>{p.acquired || "—"}</dd>
                <dt>Purchase price</dt>
                <dd className="mono">{fmt(p.purchase)}</dd>
                <dt>Current valuation</dt>
                <dd className="mono">{fmt(p.valuation)}</dd>
                <dt>Debt</dt>
                <dd className="mono">{debtOf(p) ? fmt(debtOf(p)) : "—"}</dd>
                <dt>Equity</dt>
                <dd className="mono">{fmt(eqOf(p))}</dd>
                {debtOf(p) > 0 && (
                  <>
                    <dt>Loan-to-value</dt>
                    <dd className={`mono ${ltvOf(p) > 0.75 ? "neg" : ""}`}>{pct(ltvOf(p))}</dd>
                  </>
                )}
              </dl>

              {p.loans.length > 0 && (
                <>
                  <div className="rule" />
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Financing</div>
                  {p.loans.map((l) => (
                    <dl className="kv" key={l.id}>
                      <dt>{l.lender} · {l.type}</dt>
                      <dd className="mono">{fmt(l.bal)}{l.rate ? ` @ ${l.rate}%` : ""}</dd>
                    </dl>
                  ))}
                </>
              )}

              {p.class === "flip" && <FlipPL p={p} onAddCost={onAddCost} onRemoveCost={onRemoveCost} />}
              {p.class === "rental" && <RentalIncome p={p} />}
              {p.class === "land" && <LandRollup p={p} />}

              <div className="actions">
                <button className="btn primary" onClick={() => onEdit(p)}>Edit details</button>
                {p.status !== "sold" && (
                  <button className="btn ghost" onClick={() => onMarkSold(p)}>Log sale</button>
                )}
                <button className="btn ghost" onClick={() => onAddLoan(p)}>+ Loan</button>
                <button className="btn danger" onClick={() => onDelete(p)}>Delete</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function FlipPL({ p, onAddCost, onRemoveCost }: { p: Property; onAddCost: (p: Property) => void; onRemoveCost: (p: Property, id: string) => void }) {
  const cost = flipCost(p);
  const exit = p.status === "sold" ? +(p.sale || 0) : +(p.projSale || 0);
  const pl = exit - cost;
  return (
    <>
      <div className="rule" />
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {p.status === "sold" ? "Deal P&L · closed" : "Deal P&L · projected"}
      </div>
      <div className="pl">
        {(p.costs || []).map((c) => (
          <div className="row" key={c.id}>
            <span>{c.c}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="mono">({fmt(c.a)})</span>
              {p.status !== "sold" && (
                <button className="rm" title="Remove" onClick={() => onRemoveCost(p, c.id)}>×</button>
              )}
            </span>
          </div>
        ))}
        <div className="row">
          <span>{p.status === "sold" ? "Sale price" : "Projected sale"}</span>
          <span className="mono pos">{fmt(exit)}</span>
        </div>
        <div className="row tot">
          <span>{p.status === "sold" ? "Realized profit" : "Projected profit"}</span>
          <span className="mono">{pl >= 0 ? "+" : "−"}{fmt(Math.abs(pl))}</span>
        </div>
      </div>
      {exit > 0 && <p className="note">Net margin {pct(pl / exit)} on {fmt(exit)} exit.</p>}
      {p.status !== "sold" && (
        <div style={{ marginTop: 10 }}>
          <button className="btn ghost sm" onClick={() => onAddCost(p)}>+ Add cost line</button>
        </div>
      )}
    </>
  );
}

function RentalIncome({ p }: { p: Property }) {
  const cap = p.valuation ? (+(p.noi || 0)) / p.valuation : 0;
  return (
    <>
      <div className="rule" />
      <div className="eyebrow" style={{ marginBottom: 8 }}>Income</div>
      <div className="pl">
        <div className="row"><span>Net operating income (annual)</span><span className="mono pos">{fmt(p.noi)}</span></div>
        <div className="row"><span>Cap rate on valuation</span><span className="mono">{(cap * 100).toFixed(1)}%</span></div>
        <div className="row tot"><span>Equity in property</span><span className="mono">{fmt(eqOf(p))}</span></div>
      </div>
    </>
  );
}

function LandRollup({ p }: { p: Property }) {
  const r = lotRollup(p);
  return (
    <>
      <div className="rule" />
      <div className="eyebrow" style={{ marginBottom: 8 }}>Lot inventory</div>
      <div className="pl">
        <div className="row"><span>Lots sold</span><span className="mono">{r.sold} of {r.total}</span></div>
        <div className="row"><span>Revenue realized</span><span className="mono pos">{fmt(r.rev)}</span></div>
        <div className="row"><span>Realized margin</span><span className="mono pos">+{fmt(r.pl)}</span></div>
        <div className="row"><span>Inventory remaining</span><span className="mono">{fmt(r.remainVal)}</span></div>
        <div className="row tot"><span>Project equity</span><span className="mono">{fmt(eqOf(p))}</span></div>
      </div>
      <p className="note">Manage individual lots in the Land &amp; Lots tab.</p>
    </>
  );
}
