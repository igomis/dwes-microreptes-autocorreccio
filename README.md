# DWES Microreptes Autocorreccio

Nom proposat del repositori: `dwes-microreptes-autocorreccio`.

## Finalitat

Este repositori és la font de veritat del professorat per a definir microreptes de DWES, rúbriques, polítiques globals i una base inicial d'autocorrecció assistida per IA.

No conté encara un sistema complet de correcció automàtica. L'objectiu inicial és tindre una estructura coherent, versionada i executable sobre GitHub.

## Estructura

- `global/`: polítiques comunes, estil de feedback i esquema de resposta del corrector.
- `course/`: configuració docent centralitzada del microrepte actiu per grup o alumne.
- `microreptes/`: definició de cada microrepte, rúbrica, prompt base, tests futurs i evidències esperades.
- `scripts/`: utilitats Node.js per validar configuració i llistar microreptes.
- `docs/`: arquitectura, flux de treball i decisions docents/tècniques.
- `.github/`: workflows i plantilles per a treballar amb GitHub.
- `examples/`: exemples de mapatge d'alumnat i assignació de microreptes.

## Flux previst

1. El professorat defineix o actualitza un microrepte en este repositori.
2. El professorat configura el microrepte actiu en `course/active-challenges.json`.
3. Cada alumne treballa al seu repositori individual.
4. El repositori de l'alumne executa un workflow de correcció.
5. El workflow consulta la configuració centralitzada del microrepte.
6. Es genera feedback provisional i una nota inicial.
7. El professorat revisa els casos marcats amb baixa confiança o flags.

## Microrepte actiu centralitzat

El microrepte actiu es resol des d'este repositori del professor. Primer es comprova si l'alumne té una assignació específica; si no, s'aplica l'assignació del grup.

Això permet canviar el repte actiu de forma centralitzada, sense commits als repositoris individuals de l'alumnat.

## Com afegir un nou microrepte

1. Crea una carpeta en `microreptes/` amb un identificador estable, per exemple `mr04-sessions`.
2. Afig `challenge.json`, `rubric.json` i `prompt.md`.
3. Documenta en `tests/README.md` quines proves o oracles s'afegiran.
4. Documenta en `expected/README.md` quines eixides, fixtures o contractes mínims es consideren vàlids.
5. Executa `npm run validate`.

## Estat actual

Base inicial del repositori:

- tres microreptes d'exemple;
- rúbriques inicials;
- polítiques globals;
- resolució centralitzada de microrepte actiu;
- validació de configuració;
- workflows de GitHub Actions en mode preparatori;
- sense crides reals a OpenAI.

## Pròxims passos

- Definir el format definitiu d'evidències dels repositoris d'alumnes.
- Afegir tests o oracles reals per microrepte.
- Implementar un corrector dry-run més complet.
- Integrar un connector amb OpenAI només quan el contracte de dades estiga estabilitzat.
