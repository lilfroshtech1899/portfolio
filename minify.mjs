import { readFile, writeFile } from 'node:fs/promises';
import { minify as minifyCss } from 'csso';
import { minify } from 'terser';

const CSS_FILES = [
  'css/style.css',
  'tokens/css/style.css'
];

const JS_FILES = [
  'js/main.js',
  'js/supabase.js',
  'tokens/js/dashboard.js',
  'tokens/js/login.js'
];

for (const file of CSS_FILES) {
  try {
    const source = await readFile(file, 'utf8');
    const { css } = minifyCss(source, { restructure: true });
    await writeFile(file, css, 'utf8');
    console.log(`minified ${file}  ${source.length} -> ${css.length} bytes`);
  } catch (err) {
    console.warn(`SKIPPED ${file} (kept original): ${err.message}`);
  }
}

for (const file of JS_FILES) {
  try {
    const source = await readFile(file, 'utf8');
    const { code } = await minify(source, { compress: true, mangle: true });
    await writeFile(file, code, 'utf8');
    console.log(`minified ${file}  ${source.length} -> ${code.length} bytes`);
  } catch (err) {
    console.warn(`SKIPPED ${file} (kept original): ${err.message}`);
  }
}
