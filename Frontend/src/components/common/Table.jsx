import React from 'react';
import Badge from './Badge.jsx';
import RankBadge from '../../features/ranks/components/RankBadge.jsx';
import LeaveStatus from '../../features/leaves/components/LeaveStatus.jsx';
import { ROLES } from '../../utils/permissions.js';
import { initials } from '../../utils/format.js';

export default function Table({
  config,
  columns,
  items,
  page = 1,
  limit = 500,
  columnLabel,
  resolve,
  rowActions,
  onRowClick,
  showActions = true,
  ranks = [],
}) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={'Danh sách ' + config.title}
    >
      <table
        aria-label={config.title}
        className={
          'record-table ' +
          (config.id === 'invoices'
            ? 'invoices-table'
            : config.id === 'exam-results'
              ? 'score-table'
              : config.id === 'discounts'
                ? 'tuition-relief-table'
                : config.id === 'leaves'
                  ? 'leaves-table'
                  : config.id === 'exams'
                    ? 'exams-table'
                    : '')
        }
      >
        <thead>
          <tr>
            <th scope="col" className="index-cell">
              STT
            </th>
            {columns.map((k) => (
              <th scope="col" key={k}>
                {columnLabel(k)}
              </th>
            ))}
            {showActions && (
              <th scope="col" className="action-cell">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr
              key={row.id}
              className={onRowClick ? 'clickable-row' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              title={onRowClick ? 'Bấm để xem chi tiết' : undefined}
            >
              <td className="index-cell">{(page - 1) * limit + index + 1}</td>
              {columns.map((key, i) => (
                <td
                  key={key}
                  data-label={columnLabel(key)}
                  className={
                    ['body', 'comment', 'reason', 'description'].includes(key)
                      ? 'wrap-cell'
                      : undefined
                  }
                >
                  {key === 'status' ? (
                    ['leaves', 'discounts', 'payment-confirmations'].includes(
                      config.id,
                    ) ? (
                      <LeaveStatus row={row} />
                    ) : (
                      <>
                        <Badge value={row[key]} />
                        {['exams', 'exam-results'].includes(config.id) &&
                          row.reviewedName && (
                            <small className="exam-reviewer">
                              {(row.reviewedRole === 'ADMIN'
                                ? 'Admin'
                                : ROLES[row.reviewedRole] || '') +
                                ' · ' +
                                row.reviewedName}
                            </small>
                          )}
                      </>
                    )
                  ) : key === 'method' || key === 'paymentMethod' ? (
                    <span
                      className={
                        'method-pill ' +
                        (row[key] === 'CASH'
                          ? 'method-cash'
                          : row[key] === 'BANK'
                            ? 'method-bank'
                            : 'method-none')
                      }
                    >
                      {resolve(key, row[key], row)}
                    </span>
                  ) : key === 'rankId' ? (
                    <RankBadge rank={ranks.find((r) => r.id === row[key])} />
                  ) : key === 'fullName' || key === 'studentId' ? (
                    <div className="person-cell">
                      <span className={'avatar tone-' + (index % 5)}>
                        {initials(resolve(key, row[key], row))}
                      </span>
                      <span>
                        <strong>{resolve(key, row[key], row)}</strong>
                        {row.studentCode && key === 'fullName' && (
                          <small>{row.studentCode}</small>
                        )}
                      </span>
                    </div>
                  ) : key === 'role' ? (
                    <span
                      className={'role-tag role-' + row[key]?.toLowerCase()}
                    >
                      {resolve(key, row[key], row)}
                    </span>
                  ) : ['amount', 'fee', 'tuition'].includes(key) ? (
                    <strong className="money">
                      {resolve(key, row[key], row)}
                    </strong>
                  ) : (
                    <span className={i === 0 ? 'cell-primary' : ''}>
                      {resolve(key, row[key], row)}
                    </span>
                  )}
                </td>
              ))}
              {showActions && (
                <td
                  className="action-cell"
                  data-label="Thao tác"
                  onClick={(e) => e.stopPropagation()}
                >
                  {rowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
