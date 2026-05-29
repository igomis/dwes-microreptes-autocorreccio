# Notes provisionals centralitzades

Este repositori del professor pot agregar manualment resultats d'autograding generats en repositoris d'alumnes. La primera versio usa fitxers locals JSON i CSV, sense base de dades ni sincronitzacio automatica.

## On es genera el resultat

Els repositoris dels alumnes executen el workflow `autograde-from-teacher.yml`. En cada execucio es genera un artifact que conte:

```text
_artifacts/autograde-result.json
```

El fitxer rellevant es `autograde-result.json`. Inclou camps com `challenge_id`, `student`, `commit`, `final_score_over_10`, `provisional`, `teacher_review_required` i `confidence`.

## Com obtindre l'artifact en GitHub Actions

En GitHub:

1. Obri el repositori de l'alumne.
2. Entra en la pestanya `Actions`.
3. Selecciona una execucio del workflow `autograde-from-teacher.yml`.
4. Descarrega l'artifact generat per eixa execucio.
5. Descomprimeix-lo i localitza `_artifacts/autograde-result.json`.

Esta versio no descarrega artifacts automaticament des de la GitHub API.

## Import manual al repositori del professor

Guarda el fitxer descarregat en una ruta temporal, per exemple `downloads/autograde-result.json`, i executa:

```bash
npm run grades:import -- \
  --input ./downloads/autograde-result.json \
  --repo cipfpbatoi/dwes-ana-marti \
  --group 2DAW-A \
  --source manual-import
```

També es pot usar el script base:

```bash
npm run grades:append -- \
  --input tmp/autograde-result.json \
  --repo cipfpbatoi/dwes-ana-marti \
  --group 2DAW-A \
  --source mock
```

Els registres s'afigen a:

- `grades/latest-grades.json`
- `grades/latest-grades.csv`

No hi ha deduplicacio encara. Si importes dues vegades el mateix `autograde-result.json`, apareixeran dos registres.

Per revisar les notes agregades:

```bash
npm run grades:list
```

## Nota provisional i nota validada

Una nota provisional es el resultat calculat per autograding a partir d'una execucio concreta. Pot ajudar a prioritzar revisions i donar feedback inicial, pero pot contindre errors o requerir interpretacio docent.

Una nota validada es la qualificacio revisada i confirmada pel professorat. Les dades de `grades/` no substituixen eixa validacio posterior.
