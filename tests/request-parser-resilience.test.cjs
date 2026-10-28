const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const http = require('node:http');
const { gzipSync } = require('node:zlib');

// Keep malformed synthetic input on loopback in a disposable process: an
// unhandled decompressor error must fail the test, not kill the test runner.
test('JSON parser survives malformed compressed input and still serves requests', { timeout: 10000 }, async (t) => {
  const child = spawn(process.execPath, ['-e', `
    const express = require('express');
    const app = express();
    app.use(express.json({ limit: '2mb' }));
    app.post('/', (req, res) => res.json(req.body));
    app.get('/health', (_req, res) => res.send('ok'));
    app.use((err, req, res, next) => res.status(err.status || 500).end());
    const server = app.listen(0, '127.0.0.1', () => process.send(server.address().port));
  `], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  let errors = '';
  child.stderr.on('data', (data) => { errors += data; });
  t.after(() => child.kill());
  const [port] = await once(child, 'message');

  function request(path, body, encoding) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path,
        method: body ? 'POST' : 'GET',
        headers: body ? { 'content-type': 'application/json', 'content-encoding': encoding } : {},
      }, (res) => {
        let text = '';
        res.on('data', (chunk) => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, text }));
      });
      req.on('error', reject);
      req.setTimeout(2000, () => req.destroy(new Error('request timed out')));
      req.end(body);
    });
  }

  const valid = gzipSync(Buffer.from('{"practice":"hello"}'));
  assert.deepEqual(await request('/', valid, 'gzip'), {
    status: 200, text: '{"practice":"hello"}',
  });
  const malformed = Buffer.concat([valid, Buffer.from('invalid trailing bytes')]);
  const result = await request('/', malformed, 'gzip');
  assert.ok(result.status >= 400 && result.status < 500);
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(child.exitCode, null, errors);
  assert.deepEqual(await request('/health'), { status: 200, text: 'ok' });
});
