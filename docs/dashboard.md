# Dashboard del professor

El dashboard és una interfície local per llançar la correcció massiva sense navegar per GitHub Actions.

## Configuració

Crea un fitxer `.env` en l'arrel del repositori:

```text
GITHUB_TOKEN=
GITHUB_OWNER=igomis
GITHUB_REPO=dwes-microreptes-autocorreccio
GITHUB_REF=main
GITHUB_CLASSROOM_ORG=batoi-dwes-2026
GITHUB_STUDENT_TEMPLATE=igomis/dwes-microreptes-alumnes
GH_BIN=gh
GH_TOKEN=
DASHBOARD_HOST=127.0.0.1
DASHBOARD_PORT=4173
DASHBOARD_AUTH_REQUIRED=false
DASHBOARD_USER=
DASHBOARD_PASSWORD=
DASHBOARD_DOCS_PROFESSORAT_URL=https://igomis.github.io/reestructuracioModul/professorat/
DASHBOARD_DOCS_ALUMNAT_URL=https://cipfpbatoi.github.io/dwes2627/
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
DASHBOARD_DOCS_PROFESSORAT_URL=https://el-teu-domini/professorat/
DASHBOARD_DOCS_ALUMNAT_URL=https://el-teu-domini/alumnat/
```

Quan `DASHBOARD_HOST` no és local, el dashboard exigeix usuari i contrasenya excepte si `DASHBOARD_AUTH_REQUIRED=false` s'ha indicat explícitament. No és recomanable desactivar-ho en un servidor públic.

## Enllaços de documentació

El dashboard pot mostrar enllaços externs configurats des de `.env`:

- `DASHBOARD_DOCS_PROFESSORAT_URL`: apareix dins del panell `Programació d'aula` com a accés a la documentació del professorat.
- `DASHBOARD_DOCS_ALUMNAT_URL`: apareix en el menú principal com a accés ràpid a la documentació de l'alumnat.

Si alguna variable queda buida, el seu enllaç no es mostra.

La pantalla `Alumnes` usa `GITHUB_CLASSROOM_ORG` i `GITHUB_STUDENT_TEMPLATE` com a valors per defecte per crear repositoris d'alumnes des d'un CSV. Es poden modificar des del formulari abans d'executar l'script.

Per crear o eliminar repositoris GitHub des del dashboard, el servidor ha de tindre GitHub CLI instal·lat i autenticat amb un compte amb permisos sobre l'organització:

```bash
which gh
gh auth status
```

Si el dashboard corre com a servei i apareix `spawn gh ENOENT`, indica la ruta absoluta en `.env`, per exemple `GH_BIN=/usr/bin/gh`.

El dashboard usa `GITHUB_TOKEN` per cridar l'API de GitHub quan llança workflows. Per a GitHub CLI, usa l'autenticació guardada amb `gh auth login` o, si defineixes `GH_TOKEN`, eixe token explícit. Això evita que un `GITHUB_TOKEN` amb permisos parcials impedisca crear repositoris des d'una plantilla.

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
- Afegir, editar, filtrar i eliminar alumnes. Si tenen resultats associats, el dashboard mostra un avís i, en confirmar, esborra també eixos resultats. L'esborrat del repositori GitHub és opcional, destructiu i exigeix escriure el nom exacte del repositori.
- Importar alumnes des de `course/student-repositories.txt`.
- Sincronitzar els alumnes mantinguts en la BD cap als fitxers `course/student-repositories*.txt` que usa el workflow massiu.
- Crear repositoris privats d'alumnes des d'un CSV, amb organització, plantilla, prefix, grup per defecte i permisos configurables. La pantalla executa primer una prova sense crear repositoris i permet l'execució real amb confirmació.
- Consultar microreptes per repte, sessió, codi, pes dins del repte, dimensions de rúbrica i criteris que comprova cada dimensió.
- Editar microreptes de forma guiada: títol, resum, objectiu, pes dins del repte, evidències, senyals esperats, regles dures i dimensions de rúbrica.
- Validar abans de guardar que els pesos de la rúbrica sumen `1`; si la validació general falla, es restauren els JSON originals.
- Consultar la programació d'aula real d'un repte agrupada per sessions, amb vista docent renderitzada, edició directa del Markdown font i comentaris docents amb data sobre com ha anat cada sessió.

La font docent principal continua sent `dwes-restructuracio-modul/docs/01_programacio_modul`. La carpeta `docs/programacio_aula` és una còpia sincronitzada dins d'este repositori perquè el dashboard no depenga d'un directori germà local per mostrar la vista `Programació`.
- Obrir ràpidament la pàgina d'Actions del workflow.

El dashboard no substitueix el workflow. Només és una capa més còmoda damunt de GitHub Actions.
