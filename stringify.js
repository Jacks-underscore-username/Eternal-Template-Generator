const fs = require('node:fs')
const path = require('node:path')

/**
 * @typedef {{[key: string]: (string | Obj)}} Obj
 */

/**
 * @param {string} folderPath
 * @returns {Obj}
 */
const scan = folderPath => {
  /** @type {Obj} */
  const obj = {}
  for (const item of fs.readdirSync(folderPath)) {
    const itemPath = path.join(folderPath, item)
    if (['gradle', 'gradlew', 'gradlew.bat'].includes(item)) continue
    obj[item] = fs.statSync(itemPath).isDirectory() ? scan(itemPath) : fs.readFileSync(itemPath, 'utf8')
  }
  return obj
}

const obj = scan(path.join(__dirname, 'template'))
fs.writeFileSync(path.join(__dirname, 'site', 'template.json'), JSON.stringify(obj), 'utf8')
console.log('Template stringified')
