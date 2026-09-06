import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Entirely isolated course/database: never touches real grades or calls external APIs.
test('dashboard: només l’últim microrepte valida; proposta → nota global sense alterar RA', { timeout: 20000 }, async t => {
 const fixture=mkdtempSync(path.join(tmpdir(),'dwes-extension-http-'));
 for(const dir of ['teacher-dashboard','scripts','microreptes','global']) cpSync(dir,path.join(fixture,dir),{recursive:true});
 mkdirSync(path.join(fixture,'grades'));mkdirSync(path.join(fixture,'course'));
 symlinkSync(path.resolve('node_modules'),path.join(fixture,'node_modules'),'dir');
 const first='r1-s01-model-client-servidor-stack',last='r1-s02-entorn-executable';
 const grades=[first,last].map(challenge_id=>({repo:'test/alumne',student:'test/alumne',group:'TEST',challenge_id,score:10,ra_scores:[{ra_id:'RA1',score:10}],commit:challenge_id,timestamp:'2026-09-01',source:'openai',confidence:1,provisional:false,teacher_review_required:false}));
 grades[1].repte_extension={proposed_score:1,core_ready:true,reason:'Segona ruta provada',evidence:['src/about.php'],presentation_checks:['Explicar la navegació']};
 writeFileSync(path.join(fixture,'grades/latest-grades.json'),JSON.stringify(grades));
 const child=spawn(process.execPath,['teacher-dashboard/server.mjs'],{cwd:fixture,env:{PATH:process.env.PATH,DASHBOARD_PORT:'0',DASHBOARD_HOST:'127.0.0.1'}});
 t.after(async()=>{child.kill('SIGINT');if(child.exitCode===null) await once(child,'exit');rmSync(fixture,{recursive:true,force:true});});
 let logs='';child.stderr.on('data',data=>{logs+=data;});
 const base=await new Promise((resolve,reject)=>{
  child.stdout.on('data',data=>{logs+=data;const match=logs.match(/Dashboard disponible en (http:\/\/[^\s]+)/);if(match)resolve(match[1]);});
  child.on('exit',()=>reject(new Error(logs)));
 });
 const get=async url=>{const r=await fetch(base+url);assert.equal(r.status,200);return r.json();};
 const earlier=(await get('/api/repte-grades?challenge='+first)).repte_grades[0];
 assert.equal(earlier.can_review_extension,false);
 let record=(await get('/api/repte-grades?challenge='+last)).repte_grades[0];
 assert.equal(record.can_review_extension,true);assert.equal(record.extension.base_score,9);assert.equal(record.extension.final_score,null);
 const body={repo:'test/alumne',repte_id:'r1-kickoff-backend',teacher_score:'',extension_review:{source_challenge_id:first,snapshot:record.extension.snapshot,validated_score:1,core_requirements_met:true,comment:'Demo comprovada'}};
 const post=()=>fetch(base+'/api/repte-grades/teacher',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 assert.notEqual((await post()).status,200);
 body.extension_review.source_challenge_id=last;assert.equal((await post()).status,200);
 record=(await get('/api/repte-grades?challenge='+last)).repte_grades[0];
 assert.equal(record.extension.final_score,10);assert.equal(record.extension.status,'validated');
 assert.equal((await get('/api/ra-grades')).ra_grades[0].score,10);
 const html=await (await fetch(base)).text();
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(()=>new Function(match[1]));
 assert.ok(html.includes('data-extension-score'));
 const choices=await get('/api/microreptes');assert.ok(!choices.microreptes.some(m=>m.id==='r2-ampliacio-9-10'));
});
