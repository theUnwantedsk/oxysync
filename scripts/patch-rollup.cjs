const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js');
if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  if (!content.includes('@rollup/wasm-node/dist/native.js')) {
    content = content.replace(
      /if\s*\(\s*error instanceof Error && error\.code === 'ERR_DLOPEN_FAILED'\s*\)\s*\{\s*throw error;\s*\}/,
      `if (error instanceof Error && error.code === 'ERR_DLOPEN_FAILED') {
        try {
          return require('@rollup/wasm-node/dist/native.js');
        } catch (_) {
          throw error;
        }
      }`
    );
    fs.writeFileSync(target, content, 'utf8');
  }
}
