const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleNotifications(context, path, method, body, q, u, session) {
  const {
    db,
    now,
    find,
    paged
  } = context;
  if (path === '/notifications/me') return paged(db.notifications.filter(n => n.userId === u.id), q);
  const read = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (read) {
    const n = find(db.notifications, read[1]);
    if (n.userId !== u.id) fail(404, 'Không tìm thấy.');
    n.readAt = now();
    return n;
  }
}
