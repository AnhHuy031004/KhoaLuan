const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handlePayments(context, path, method, body, q, u, session) {
  const {
    db,
    clock,
    now,
    newId,
    find,
    scoped
  } = context;
  const qr = path.match(/^\/payments\/qr\/([^/]+)$/),
    cash = path.match(/^\/payments\/([^/]+)\/confirm-cash$/);
  if (qr || cash) {
    const invoice = find(scoped(db.invoices, u), (qr || cash)[1]);
    if (invoice.status === 'PAID') fail(409, 'Hóa đơn đã thanh toán.');
    const payment = {
      id: newId(),
      invoiceId: invoice.id,
      orderRef: 'MOCK-' + newId().slice(0, 8),
      gateway: cash ? 'CASH' : 'MOCK',
      amount: invoice.total,
      status: cash ? 'SUCCESS' : 'PENDING',
      paidAt: cash ? now() : null
    };
    db.payments.push(payment);
    if (cash) invoice.status = 'PAID';
    return cash ? payment : {
      paymentId: payment.id,
      orderRef: payment.orderRef,
      amount: payment.amount,
      status: 'PENDING',
      expiresAt: new Date(clock().getTime() + 900000).toISOString(),
      checkoutUrl: null,
      qrCodeDataUrl: null,
      message: 'Thanh toán giả lập, không có QR thật. Dùng tài khoản Admin xác nhận tiền mặt để thử trạng thái đã trả.'
    };
  }
}
