import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { setTimeout, clearTimeout } from 'node:timers'
import process from 'node:process'

const { fetch } = globalThis

test('gateway rejects the bundled browser IDE while preserving the GraphQL API', { timeout: 30000 }, async () => {
  const reservation = createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  const gateway = spawn(process.execPath, [
    'node_modules/@graphql-hive/gateway/dist/bin.js',
    'supergraph', '--config-path', 'gateway.config.ts',
  ], {
    env: {
      PATH: process.env.PATH,
      PORT: String(port),
      APP_HOST: '127.0.0.1',
      NODE_ENV: 'test',
      GRAPHIQL: 'true',
      OTEL_TRACES_ENABLED: 'false',
      OTEL_METRICS_ENABLED: 'false',
      OTEL_LOGS_ENABLED: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  for (const stream of [gateway.stdout, gateway.stderr]) {
    stream.on('data', chunk => { logs = (logs + chunk).slice(-8000) })
  }
  const exited = once(gateway, 'exit')
  const endpoint = `http://127.0.0.1:${port}`
  try {
    let ready = false
    for (let attempt = 0; attempt < 150; attempt++) {
      if (gateway.exitCode !== null) assert.fail(`Gateway exited: ${logs}`)
      try {
        ready = (await fetch(`${endpoint}/ready`)).status === 200
      } catch { /* Wait for the local listener. */ }
      if (ready) break
      await delay(100)
    }
    assert.ok(ready, `Gateway did not become ready: ${logs}`)
    assert.equal((await fetch(`${endpoint}/health`)).status, 200)
    const ide = await fetch(`${endpoint}/graphql`, { headers: { accept: 'text/html' } })
    assert.ok(!ide.headers.get('content-type')?.includes('text/html'))
    assert.doesNotMatch(await ide.text(), /HiveLaboratory|DOMPurify|<!doctype html/i)
    const api = await fetch(`${endpoint}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
    assert.equal(api.status, 200)
    assert.deepEqual(await api.json(), { data: { __typename: 'Query' } })
  } finally {
    gateway.kill('SIGTERM')
    const force = setTimeout(() => gateway.kill('SIGKILL'), 5000)
    await exited
    clearTimeout(force)
  }
})
