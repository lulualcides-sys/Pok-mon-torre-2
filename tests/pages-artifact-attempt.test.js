import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');

test('Pages reruns select exactly one matching artifact per run attempt',()=>{
 const upload=workflow.match(/- if: steps\.pages-enabled\.outputs\.enabled == 'true'\n\s+uses: actions\/upload-pages-artifact@v3\n\s+with:\n\s+name: ([^\n]+)\n\s+path: _site\//);
 const deploy=workflow.match(/- if: steps\.pages-enabled\.outputs\.enabled == 'true'\n\s+id: deploy\n\s+uses: actions\/deploy-pages@v4\n\s+with:\n\s+artifact_name: ([^\n]+)/);
 assert.ok(upload,'Pages upload must explicitly name its artifact');
 assert.ok(deploy,'Pages deployment must select the same artifact name');
 assert.equal(upload[1],deploy[1],'upload and deploy must refer to the same artifact');
 assert.match(upload[1],/\$\{\{ github\.run_attempt \}\}/,
  'the name must change between reruns of the same workflow run');
 const name=attempt=>upload[1].replaceAll('${{ github.run_attempt }}',String(attempt));
 assert.notEqual(name(1),name(2),'a rerun must not collide with its previous artifact');
 assert.ok(workflow.includes('Verificar no Pages publico se o codigo novo foi servido'),
  'HTTP SHA verification must remain after deployment');
 assert.ok(workflow.includes('Validar a Pokédex na página PUBLICADA no Chromium'),
  'public Pokédex Chromium gate must remain mandatory');
});
