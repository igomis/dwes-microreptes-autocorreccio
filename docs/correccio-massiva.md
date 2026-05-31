# Correccio massiva de repositoris d'alumnes

El workflow `Batch autograde student repositories` permet llançar l'autocorreccio en molts repositoris d'alumnes des del repositori del professor.

## Quan usar-lo

- Els `push` dels alumnes continuen executant el mode `mock`, sense consum d'OpenAI.
- Quan vols corregir una tanda amb IA, llances manualment aquest workflow i selecciones `mode = openai`.

## Requisits

Cada repositori d'alumne ha de tindre el workflow `autograde-from-teacher.yml`.

El repositori del professor necessita un token amb permisos per executar workflows en els repositoris dels alumnes. Es recomana crear el secret:

```text
CLASSROOM_AUTOGRADE_TOKEN
```

El token ha de poder fer `workflow_dispatch` en els repositoris d'alumnes. Si no existeix aquest secret, el workflow intentarà usar `TEACHER_REPO_TOKEN` i, finalment, `GITHUB_TOKEN`.

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

El workflow no corregeix directament: dispara una execucio del workflow d'autograding dins de cada repositori d'alumne. El resultat visible per a l'alumne continua estant en `Actions` del seu repositori.

## Prova sense consum

Abans de llançar una correccio real, pots seleccionar:

```text
mode = mock
```

Aixi comproves que tots els repositoris reben el dispatch sense gastar tokens.
