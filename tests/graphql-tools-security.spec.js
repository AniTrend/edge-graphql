import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)
const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'))
const copies = Object.entries(lock.packages).filter(([name]) =>
  name.endsWith('node_modules/@graphql-tools/utils'),
)

test('every locked and installed GraphQL Tools utils copy includes both security fixes', () => {
  assert.ok(copies.length > 0, 'Expected at least one utils copy')
  for (const [name, entry] of copies) {
    // Both advisories are fixed in stable 12.0.2 and later; reject prereleases.
    assert.match(entry.version, /^\d+\.\d+\.\d+$/, name)
    const [major, minor, patch] = entry.version.split('.').map(Number)
    assert.ok(
      major > 12 || (major === 12 && (minor > 0 || patch >= 2)),
      `${name}@${entry.version}: GHSA-7mx3-vvmw-hjmv / GHSA-c4qx-w738-7hr3`,
    )
    const installed = JSON.parse(readFileSync(new URL(`${name}/package.json`, root), 'utf8'))
    assert.equal(installed.version, entry.version, `${name}: run npm ci`)
  }
})

// Exercise each physical copy, including nested copies introduced by future updates.
for (const [name] of copies) {
  test(`${name}: mergeDeep does not follow or write prototype keys`, () => {
    const { mergeDeep } = require(fileURLToPath(new URL(name, root)))
    const marker = 'graphqlToolsSecurityMarker'
    const before = Object.getOwnPropertyDescriptors(Object.prototype)
    const beforeFunction = Object.getOwnPropertyDescriptors(Function.prototype)
    try {
      for (const key of ['__proto__', 'constructor', 'prototype']) {
        const payload = JSON.parse(`{"${key}":{"${marker}":true}}`)
        const result = mergeDeep([{}, payload])
        assert.equal(Object.hasOwn(result, key), false, key)
      }
      mergeDeep([{}, JSON.parse(`{"constructor":{"__proto__":{"${marker}":true}}}`)])
      const inherited = Object.create({ [marker]: { safe: true } })
      mergeDeep([inherited, { [marker]: { added: true } }])
      assert.equal(inherited[marker].added, undefined)
      assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before)
      assert.deepEqual(Object.getOwnPropertyDescriptors(Function.prototype), beforeFunction)
      assert.deepEqual(mergeDeep([{ nested: { a: 1 } }, { nested: { b: 2 } }]), {
        nested: { a: 1, b: 2 },
      })
    } finally {
      delete Object.prototype[marker]
      delete Function.prototype[marker]
    }
  })

  test(`${name}: incremental paths cannot pollute prototypes`, () => {
    const { mergeIncrementalResult } = require(fileURLToPath(new URL(name, root)))
    const marker = 'graphqlToolsSecurityMarker'
    const before = Object.getOwnPropertyDescriptors(Object.prototype)
    const segments = [
      '__proto__', 'constructor', 'prototype',
      ['__proto__'], ['constructor'], ['prototype'],
      { toString: () => '__proto__' },
    ]
    try {
      for (const segment of segments) {
        for (const patch of [
          { path: [segment, marker], data: 'polluted' },
          { path: [segment, marker], items: ['polluted'] },
          { path: [marker, segment], data: { [marker]: 'polluted' } },
        ]) {
          for (const incrementalResult of [patch, { incremental: [patch] }]) {
            mergeIncrementalResult({ executionResult: { data: {} }, incrementalResult })
            assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before)
          }
        }
      }
      const executionResult = { data: { viewer: { id: '1' }, items: [] } }
      mergeIncrementalResult({
        executionResult,
        incrementalResult: { path: ['viewer'], data: { name: 'Tora' } },
      })
      mergeIncrementalResult({
        executionResult,
        incrementalResult: { path: ['items', 0], items: ['first'] },
      })
      assert.deepEqual(executionResult.data, {
        viewer: { id: '1', name: 'Tora' }, items: ['first'],
      })
    } finally {
      delete Object.prototype[marker]
    }
  })
}
