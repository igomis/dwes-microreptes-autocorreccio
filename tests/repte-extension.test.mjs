import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { calculateRepteExtension as calc, makeExtensionReview, normalizeExtensionProposal, validateExtensionOwners, validateProposal, readChallengeMetadata } from '../scripts/lib/repte-extension.mjs';
import { aggregateRepteGrades } from '../scripts/aggregate-repte-grades.mjs';
import { initDb, closeDb, migrateFromJson, getLatestGrades } from '../teacher-dashboard/db.mjs';

const repte = 'r1';
const metadata = new Map([
 ['m1', { challenge_id: 'm1', repte_id: repte, microrepte_code: 'R1M1', primary_ra: 'RA1' }],
 ['m2', { challenge_id: 'm2', repte_id: repte, microrepte_code: 'R1M2', primary_ra: 'RA1', repte_extension: { scope: 'repte' } }]
]);
const proposal = { proposed_score: 1, core_ready: true, reason: 'Demo navegable', evidence: ['src/about.php'], presentation_checks: ['Explica la ruta'] };
const grades = (a = 10, b = 10) => [
 { repo: 'a/b', student: 'a/b', group: 'C', challenge_id: 'm1', score: a, commit: 'abc', timestamp: '2026-09-01', ra_scores: [{ ra_id: 'RA1', score: a }] },
 { repo: 'a/b', student: 'a/b', group: 'C', challenge_id: 'm2', score: b, commit: 'def', timestamp: '2026-09-02', ra_scores: [{ ra_id: 'RA1', score: b }], repte_extension: proposal }
];
function review(gs, score = 1, core = true) {
 const c = calc(gs, metadata, repte);
 return makeExtensionReview({ source_challenge_id: 'm2', snapshot: c.snapshot, validated_score: score, core_requirements_met: core, comment: 'Demo i defensa comprovades.' }, c);
}

test('l’ampliació es manté separada de les notes dels microreptes', () => {
 const gs = grades();
 const pending=calc(gs, metadata, repte);
 assert.equal(pending.proposed_score,1);assert.equal(pending.validated_score,null);assert.equal(pending.status,'pending');
 const validated=calc(gs,metadata,repte,review(gs,.75));
 assert.equal(validated.validated_score,.75);assert.equal(validated.status,'validated');
 assert.equal(validated.final_score,undefined);assert.equal(validated.core_score,undefined);
 assert.equal(gs[0].score,10);assert.equal(gs[1].score,10);
});
test('sense proposta no inventa un zero ni una nota de repte', () => {
 const c = calc(grades().slice(0,1),metadata,repte);
 assert.equal(c.status,'not_proposed');assert.equal(c.proposed_score,null);assert.equal(c.final_score,undefined);
});
test('només l’últim microrepte pot proposar i validar', () => {
 const gs=grades();gs[0].repte_extension=proposal;delete gs[1].repte_extension;
 const c=calc(gs,metadata,repte);assert.equal(c.proposed_score,null);
 assert.throws(()=>makeExtensionReview({source_challenge_id:'m1'},c));
 assert.doesNotThrow(()=>validateExtensionOwners(metadata));
 const invalid=structuredClone(metadata);invalid.get('m1').repte_extension={};
 assert.throws(()=>validateExtensionOwners(invalid));
});
test('una nota de microrepte anterior no altera la validació independent de l’ampliació', () => {
 const gs=grades();const r=review(gs);gs[0].score=9;
 const c=calc(gs,metadata,repte,r);assert.equal(c.status,'validated');assert.equal(c.validated_score,1);
});
test('valida l’escala, l’evidència defensable i el comentari', () => {
 const gs=grades();assert.throws(()=>review(gs,1,false));assert.throws(()=>review(gs,2));assert.throws(()=>review(gs,NaN));
 assert.equal(calc(gs,metadata,repte,review(gs,0,false)).validated_score,0);
 assert.throws(()=>validateProposal({...proposal,proposed_score:.3}));
 assert.doesNotThrow(()=>validateProposal({...proposal,core_ready:false}));
 assert.throws(()=>validateProposal({...proposal,evidence:[]}));
 const c=calc(gs,metadata,repte);assert.throws(()=>makeExtensionReview({...review(gs),comment:''},c));
});
test('la proposta IA no s’aplica i la validació manual queda separada', () => {
 const gs=grades(8,8);delete gs[1].repte_extension;
 assert.equal(calc(gs,metadata,repte).proposed_score,null);
 assert.equal(calc(gs,metadata,repte,review(gs,.5)).validated_score,.5);
});
test('no calcula nota de repte ni altera la nota del microrepte', () => {
 const gs=grades();const r=review(gs);const teacher=new Map([['a/b\u0000r1',{extension_review:r}]]);
 const result=aggregateRepteGrades(gs,metadata,teacher);
 assert.equal(result.repteRecords[0].final_score,undefined);assert.equal(result.repteRecords[0].auto_score,null);
 assert.equal(result.repteRecords[0].extension.validated_score,1);
 assert.equal(gs[1].score,10);
});
test('configuració real: propietari únic en el darrer microrepte de cada repte',async()=>{
 const config=await readChallengeMetadata(process.cwd());validateExtensionOwners(config);
 assert.deepEqual([...config.values()].filter(c=>c.repte_extension).map(c=>c.microrepte_code),['R1M2','R2M9','R3M7','R4M5','R5M5']);
});
test('SQLite conserva proposta i actualitza una recorrecció del mateix commit',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'dwes-extension-db-'));
 try {
  initDb(path.join(dir,'db.sqlite'));migrateFromJson(grades());
  let row=getLatestGrades(-1).find(g=>g.challenge_id==='m2');assert.deepEqual(JSON.parse(row.repte_extension),proposal);
  const gs=grades();gs[1].timestamp='2026-09-03';gs[1].repte_extension={...proposal,proposed_score:.75};
  migrateFromJson(gs);row=getLatestGrades(-1).find(g=>g.challenge_id==='m2');assert.equal(JSON.parse(row.repte_extension).proposed_score,.75);
 } finally {closeDb();rmSync(dir,{recursive:true,force:true});}
});

