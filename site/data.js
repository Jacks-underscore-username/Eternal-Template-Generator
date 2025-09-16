/**
 * @import { Mc, Loader, Id, Mapper, Yarn, DependencyInfo, ModrinthProject, ModrinthError, ModrinthProjectVersion, VersionConstraints, ExtraFiles } from './types.d.js'
 */

import { VersionMap, asUniqueStr, UNIQUE_STRING_TYPES, ObjectEntries, asStr, loader_fabric } from './types.d.js'

import * as FabricNetApi from './libs/fabric.net/Api.js'

const CACHE_LENGTH = 60 * 60 * 60 * 1000

const fabricMetaUrl = 'https://meta.fabricmc.net/v2/'
const modrinthUrl = 'https://api.modrinth.com/v2/'

export const fabricApiId = asUniqueStr('P7dR8mSH', UNIQUE_STRING_TYPES.Id)

/** @type {{ mcVersions: Mc[], fabric: { mcVersion: Mc, fabricVersion: string }[], forge: { mcVersion: Mc, forgeVersion: string }[], neoforge: { mcVersion: Mc, neoforgeVersion: string }[] }} */
export const {
  mcVersions: allMcVersions,
  fabric: fabricVersions,
  forge: forgeVersions,
  neoforge: neoforgeVersions
} = await (await fetch('./loaders.json')).json()

/** @type {{ [loader: Loader]: { [mc: Mc]: string } }}} */
const rawYarnPatches = await (await fetch('./yarn-patches.json')).json()
export const yarnPatches = VersionMap.fromEntries(
  ObjectEntries(rawYarnPatches).flatMap(([loader, entry]) =>
    ObjectEntries(entry).flatMap(([mc, patch]) => ({ loader, mc, value: patch }))
  )
)

const template = await (await fetch('./template.json')).text()

/**
 * @param {Mapper} mapper
 * @returns {string}
 */
export const getTemplate = mapper => {
  if (asStr(mapper) !== 'yarn')
    console.warn(
      `Warning: The ${mapper} mappings are not fully supported yet, you may have to remap the JAVA side of the template.`
    )
  return template
}

/**
 * @param {URL} url
 * @returns {Promise<string>}
 */
const cacheFetch = async url => {
  const cache = sessionStorage.getItem(url.toString())
  /** @type {{value: string, time: number}} */
  const { value, time } = cache !== null ? JSON.parse(cache) : { value: '', time: 0 }
  if (Date.now() - time >= CACHE_LENGTH) {
    const newValue = await (await fetch(url)).text()
    try {
      sessionStorage.setItem(url.toString(), JSON.stringify({ value: newValue, time: Date.now() }))
    } catch (err) {
      console.warn(err)
    }
    return newValue
  }
  return Promise.resolve(value)
}

/**
 * @template T
 * @param {string} name
 * @param {() => Promise<T>} getter
 * @returns {Promise<T>}
 */
const cache = async (name, getter) => {
  const rawCache = sessionStorage.getItem(name)
  /** @type {{ value: T, date: number } | null} */
  const cachedEntry = rawCache === null ? null : JSON.parse(rawCache)
  if (cachedEntry !== null && Date.now() - cachedEntry.date <= CACHE_LENGTH) return cachedEntry.value
  const freshValue = await getter()
  if (freshValue === undefined) throw new TypeError('Getter returned undefined')
  sessionStorage.setItem(name, JSON.stringify({ value: freshValue, date: Date.now() }))
  return freshValue
}

/**
 * @param {Mc} version
 * @returns {boolean}
 */
const isRelease = version => ' -_abcdefghijklmnopqrstuvwxyz'.split('').every(char => !version.includes(char))

/**
 * @param {Mc} version
 * @returns {boolean}
 */
const isSnapshot = version => /^[0-9]+w/.test(version)

/**
 * Returns truthy if a is more then b
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export const compareVersions = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

export const sortedMcVersions = Array.from(allMcVersions)
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
  .sort((a, b) => {
    if (isSnapshot(a) !== isSnapshot(b)) return isSnapshot(a) ? 1 : -1
    if (isSnapshot(a)) {
      const ay = Number.parseInt(a.match(/^[0-9]+/)?.[0] ?? '')
      const by = Number.parseInt(b.match(/^[0-9]+/)?.[0] ?? '')
      if (ay !== by) return by - ay
      const aw = Number.parseInt(a.match(/^[0-9]+w([0-9]+)/)?.[1] ?? '')
      const bw = Number.parseInt(b.match(/^[0-9]+w([0-9]+)/)?.[1] ?? '')
      return bw - aw
    }
    const aMajor = Number.parseInt(a.match(/^1\.([0-9]+)/)?.[1] ?? '')
    const bMajor = Number.parseInt(b.match(/^1\.([0-9]+)/)?.[1] ?? '')
    if (aMajor !== bMajor) return bMajor - aMajor
    const aMinor = Number.parseInt(a.match(/^1\.[0-9]+\.([0-9]+)/)?.[1] ?? '0')
    const bMinor = Number.parseInt(b.match(/^1\.[0-9]+\.([0-9]+)/)?.[1] ?? '0')
    if (aMinor !== bMinor) return bMinor - aMinor
    if (isRelease(a) !== isRelease(b)) return isRelease(a) ? -1 : 1
    return 0
  })

/** @type {Promise<Yarn[]>} */
const rawYarnVersions = (async () => JSON.parse(await cacheFetch(new URL(`${fabricMetaUrl}versions/yarn`))))()

