/**
 * @template {string} S
 * @template {string} N
 * @typedef {string & { S: S, N: N }} UniqueString<S,N>
 */
/**
 * @typedef {UniqueString<string, 'Mc'>} Mc
 * @typedef {UniqueString<'fabric' | 'forge' | 'neoforge', 'Loader'>} Loader
 * @typedef {UniqueString<string, 'Name'>} Name
 * @typedef {UniqueString<string, 'Id'>} Id
 * @typedef {UniqueString<string, 'Slug'>} Slug
 * @typedef {UniqueString<'API' | 'API_OPTIONAL' | 'IMPL' | 'FRL' | 'INCLUDE', 'JavaDepType'>} JavaDepType
 */
const UNIQUE_STRING_TYPES = {
  Mc: /** @type {Mc} */ (''),
  Loader: /** @type {Loader} */ (''),
  Name: /** @type {Name} */ (''),
  Id: /** @type {Id} */ (''),
  Slug: /** @type {Slug} */ (''),
  JavaDepType: /** @type {JavaDepType} */ ('')
}

/**
 * @template {ValueOf<typeof UNIQUE_STRING_TYPES>} T
 * @param {T extends UniqueString<infer S, string> ? S : never} str
 * @param {T} type
 * @returns {T}
 */ // @ts-expect-error
const asUniqueStr = (str, type) => str

/**
 * @template {ValueOf<typeof UNIQUE_STRING_TYPES>} T
 * @param {T} str
 * @returns {T extends UniqueString<infer S, string> ? S : never}
 */ // @ts-expect-error
const asStr = str => str

/**
 * @typedef {{ [key: string]: (string | StringifiedFolder) }} StringifiedFolder
 */
/**
 * @typedef {Object} Yarn
 * @prop {string} gameVersion
 * @prop {string} separator
 * @prop {string} build
 * @prop {string} maven
 * @prop {string} version
 * @prop {boolean} stable
 */
/**
 * @typedef {Object} FabricLoader
 * @prop {Object} loader
 * @prop {string} loader.separator
 * @prop {number} loader.build
 * @prop {string} loader.maven
 * @prop {string} loader.version
 * @prop {boolean} loader.stable
 * @prop {Object} intermediary
 * @prop {string} intermediary.maven
 * @prop {string} intermediary.version
 * @prop {boolean} intermediary.stable
 */
/**
 * @typedef {Object} ModrinthError
 * @prop {string} error
 * @prop {string} description
 */
/**
 * @typedef {Object} ModrinthProject
 * @prop {Name} title
 * @prop {Id} id
 * @prop {Slug} slug
 * @prop {string} icon_url
 * @prop {Loader[]} loaders
 */
/**
 * @typedef {Object} ModrinthProjectVersion
 * @prop {string | null} version_number
 * @prop {Mc[]} game_versions
 * @prop {Loader[]} loaders
 * @prop {{ project_id: Id, version_id: string, dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded' }[]} dependencies
 */
/**
 * @typedef {Object} DependencyInfo
 * @prop {Name} name
 * @prop {Id} id
 * @prop {Slug} slug
 * @prop {boolean} required
 * @prop {Loader[]} validLoaders
 * @prop {JavaDepType} javaDepType
 */
/**
 * @template T
 * @typedef {{ value: T, promise: Promise<T>, hasResolved: boolean }} WrappedPromise
 */
/**
 * @typedef {Object} Folder
 * @prop {string} name
 * @prop {"folder"} type
 * @prop {Object<string, Folder | { name: string, type: "file", contents: string }>} contents
 * @prop {(name: string) => Folder} createFolder
 * @prop {(name: string, contents: string) => { name: string, type: "file", contents: string }} createFile
 */
/**
 * @template {Object} T
 * @typedef {{ [key in keyof T as (string & { _: '' })]: key }[(string & { _: '' })]} KeyOf<T>
 */
/**
 * @template {object} T
 * @typedef {{ [key in keyof T as (string & { _: '' })]: T[key] }[(string & { _: '' })]} ValueOf<T>
 */
/**
 * @template {Object} T
 * @typedef {{ [key in keyof T as (string & { _: '' })]: [key, T[key]] }[(string & { _: '' })]} EntryOf<T>
 */
/**
 * @template {object} T
 * @param {T} obj
 * @returns {(EntryOf<T>)[]}
 */ // @ts-expect-error
const ObjectEntries = obj => Object.entries(obj)

/**
 * @template T
 * @class
 */
