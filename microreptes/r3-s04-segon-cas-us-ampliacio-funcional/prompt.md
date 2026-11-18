# Prompt base del corrector

Avalua `r3-s04-segon-cas-us-ampliacio-funcional` només amb evidencies del repositori.

Comprova que hi ha un component, parcial, macro, include o equivalent amb dades d'entrada explicites i almenys dos usos reals. El layout general preexistent no compta com a component nou i copiar el mateix HTML en dos llocs no és reutilitzacio.

Comprova que un recurs existent es pot actualitzar amb `PUT/PATCH` i eliminar amb `DELETE`, o amb els equivalents server-rendered natius que el repositori documente. Accepta *method override* o la convencio pròpia del framework; no exigisques la mateixa sintaxi a Laravel, Symfony, Django i NestJS. Revisa que l'alumne diferencie actualitzacio parcial, substitucio completa i eliminacio, i que no canvie dades amb `GET`.

Verifica validacio en servidor, proteccio CSRF de les operacions insegures, BBDD real, resposta posterior basada en l'estat persistent, un recurs inexistent amb `404` o resposta controlada equivalent i una regla que impedisca almenys una actualitzacio o eliminacio no valida. Si una operacio modifica diversos registres relacionats, exigix transaccio o mecanisme equivalent i absencia de canvis parcials davant d'error.

Comprova proves o evidencies d'actualitzacio correcta i invalida, eliminacio correcta i denegada, recurs inexistent, rollback si aplica i regressio d'R3M3.

No penalitzes que encara no hi haja autenticacio, autoritzacio, API o desplegament. Penalitza simulacions sense canvi real en BBDD, absencia de reutilitzacio de vista, peticions insegures sense proteccio o falta de regressio.