/**
 * @returns {Promise<{ [mc: Mc]: Yarn | undefined }>}
 */
export const getYarnVersions = async () => {
  const options = await rawYarnVersions
  /** @type {Object<string, Yarn | undefined>} */
  const result = {}
  for (const option of options)
    if (option.stable && (result[option.gameVersion] === undefined || !result[option.gameVersion]?.stable))
      result[option.gameVersion] = option
    else if (result[option.gameVersion] === undefined) result[option.gameVersion] = option

  return result
}

/** @type {Promise<{ [mc: Mc]: string }>} */
const parchmentVersions = (async () =>
  JSON.parse(await cacheFetch(new URL('https://versioning.parchmentmc.org/versions'))).releases)()

export const getParchmentVersions = () => parchmentVersions

/** @type {Promise<{ [mc: Mc]: string }>} */
const fabricApiVersions = new Promise(async resolve => {
  /** @type {{ version: Mc, stable: boolean }[]} */
  const mcVersions = await FabricNetApi.getGameVersions()
  const queue = mcVersions.map(entry => entry.version)
  /** @type {{ [mc: Mc]: string }} */
  const results = {}
  let threadCount = 0
  const tickQueue = async () => {
    threadCount++
    const mc = queue.pop()
    if (mc === undefined) return
    results[mc] = await FabricNetApi.getApiVersionForMinecraft(mc)
    threadCount--
    if (queue.length) tickQueue()
    else resolve(results)
  }
  for (let i = 0; i < 1; i++) tickQueue()
})

/**
 * @param {Mc[]} mcVersions
 * @param {Loader[]} loaders
 * @param {(message: string) => void} statusSubscriber
 * @param {DependencyInfo[]} manualDependencies
 * @returns {Promise<(DependencyInfo & { versions: VersionMap<string> })[]>}
 */
