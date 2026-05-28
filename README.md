# DWES Microreptes Autocorreccio

Nom proposat del repositori: `dwes-microreptes-autocorreccio`.

## Finalitat

Este repositori és la font de veritat del professorat per a definir microreptes de DWES, rúbriques, polítiques globals i la infraestructura base d'autocorrecció assistida per IA.

No conté el codi dels alumnes ni substituïx els seus repositoris individuals. L'objectiu és disposar d'una estructura coherent, versionada i executable sobre GitHub, des de la qual es puga governar la correcció automatitzada dels microreptes.

## Estructura

- `global/`: polítiques comunes, estil de feedback i esquema de resposta del corrector.
- `course/`: configuració docent centralitzada del microrepte actiu per grup o alumne.
- `microreptes/`: definició de cada microrepte, rúbrica, prompt base, tests futurs i evidències esperades.
- `scripts/`: utilitats Node.js per validar configuració, resoldre el microrepte actiu, construir el payload d’avaluació i executar autocorrecció en mode mock o OpenAI.
- `docs/`: arquitectura, flux de treball i decisions docents i tècniques.
- `.github/`: workflows i plantilles per a treballar amb GitHub.
- `examples/`: exemples de mapatge d'alumnat, assignació de microreptes i resultats d’avaluació.

## Flux previst

1. El professorat defineix o actualitza un microrepte en este repositori.
2. El professorat configura el microrepte actiu en `course/active-challenges.json`.
3. Cada alumne treballa al seu repositori individual.
4. El repositori de l'alumne executa un workflow de correcció.
5. El workflow consulta la configuració centralitzada del microrepte.
6. Es construeix un payload d’avaluació amb les evidències disponibles.
7. Es genera feedback provisional i una nota inicial.
8. El professorat revisa els casos marcats amb baixa confiança o flags.

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

- quatre microreptes del Repte 1;
- rúbriques inicials;
- polítiques globals;
- resolució centralitzada de microrepte actiu;
- validació de configuració;
- construcció del payload d’avaluació;
- autocorrecció en mode mock;
- validació del resultat del corrector;
- connector inicial amb OpenAI implementat, pendent de configuració amb credencials i de proves reals controlades.

## Pròxims passos

- Definir el format definitiu d'evidències dels repositoris d'alumnes.
- Crear el workflow base per als repositoris individuals de GitHub Classroom.
- Afegir tests o oracles reals per microrepte.
- Connectar el payload del professor amb l’anàlisi real del codi i evidències del repo de l’alumne.
- Calibrar rúbriques, flags i llindars de revisió docent.

# TOKEN

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