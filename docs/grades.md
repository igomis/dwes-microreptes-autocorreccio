# Notes provisionals centralitzades

Este repositori del professor pot agregar manualment resultats d'autograding generats en repositoris d'alumnes. La primera versio usa fitxers locals JSON i CSV, sense base de dades ni sincronitzacio automatica.

## On es genera el resultat

Els repositoris dels alumnes executen el workflow `autograde-from-teacher.yml`. En cada execucio es genera un artifact que conte:

```text
_artifacts/autograde-result.json
```

El fitxer rellevant es `autograde-result.json`. Inclou camps com `challenge_id`, `student`, `commit`, `final_score_over_10`, `provisional`, `teacher_review_required` i `confidence`.

## Notes per repte i RA

S'ha afegit un script per agrupar les notes provisionals de microreptes per repte (`repte_id`) i per RA avaluat.

Per generar els agregats:

```bash
npm run grades:aggregate-repte
```

Si tens una nota docent per cada repte, pots afegir-la amb un fitxer JSON extern:

```bash
npm run grades:aggregate-repte -- --teacher-input examples/teacher-repte-grades.example.json
```

Aquest script genera:

- `grades/latest-repte-grades.json`
- `grades/latest-repte-grades.csv`

En aquests fitxers apareix:

- `ra_id`: RA principal del repte.
- `auto_score`: nota automàtica agregada per RA.
- `repte_id`: identificador del repte.
- `teacher_score`: nota docent global de repte si s'ha proporcionat.

El càlcul automàtic només consolida microreptes dins del mateix RA. No calcula una nota automàtica final del repte fent mitjana entre RA, perquè eixe pes no està definit. La nota global del repte queda reservada a la valoració docent (`teacher_score`).

Un microrepte pot continuar usant el model simple:

```json
{
  "primary_ra": "RA2",
  "assessed_ca": ["RA2.a", "RA2.b"]
}
```

Si ha d'avaluar més d'un RA, pot declarar blocs diferenciats:

```json
{
  "primary_ra": "RA2",
  "assessed_ca": ["RA2.a", "RA2.b"],
  "assessed_ra": [
    {
      "ra_id": "RA2",
      "assessed_ca": ["RA2.a", "RA2.b"],
      "weight": 1
    },
    {
      "ra_id": "RA3",
      "assessed_ca": ["RA3.e", "RA3.f"],
      "weight": 1
    }
  ]
}
```

En eixe cas, l'autocorrecció pot retornar `ra_scores` amb una nota independent per RA. Estes notes no es barregen entre elles: cada una alimenta l'agregat del seu RA dins del repte.

El dashboard mostra estes dades en la secció `Resultats`:

- `Notes orientatives per RA`: una nota automàtica per cada RA avaluat dins del repte.
- `Notes per repte`: resum de les notes RA i nota docent global editable del repte.

Quan guardes una nota docent des del dashboard, es desa en `grades/teacher-repte-grades.json`. També pots preparar o revisar el fitxer manualment amb este format:

```json
[
  {
    "repo": "cipfpbatoi/microreptes-i-igomis",
    "group": "2DAW-A",
    "repte_id": "r4-api-consum",
    "teacher_score": 8.5,
    "teacher_comment": "Valoració global del repte.",
    "teacher_review_required": false,
    "source": "teacher-review"
  }
]
```

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

Els fitxers `latest-grades.json` i `latest-grades.csv` mantenen un únic registre vigent per parella `repo + challenge_id`. Si importes dues vegades la mateixa parella, la segona substitueix la primera.

Per revisar les notes agregades:

```bash
npm run grades:list
```

## Nota provisional i nota validada

Una nota provisional es el resultat calculat per autograding a partir d'una execucio concreta. Pot ajudar a prioritzar revisions i donar feedback inicial, pero pot contindre errors o requerir interpretacio docent.

Una nota validada es la qualificacio revisada i confirmada pel professorat. Les dades de `grades/` no substituixen eixa validacio posterior.
