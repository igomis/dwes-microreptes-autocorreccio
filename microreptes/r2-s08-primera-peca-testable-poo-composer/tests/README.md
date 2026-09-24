# Proves recomanades

1. Revisar `composer.json` i l'autoload en PHP, o `requirements.txt`/`pyproject.toml` i l'estructura de paquets en Python.
2. Executar `composer dump-autoload` en PHP si cal, o comprovar que el mòdul Python s'importa en un entorn reproduïble.
3. Executar la prova unitària documentada.
4. Revisar que la classe prova una regla real i no depén de `$_POST`/`$_SESSION`/`$_COOKIE` en PHP, de `request`/`session` de Flask en Python, ni d'HTML/Jinja.
5. Executar un cas clau de `R2M7` per comprovar que login, estat i operacio protegida continuen funcionant.
6. Revisar la nota de pendents per a `R3`.