export const getDependencyVersions = async (mcVersions, loaders, statusSubscriber, manualDependencies) => {
  /** @type {(DependencyInfo & { mc: Mc, loader: Loader })[]}} */
  const unprocessed = []

  /** @type {(DependencyInfo & { versions: VersionMap<ModrinthProjectVersion> })[]} */
  const processed = []

  /** @type {{ [id: Id]: DependencyInfo }} */
  const infoMap = {}

  for (const manualDependency of manualDependencies) {
    infoMap[manualDependency.id] = manualDependency
    for (const loader of loaders)
      if (manualDependency.validLoaders.includes(loader))
        for (const mc of mcVersions)
          unprocessed.push({
            ...manualDependency,
            mc,
            loader
          })
  }

  while (unprocessed.length) {
    const info = unprocessed[0]
    if (info === undefined) throw new TypeError('Uh oh')
    /** @type {(DependencyInfo & { mc: Mc, loader: Loader })[]}} */
    const current = []
    for (let index = 0; index < unprocessed.length; index++) {
      const entry = unprocessed[index]
      if (entry === undefined) throw new TypeError('Uh oh')
      if (entry.id === info.id) {
        current.push(entry)
        unprocessed.splice(index, 1)
        index--
      }
    }

    /** @type {VersionMap<ModrinthProjectVersion>} */
    const versions = new VersionMap()

    const mcVersions = new Set(current.map(entry => entry.mc))
    const loaders = new Set(current.map(entry => entry.loader))
    const url = new URL(`${modrinthUrl}project/${info.id}/version`)
    url.searchParams.set('game_versions', JSON.stringify([...mcVersions]))
    url.searchParams.set('loaders', JSON.stringify([...loaders]))
    console.info(`Getting ${info.slug} for mc ${[...mcVersions].join(', ')} and loaders ${[...loaders].join(', ')}`)
    statusSubscriber(`Getting ${info.slug} versions`)
    /** @type {ModrinthProjectVersion[]} */
    const options =
      info.id === fabricApiId
        ? ObjectEntries(await fabricApiVersions).map(
            /**
             * @param {[Mc, string]} entry
             * @returns {ModrinthProjectVersion}
             */
            ([mc, version]) => ({
              version_number: version,
              game_versions: [mc],
              loaders: [loader_fabric],
              dependencies: []
            })
          )
        : await (await fetch(url)).json()
    for (const option of options)
      for (const mc of option.game_versions)
        for (const loader of option.loaders)
          if (
            current.some(entry => entry.mc === mc && entry.loader === loader) &&
            versions.get(mc, loader) === undefined
          )
            versions.set(mc, loader, option)

    for (const version of versions.entries) {
      let entry = processed.find(entry => entry.id === info.id)
      if (entry === undefined) {
        entry = {
          name: info.name,
          id: info.id,
          slug: info.slug,
          validLoaders: info.validLoaders,
          required: info.required,
          versions: new VersionMap(),
          javaDepType: info.javaDepType
        }
        processed.push(entry)
      }
      const oldEntry = entry.versions.get(version.mc, version.loader)
      if (oldEntry === undefined) entry.versions.set(version.mc, version.loader, version.value)
      else
        entry.versions.set(
          version.mc,
          version.loader,
          version.value.version_number !== null &&
            oldEntry.version_number !== null &&
            compareVersions(version.value.version_number, oldEntry.version_number)
            ? version.value
            : oldEntry
        )
      for (const dependency of version.value.dependencies)
        if (dependency.dependency_type === 'required') {
          let subInfo = infoMap[dependency.project_id]
          if (subInfo === undefined) {
            /** @type {ModrinthProject} */
            const response = JSON.parse(await cacheFetch(new URL(`${modrinthUrl}project/${dependency.project_id}`)))
            subInfo = infoMap[dependency.project_id] = {
              name: response.title,
              id: response.id,
              slug: response.slug,
              validLoaders: response.loaders,
              required: info.required,
              javaDepType: info.javaDepType
            }
          }
          if (processed.find(entry => entry.id === subInfo.id) === undefined)
            unprocessed.push({
              ...subInfo,
              mc: version.mc,
              loader: version.loader
            })
        }
    }
  }

  return processed
    .map(dependency => ({
      ...dependency,
      versions: dependency.versions.map(version => {
        const versionNumber = version.value.version_number
        if (versionNumber === null) throw new Error('Missing version number for modrinth project')
        return { ...version, value: versionNumber }
      })
    }))
    .reverse()
}

/**
 * @param {string} version
 * @returns {boolean}
 */
const doesFabricSupportVersion = version => fabricVersions.some(entry => entry.mcVersion === version)
/**
 * @param {string} version
 * @returns {boolean}
 */
const doesNeoforgeSupportVersion = version => neoforgeVersions.some(entry => entry.mcVersion === version)
/**
 * @param {string} version
 * @returns {boolean}
 */
const doesForgeSupportVersion = version => forgeVersions.some(entry => entry.mcVersion === version)

/**
 * @param {string} version
 * @param {Loader} loader
 * @returns {boolean}
 */
export const doesLoaderSupportVersion = (version, loader) =>
  (loader === 'fabric' && doesFabricSupportVersion(version)) ||
  (loader === 'forge' && doesForgeSupportVersion(version)) ||
  (loader === 'neoforge' && doesNeoforgeSupportVersion(version))

/**
 * @param {Mc} version
 * @param {Loader | undefined} loader
 * @param {VersionConstraints} versionConstraints
 * @param {{ mc: Mc, loader: Loader }[]} selectedVersions
 * @returns {boolean}
 */
export const shouldShowVersion = (version, loader, versionConstraints, selectedVersions) => {
  if (versionConstraints.onlySelected && !selectedVersions.some(entry => entry.mc === version)) return false
  if (versionConstraints.onlyRelease && !isRelease(version)) return false
  if ((loader === 'fabric' || versionConstraints.supportsFabric) && !doesFabricSupportVersion(version)) return false
  if ((loader === 'forge' || versionConstraints.supportsForge) && !doesForgeSupportVersion(version)) return false
  if ((loader === 'neoforge' || versionConstraints.supportsNeoforge) && !doesNeoforgeSupportVersion(version))
    return false
  if (
    versionConstraints.supportsNeoOrForge &&
    !doesForgeSupportVersion(version) &&
    !doesNeoforgeSupportVersion(version)
  )
    return false
  return true
}

/**
 * @param {Mc} a
 * @param {Mc} b
 * @returns {Mc[]}
 */
