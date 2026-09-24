# R2M9. Persistència mínima amb BBDD

Revisa si el lliurament incorpora una persistència mínima real amb BBDD des de `PHP` o `Python`.

No valores com a obligatori cap `ORM`, framework, migration, seeder o arquitectura completa. El mínim és:

- una dada significativa del projecte;
- una taula o `schema.sql` reproduïble;
- configuració de connexió separada;
- cap secret real pujat al repositori;
- connexió amb `PDO`, un connector DB-API o equivalent justificat;
- una alta amb dades validades del flux;
- una lectura posterior;
- consultes preparades quan entren dades d'usuari;
- instruccions de reproducció;
- comprovació que el flux principal continua funcionant.

Quan revises, fixa't especialment en si l'alumne ha confós sessió, cookie, array o fitxer provisional amb BBDD. També has de comprovar que no concatena directament dades d'usuari dins de l'SQL.

## Compatibilitat amb Python

Si el projecte usa Python, accepta `sqlite3` o el driver DB-API corresponent i consultes parametritzades. No exigisques PDO. Comprova igualment la configuració separada, l'absència de secrets, l'alta i la lectura posterior.

Pregunta docent recomanada: quina dada sobreviu ara a tancar sessió o reiniciar el navegador, i on es veu la consulta preparada?

## Ampliació global del repte

Este és l'únic microrepte que recull la proposta d'ampliació 9→10 del repte. Avalua el microrepte sobre 10 sense sumar ni penalitzar l'ampliació en les dimensions o en ra_scores. Si el payload inclou repte_extension, completa una proposta separada de 0 a 1 en passos de 0,25. La proposta servix al professorat per valorar-la durant la defensa: no és una validació docent, no modifica final_score_over_10 i no genera cap nota global del repte. Indica evidències concretes i preguntes pendents; no inventes una defensa oral.

En R2 la candidatura formal requerix `docs/r2-ampliacio.md`. Si el fitxer no existeix, deixa `proposed_score` en 0 i explica que no s'ha presentat formalment l'ampliació, encara que pugues mencionar millores detectades com a feedback. El fitxer ha d'explicar la millora integrada, enllaçar la implementació i les proves, i identificar què haurà de defensar l'alumne.
