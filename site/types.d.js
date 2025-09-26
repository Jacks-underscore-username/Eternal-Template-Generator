/**
 * @template {string} options
 * @template {string} id
 * @typedef {string & { options: options, id: id }} UniqueString<options,id>
 */
/**
 * @template {UniqueString<*, *>} U
 * @template {string} T
 * @typedef {UniqueString<U extends UniqueString<infer S, *> ? S : never, `${U extends UniqueString<*, infer N> ? N : never}${T}`>} ChainedUniqueString<U,T>
 */

/** @typedef {UniqueString<string, 'Mc'>} Mc */
/** @typedef {UniqueString<'fabric' | 'forge' | 'neoforge', 'Loader'>} Loader */
/** @typedef {UniqueString<string, 'Name'>} Name */
/** @typedef {UniqueString<string, 'MavenSource'>} MavenSource */
/** @typedef {UniqueString<string, 'VersionMaven'>} VersionMaven */
/** @typedef {UniqueString<{ [key in keyof DependencySources as string & {_:''}]: key }[string & {_:''}], 'DependencySource'>} DependencySource */
/** @typedef {UniqueString<string, 'MId'>} MId */
/** @typedef {UniqueString<string, 'MSlug'>} MSlug */
/** @typedef {UniqueString<'API' | 'API_OPTIONAL' | 'IMPL' | 'FRL' | 'INCLUDE', 'JavaDepType'>} JavaDepType */
/** @typedef {UniqueString<'yarn' | 'parchment' | 'mojmaps', 'Mapper'>} Mapper */

/**
 * @typedef {{ Mc: Mc, Loader: Loader, Name: Name, DependencySourceType: DependencySource, MId: MId, MSlug: MSlug, JavaDepType: JavaDepType, Mapper: Mapper, MavenSource: MavenSource, VersionMaven: VersionMaven } & { [key: string] : false }} KnownUniqueStringTypes
 */

/**
 * @template {string} str
 * @template {string} id
 * @param {str} str
 * @param {id} id
 * @returns {KnownUniqueStringTypes[id] extends UniqueString<infer options, id> ? str extends options ? UniqueString<str, id> : never : UniqueString<str, id>}
 */ // @ts-expect-error
export const asUniqueStr = (str, id) => str

/**
 * @template {string | UniqueString<*, *>} T
 * @param {T} str
 * @returns {T extends UniqueString<infer S, infer id> ? KnownUniqueStringTypes[id] extends UniqueString<infer options, id> ? options : S : T}
 */ // @ts-expect-error
export const asStr = str => str

