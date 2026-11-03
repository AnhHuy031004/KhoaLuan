const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleReports(context, path, method, body, q, u, session) {
  const {
    db,
    scoped
  } = context;
  if (path.startsWith('/admin/reports/')) {
    const kind = path.split('/').pop();
    const students = scoped(db.students, u);
    const invoices = scoped(db.invoices, u).filter(i => (!q.month || i.periodMonth === Number(q.month)) && (!q.year || i.periodYear === Number(q.year)));
    if (kind === 'belts') return {
      rows: db.ranks.map(r => ({
        beltRankId: r.id,
        name: r.name,
        count: students.filter(s => s.currentBeltRankId === r.id).length
      })),
      total: students.length
    };
    if (kind === 'attendance') return {
      month: q.month,
      year: q.year,
      rows: students.map(s => {
        const a = db.attendance.filter(a => a.studentId === s.id && (!q.month || new Date(a.sessionDate).getMonth() + 1 === Number(q.month)) && (!q.year || new Date(a.sessionDate).getFullYear() === Number(q.year)));
        return {
          studentName: s.fullName,
          present: a.filter(x => x.status === 'PRESENT').length,
          total: a.length
        };
      })
    };
    if (kind === 'tuition') return {
      month: q.month,
      year: q.year,
      byStatus: ['PAID', 'UNPAID'].map(status => ({
        status,
        count: invoices.filter(i => i.status === status).length,
        total: invoices.filter(i => i.status === status).reduce((a, i) => a + i.total, 0)
      })),
      collectedVnd: invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + i.total, 0)
    };
    if (kind === 'revenue') {
      const rows = scoped(db.payments.map(p => ({
        ...p,
        studentId: db.invoices.find(i => i.id === p.invoiceId)?.studentId
      })), u).filter(p => p.status === 'SUCCESS' && (!q.from || p.paidAt >= q.from) && (!q.to || p.paidAt.slice(0, 10) <= q.to.slice(0, 10)));
      return {
        from: q.from,
        to: q.to,
        rows,
        grandTotal: rows.reduce((a, p) => a + p.amount, 0)
      };
    }
  }
}
