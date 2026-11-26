export function invoiceBaseAmount(rates = [], classes = [], classId, period) {
  const rate = rates.find(
    (r) =>
      r.classId === classId && r.period === period && r.status === 'ACTIVE',
  );
  const amount = rate?.amount ?? classes.find((c) => c.id === classId)?.tuition;
  return amount === undefined || amount === null ? null : Number(amount);
}

// Apply an approved concession when an invoice is created or explicitly edited.
// Existing issued invoices never change merely because a proposal is reviewed.
export function priceInvoice(db, invoice) {
  const baseAmount = Number(invoice.amount);
  if (!Number.isFinite(baseAmount) || baseAmount < 0)
    throw Object.assign(new Error('Học phí gốc không hợp lệ.'), {
      status: 400,
    });
  const relief = db.tuitionRelief.find(
    (r) =>
      r.studentId === invoice.studentId &&
      r.classId === invoice.classId &&
      r.period === invoice.period &&
      r.status === 'APPROVED',
  );
  const coupon = invoice.discountId
    ? db.discounts.find((d) => d.id === invoice.discountId)
    : null;
  if (
    coupon &&
    (coupon.status !== 'ACTIVE' ||
      coupon.expiresAt < new Date().toISOString().slice(0, 10))
  )
    throw Object.assign(new Error('Khuyến mãi không còn hiệu lực.'), {
      status: 400,
    });
  // Use the larger benefit rather than stacking two percentages.
  const reliefPercent = Number(relief?.percent || 0),
    couponPercent = Number(coupon?.percent || 0);
  const appliedPercent = Math.max(reliefPercent, couponPercent);
  return {
    baseAmount,
    amount: Math.round(baseAmount * (1 - appliedPercent / 100)),
    appliedPercent,
    reliefId: reliefPercent >= couponPercent ? relief?.id || null : null,
  };
}
