/**
 * @template {string} S
 * @template {string} N
 * @typedef {string & { S: S, N: N }} UniqueString<S,N>
 */
/**
 * @template {UniqueString<*, *>} U
 * @template {string} T
 * @typedef {UniqueString<U extends UniqueString<infer S, *> ? S : never, `${U extends UniqueString<*, infer N> ? N : never}${T}`>} ChainedUniqueString<U,T>
 */

/**
 * @typedef {UniqueString<string, 'Mc'>} Mc
 * @typedef {UniqueString<'fabric' | 'forge' | 'neoforge', 'Loader'>} Loader
 * @typedef {UniqueString<string, 'Name'>} Name
 * @typedef {UniqueString<string, 'Id'>} Id
 * @typedef {UniqueString<string, 'Slug'>} Slug
 * @typedef {UniqueString<'API' | 'API_OPTIONAL' | 'IMPL' | 'FRL' | 'INCLUDE', 'JavaDepType'>} JavaDepType
 * @typedef {UniqueString<'yarn' | 'parchment' | 'mojmaps', 'Mapper'>} Mapper
 * @typedef {UniqueString<keyof DependencyTypes, 'DependencyType'>} DependencyType
 */

export const UNIQUE_STRING_TYPES = {
  Mc: /** @type {Mc} */ (''),
  Loader: /** @type {Loader} */ (''),
  Name: /** @type {Name} */ (''),
  Id: /** @type {Id} */ (''),
  Slug: /** @type {Slug} */ (''),
  JavaDepType: /** @type {JavaDepType} */ (''),
  Mapper: /** @type {Mapper} */ (''),
  DependencyType: /** @type {DependencyType} */ ('')
}

/**
 * @template {ValueOf<typeof UNIQUE_STRING_TYPES>} T
 * @param {T extends UniqueString<infer S, string> ? S : never} str
 * @param {T} type
 * @returns {T}
 */ // @ts-expect-error
export const asUniqueStr = (str, type) => str

/**
 * @template {UniqueString<*, *>} T
 * @param {T} str
 * @returns {T extends UniqueString<infer S, string> ? S : never}
 */ // @ts-expect-error
export const asStr = str => str

/**
 * @template {object} T
 * @param {T} obj
 * @returns {(EntryOf<T>)[]}
 */ // @ts-expect-error
export const ObjectEntries = obj => Object.entries(obj)

// @ts-expect-error
export const loaders = ['fabric', 'forge', 'neoforge'].map(loader => asUniqueStr(loader, UNIQUE_STRING_TYPES.Loader))
export const loader_fabric = asUniqueStr('fabric', UNIQUE_STRING_TYPES.Loader)
export const loader_forge = asUniqueStr('forge', UNIQUE_STRING_TYPES.Loader)
export const loader_neoforge = asUniqueStr('neoforge', UNIQUE_STRING_TYPES.Loader)
export const javaDependencyTypes = ['API', 'API_OPTIONAL', 'IMPL', 'FRL', 'INCLUDE'].map(type =>
  // @ts-expect-error
  asUniqueStr(type, UNIQUE_STRING_TYPES.JavaDepType)
)

/**
 * @template T
 * @class
 */
export class VersionMap {
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

/** @typedef {{ 'Modrinth': 0, 'FabricApi': 1 }} DependencyTypesStrings */
/** @typedef {{ [key in keyof DependencyTypesStrings as string & UniqueString<string, 'key'>]: UniqueString<key,`DependencyType${key}`> }[UniqueString<string, 'key'>]} DependencyTypes */
/**
 * @template {keyof DependencyTypes} T
 * @typedef {Object} DependencyResolver<T>
 * @prop {UniqueString<string, `${T extends UniqueString<infer S, *> ? S : never}Maven`>} maven
 */

/** @type {keyof DependencyTypes} */
const a = 'modrinth'
/** @type {DependencyResolver<typeof a>} */
const b = { maven: '' }

/**
 * @template {keyof DependencyTypes} T
 * @typedef {Object} GenericDependency<T>
 * @prop {string} title
 * @prop {string} id
 * @prop {Promise<string>} icon_url
 * @prop {string} maven
 * @prop {(mcVersions: Mc[], loaders: Loader[]) => Promise<VersionMap<GenericDependencyVersion>>} getVersions
 *
 */
/**
 * @typedef {Object} GenericDependencyVersion
 * @prop {string} title
 * @prop {string} id
 * @prop {string} maven
 * @prop {string} version_number
 */

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
 * @typedef {Object} DependencyInfo
 * @prop {DependencyType} type
 * @prop {Name} name
 * @prop {Id} id
 * @prop {Slug} slug
 * @prop {boolean} required
 * @prop {Loader[]} validLoaders
 * @prop {JavaDepType} javaDepType
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
 * @typedef {{'gradlew':string,'gradlew.bat':string,'gradle/wrapper/gradle-wrapper.jar':string,'gradle/wrapper/gradle-wrapper.properties':string}} ExtraFiles
 */

/**
 * @typedef {Object} VersionConstraints
 * @prop {boolean} supportsFabric
 * @prop {boolean} supportsNeoOrForge
 * @prop {boolean} supportsForge
 * @prop {boolean} supportsNeoforge
 * @prop {boolean} onlyRelease
 * @prop {boolean} onlySelected
 */

// /** @typedef {{ A: 0, B: 0, C: 0 }} A */
// /**
//  * @template {Object} T
//  * @typedef {Object} B
//  * @prop {{ [key in keyof T as string & {_:'key'}]: key }[string & {_:'key'}]} any
//  */
// /** @typedef {B<A>} C */

// /** @typedef {`${C['any']}*${C['any']}`} D */

// /**
//  * @template {string} T
//  * @typedef {`${T}${T}${T}`} Permutations<T>
//  */

// /** @type {Permutations<'A' | 'B' | 'C'>} */
// let t

/**
 * Typescript church encoded numbers.
 * @typedef {false | {apply: false | CNum}} CNum
 */

/**
 * Positive CNum (used often in recursion).
 * @typedef {{ apply: CNum }} PCNum
 */

/**
 * @typedef {false} CN0
 * @typedef {{ apply: false }} CN1
 * @typedef {{ apply: { apply: false } }} CN2
 * @typedef {{ apply: { apply: { apply: false } } }} CN3
 * @typedef {{ apply: { apply: { apply: { apply: false } } } }} CN4
 * @typedef {{ apply: { apply: { apply: { apply: { apply: false }} } } }} CN5
 */

/**
 * @template {CNum} a
 * @template {CNum} b
 * @typedef {a extends PCNum ? CAdd<a['apply'],{ apply: b}> : b} CAdd<a,b>
 */

/**
 * @template {CNum} a
 * @template {CNum} b
 * @typedef {_CMult<a,b,a,CN0>} CMult<a,b>
 */

/**
 * @template {CNum} a
 * @template {CNum} b
 * @template {CNum} remaining
 * @template {CNum} result
 * @typedef {remaining extends PCNum ? _CMult<a,b,remaining['apply'],CAdd<b,result>> : result} _CMult
 */

/**
 * @template {string} str
 * @template {CNum} count
 * @typedef {count extends PCNum ? count['apply'] extends { apply: CNum} ? `${str}${RepeatString<str, count['apply']>}` : str : ""} RepeatString<str,count>
 */

/** @typedef {RepeatString<'X',CMult<CN5,CN5>>} result */ // -> 'X' repeated 25 times
