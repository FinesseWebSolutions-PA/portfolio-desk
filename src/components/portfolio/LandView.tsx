import type { Lot, LotStatus, Property } from "@/types";
import { fmt, lotRollup } from "@/lib/portfolio";

interface Props {
  properties: Property[];
  onAddProject: () => void;
  onAddLot: (p: Property) => void;
  onEditLot: (p: Property, l: Lot) => void;
}

const SEGMENTS: { key: LotStatus; cls: string; lab: string }[] = [
  { key: "sold", cls: "lb-sold", lab: "sold" },
  { key: "uc", cls: "lb-uc", lab: "u/c" },
  { key: "listed", cls: "lb-listed", lab: "listed" },
  { key: "avail", cls: "lb-avail", lab: "open" },
];

export default function LandView({ properties, onAddProject, onAddLot, onEditLot }: Props) {
  const lands = properties.filter((p) => p.class === "land");

  return (
    <section className="view active" id="land">
      <div className="section-head">
        <h2>Development projects</h2>
        <div className="head-right">
          <span className="eyebrow">parent parcel → sellable lots</span>
          <button className="btn ghost" onClick={onAddProject}>+ New project</button>
        </div>
      </div>
      <div id="landWrap">
        {lands.length ? (
          lands.map((p) => {
            const r = lotRollup(p);
            const counts: Record<LotStatus, number> = { sold: 0, uc: 0, listed: 0, avail: 0 };
            (p.lots || []).forEach((l) => (counts[l.status] = (counts[l.status] || 0) + 1));
            return (
              <div key={p.id}>
                <div className="hero" style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div className="eyebrow">{p.name} · {p.addr}</div>
                    <button className="btn ghost sm" onClick={() => onAddLot(p)}>+ Add lot</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    <div>
                      <div className="num mono" style={{ fontSize: 30, fontWeight: 600 }}>{fmt(r.rev)}</div>
                      <div className="sub mono" style={{ color: "var(--muted)", fontSize: 11 }}>
                        realized from {r.sold} of {r.total} lots · margin <span className="pos">+{fmt(r.pl)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="num mono" style={{ fontSize: 22 }}>{fmt(r.remainVal)}</div>
                      <div className="sub mono" style={{ fontSize: 11, color: "var(--muted)" }}>{r.remain} lots remaining</div>
                    </div>
                  </div>
                  {r.total > 0 && (
                    <>
                      <div className="lotbar">
                        {SEGMENTS.map((s) =>
                          counts[s.key] ? (
                            <span key={s.key} className={s.cls} style={{ flex: counts[s.key] }}>
                              {counts[s.key]} {s.lab}
                            </span>
                          ) : null
                        )}
                      </div>
                      <div className="legend">
                        <span><i style={{ background: "#6f6a5b" }} />Sold</span>
                        <span><i style={{ background: "var(--gold)" }} />Under contract</span>
                        <span><i style={{ background: "var(--accent)" }} />Listed</span>
                        <span><i style={{ background: "#bcae8d" }} />Available</span>
                      </div>
                    </>
                  )}
                </div>
                {(p.lots || []).length ? (
                  <>
                    <table className="sheet" style={{ marginBottom: 26 }}>
                      <thead>
                        <tr>
                          <th>Lot</th>
                          <th>Status</th>
                          <th className="r">List</th>
                          <th className="r">Sold for</th>
                          <th className="r">Basis</th>
                          <th className="r">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(p.lots || []).map((l) => {
                          const m = l.status === "sold" ? (+(l.sale || 0)) - (+l.basis || 0) : (+l.list || 0) - (+l.basis || 0);
                          const stLab = l.status === "uc" ? "under contract" : l.status === "avail" ? "available" : l.status;
                          const stCls = l.status === "sold" ? "sold" : l.status === "listed" || l.status === "uc" ? "listed" : "active";
                          return (
                            <tr className="click" key={l.id} onClick={() => onEditLot(p, l)}>
                              <td className="name" data-label="Lot">Lot {l.n}</td>
                              <td data-label="Status"><span className={`tag ${stCls}`}>{stLab}</span></td>
                              <td className="r mono" data-label="List">{fmt(l.list)}</td>
                              <td className="r mono" data-label="Sold for">{l.sale ? fmt(l.sale) : "—"}</td>
                              <td className="r mono" data-label="Basis">{fmt(l.basis)}</td>
                              <td className={`r mono ${m >= 0 ? "pos" : "neg"}`} data-label="Margin">
                                {l.status === "sold" ? (
                                  <>{m >= 0 ? "+" : "−"}{fmt(Math.abs(m))}</>
                                ) : (
                                  <span style={{ color: "var(--muted)" }}>est {fmt(m)}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="note" style={{ margin: "-16px 0 26px" }}>
                      Tap a lot to update its status, price, or log a sale.
                    </p>
                  </>
                ) : (
                  <p className="empty" style={{ marginBottom: 26 }}>
                    No lots yet — add the first lot to start the sell-down ledger.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="empty">No development projects yet. Tap "+ New project" to add a parcel.</p>
        )}
      </div>
    </section>
  );
}
