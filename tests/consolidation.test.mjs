import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { consolidationCode, readConsolidation, saveConsolidation, publishConsolidation } from '../teacher-dashboard/consolidation.mjs';

test('consolidació: esborrany persistent, model intacte i només microrepte propi', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'consolidacio-'));
  try {
    await mkdir(path.join(root, 'consolidation-drafts'));
    await writeFile(path.join(root, 'consolidation-drafts/r2m1.md'), '# Model\n');
    assert.equal(consolidationCode({microrepte:'R2M1'}), 'r2m1');
    assert.equal(consolidationCode({microrepte:'cap de nou; taller associat a R2M1'}), null);
    assert.equal((await readConsolidation(root,'r2m1')).markdown, '# Model\n');
    await saveConsolidation(root,'r2m1','# Canvi');
    assert.equal((await readConsolidation(root,'r2m1')).markdown, '# Canvi\n');
    assert.equal((await readConsolidation(root,'r2m2')).has_draft, false);
    await assert.rejects(saveConsolidation(root,'../escape','# Text'));
    await assert.rejects(saveConsolidation(root,'r2m1',''));
  } finally { await rm(root, {recursive:true,force:true}); }
});

function github({ conflict=false, unchanged=false, existing=false }={}) {
  const calls=[];
  const request=async (url, options) => {
    const route=url.split('/repos/cipfpbatoi/dwes2627/')[1];
    const body=options.body ? JSON.parse(options.body) : null;
    calls.push({route,method:options.method,body});
    let value;
    if (route==='git/ref/heads/master') value={object:{sha:'head'}};
    else if (route==='git/commits/head') value={tree:{sha:'base'}};
    else if (route.startsWith('contents/')) value={content:Buffer.from('# Índex\n\n- [R1M1](r1m1.md)\n'+(existing?'\n- [R2M1. Consolidació](r2m1.md)\n':'')).toString('base64')};
    else if (route==='git/trees') value={sha:unchanged?'base':'next-tree'};
    else if (route==='git/commits') value={sha:'next-commit'};
    else if (route==='git/refs/heads/master') {
      if (conflict) return {ok:false,status:422};
      value={};
    } else throw Error('Unexpected '+route);
    return {ok:true,json:async()=>value};
  };
  return {request,calls};
}
test('publicació atòmica conserva arbre, índex i commits previs; enllaç HTML i sense grup', async () => {
  const mock=github();
  const result=await publishConsolidation({code:'r2m1',markdown:'# Fitxa',token:'test',request:mock.request});
  const tree=mock.calls.find(c=>c.route==='git/trees').body;
  assert.equal(tree.base_tree,'base');
  assert.equal(tree.tree.length,2);
  assert.equal(tree.tree[0].content,'# Fitxa\n');
  assert.ok(tree.tree[1].content.includes('[R1M1](r1m1.md)'));
  assert.ok(tree.tree[1].content.includes('[R2M1. Consolidació](r2m1.md)'));
  assert.deepEqual(mock.calls.find(c=>c.route==='git/commits').body.parents,['head']);
  assert.deepEqual(mock.calls.at(-1).body,{sha:'next-commit',force:false});
  assert.equal(result.url,'https://cipfpbatoi.github.io/dwes2627/04_materials/consolidacio/r2m1.html');
});
test('actualitzar no duplica índex i publicar sense canvis no crea commit', async () => {
  const mock=github({existing:true,unchanged:true});
  const result=await publishConsolidation({code:'r2m1',markdown:'# Fitxa',token:'test',request:mock.request});
  assert.equal(result.unchanged,true);
  assert.equal(mock.calls.filter(c=>c.route==='git/commits').length,0);
  assert.equal(mock.calls.find(c=>c.route==='git/trees').body.tree[1].content.match(/r2m1.md/g).length,1);
});
test('errors de permisos i concurrència no donen una publicació per bona', async () => {
  await assert.rejects(publishConsolidation({code:'r2m1',markdown:'# Fitxa'}),/GITHUB_TOKEN/);
  const mock=github({conflict:true});
  await assert.rejects(publishConsolidation({code:'r2m1',markdown:'# Fitxa',token:'test',request:mock.request}),/422/);
  assert.equal(mock.calls.at(-1).body.force,false);
});
