import React, { useEffect, useState } from "react";
import { CalendarDays, Plus, Save, RefreshCw } from "lucide-react";
import { api, API_BASE, IS_MOCK } from "./api";
import { id } from "../mock/seed";
import { useAuth } from "./auth";
import { useLookups } from "./context";
import { useRemote } from "./hooks";
import { listData, operation, operationPath } from "./api/schema";
import { Loading, Empty, ErrorState, DataView, Modal, OperationDialog } from "./components";
import { enumLabels, display, ROLE_LABEL } from "./labels";
const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
export function Schedules() {
  const {
    user
  } = useAuth();
  const {
    lookups,
    reloadLookups
  } = useLookups();
  const [action, setAction] = useState(null),
    [params, setParams] = useState({});
  const state = useRemote(signal => api.request("/classes", {
    query: {
      page: 1,
      limit: 100
    },
    signal
  }), [false]);
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ĐÀO TẠO</span>
          <h1>Lịch tập định kỳ</h1>
          <p>Khung giờ và hiệu lực theo lịch của từng lớp.</p>
        </div>
        <button className="secondary" onClick={state.reload}>
          <RefreshCw size={15} />
          Tải lại
        </button>
      </div>
      {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <div className="schedule-grid">
          {listData(state.data).items.map(c => <section className="panel" key={c.id}>
              <div className="panel-heading">
                <h2>{c.name}</h2>
                {user.role === "ADMIN" && <button className="icon-button" aria-label={"Thêm lịch " + c.name} onClick={() => {
            setParams({
              id: c.id
            });
            setAction({
              key: "POST /classes/{id}/schedules",
              title: "Thêm lịch tập"
            });
          }}>
                    <Plus size={18} />
                  </button>}
              </div>
              <p className="hint">
                {c.location || "Chưa cập nhật địa điểm"} · {display(c.status)}
              </p>
              {c.schedules?.length ? c.schedules.map(s => <div className="schedule-slot" key={s.id}>
                    <CalendarDays size={19} />
                    <div>
                      <strong>
                        {days[s.weekday]} · {s.startTime}–{s.endTime}
                      </strong>
                      <p>
                        {display(s.effectiveFrom)} →{" "}
                        {s.effectiveTo ? display(s.effectiveTo) : "Không giới hạn"}
                      </p>
                    </div>
                  </div>) : <Empty text="Lớp chưa có lịch tập." />}
            </section>)}
        </div>}
      {action && <OperationDialog key={action.key} action={action} params={params} lookups={lookups} onClose={() => setAction(null)} onComplete={() => {
      state.reload();
      reloadLookups();
    }} />}
    </>;
}
export function Attendance() {
  const {
    user
  } = useAuth();
  const {
    lookups
  } = useLookups();
  const cacheKey = (IS_MOCK ? "mock:" : "") + "vovinam-attendance-" + user.id;
  const [saved] = useState(() => {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "{}");
        return cached.id ? cached : IS_MOCK ? { id: id(7, 1), classId: id(2, 1) } : {};
      } catch {
        return {};
      }
    }),
    [classId, setClassId] = useState(saved.classId || ""),
    [sessionId, setSessionId] = useState(saved.id || ""),
    [draftId, setDraftId] = useState(saved.id || ""),
    [create, setCreate] = useState(false),
    [records, setRecords] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [message, setMessage] = useState("");
  const state = useRemote(async signal => {
    const old = await api.request("/attendance-sessions/" + encodeURIComponent(sessionId) + "/records", {
      signal
    });
    let roster = [];
    if (classId) {
      let page = 1;
      while (true) {
        const data = await api.request("/students", {
          query: {
            classId,
            page,
            limit: 100
          },
          signal
        });
        const chunk = listData(data);
        roster.push(...chunk.items);
        if (roster.length >= chunk.total || !chunk.items.length) break;
        page++;
        if (page > 10) throw Error("Danh sách lớp quá lớn. Vui lòng tải lại theo trang.");
      }
    }
    const oldRows = listData(old).items;
    return roster.length ? roster.map(s => ({
      studentId: s.id,
      fullName: s.fullName,
      status: oldRows.find(r => r.studentId === s.id)?.status || "",
      note: oldRows.find(r => r.studentId === s.id)?.note || ""
    })) : oldRows;
  }, [sessionId, classId, false], !!sessionId);
  useEffect(() => {
    if (state.data) setRecords(state.data);
  }, [state.data]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError(null);
    try {
      if (records.some(r => !r.status)) throw Error("Chọn trạng thái cho tất cả võ sinh trước khi lưu.");
      await api.request("/attendance-sessions/" + encodeURIComponent(sessionId) + "/records", {
        method: "POST",
        body: {
          records: records.map(({
            studentId,
            status,
            note
          }) => ({
            studentId,
            status,
            ...(note ? {
              note
            } : {})
          }))
        }
      });
      setMessage(IS_MOCK ? "Đã lưu điểm danh vào dữ liệu mẫu trên trình duyệt." : "Đã lưu điểm danh lên máy chủ.");
      state.reload();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ĐÀO TẠO</span>
          <h1>Điểm danh buổi tập</h1>
          <p>Tạo buổi tập, chọn trạng thái và lưu danh sách võ sinh.</p>
        </div>
        <button className="primary" onClick={() => setCreate(true)}>
          <Plus size={16} />
          Tạo buổi tập
        </button>
      </div>
      <form className="filter-panel" onSubmit={e => {
      e.preventDefault();
      setSessionId(draftId);
      sessionStorage.setItem(cacheKey, JSON.stringify({
        id: draftId,
        classId
      }));
      state.reload();
    }}>
        <label>
          Lớp học
          <select value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">Chọn lớp để nạp danh sách võ sinh</option>
            {lookups.classes?.map(c => <option key={c.id} value={c.id}>
                {c.name}
              </option>)}
          </select>
        </label>
        <label>
          Mã buổi tập
          <input required value={draftId} onChange={e => setDraftId(e.target.value)} placeholder="Mã trả về khi tạo buổi tập" />
        </label>
        <button className="secondary">Mở buổi tập</button>
      </form>
      {sessionId && <div className="quiet-note">
          Mã buổi hiện tại: <code>{sessionId}</code>. Lưu lại mã này để mở lại
          buổi tập. API hiện chưa có endpoint liệt kê buổi tập.
        </div>}
      {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : !records.length ? <Empty text="Tạo hoặc mở buổi tập để bắt đầu điểm danh." /> : <form className="panel" onSubmit={save}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Võ sinh</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => <tr key={r.studentId}>
                    <td>
                      <strong>{r.fullName || r.studentId}</strong>
                    </td>
                    <td>
                      <select required value={r.status} aria-label={"Điểm danh " + (r.fullName || r.studentId)} onChange={e => setRecords(records.map((v, j) => i === j ? {
                  ...v,
                  status: e.target.value
                } : v))}>
                        <option value="">Chọn trạng thái</option>
                        {["PRESENT", "LATE", "ABSENT", "EXCUSED"].map(s => <option key={s} value={s}>
                            {enumLabels[s]}
                          </option>)}
                      </select>
                    </td>
                    <td>
                      <input aria-label={"Ghi chú " + (r.fullName || r.studentId)} value={r.note || ""} onChange={e => setRecords(records.map((v, j) => i === j ? {
                  ...v,
                  note: e.target.value
                } : v))} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {error && <ErrorState error={error} />}
          {message && <div className="success-note" role="status">
              {message}
            </div>}
          <div className="modal-footer">
            <button className="primary" disabled={busy || !sessionId}>
              <Save size={16} />
              {busy ? "Đang lưu…" : "Lưu điểm danh"}
            </button>
          </div>
        </form>}
      {create && <OperationDialog action={{
      key: "POST /attendance-sessions",
      title: "Tạo buổi điểm danh"
    }} lookups={lookups} onClose={() => setCreate(false)} onComplete={data => {
      setSessionId(data.id);
      setDraftId(data.id);
      setClassId(data.classId);
      sessionStorage.setItem(cacheKey, JSON.stringify({
        id: data.id,
        classId: data.classId
      }));
    }} />}
    </>;
}
export function Profile() {
  const {
    user
  } = useAuth();
  const {
    lookups,
    reloadLookups
  } = useLookups();
  const [edit, setEdit] = useState(false);
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CÁ NHÂN</span>
          <h1>Hồ sơ cá nhân</h1>
          <p>Thông tin tài khoản và hồ sơ tập luyện.</p>
        </div>
        {user.role === "STUDENT" && <button className="primary" onClick={() => setEdit(true)}>
            Cập nhật liên hệ
          </button>}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <h2>Tài khoản</h2>
          <DataView data={{
          email: user.email,
          role: ROLE_LABEL[user.role],
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt
        }} />
        </section>
        <section className="panel">
          <h2>Hồ sơ võ sinh</h2>
          {["STUDENT", "PARENT"].includes(user.role) ? lookups.students?.length ? <DataView data={lookups.students} /> : <Empty text="Chưa có hồ sơ võ sinh liên kết. Liên hệ quản trị viên hoặc liên kết bằng mã mời." /> : <p className="quiet-note">
              Thông tin chuyên môn và lớp phụ trách được quản lý trong danh mục
              lớp học.
            </p>}
        </section>
      </div>
      {edit && <OperationDialog action={{
      key: "PATCH /students/me",
      title: "Cập nhật thông tin liên hệ"
    }} initial={lookups.students?.[0]} lookups={lookups} onClose={() => setEdit(false)} onComplete={reloadLookups} />}
    </>;
}
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
    [query, setQuery] = useState(IS_MOCK ? {month:new Date().getMonth()+1,year:new Date().getFullYear(),from:new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10),to:new Date().toISOString().slice(0,10),studentId:id(1,1)} : {}),
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
          setQuery(IS_MOCK ? {month:new Date().getMonth()+1,year:new Date().getFullYear(),from:new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10),to:new Date().toISOString().slice(0,10),studentId:id(1,1)} : {});
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
export function Billing() {
  const {} = useAuth();
  const {
    lookups
  } = useLookups();
  const state = useRemote(signal => api.request("/admin/billing/settings", {
    signal
  }), [false]);
  const [action, setAction] = useState(null);
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TÀI CHÍNH</span>
          <h1>Cấu hình & chốt học phí</h1>
          <p>Học phí từng lớp và tài khoản ngân hàng nhận tiền.</p>
        </div>
      </div>
      <div className="actions mb">
        {[["Chốt học phí tháng", "POST /admin/billing/generate-monthly"], ["Cập nhật học phí từng lớp", "PUT /admin/billing/settings/tuition-rates"], ["Tài khoản ngân hàng", "PUT /admin/billing/settings/bank-account"]].map(([title, key]) => <button className="secondary" key={key} onClick={() => setAction({
        title,
        key
      })}>
            {title}
          </button>)}
      </div>
      <div className="warning-note">
        Cập nhật mức học phí thay thế toàn bộ bảng giá hiện có. Hãy nhập đủ các
        lớp cần giữ lại trước khi xác nhận.
      </div>
      <section className="panel">
        {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <DataView data={state.data} />}
      </section>
      {action && <OperationDialog key={action.key} action={action} lookups={lookups} onClose={() => setAction(null)} onComplete={state.reload} />}
    </>;
}
export function Security() {
  const {
    expire
  } = useAuth();
  const {
    lookups
  } = useLookups();
  const [action, setAction] = useState(null);
  const state = useRemote(signal => api.request("/auth/mfa/methods", {
    signal
  }), [false]);
  const actions = [["Đổi mật khẩu", "POST /auth/change-password"], ["Đổi email", "POST /auth/change-email/request"], ["Xác nhận email mới", "POST /auth/change-email/confirm"], ["Bắt đầu bật xác thực TOTP", "POST /auth/mfa/totp/enable"], ["Xác nhận bật TOTP", "POST /auth/mfa/totp/verify"], ["Kiểm tra mã TOTP", "POST /auth/mfa/totp/validate"], ["Tắt TOTP", "POST /auth/mfa/totp/disable"]];
  return <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CÁ NHÂN</span>
          <h1>Bảo mật tài khoản</h1>
          <p>Mật khẩu, email và xác thực hai bước.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Phương thức xác thực</h2>
        {state.loading ? <Loading /> : state.error ? <ErrorState error={state.error} retry={state.reload} /> : <DataView data={state.data} />}
        <div className="actions">
          {actions.map(([title, key]) => <button key={key} className="secondary" onClick={() => setAction({
          title,
          key
        })}>
              {title}
            </button>)}
        </div>
        <p className="quiet-note">
          Bật TOTP gồm hai bước: quét QR bằng ứng dụng xác thực, sau đó xác nhận
          bằng mã TOTP. Lưu các mã khôi phục tại nơi riêng tư.
        </p>
      </section>
      {action && <OperationDialog key={action.key} action={action} lookups={lookups} onClose={() => setAction(null)} onComplete={state.reload} />}
    </>;
}
