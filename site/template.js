/**
 * @import {Mc, Loader, Mapper, Folder, DependencyInfo, StringifiedFolder } from './types.d.js'
 */

import { asStr, ObjectEntries, loaders } from './types.d.js'

// import { wrapPromise, wrappedPromises, unwrapPromise } from './data.js'
import * as Data from './data.js'

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
 * @param {Object} config
 * @param {{ mc: Mc, loader: Loader }[]} config.selectedVersions
 * @param {(status: string) => void} config.updateStatus
 * @param {DependencyInfo[]} config.manualDependencies
 * @param {{ name: string, id: string, author: string, license: string, description: string, className: string, stonecutterVcs: string }} config.modData
 * @param {(mc: Mc, loader: Loader) => void} config.removeVersion
 * @param {Mapper} config.selectedMapping
 * @param {{ sharedRuns: boolean, githubActions: boolean }} config.miscSettings
 * @param {() => void} config.populateVersionSelector
 */
export default async config => {
  const {
    selectedVersions,
    updateStatus,
    manualDependencies,
    modData,
    removeVersion,
    selectedMapping,
    miscSettings,
    populateVersionSelector
  } = config
  const extraFiles = await Data.extraFiles
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

  const dependencies = Data.getDependencyVersions(uniqueVersions, uniqueLoaders, updateStatus, manualDependencies)

  dependencies.then(() => updateStatus('Generating versions'))

  const yarnVersions = Data.getYarnVersions()
  const parchmentVersions = Data.getParchmentVersions()

  const packFormats = Data.getPackFormats()

  let hadWarnings = false

  const startVersionCount = selectedVersions.length

  /** @type {Object<string, Loader[]>} */
  const usedVersions = {}
  /** @type {Set<Loader>} */
  const usedLoaders = new Set()
  for (const version of [...selectedVersions.toSorted((a, b) => Data.compareVersions(b.mc, a.mc))]) {
    const loader = version.loader
    const mc = version.mc

    const lines = []
    lines.push(`deps.core.mc.version_range=${mc}`)
    lines.push('')

    let missingRequiredDependency = false
    for (const dependency of await dependencies) {
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
        `deps.core.fabric.version_range=${Data.fabricVersions.find(entry => entry.mcVersion === mc)?.fabricVersion}`
      )
    else if (asStr(loader) === 'forge')
      lines.push(
        `deps.core.forge.version_range=${Data.forgeVersions.find(entry => entry.mcVersion === mc)?.forgeVersion}`
      )
    else if (asStr(loader) === 'neoforge') {
      lines.push(
        `deps.core.neoforge.version_range=${Data.neoforgeVersions.find(entry => entry.mcVersion === mc)?.neoforgeVersion}`
      )
      if (Data.compareVersions(mc, '1.20.2') !== 1) lines.push('deps.core.neoforge.loader.version_range=1 UNSET')
    }

    if (selectedMapping === 'yarn') {
      const dependency = (await yarnVersions)[mc]
      if (dependency === undefined) {
        console.warn(`Skipping ${mc}-${loader}: missing yarn`)
        hadWarnings = true
        removeVersion(mc, loader)
        continue
      }
      lines.push(`deps.mappings.yarn=${dependency.version}`)

      // If there is a patch for this version specifically
      const explicitPatch = Data.yarnPatches.get(mc, loader)
      if (explicitPatch !== undefined) lines.push(`deps.mappings.yarn.patch=${explicitPatch}`)

      // Otherwise use the most version recent patch if there is one
      const explicitPatchVersions = Data.yarnPatches.entries
        .filter(entry => entry.loader === loader)
        .map(entry => entry.mc)
        .sort(Data.compareVersions)
      const oldestPatch = explicitPatchVersions[0] ?? '2'
      if (Data.compareVersions(mc, oldestPatch) === 1)
        for (const explicitVersion of explicitPatchVersions.toReversed())
          if (Data.compareVersions(mc, explicitVersion) === 1) {
            lines.push(`deps.mappings.yarn.patch=${Data.yarnPatches.get(explicitVersion, loader)}`)
            break
          }
    } else if (selectedMapping === 'parchment') {
      const dependency = (await parchmentVersions)[mc]
      if (dependency === undefined) {
        console.warn(`Skipping ${mc}-${loader}: missing parchment`)
        hadWarnings = true
        removeVersion(mc, loader)
        continue
      }
      lines.push(`deps.mappings.parchment=${dependency}`)
    }

    lines.push(`deps.pack_format=${(await packFormats)[mc] ?? ''}`)

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

  let templateStr = Data.getTemplate(selectedMapping)
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
    dependencies: (await dependencies).flatMap(dependency => [
      'APISource(',
      `    DepType.${dependency.javaDepType},`,
      `    APIModInfo("${dependency.slug}", null, "${dependency.slug}"),`,
      `    "maven.modrinth:${dependency.slug}",`,
      `    optionalVersionProperty("deps.mods.${dependency.slug}"),`,
      ') { src ->',
      '    src.versionRange.isPresent',
      '},'
    ]),
    'config-fabric-range': `deps.core.fabric.loader.version_range=${Data.fabricVersions.reduce((prev, version) => (prev === undefined ? version.fabricVersion : Data.compareVersions(version.fabricVersion, prev) === 1 ? prev : version.fabricVersion), Data.fabricVersions[0]?.fabricVersion)} UNSET`
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

  if (!miscSettings.githubActions) delete template['.github']

  /**
   * @param {string} file
   * @param {string} path
   * @returns {string | false}
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
            lineNumber += subIndex - index - 1
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
              lineNumber += subIndex - index - 1
            }
            index--
            breakIndex++
            if (breakIndex === 10_000) throw new Error('Loop detected parsing template')
          }
          break
        }
    }
    if (file.split('\n').filter(line => line.trim().length).length && !lines.filter(line => line.trim().length).length)
      return false
    return lines.join('\n')
  }

  /**
   * @param {StringifiedFolder} folder
   * @param {string} [path]
   */
  const templateFolder = (folder, path = '') => {
    for (const [name, item] of ObjectEntries(folder)) {
      const itemPath = path.length ? `${path}/${name}` : name
      if (typeof item === 'string') {
        const result = templateFile(item, itemPath)
        if (result === false) delete folder[name]
        else folder[name] = result
      } else templateFolder(item, itemPath)
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

  folder.createFile('gradlew', extraFiles.gradlew)
  folder.createFile('gradlew.bat', extraFiles['gradlew.bat'])
  const wrapperFolder = folder.createFolder('gradle').createFolder('wrapper')
  wrapperFolder.createFile('gradle-wrapper.jar', extraFiles['gradle/wrapper/gradle-wrapper.jar'])
  wrapperFolder.createFile('gradle-wrapper.properties', extraFiles['gradle/wrapper/gradle-wrapper.properties'])

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
}
