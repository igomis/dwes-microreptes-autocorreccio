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

El dashboard està separat en aquestes vistes:

- `Correcció`: llançament de workflows i repositoris seleccionats.
- `Resultats`: últimes notes i visor del resultat complet.
- `Alumnes`: manteniment de nom, repositori i grup.
- `Microreptes`: taula de microreptes, visor de `challenge.json`, `rubric.json`, `prompt.md` i validació de pesos.
- `Programació`: generació d'una programació d'aula per repte a partir dels camps de `challenge.json` i `rubric.json`.

- Triar `all`, `2DAW-A`, `2DAW-B`, `2DAW-C` o `2DAW-D`.
- Veure els repositoris del fitxer associat.
- Veure quin microrepte correspon a cada repositori.
- Llançar el workflow massiu en mode `mock` o `openai`.
- Consultar els últims resultats guardats en `grades/latest-grades.json`.
- Obrir un visor del resultat amb nota, confiança, revisió docent, dimensions, punts forts, millores i feedback complet.
- Afegir, editar, filtrar i eliminar alumnes sense resultats associats.
- Importar alumnes des de `course/student-repositories.txt`.
- Sincronitzar els alumnes mantinguts en la BD cap als fitxers `course/student-repositories*.txt` que usa el workflow massiu.
- Consultar microreptes per repte, sessió, codi, pes dins del repte, dimensions de rúbrica i criteris que comprova cada dimensió.
- Editar microreptes de forma guiada: títol, resum, objectiu, pes dins del repte, evidències, senyals esperats, regles dures i dimensions de rúbrica.
- Validar abans de guardar que els pesos de la rúbrica sumen `1`; si la validació general falla, es restauren els JSON originals.
- Generar la programació d'aula d'un repte amb seqüència de sessions, finalitat, objectiu pedagògic, evidències, criteris, regles dures, verificació recomanada i Markdown reutilitzable.
- Obrir ràpidament la pàgina d'Actions del workflow.

El dashboard no substitueix el workflow. Només és una capa més còmoda damunt de GitHub Actions.
