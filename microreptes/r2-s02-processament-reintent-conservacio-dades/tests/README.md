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
- revisar el fragment PHP o Python/Jinja que prepara els valors per a `value`, `selected`, `checked` o equivalents;
- preguntar a l'alumne la diferència entre conservar dades en el reintent, confirmar un cas correcte i guardar-lo entre peticions.

No cal executar proves sobre guardat entre peticions, persistència formal, base de dades, sessió, cookies, login, rols, MVC, arrays d'errors, fitxers, checkbox múltiple ni autenticació com a mínim de `R2M2`.
