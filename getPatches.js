const fs = require('node:fs')
const path = require('node:path')
const { XMLParser } = require('fast-xml-parser')
;(async () => {
  /** @type {Object<string, Object<string, string>>} */
  const patches = {}
  for (const loader of ['forge', 'neoforge']) {
    const response = await (
      await fetch(`https://maven.architectury.dev/dev/architectury/yarn-mappings-patch-${loader}/maven-metadata.xml`)
    ).text()
    const xml = new XMLParser().parse(response)
    /** @type {string[]} */
    const versions = xml.metadata.versioning.versions.version
    /** @type {Object<string, string>} */
    const mcVersionToBuildMap = {}
    for (const version of versions) {
      const mcVersion = version.match(/^([0-9.]+)/)?.[1] ?? ''
      const build = Number.parseInt(version.match(/^[0-9.]+\+build\.([0-9]+)/)?.[1] ?? '')
      if (mcVersionToBuildMap[mcVersion] === undefined || Number.parseInt(mcVersionToBuildMap[mcVersion]) < build)
        mcVersionToBuildMap[mcVersion] = `${build}`
    }
    for (const [mcVersion, build] of Object.entries(mcVersionToBuildMap))
      mcVersionToBuildMap[mcVersion] = `${mcVersion}+build.${build}`
    console.log(`${loader} patch map: ${JSON.stringify(mcVersionToBuildMap)}`)
    patches[loader] = mcVersionToBuildMap
  }
  fs.writeFileSync(path.join(__dirname, 'site', 'yarn-patches.json'), JSON.stringify(patches, undefined, 2), 'utf8')
  console.log('Patches generated')
})()