test('instantània compartida entre JSON/CLI i SQLite/dashboard',()=>{
 const gs=grades();const r=review(gs);
 const dbRows=gs.map(g=>({...g,commit_hash:g.commit,commit:undefined,repte_extension:JSON.stringify(g.repte_extension || null)}));
 assert.equal(calc(dbRows,metadata,repte,r).status,'validated');
});

test('recull fitxers enllaçats de l’ampliació sense exigir-los el codi del microrepte',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'dwes-extension-evidence-'));
 try {
  mkdirSync(path.join(dir,'docs'));mkdirSync(path.join(dir,'src'));
  writeFileSync(path.join(dir,'docs/r1-ampliacio.md'),'# Ampliació\n[Implementació](../src/about.php)');
  writeFileSync(path.join(dir,'src/about.php'),'<?php echo "Com funciona";');
  execFileSync('git',['init','-q'],{cwd:dir});execFileSync('git',['add','.'],{cwd:dir});
  const run=(challenge,code)=>execFileSync(process.execPath,['scripts/collect-repo-evidence.mjs','--repo-dir',dir,'--repo','a/b','--commit','test','--challenge-id',challenge,'--microrepte-code',code,'--repo-signals',path.join(dir,'signals.json'),'--evidence-summary',path.join(dir,'summary.json')]);
  run('r1-s02-entorn-executable','R1M2');
  assert.equal(JSON.parse(readFileSync(path.join(dir,'summary.json'))).repte_extension.referenced_files[0].path,'src/about.php');
  run('r1-s01-model-client-servidor-stack','R1M1');
  assert.equal(JSON.parse(readFileSync(path.join(dir,'summary.json'))).repte_extension,null);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test('proposta incoherent no elimina la nota del nucli ni valida punts',()=>{
 for (const invalid of [{...proposal,evidence:[]}, null, {...proposal,proposed_score:2}]) {
  const result={final_score_over_10:8.1,ra_scores:[{ra_id:'RA1',score:8.1}],repte_extension:invalid,blocking_flags:[]};
  normalizeExtensionProposal(result);
  assert.equal(result.final_score_over_10,8.1);
  assert.deepEqual(result.ra_scores,[{ra_id:'RA1',score:8.1}]);
  assert.equal(result.repte_extension.proposed_score,0);
  assert.equal(result.teacher_review_required,true);
  assert.doesNotThrow(()=>validateProposal(result.repte_extension));
  const gs=grades();gs[1].repte_extension=result.repte_extension;
  assert.equal(calc(gs,metadata,repte).final_score,undefined);
 }
 const valid={repte_extension:structuredClone(proposal)};
 const before=structuredClone(valid);normalizeExtensionProposal(valid);assert.deepEqual(valid,before);
});

test('conserva una candidatura amb evidències encara que el nucli necessite revisió',()=>{
 const candidate={...proposal,proposed_score:.25,core_ready:false,reason:'Millora detectada; falta confirmar el nucli.'};
 assert.doesNotThrow(()=>validateProposal(candidate));
 const result={repte_extension:structuredClone(candidate),blocking_flags:[]};
 normalizeExtensionProposal(result);
 assert.deepEqual(result.repte_extension,candidate);
 assert.equal(result.teacher_review_required,undefined);
});
