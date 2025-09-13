const fs = require('node:fs')
const path = require('node:path')

const LOG_DIR = '/home/jackc/Downloads/build/logs'

/** @type {Object<string, (log: string, mc: string, loader: string) => ({ passed: true } | { passed: false, error?: string })>} */
const tests = {
  Mixins: (log, mc, loader) => ({
    passed: log.split('\n').some(line => line.includes(`Hello from ${loader} on Minecraft ${mc}`))
  }),
  AWs: log => ({
    passed: log.split('\n').some(line => line.includes('Manually exiting'))
  })
}

const queriedTestName = process.argv[2]
const queriedTest = queriedTestName === undefined || queriedTestName === 'All' ? false : tests[queriedTestName]
if (queriedTest === undefined) {
  console.error(`Unknown test: ${queriedTestName}, valid names are ${['All', ...Object.keys(tests)].join(', ')}`)
  process.exit(1)
}

if (queriedTestName === undefined) {
  const latestLogFiles = []
  for (const fileName of fs.readdirSync(LOG_DIR))
    if (fs.statSync(path.join(LOG_DIR, fileName)).isFile() && fileName.startsWith('latest_'))
      latestLogFiles.push(fileName)

  /** @type {Object<string, Object<string, { passed: true } | { passed: false, error?: string }>>} */
  const results = {}
  for (const fileName of latestLogFiles) {
    const mc = fileName.match(/^^latest_runClient_([0-9.]+)-[a-z]+/)?.[1] ?? ''
    const loader = fileName.match(/^latest_runClient_[0-9.]+-([a-z]+)/)?.[1] ?? ''
    const file = fs.readFileSync(path.join(LOG_DIR, fileName), 'utf8')
    results[`${mc}-${loader}`] = Object.fromEntries(
      Object.entries(tests).map(([name, test]) => {
        try {
          const result = test(file, mc, loader)
          if (result.passed) return [name, { passed: true }]
          return [name, { passed: false, error: result.error }]
        } catch (error) {
          return [name, { passed: false, error: String(error) }]
        }
      })
    )
  }
  if (fs.existsSync(path.join(__dirname, 'results.json')))
    fs.renameSync(path.join(__dirname, 'results.json'), path.join(__dirname, 'results.old.json'))
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, undefined, 2))
  console.log(JSON.stringify(results, undefined, 2))
} else {
  console.log(
    Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'results.json'), 'utf8')))
      .flatMap(([version, result]) => {
        if (queriedTestName === 'All')
          return Object.entries(result).map(
            ([name, test]) =>
              `\x1b[96;1m${version}: \x1b[93mName=${name}, \x1b[${91 + Number(test.passed)}mPassed=${test.passed ? 'true' : test.error ? `false, Error=${test.error}` : 'false'}\x1b[0m`
          )
        const test = result[queriedTestName ?? '']
        if (test === undefined) throw new TypeError('Uh oh')
        return `\x1b[96;1m${version}: \x1b[93mName=${queriedTestName}, \x1b[${91 + Number(test.passed)}mPassed=${test.passed ? 'true' : test.error ? `false, Error=${test.error}` : 'false'}\x1b[0m`
      })
      .join('\n')
  )
}
