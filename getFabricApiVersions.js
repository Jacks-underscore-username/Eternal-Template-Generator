const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')
;(async () => {
  const scriptPathTs = path.join(__dirname, 'innerGetFabricApiVersions.ts')
  const inScriptPathJs = path.join(__dirname, 'innerGetFabricApiVersions.js')
  const outScriptPathJs = path.join(__dirname, 'site', 'libs', 'fabric.net', 'Api.js')
  const scriptSrc = await (
    await fetch('https://raw.githubusercontent.com/FabricMC/fabricmc.net/main/scripts/src/lib/Api.ts')
  ).text()
  fs.writeFileSync(
    scriptPathTs,
    [
      'const cacheFetch = async (url: string): Promise<Response> => {',
      '  const cached: { time: number; value: string } | null =',
      "    sessionStorage.getItem(url) === null ? null : JSON.parse(sessionStorage.getItem(url) ?? '')",
      '  let value: string',
      '  if (cached === null || Date.now() - cached.time > 10_000) {',
      '    value = await (await fetch(url)).text()',
      '    sessionStorage.setItem(url, JSON.stringify({ time: Date.now(), value }))',
      '  } else value = cached.value',
      '  // @ts-expect-error',
      '  return {',
      '    ok: true,',
      '    text: () => Promise.resolve(value),',
      '    json: () => Promise.resolve(JSON.parse(value))',
      '  }',
      '}',
      ''
    ].join('\n') + scriptSrc.replaceAll('fetch(', 'cacheFetch('),
    'utf8'
  )
  execSync(
    `${path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc')} --module ESNext --target ESNext --skipLibCheck ${scriptPathTs}`
  )
  fs.rmSync(scriptPathTs)
  if (!fs.existsSync(path.dirname(outScriptPathJs))) fs.mkdirSync(path.dirname(outScriptPathJs))
  fs.writeFileSync(outScriptPathJs, fs.readFileSync(inScriptPathJs))
  fs.rmSync(inScriptPathJs)
  console.log('Done')
})()
