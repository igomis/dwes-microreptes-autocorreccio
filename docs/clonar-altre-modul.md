# Clonar l’experiment per a un altre mòdul

Esta guia crea una instància independent del sistema d’autocorrecció per a un altre mòdul. El resultat és un repositori docent nou, amb els seus grups, microreptes, repositoris d’alumnat, secrets i dashboard, sense alterar DWES.

La correcció massiva centralitzada és l’opció recomanada: els secrets i la lògica d’autocorrecció es queden al repositori docent i no cal instal·lar workflows ni secrets en cada repositori d’alumne.

## Abans de començar

Cal disposar de:

- Node.js 20 o posterior i `npm`;
- Git i GitHub CLI (`gh`) autenticat;
- permisos per crear repositoris en l’organització docent;
- una plantilla d’alumnat del mòdul;
- una clau d’OpenAI, només si s’executaran correccions reals amb `mode = openai`.

Decidix estos valors abans de copiar res:

| Valor | Exemple |
|---|---|
| Identificador curt del mòdul | `diw` |
| Repositori docent nou | `la-meua-org/diw-microreptes-autocorreccio` |
| Organització dels repositoris d’alumnat | `batoi-diw-2026` |
| Plantilla d’alumnat | `la-meua-org/diw-microreptes-alumnes` |
| Grups | `2DAW-A`, `2DAW-B` |
| Prefix dels repositoris | `microreptes-` |

No copies `.env`, `grades/`, `tmp/` ni `grades/dashboard.db` d’una instal·lació en ús. Contenen configuració local o dades d’avaluació i no formen part de la plantilla versionada.

## 1. Crear el repositori docent nou

El repositori actual no està marcat com a GitHub Template. La còpia més segura és clonar-lo, conservar-lo com a remot de referència i publicar un repositori nou:

```bash
git clone https://github.com/igomis/dwes-microreptes-autocorreccio.git diw-microreptes-autocorreccio
cd diw-microreptes-autocorreccio
git remote rename origin motor
gh repo create la-meua-org/diw-microreptes-autocorreccio \
  --private \
  --source=. \
  --remote=origin \
  --push
git switch -c feature/configura-diw
```

Des d’eixe moment:

- `origin` és el repositori del mòdul nou;
- `motor` és la font original, útil per consultar millores futures;
- la configuració del mòdul nou es prepara en una branca abans d’arribar a `main`.

Si el repositori original es marca com a template en el futur, també es podrà usar `gh repo create --template`, però no s’ha de donar per fet.

## 2. Preparar la plantilla d’alumnat

Cada mòdul ha de tindre una plantilla d’alumnat coherent amb els seus enunciats i evidències. La plantilla base actual sí que és una GitHub Template i es pot duplicar així:

```bash
gh repo create la-meua-org/diw-microreptes-alumnes \
  --private \
  --template igomis/dwes_microreptes_alumnes
gh repo edit la-meua-org/diw-microreptes-alumnes --template
gh repo clone la-meua-org/diw-microreptes-alumnes
```

En la plantilla nova cal revisar, com a mínim:

