const fs = require('node:fs')
const path = require('node:path')
const { XMLParser } = require('fast-xml-parser')
;(async () => {
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
    (async () => {
      console.log('Getting fabric game versions')
      /** @type {{ version: string }[]} */
      const raw = await (await fetch(new URL(`${fabricMetaUrl}versions/game`))).json()
      /** @type {{ mcVersion: string, fabricVersion: string }[]} */
      const mcVersions = raw.map(ver => ({
        mcVersion: ver.version,
        fabricVersion: ''
      }))

      for (let index = 0; index < mcVersions.length; index++) {
        const mcVersion = mcVersions[index]
        if (mcVersion === undefined) throw new TypeError('Uh oh')
        console.log(`Getting fabric loader for mc ${mcVersion.mcVersion} (${index + 1}/${mcVersions.length})`)
        /** @type {{ loader: { build: string, version: string } }[]} */
        const options = await (await fetch(new URL(`${fabricMetaUrl}versions/loader/${mcVersion.mcVersion}`))).json()
        mcVersion.fabricVersion = options.reduce(
          (prev, option) => (Number.parseInt(option.loader.build) > Number.parseInt(prev.build) ? option.loader : prev),
          { build: '0', version: '' }
        ).version
      }

      return mcVersions
    })()
  )

  /** @type {WrappedPromise<{ mcVersion: string, forgeVersion: string }[]>} */
  const forgeVersions = wrapPromise(
    (async () => {
      console.log('Getting forge versions')
      const xml = await new XMLParser().parse(
        await (
          await fetch(new URL('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml'))
        ).text()
      )

      /** @type {string[]} */
      const forgeVersions = xml.metadata.versioning.versions.version

      /** @type {{ [mc: string]: string }} */
      const mcToForgeMap = {}

      for (const version of forgeVersions) {
        const mcVersion = version.split('-')[0] ?? ''
        if (mcToForgeMap[mcVersion] === undefined) mcToForgeMap[mcVersion] = version
        else if (compareVersions(version, mcToForgeMap[mcVersion]) === 1) mcToForgeMap[mcVersion] = version
      }

      return Object.entries(mcToForgeMap).map(([key, value]) => ({ mcVersion: key, forgeVersion: value }))
    })()
  )

  /** @type {WrappedPromise<{ mcVersion: string, neoforgeVersion: string }[]>} */
  const neoforgeVersions = wrapPromise(
    (async () => {
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
  )

  await Promise.all(wrappedPromises)

  /** @type {Set<string>} */
  const mcVersions = new Set()

  for (const version of [...fabricVersions.value, ...forgeVersions.value, ...neoforgeVersions.value])
    mcVersions.add(version.mcVersion)

  const result = {
    mcVersions: [...mcVersions],
    fabric: fabricVersions.value,
    forge: forgeVersions.value,
    neoforge: neoforgeVersions.value
  }

  fs.writeFileSync(path.join(__dirname, 'site', 'loaders.json'), JSON.stringify(result, undefined, 2), 'utf8')
  console.log('Done')
})()
