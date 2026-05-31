# Scripts

Scripts Node.js per mantindre el repositori central.

- `validate-config.mjs`: valida fitxers globals, `course/active-challenges.json` i coherència bàsica entre `challenge.json` i `rubric.json`.
- `list-challenges.mjs`: mostra els microreptes disponibles amb identificador i títol.
- `resolve-active-challenge.mjs`: resol l'autocorrecció activa per alumne o grup des de `course/active-challenges.json`.
- `build-evaluation-payload.mjs`: construeix el payload mínim d'avaluació en `tmp/evaluation-payload.json`.
- `mock-autograde.mjs`: genera una resposta simulada compatible amb `global/grading-schema.json` en `tmp/autograde-result.json`.
- `openai-autograde.mjs`: genera una resposta real amb OpenAI mantenint el mateix contracte d'entrada i eixida que el mock.
- `validate-autograde-result.mjs`: valida un resultat d'autograding contra `global/grading-schema.json`.
- `append-grade-result.mjs`: afig un `autograde-result.json` a l'agregacio central de notes provisionals en `grades/latest-grades.json` i `grades/latest-grades.csv`.
- `import-autograde-result.mjs`: alias explicit per a imports manuals de resultats descarregats d'artifacts.
- `list-grades.mjs`: mostra les notes provisionals agregades en format llegible.

Execució recomanada:

```bash
npm run validate
npm run list:challenges
npm run resolve:challenge -- --student cipfpbatoi/dwes-ana-marti --group 2DAW-A
node scripts/resolve-active-challenge.mjs --student cipfpbatoi/dwes-pau-garcia --group 2DAW-B
npm run build:payload -- --student cipfpbatoi/dwes-ana-marti --group 2DAW-A --repo cipfpbatoi/dwes-ana-marti --commit abc1234
npm run build:payload -- \
  --student cipfpbatoi/dwes-ana-marti \
  --group 2DAW-A \
  --repo cipfpbatoi/dwes-ana-marti \
  --commit abc1234 \
  --repo-signals ../_artifacts/repo-signals.json \
  --evidence-summary ../_artifacts/evidence-summary.json
npm run mock:autograde -- --input tmp/evaluation-payload.json
OPENAI_API_KEY=... npm run openai:autograde -- --input tmp/evaluation-payload.json
npm run validate:autograde -- --input tmp/autograde-result.json
node scripts/mock-autograde.mjs --input tmp/evaluation-payload.json
node scripts/append-grade-result.mjs \
  --input tmp/autograde-result.json \
  --repo cipfpbatoi/dwes-ana-marti \
  --group 2DAW-A \
  --source mock
node scripts/import-autograde-result.mjs \
  --input ./downloads/autograde-result.json \
  --repo cipfpbatoi/dwes-ana-marti \
  --group 2DAW-A \
  --source openai
node scripts/list-grades.mjs
```

El resolver imprimeix només el `challenge_id` quan tot va bé. Si no troba assignació específica d'alumne ni assignació de grup, mostra un error i ix amb codi `1`.

El builder de payload resol l'autocorrecció activa, carrega polítiques, challenge i rúbrica, imprimeix el JSON formatat i el guarda en `tmp/evaluation-payload.json`.

Opcionalment pot rebre `--repo-signals` i `--evidence-summary`. Estos fitxers els genera el workflow del repositori d'alumne i permeten afegir al payload senyals del repositori i fragments revisables de `README.md`, `docs/`, `evidence/`, `tests/` i `src/`.

El mock d'autograding llig el payload, aplica regles simples sense OpenAI, imprimeix el JSON formatat i el guarda en `tmp/autograde-result.json`.

El motor OpenAI llig el mateix payload, el prompt base del microrepte si està disponible i l'esquema global, demana una resposta JSON estructurada al model i guarda també la resposta crua en `tmp/openai-raw-response.json`.

La diferència pràctica és que `mock-autograde.mjs` és determinista i útil per a CI local sense secrets, mentre que `openai-autograde.mjs` usa `OPENAI_API_KEY` i pot ajustar-se amb `OPENAI_MODEL` per fer una avaluació real abans de la validació.

El validador d'autograding llig el resultat generat, comprova els camps obligatoris i els tipus bàsics definits en l'esquema, i ix amb codi `1` si detecta errors.

Els scripts de notes provisionals treballen amb fitxers locals dins de `grades/`. `append-grade-result.mjs` i `import-autograde-result.mjs` no dedupliquen registres: cada execucio valida els camps minims del resultat i afig una nova fila al JSON i al CSV. `list-grades.mjs` llig `grades/latest-grades.json` i mostra alumne, microrepte, nota, confiança, revisio docent requerida i marca temporal.
