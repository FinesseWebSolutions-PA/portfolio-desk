import { useEffect, useMemo, useState } from "react";
import type { FieldDef, ModalConfig } from "@/types";
import { num } from "@/lib/portfolio";

interface Props {
  config: ModalConfig;
  onClose: () => void;
}

function initValue(f: FieldDef, initial?: ModalConfig["initial"]): string {
  const raw = initial?.[f.key];
  if (raw == null || raw === "") {
    if (f.type === "select" && f.options?.length) return String(f.options[0].v);
    return "";
  }
  if (f.type === "money") return Number(raw).toLocaleString("en-US");
  return String(raw);
}

export default function FormModal({ config, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    config.fields.forEach((f) => (v[f.key] = initValue(f, config.initial)));
    return v;
  });

  const visible = useMemo(
    () => config.fields.filter((f) => !f.showIf || f.showIf(values)),
    [config.fields, values]
  );

  const set = (key: string, val: string) => setValues((v) => ({ ...v, [key]: val }));

  const save = () => {
    const out: Record<string, string | number> = {};
    config.fields.forEach((f) => {
      const v = values[f.key] ?? "";
      out[f.key] = f.type === "money" || f.type === "number" ? num(v) : v;
    });
    config.onSave(out); // parent closes on success
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-wrap open">
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <h3>{config.title}</h3>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {visible.map((f, i) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              {f.type === "select" ? (
                <select value={values[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  {(f.options || []).map((o) => (
                    <option key={o.v} value={o.v}>{o.t}</option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus={i === 0}
                  type={f.type === "date" ? "date" : f.type === "month" ? "month" : "text"}
                  inputMode={f.type === "money" || f.type === "number" ? "decimal" : undefined}
                  placeholder={f.ph || ""}
                  value={values[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
              {f.hint && <div className="hint">{f.hint}</div>}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
