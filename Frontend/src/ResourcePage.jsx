import ScoreResultDialog from "./exams/ScoreResultDialog";
import { readScores } from "./exams/scores";
import React, { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Eye, PenLine, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { api, IS_MOCK } from "./api";
import { id } from "../mock/seed";
import { operation, operationPath, listData, canUse, resolveSchema } from "./api/schema";
import { useAuth } from "./auth";
import { useLookups } from "./context";
import { useRemote } from "./hooks";
import { Loading, Empty, ErrorState, DataView, Modal, OperationDialog } from "./components";
import { label, display, enumLabels } from "./labels";
export function Cell({
  value,
  name,
  lookups
}) {
  if (name === "currentBeltRankId") value = lookups.ranks?.find(x => String(x.id) === String(value))?.name || value;
  if (["status", "role", "isActive"].includes(name)) return <span className={"badge badge-" + String(value).toLowerCase()}>
        {display(value, name)}
      </span>;
  return <span className={name === "body" ? "cell-body" : ""}>
      {display(value, name)}
    </span>;
}
export default function ResourcePage({
  module: m
}) {
  const {
    user,
    expire
  } = useAuth();
  const {
    lookups,
    studentId,
    reloadLookups
  } = useLookups();
  const op = operation(m.list);
  const params = op.parameters.filter(p => p.in === "query" && !["page", "limit"].includes(p.name));
  const defaults = () => {
    const d = {};
    for (const p of params) if (p.name === "studentId" && studentId) d.studentId = studentId;
    if (IS_MOCK) {
      for (const p of params) {
        if (p.required && p.name === "studentId" && !d.studentId) d.studentId = id(1, 1);
        if (p.required && p.name === "invoiceId") d.invoiceId = id(5, 1);
      }
      if (m.studentPath && !studentId) d.studentId = id(1, 1);
    }
    return d;
  };
  const [draft, setDraft] = useState(defaults),
    [query, setQuery] = useState(defaults),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20),
    [action, setAction] = useState(null),
    [record, setRecord] = useState(null),
    [detail, setDetail] = useState(null),
    [detailError, setDetailError] = useState(null),
    [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    if (studentId && (m.studentPath || params.some(p => p.name === "studentId"))) {
      setDraft(v => ({
        ...v,
        studentId
      }));
      setQuery(v => ({
        ...v,
        studentId
      }));
      setPage(1);
    }
  }, [studentId, m.id]);
  const paginated = op.parameters.some(p => p.name === "page");
  const missing = params.filter(p => p.required && !query[p.name]);
  if (m.studentPath && !studentId && !query.studentId) missing.push({
    name: "studentId"
  });
  const pathParams = {
    id: studentId || query.studentId
  };
  const key = JSON.stringify({
    query,
    page,
    pageSize,
    pathParams
  });
  const state = useRemote(signal => api.request(operationPath(m.list, pathParams), {
    query: {
      ...Object.fromEntries(Object.entries(query).filter(([k]) => !m.studentPath || k !== "studentId")),
      ...(paginated ? {
        page,
        limit: pageSize
      } : {})
    },
    signal
  }), [m.id, key, false], !missing.length);
  const {
    items: rawItems,
    total
  } = listData(state.data);
  const items = m.id === "exam-results" ? rawItems.map(row => readScores(row, lookups.students)) : rawItems;
  const columns = m.columns || Object.keys(items[0] || {}).filter(x => x !== "id").slice(0, 6);
  const can = key => key && canUse(key, user.role);
  async function openDetail(row) {
    setDetail(row);
    setDetailLoading(true);
    setDetailError(null);
    try {
      if (m.detail) setDetail(await api.request(operationPath(m.detail, {
        id: row.id
      })));
    } catch (e) {
      setDetailError(e);
    } finally {
      setDetailLoading(false);
    }
  }
  function trigger(a, row = null) {
    setRecord(row);
    setAction(a);
  }
  function done() {
    state.reload();
    reloadLookups();
    if (action?.logout) expire();
  }
  function controls() {
    const extra = m.studentPath && !["STUDENT", "PARENT"].includes(user.role) ? [{
      name: "studentId",
      schema: {
        type: "string"
      },
      required: true
    }] : [];
    return [...extra, ...params].map(p => {
      const s = resolveSchema(p.schema),
        list = p.name === "studentId" ? lookups.students : p.name === "classId" ? lookups.classes : p.name === "invoiceId" ? lookups.invoices : null;
      return <label key={p.name}>
          {label(p.name)}
          {p.required ? " *" : ""}
          {s.enum ? <select value={draft[p.name] || ""} onChange={e => setDraft({
          ...draft,
          [p.name]: e.target.value
        })}>
              <option value="">Tất cả</option>
              {s.enum.map(v => <option key={v} value={v}>
                  {enumLabels[v] || v}
                </option>)}
            </select> : list ? <>
              <input list={"filter-" + p.name} required={p.required} value={draft[p.name] || ""} onChange={e => setDraft({
            ...draft,
            [p.name]: e.target.value
          })} />
              <datalist id={"filter-" + p.name}>
                {list.map(v => <option key={v.id} value={v.id}>
                    {v.fullName || v.name || v.invoiceNo || v.id}
                  </option>)}
              </datalist>
            </> : <input required={p.required} type={/^(from|to)$/.test(p.name) ? "date" : p.name === "month" && s.type === "string" ? "month" : s.type === "integer" || s.type === "number" ? "number" : "text"} value={draft[p.name] || ""} placeholder={p.name === "search" ? "Nhập ít nhất 2 ký tự…" : undefined} min={p.name === "search" ? undefined : s.minimum} onChange={e => setDraft({
          ...draft,
          [p.name]: e.target.value
        })} />}
        </label>;
    });
  }
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">VOVINAM / {m.group}</span>
          <h1>{m.title}</h1>
          <p>
            {"Dữ liệu từ hệ thống, theo quyền tài khoản của bạn."}
          </p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={state.reload} disabled={state.loading}>
            <RefreshCw size={16} />
            Tải lại
          </button>
          {(m.topActions || []).filter(a => a.roles.includes(user.role)).map(a => <button key={a.key} className="secondary" onClick={() => trigger(a)}>
                {a.title}
              </button>)}
          {can(m.create) && <button className="primary" onClick={() => trigger({
          key: m.create,
          title: "Thêm " + m.title.toLowerCase()
        })}>
              <Plus size={17} />
              Thêm mới
            </button>}
        </div>
      </div>
      {(params.length > 0 || m.studentPath) && <form className="filter-panel" onSubmit={e => {
      e.preventDefault();
      if (draft.search && draft.search.length < 2) return;
      setPage(1);
      setQuery(draft);
    }}>
          {controls()}
          <button className="primary">Áp dụng</button>
          <button type="button" className="secondary" onClick={() => {
        setDraft(defaults());
        setQuery(defaults());
        setPage(1);
      }}>
            Đặt lại
          </button>
        </form>}
      <section className="panel table-panel">
        {missing.length ? <Empty text={"Chọn " + missing.map(p => label(p.name).toLowerCase()).join(", ") + " và nhấn Áp dụng để xem dữ liệu."} /> : state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : !items.length ? <Empty /> : <>
            <div className="table-scroll">
              <table className={m.id === "exam-results" ? "score-sheet" : undefined}>
                <thead>
                  <tr>
                    {columns.map(c => <th key={c}>{m.columnLabels?.[c] || label(c)}</th>)}
                    <th className="align-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => <tr key={row.id || i}>
                      {columns.map((c, j) => <td key={c} className={m.id === "exam-results" && ["quyenScore", "theoryFitnessScore", "basicScore", "sparringScore", "totalScore"].includes(c) ? "score-number" : undefined}>
                          {j === 0 ? <strong>
                              <Cell value={row[c]} name={c} lookups={lookups} />
                            </strong> : <Cell value={row[c]} name={c} lookups={lookups} />}
                        </td>)}
                      <td className="align-end">
                        <div className="row-actions">
                          <button className="icon-button" title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => openDetail(row)}>
                            <Eye size={16} />
                          </button>
                          {can(m.edit) && <button className="icon-button" aria-label="Chỉnh sửa" onClick={() => trigger({
                      key: m.edit,
                      title: "Chỉnh sửa " + m.title.toLowerCase()
                    }, row)}>
                              <PenLine size={15} />
                            </button>}
                          {can(m.remove) && <button className="icon-button danger" aria-label="Xóa hoặc ngừng hoạt động" onClick={() => trigger({
                      key: m.remove,
                      title: "Xóa / ngừng hoạt động",
                      danger: true
                    }, row)}>
                              <Trash2 size={15} />
                            </button>}
                          {m.actions?.filter(a => a.roles.includes(user.role)).map(a => <button key={a.key} className="small-button" onClick={() => trigger(a, row)}>
                                {a.title}
                              </button>)}
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">
              <span>
                {total} bản ghi{paginated ? " · Trang " + page : ""}
              </span>
              {paginated && <div className="row">
                  <select aria-label="Số dòng mỗi trang" value={pageSize} onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}>
                    <option value="10">10 dòng</option>
                    <option value="20">20 dòng</option>
                    <option value="50">50 dòng</option>
                    <option value="100">100 dòng</option>
                  </select>
                  <button className="icon-button" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage(v => v - 1)}>
                    <ChevronLeft size={17} />
                  </button>
                  <button className="icon-button" aria-label="Trang sau" disabled={page * pageSize >= total} onClick={() => setPage(v => v + 1)}>
                    <ChevronRight size={17} />
                  </button>
                </div>}
            </footer>
          </>}
      </section>
      {detail && <Modal title="Thông tin chi tiết" onClose={() => setDetail(null)} wide>
          <div className="modal-body">
            {detailLoading ? <Loading /> : detailError ? <ErrorState error={detailError} /> : <DataView data={detail} />}
            {m.id === "classes" && detail.schedules?.length > 0 && user.role === "ADMIN" && true && <div className="actions">
                  {detail.schedules.map(s => <button className="secondary danger" key={s.id} onClick={() => {
            setDetail(null);
            trigger({
              key: "DELETE /classes/{id}/schedules/{scheduleId}",
              title: "Xóa lịch tập",
              danger: true,
              extra: {
                scheduleId: s.id
              }
            }, detail);
          }}>
                      Xóa lịch {s.startTime} · ngày {s.weekday}
                    </button>)}
                </div>}
          </div>
        </Modal>}
      {action && m.id === "exam-results" && record ? <ScoreResultDialog key={record.id} record={record} students={lookups.students} onClose={() => setAction(null)} onComplete={done} /> : action && <OperationDialog key={action.key + "-" + (record?.id || "new")} action={action} lookups={lookups} initial={record && action.key === m.edit ? record : {}} params={{
      id: record?.id,
      invoiceId: record?.id,
      studentId: record?.id,
      ...action.extra
    }} onClose={() => setAction(null)} onComplete={done} />}
    </>;
}
