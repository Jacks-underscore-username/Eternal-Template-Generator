declare global {
  interface ObjectConstructor {
    entries<T>(o: { [s: string]: T } | ArrayLike<T>, customParam: string): [string, T][]

    entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][]
    entries(o: any): [string, any][]
  }
}

type UniqueString = string & { options: options; id: id }
type ChainedUniqueString = UniqueString<
  U extends UniqueString<infer S, any> ? S : never,
  `${U extends UniqueString<any, infer N> ? N : never}${T}`
>

type Mc = UniqueString<string, 'Mc'>
type Loader = UniqueString<'fabric' | 'forge' | 'neoforge', 'Loader'>
type Name = UniqueString<string, 'Name'>
type DependencySourceType = 'Modrinth' | 'FabricApi'
/**
 * @template {DependencySourceType} S
 */
type Id = UniqueString<string, `${S}Id`>
/**
 * @template {DependencySourceType} S
 */
type Slug = UniqueString<string, `${S}Slug`>
type JavaDepType = UniqueString<'API' | 'API_OPTIONAL' | 'IMPL' | 'FRL' | 'INCLUDE', 'JavaDepType'>
type Mapper = UniqueString<'yarn' | 'parchment' | 'mojmaps', 'Mapper'>

type KnownUniqueStringTypes = {
  Mc: Mc
  Loader: Loader
  Name: Name
  DependencySourceType: DependencySourceType
  Id: Id<any>
  Slug: Slug<any>
  JavaDepType: JavaDepType
  Mapper: Mapper
} & { [key: string]: false }

export const asUniqueStr = <str, id>(
  str: str,
  id: id
): KnownUniqueStringTypes[id] extends UniqueString<infer options, id>
  ? str extends options
    ? UniqueString<str, id>
    : never
  : UniqueString<str, id> => str

export const asStr = <T>(
  str: T
): T extends UniqueString<infer S, infer id>
  ? KnownUniqueStringTypes[id] extends UniqueString<infer options, id>
    ? options
    : S
  : T => str

export const ObjectEntries = <T>(obj: T): EntryOf<T>[] => Object.entries(obj)

export const loaders = ['fabric', 'forge', 'neoforge'].map(loader => asUniqueStr(loader, 'Loader'))
export const loader_fabric = asUniqueStr('fabric', 'Loader')
export const loader_forge = asUniqueStr('forge', 'Loader')
export const loader_neoforge = asUniqueStr('neoforge', 'Loader')
/** @type {JavaDepType[]} */
export const javaDependencySources: JavaDepType[] = ['API', 'API_OPTIONAL', 'IMPL', 'FRL', 'INCLUDE'].map(type =>
  asUniqueStr(type, 'JavaDepType')
)

export class VersionMap {
  #data: { [loader: Loader]: { [mc: Mc]: T } } = {}
  get(mc: Mc, loader: Loader): T | undefined {
    return this.#data[loader]?.[mc]
  }
  set(mc: Mc, loader: Loader, value: T) {
    if (this.#data[loader] === undefined) this.#data[loader] = {}
    this.#data[loader][mc] = value
  }
  get entries(): { mc: Mc; loader: Loader; value: T }[] {
    const result: { mc: Mc; loader: Loader; value: T }[] = []
    for (const [loader, entries] of ObjectEntries(this.#data))
      for (const [mc, value] of ObjectEntries(entries)) result.push({ mc, loader, value })

    return result
  }
  get length(): number {
    return this.entries.length
  }
  static fromEntries<T>(entries: Iterable<{ mc: Mc; loader: Loader; value: T }>): VersionMap<T> {
    /** @type {VersionMap<T>} */
    const map: VersionMap<T> = new VersionMap()
    for (const entry of entries) map.set(entry.mc, entry.loader, entry.value)
    return map
  }
  map<U>(
    func: (
      entry: { mc: Mc; loader: Loader; value: T },
      index: number,
      array: { mc: Mc; loader: Loader; value: T }[]
    ) => { mc: Mc; loader: Loader; value: U }
  ): VersionMap<U> {
    return VersionMap.fromEntries(this.entries.map((entry, index, array) => func(entry, index, array)))
  }
}

type KeyOf = {
  [key in keyof T as string & { _: '' }]: key
}[string & { _: '' }]

type ValueOf = {
  [key in keyof T as string & { _: '' }]: T[key]
}[string & { _: '' }]

type EntryOf = {
  [key in keyof T as string & { _: '' }]: [key, T[key]]
}[string & { _: '' }]

interface ModrinthError {
  error: string
  description: string
}
interface ModrinthProject {
  title: Name
  id: Id
  slug: Slug
  icon_url: string
  loaders: Loader[]
}
interface ModrinthProjectVersion {
  version_number: string | null
  game_versions: Mc[]
  loaders: Loader[]
  dependencies: {
    project_id: Id
    version_id: string
    dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  }[]
}

type DependencySourcesStrings = 'Modrinth' | 'FabricApi'
type DependencySources = {
  [key in keyof DependencySourcesStrings as string & UniqueString<string, 'key'>]: UniqueString<
    key,
    `DependencySource${key}`
  >
}[UniqueString<string, 'key'>]
interface DependencyResolver {
  maven: UniqueString<string, `${T extends UniqueString<infer S, any> ? S : never}Maven`>
}

interface GenericDependency {
  title: string
  id: string
  icon_url: Promise<string>
  maven: string
  getVersions: (mcVersions: Mc[], loaders: Loader[]) => Promise<VersionMap<GenericDependencyVersion>>
}
interface GenericDependencyVersion {
  title: string
  id: string
  maven: string
  version_number: string
}

type StringifiedFolder = { [key: string]: string | StringifiedFolder }
interface Yarn {
  gameVersion: string
  separator: string
  build: string
  maven: string
  version: string
  stable: boolean
}
interface FabricLoader {
  loader: {
    separator: string
    build: number
    maven: string
    version: string
    stable: boolean
  }
  intermediary: {
    maven: string
    version: string
    stable: boolean
  }
}
interface DependencyInfo {
  type: DependencySource
  name: Name
  id: Id
  slug: Slug
  required: boolean
  validLoaders: Loader[]
  javaDepType: JavaDepType
}
interface Folder {
  name: string
  type: 'folder'
  contents: Object<string, Folder | { name: string; type: 'file'; contents: string }>
  createFolder: (name: string) => Folder
  createFile: (name: string, contents: string) => { name: string; type: 'file'; contents: string }
}

type ExtraFiles = {
  gradlew: string
  'gradlew.bat': string
  'gradle/wrapper/gradle-wrapper.jar': string
  'gradle/wrapper/gradle-wrapper.properties': string
}

interface VersionConstraints {
  supportsFabric: boolean
  supportsNeoOrForge: boolean
  supportsForge: boolean
  supportsNeoforge: boolean
  onlyRelease: boolean
  onlySelected: boolean
}

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
