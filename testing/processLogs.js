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
  }),
  ClientSide: log => ({ passed: log.split('\n').some(line => line.includes('Hello from the client side!')) }),
  CommonSide: log => ({ passed: log.split('\n').some(line => line.includes('Hello from the common side!')) })
}

const queriedTestNames = process.argv.slice(2)
const queriedTests = Array.from(
  new Set(
    queriedTestNames.flatMap(name => {
      if (name === 'All') return Object.entries(tests)
      const test = tests[name]
      if (test === undefined) {
        console.error(`Unknown test: ${name}`)
        console.error(`Valid names are: ${[...Object.keys(tests), 'All'].join(', ')}`)
        process.exit(1)
      }
      return [[name, test]]
    })
  )
)

if (!queriedTests.length) {
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
} else
  console.log(
    Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'results.json'), 'utf8')))
      .map(
        /**
         *
         * @param {[String, { [name: string]: ({ passed: true } | { passed: false, error?: string })}]} param0
         * @returns
         */
        ([version, results]) => {
          const parts = []
          for (const [name, result] of Object.entries(results))
            if (queriedTests.some(entry => entry[0] === name))
              parts.push(
                `\x1b[93m${name}:`,
                `\x1b[${91 + Number(result.passed)}m${result.passed ? 'Passed' : result.error ? `Failed, Error: ${result.error}` : 'Failed'}`
              )
          return [`\x1b[96m${version}`, ...parts, '\x1b[0m']
        }
      )
      .map((line, _index, lines) =>
        line.reduce(
          (prev, part, index) =>
            index
              ? prev +
                ' '.repeat(
                  lines.reduce((pad, subLine) => Math.max(pad, subLine[index - 1]?.length ?? 0), 0) -
                    (line[index - 1]?.length ?? 0) +
                    1
                ) +
                part
              : part,
          ''
        )
      )
      .join('\n')
  )
