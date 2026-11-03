const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleSchedules(context, path, method, body, q, u, session) {
  const {
    db,
    newId,
    find
  } = context;
  const slot = path.match(/^\/classes\/([^/]+)\/schedules(?:\/([^/]+))?$/);
  if (slot) {
    const c = find(db.classes, slot[1]);
    if (method === 'POST') {
      const s = {
        ...body,
        id: newId()
      };
      c.schedules.push(s);
      return s;
    }
    c.schedules = c.schedules.filter(s => s.id !== slot[2]);
    return {
      deleted: true
    };
  }
}