export const loaders = ['fabric', 'forge', 'neoforge'].map(loader => asUniqueStr(loader, 'Loader'))
export const loader_fabric = asUniqueStr('fabric', 'Loader')
export const loader_forge = asUniqueStr('forge', 'Loader')
export const loader_neoforge = asUniqueStr('neoforge', 'Loader')
/** @type {JavaDepType[]} */
export const javaDependencySources = ['API', 'API_OPTIONAL', 'IMPL', 'FRL', 'INCLUDE'].map(type =>
  asUniqueStr(type, 'JavaDepType')
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
    for (const [loader, entries] of Object.entries(this.#data))
      for (const [mc, value] of Object.entries(entries)) result.push({ mc, loader, value })

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
 * @template {*[]} T
 * @typedef {T[number]} ItemIn<T>
 */

/**
 * @typedef {Object} ModrinthError
 * @prop {string} error
 * @prop {string} description
 */
/**
 * @typedef {Object} ModrinthProject
 * @prop {Name} title
 * @prop {MId} id
 * @prop {MSlug} slug
 * @prop {string} icon_url
 * @prop {Loader[]} loaders
 */
/**
 * @typedef {Object} ModrinthProjectVersion
 * @prop {string} version_number
 * @prop {Mc[]} game_versions
 * @prop {Loader[]} loaders
 * @prop {{ project_id: MId, version_id: string, dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded' }[]} dependencies
 */

/** @typedef {{ 'Modrinth': 0, 'FabricApi': 0 }} DependencySources */

/**
 * @template {DependencySource} T
 * @typedef {(pairs: { mc: Mc, loader: Loader }[], info: Omit<GenericDependency<T>, 'mavenSource' | 'icon_url' | 'type'>) => Promise<VersionMap<GenericDependencyVersion<T>>>} DependencyResolver<T>
 */

/**
 * @template {DependencySource} T
 * @typedef {Object} GenericDependency<T>
 * @prop {T} type
 * @prop {Name} name
 * @prop {MId} id
 * @prop {MSlug} slug
 * @prop {MavenSource} mavenSource
 * @prop {Promise<string>} icon_url
 */
/**
 * @template {DependencySource} T
 * @typedef {Object} GenericDependencyVersion<T>
 * @prop {T} type
 * @prop {Name} name
 * @prop {MId} id
 * @prop {MSlug} slug
 * @prop {MavenSource} mavenSource
 * @prop {VersionMaven} versionMaven
 * @prop {string} versionNumber
 * @prop {{ type: DependencySource, project_id: MId, version_id: string, dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded' }[]} dependencies
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
 * @template {DependencySource} T
 * @typedef {Object} DependencyInfo
 * @prop {T} type
 * @prop {Name} name
 * @prop {MId} id
 * @prop {MSlug} slug
 * @prop {boolean} required
 * @prop {Loader[]} validLoaders
 * @prop {JavaDepType} javaDepType
 * @prop {MavenSource} mavenSource
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

// /**
//  * Typescript church encoded numbers.
//  * @typedef {false | {apply: false | CNum}} CNum
//  */

// /**
//  * Positive CNum (used often in recursion).
//  * @typedef {{ apply: CNum }} PCNum
//  */

// /**
//  * @typedef {false} CN0
//  * @typedef {{ apply: false }} CN1
//  * @typedef {{ apply: { apply: false } }} CN2
//  * @typedef {{ apply: { apply: { apply: false } } }} CN3
//  * @typedef {{ apply: { apply: { apply: { apply: false } } } }} CN4
//  * @typedef {{ apply: { apply: { apply: { apply: { apply: false }} } } }} CN5
//  */

// /**
//  * @typedef {{ [key in keyof _CN_0<CNumMap,{}>] : CConvert2<key> }} CN
//  */

// /**
//  * @template {CNumMapType} map
//  * @template {{ [key: string] : number }} result
//  * @typedef {ValueOf<map> extends CNumMapType ? _CN_0<ValueOf<map>, result & {[key in keyof map] : key}> : result} _CN_0
//  */

// /**
//  * I have to have a fixed set of real numbers :<
//  * @typedef {{0:{1:{2:{3:{4:{5:{6:{7:{8:{9:{10:{11:{12:{13:{14:{15:{16:{17:{18:{19:{20:{21:{22:{23:{24:{25:{26:{27:{28:{29:{30:{31:{32:0}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}} CNumMap
//  */

// /**
//  * @typedef {{ [key: string] : number | CNumMapType }} CNumMapType
//  */

// /**
//  * Convert from a CNum to a normal number.
//  * @template {CNum} n
//  * @typedef {_CConvert<n,CNumMap>} CConvert<n>
//  */

// /**
//  * @template {CNum} n
//  * @template {CNumMapType} m
//  * @typedef {n extends CN0 ? { [key in keyof m as string & { _: 'key' }]: key }[string & { _: 'key' }] : { [key in keyof m as string & { _: 'key' }]: m[key] }[string & { _: 'key' }] extends CNumMapType ? _CConvert<CSub<n,CN1>,{ [key in keyof m as string & { _: 'key' }]: m[key] }[string & { _: 'key' }]> : never} _CConvert<n,m>
//  */

// /**
//  * Convert from a normal number to a CNum.
//  * @template {number} m
//  * @typedef {_CConvert2<m,CN0>} CConvert2<m>
//  */

// /**
//  * @template {number} m
//  * @template {CNum} n
//  * @typedef {CConvert<n> extends m ? n : CConvert<n> extends never ? never : _CConvert2<m,CAdd<n,CN1>>} _CConvert2<m,n>
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @typedef {a extends PCNum ? CAdd<a['apply'],{ apply: b}> : b} CAdd<a,b>
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @typedef {b extends PCNum ? a extends PCNum ? CSub<a['apply'],b['apply']> : never : a} CSub<a,b>
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @typedef {_CMult<a,b,a,CN0>} CMult<a,b>
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @template {CNum} remaining
//  * @template {CNum} result
//  * @typedef {remaining extends PCNum ? _CMult<a,b,remaining['apply'],CAdd<b,result>> : result} _CMult
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @typedef {a extends CN0 ? b extends CN0 ? never : CN1 : b extends CN0 ? CN1 : _CPow<a,b,CSub<b,CN1>,a>} CPow<a,b>
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @template {CNum} remaining
//  * @template {CNum} result
//  * @typedef {remaining extends PCNum ? _CPow<a,b,remaining['apply'],CMult<result,a>> : result} _CPow
//  */

// /**
//  * @template {CNum} a
//  * @template {CNum} b
//  * @typedef {a extends PCNum ? b extends PCNum ? CEquals<CSub<a,CN1>,CSub<b,CN1>> : false : b extends PCNum ? false : true} CEquals<a,b>
//  */

// /**
//  * @template {string} str
//  * @template {CNum} count
//  * @typedef {count extends PCNum ? count['apply'] extends { apply: CNum} ? `${str}${RepeatString<str, count['apply']>}` : str : ""} RepeatString<str,count>
//  */
