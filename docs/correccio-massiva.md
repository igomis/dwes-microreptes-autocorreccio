# Correccio massiva de repositoris d'alumnes

El workflow `Batch autograde student repositories` llança correccions per a molts repositoris d'alumnes des del repositori del professor.

La correccio real amb OpenAI s'executa en `igomis/dwes-microreptes-autocorreccio`. Per tant, la clau `OPENAI_API_KEY` ha d'estar configurada en el repositori del professor, no en els repositoris de l'alumnat.

## Quan usar-lo

- Els `push` dels alumnes continuen executant el mode `mock`, sense consum d'OpenAI.
- Quan vols corregir una tanda amb IA, llances manualment aquest workflow i selecciones `mode = openai`.
- El resultat OpenAI es publica en cada repositori d'alumne com `autograde/latest.md` i `autograde/latest.json`.

## Requisits

En el repositori del professor cal configurar:

```text
OPENAI_API_KEY
```

També cal un token amb permís de lectura i escriptura sobre els repositoris dels alumnes. Es recomana crear el secret:

```text
CLASSROOM_AUTOGRADE_TOKEN
```

El token ha de poder clonar i fer `push` als repositoris d'alumnes. Si no existeix aquest secret, el workflow intentarà usar `TEACHER_REPO_TOKEN` i, finalment, `GITHUB_TOKEN`, però `GITHUB_TOKEN` normalment no tindrà permisos sobre repositoris d'una altra organització.

## Execucio

1. Entra en el repositori del professor.
2. Ves a `Actions`.
3. Obri `Batch autograde student repositories`.
4. Prem `Run workflow`.
5. Tria `target_group`: `all`, `2DAW-A`, `2DAW-B`, `2DAW-C` o `2DAW-D`.
6. Deixa buit `repositories` per usar la llista del grup seleccionat, o escriu repositoris per a una tanda puntual:

```text
cipfpbatoi/microreptes-i-igomis
cipfpbatoi/microreptes-ana-marti
cipfpbatoi/microreptes-joan-ferrer
```

7. Indica el grup per defecte, per exemple `2DAW-A`. Només s'usa si una línia no porta grup.
8. Selecciona `mode = openai` per usar IA.
9. Mantin `publish_to_student_repo = true` si vols que l'alumne veja la correccio en el seu repositori.

El workflow clona cada repositori d'alumne, recull evidencies, construeix el payload, executa el motor d'autograding i publica el resultat.

Cada execucio massiva també guarda una còpia central en el repositori del professor:

```text
grades/history/<batch-id>/
grades/latest-grades.json
grades/latest-grades.csv
```

## Fitxer de repositoris

La llista general de repositoris està en:

```text
course/student-repositories.txt
```

També hi ha fitxers per grup:

```text
course/student-repositories-2dawa.txt
course/student-repositories-2dawb.txt
course/student-repositories-2dawc.txt
course/student-repositories-2dawd.txt
```

Per corregir només un grup, usa l'input `target_group`. El workflow selecciona automàticament:

```text
target_group = 2DAW-A -> course/student-repositories-2dawa.txt
target_group = 2DAW-B -> course/student-repositories-2dawb.txt
target_group = 2DAW-C -> course/student-repositories-2dawc.txt
target_group = 2DAW-D -> course/student-repositories-2dawd.txt
target_group = all    -> course/student-repositories.txt
```

L'input `repositories_file` queda com a opció avançada per usar un fitxer especial.

Format:

```text
# comentaris permesos
cipfpbatoi/microreptes-i-igomis 2DAW-A
cipfpbatoi/microreptes-ana-marti 2DAW-B
```

Les linies buides i els comentaris amb `#` s'ignoren. Si una línia no porta grup, s'usa el grup per defecte indicat en el workflow. Si l'input `repositories` del workflow està buit, s'usa aquest fitxer.

## Quin microrepte corregeix

El workflow no demana el microrepte directament. Es resol amb `course/active-challenges.json`:

1. Si el repositori de l'alumne té una assignació específica en `students`, s'usa eixa.
2. Si no, s'usa l'assignació del grup indicat en la línia del repositori.
3. Si la línia no té grup, s'usa el grup per defecte indicat en el workflow.

Configuració activa inicial:

| Grup | Autocorrecció |
|---|---|
| `2DAW-A` | `r1-s01-model-client-servidor-stack` |
| `2DAW-B` | `r1-s02-entorn-executable` |
| `2DAW-C` | `r1-s03-punt-entrada-documentacio-checkpoint` |
| `2DAW-D` | `r1-s03-punt-entrada-documentacio-checkpoint` |

Per canviar el microrepte actiu d'un grup o d'un alumne concret, modifica `course/active-challenges.json` i fes commit.

## Que veu l'alumne

Despres de la correccio massiva, cada repositori d'alumne rep un commit amb:

```text
autograde/latest.md
autograde/latest.json
```

El fitxer `autograde/latest.md` es el resum llegible:

- nota provisional;
- feedback;
- puntuacio per dimensions;
- punts forts;
- millores recomanades;
- avisos de revisio docent.

## Consulta posterior

El professor pot consultar l'historial central en:

```text
grades/history/
```

I la llista agregada en:

```text
grades/latest-grades.json
grades/latest-grades.csv
```

Els fitxers `latest-grades.*` acumulen registres provisionals. Si una mateixa entrega es corregeix més d'una vegada, apareixeran diverses files amb timestamps diferents.

El dashboard local també mostra els últims resultats llegint `grades/latest-grades.json`.

## Prova sense consum

Abans de llançar una correccio real, pots seleccionar:

```text
mode = mock
```

Aixi comproves que tots els repositoris es poden clonar i actualitzar sense gastar tokens.
