import test from 'node:test';
import assert from 'node:assert/strict';
import { createResourceEvents } from '../src/services/providers/resourceEvents.js';
test('one burst across resources reloads a shared subscriber once and unsubscribe removes listeners', async () => {
  const window = new EventTarget(),
    document = new EventTarget();
  document.visibilityState = 'visible';
  const subscribe = createResourceEvents({ window, document, key: 'db' });
  let calls = 0;
  const callback = () => calls++,
    off1 = subscribe('attendance', callback),
    off2 = subscribe('schedules', callback);
  for (const resource of ['attendance', 'schedules', 'attendance']) {
    const event = new Event('vovinam:mock-change');
    event.detail = { resource };
    window.dispatchEvent(event);
  }
  await Promise.resolve();
  assert.equal(calls, 1);
  window.dispatchEvent(new Event('focus'));
  await Promise.resolve();
  assert.equal(calls, 2);
  off1();
  off2();
  window.dispatchEvent(new Event('focus'));
  await Promise.resolve();
  assert.equal(calls, 2);
});
