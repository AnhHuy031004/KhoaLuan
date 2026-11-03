import React, { useState } from "react";
import { api, IS_MOCK } from "../../../services/api/index.js";
import { id } from "../../../../mock/seed.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useLookups } from "../../../shared/providers/LookupProvider.jsx";
import { operation } from "../../../services/api/schema.js";
import { Loading, Empty, ErrorState, DataView } from "../../../shared/components/index.jsx";
const reports = [["Doanh thu", "GET /admin/reports/revenue", ["ADMIN"]], ["Chốt học phí", "GET /admin/reports/tuition", ["ADMIN"]], ["Điểm danh tháng", "GET /admin/reports/attendance", ["ADMIN", "INSTRUCTOR"]], ["Phân bố cấp đai", "GET /admin/reports/belts", ["ADMIN", "INSTRUCTOR"]], ["Tổng hợp một võ sinh", "GET /attendance/summary", ["ADMIN", "INSTRUCTOR"]]];
export function Reports() {
  const {
    user
  } = useAuth();
  const {
    lookups
  } = useLookups();
  const options = reports.filter(x => x[2].includes(user.role));
  const [chosen, setChosen] = useState(options[0][1]),
    [query, setQuery] = useState(IS_MOCK ? {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      studentId: id(1, 1)
    } : {}),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const op = operation(chosen);
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ĐIỀU HÀNH</span>
          <h1>Báo cáo</h1>
          <p>Chọn phạm vi trước khi tải số liệu tổng hợp.</p>
        </div>
      </div>
      <section className="panel">
        <div className="tab-row">
          {options.map(([title, key]) => <button key={key} className={key === chosen ? "primary" : "secondary"} onClick={() => {
          setChosen(key);
          setResult(null);
          setError(null);
          setQuery(IS_MOCK ? {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
            to: new Date().toISOString().slice(0, 10),
            studentId: id(1, 1)
          } : {});
        }}>
              {title}
            </button>)}
        </div>
        <form className="filter-panel inside" onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setResult(null);
        try {
          setResult(await api.request(op.path, {
            query
          }));
        } catch (err) {
          setError(err);
        } finally {
          setBusy(false);
        }
      }}>
          {op.parameters.filter(p => p.in === "query").map(p => <label key={p.name}>
                {{
            from: "Từ ngày",
            to: "Đến ngày",
            studentId: "Mã võ sinh",
            month: "Tháng",
            year: "Năm"
          }[p.name] || p.name}
                {p.required ? " *" : ""}
                <input list={p.name === "studentId" ? "report-students" : undefined} type={p.schema.type === "integer" || p.schema.type === "number" ? "number" : p.name === "month" && p.schema.type === "string" ? "month" : ["from", "to"].includes(p.name) ? "date" : "text"} min={p.schema.minimum} max={p.schema.maximum} required={p.required} value={query[p.name] || ""} onChange={e => setQuery({
            ...query,
            [p.name]: e.target.value
          })} />
              </label>)}
          <datalist id="report-students">
            {lookups.students?.map(s => <option key={s.id} value={s.id}>
                {s.fullName}
              </option>)}
          </datalist>
          <button disabled={busy || false} className="primary">
            Tải báo cáo
          </button>
        </form>
        {busy ? <Loading /> : error ? <ErrorState error={error} /> : result ? <DataView data={result} /> : <Empty text="Chọn loại báo cáo và nhấn Tải báo cáo." />}
      </section>
    </>;
}
