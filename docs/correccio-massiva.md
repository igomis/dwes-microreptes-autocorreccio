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
5. Escriu els repositoris d'alumnes, per exemple:

```text
cipfpbatoi/microreptes-i-igomis
cipfpbatoi/microreptes-ana-marti
cipfpbatoi/microreptes-joan-ferrer
```

6. Indica el grup, per exemple `2DAW-A`.
7. Selecciona `mode = openai` per usar IA.
8. Mantin `publish_to_student_repo = true` si vols que l'alumne veja la correccio en el seu repositori.

El workflow clona cada repositori d'alumne, recull evidencies, construeix el payload, executa el motor d'autograding i publica el resultat.

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

## Prova sense consum

Abans de llançar una correccio real, pots seleccionar:

```text
mode = mock
```

Aixi comproves que tots els repositoris es poden clonar i actualitzar sense gastar tokens.
