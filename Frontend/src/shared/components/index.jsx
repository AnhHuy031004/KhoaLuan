import React, { useEffect, useRef, useState } from "react";
import { X, LoaderCircle, AlertCircle, RefreshCw, Plus, Trash2 } from "lucide-react";
import { api } from "../../services/api/index.js";
import { operation, operationPath, packBody, resolveSchema } from "../../services/api/schema.js";
import { display, label, enumLabels } from "../utils/labels.js";
export function Loading({
  text = "Đang tải dữ liệu…"
}) {
  return <div className="state">
      <LoaderCircle className="spin" />
      <span>{text}</span>
    </div>;
}
export function ErrorState({
  error,
  retry
}) {
  return <div className="error-state" role="alert">
      <AlertCircle />
      <div>
        <strong>
          {error?.status === 403 ? "Bạn không có quyền thực hiện thao tác này." : error?.message || String(error)}
        </strong>
        {error?.status === 409 && <p>Dữ liệu hoặc trạng thái hiện tại chưa cho phép thao tác.</p>}
      </div>
      {retry && <button onClick={retry} className="secondary">
          <RefreshCw size={15} />
          Thử lại
        </button>}
    </div>;
}
export function Empty({
  text = "Chưa có dữ liệu phù hợp."
}) {
  return <div className="state">
      <span className="empty-symbol">◇</span>
      <p>{text}</p>
    </div>;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false
}) {
  const ref = useRef(null);
  useEffect(() => {
    const old = document.activeElement;
    ref.current.showModal();
    return () => {
      old?.focus?.();
    };
  }, []);
  return <dialog ref={ref} className={"modal " + (wide ? "wide" : "")} onCancel={e => {
    e.preventDefault();
    onClose();
  }}>
      <header>
        <h2>{title}</h2>
        <button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}>
          <X />
        </button>
      </header>
      {children}
    </dialog>;
}
export function DataView({
  data
}) {
  if (data === null || data === undefined) return <Empty />;
  if (typeof data !== "object") return <p className="break">{display(data)}</p>;
  if (Array.isArray(data)) return <div className="record-list">
        {data.map((v, i) => <section key={i} className="record-item">
            <DataView data={v} />
          </section>)}
      </div>;
  return <dl className="record">
      {Object.entries(data).map(([key, v]) => <React.Fragment key={key}>
          <dt>{label(key)}</dt>
          <dd>
            {typeof v === "object" && v !== null ? <DataView data={v} /> : <span className="break">{display(v, key)}</span>}
          </dd>
        </React.Fragment>)}
    </dl>;
}
export function ResultView({
  data
}) {
  const qr = data?.qrCodeDataUrl || data?.qrDataUrl;
  let checkout = null;
  try {
    const u = new URL(data?.checkoutUrl);
    if (u.protocol === "https:") checkout = u.href;
  } catch {
    /* Missing/simulated checkout. */
  }
  const visible = {
    ...data
  };
  delete visible.qrCodeDataUrl;
  delete visible.qrDataUrl;
  delete visible.checkoutUrl;
  return <>
      <div className="success-note">Yêu cầu đã được API xử lý thành công.</div>
      {qr && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(qr) && <img className="qr-image" alt="Mã QR do máy chủ cung cấp" src={qr} />}
      {checkout && <a className="primary" href={checkout} target="_blank" rel="noopener noreferrer">
          Mở trang thanh toán
        </a>}
      {data?.status === "PENDING" && data?.orderRef && <p className="hint">
          Giao dịch đang chờ xác nhận từ máy chủ. Kiểm tra lại lịch sử giao dịch
          sau khi thanh toán.
        </p>}
      <DataView data={data && typeof data === "object" ? visible : data} />
    </>;
}
export function SchemaFields({
  schema,
  values = {},
  onChange,
  lookups = {},
  prefix = "form",
  depth = 0
}) {
  schema = resolveSchema(schema);
  return <div className={"form-grid " + (depth ? "nested" : "")}>
      {Object.entries(schema.properties || {}).map(([key, raw]) => {
      const s = resolveSchema(raw),
        required = (schema.required || []).includes(key),
        value = values[key] ?? "",
        id = prefix + "-" + key,
        update = v => onChange({
          ...values,
          [key]: v
        });
      let options = s.enum?.map(v => ({
        value: v,
        label: enumLabels[v] || String(v)
      }));
      const relation = /^(studentId|classId|instructorId|currentBeltRankId|targetRankId|proposedRankId|invoiceId|examinerId)$/.test(key);
      const relationKey = key === "studentId" ? "students" : key === "classId" ? "classes" : key === "invoiceId" ? "invoices" : /RankId/.test(key) ? "ranks" : "users";
      const list = lookups[relationKey] || [];
      const isDate = s.format === "date" || /^(dob|dateOfBirth|sessionDate|examDate|effectiveFrom|effectiveTo|dueDate)$/.test(key);
      const isDateTime = s.format === "date-time";
      const password = /password/i.test(key);
      const long = /^(body|reason|note|comment|medicalNotes|resultNote|reviewNote|description)$/.test(key);
      if (s.type === "array") {
        const items = Array.isArray(value) ? value : [];
        return <fieldset key={key} className="span-all array-field">
              <legend>
                {label(key)}
                {required ? " *" : ""}
              </legend>
              {items.map((item, index) => <div key={index} className="array-item">
                  {resolveSchema(s.items).type === "object" || resolveSchema(s.items).properties ? <SchemaFields schema={s.items} values={item} lookups={lookups} prefix={id + "-" + index} depth={depth + 1} onChange={v => update(items.map((x, i) => i === index ? v : x))} /> : <label>
                      {label(key)} {index + 1}
                      <input required value={item} list={key === "classIds" ? "lookup-classes" : undefined} onChange={e => update(items.map((x, i) => i === index ? e.target.value : x))} />
                    </label>}
                  <button type="button" className="icon-button danger" aria-label={"Xóa dòng " + (index + 1)} onClick={() => update(items.filter((_, i) => i !== index))}>
                    <Trash2 size={16} />
                  </button>
                </div>)}
              <button type="button" className="secondary" disabled={items.length >= (s.maxItems || 100)} onClick={() => update([...items, resolveSchema(s.items).type === "object" || resolveSchema(s.items).properties ? {} : ""])}>
                <Plus size={15} />
                Thêm dòng
              </button>
            </fieldset>;
      }
      if (s.type === "object" || s.properties) return <fieldset key={key} className="span-all">
              <legend>
                {label(key)}
                {required ? " *" : ""}
              </legend>
              <SchemaFields schema={s} values={typeof value === "object" ? value : {}} onChange={update} lookups={lookups} prefix={id} depth={depth + 1} />
            </fieldset>;
      if (key === "weekday") options = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"].map((v, i) => ({
        value: i,
        label: v
      }));
      const type = password ? "password" : /email/i.test(key) ? "email" : isDate ? "date" : isDateTime ? "datetime-local" : /^(startTime|endTime)$/.test(key) ? "time" : s.type === "number" || s.type === "integer" ? "number" : "text";
      let inputValue = value;
      if (isDate && value) inputValue = String(value).slice(0, 10);
      if (isDateTime && value) {
        const d = new Date(value);
        if (!isNaN(d)) inputValue = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      return <label key={key} className={long ? "span-all" : ""} htmlFor={id}>
            <span>
              {label(key)}
              {required && <b className="required"> *</b>}
            </span>
            {s.type === "boolean" ? <select id={id} value={String(value)} required={required} onChange={e => update(e.target.value)}>
                <option value="">Không thay đổi / chưa chọn</option>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select> : options ? <select id={id} required={required} value={value} onChange={e => update(e.target.value)}>
                <option value="">Chọn {label(key).toLowerCase()}</option>
                {options.map(v => <option value={v.value} key={v.value}>
                    {v.label}
                  </option>)}
              </select> : long ? <textarea id={id} rows={3} required={required} maxLength={s.maxLength} value={value} onChange={e => update(e.target.value)} /> : <input id={id} value={inputValue} type={type} required={required} min={s.minimum} max={s.maximum} minLength={s.minLength} maxLength={s.maxLength} step={type === "number" ? "any" : undefined} list={relation ? id + "-options" : undefined} autoComplete={password ? "new-password" : "off"} onChange={e => update(e.target.value)} />}
            {relation && <>
                <datalist id={id + "-options"}>
                  {list.map(v => <option key={v.id} value={v.id}>
                      {v.fullName || v.name || v.invoiceNo || v.email || v.id}
                    </option>)}
                </datalist>
                <small>
                  Chọn gợi ý hoặc nhập mã {label(key).toLowerCase()} hợp lệ.
                </small>
              </>}
            {key === "rating" && <small>Điểm từ 1 đến 10 theo hợp đồng API.</small>}
            {key === "ownerType" && <small>Tài khoản nhận tiền của doanh nghiệp.</small>}
          </label>;
    })}
      <datalist id="lookup-classes">
        {(lookups.classes || []).map(v => <option key={v.id} value={v.id}>
            {v.name}
          </option>)}
      </datalist>
    </div>;
}
export function OperationDialog({
  action,
  params = {},
  initial = {},
  lookups = {},
  onClose,
  onComplete
}) {
  const op = operation(action.key),
    schema = resolveSchema(op.body);
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [result, setResult] = useState(undefined);
  const [confirmed, setConfirmed] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = op.body ? packBody(schema, values) : undefined;
      const validate = (s, v) => {
        s = resolveSchema(s);
        if (s.type === "array") {
          if (!Array.isArray(v) || v.length < (s.minItems || 1)) throw Error("Vui lòng thêm đầy đủ các dòng dữ liệu.");
          for (const x of v) validate(s.items, x);
        }
        if (s.properties) {
          for (const k of s.required || []) if (v?.[k] === undefined || v[k] === "") throw Error("Thiếu " + label(k));
          for (const [k, x] of Object.entries(v || {})) validate(s.properties[k], x);
        }
      };
      if (op.body) validate(schema, body);
      const data = await api.request(operationPath(action.key, params), {
        method: op.method,
        body
      });
      setResult(data ?? {
        message: "Hoàn tất"
      });
      onComplete?.(data);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return <Modal title={action.title} onClose={busy ? () => {} : onClose} wide>
      <form onSubmit={submit}>
        <div className="modal-body">
          {action.danger && <div className="warning-note">
              Thao tác này thay đổi dữ liệu hiện có. Hãy kiểm tra bản ghi trước
              khi xác nhận.
            </div>}
          {action.key === "PATCH /payments/{id}" && <p className="warning-note">
              API chỉ ghi nhận khoản hoàn tiền đã thực hiện bên ngoài; không tự
              chuyển tiền hoàn.
            </p>}
          {result === undefined ? <>
              <SchemaFields schema={schema} values={values} onChange={setValues} lookups={lookups} />
              {!op.body && <p>Xác nhận thực hiện: {action.title.toLowerCase()}?</p>}
              {action.danger && <label className="check">
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required />
                  Tôi đã kiểm tra đúng bản ghi và muốn tiếp tục.
                </label>}
              {error && <ErrorState error={error} />}
            </> : <ResultView data={result} />}
        </div>
        <footer className="modal-footer">
          <button type="button" className="secondary" disabled={busy} onClick={onClose}>
            {result === undefined ? "Hủy" : "Đóng"}
          </button>
          {result === undefined && <button className={action.danger ? "primary danger-fill" : "primary"} disabled={busy || false || action.danger && !confirmed}>
              {busy ? <LoaderCircle size={16} className="spin" /> : null}Xác
              nhận
            </button>}
        </footer>
      </form>
    </Modal>;
}
