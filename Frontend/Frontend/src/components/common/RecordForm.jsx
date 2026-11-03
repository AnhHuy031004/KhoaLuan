import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import ErrorState from './ErrorState.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { monthKey } from '../../utils/format.js';
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
        !lookups.writableStudentIds || lookups.writableStudentIds.includes(s.id),
    ),
  };
  const toast = useToast();
  const candidates = config.apiMode
    ? (record
        ? user.role === 'STUDENT' && config.id === 'students'
          ? config.ownEditFields
          : config.editFields
        : config.createFields) || config.fields
    : config.fields;
  const fields = config.apiMode
    ? candidates
    : candidates
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
                ? new Date().toISOString().slice(0, 10)
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
  if (!config.apiMode && config.id === 'discounts' && !record) {
    initial.classId = lookups.classes?.[0]?.id || '';
    initial.reliefType = 'REDUCTION';
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
  const [values, setValues] = useState(initial),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false);

  function updateField(key, nextValue) {
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
      if (!config.apiMode && config.id === 'discounts' && key === 'classId') {
        next.studentId = '';
      }
      if (!config.apiMode && config.id === 'discounts' && key === 'reliefType') {
        next.percent = nextValue === 'EXEMPTION' ? 100 : '';
      }
      if (config.id === 'announcements' && key === 'audience') {
        if (nextValue === 'ALL') next.classId = '';
        else if (!next.classId && lookups.classes?.length === 1)
          next.classId = lookups.classes[0].id;
      }
      if (
        ['invoices', 'evaluations', 'leaves'].includes(config.id) &&
        key === 'studentId' &&
        nextValue
      ) {
        const student = lookups.students?.find((s) => s.id === nextValue);
        if (student?.classId) {
          next.classId = student.classId;
          if (config.id === 'invoices' && !record && !v.amount) {
            const cls = lookups.classes?.find((c) => c.id === student.classId);
            if (cls?.tuition) next.amount = cls.tuition;
          }
        }
      }
      if (config.id === 'invoices' && key === 'classId' && !record) {
        const cls = lookups.classes?.find((c) => c.id === nextValue);
        const prevCls = lookups.classes?.find((c) => c.id === v.classId);
        if (
          cls?.tuition &&
          (!v.amount || Number(v.amount) === Number(prevCls?.tuition))
        ) {
          next.amount = cls.tuition;
        }
      }
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (record) await service.update(record.id, values);
      else await service.create(values);
      toast(
        record
          ? 'Đã cập nhật thông tin.'
          : !config.apiMode && config.id === 'discounts'
            ? 'Đã gửi đề xuất đến Admin và Võ sư.'
            : config.id === 'leaves'
              ? 'Đã gửi đơn xin nghỉ.'
              : 'Đã tạo bản ghi mới.',
      );
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        !config.apiMode && config.id === 'discounts'
          ? 'Gửi đề xuất miễn giảm học phí'
          : config.id === 'leaves' && !record && user.role === 'STUDENT'
            ? 'Gửi đơn xin nghỉ'
            : (record ? 'Chỉnh sửa · ' : 'Thêm mới · ') +
              config.title.toLowerCase()
      }
      subtitle="Điền thông tin bên dưới. Các trường có dấu * là bắt buộc."
      onClose={onClose}
      wide={fields.length > 5}
    >
      <form onSubmit={submit}>
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
            .map((f) => {
              const choices = options(
                  f,
                  f.type === 'club'
                    ? {
                        ...lookups,
                        clubs: lookups.clubs?.filter(
                          (c) => !values.wardId || c.wardId === values.wardId,
                        ),
                      }
                    : !config.apiMode &&
                        config.id === 'discounts' &&
                        f.key === 'studentId'
                      ? {
                          ...lookups,
                          students: lookups.students?.filter(
                            (s) =>
                              s.classId === values.classId &&
                              s.status === 'ACTIVE',
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
                                    ? { ...x, quantity: Number(e.target.value) }
                                    : x,
                                ),
                              }))
                            }
                          />
                          <input
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
                                [f.key]: v[f.key].filter((_, i) => i !== index),
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
                      rows={3}
                      required={isRequired}
                      value={values[f.key] || ''}
                      onChange={(e) => updateField(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={
                        ['number', 'money', 'score', 'percent'].includes(f.type)
                          ? 'number'
                          : f.type
                      }
                      step={['money', 'number'].includes(f.type) ? 1 : 'any'}
                      min={
                        ['number', 'money', 'score', 'percent'].includes(f.type)
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
                        !config.apiMode &&
                        config.id === 'discounts' &&
                        f.key === 'percent' &&
                        values.reliefType === 'EXEMPTION'
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
                </label>
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
        {error && <ErrorState error={error} />}
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Hủy bỏ
          </Button>
          <Button disabled={busy}>
            <Save size={16} />
            {busy
              ? 'Đang lưu…'
              : !config.apiMode && config.id === 'discounts'
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
