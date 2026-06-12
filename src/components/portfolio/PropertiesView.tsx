import type { Property } from "@/types";
import { CLASS_LABEL, debtOf, eqOf, fmt, ltvOf, pct, statusLabel } from "@/lib/portfolio";

interface Props {
  properties: Property[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}

export default function PropertiesView({ properties, onOpen, onAdd }: Props) {
  const activeCount = properties.filter((p) => p.status !== "sold").length;

  return (
    <section className="view active" id="props">
      <div className="section-head">
        <h2>All properties</h2>
        <div className="head-right">
          <span className="eyebrow">{properties.length} total · {activeCount} active</span>
          <button className="btn primary" onClick={onAdd}>+ Add property</button>
        </div>
      </div>
      <table className="sheet">
        <thead>
          <tr>
            <th>Property</th>
            <th>Class</th>
            <th>Status</th>
            <th className="r">Valuation</th>
            <th className="r">Debt</th>
            <th className="r">Equity</th>
            <th className="r">LTV</th>
          </tr>
        </thead>
        <tbody id="propRows">
          {properties.length ? (
            properties.map((p) => {
              const d = debtOf(p);
              const l = ltvOf(p);
              return (
                <tr className="click" key={p.id} onClick={() => onOpen(p.id)}>
                  <td data-label="Property">
                    <span className="name">{p.name}</span>
                    <div className="addr">{p.addr}</div>
                    <div className="m-tags m-only">
                      <span className={`tag ${p.class}`}>{CLASS_LABEL[p.class]}</span>
                      <span className={`tag ${p.status}`}>{statusLabel(p.status)}</span>
                    </div>
                  </td>
                  <td data-label="Class" className="d-only">
                    <span className={`tag ${p.class}`}>{CLASS_LABEL[p.class]}</span>
                  </td>
                  <td data-label="Status" className="d-only">
                    <span className={`tag ${p.status}`}>{statusLabel(p.status)}</span>
                  </td>
                  <td className="r mono" data-label="Valuation">{fmt(p.valuation)}</td>
                  <td className="r mono" data-label="Debt">{d ? fmt(d) : "—"}</td>
                  <td className="r mono" data-label="Equity">{fmt(eqOf(p))}</td>
                  <td className="r mono" data-label="LTV">{d ? pct(l) : "—"}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="empty">
                No properties yet. Tap "+ Add property" to start the ledger.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="note">
        Tap any property to open its deal sheet — edit details, update valuations, log a sale, manage financing.
      </p>
    </section>
  );
}
