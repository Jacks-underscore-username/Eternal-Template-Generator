/**
 * @import {Mc, Loader, Id, JavaDepType, Mapper, DependencyInfo, ModrinthProject, VersionConstraints } from './types.d.js'
 */

import { asUniqueStr, UNIQUE_STRING_TYPES, loaders, javaDepTypes } from './types.d.js'

import * as Data from './data.js'
import Template from './template.js'
;(async () => {
  const themeToggle = /** @type {HTMLDivElement} */ (document.getElementById('theme_toggle'))
  const lightThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_light'))
  const darkThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_dark'))
  const oledThemeIcon = /** @type {HTMLElement} */ (document.getElementById('theme_oled'))

  const versionSelectorElement = /** @type {HTMLDivElement} */ (document.getElementById('version_selector'))
  const versionsCountElement = /** @type {HTMLSpanElement} */ (document.getElementById('versions_count'))

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

  const sharedRunsCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('common_runs_checkbox'))
  const githubActionsCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('github_actions_checkbox'))

  const mappingYarnRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_yarn_radio'))
  const mappingParchmentRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_parchment_radio'))
  const mappingMojmapsRadio = /** @type {HTMLInputElement} */ (document.getElementById('mappings_mojmaps_radio'))

  const modNameElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_name_input'))
  const modIdElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_id_input'))
  const modAuthorElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_author_input'))
  const modLicenseElement = /** @type {HTMLInputElement} */ (document.getElementById('mod_license_input'))
  const modDescriptionElement = /** @type {HTMLTextAreaElement} */ (document.getElementById('mod_description_input'))

  const dependencySelector = /** @type {HTMLDivElement} */ (document.getElementById('dependency_selector'))
  const addDependencyId = /** @type {HTMLInputElement} */ (document.getElementById('add_dependency_id'))
  const addDependencyButton = /** @type {HTMLElement} */ (document.getElementById('add_dependency_button'))

  const downloadButton = /** @type {HTMLButtonElement} */ (document.getElementById('download_button'))

  let theme = Number.parseInt(localStorage.getItem('theme') ?? '1')

  /** @type {VersionConstraints} */
  const versionConstraints = {
    supportsFabric: false,
    supportsNeoOrForge: false,
    supportsForge: false,
    supportsNeoforge: false,
    onlyRelease: true,
    onlySelected: false
  }

  const selectedVersions = (() => {
    /** @type {{ mc: Mc, loader: Loader }[]} */
    const selectedVersions = []
    let isFirstTick = true
    setImmediate(() => (isFirstTick = false))
    return new Proxy(selectedVersions, {
      deleteProperty(target, prop) {
        versionsCountElement.textContent = `Count\n${selectedVersions.length - 1}`
        // @ts-expect-error
        return delete target[prop]
      },
      set(target, prop, receiver) {
        // @ts-expect-error
        target[prop] = receiver
        if (!isFirstTick) versionsCountElement.textContent = `Count\n${selectedVersions.length}`
        return true
      }
    })
  })()

  const miscSettings = {
    sharedRuns: true,
    githubActions: true
  }

  /** @type {Mapper} */
  let selectedMapping = asUniqueStr('yarn', UNIQUE_STRING_TYPES.Mapper)

  /** @type {DependencyInfo[]} */
  const manualDependencies = []

  const icons = [oledThemeIcon, darkThemeIcon, lightThemeIcon]

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
    for (const version of Data.sortedMcVersions) {
      if (!loaders.some(loader => Data.shouldShowVersion(version, loader, versionConstraints, selectedVersions)))
        continue
      const wrapper = document.createElement('div')
      const name = document.createElement('input')
      name.classList.add('option')
      name.type = 'checkbox'
      // @ts-expect-error
      name.dataset.label = version
      name.checked = loaders.every(
        loader =>
          !Data.doesLoaderSupportVersion(version, loader) ||
          selectedVersions.some(entry => entry.mc === version && entry.loader === loader)
      )
      wrapper.appendChild(name)
      /** @type {HTMLInputElement[]} */
      const toggles = []
      for (const loader of loaders) {
        if (!Data.shouldShowVersion(version, loader, versionConstraints, selectedVersions)) {
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
              !Data.doesLoaderSupportVersion(version, loader) ||
              selectedVersions.some(entry => entry.mc === version && entry.loader === loader)
          )
        })
        wrapper.appendChild(toggle)
        toggles.push(toggle)
      }
      name.addEventListener('change', () => {
        for (const toggle of toggles) toggle.checked = name.checked
        for (const loader of loaders)
          if (Data.doesLoaderSupportVersion(version, loader))
            if (name.checked) addVersion(version, loader)
            else removeVersion(version, loader)
      })
      versionSelectorElement.appendChild(wrapper)
    }
  }

  document.getElementById('versions_select_all_button')?.addEventListener('click', () => {
    for (const version of Data.sortedMcVersions)
      for (const loader of loaders)
        if (
          Data.shouldShowVersion(version, undefined, versionConstraints, selectedVersions) &&
          !selectedVersions.some(entry => entry.mc === version && entry.loader === loader) &&
          Data.doesLoaderSupportVersion(version, loader)
        )
          selectedVersions.push({
            mc: version,
            loader
          })
    populateVersionSelector()
  })
  document.getElementById('versions_deselect_all_button')?.addEventListener('click', () => {
    for (const version of Data.sortedMcVersions)
      for (const loader of loaders)
        if (Data.shouldShowVersion(version, loader, versionConstraints, selectedVersions)) {
          const index = selectedVersions.findIndex(entry => entry.mc === version && entry.loader === loader)
          if (index !== -1) selectedVersions.splice(index, 1)
        }
    populateVersionSelector()
  })

  for (const [checkbox, key] of [
    [sharedRunsCheckbox, 'sharedRuns'],
    [githubActionsCheckbox, 'githubActions']
  ]) {
    // @ts-expect-error
    checkbox.addEventListener('change', () => (miscSettings[key] = checkbox.checked))
  }

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

  /**
   * @param {Id} id
   * @param {boolean} required
   * @param {JavaDepType} javaDepType
   * @returns {Promise<void>}
   */
  const addManualDependency = async (id, required, javaDepType) => {
    if (manualDependencies.some(dependency => dependency.id === id)) return
    /** @type {ModrinthProject | undefined} */
    const response = await Data.getModrinthProjectById(id)
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

  let isDownloading = false
  downloadButton.addEventListener('click', async () => {
    if (isDownloading) return
    isDownloading = true
    downloadButton.classList.add('active')

    /**
     * @param {string} status
     */
    const updateStatus = status => (downloadButton.dataset['label'] = `${status}...`)

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

    await Template({
      manualDependencies,
      miscSettings,
      selectedMapping,
      selectedVersions,
      updateStatus,
      populateVersionSelector,
      modData,
      removeVersion
    })

    downloadButton.classList.remove('active')
    downloadButton.dataset['label'] = 'Download'
    isDownloading = false
  })

  populateVersionSelector()

  await new Promise(r => setTimeout(r, 1000))
  supportsFabricCheckbox.click()
  supportsNeoOrForgeCheckbox.click()
  modNameElement.value = 'Demo Mod'
  modIdElement.value = 'demo_mod'
  modAuthorElement.value = 'Me'
  modLicenseElement.value = 'MITE'
  modDescriptionElement.value = 'Really just a demo mod'
  // addManualDependency(
  //   asUniqueStr('nfn13YXA', UNIQUE_STRING_TYPES.Id),
  //   true,
  //   asUniqueStr('IMPL', UNIQUE_STRING_TYPES.JavaDepType)
  // )

  for (const element of Array.from(document.querySelectorAll('#version_selector > div > input:nth-child(1)')))
    if (element instanceof HTMLInputElement && Data.compareVersions(element.dataset['label'] ?? '0', '1.16.5') >= 0)
      element.click()
  document.querySelector('#dependency_selector > div:nth-child(1) > svg')?.dispatchEvent(new Event('click'))
})()
