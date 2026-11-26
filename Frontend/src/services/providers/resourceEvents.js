// One set of browser listeners per provider; coalesce a burst of related changes.
export function createResourceEvents({
  window,
  document,
  key,
  eventName = 'vovinam:mock-change',
}) {
  const listeners = new Map();
  let scheduled = false,
    all = false;
  const pending = new Set();
  function flush() {
    scheduled = false;
    const callbacks = new Set();
    for (const [resource, entries] of listeners)
      if (all || pending.has(resource))
        for (const callback of entries) callbacks.add(callback);
    all = false;
    pending.clear();
    for (const callback of callbacks) callback();
  }
  function queue(resource) {
    if (!resource || resource === 'ranks' || resource === 'permissions')
      all = true;
    else pending.add(resource);
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
  }
  const storage = (e) => {
      if (e.key === key || e.key === null) queue();
    },
    local = (e) => queue(e.detail?.resource),
    focus = () => queue(),
    visible = () => {
      if (document.visibilityState === 'visible') queue();
    };
  function attach() {
    window.addEventListener('storage', storage);
    window.addEventListener(eventName, local);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visible);
  }
  function detach() {
    window.removeEventListener('storage', storage);
    window.removeEventListener(eventName, local);
    window.removeEventListener('focus', focus);
    document.removeEventListener('visibilitychange', visible);
  }
  return (resource, callback) => {
    if (!listeners.size) attach();
    if (!listeners.has(resource)) listeners.set(resource, new Set());
    listeners.get(resource).add(callback);
    return () => {
      const entries = listeners.get(resource);
      entries?.delete(callback);
      if (!entries?.size) listeners.delete(resource);
      if (!listeners.size) detach();
    };
  };
}
