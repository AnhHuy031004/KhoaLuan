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
  page,
  limit,
  columnLabel,
  resolve,
  rowActions,
  ranks=[],
}) {
  return (
    <div className="table-scroll">
      <table className={config.id === 'exam-results' ? 'score-table' : config.id === 'discounts' ? 'tuition-relief-table' : config.id === 'leaves' ? 'leaves-table' : config.id==='exams' ? 'exams-table' : ''}>
        <thead>
          <tr>
            <th className="index-cell">STT</th>
            {columns.map((k) => (
              <th key={k}>{columnLabel(k)}</th>
            ))}
            <th className="action-cell">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={row.id}>
              <td className="index-cell">{(page - 1) * limit + index + 1}</td>
              {columns.map((key, i) => (
                <td
                  key={key}
                  className={
                    ['body', 'comment', 'reason', 'description'].includes(key)
                      ? 'wrap-cell'
                      : undefined
                  }
                >
                  {key === 'status' ? (
                    ['leaves','discounts','payment-confirmations'].includes(config.id) ? <LeaveStatus row={row}/> : <><Badge value={row[key]} />{['exams','exam-results'].includes(config.id)&&row.reviewedName&&<small className="exam-reviewer">{(row.reviewedRole==='ADMIN'?'Admin':ROLES[row.reviewedRole]||'')+' · '+row.reviewedName}</small>}</>
                  ) : key === 'rankId' ? <RankBadge rank={ranks.find(r=>r.id===row[key])}/> : key === 'fullName' || key === 'studentId' ? (
                    <div className="person-cell">
                      <span className={'avatar tone-' + (index % 5)}>
                        {initials(resolve(key, row[key]))}
                      </span>
                      <span>
                        <strong>{resolve(key, row[key])}</strong>
                        {row.studentCode && key === 'fullName' && (
                          <small>{row.studentCode}</small>
                        )}
                      </span>
                    </div>
                  ) : key === 'role' ? (
                    <span
                      className={'role-tag role-' + row[key]?.toLowerCase()}
                    >
                      {resolve(key, row[key])}
                    </span>
                  ) : ['amount', 'fee', 'tuition'].includes(key) ? (
                    <strong className="money">{resolve(key, row[key])}</strong>
                  ) : (
                    <span className={i === 0 ? 'cell-primary' : ''}>
                      {resolve(key, row[key])}
                    </span>
                  )}
                </td>
              ))}
              <td className="action-cell">{rowActions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