- `README.md`, `ENTREGA.md` i la documentació de treball;
- l’estructura inicial del projecte i els fitxers d’evidències;
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` i les còpies equivalents de `src/`, si s’utilitzen;
- qualsevol exemple o referència específica de DWES.

No cal copiar cap secret a la plantilla ni als repositoris d’alumnes. Tampoc cal instal·lar-hi el workflow d’autocorrecció si s’usa la correcció massiva des del repositori docent.

## 3. Configurar `course/module.json`

Este és el fitxer central. Partix del que ja existix i substituïx totes les dades de DWES.

Revisa obligatòriament:

- `module.id`, `module.name` i `module.short_name`;
- `github.teacher_repository` i `github.default_ref`;
- `github.classroom_organization`;
- `github.student_template` i `github.student_template_local_dir`;
- `github.student_repository_prefix`;
- `groups` i el fitxer de repositoris de cada grup;
- `codes`, si el mòdul usa altres patrons per als microreptes o RA;
- `assessment`, especialment dimensions, pesos, llindars i topalls;
- `documentation`;
- `consolidation`.

Exemple de la part que més habitualment canvia:

```json
{
  "module": {
    "id": "diw",
    "name": "Disseny d’interfícies web",
    "short_name": "DIW",
    "language": "ca-ES-valencia"
  },
  "github": {
    "teacher_repository": "la-meua-org/diw-microreptes-autocorreccio",
    "default_ref": "main",
    "classroom_organization": "batoi-diw-2026",
    "student_template": "la-meua-org/diw-microreptes-alumnes",
    "student_template_local_dir": "../diw-microreptes-alumnes",
    "student_repository_prefix": "microreptes-"
  },
  "groups": {
    "2DAW-A": {
      "repositories_file": "course/student-repositories-2dawa.txt",
      "grades_url_env": "DASHBOARD_GRADES_2DAW_A_URL"
    },
    "2DAW-B": {
      "repositories_file": "course/student-repositories-2dawb.txt",
      "grades_url_env": "DASHBOARD_GRADES_2DAW_B_URL"
    }
  },
  "repositories_file": "course/student-repositories.txt"
}
```

El fragment és orientatiu, no substituïx el JSON complet: s’han de conservar i adaptar la resta de blocs obligatoris del fitxer original.

Si el mòdul no publica fitxes de consolidació, desactiva la integració:

```json
{
  "consolidation": {
    "enabled": false
  }
}
```

## 4. Netejar grups i dades de curs

Elimina les assignacions i llistes de DWES. Crea un fitxer buit per a cada ruta declarada en `course/module.json`, a més del fitxer general. Els fitxers han d’existir encara que encara no hi haja alumnat.

Configura `course/active-challenges.json` només amb els grups nous i amb un microrepte que existisca:

```json
{
  "groups": {
    "2DAW-A": {
      "challenge_id": "r1-s01-primer-microrepte"
    },
    "2DAW-B": {
      "challenge_id": "r1-s01-primer-microrepte"
    }
  },
  "students": {}
}
```

Les excepcions individuals es poden afegir després en `students`. No copies repositoris, noms ni excepcions de l’alumnat de DWES.

## 5. Substituir el context i els microreptes

Reescriu `global/module-autograding.md` amb:

- abast i tecnologia del mòdul;
- criteris que el corrector pot i no pot exigir;
- terminologia docent;
- tractament de les evidències i de l’ús d’IA.

Deixa en `microreptes/` únicament les activitats del mòdul nou. Cada carpeta necessita:

```text
microreptes/r1-s01-primer-microrepte/
├── challenge.json
├── rubric.json
├── prompt.md
├── expected/
│   └── README.md
└── tests/
    └── README.md
```

Comprova especialment que:

- el nom de la carpeta i `challenge_id` coincidixen;
- `rubric.json` usa el mateix `challenge_id`;
- `microrepte_code`, `primary_ra` i `assessed_ca` complixen els patrons de `course/module.json`;
- les dimensions obligatòries de la rúbrica existixen i els pesos sumen `1`;
- les evidències demanades també apareixen en la documentació de l’alumnat;
- les ampliacions no es convertixen accidentalment en requisits mínims.

No deixes temporalment els microreptes de DWES en el repositori nou: podrien validar correctament però continuarien sent activitats del mòdul equivocat.

## 6. Configurar secrets i variables de GitHub

En el repositori docent nou, configura:

```bash
gh secret set OPENAI_API_KEY \
  --repo la-meua-org/diw-microreptes-autocorreccio
gh secret set CLASSROOM_AUTOGRADE_TOKEN \
  --repo la-meua-org/diw-microreptes-autocorreccio
gh variable set OPENAI_MODEL \
  --repo la-meua-org/diw-microreptes-autocorreccio \
  --body gpt-4o-mini
```

Els dos secrets es demanen de manera interactiva i no han d’escriure’s en fitxers ni en la línia d’ordres. `OPENAI_API_KEY` només és imprescindible per a `mode = openai`. `CLASSROOM_AUTOGRADE_TOKEN` ha de poder llegir els repositoris privats de l’alumnat i escriure-hi si es publiquen els resultats.

El `GITHUB_TOKEN` automàtic d’Actions normalment no pot escriure en repositoris d’una altra organització. Per això es recomana el secret específic anterior.

### Opció no recomanada: autocorrecció en cada `push`

Si es decidix copiar `autograde-from-teacher.yml` a cada repositori d’alumne, cal configurar `TEACHER_REPOSITORY`, `TEACHER_REPO_REF` i el grup de l’alumne. El workflow inclou un valor de reserva de DWES per retrocompatibilitat; en un altre mòdul no s’ha de confiar en eixe valor.

Esta configuració no és necessària amb el workflow central `Batch autograde student repositories`.

## 7. Configurar el dashboard local o del servidor

Crea la configuració local sense reutilitzar el `.env` de DWES:

```bash
cp .env.example .env
```

Revisa com a mínim:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GITHUB_TOKEN=
GH_TOKEN=
DASHBOARD_HOST=127.0.0.1
DASHBOARD_PORT=4173
DASHBOARD_AUTH_REQUIRED=false
DASHBOARD_USER=
DASHBOARD_PASSWORD=
DASHBOARD_DOCS_PROFESSORAT_URL=
DASHBOARD_DOCS_ALUMNAT_URL=
DASHBOARD_GRADES_2DAW_A_URL=
DASHBOARD_GRADES_2DAW_B_URL=
```

