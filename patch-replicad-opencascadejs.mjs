import { promises as fs } from 'fs';
const pkgPath = './node_modules/replicad-opencascadejs/package.json';
let pkg;
try {
  pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
} catch {
  pkg = {};
}
if (pkg.type !== 'module') {
  pkg.type = 'module';
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Patched replicad-opencascadejs to be ESM');
} else {
  console.log('replicad-opencascadejs already has type: module');
}
