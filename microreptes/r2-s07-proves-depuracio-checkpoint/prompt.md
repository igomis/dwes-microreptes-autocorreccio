# Prompt base del corrector

Avalua `r2-s07-proves-depuracio-checkpoint` només amb evidencies del repositori.

Comprova que hi ha una checklist o taula de proves amb entrada, passos, resultat esperat i resultat real. Ha d'incloure casos del flux complet: vàlid, invàlid, reintent, regla, estat recuperat i invalidat, accés no autenticat denegat, accés autenticat permés i logout o invalidacio.

Comprova també que hi ha almenys una prova automàtica lleugera de flux. Pot ser una comanda `curl`, un script `.sh`, un script PHP senzill, una col·leccio de peticions documentada o equivalent. La prova ha de comprovar un comportament observable, com resposta d'error, redireccio, accés denegat, login correcte o operacio protegida.

## Compatibilitat amb Python

Si el projecte usa Python, accepta un script Python o el client de proves de Flask com a prova lleugera. No exigisques encara `pytest`; sí que la comprovació ha de fallar quan el comportament observable no coincidix amb l'esperat.

No exigisques proves unitàries, `PHPUnit`, `pytest`, mocks ni suite formal. Penalitza llistes generades però no executades, absencia de casos negatius, absencia total de prova automàtica lleugera, README que no permet reproduir la demo o correccions sense incidencies registrades.

Marca revisio docent si la documentacio afirma resultats que no es poden contrastar amb el repositori.
