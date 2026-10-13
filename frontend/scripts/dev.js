import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const project = join(dirname(fileURLToPath(import.meta.url)), '..')
const vite = join(project, 'node_modules', 'vite', 'bin', 'vite.js')
const build = spawnSync(process.execPath, [vite, 'build', '--configLoader', 'runner'], { cwd: project, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status || 1)

const watch = spawn(process.execPath, [vite, 'build', '--watch', '--configLoader', 'runner'], { cwd: project, stdio: 'inherit' })
const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--configLoader', 'runner'], { cwd: project, stdio: 'inherit' })

const stop = () => {
  watch.kill()
  preview.kill()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
watch.on('exit', (code) => { if (code && !preview.killed) preview.kill() })
preview.on('exit', (code) => { if (code && !watch.killed) watch.kill() })
