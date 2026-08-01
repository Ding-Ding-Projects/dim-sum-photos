const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL, fileURLToPath } = require('url');
const os = require('os');
const { spawnSync } = require('child_process');
const https = require('https');
const IMAGE_RELEASE_BASE = 'https://github.com/Ding-Ding-Projects/dim-sum-photos/releases/download/untagged-6aa56ec6d2b6321dbbe5/';

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#101414',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  window.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('catalog:read', () => {
  const catalogPath = path.resolve(__dirname, '..', '..', '..', 'dim-sum', 'index.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  catalog.dishes = catalog.dishes.map((dish) => ({
    ...dish,
    image: dish.image ? { ...dish.image, assetUrl: pathToFileURL(path.resolve(__dirname, '..', '..', '..', 'dim-sum', dish.image.path)).toString(), releaseUrl: IMAGE_RELEASE_BASE + path.basename(dish.image.path) } : dish.image
  }));
  return catalog;
});

function download(url, destination) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Dim-Sum-Atlas/0.1' } }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) return download(response.headers.location, destination).then(resolve, reject);
      if (response.statusCode !== 200) return reject(new Error(`Image release returned HTTP ${response.statusCode}.`));
      const file = fs.createWriteStream(destination); response.pipe(file); file.on('finish', () => file.close(resolve)); file.on('error', reject);
    }).on('error', reject);
  });
}

ipcMain.handle('image:ensure', async (_event, { releaseUrl, relativePath }) => {
  if (!releaseUrl || !releaseUrl.startsWith(IMAGE_RELEASE_BASE)) throw new Error('Image source is not an approved catalog release URL.');
  const cacheRoot = path.join(app.getPath('userData'), 'image-cache');
  const destination = path.join(cacheRoot, relativePath.replaceAll('/', path.sep));
  if (fs.existsSync(destination)) return pathToFileURL(destination).toString();
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temp = `${destination}.download`;
  try { await download(releaseUrl, temp); fs.renameSync(temp, destination); return pathToFileURL(destination).toString(); }
  finally { if (fs.existsSync(temp)) fs.rmSync(temp, { force: true }); }
});

function find7z() {
  const candidates = [
    path.join(__dirname, '..', 'portable', '7z', '7z.exe'),
    path.join(process.env.ProgramFiles || '', '7-Zip', '7z.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', '7-Zip', '7z.exe'),
    '7z.exe'
  ];
  return candidates.find(candidate => candidate === '7z.exe' || fs.existsSync(candidate)) || null;
}

function csvEscape(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function serialize(records, format) {
  if (format === 'json') return JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2);
  if (format === 'csv') {
    const headers = ['id', 'name', 'cantonese', 'category', 'description', 'ingredients', 'allergens', 'fictionalOrigin', 'fictionalFacts'];
    return [headers.join(','), ...records.map(d => [d.id, d.name?.en, d.name?.zhHant, d.category, d.description?.en, d.ingredients?.join('; '), d.allergens?.join('; '), d.fiction?.origin, d.fiction?.facts?.join(' | ')].map(csvEscape).join(','))].join('\n');
  }
  if (format === 'html') return `<!doctype html><meta charset="utf-8"><title>Dim Sum Atlas export</title><h1>Dim Sum Atlas export</h1>${records.map(d => `<article><h2>${d.name?.en || ''} ${d.name?.zhHant || ''}</h2><p>${d.description?.en || ''}</p><h3>Fictional catalog lore</h3><p>${d.fiction?.origin || ''}</p><ul>${(d.fiction?.facts || []).map(f => `<li>${f}</li>`).join('')}</ul></article>`).join('')}`;
  if (format === 'markdown') return records.map(d => `## ${d.name?.en || ''} · ${d.name?.zhHant || ''}\n\n${d.description?.en || ''}\n\n### Fictional catalog lore\n\n- ${d.fiction?.origin || ''}\n${(d.fiction?.facts || []).map(f => `- ${f}`).join('\n')}\n`).join('\n');
  return records.map(d => `${d.name?.en || ''} · ${d.name?.zhHant || ''}\n${d.description?.en || ''}\nFictional catalog lore: ${d.fiction?.origin || ''}\n${(d.fiction?.facts || []).join('\n')}\n`).join('\n');
}

ipcMain.handle('export:records', async (_event, { records, format, archive, password, imagesOnly }) => {
  if (process.platform !== 'win32') throw new Error('Exports are supported on Windows only.');
  const chosen = await dialog.showSaveDialog({ defaultPath: `dim-sum-atlas-export.${archive === '7z' ? '7z' : archive === 'zip' ? 'zip' : format}`, filters: [{ name: 'Export', extensions: [archive === '7z' ? '7z' : archive === 'zip' ? 'zip' : format] }] });
  if (chosen.canceled || !chosen.filePath) return { canceled: true };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dim-sum-atlas-'));
  const content = imagesOnly ? JSON.stringify({ exportedAt: new Date().toISOString(), imageCount: records.length, images: records.map(d => ({ id: d.id, name: d.name, image: d.image?.path })) }, null, 2) : serialize(records, format);
  const dataFile = path.join(temp, `dim-sum-atlas.${format === 'markdown' ? 'md' : format}`);
  fs.writeFileSync(dataFile, content, 'utf8');
  if (imagesOnly) {
    const imageDir = path.join(temp, 'images');
    fs.mkdirSync(imageDir);
    for (const record of records) {
      if (!record.image?.assetUrl) continue;
      const source = fileURLToPath(record.image.assetUrl);
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(imageDir, path.basename(source)));
    }
  }
  if (!archive) { fs.copyFileSync(dataFile, chosen.filePath); fs.rmSync(temp, { recursive: true, force: true }); return { path: chosen.filePath, format }; }
  if (archive === 'zip') {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${temp.replaceAll("'", "''")}\\*' -DestinationPath '${chosen.filePath.replaceAll("'", "''")}' -Force`], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || 'ZIP export failed.');
  } else {
    const sevenZip = find7z();
    if (!sevenZip) throw new Error('7z.exe was not found. Install 7-Zip to enable 7z exports.');
    const args = ['a', chosen.filePath, path.join(temp, '*'), '-r', '-y'];
    if (password) args.push(`-p${password}`, '-mhe=on');
    const result = spawnSync(sevenZip, args, { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || '7z export failed.');
  }
  fs.rmSync(temp, { recursive: true, force: true });
  return { path: chosen.filePath, archive, encrypted: Boolean(password) };
});

ipcMain.handle('archive:capabilities', () => ({ platform: process.platform, sevenZip: Boolean(find7z()), operations: ['add', 'extract', 'list', 'test', 'update', 'delete', 'benchmark'], encryption: Boolean(find7z()) }));

app.whenReady().then(() => {
  if (process.platform !== 'win32') {
    dialog.showErrorBox('Windows only', 'Dim Sum Atlas is a Windows-only desktop app.');
    app.quit();
    return;
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
