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
DASHBOARD_AUTH_REQUIRED=false
DASHBOARD_USER=
DASHBOARD_PASSWORD=
```

El `GITHUB_TOKEN` ha de poder executar workflows en `igomis/dwes-microreptes-autocorreccio`. Si vols publicar resultats en els repositoris d'alumnes, el workflow de GitHub també necessita el secret `CLASSROOM_AUTOGRADE_TOKEN` configurat en el repositori del professor.

## Autenticació mínima

En local, l'autenticació està desactivada per defecte si el dashboard escolta només en `127.0.0.1`, `localhost` o `::1`.

Si el dashboard es publica darrere d'un domini, activa com a mínim Basic Auth i fes-lo servir sempre amb HTTPS:

```text
DASHBOARD_HOST=0.0.0.0
DASHBOARD_AUTH_REQUIRED=true
DASHBOARD_USER=professor
DASHBOARD_PASSWORD=canvia-aquesta-contrasenya
```

Quan `DASHBOARD_HOST` no és local, el dashboard exigeix usuari i contrasenya excepte si `DASHBOARD_AUTH_REQUIRED=false` s'ha indicat explícitament. No és recomanable desactivar-ho en un servidor públic.

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

- `Correcció`: previsualització del que es corregirà, llançament de workflows i repositoris seleccionats.
- `Resultats`: últimes notes i visor del resultat complet.
- `Alumnes`: manteniment de nom, repositori i grup.
- `Microreptes`: taula de microreptes, visor de `challenge.json`, `rubric.json`, `prompt.md` i validació de pesos.
- `Programació`: consulta i edició de la programació d'aula per sessions llegida des de la còpia versionada `docs/programacio_aula`.

- Triar `all`, `2DAW-A`, `2DAW-B`, `2DAW-C` o `2DAW-D`.
- Triar un **Alumne concret** per llançar una correcció individual sense editar fitxers ni escriure repositoris a mà.
- Veure els repositoris del fitxer associat o els repositoris puntuals escrits manualment.
- Triar un **Microrepte a corregir** per a una execució puntual, o deixar `Configuració activa` per usar `course/active-challenges.json`.
- Veure abans de llançar la correcció: branca, microrepte resolt, RA avaluat i origen de l'assignació.
- Aplicar el criteri ordinari de branca corregible `main`; les branques alternatives només s'usen en recuperacions o incidències pactades.
- Llançar el workflow massiu en mode `mock` o `openai`.
- Consultar els últims resultats guardats en `grades/latest-grades.json`.
- Obrir un visor del resultat amb nota, confiança, revisió docent, dimensions, punts forts, millores i feedback complet.
- Afegir, editar, filtrar i eliminar alumnes sense resultats associats.
- Importar alumnes des de `course/student-repositories.txt`.
- Sincronitzar els alumnes mantinguts en la BD cap als fitxers `course/student-repositories*.txt` que usa el workflow massiu.
- Consultar microreptes per repte, sessió, codi, pes dins del repte, dimensions de rúbrica i criteris que comprova cada dimensió.
- Editar microreptes de forma guiada: títol, resum, objectiu, pes dins del repte, evidències, senyals esperats, regles dures i dimensions de rúbrica.
- Validar abans de guardar que els pesos de la rúbrica sumen `1`; si la validació general falla, es restauren els JSON originals.
- Consultar la programació d'aula real d'un repte agrupada per sessions, amb vista docent renderitzada, edició directa del Markdown font i comentaris docents amb data sobre com ha anat cada sessió.

La font docent principal continua sent `dwes-restructuracio-modul/docs/01_programacio_modul`. La carpeta `docs/programacio_aula` és una còpia sincronitzada dins d'este repositori perquè el dashboard no depenga d'un directori germà local per mostrar la vista `Programació`.
- Obrir ràpidament la pàgina d'Actions del workflow.

El dashboard no substitueix el workflow. Només és una capa més còmoda damunt de GitHub Actions.
