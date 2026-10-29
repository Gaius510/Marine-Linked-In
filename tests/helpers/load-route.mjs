import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Execute actual route, validation and serializer source without loading the
// real authentication/database modules or writing compiled output to disk.
export function routeLoader({ db, user }) {
  const cache = new Map()
  function load(file) {
    assert.ok(!['src/lib/db.ts', 'src/lib/auth.ts'].some((target) => file === path.join(root, target)), 'Real database/authentication imports are forbidden in these tests')
    if (cache.has(file)) return cache.get(file)
    const exports = {}
    cache.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    }).outputText
    const externalRequire = createRequire(file)
    const requireDependency = (specifier) => {
      if (specifier === '@/lib/db') return { db }
      if (specifier === '@/lib/auth') return { getCurrentUser: async () => user }
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const target = specifier.startsWith('@/')
          ? path.join(root, 'src', specifier.slice(2))
          : path.resolve(path.dirname(file), specifier)
        const resolved = [target, `${target}.ts`, `${target}.mjs`].find((candidate) => existsSync(candidate))
        assert.ok(resolved, `Cannot resolve ${specifier}`)
        return load(resolved)
      }
      return externalRequire(specifier)
    }
    runInThisContext(`(function(exports, require) { ${code}\n})`, { filename: file })(exports, requireDependency)
    return exports
  }
  return (relativePath) => load(path.join(root, relativePath))
}
