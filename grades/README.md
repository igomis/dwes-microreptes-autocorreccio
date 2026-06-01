# Notes provisionals

La carpeta `grades/` conte registres provisionals d'autograding agregats manualment al repositori del professor.

Hi ha tres nivells diferents:

- Resultat brut d'una execucio: el fitxer `autograde-result.json` generat en un repositori d'alumne per una execucio concreta del workflow.
- Agregacio central: els fitxers `latest-grades.json` i `latest-grades.csv`, que acumulen registres importats al repositori del professor.
- Historial per tanda: la carpeta `grades/history/`, amb una subcarpeta per cada execucio massiva i cada repositori corregit.
- Validacio docent posterior: la revisio final feta pel professorat abans de considerar una nota com a definitiva.

Les notes d'esta carpeta son provisionals. Servixen per centralitzar resultats i facilitar el seguiment, pero no substituixen la revisio docent ni la qualificacio validada.

## Historial

El workflow de correccio massiva guarda resultats en:

```text
grades/history/<batch-id>/<repo-segur>/
```

Cada carpeta de repositori conte:

- `autograde-result.json`
- `autograde-result.md`
- `evaluation-payload.json`
- `grade-record.json`
- `openai-raw-response.json`, només en mode `openai`
