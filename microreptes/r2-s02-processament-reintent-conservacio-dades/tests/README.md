# Tests del microrepte

Estratègia de comprovació manual:

- obrir el formulari o entrada equivalent;
- enviar un cas incorrecte documentat;
- comprovar que el servidor mostra un error visible;
- comprovar que el formulari torna carregat amb dades aprofitables;
- verificar que es conserva almenys un text i una opció tancada;
- revisar què passa amb el checkbox simple;
- corregir només la dada errònia;
- reenviar i comprovar la resposta correcta;
- comprovar que el cas correcte mostra una confirmació o resum amb les dades processades;
- enviar un fitxer permés i comprovar l'intent de guardat amb nom segur;
- enviar un fitxer de tipus o mida no permesos i comprovar l'error visible;
- revisar el fragment PHP o Python/Jinja que prepara els valors per a `value`, `selected`, `checked` o equivalents;
- preguntar a l'alumne la diferència entre conservar dades en el reintent, confirmar un cas correcte i guardar-lo entre peticions.

No cal executar proves sobre guardat entre peticions, persistència formal, base de dades, sessió, cookies, login, rols, MVC, arrays d'errors, checkbox múltiple ni autenticació com a mínim de `R2M2`.

Per al fitxer obligatori, comprovar:

- fitxer: un tipus i mida permesos es guarden amb nom segur, un fitxer invàlid es rebutja amb error visible i el cas invàlid no deixa un fitxer residual;
- si no hi ha cap intent verificable, la dimensió específica és `0/1` sense limitar la resta.

Si presenta l'ampliació, comprovar addicionalment que el `JSON` només guarda casos vàlids i que una nova petició el recupera; i, per al fitxer, detecció MIME, nom no predictible i ubicació no executable.