- `GITHUB_TOKEN` permet al dashboard llançar i seguir workflows del repositori docent.
- `GH_TOKEN` s’usa per crear, convidar o administrar repositoris d’alumnat amb GitHub CLI.
- Els noms `DASHBOARD_GRADES_*` han de coincidir amb `grades_url_env` de cada grup.
- Si `DASHBOARD_HOST` no és local, activa autenticació i definix usuari i contrasenya.

El fitxer `.env` està ignorat per Git i no s’ha de commitejar.

## 8. Validar abans de publicar

Executa:

```bash
npm ci
npm run validate
npm test
npm run list:challenges
git diff --check
```

També convé buscar restes funcionals de DWES en les àrees que pertanyen al mòdul:

```bash
rg -n "DWES|dwes|2DAW|batoi-dwes" \
  course global microreptes .env.example
```

Cada coincidència s’ha de revisar; algunes poden ser exemples intencionats, però no han de quedar repositoris, grups, URLs ni criteris de DWES actius.

Arranca el dashboard i comprova que mostra el nom, els grups i els microreptes nous:

```bash
npm run dashboard
```

## 9. Crear els repositoris d’alumnat

Prepara un CSV:

```csv
github_user,group,student_name
alumne01,2DAW-A,Ana Martí
alumne02,2DAW-B,Pau Garcia
```

Fes sempre una simulació abans de crear-los:

```bash
npm run students:create-repos -- \
  --input alumnes.csv \
  --dry-run
```

Si la simulació usa l’organització, la plantilla, els grups i els noms esperats, executa-la de nou sense `--dry-run`. El script prendrà els valors per defecte de `course/module.json`, crearà els repositoris privats, convidarà l’alumnat i actualitzarà les llistes de `course/`.

## 10. Fer la primera prova completa

Abans d’usar OpenAI o publicar notes:

1. Puja la branca de configuració i crea una pull request contra `main`.
2. Comprova que el workflow de validació passa.
3. Fusiona la PR.
4. En `Actions`, executa `Batch autograde student repositories` sobre un únic repositori de prova.
5. Usa `mode = mock` i `publish_to_student_repo = false`.
6. Revisa els artifacts i el resum del workflow.
7. Repetix amb publicació activada sobre el mateix repositori de prova.
8. Finalment, prova `mode = openai` abans de corregir un grup complet.

No comences amb `target_group = all`. Primer valida el flux complet amb un repositori que no continga dades reals d’avaluació.

## 11. Desplegar

En el servidor del mòdul nou:

```bash
git clone https://github.com/la-meua-org/diw-microreptes-autocorreccio.git
cd diw-microreptes-autocorreccio
npm ci
cp .env.example .env
npm run validate
npm test
npm run dashboard
```

Edita `.env` abans d’exposar el dashboard i usa el mateix mecanisme de servei i còpies de seguretat que en DWES. La base de dades, les notes descarregades i els esborranys de consolidació són dades pròpies de cada instància i no s’han de compartir entre mòduls.

## Checklist final

- [ ] El repositori docent nou té el seu propi `origin`.
- [ ] `course/module.json` no apunta a DWES.
- [ ] Només existixen els grups i fitxers de repositoris del mòdul nou.
- [ ] `active-challenges.json` referencia microreptes existents.
- [ ] El context global, les rúbriques i els prompts són del mòdul nou.
- [ ] La plantilla d’alumnat és coherent amb les evidències avaluades.
- [ ] Els secrets només estan en GitHub o `.env`.
- [ ] `npm run validate` i `npm test` passen.
- [ ] La primera execució `mock` sobre un repositori de prova funciona.
- [ ] El dashboard està autenticat si és accessible des de la xarxa.

Quan tots els punts estan complits, la instància és independent: els canvis de grups, microreptes, notes i configuració del mòdul nou no afecten DWES.
