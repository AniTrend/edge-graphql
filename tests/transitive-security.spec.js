import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'
import { GraphQLPhoneNumber } from 'graphql-scalars'
import qs from 'qs'

const require = createRequire(import.meta.url)

test('patched transitive security versions remain installed', () => {
  assert.equal(require('follow-redirects/package.json').version, '1.16.2')
  assert.equal(require('graphql-scalars/package.json').version, '2.0.1')
  assert.equal(require('systeminformation/package.json').version, '5.33.19')
  assert.equal(require('qs/package.json').version, '6.17.1')
})

test('PhoneNumber rejection remains bounded for adversarial digits', () => {
  const started = performance.now()
  assert.throws(() => GraphQLPhoneNumber.parseValue(`${'1'.repeat(28)}x`))
  assert.ok(performance.now() - started < 500)
})

test('qs comma serialization rejects no process-killing coercion error', () => {
  assert.doesNotThrow(() => qs.stringify({ value: [{ toString: 'not-callable' }] }, {
    arrayFormat: 'comma',
  }))
})
