# DWES Microreptes Autocorreccio

Nom proposat del repositori: `dwes-microreptes-autocorreccio`.

## Finalitat

Este repositori és la font de veritat del professorat per a definir autocorreccions de sessió, microreptes de DWES, rúbriques, polítiques globals i la infraestructura base d'autocorrecció assistida per IA.

No conté el codi dels alumnes ni substituïx els seus repositoris individuals. L'objectiu és disposar d'una estructura coherent, versionada i executable sobre GitHub, des de la qual es puga governar la correcció automatitzada dels microreptes.

## Estructura

- `global/`: polítiques comunes, estil de feedback i esquema de resposta del corrector.
- `course/`: configuració docent centralitzada de l'autocorrecció activa per grup o alumne.
- `microreptes/`: definició de cada autocorrecció de sessió, rúbrica, prompt base, tests futurs i evidències esperades.
- `scripts/`: utilitats Node.js per validar configuració, resoldre l'autocorrecció activa, construir el payload d’avaluació i executar autocorrecció en mode mock o OpenAI.
- `docs/`: arquitectura, flux de treball i decisions docents i tècniques.
- `.github/`: workflows i plantilles per a treballar amb GitHub.
- `examples/`: exemples de mapatge d'alumnat, assignació de microreptes i resultats d’avaluació.

## Flux previst

1. El professorat defineix o actualitza un microrepte en este repositori.
2. El professorat configura l'autocorrecció activa en `course/active-challenges.json`.
3. Cada alumne treballa al seu repositori individual.
4. El repositori de l'alumne executa un workflow de correcció.
5. El workflow consulta la configuració centralitzada del microrepte.
6. Es construeix un payload d’avaluació amb les evidències disponibles.
7. Es genera feedback provisional i una nota inicial.
8. El professorat revisa els casos marcats amb baixa confiança o flags.

## Autocorrecció activa centralitzada

L'autocorrecció activa es resol des d'este repositori del professor. Primer es comprova si l'alumne té una assignació específica; si no, s'aplica l'assignació del grup.

Això permet canviar el repte actiu de forma centralitzada, sense commits als repositoris individuals de l'alumnat.

## Correcció massiva

El workflow `Batch autograde student repositories` permet llançar autocorreccions en molts repositoris d'alumnes des d'una única execució manual.

El mode automàtic en cada `push` continua sent `mock`, sense consum d'OpenAI. Per a una tanda real, executa el workflow massiu amb `mode = openai`. La clau `OPENAI_API_KEY` es configura en este repositori del professor i el resultat es publica en cada repo d'alumne com `autograde/latest.md` i `autograde/latest.json`.

Vegeu [docs/correccio-massiva.md](docs/correccio-massiva.md).

## Com afegir una nova autocorrecció

1. Crea una carpeta en `microreptes/` amb un identificador estable de sessió, per exemple `r2-s04-sessions`.
2. Afig `challenge.json`, `rubric.json` i `prompt.md`.
3. Documenta en `tests/README.md` quines proves o oracles s'afegiran.
4. Documenta en `expected/README.md` quines eixides, fixtures o contractes mínims es consideren vàlids.
5. Executa `npm run validate`.

## Estat actual

Base inicial del repositori:

- tres autocorreccions de sessió del Repte 1;
- la sessió `R1-S03` agrupa `MP3 + MP4` perquè el checkpoint i la documentació tanquen el punt d'entrada funcional;
- rúbriques inicials;
- polítiques globals;
- resolució centralitzada de l'autocorrecció activa;
- validació de configuració;
- construcció del payload d’avaluació;
- autocorrecció en mode mock;
- validació del resultat del corrector;
- connector inicial amb OpenAI implementat, pendent de configuració amb credencials i de proves reals controlades.

## Pròxims passos

- Definir el format definitiu d'evidències dels repositoris d'alumnes.
- Crear el workflow base per als repositoris individuals de GitHub Classroom.
- Afegir tests o oracles reals per autocorrecció de sessió.
- Connectar el payload del professor amb l’anàlisi real del codi i evidències del repo de l’alumne.
- Calibrar rúbriques, flags i llindars de revisió docent.