class VersionMap {
  /** @type {{ [loader: Loader]: { [mc: Mc]: T } }} */
  #data = {}
  /**
   * @param {Mc} mc
   * @param {Loader} loader
   * @returns {T | undefined}
   */
  get(mc, loader) {
    return this.#data[loader]?.[mc]
  }
  /**
   * @param {Mc} mc
   * @param {Loader} loader
   * @param {T} value
   */
  set(mc, loader, value) {
    if (this.#data[loader] === undefined) this.#data[loader] = {}
    this.#data[loader][mc] = value
  }
  /**
   * @returns {{ mc: Mc, loader: Loader, value: T }[]}
   */
  get entries() {
    /** @type {{ mc: Mc, loader: Loader, value: T }[]} */
    const result = []
    for (const [loader, entries] of ObjectEntries(this.#data))
      for (const [mc, value] of ObjectEntries(entries)) result.push({ mc, loader, value })

    return result
  }
  /**
   * @returns {number}
   */
  get length() {
    return this.entries.length
  }
  /**
   * @template T
   * @param {Iterable<{ mc: Mc, loader: Loader, value: T }>} entries
   * @returns {VersionMap<T>}
   */
  static fromEntries(entries) {
    /** @type {VersionMap<T>} */
    const map = new VersionMap()
    for (const entry of entries) map.set(entry.mc, entry.loader, entry.value)
    return map
  }
  /**
   * @template U
   * @param {(entry: { mc: Mc, loader: Loader, value: T }, index: number, array: { mc: Mc, loader: Loader, value: T }[]) => { mc: Mc, loader: Loader, value: U }} func
   * @returns {VersionMap<U>}
   */
  map(func) {
    return VersionMap.fromEntries(this.entries.map((entry, index, array) => func(entry, index, array)))
  }
}

const CACHE_LENGTH = 60 * 60 * 60 * 1000
document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = /** @type {HTMLDivElement} */ (document.getElementById('theme_toggle'))
  const lightThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_light'))
  const darkThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_dark'))
  const oledThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_oled'))
  const icons = [oledThemeIcon, darkThemeIcon, lightThemeIcon]

  let theme = Number.parseInt(localStorage.getItem('theme') ?? '1')

  const applyTheme = () => {
    for (let index = 0; index < 3; index++) icons[index]?.classList.toggle('selected', theme === index)
    document.documentElement.style.setProperty('--theme-id', `${theme}`)
  }

  themeToggle.addEventListener('click', () => {
    theme = (theme + 1) % 3
    localStorage.setItem('theme', `${theme}`)
    applyTheme()
  })
  applyTheme()

  const fabricMetaUrl = 'https://meta.fabricmc.net/v2/'
  const modrinthUrl = 'https://api.modrinth.com/v2/'

  // @ts-expect-error
  const loaders = ['fabric', 'forge', 'neoforge'].map(loader => asUniqueStr(loader, UNIQUE_STRING_TYPES.Loader))
  const javaDepTypes = ['API', 'API_OPTIONAL', 'IMPL', 'FRL', 'INCLUDE'].map(type =>
    // @ts-expect-error
    asUniqueStr(type, UNIQUE_STRING_TYPES.JavaDepType)
  )

  /** @type {Object<Loader, Object<Mc, string>>}} */
  const yarnPatches = await (await fetch('./yarn-patches.json')).json()

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
    return value
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
    const cachedValue = rawCache === null ? null : JSON.parse(rawCache)
    if (cachedValue !== null && Date.now() - cachedValue.date <= CACHE_LENGTH) return cachedValue.value
    const freshValue = await getter()
    sessionStorage.setItem(name, JSON.stringify({ value: freshValue, date: Date.now() }))
    return freshValue
  }

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

  /** @type {WrappedPromise<{'gradlew':string,'gradlew.bat':string,'gradle/wrapper/gradle-wrapper.jar':string,'gradle/wrapper/gradle-wrapper.properties':string}>} */
  const extraFiles = wrapPromise(
    (async () =>
      Object.fromEntries(
        await Promise.all(
          [
            'gradlew',
            'gradlew.bat',
            'gradle/wrapper/gradle-wrapper.jar',
            'gradle/wrapper/gradle-wrapper.properties'
          ].map(async path => [path, await (await fetch(`./extras/${path}`)).text()])
        )
      ))()
  )

  /**
   * @param {Folder} folder
   * @param {string} fileName
   * @returns {Promise<void>}
   */
  const downloadFolder = async (folder, fileName) => {
    /** @type {import("./libs/Stuk-jszip-643714a/index")} */
    // @ts-expect-error
    const zip = new JSZip()
    /**
     * @param {Folder} folder
     * @param {string} path
     */
    const addFolder = (folder, path = '') => {
      for (const item of Object.values(folder.contents)) {
        const newPath = path.length ? `${path}/${item.name}` : item.name
        if (item.type === 'folder') {
          zip.folder(newPath)
          addFolder(item, newPath)
        } else zip.file(newPath, item.contents)
      }
    }

    addFolder(folder)

    const context = await zip.generateAsync({ type: 'blob', streamFiles: true })
    const blobURL = URL.createObjectURL(context)
    const link = document.createElement('a')
    link.href = blobURL
    link.download = `${fileName}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobURL)
  }

  /**
   * Returns truthy if a is more then b
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  const compareVersions = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

  /** @type {{ mcVersions: Mc[], fabric: { mcVersion: Mc, fabricVersion: string }[], forge: { mcVersion: Mc, forgeVersion: string }[], neoforge: { mcVersion: Mc, neoforgeVersion: string }[] }} */
  const {
    mcVersions: allMcVersions,
    fabric: fabricVersions,
    forge: forgeVersions,
    neoforge: neoforgeVersions
  } = await (await fetch('./loaders.json')).json()

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

  const sortedMcVersions = Array.from(allMcVersions)
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

  /**
   * @returns {Promise<Object<string, Yarn | undefined>>}
   */
  const getYarnVersions = async () => {
    /** @type {Yarn[]} */
    const options = JSON.parse(await cacheFetch(new URL(`${fabricMetaUrl}versions/yarn`)))
    /** @type {Object<string, Yarn | undefined>} */
    const result = {}
    for (const option of options)
      if (option.stable && (result[option.gameVersion] === undefined || !result[option.gameVersion]?.stable))
        result[option.gameVersion] = option
      else if (result[option.gameVersion] === undefined) result[option.gameVersion] = option

    return result
  }

  /**
   * @returns {Promise<Object<string, string>>}
   */
  const getParchmentVersions = async () =>
    JSON.parse(await cacheFetch(new URL('https://versioning.parchmentmc.org/versions'))).releases

  /**
   * @param {Mc[]} mcVersions
   * @param {Loader[]} loaders
   * @param {(message: string) => void} statusSubscriber
   * @returns {Promise<(DependencyInfo & { versions: VersionMap<string> })[]>}
   */
  const getDependencyVersions = async (mcVersions, loaders, statusSubscriber) => {
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
      const options = await (await fetch(url)).json()
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
  const doesLoaderSupportVersion = (version, loader) =>
    (loader === 'fabric' && doesFabricSupportVersion(version)) ||
    (loader === 'forge' && doesForgeSupportVersion(version)) ||
    (loader === 'neoforge' && doesNeoforgeSupportVersion(version))

  const versionSelectorElement = /** @type {HTMLDivElement} */ (document.getElementById('version_selector'))

  /** @type {{ mc: Mc, loader: Loader }[]} */
  const _selectedVersions = []
  let _isFirstTick = true
  const selectedVersions = new Proxy(_selectedVersions, {
    deleteProperty(target, prop) {
      versionsCountElement.textContent = `Count\n${_selectedVersions.length - 1}`
      // @ts-expect-error
      return delete target[prop]
    },
    set(target, prop, receiver) {
      // @ts-expect-error
      target[prop] = receiver
      if (!_isFirstTick) versionsCountElement.textContent = `Count\n${_selectedVersions.length}`
      return true
    }
  })

  await new Promise(r => setImmediate(r))
  _isFirstTick = false

  const versionsCountElement = /** @type {HTMLSpanElement} */ (document.getElementById('versions_count'))

  const versionConstraints = {
    supportsFabric: false,
    supportsNeoOrForge: false,
    supportsForge: false,
    supportsNeoforge: false,
    onlyRelease: true,
    onlySelected: false
  }

  const supportsFabricCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('supports_fabric_checkbox'))
  const supportsNeoOrForgeCheckbox = /** @type {HTMLInputElement} */ (
    document.getElementById('supports_neo_forge_checkbox')
  )
  const supportsForgeCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('supports_forge_checkbox'))
  const supportsNeoforgeCheckbox = /** @type {HTMLInputElement} */ (
    document.getElementById('supports_neoforge_checkbox')
  )
  const onlyReleaseCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('only_release_checkbox'))
  const onlySelectedCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('only_selected_checkbox'))

  for (const [checkbox, key] of [
    [supportsFabricCheckbox, 'supportsFabric'],
    [supportsForgeCheckbox, 'supportsForge'],
    [supportsNeoforgeCheckbox, 'supportsNeoforge'],
    [supportsNeoOrForgeCheckbox, 'supportsNeoOrForge'],
    [onlyReleaseCheckbox, 'onlyRelease'],
    [onlySelectedCheckbox, 'onlySelected']
  ]) {
    // @ts-expect-error
    checkbox.addEventListener('change', () => {
      // @ts-expect-error
      versionConstraints[key] = checkbox.checked
      populateVersionSelector()
    })
  }

  /**
   * @param {Mc} version
   * @param {Loader} [loader]
   * @returns {boolean}
   */
  const shouldShowVersion = (version, loader) => {
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
   * @param {Mc} version
   * @param {Loader} loader
   */
  const addVersion = (version, loader) => {
    if (!selectedVersions.some(entry => entry.mc === version && entry.loader === loader))
      selectedVersions.push({ mc: version, loader })
  }

  /**
   * @param {Mc} version
   * @param {Loader} loader
   */
  const removeVersion = (version, loader) => {
    const index = selectedVersions.findIndex(entry => entry.mc === version && entry.loader === loader)
    if (index !== -1) selectedVersions.splice(index, 1)
  }

  const populateVersionSelector = () => {
    for (const child of Array.from(versionSelectorElement.children))
      if (!(child instanceof HTMLLegendElement)) child.remove()
    for (const version of sortedMcVersions) {
      if (!loaders.some(loader => shouldShowVersion(version, loader))) continue
      const wrapper = document.createElement('div')
      const name = document.createElement('input')
      name.classList.add('option')
      name.type = 'checkbox'
      // @ts-expect-error
      name.dataset.label = version
      name.checked = loaders.every(
        loader =>
          !doesLoaderSupportVersion(version, loader) ||
          selectedVersions.some(entry => entry.mc === version && entry.loader === loader)
      )
      wrapper.appendChild(name)
      /** @type {HTMLInputElement[]} */
      const toggles = []
      for (const loader of loaders) {
        if (!shouldShowVersion(version, loader)) {
          wrapper.appendChild(document.createElement('div'))
          continue
        }
        const toggle = document.createElement('input')
        toggle.classList.add('option')
        toggle.type = 'checkbox'
        // @ts-expect-error
        toggle.dataset.label = `${loader[0]?.toUpperCase()}${loader.slice(1)}`
        toggle.checked = selectedVersions.some(entry => entry.mc === version && entry.loader === loader)
        toggle.addEventListener('change', () => {
          if (toggle.checked && !selectedVersions.some(entry => entry.mc === version && entry.loader === loader))
            selectedVersions.push({ mc: version, loader })
          if (!toggle.checked) {
            const index = selectedVersions.findIndex(entry => entry.mc === version && entry.loader === loader)
            if (index !== -1) selectedVersions.splice(index, 1)
          }
          name.checked = loaders.every(
            loader =>
              !doesLoaderSupportVersion(version, loader) ||
              selectedVersions.some(entry => entry.mc === version && entry.loader === loader)
          )
        })
        wrapper.appendChild(toggle)
        toggles.push(toggle)
      }
      name.addEventListener('change', () => {
        for (const toggle of toggles) toggle.checked = name.checked
        for (const loader of loaders)
          if (name.checked) addVersion(version, loader)
          else removeVersion(version, loader)
      })
      versionSelectorElement.appendChild(wrapper)
    }
  }

  document.getElementById('versions_select_all_button')?.addEventListener('click', () => {
    for (const version of sortedMcVersions)
      for (const loader of loaders)
        if (
          shouldShowVersion(version) &&
          !selectedVersions.some(entry => entry.mc === version && entry.loader === loader) &&
          doesLoaderSupportVersion(version, loader)
        )
          selectedVersions.push({
            mc: version,
            loader
          })
    populateVersionSelector()
  })
  document.getElementById('versions_deselect_all_button')?.addEventListener('click', () => {
    for (const version of sortedMcVersions)
      for (const loader of loaders)
        if (shouldShowVersion(version, loader)) {
          const index = selectedVersions.findIndex(entry => entry.mc === version && entry.loader === loader)
          if (index !== -1) selectedVersions.splice(index, 1)
        }
    populateVersionSelector()
  })

  /** @type {'yarn' | 'parchment' | 'mojmaps'} */
  let selectedMapping = 'yarn'

  const mappingYarnRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_yarn_radio'))
  const mappingParchmentRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_parchment_radio'))
  const mappingMojmapsRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_mojmaps_radio'))

  for (const [radio, value] of [
    [mappingYarnRadio, 'yarn'],
    [mappingParchmentRadio, 'parchment'],
    [mappingMojmapsRadio, 'mojmaps']
  ]) {
    // @ts-expect-error
    radio.addEventListener('change', () => {
      // @ts-expect-error
      if (radio.checked) selectedMapping = value
    })
  }

  const miscSettings = {
    sharedRuns: true,
    githubActions: true
  }

  const sharedRunsCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('common_runs_checkbox'))
  const githubActionsCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('github_actions_checkbox'))

  for (const [checkbox, key] of [
    [sharedRunsCheckbox, 'sharedRuns'],
    [githubActionsCheckbox, 'githubActions']
  ]) {
    // @ts-expect-error
    checkbox.addEventListener('change', () => (miscSettings[key] = checkbox.checked))
  }

  /** @type {DependencyInfo[]} */
  const manualDependencies = []

  const dependencySelector = /** @type {HTMLDivElement} */ (document.getElementById('dependency_selector'))
  const addDependencyId = /** @type {HTMLInputElement} */ (document.getElementById('add_dependency_id'))
  const addDependencyButton = /** @type {HTMLElement} */ (document.getElementById('add_dependency_button'))

  /**
   * @param {Id} id
   * @param {boolean} required
   * @param {JavaDepType} javaDepType
   * @returns {Promise<void>}
   */
  const addManualDependency = async (id, required, javaDepType) => {
    if (manualDependencies.some(dependency => dependency.id === id)) return
    /** @type {ModrinthProject | undefined} */
    const response = await (async () => {
      try {
        /** @type {ModrinthProject & ModrinthError} */
        const response = JSON.parse(await cacheFetch(new URL(`${modrinthUrl}project/${id}`)))
        if (response.error !== undefined) console.warn(`Failed to get project ${id}: ${response.description}`)
        else return response
      } catch (err) {
        console.warn(err)
      }
      return
    })()
    if (response === undefined) return
    /** @type {DependencyInfo} */
    const entry = {
      id,
      name: response.title,
      slug: response.slug,
      required,
      validLoaders: response.loaders,
      javaDepType
    }
    manualDependencies.push(entry)
    const wrapper = document.createElement('div')
    const icon = document.createElement('img')
    icon.style.gridArea = 'icon'
    icon.src = response.icon_url
    wrapper.appendChild(icon)
    const title = document.createElement('span')
    title.style.gridArea = 'title'
    title.textContent = response.title.slice(0, Math.min(response.title.length, 20))
    title.classList.add('s-s')
    wrapper.appendChild(title)
    const requiredToggle = document.createElement('input')
    requiredToggle.classList.add('option')
    requiredToggle.type = 'checkbox'
    // @ts-expect-error
    requiredToggle.dataset.label = 'Required'
    requiredToggle.style.gridArea = 'required'
    requiredToggle.checked = required
    wrapper.appendChild(requiredToggle)
    requiredToggle.addEventListener('change', () => (entry.required = requiredToggle.checked))
    let javaDepTypeIndex = javaDepTypes.indexOf(javaDepType)
    const javaDepTypeToggle = document.createElement('button')
    javaDepTypeToggle.dataset['label'] = javaDepTypes[javaDepTypeIndex] ?? ''
    javaDepTypeToggle.dataset['width'] = `${15}`
    javaDepTypeToggle.style.gridArea = 'java'
    wrapper.appendChild(javaDepTypeToggle)
    javaDepTypeToggle.addEventListener('click', () => {
      javaDepTypeIndex = (javaDepTypeIndex + 1) % javaDepTypes.length
      const type = javaDepTypes[javaDepTypeIndex] ?? asUniqueStr('IMPL', UNIQUE_STRING_TYPES.JavaDepType)
      javaDepTypeToggle.dataset['label'] = type
      entry.javaDepType = type
    })
    const removeWrapper = document.createElement('div')
    removeWrapper.innerHTML =
      '<svg style="grid-area: remove;" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>'
    const removeIcon = removeWrapper.firstChild ?? removeWrapper
    wrapper.appendChild(removeIcon)
    removeIcon.addEventListener('click', () => {
      wrapper.remove()
      manualDependencies.splice(manualDependencies.findIndex(dependency => dependency.id === id))
    })

    dependencySelector.insertBefore(wrapper, dependencySelector.firstChild ?? dependencySelector)
  }

  addDependencyButton.addEventListener('click', () =>
    addManualDependency(
      asUniqueStr(addDependencyId.value, UNIQUE_STRING_TYPES.Id),
      false,
      asUniqueStr('IMPL', UNIQUE_STRING_TYPES.JavaDepType)
    )
  )

  for (const id of ['P7dR8mSH', 'lhGA9TYQ'].map(id => asUniqueStr(id, UNIQUE_STRING_TYPES.Id)))
    addManualDependency(id, true, asUniqueStr('API', UNIQUE_STRING_TYPES.JavaDepType))

  /**
   * @param {Mc} a
   * @param {Mc} b
   * @returns {Mc[]}
   */
  const getVersionsInRange = (a, b) => {
    if (compareVersions(b, a) === 1) [a, b] = [b, a]
    // Can't compare snapeshots to non snapshots since they don't have a comparable format
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
   * @returns {Promise<Object<string, string>>}
   */
  const getPackFormats = async () =>
    await cache('packFormats', async () => {
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

  const modNameElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_name_input'))
  const modIdElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_id_input'))
  const modAuthorElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_author_input'))
  const modLicenseElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_license_input'))
  const modDescriptionElement = /** @type {HTMLTextAreaElement} */ (document.getElementById('mod_description_input'))

  let isDownloading = false
  const downloadButton = /** @type {HTMLButtonElement} */ (document.getElementById('download_button'))
  downloadButton.addEventListener('click', async () => {
    if (isDownloading) return
    isDownloading = true
    downloadButton.classList.add('active')

    /**
     * @param {string} status
     */
    const updateStatus = status => (downloadButton.dataset['label'] = `${status}...`)

    /**
     * @param {Folder | undefined} [parent]
     * @returns {Folder["createFolder"]}
     */
    const genericCreateFolder = parent => name => {
      /** @type {Folder} */
      // @ts-expect-error
      const folder = {
        type: 'folder',
        name,
        contents: {}
      }
      folder.createFolder = genericCreateFolder(folder)
      folder.createFile = (name, contents) => {
        /** @type {{ name: string, type: "file", contents: string }} */
        const file = {
          type: 'file',
          name,
          contents
        }
        folder.contents[name] = file
        return file
      }
      if (parent !== undefined) parent.contents[name] = folder
      return folder
    }
    const folder = genericCreateFolder()('root')
    const versionsFolder = folder.createFolder('versions')

    const uniqueVersions = [...new Set(selectedVersions.map(version => version.mc))]
    const uniqueLoaders = [...new Set(selectedVersions.map(version => version.loader))]

    updateStatus('Getting dependencies')

    const dependencies = wrapPromise(getDependencyVersions(uniqueVersions, uniqueLoaders, updateStatus))

    const yarnVersions = wrapPromise(getYarnVersions())
    const parchmentVersions = wrapPromise(getParchmentVersions())

    const packFormats = wrapPromise(getPackFormats())

    await Promise.all(wrappedPromises)

    /**
     * @param {string} str
     * @param {string} def
     * @returns {string}
     */
    const orDefault = (str, def) => (str.trim().length ? str.trim() : def)

    const modData = {
      name: orDefault(modNameElement.value, 'Example Mod'),
      id: orDefault(modIdElement.value, 'example_mod'),
      author: orDefault(modAuthorElement.value, 'author'),
      license: orDefault(modLicenseElement.value, 'MIT'),
      description: orDefault(modDescriptionElement.value, 'Example Mod'),
      className: orDefault(modNameElement.value, 'Example Mod').replaceAll(/[^a-zA-Z]/g, ''),
      stonecutterVcs: ''
    }

    updateStatus('Generating versions')

    let hadWarnings = false

    const startVersionCount = selectedVersions.length

    /** @type {Object<string, Loader[]>} */
    const usedVersions = {}
    /** @type {Set<Loader>} */
    const usedLoaders = new Set()
    for (const version of [...selectedVersions]) {
      const loader = version.loader
      const mc = version.mc

      const lines = []
      lines.push(`deps.core.mc.version_range=${mc}`)
      lines.push('')

      let missingRequiredDependency = false
      for (const dependency of dependencies.value) {
        const version = dependency.versions.get(mc, loader)
        if (version === undefined && dependency.required && dependency.validLoaders.includes(loader)) {
          if (dependency.required) {
            console.warn(`Skipping ${mc}-${loader}: Missing required dependency ${dependency.name}`)
            hadWarnings = true
            missingRequiredDependency = true
            break
          }
          continue
        }
        if (version !== undefined) lines.push(`deps.mods.${dependency.slug}=${version}`)
      }
      if (missingRequiredDependency) {
        removeVersion(mc, loader)
        continue
      }

      lines.push('')

      if (asStr(loader) === 'fabric')
        lines.push(
          `deps.core.fabric.version_range=${fabricVersions.find(entry => entry.mcVersion === mc)?.fabricVersion}`
        )
      else if (asStr(loader) === 'forge')
        lines.push(`deps.core.forge.version_range=${forgeVersions.find(entry => entry.mcVersion === mc)?.forgeVersion}`)
      else if (asStr(loader) === 'neoforge')
        lines.push(
          `deps.core.neoforge.version_range=${neoforgeVersions.find(entry => entry.mcVersion === mc)?.neoforgeVersion}`
        )

      if (selectedMapping === 'yarn') {
        const dependency = yarnVersions.value[mc]
        if (dependency === undefined) {
          console.warn(`Skipping ${mc}-${loader}: missing yarn`)
          hadWarnings = true
          removeVersion(mc, loader)
          continue
        }
        lines.push(`deps.yarn=${dependency.version}`)

        // If there is a patch for this version specifically
        const explicitPatch = yarnPatches[loader]?.[mc]
        if (explicitPatch !== undefined) lines.push(`deps.yarn.patch=${explicitPatch}`)

        // Otherwise use the most version recent patch if there is one
        const explicitPatchVersions = Object.keys(yarnPatches[loader] ?? {}).sort(compareVersions)
        const oldestPatch = explicitPatchVersions[0] ?? '2'
        if (compareVersions(mc, oldestPatch) === 1)
          for (const explicitVersion of explicitPatchVersions.toReversed())
            if (compareVersions(mc, explicitVersion) === 1) {
              lines.push(`deps.yarn.patch=${yarnPatches[loader]?.[explicitVersion]}`)
              break
            }
      } else if (selectedMapping === 'parchment') {
        const dependency = parchmentVersions.value[mc]
        if (dependency === undefined) {
          console.warn(`Skipping ${mc}-${loader}: missing parchment`)
          hadWarnings = true
          removeVersion(mc, loader)
          continue
        }
        lines.push(`deps.parchment=${dependency}`)
      }

      lines.push(`deps.pack_format=${packFormats.value[mc] ?? ''}`)

      lines.push('')
      lines.push(`loom.platform=${loader}`)
      versionsFolder.createFolder(`${mc}-${loader}`).createFile('gradle.properties', lines.join('\n'))

      if (!modData.stonecutterVcs.length) modData.stonecutterVcs = `${mc}-${loader}`

      usedLoaders.add(loader)

      const localUsedLoaders = usedVersions[mc]
      if (localUsedLoaders === undefined) usedVersions[mc] = [loader]
      else localUsedLoaders.push(loader)
    }

    updateStatus('Filling template')

    let templateStr = await (await fetch('./template.json')).text()
    const replacements = {
      '"author":{': `"${modData.author.toLowerCase()}":{`,
      '.author.': `.${modData.author.toLowerCase()}.`,
      example_mod: modData.id,
      ExampleMod: modData.className
    }

    /** @type {Object<string, string | string[]>} */
    const vars = {
      'stonecutter-mapper': `val mapper = "${selectedMapping}"`,
      'pure-id': `private val id: String = "${modData.id}"`,
      'stonecutter-active': `stonecutter active "${modData.stonecutterVcs}"`,
      'stonecutter-versions': ObjectEntries(usedVersions).map(
        ([version, loaders]) => `ver(${[version, ...loaders].map(i => `"${i}"`).join(', ')})`
      ),
      'stonecutter-vcs': `vcsVersion = "${modData.stonecutterVcs}"`,
      'config-name': `mod.display_name = ${modData.name}`,
      'config-id': `mod.id = ${modData.id}`,
      'config-class': `mod.class_name = ${modData.className}`,
      'config-license': `mod.license = ${modData.license}`,
      'config-description': `mod.description = ${modData.description}`,
      'config-author': `mod.authors = ${modData.author}`,
      dependencies: dependencies.value.flatMap(dependency => [
        'APISource(',
        `    DepType.${dependency.javaDepType},`,
        `    APIModInfo("${dependency.slug}", null, "${dependency.slug}"),`,
        `    "maven.modrinth:${dependency.slug}",`,
        `    optionalVersionProperty("deps.mods.${dependency.slug}"),`,
        ') { src ->',
        '    src.versionRange.isPresent',
        '},'
      ])
    }

    /** @type {Object<string, boolean>} */
    const flags = {
      'shared-runs': miscSettings.sharedRuns,
      'mappings-yarn': selectedMapping === 'yarn',
      'mappings-parchment': selectedMapping === 'parchment',
      'mappings-mojmaps': selectedMapping === 'mojmaps'
    }

    for (const [from, to] of ObjectEntries(replacements)) templateStr = templateStr.replaceAll(from, to)

    /** @type {StringifiedFolder} */
    const template = JSON.parse(templateStr)

    // biome-ignore lint/performance/noDelete: <explanation>
    if (!miscSettings.githubActions) delete template['.github']

    /**
     * @param {string} file
     * @param {string} path
     * @returns {string}
     */
    const templateFile = (file, path) => {
      const lines = file.split('\n')
      let breakIndex = 0
      let lineNumber = 0
      for (let index = 0; index < lines.length; index++) {
        lineNumber++
        const line = lines[index] ?? ''
        const startVar = line.match(/\$start\s([a-z-]+)/)
        const startIf = line.match(/\$if\s([a-z-]+)/)
        const isVar = startVar !== null
        const isIf = startIf !== null
        const startMatch = startVar ?? startIf
        if (startMatch === null) continue
        const varName = startMatch[1] ?? ''
        for (let subIndex = index; subIndex < lines.length; subIndex++)
          if (lines[subIndex]?.includes(`$end ${varName}`)) {
            if (isVar) {
              let varr = vars[varName]
              if (varr === undefined)
                throw new Error(`Missing value for var: "${varName}" in file: ${path} line ~${lineNumber}`)
              if (typeof varr === 'string') varr = [varr]
              const offset = line.length - line.trimStart().length
              lines.splice(index, subIndex - index + 1, varr.map(line => `${' '.repeat(offset)}${line}`).join('\n'))
              lineNumber += varr.length + 1
              index--
            }
            if (isIf) {
              const flag = flags[varName]
              if (flag === undefined)
                throw new Error(`Missing value for flag: "${varName}" in file: ${path} line ~${lineNumber}`)
              if (flag) {
                lines.splice(subIndex, 1)
                lines.splice(index, 1)
                lineNumber += 2
              } else {
                lines.splice(index, subIndex - index + 1)
                lineNumber += subIndex - index
              }
              index--
              breakIndex++
              if (breakIndex === 10_000) throw new Error('Loop detected parsing template')
            }
            break
          }
      }
      return lines.join('\n')
    }

    /**
     * @param {StringifiedFolder} folder
     * @param {string} [path]
     */
    const templateFolder = (folder, path = '') => {
      for (const [name, item] of ObjectEntries(folder)) {
        const itemPath = path.length ? `${path}/${name}` : name
        if (typeof item === 'string') folder[name] = templateFile(item, itemPath)
        else templateFolder(item, itemPath)
      }
    }

    templateFolder(template)

    /**
     * @param {StringifiedFolder} jsonFolder
     * @param {Folder} realFolder
     */
    const addDir = (jsonFolder, realFolder) => {
      for (const [name, item] of ObjectEntries(jsonFolder))
        if (typeof item === 'string') realFolder.createFile(name, item)
        else addDir(item, realFolder.createFolder(name))
    }

    addDir(template, folder)

    for (const loader of loaders.filter(loader => !usedLoaders.has(loader))) {
      // @ts-expect-error
      delete folder.contents['src']?.contents['main']?.contents['resources']?.contents[
        `mixins.${loader}.${modData.id}.json`
      ]
      // @ts-expect-error
      delete folder.contents['src']?.contents['main']?.contents['java']?.contents['com']?.contents[modData.author]
        ?.contents[modData.id]?.contents[loader]
    }

    folder.createFile('gradlew', extraFiles.value.gradlew)
    folder.createFile('gradlew.bat', extraFiles.value['gradlew.bat'])
    const wrapperFolder = folder.createFolder('gradle').createFolder('wrapper')
    wrapperFolder.createFile('gradle-wrapper.jar', extraFiles.value['gradle/wrapper/gradle-wrapper.jar'])
    wrapperFolder.createFile('gradle-wrapper.properties', extraFiles.value['gradle/wrapper/gradle-wrapper.properties'])

    updateStatus('Downloading zip')

    populateVersionSelector()

    await new Promise(r => setTimeout(r, 0))

    const endVersionCount = Object.keys(versionsFolder.contents).length
    if (
      !hadWarnings ||
      confirm(
        `${startVersionCount - endVersionCount} / ${startVersionCount} versions had problems, would you like to download still?\n(see console for details)`
      )
    )
      await downloadFolder(folder, `${endVersionCount}-version-${modData.id}-mod`)

    downloadButton.classList.remove('active')
    downloadButton.dataset['label'] = 'Download'
    isDownloading = false
  })

  populateVersionSelector()

  supportsFabricCheckbox.click()
  supportsNeoOrForgeCheckbox.click()
  modNameElement.value = 'Demo Mod'
  modIdElement.value = 'demo_mod'
  modAuthorElement.value = 'Me'
  modLicenseElement.value = 'MITE'
  modDescriptionElement.value = 'Really just a demo mod'
  addManualDependency(
    asUniqueStr('nfn13YXA', UNIQUE_STRING_TYPES.Id),
    true,
    asUniqueStr('IMPL', UNIQUE_STRING_TYPES.JavaDepType)
  )
})
