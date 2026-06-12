import type { Loan, Property } from "@/types";
import { debtOf, eqOf, fmt, ltvOf, pct } from "@/lib/portfolio";

interface Props {
  properties: Property[];
  onAddLoan: () => void;
  onEditLoan: (p: Property, l: Loan) => void;
}

export default function LoansView({ properties, onAddLoan, onEditLoan }: Props) {
  const rows: { loan: Loan; prop: Property }[] = [];
  properties.forEach((p) => (p.loans || []).forEach((l) => rows.push({ loan: l, prop: p })));

  const leveraged = properties.filter((p) => p.status !== "sold" && debtOf(p) > 0);

  return (
    <section className="view active" id="loans">
      <div className="section-head">
        <h2>Financing &amp; leverage</h2>
        <div className="head-right">
          <span className="eyebrow">manual balances</span>
          <button className="btn primary" onClick={onAddLoan}>+ Add loan</button>
        </div>
      </div>
      <table className="sheet">
        <thead>
          <tr>
            <th>Lender</th>
            <th>Property</th>
            <th>Type</th>
            <th className="r">Balance</th>
            <th className="r">Rate</th>
            <th className="r">As of</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map(({ loan, prop }) => (
              <tr className="click" key={loan.id} onClick={() => onEditLoan(prop, loan)}>
                <td className="name" data-label="Lender">{loan.lender}</td>
                <td data-label="Property" className="loan-prop">{prop.name}</td>
                <td data-label="Type">{loan.type}</td>
                <td className="r mono" data-label="Balance">{fmt(loan.bal)}</td>
                <td className="r mono" data-label="Rate">{loan.rate ? loan.rate + "%" : "—"}</td>
                <td className="r mono" data-label="As of" style={{ color: "var(--muted)" }}>{loan.asof || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="empty">
                No financing recorded. Tap "+ Add loan" to log a mortgage or line of credit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="note">Tap a loan to update its balance or edit terms.</p>

      <div className="section-head">
        <h2>Leverage by property</h2>
        <span className="eyebrow">debt ÷ valuation</span>
      </div>
      <div>
        {leveraged.length ? (
          leveraged.map((p) => {
            const l = ltvOf(p);
            const hot = l > 0.75;
            return (
              <div className="stat" style={{ marginBottom: 12 }} key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="name">{p.name}</span>
                  <span className={`mono ${hot ? "neg" : ""}`} style={{ fontWeight: 600 }}>{pct(l)} LTV</span>
                </div>
                <div className={`meter ${hot ? "hot" : ""}`}>
                  <i style={{ width: `${Math.min(l * 100, 100).toFixed(0)}%` }} />
                </div>
                <div className="sub mono">
                  {fmt(debtOf(p))} against {fmt(p.valuation)} · equity {fmt(eqOf(p))}
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty">No leveraged properties.</p>
        )}
      </div>
    </section>
  );
}