export const getVersionsInRange = (a, b) => {
  if (compareVersions(b, a) === 1) [a, b] = [b, a]
  // Can't compare snapshots to non snapshots since they don't have a comparable format
  if (isSnapshot(a) !== isSnapshot(b)) return [a, b]
  // Same for all the other odd named versions
  if (isRelease(a) !== isRelease(b)) return [a, b]
  let localVersions = [...sortedMcVersions]
  let needsSorting = false
  for (const i of [a, b])
    if (!sortedMcVersions.includes(i)) {
      localVersions.push(i)
      needsSorting = true
    }
  if (needsSorting)
    localVersions = localVersions
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }))
      .sort((a, b) => {
        if (isSnapshot(a) !== isSnapshot(b)) return isSnapshot(a) ? 1 : -1
        if (isSnapshot(a)) {
          const ay = Number.parseInt(a.match(/^[0-9]+/)?.[0] ?? '')
          const by = Number.parseInt(b.match(/^[0-9]+/)?.[0] ?? '')
          if (ay !== by) return by - ay
          const aw = Number.parseInt(a.match(/^[0-9]+w([0-9]+)/)?.[1] ?? '')
          const bw = Number.parseInt(b.match(/^[0-9]+w([0-9]+)/)?.[1] ?? '')
          return bw - aw
        }
        const aMajor = Number.parseInt(a.match(/^1\.([0-9]+)/)?.[1] ?? '')
        const bMajor = Number.parseInt(b.match(/^1\.([0-9]+)/)?.[1] ?? '')
        if (aMajor !== bMajor) return bMajor - aMajor
        const aMinor = Number.parseInt(a.match(/^1\.[0-9]+\.([0-9]+)/)?.[1] ?? '0')
        const bMinor = Number.parseInt(b.match(/^1\.[0-9]+\.([0-9]+)/)?.[1] ?? '0')
        if (aMinor !== bMinor) return bMinor - aMinor
        if (isRelease(a) !== isRelease(b)) return isRelease(a) ? -1 : 1
        return 0
      })

  const indexA = localVersions.indexOf(a)
  const indexB = localVersions.indexOf(b)
  return localVersions.slice(indexA, indexB + 1)
}

/**
 * @param {Id} id
 * @returns {Promise<ModrinthProject | undefined>}
 */
export const getModrinthProjectById = async id => {
  try {
    /** @type {ModrinthProject & ModrinthError} */
    const response = JSON.parse(await cacheFetch(new URL(`${modrinthUrl}project/${id}`)))
    if (response.error !== undefined) console.warn(`Failed to get project ${id}: ${response.description}`)
    else return response
  } catch (err) {
    console.warn(err)
  }
  return
}

/** @type {Promise<{ [mc: Mc]: string }>} */
const packFormats = cache('packFormats', async () => {
  try {
    const raw = (await (await fetch(new URL('https://minecraft.wiki/w/Pack_format'))).text()).replaceAll(
      'src',
      'notSrc'
    )
    const wrapper = document.createElement('div')
    wrapper.innerHTML = raw
    const table = wrapper.querySelector(
      '#mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(11) > tbody'
    )
    if (table === null) throw new Error('Missing table')
    /** @type {Object<string, string>} */
    const result = {}
    for (const row of /** @type {HTMLTableRowElement[]} */ (Array.from(table.children).slice(1))) {
      const format = row.children[0]?.textContent
      if (format === undefined || format === null) throw new Error('Missing format')
      for (const rangeElement of [row.children[1], row.children[2]]) {
        if (rangeElement === undefined) throw new Error('Missing range')
        const rangeChildren = rangeElement.children
        if (rangeChildren.length === 0) continue
        if (rangeChildren.length === 1) result[rangeChildren[0]?.textContent ?? ''] = format
        else if (rangeChildren.length === 2)
          for (const version of getVersionsInRange(
            asUniqueStr(rangeChildren[0]?.textContent ?? '', UNIQUE_STRING_TYPES.Mc),
            asUniqueStr(rangeChildren[1]?.textContent ?? '', UNIQUE_STRING_TYPES.Mc)
          ))
            result[version] = format
        else throw new Error('Too many children')
      }
    }
    return result
  } catch (err) {
    console.error(err)
    console.error(
      'Failed to parse https://minecraft.wiki/w/Pack_format, this means you will have to manually fill the formats in the resulting template.'
    )
  }
  return {}
})

export const getPackFormats = () => packFormats

/** @type {Promise<ExtraFiles>} */
export const extraFiles = (async () =>
  Object.fromEntries(
    await Promise.all(
      ['gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar', 'gradle/wrapper/gradle-wrapper.properties'].map(
        async path => [path, await (await fetch(`./extras/${path}`)).text()]
      )
    )
  ))()
