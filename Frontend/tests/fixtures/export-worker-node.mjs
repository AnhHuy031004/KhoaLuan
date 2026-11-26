// Browser worker API shim for the Node integration test; production uses exportWorker.js unchanged.
import { parentPort } from 'node:worker_threads';
globalThis.self = {
  postMessage: (value, transfer) => parentPort.postMessage(value, transfer),
};
await import('../../src/utils/exportWorker.js');
parentPort.on('message', (data) => self.onmessage({ data }));
parentPort.postMessage({ ready: true });
