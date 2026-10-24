import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import followRedirects from 'follow-redirects'

async function redirectedHeaders(headers, sensitiveHeaders) {
  let received
  const target = createServer((req, res) => {
    received = req.headers
    res.end('ok')
  })
  const source = createServer((req, res) => {
    res.writeHead(302, { location: `http://localhost:${target.address().port}/` })
    res.end()
  })
  try {
    target.listen(0)
    source.listen(0)
    await Promise.all([once(target, 'listening'), once(source, 'listening')])
    await new Promise((resolve, reject) => {
      const request = followRedirects.http.get({
        hostname: '127.0.0.1',
        port: source.address().port,
        path: '/',
        headers,
        sensitiveHeaders,
      }, response => {
        response.resume()
        response.on('end', resolve)
        response.on('error', reject)
      })
      request.on('error', reject)
      request.setTimeout(5000, () => request.destroy(new Error('Redirect timed out')))
    })
    return received
  } finally {
    await Promise.all([source, target].map(server => new Promise(resolve => server.close(resolve))))
  }
}

test('cross-host redirects strip credentials from Node array-form headers', async () => {
  const headers = await redirectedHeaders([
    'Authorization', 'test-only-auth',
    'Cookie', 'test-only-cookie',
    'X-Public', 'retained',
  ])
  assert.equal(headers.authorization, undefined)
  assert.equal(headers.cookie, undefined)
  assert.equal(headers['x-public'], 'retained')
})

test('custom credential header names with regex characters are stripped', async () => {
  const headers = await redirectedHeaders({
    'X-Api^Key': 'test-only-key',
    'X-Token|Secret': 'test-only-token',
    'X-Public': 'retained',
  }, ['X-Api^Key', 'X-Token|Secret'])
  assert.equal(headers['x-api^key'], undefined)
  assert.equal(headers['x-token|secret'], undefined)
  assert.equal(headers['x-public'], 'retained')
})
