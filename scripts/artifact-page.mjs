// Turns dist-single/index.html into page content for a claude.ai artifact:
// the host supplies <!doctype>, <html>, <head> and <body>, so we keep only
// what's inside them (title, style, scripts, root div).
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-single/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*)<\/head>/)[1].replace(/<meta[^>]*>\s*/g, '');
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
const out = 'dist-single/artifact.html';
writeFileSync(out, `${head.trim()}\n${body.trim()}\n`);
console.log(`wrote ${out} (${(readFileSync(out).length / 1024).toFixed(0)} KB)`);
