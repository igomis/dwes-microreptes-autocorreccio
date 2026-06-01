# Dashboard del professor

El dashboard és una interfície local per llançar la correcció massiva sense navegar per GitHub Actions.

## Configuració

Crea un fitxer `.env` en l'arrel del repositori:

```text
GITHUB_TOKEN=
GITHUB_OWNER=igomis
GITHUB_REPO=dwes-microreptes-autocorreccio
GITHUB_REF=main
DASHBOARD_HOST=127.0.0.1
DASHBOARD_PORT=4173
```

El `GITHUB_TOKEN` ha de poder executar workflows en `igomis/dwes-microreptes-autocorreccio`. Si vols publicar resultats en els repositoris d'alumnes, el workflow de GitHub també necessita el secret `CLASSROOM_AUTOGRADE_TOKEN` configurat en el repositori del professor.

## Execució

```bash
npm run dashboard
```

Obri:

```text
http://localhost:4173
```

## Què permet fer

- Triar `all`, `2DAW-A`, `2DAW-B`, `2DAW-C` o `2DAW-D`.
- Veure els repositoris del fitxer associat.
- Veure quin microrepte correspon a cada repositori.
- Llançar el workflow massiu en mode `mock` o `openai`.
- Consultar els últims resultats guardats en `grades/latest-grades.json`.
- Obrir ràpidament la pàgina d'Actions del workflow.

El dashboard no substitueix el workflow. Només és una capa més còmoda damunt de GitHub Actions.
