// Builds demo/IMD-Legal-Register-demo.html: the whole app in one file, with js/demo.js standing in for the server.
// Run from the project folder:  node tools/build-demo.mjs
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(root, 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => fs.readFileSync(path.join(pub, m[1]), 'utf8')).join('\n');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const i = scripts.indexOf('js/sample.js');
scripts.splice(i, 0, 'js/demo.js');
const js = scripts.map((s) => '/* ' + s + ' */\n' + fs.readFileSync(path.join(pub, s), 'utf8').replace(/<\/script/gi, '<\\/script')).join('\n');
const out = '<title>IMD Legal Register</title>\n<style>\n' + css + '\n</style>\n<div id="app"></div>\n<script>\n' + js + '\n</script>\n';
fs.mkdirSync(path.join(root, 'demo'), { recursive: true });
fs.writeFileSync(path.join(root, 'demo', 'IMD-Legal-Register-demo.html'), out);
console.log('demo/IMD-Legal-Register-demo.html', Math.round(out.length / 1024) + ' KB');
