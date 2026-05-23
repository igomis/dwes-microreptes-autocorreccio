# Scripts

Scripts Node.js per mantindre el repositori central.

- `validate-config.mjs`: valida fitxers globals, `course/active-challenges.json` i coherència bàsica entre `challenge.json` i `rubric.json`.
- `list-challenges.mjs`: mostra els microreptes disponibles amb identificador i títol.
- `resolve-active-challenge.mjs`: resol el microrepte actiu per alumne o grup des de `course/active-challenges.json`.
- `build-evaluation-payload.mjs`: construeix el payload mínim d'avaluació en `tmp/evaluation-payload.json`.
- `mock-autograde.mjs`: genera una resposta simulada compatible amb `global/grading-schema.json` en `tmp/autograde-result.json`.
- `validate-autograde-result.mjs`: valida un resultat d'autograding contra `global/grading-schema.json`.

Execució recomanada:

```bash
npm run validate
npm run list:challenges
npm run resolve:challenge -- --student cipfpbatoi/dwes-ana-marti --group 2DAW-A
node scripts/resolve-active-challenge.mjs --student cipfpbatoi/dwes-pau-garcia --group 2DAW-B
npm run build:payload -- --student cipfpbatoi/dwes-ana-marti --group 2DAW-A --repo cipfpbatoi/dwes-ana-marti --commit abc1234
npm run mock:autograde -- --input tmp/evaluation-payload.json
npm run validate:autograde -- --input tmp/autograde-result.json
node scripts/mock-autograde.mjs --input tmp/evaluation-payload.json
```

El resolver imprimeix només el `challenge_id` quan tot va bé. Si no troba assignació específica d'alumne ni assignació de grup, mostra un error i ix amb codi `1`.

El builder de payload resol el microrepte actiu, carrega polítiques, challenge i rúbrica, imprimeix el JSON formatat i el guarda en `tmp/evaluation-payload.json`.

El mock d'autograding llig el payload, aplica regles simples sense OpenAI, imprimeix el JSON formatat i el guarda en `tmp/autograde-result.json`.

El validador d'autograding llig el resultat generat, comprova els camps obligatoris i els tipus bàsics definits en l'esquema, i ix amb codi `1` si detecta errors.
