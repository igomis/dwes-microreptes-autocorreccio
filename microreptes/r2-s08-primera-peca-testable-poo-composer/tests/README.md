# Proves recomanades

1. Revisar `composer.json` i l'autoload en PHP, `requirements.txt`/`pyproject.toml` i els paquets en Python, o `pom.xml`/`build.gradle` i els paquets en Java.
2. Comprovar que la classe o mòdul es carrega o importa en un entorn reproduïble amb el mecanisme de la tecnologia.
3. Executar la prova unitària documentada.
4. Revisar que la classe prova una regla real i no depén de `$_POST`/`$_SESSION`/`$_COOKIE` en PHP, de `request`/`session` de Flask, de la petició/sessió HTTP de Java ni de la capa de presentació.
5. Executar un cas clau de `R2M7` per comprovar que login, estat i operacio protegida continuen funcionant.
6. Revisar la nota de pendents per a `R3`.
