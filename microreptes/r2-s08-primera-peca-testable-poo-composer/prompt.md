# Prompt base del corrector

Avalua `r2-s08-primera-peca-testable-poo-composer` només amb evidencies del repositori.

Comprova que el canvi parteix d'un flux provat en `R2M7` i introdueix una primera peça testable: dependències declarades, mecanisme de càrrega o importació, una classe simple del domini o servei i una prova unitària mínima.

La classe ha d'encapsular una regla, comprovacio o càlcul real i ha de poder provar-se sense navegador. Penalitza classes buides, classes que només renderitzen HTML o classes dependents directament de `$_POST`, `$_SESSION`, `$_COOKIE` o del flux web.

## Compatibilitat amb Python

Si el projecte usa Python, accepta `requirements.txt` o `pyproject.toml`, una classe en un mòdul importable i una prova amb `pytest` o `unittest`. La classe no ha de dependre de Flask, `request`, `session` ni Jinja. No exigisques Composer ni `vendor/autoload.php`.

No exigisques MVC, ORM, framework, API externa ni POO extensa. Penalitza l'absencia de prova automàtica, l'absencia de prova de no regressio o codi avançat que l'alumne no pot explicar.

Marca revisio docent si no hi ha evidència clara de dependències i càrrega/importació, classe pròpia, execucio de prova o manteniment del flux.
