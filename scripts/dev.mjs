import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const api = spawn(process.execPath, ['apps/monitor/server.mjs'], { cwd: root, stdio: 'inherit', env: process.env })
const web = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: path.join(root, 'apps/web'), stdio: 'inherit', shell: process.platform === 'win32' })
let stopping = false
const stop = () => { if (stopping) return; stopping = true; api.kill(); web.kill() }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
api.on('exit', stop)
web.on('exit', stop)
