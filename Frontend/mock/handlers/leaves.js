const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleLeaves(context, path, method, body, q, u, session) {
  const {
    db,
    find,
    scoped
  } = context;
  const review = path.match(/^\/leave-requests\/([^/]+)\/(review|cancel)$/);
  if (review) {
    const r = find(scoped(db.leaves, u), review[1]);
    if (r.status !== 'PENDING') fail(409, 'Đơn đã được xử lý.');
    Object.assign(r, body, {
      status: review[2] === 'cancel' ? 'CANCELLED' : body.status || (body.approved ? 'APPROVED' : 'REJECTED')
    });
    return r;
  }
}
