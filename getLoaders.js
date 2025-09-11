const fs = require('node:fs')
const path = require('node:path')
const htmlParser = require('node-html-parser')
;(async () => {
  const doFabric = ['forge', 'neoforge'].every(str => !process.argv.includes(str))
  const doForge = ['fabric', 'neoforge'].every(str => !process.argv.includes(str))
  const doNeoforge = ['fabric', 'forge'].every(str => !process.argv.includes(str))

  /** @type {{ fabric: string[], forge: string[], neoforge: string[] }} */
  const brokenLoaderVersions = JSON.parse(fs.readFileSync('./broken-loader-versions.json', 'utf8'))

  /**
   * @template T
   * @typedef {{ value: T, promise: Promise<T>, hasResolved: boolean }} WrappedPromise
   */
  /** @type {Set<Promise<*>>} */
  const wrappedPromises = new Set()

  /**
   * @template T
   * @param {Promise<T>} promise
   * @returns {WrappedPromise<T>}
   */
  const wrapPromise = promise => {
    wrappedPromises.add(promise)
    /** @type {T} */
    let result
    const obj = {
      get value() {
        if (!obj.hasResolved) throw new Error('Promise has not resolved yet')
        return result
      },
      promise,
      hasResolved: false
    }
    promise.then(value => {
      wrappedPromises.delete(promise)
      obj.hasResolved = true
      result = value
    })
    return obj
  }

  /**
   * Returns truthy if a is more then b
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  const compareVersions = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

  const fabricMetaUrl = 'https://meta.fabricmc.net/v2/'

  /** @type {WrappedPromise<{ mcVersion: string, fabricVersion: string }[]>} */
  const fabricVersions = wrapPromise(
    doFabric
      ? new Promise(async resolve => {
          console.log('Getting fabric game versions')
          /** @type {{ version: string }[]} */
          const raw = await (await fetch(new URL(`${fabricMetaUrl}versions/game`))).json()
          /** @type {{ mcVersion: string, fabricVersion: string }[]} */
          const mcVersions = raw.map(ver => ({
            mcVersion: ver.version,
            fabricVersion: ''
          }))

          /** @type {{ mcVersion: string, fabricVersion: string }[]} */
          const result = []

          let downloadCount = 0

          let isDownloadingCount = 0

          /** @type {(() => Promise<void>)[]} */
          const queue = mcVersions.map(mcVersion => async () => {
            isDownloadingCount++
            if (mcVersion === undefined) throw new TypeError('Uh oh')
            console.log(`Getting fabric loader for mc ${mcVersion.mcVersion} (${downloadCount++}/${mcVersions.length})`)

            /** @type {{ loader: { build: string, version: string } }[]} */
            const options = await (
              await fetch(new URL(`${fabricMetaUrl}versions/loader/${mcVersion.mcVersion}`))
            ).json()
            result.push({
              mcVersion: mcVersion.mcVersion,
              fabricVersion: options.reduce(
                (prev, option) => (compareVersions(option.loader.version, prev) === 1 ? option.loader.version : prev),
                '0'
              )
            })
            isDownloadingCount--
          })

          const tickQueue = () => {
            const item = queue.pop()
            if (item === undefined) {
              if (isDownloadingCount === 0) resolve(result)
              return
            }
            item().then(tickQueue)
          }

          for (let i = 0; i < 10; i++) tickQueue()
        })
      : Promise.resolve([])
  )

  /** @type {WrappedPromise<{ mcVersion: string, forgeVersion: string }[]>} */
  const forgeVersions = wrapPromise(
    doForge
      ? (async () => {
          console.log('Getting forge game versions')

          const firstPage = htmlParser.parse(await (await fetch('https://files.minecraftforge.net/')).text())

          const linkedVersions = [
            firstPage.querySelector(
              'body > main > div.sidebar-left.sidebar-sticky > aside > section > ul > li > ul > li.elem-active'
            )?.textContent,
            ...firstPage
              .querySelectorAll(
                'body > main > div.sidebar-left.sidebar-sticky > aside > section > ul > li > ul > li > a'
              )
              .map(element => element.textContent)
          ]
            .map(version => ({
              mcVersion: version ?? 'MISSING',
              url: `https://files.minecraftforge.net/net/minecraftforge/forge/index_${version ?? 'MISSING'}.html`
            }))
            .filter(entry => compareVersions('1.21', entry.mcVersion) === 1)

          /** @type {{ mcVersion: string, forgeVersion: string }[]} */
          const result = []

          for (let index = 0; index < linkedVersions.length; index++) {
            const link = linkedVersions[index]
            if (link === undefined) throw new TypeError('Uh oh')

            console.log(`Getting forge loader for ${link.mcVersion} (${index + 1}/${linkedVersions.length})`)

            const page = htmlParser.parse(await (await fetch(link.url)).text())

            const forgeVersion = (() => {
              const latest = page.querySelector(
                'body > main > div.sidebar-sticky-wrapper-content > div.promos-wrapper > div.promos-content > div > div:nth-child(1) > div.title > small'
              )
              const recommended = page.querySelector(
                'body > main > div.sidebar-sticky-wrapper-content > div.promos-wrapper > div.promos-content > div > div:nth-child(2) > div.title > small'
              )

              const wrapper = recommended || latest
              if (wrapper === null) throw new Error(`Missing version element for forge ${link.mcVersion}}`)

              return (wrapper.textContent ?? '').replace(' - ', '-')
            })()

            result.push({ mcVersion: link.mcVersion, forgeVersion })
          }

          return result
        })()
      : Promise.resolve([])
  )

  /** @type {WrappedPromise<{ mcVersion: string, neoforgeVersion: string }[]>} */
  const neoforgeVersions = wrapPromise(
    doNeoforge
      ? (async () => {
          /**
           * @param {string} versionString
           * @returns {string}
           */
          const getFirstTwoVersionNumbers = versionString => {
            const splitVersion = versionString.split('.')
            return `${splitVersion[0]}.${splitVersion[1]}`
          }

          const VERSIONS_ENDPOINT = 'https://maven.neoforged.net/api/maven/versions/releases/'
          const NEOFORGE_GAV = 'net/neoforged/neoforge'

          // Reminder, this endpoint will return all NeoForge versions with April Fools versions first, then oldest to newest versions afterwards.
          const allVersionUrl = new URL(VERSIONS_ENDPOINT + encodeURIComponent(NEOFORGE_GAV))

          console.log('Getting neoforge versions')
          const neoforgeVersionsJson = await (await fetch(allVersionUrl)).json()

          // Extract all NeoForge versions.
          /** @type {{ versions: string[] }} */
          const { versions } = neoforgeVersionsJson

          // Remove 0.25w14craftmine and other april fools versions
          const neoforgeVersions = versions.filter(version => !version.startsWith('0'))

          // Using a set to prevent duplicate minecraft versions quickly as we extract the Minecraft versions from the NeoForge versions.
          /** @type {Set<string>} */
          const minecraftVersions = new Set([])
          for (const neoforgeVersion of neoforgeVersions) {
            // The left 2 numbers for NeoForge versions is the last 2 numbers for Minecraft versions.
            minecraftVersions.add(`1.${getFirstTwoVersionNumbers(neoforgeVersion)}`)
          }

          /** @type {{ [mc: string]: string }} */
          const mcToNeoMap = {}

          for (const version of neoforgeVersions) {
            const mcVersion = `1.${getFirstTwoVersionNumbers(version)}`
            if (mcToNeoMap[mcVersion] === undefined) mcToNeoMap[mcVersion] = version
            else if (compareVersions(version, mcToNeoMap[mcVersion]) === 1) mcToNeoMap[mcVersion] = version
          }

          return Object.entries(mcToNeoMap).map(([key, value]) => ({ mcVersion: key, neoforgeVersion: value }))
        })()
      : Promise.resolve([])
  )

  await Promise.all(wrappedPromises)

  for (const [list, broken, loader] of /** @type {[WrappedPromise<{ mcVersion: string }[]>, string[], string][]} */ ([
    [fabricVersions, brokenLoaderVersions.fabric, 'fabric'],
    [forgeVersions, brokenLoaderVersions.forge, 'forge'],
    [neoforgeVersions, brokenLoaderVersions.neoforge, 'neoforge']
  ]))
    for (const brokenVersion of broken) {
      console.log(`Skipping ${brokenVersion} ${loader}: manually skipped.`)
      const index = list.value.findIndex(version => version.mcVersion === brokenVersion)
      if (index !== -1) list.value.splice(index, 1)
    }

  /** @type {Set<string>} */
  const mcVersions = new Set()

  for (const version of [...fabricVersions.value, ...forgeVersions.value, ...neoforgeVersions.value])
    mcVersions.add(version.mcVersion)

  const result = {
    mcVersions: [...mcVersions].sort(compareVersions),
    fabric: fabricVersions.value.sort((a, b) => compareVersions(a.mcVersion, b.mcVersion)),
    forge: forgeVersions.value.sort((a, b) => compareVersions(a.mcVersion, b.mcVersion)),
    neoforge: neoforgeVersions.value.sort((a, b) => compareVersions(a.mcVersion, b.mcVersion))
  }

  fs.writeFileSync(path.join(__dirname, 'site', 'loaders.json'), JSON.stringify(result, undefined, 2), 'utf8')
  console.log('Done')
})()
