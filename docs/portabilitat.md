# Portabilitat a altres mòduls

El repositori separa el motor d’autocorrecció de la configuració docent. La forma recomanada de reutilitzar-lo és crear un repositori nou a partir d’esta branca o d’una GitHub Template i adaptar només la configuració i els continguts del mòdul.

## Frontera entre motor i mòdul

No s’han d’editar per a crear un mòdul nou:

- `scripts/`, excepte si es desenvolupa una capacitat nova del motor;
- `teacher-dashboard/`;
- els workflows genèrics de `.github/workflows/`;
- els esquemes de resultats de `global/`.

Sí que corresponen al mòdul:

- `course/module.json`;
- `course/active-challenges.json`;
- `course/student-repositories*.txt`;
- `microreptes/`;
- `global/module-autograding.md`;
- les polítiques i l’estil de feedback que el centre decidisca modificar;
- la programació d’aula, els esborranys de consolidació i els recursos docents.

## Configuració central

`course/module.json` conté:

- identificador, nom i nom curt del mòdul;
- repositori docent, organització, plantilla d’alumnat i prefix de repositoris;
- grups i fitxer de repositoris de cada grup;
- patrons dels codis d’activitat i resultats d’aprenentatge;
- dimensions obligatòries i política de rúbrica;
- activació o desactivació de la proposta d’ampliació del repte;
- dimensions tècniques, llindars, etiquetes i topalls del treball d’aula;
- rutes i URL de la programació docent;
- destinació opcional de les fitxes de consolidació;
- fitxer amb les instruccions d’IA específiques del mòdul.

Els tokens, claus i contrasenyes no van en este fitxer. Es mantenen en GitHub Secrets o en `.env`.

## Crear un projecte per a un altre mòdul

1. Crea un repositori des de la plantilla.
2. Crea una branca de preparació, per exemple `feature/configura-diw`.
3. Edita `course/module.json`.
4. Substituïx `global/module-autograding.md` pel context del mòdul nou.
5. Deixa en `microreptes/` només les activitats del mòdul nou.
6. Actualitza `course/active-challenges.json` amb els grups configurats.
7. Crea els fitxers de repositoris indicats en `course/module.json`.
8. Executa:

```bash
npm install
npm run validate
npm test
npm run dashboard
```

La configuració no és vàlida si un grup actiu no existeix en `course/module.json`, falta algun fitxer de repositoris o els llindars i les dimensions són incoherents.

## Repositoris de l’alumnat

El workflow `autograde-from-teacher.yml` no conté el nom d’un repositori docent concret. Cada plantilla o repositori d’alumne ha de definir:

- `TEACHER_REPOSITORY`: `owner/repo` del repositori d’autocorrecció del mòdul;
- `TEACHER_REPO_REF`: branca o tag estable, normalment `main`;
- `AUTOGRADE_GROUP`: grup de l’alumne.

També pot rebre estos valors manualment en una execució de prova.

## Grups i workflows

Els grups del dashboard i de la correcció massiva ixen de `course/module.json`. El workflow massiu accepta `all` o qualsevol identificador de grup configurat. No cal modificar el YAML quan es canvien els grups.

## Política de treball d’aula

La mecànica de checkpoints és comuna: inici, final de classe i entrega. Cada mòdul pot decidir en `assessment.classroom_work`:

- quines dimensions formen la nota tècnica;
- quin percentatge de progrés correspon als nivells alt i mitjà;
- l’etiqueta de cada nivell;
- el topall de nota associat.

Canviar esta política no elimina la classificació automàtica original ni les excepcions docents justificades que ja s’hagen registrat.

## Consolidacions

Si el mòdul publica fitxes de consolidació, configura repositori, branca, carpeta, URL pública i patró de codi. Si no les utilitza, fixa:

```json
{
  "consolidation": {
    "enabled": false
  }
}
```

## Criteri d’exportabilitat

Un mòdul nou es considera correctament separat quan es pot posar en marxa modificant configuració, activitats, rúbriques i prompts, sense tocar `scripts/`, `teacher-dashboard/` ni el workflow de correcció massiva.
