import type { Property, AssetClass } from "@/types";
import { CLASS_LABEL, debtOf, eqOf, flipCost, fmt, lotRollup, pct, realizedPL } from "@/lib/portfolio";

interface Event {
  date: string;
  ev: string;
  prop: string;
  amt: number;
  mar: number;
}

export default function DashboardView({ properties }: { properties: Property[] }) {
  const active = properties.filter((p) => p.status !== "sold");
  const totalAssets = active.reduce((s, p) => s + (+p.valuation || 0), 0);
  const totalDebt = active.reduce((s, p) => s + debtOf(p), 0);
  const totalEquity = totalAssets - totalDebt;

  const realized = properties
    .filter((p) => p.status === "sold")
    .reduce((s, p) => s + (realizedPL(p) || 0), 0);

  let lotsRemain = 0;
  let lotsVal = 0;
  properties
    .filter((p) => p.class === "land")
    .forEach((p) => {
      const r = lotRollup(p);
      lotsRemain += r.remain;
      lotsVal += r.remainVal;
    });

  const flipBasis = active.filter((p) => p.class === "flip").reduce((s, p) => s + flipCost(p), 0);

  const events: Event[] = [];
  properties.forEach((p) => {
    (p.lots || [])
      .filter((l) => l.status === "sold")
      .forEach((l) =>
        events.push({
          date: l.date || "",
          ev: "Lot sold",
          prop: `${p.name} · Lot ${l.n}`,
          amt: +(l.sale || 0),
          mar: (+(l.sale || 0)) - (+l.basis || 0),
        })
      );
    if (p.status === "sold")
      events.push({
        date: p.saleDate || "",
        ev: p.class === "flip" ? "Flip closed" : "Property sold",
        prop: p.name,
        amt: +(p.sale || 0),
        mar: realizedPL(p) || 0,
      });
  });
  events.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <section className="view active" id="dash">
      <div className="hero">
        <div className="eyebrow">Total portfolio equity</div>
        <div className="big mono">{fmt(totalEquity)}</div>
        <div className="delta">
          Gross asset value <b>{fmt(totalAssets)}</b> &nbsp;·&nbsp; Debt against portfolio{" "}
          <span className="mono">{fmt(totalDebt)}</span> &nbsp;·&nbsp; Blended LTV{" "}
          <b>{totalAssets ? pct(totalDebt / totalAssets) : "—"}</b>
        </div>
      </div>

      <div className="grid g4">
        <div className="stat">
          <div className="eyebrow">Active holdings</div>
          <div className="num">{active.length}</div>
          <div className="sub">across {new Set(active.map((p) => p.class)).size} asset classes</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Realized P&amp;L</div>
          <div className={`num ${realized >= 0 ? "pos" : "neg"}`}>{fmt(realized)}</div>
          <div className="sub">from closed deals &amp; lots</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Lots remaining</div>
          <div className="num">{lotsRemain}</div>
          <div className="sub">{fmt(lotsVal)} inventory value</div>
        </div>
        <div className="stat">
          <div className="eyebrow">Cash tied in flips</div>
          <div className="num">{fmt(flipBasis)}</div>
          <div className="sub">basis at risk</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Value by asset class</h2>
        <span className="eyebrow">equity contribution</span>
      </div>
      <div className="grid g3">
        {(["land", "rental", "flip"] as AssetClass[]).map((k) => {
          const set = active.filter((p) => p.class === k);
          const eq = set.reduce((s, p) => s + eqOf(p), 0);
          const share = totalEquity > 0 ? eq / totalEquity : 0;
          return (
            <div className="stat" key={k}>
              <div className="eyebrow">
                <span className={`tag ${k}`}>{CLASS_LABEL[k]}</span>
              </div>
              <div className="num" style={{ marginTop: 10 }}>{fmt(eq)}</div>
              <div className="meter">
                <i style={{ width: `${Math.max(0, Math.min(share * 100, 100)).toFixed(0)}%` }} />
              </div>
              <div className="sub">
                {pct(share)} of equity · {set.length} {set.length === 1 ? "property" : "properties"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Recent movement</h2>
        <span className="eyebrow">closed deals &amp; lot sales</span>
      </div>
      <table className="sheet">
        <thead>
          <tr>
            <th>Event</th>
            <th>Property</th>
            <th className="r">Amount</th>
            <th className="r">Margin</th>
          </tr>
        </thead>
        <tbody>
          {events.length ? (
            events.slice(0, 6).map((e, i) => (
              <tr key={i}>
                <td data-label="Event">
                  <span className="name">{e.ev}</span>
                  <div className="addr">{e.date}</div>
                </td>
                <td data-label="Property">{e.prop}</td>
                <td className="r mono" data-label="Amount">{fmt(e.amt)}</td>
                <td className={`r mono ${e.mar >= 0 ? "pos" : "neg"}`} data-label="Margin">
                  {e.mar >= 0 ? "+" : "−"}
                  {fmt(Math.abs(e.mar))}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="empty">No closed deals yet — sales will appear here.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
