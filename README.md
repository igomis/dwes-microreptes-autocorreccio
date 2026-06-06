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

El mode automàtic en cada `push` continua sent `mock`, sense consum d'OpenAI. Per a una tanda real, executa el workflow massiu amb `mode = openai`. La clau `OPENAI_API_KEY` es configura en este repositori del professor i el resultat es publica en cada repo d'alumne com `autograde/latest.md` i `autograde/latest.json`. També es guarda una còpia central en `grades/history/` i s'actualitzen `grades/latest-grades.json` i `grades/latest-grades.csv`.

Els repositoris que es corregeixen es mantenen en fitxers `course/student-repositories*.txt`, amb format `repositori grup`. El workflow té un input `target_group` per triar `all`, `2DAW-A`, `2DAW-B`, `2DAW-C` o `2DAW-D`; amb això selecciona automàticament el fitxer corresponent. També es pot usar l'input `repositories` per sobreescriure la llista en una execució puntual. El microrepte no s'escriu manualment: es resol des de `course/active-challenges.json`, primer per assignació específica d'alumne i després pel grup indicat en la línia del repositori.

Configuració activa inicial:

| Grup | Autocorrecció |
|---|---|
| `2DAW-A` | `r1-s01-model-client-servidor-stack` |
| `2DAW-B` | `r1-s02-entorn-executable` |
| `2DAW-C` | `r1-s02-entorn-executable` |
| `2DAW-D` | `r1-s02-entorn-executable` |

Vegeu [docs/correccio-massiva.md](docs/correccio-massiva.md).

Per treballar des del terminal amb `gh`, vegeu [docs/terminal.md](docs/terminal.md).

## Dashboard del professor

El dashboard local permet veure els grups, repositoris i autocorreccions, i llançar el workflow massiu sense navegar per GitHub Actions.

```bash
npm run dashboard
```

Vegeu [docs/dashboard.md](docs/dashboard.md).

## Com afegir una nova autocorrecció

1. Crea una carpeta en `microreptes/` amb un identificador estable de sessió, per exemple `r2-s04-sessions`.
2. Afig `challenge.json`, `rubric.json` i `prompt.md`.
3. Documenta en `tests/README.md` quines proves o oracles s'afegiran.
4. Documenta en `expected/README.md` quines eixides, fixtures o contractes mínims es consideren vàlids.
5. Executa `npm run validate`.

## Estat actual

Base inicial del repositori:

- dues autocorreccions de sessió del Repte 1;
- la sessió `R1-S02` agrupa `MP2 + MP3 + MP4` perquè el Repte 1 queda compactat en dues sessions;
- una autocorrecció inicial de `R2-S01` per a entrada de dades i validació bàsica;
- rúbriques inicials;
- polítiques globals;
- resolució centralitzada de l'autocorrecció activa;
- validació de configuració;
- construcció del payload d’avaluació;
- autocorrecció en mode mock;
- validació del resultat del corrector;
- correcció centralitzada amb OpenAI des del repositori del professor;
- publicació del resultat en el repositori de l'alumne com `autograde/latest.md` i `autograde/latest.json`.

## Pròxims passos

- Definir el format definitiu d'evidències dels repositoris d'alumnes.
- Crear el workflow base per als repositoris individuals de GitHub Classroom.
- Afegir tests o oracles reals per autocorrecció de sessió.
- Connectar el payload del professor amb l’anàlisi real del codi i evidències del repo de l’alumne.
- Calibrar rúbriques, flags i llindars de revisió docent.
