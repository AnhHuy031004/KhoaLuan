const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleBilling(context, path, method, body, q, u, session) {
  const {
    db,
    now,
    newId,
    hydrate
  } = context;
  if (path === '/admin/billing/settings') return db.settings;
  if (path === '/admin/billing/settings/tuition-rates') {
    db.settings.tuitionRates = Array.isArray(body.rates) ? Object.fromEntries(body.rates.map(r => [r.classId, Number(r.monthlyAmount)])) : body.tuitionRates || {};
    return db.settings;
  }
  if (path === '/admin/billing/settings/bank-account') {
    db.settings.bankAccount = body.bankAccount || body;
    return db.settings;
  }
  if (path === '/admin/billing/generate-monthly') {
    let created = 0,
      skippedExisting = 0;
    for (const s of db.students.filter(s => s.status === 'ACTIVE')) {
      if (db.invoices.some(v => v.studentId === s.id && v.type === 'TUITION' && v.periodMonth === body.month && v.periodYear === body.year)) {
        skippedExisting++;
        continue;
      }
      const en = db.enrollments.find(e => e.studentId === s.id && !e.leftAt);
      const fee = db.settings.tuitionRates[en?.classId];
      if (!fee) continue;
      db.invoices.push(hydrate('invoices', {
        id: newId(),
        studentId: s.id,
        type: 'TUITION',
        periodMonth: body.month,
        periodYear: body.year,
        dueDate: body.dueDate || now().slice(0, 10),
        items: [{
          description: 'Học phí mock',
          quantity: 1,
          unitAmount: fee
        }],
        createdAt: now()
      }));
      created++;
    }
    return {
      month: body.month,
      year: body.year,
      created,
      skippedExisting,
      classesSkipped: []
    };
  }
}
