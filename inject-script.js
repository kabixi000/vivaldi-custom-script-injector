import { readFile, writeFile, copyFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'node-html-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 設定ファイルを読み込み
const configPath = join(__dirname, 'config.json')
const configData = await readFile(configPath, 'utf8')
const config = JSON.parse(configData)

const findLatestVersion = async (basePath) => {
  const entries = await readdir(basePath, { withFileTypes: true })
  const versionDirs = entries
    .filter(entry => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  
  return versionDirs[0]
}

const injectCustomScript = async () => {
  try {
    const version = await findLatestVersion(config.vivaldiBasePath)
    if (!version) throw new Error('バージョンディレクトリが見つかりません')
    
    const vivaldiPath = join(config.vivaldiBasePath, version, 'resources', 'vivaldi')
    const windowHtmlPath = join(vivaldiPath, 'window.html')

    console.log(`対象ディレクトリ: ${vivaldiPath}`)
    console.log(`バージョン: ${version}`)

    // カスタムスクリプトディレクトリの中身を全てコピー
    const scriptFiles = await readdir(config.customScriptDir, { withFileTypes: true })
    for (const file of scriptFiles) {
      if (file.isFile()) {
        const srcPath = join(config.customScriptDir, file.name)
        const destPath = join(vivaldiPath, file.name)
        await copyFile(srcPath, destPath)
        console.log(`${file.name} をコピーしました`)
      }
    }

    // window.html を読み込み
    const content = await readFile(windowHtmlPath, 'utf8')
    const root = parse(content)

    // 既存チェック (.js ファイルのscriptタグが既にあるか)
    const jsFiles = scriptFiles.filter(f => f.isFile() && f.name.endsWith('.js'))
    const allScriptsExist = jsFiles.every(f =>
      root.querySelector(`script[src="${f.name}"]`)
    )
    if (allScriptsExist && jsFiles.length > 0) {
      console.log('カスタムスクリプトタグは既に全て存在します')
      return
    }
    
    // バックアップ
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const backupPath = `${windowHtmlPath}.backup_${timestamp}`
    await copyFile(windowHtmlPath, backupPath)
    console.log(`バックアップ作成: ${backupPath}`)

    // body タグを取得して末尾に .js ファイルの script タグを追加
    const body = root.querySelector('body')
    if (!body) throw new Error('body タグが見つかりません')

    for (const file of jsFiles) {
      const existing = root.querySelector(`script[src="${file.name}"]`)
      if (!existing) {
        const scriptTag = parse(`<script src="${file.name}"></script>`)
        body.appendChild(scriptTag)
        console.log(`${file.name} のスクリプトタグを追加しました`)
      }
    }

    // 書き込み
    await writeFile(windowHtmlPath, root.toString(), 'utf8')
    console.log('window.html を更新しました')
    console.log('完了')
    
  } catch (error) {
    console.error('エラー:', error.message)
    process.exit(1)
  }
}

injectCustomScript()
