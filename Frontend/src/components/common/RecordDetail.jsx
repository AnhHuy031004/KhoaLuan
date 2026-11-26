import React from 'react';
import { PenLine, Hash, Calendar, UserRound } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import LeaveStatus from '../../features/leaves/components/LeaveStatus.jsx';
import { can } from '../../utils/permissions.js';
import { initials } from '../../utils/format.js';

const HIDDEN_KEYS = new Set([
  'id',
  'createdBy',
  'reviewedBy',
  'password',
  'system',
  'systemEvent',
  'workflowModule',
  'workflowRecordId',
  'recipientUserIds',
  'resultId',
  'reliefId',
  'submittedRole',
  'submittedMasterLevel',
  'submittedRank',
  'canApprove',
  'roster',
]);

export default function RecordDetail({
  row,
  config,
  user,
  lockedWorkflow,
  resolve,
  columnLabel,
  onClose,
  onEdit,
}) {
  const displayTitle =
    row?.fullName ||
    (row?.studentId ? resolve('studentId', row.studentId, row) : '') ||
    row?.title ||
    row?.name ||
    row?.code ||
    'Chi tiết hồ sơ';

  const displayCode = row?.studentCode || row?.code || '';
  const hasStatus = row?.status !== undefined && row?.status !== '';

  const orderedKeys = [
    ...new Set([
      ...(config.detailFields || config.columns || []),
      ...(config.fields || []).map((f) => f.key),
      'studentCode',
      'code',
      'dob',
      'gender',
      'phone',
      'email',
      'provinceId',
      'wardId',
      'clubId',
      'classId',
      'rankId',
      'joinedAt',
      'assignedClassNames',
      'qualification',
      'paymentMethod',
      'method',
      'paidAt',
      'note',
      'createdAt',
      'reviewedName',
      'reviewedRole',
      'reviewedAt',
      'submittedName',
      'baseAmount',
      'appliedPercent',
      'priceOverrideReason',
      ...Object.keys(row || {}),
    ]),
  ];

  const entries = orderedKeys
    .map((key) => [key, row?.[key]])
    .filter(
      ([key, value]) =>
        value !== undefined &&
        value !== '' &&
        !key.startsWith('__') &&
        !HIDDEN_KEYS.has(key),
    );

  return (
    <Modal title="Chi tiết thông tin" subtitle={config.title} onClose={onClose} wide>
      {/* Professional Hero Banner */}
      <div className="detail-hero">
        <div className="detail-hero-avatar">
          {displayTitle ? initials(displayTitle) : <UserRound size={22} />}
        </div>
        <div className="detail-hero-copy">
          <h3>{displayTitle}</h3>
          <div className="detail-hero-meta">
            {displayCode && (
              <span className="detail-code-chip">
                <Hash size={12} />
                {displayCode}
              </span>
            )}
            {row?.classId && (
              <span className="detail-meta-pill">
                {resolve('classId', row.classId, row)}
              </span>
            )}
            {row?.rankId && (
              <span className="detail-meta-pill tone-gold">
                {resolve('rankId', row.rankId, row)}
              </span>
            )}
            {row?.createdAt && (
              <span className="detail-meta-date">
                <Calendar size={12} />
                {resolve('createdAt', row.createdAt, row)}
              </span>
            )}
          </div>
        </div>
        {hasStatus && (
          <div className="detail-hero-status">
            {['leaves', 'discounts', 'payment-confirmations'].includes(
              config.id,
            ) ? (
              <LeaveStatus row={row} />
            ) : (
              <Badge value={row.status} />
            )}
          </div>
        )}
      </div>

      {row?.roster && (
        <div className="detail-roster-box">
          <strong>Võ sinh đang học ({row.studentCount})</strong>
          <p>
            {row.roster.map((s) => s.fullName).join(' · ') || 'Chưa có võ sinh'}
          </p>
        </div>
      )}

      {/* Structured Info Cards */}
      <div className="detail-card-grid">
        {entries.map(([key, value]) => {
          const isWide = ['reason', 'comment', 'description', 'body', 'note'].includes(
            key,
          );
          return (
            <div
              key={key}
              className={'detail-card-item' + (isWide ? ' is-wide' : '')}
            >
              <span className="detail-card-label">{columnLabel(key)}</span>
              <div className="detail-card-value">
                {key === 'status' ? (
                  ['leaves', 'discounts', 'payment-confirmations'].includes(
                    config.id,
                  ) ? (
                    <LeaveStatus row={row} />
                  ) : (
                    <Badge value={value} />
                  )
                ) : key === 'paymentMethod' || key === 'method' ? (
                  <span
                    className={
                      'method-pill ' +
                      (value === 'CASH'
                        ? 'method-cash'
                        : value === 'BANK'
                          ? 'method-bank'
                          : 'method-none')
                    }
                  >
                    {resolve(key, value, row)}
                  </span>
                ) : (
                  String(resolve(key, value, row))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        {!row?.__readOnly &&
          !row?.systemEvent &&
          can(config, user.role, 'E') &&
          (!lockedWorkflow || row?.status === 'PENDING') && (
            <Button onClick={onEdit}>
              <PenLine size={15} /> Chỉnh sửa
            </Button>
          )}
      </div>
    </Modal>
  );
}
