import React, { useState, useRef, useEffect, useId } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import ErrorState from './ErrorState.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { invoiceBaseAmount, priceInvoice } from '../../utils/tuition.js';
import { monthKey, currency } from '../../utils/format.js';
import { validateDob, validatePhone, validateEmail, validateFullName, normalizeWhitespace, normalizePhone } from '../../utils/validation.js';
const options = (field, lookups) => {
  if (field.key === 'role' && lookups.roles)
    return lookups.roles.map((r) => [r.code, r.name]);
  if (field.options) return field.options;
  const map = {
    province: ['provinces', 'name'],
    ward: ['wards', 'name'],
    club: ['clubs', 'name'],
    student: ['students', 'fullName'],
    class: ['classes', 'name'],
    rank: ['ranks', 'name'],
    instructor: ['instructors', 'fullName'],
    exam: ['exams', 'title'],
    invoice: ['invoices', 'code'],
    discount: ['discounts', 'name'],
  };
  const spec = map[field.type];
  return spec
    ? [...(lookups[spec[0]] || [])]
        .sort((a, b) =>
          field.type === 'rank' ? Number(a.level) - Number(b.level) : 0,
        )
        .filter((x) => field.type !== 'invoice' || x.status !== 'PAID')
        .map((x) => [x.id, x[spec[1]]])
    : null;
};
export default function RecordForm({
  config,
  record,
  lookups,
  service,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  lookups = {
    ...lookups,
    wards:
      user.role === 'MASTER' && user.masterLevel === 'WARD'
        ? lookups.wards?.filter((w) => w.id === user.wardId)
        : lookups.wards,
    classes: lookups.classes?.filter(
      (c) =>
        !lookups.writableClassIds || lookups.writableClassIds.includes(c.id),
    ),
    students: lookups.students?.filter(
      (s) =>
        !lookups.writableStudentIds ||
        lookups.writableStudentIds.includes(s.id),
    ),
  };
  const toast = useToast();
  const baseFields = config.fields
    .filter(
      (f) =>
        !(
          user.role === 'MASTER' &&
          user.masterLevel === 'CLUB' &&
          config.id === 'classes' &&
          f.key === 'tuition'
        ),
    )
    .filter(
      (f) =>
        !(user.role === 'STUDENT' && config.id === 'students') ||
        ['phone', 'email'].includes(f.key),
    );
  const fields = [...baseFields];
  const ci = fields.findIndex((f) => f.key === 'classId'),
    si = fields.findIndex((f) => f.key === 'studentId');
  if (ci > si && si >= 0) fields.splice(si, 0, ...fields.splice(ci, 1));
  const sectionFor = (f) =>
    ['classId', 'rankId', 'qualification', 'status'].includes(f.key)
      ? 'Thông tin học tập'
      : ['phone', 'email', 'address'].includes(f.key)
        ? 'Liên hệ'
        : 'Thông tin cá nhân';
  const grouped = ['students', 'instructors', 'masters'].includes(config.id);
  if (grouped) {
    const order = ['Thông tin cá nhân', 'Thông tin học tập', 'Liên hệ'];
    fields.sort(
      (a, b) => order.indexOf(sectionFor(a)) - order.indexOf(sectionFor(b)),
    );
  }
  const initial = Object.fromEntries(
    fields.map((f) => [
      f.key,
      f.type === 'items'
        ? record?.[f.key] || [{ description: '', quantity: 1, unitAmount: 0 }]
        : f.type === 'password'
          ? ''
          : (record?.[f.key] ??
            (f.type === 'month'
              ? monthKey()
              : f.type === 'date'
                ? f.key === 'dob'
                  ? ''
                  : new Date().toISOString().slice(0, 10)
                : f.type === 'color'
                  ? '#0877c9'
                  : (f.options?.[0]?.[0] ?? ''))),
    ]),
  );
  for (const f of fields)
    if (f.type === 'datetime-local' && initial[f.key])
      initial[f.key] = String(initial[f.key]).slice(0, 16);
  if (user.role === 'STUDENT' && fields.some((f) => f.key === 'studentId'))
    initial.studentId = user.studentId || lookups.students?.[0]?.id || '';
  if (user.role === 'STUDENT' && config.id === 'leaves' && !record)
    initial.classId =
      lookups.students?.find((s) => s.id === initial.studentId)?.classId ||
      (lookups.classes?.length === 1 ? lookups.classes[0].id : '');
  if (config.id === 'discounts' && !record) {
    initial.classId = lookups.classes?.[0]?.id || '';
    initial.studentId =
      lookups.students?.find(
        (s) => s.classId === initial.classId && s.status === 'ACTIVE',
      )?.id || '';
    initial.reliefType = 'REDUCTION';
    initial.percent = 20;
  }
  if (
    config.id === 'announcements' &&
    !record &&
    user.role === 'MASTER' &&
    ['WARD', 'CLUB'].includes(user.masterLevel)
  ) {
    initial.audience = 'CLASS';
    initial.classId = lookups.classes?.[0]?.id || '';
  }
  if (!record) {
    initial.provinceId = lookups.provinces?.[0]?.id || '';
    if (['classes', 'instructors'].includes(config.id))
      initial.clubId = lookups.clubs?.[0]?.id || '';
    if (config.id === 'clubs' && lookups.wards?.length === 1)
      initial.wardId = lookups.wards[0].id;
  }
  if (config.id === 'invoices' && record) {
    initial.amount = record.baseAmount ?? record.amount;
    initial.priceOverrideReason = record.priceOverrideReason || '';
  }
  const baseline = useRef(JSON.stringify(initial)),
    formId = useId(),
    formRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [values, setValues] = useState(initial),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);

  const dirty = JSON.stringify(values) !== baseline.current;
  let pricing = null;
  if (config.id === 'invoices') {
    try {
      pricing = priceInvoice(
        {
          tuitionRelief: lookups.tuitionRelief || [],
          discounts: lookups.discounts || [],
        },
        values,
      );
    } catch (error) {
      pricing = null;
    }
  }
  useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const click = (e) => {
      if (
        e.target.closest('a[href]') &&
        (busy || !window.confirm('Bạn có thay đổi chưa lưu. Rời trang?'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', click, true);
    };
  }, [dirty, busy]);
  function updateField(key, nextValue) {
    setFieldErrors((previous) => ({ ...previous, [key]: '' }));
    setValues((v) => {
      const next = { ...v, [key]: nextValue };
      if (
        config.id === 'users' &&
        ['role', 'masterLevel', 'wardId'].includes(key)
      ) {
        if (key === 'role') {
          next.masterLevel = 'PROVINCE';
          next.wardId = '';
          next.clubId = '';
        } else if (key === 'masterLevel') {
          next.wardId = '';
          next.clubId = '';
        } else {
          next.clubId = '';
        }
      }
      if (config.id === 'discounts' && key === 'classId') {
        next.studentId =
          lookups.students?.find(
            (s) => s.classId === nextValue && s.status === 'ACTIVE',
          )?.id || '';
      }
      if (config.id === 'discounts' && key === 'reliefType') {
        next.percent = nextValue === 'EXEMPTION' ? 100 : '';
      }
      if (config.id === 'announcements' && key === 'audience') {
        if (nextValue === 'ALL') next.classId = '';
        else if (!next.classId && lookups.classes?.length === 1)
          next.classId = lookups.classes[0].id;
      }
      if (
        ['invoices', 'evaluations', 'leaves', 'exam-results'].includes(
          config.id,
        )
      ) {
        if (key === 'classId')
          next.studentId =
            user.role === 'STUDENT' ? user.studentId || initial.studentId : '';
        if (key === 'studentId') {
          const student = lookups.students?.find((s) => s.id === nextValue);
          if (student) next.classId = student.classId;
        }
      }
      if (
        config.id === 'invoices' &&
        !record &&
        ['classId', 'studentId', 'period'].includes(key)
      ) {
        next.amount =
          invoiceBaseAmount(
            lookups.tuition,
            lookups.classes,
            next.classId,
            next.period,
          ) ?? '';
        next.priceOverrideReason = '';
      }
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const invalid = Array.from(e.currentTarget.elements).filter(
      (el) => el.willValidate && !el.validity.valid,
    );
    if (invalid.length) {
      setError({
        message:
          'Vui lòng kiểm tra các trường bắt buộc và giá trị chưa hợp lệ.',
      });
      setFieldErrors(
        Object.fromEntries(
          invalid.map((el) => [el.name, el.validationMessage]),
        ),
      );
      invalid[0].focus();
      return;
    }
    const customErrors = {};
    const sanitized = { ...values };
    for (const f of fields) {
      const val = sanitized[f.key];
      if (f.key === 'fullName' && val !== undefined) {
        sanitized.fullName = normalizeWhitespace(val);
        const err = validateFullName(sanitized.fullName, { required: Boolean(f.required) });
        if (err) customErrors.fullName = err;
      }
      if (f.key === 'dob' && val !== undefined) {
        const err = validateDob(val, { required: Boolean(f.required) });
        if (err) customErrors.dob = err;
      }
      if (f.key === 'phone' && val !== undefined) {
        const err = validatePhone(val, { required: Boolean(f.required) });
        if (err) customErrors.phone = err;
        else if (String(val).trim()) sanitized.phone = normalizePhone(val);
      }
      if (f.key === 'email' && val !== undefined) {
        const err = validateEmail(val, { required: Boolean(f.required) });
        if (err) customErrors.email = err;
      }
    }
    if (Object.keys(customErrors).length) {
      setFieldErrors(customErrors);
      setError({ message: Object.values(customErrors)[0] });
      const firstKey = Object.keys(customErrors)[0];
      formRef.current?.querySelector(`[name="${firstKey}"]`)?.focus?.();
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (record) await service.update(record.id, sanitized);
      else await service.create(sanitized);
      toast(
        record
          ? 'Đã cập nhật thông tin.'
          : config.id === 'discounts'
            ? user.role === 'ADMIN'
              ? 'Đã tạo đề xuất miễn giảm học phí.'
              : 'Đã gửi đề xuất miễn giảm lên cấp quản lý cao hơn để xét duyệt.'
            : config.id === 'leaves'
              ? 'Đã gửi đơn xin nghỉ.'
              : config.id === 'students'
                ? 'Đã tạo hồ sơ võ sinh. Bước tiếp theo: kiểm tra lớp học hoặc lập khoản thu học phí.'
                : 'Đã tạo bản ghi mới.',
      );
      baseline.current = JSON.stringify(values);
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
      const serverErrors = e.detail?.errors;
      const mapped = Array.isArray(serverErrors)
        ? Object.fromEntries(
            serverErrors
              .filter((x) => x.field && x.message)
              .map((x) => [x.field, x.message]),
          )
        : serverErrors && typeof serverErrors === 'object'
          ? serverErrors
          : {};
      const relevant = Object.fromEntries(
        Object.entries(mapped)
          .filter(
            ([key]) =>
              fields.some((f) => f.key === key) ||
              key === 'priceOverrideReason',
          )
          .map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join('; ') : String(value),
          ]),
      );
      const field = fields.find((f) =>
        e.message.toLowerCase().includes(f.label.toLowerCase()),
      );
      if (Object.keys(relevant).length) {
        setFieldErrors(relevant);
        formRef.current?.elements.namedItem(Object.keys(relevant)[0])?.focus();
      } else if (field) {
        setFieldErrors({ [field.key]: e.message });
        formRef.current?.elements.namedItem(field.key)?.focus();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        config.id === 'discounts'
          ? 'Gửi đề xuất miễn giảm học phí'
          : config.id === 'leaves' && !record && user.role === 'STUDENT'
            ? 'Gửi đơn xin nghỉ'
            : (record ? 'Chỉnh sửa · ' : 'Thêm mới · ') +
              config.title.toLowerCase()
      }
      subtitle="Điền thông tin bên dưới. Các trường có dấu * là bắt buộc."
      onClose={onClose}
      dirty={dirty}
      busy={busy}
      wide={fields.length > 5}
    >
      <form ref={formRef} onSubmit={submit} noValidate>
        <div className="form-grid">
          {fields
            .filter(
              (f) =>
                (config.id !== 'users' ||
                  !['masterLevel', 'wardId', 'clubId'].includes(f.key) ||
                  (values.role === 'MASTER' &&
                    (f.key === 'masterLevel' ||
                      (f.key === 'wardId' &&
                        ['WARD', 'CLUB'].includes(values.masterLevel)) ||
                      (f.key === 'clubId' &&
                        values.masterLevel === 'CLUB')))) &&
                !(
                  config.id === 'announcements' &&
                  f.key === 'classId' &&
                  values.audience === 'ALL' &&
                  !(
                    user.role === 'MASTER' &&
                    ['WARD', 'CLUB'].includes(user.masterLevel)
                  )
                ),
            )
            .map((f, index) => {
              const choices = options(
                  f,
                  f.type === 'club'
                    ? {
                        ...lookups,
                        clubs: lookups.clubs?.filter(
                          (c) => !values.wardId || c.wardId === values.wardId,
                        ),
                      }
                    : [
                          'discounts',
                          'invoices',
                          'evaluations',
                          'leaves',
                          'exam-results',
                        ].includes(config.id) && f.key === 'studentId'
                      ? {
                          ...lookups,
                          students: lookups.students?.filter(
                            (s) =>
                              (!fields.some((f) => f.key === 'classId') ||
                                s.classId === values.classId) &&
                              (s.status === 'ACTIVE' ||
                                s.id === record?.studentId),
                          ),
                        }
                      : f.type === 'exam'
                        ? {
                            ...lookups,
                            exams: lookups.exams?.filter(
                              (e) => e.status === 'APPROVED',
                            ),
                          }
                        : f.key === 'audience' &&
                            config.id === 'announcements' &&
                            user.role === 'MASTER' &&
                            ['WARD', 'CLUB'].includes(user.masterLevel)
                          ? { ...lookups }
                          : lookups,
                ),
                filteredChoices =
                  f.key === 'audience' &&
                  config.id === 'announcements' &&
                  user.role === 'MASTER' &&
                  ['WARD', 'CLUB'].includes(user.masterLevel)
                    ? choices?.filter(([val]) => val === 'CLASS')
                    : choices,
                isStudent = f.key === 'studentId' && user.role === 'STUDENT',
                isRequired =
                  f.required ||
                  (config.id === 'announcements' &&
                    f.key === 'classId' &&
                    values.audience === 'CLASS');
              return (
                <React.Fragment key={f.key}>
                  {grouped &&
                    (index === 0 ||
                      sectionFor(fields[index - 1]) !== sectionFor(f)) && (
                      <h3 className="form-section-title">{sectionFor(f)}</h3>
                    )}
                  <label
                    className={
                      ['textarea', 'items'].includes(f.type)
                        ? 'field full'
                        : 'field'
                    }
                    key={f.key}
                  >
                    <span>
                      {f.label}
                      {isRequired && !(record && f.type === 'password') && (
                        <em> *</em>
                      )}
                    </span>
                    {f.type === 'items' ? (
                      <div className="invoice-lines">
                        {(values[f.key] || []).map((item, index) => (
                          <div className="invoice-line" key={index}>
                            <input
                              name={'description.' + index}
                              aria-label={'Khoản thu ' + (index + 1)}
                              required
                              placeholder="Nội dung khoản thu"
                              value={item.description}
                              onChange={(e) =>
                                setValues((v) => ({
                                  ...v,
                                  [f.key]: v[f.key].map((x, i) =>
                                    i === index
                                      ? { ...x, description: e.target.value }
                                      : x,
                                  ),
                                }))
                              }
                            />
                            <input
                              name={'quantity.' + index}
                              aria-label={'Số lượng ' + (index + 1)}
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) =>
                                setValues((v) => ({
                                  ...v,
                                  [f.key]: v[f.key].map((x, i) =>
                                    i === index
                                      ? {
                                          ...x,
                                          quantity: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                }))
                              }
                            />
                            <input
                              name={'unitAmount.' + index}
                              aria-label={'Đơn giá ' + (index + 1)}
                              type="number"
                              min="0"
                              required
                              value={item.unitAmount}
                              onChange={(e) =>
                                setValues((v) => ({
                                  ...v,
                                  [f.key]: v[f.key].map((x, i) =>
                                    i === index
                                      ? {
                                          ...x,
                                          unitAmount: Number(e.target.value),
                                        }
                                      : x,
                                  ),
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="text-btn"
                              disabled={values[f.key].length === 1}
                              onClick={() =>
                                setValues((v) => ({
                                  ...v,
                                  [f.key]: v[f.key].filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                            >
                              Bỏ
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() =>
                            setValues((v) => ({
                              ...v,
                              [f.key]: [
                                ...v[f.key],
                                { description: '', quantity: 1, unitAmount: 0 },
                              ],
                            }))
                          }
                        >
                          + Thêm khoản thu
                        </button>
                      </div>
                    ) : filteredChoices ? (
                      <select
                        name={f.key}
                        aria-invalid={!!fieldErrors[f.key]}
                        aria-describedby={
                          fieldErrors[f.key] ? formId + f.key : undefined
                        }
                        required={isRequired}
                        value={values[f.key] || ''}
                        disabled={isStudent}
                        onChange={(e) => updateField(f.key, e.target.value)}
                      >
                        <option value="">Chọn {f.label.toLowerCase()}</option>
                        {filteredChoices.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        name={f.key}
                        aria-invalid={!!fieldErrors[f.key]}
                        aria-describedby={
                          fieldErrors[f.key] ? formId + f.key : undefined
                        }
                        rows={3}
                        required={isRequired}
                        value={values[f.key] || ''}
                        onChange={(e) => updateField(f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        name={f.key}
                        aria-invalid={!!fieldErrors[f.key]}
                        aria-describedby={
                          fieldErrors[f.key] ? formId + f.key : undefined
                        }
                        type={
                          ['number', 'money', 'score', 'percent'].includes(
                            f.type,
                          )
                            ? 'number'
                            : f.type
                        }
                        step={['money', 'number'].includes(f.type) ? 1 : 'any'}
                        min={
                          ['number', 'money', 'score', 'percent'].includes(
                            f.type,
                          )
                            ? 0
                            : undefined
                        }
                        max={
                          f.type === 'percent'
                            ? 100
                            : f.key === 'rating'
                              ? 10
                              : undefined
                        }
                        required={
                          isRequired && !(record && f.type === 'password')
                        }
                        readOnly={
                          (config.id === 'invoices' &&
                            f.key === 'amount' &&
                            user.role !== 'ADMIN') ||
                          (config.id === 'discounts' &&
                            f.key === 'percent' &&
                            values.reliefType === 'EXEMPTION')
                        }
                        minLength={f.type === 'password' ? 8 : undefined}
                        autoComplete={
                          f.type === 'password' ? 'new-password' : undefined
                        }
                        value={values[f.key] ?? ''}
                        placeholder={
                          record && f.type === 'password'
                            ? 'Để trống để giữ mật khẩu hiện tại'
                            : `Nhập ${f.label.toLowerCase()}`
                        }
                        onChange={(e) => updateField(f.key, e.target.value)}
                      />
                    )}
                    {f.type === 'money' && (
                      <small>{currency(values[f.key])}</small>
                    )}
                    {fieldErrors[f.key] && (
                      <small
                        id={formId + f.key}
                        className="field-error"
                        role="alert"
                      >
                        {fieldErrors[f.key]}
                      </small>
                    )}
                  </label>
                </React.Fragment>
              );
            })}
        </div>
        {config.id === 'exam-results' && (
          <div className="form-info">
            Tổng điểm:{' '}
            <strong>
              {[
                'quyenScore',
                'theoryFitnessScore',
                'basicScore',
                'sparringScore',
              ]
                .reduce((sum, k) => sum + (Number(values[k]) || 0), 0)
                .toFixed(2)}
            </strong>{' '}
            · Kết quả được ghi nhận theo quyền của tài khoản.
          </div>
        )}
        {config.id === 'invoices' && (
          <div className="form-info">
            <p>
              Biểu phí kỳ này:{' '}
              <strong>
                {currency(
                  invoiceBaseAmount(
                    lookups.tuition,
                    lookups.classes,
                    values.classId,
                    values.period,
                  ),
                )}
              </strong>
              .
            </p>
            {pricing && (
              <p>
                Phí gốc: <strong>{currency(pricing.baseAmount)}</strong> · Miễn
                giảm: <strong>{pricing.appliedPercent}%</strong> · Phải thu:{' '}
                <strong>{currency(pricing.amount)}</strong>
              </p>
            )}
            {user.role !== 'ADMIN' && (
              <small>Chỉ Admin được điều chỉnh khác biểu phí.</small>
            )}
            <label className="field">
              Lý do điều chỉnh khác biểu phí
              <input
                name="priceOverrideReason"
                aria-invalid={!!fieldErrors.priceOverrideReason}
                aria-describedby={
                  fieldErrors.priceOverrideReason
                    ? formId + 'priceOverrideReason'
                    : undefined
                }
                value={values.priceOverrideReason || ''}
                required={
                  Number(values.amount) !==
                  invoiceBaseAmount(
                    lookups.tuition,
                    lookups.classes,
                    values.classId,
                    values.period,
                  )
                }
                onChange={(e) =>
                  updateField('priceOverrideReason', e.target.value)
                }
              />
            </label>
            {fieldErrors.priceOverrideReason && (
              <p role="alert" className="field-error">
                {fieldErrors.priceOverrideReason}
              </p>
            )}
          </div>
        )}
        {error && <ErrorState error={error} />}
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              if (
                !dirty ||
                window.confirm('Bạn có thay đổi chưa lưu. Bỏ các thay đổi này?')
              )
                onClose();
            }}
            disabled={busy}
          >
            Hủy bỏ
          </Button>
          <Button disabled={busy}>
            <Save size={16} />
            {busy
              ? 'Đang lưu…'
              : config.id === 'discounts'
                ? 'Gửi đề xuất'
                : config.id === 'leaves' && !record && user.role === 'STUDENT'
                  ? 'Gửi đơn'
                  : 'Lưu thông tin'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
