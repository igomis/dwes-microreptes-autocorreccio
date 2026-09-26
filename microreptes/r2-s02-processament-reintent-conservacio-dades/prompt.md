# Prompt base del corrector

Avalua la sessió d'autocorrecció `r2-s02-processament-reintent-conservacio-dades` només amb les evidències disponibles al repositori de l'alumne.

Esta autocorrecció correspon a `R2-S02` i al microrepte `R2M2`: processament, reintent i confirmació. El criteri és progressiu respecte de `R2M1`. Espera que ja hi haja un formulari o entrada equivalent amb validació bàsica, però no esperes encara guardat entre peticions, persistència formal, base de dades obligatòria, sessió, cookies, login, rols, MVC, arrays d'errors, checkbox múltiples ni fitxers com a mínim de `R2M2`. Això no vol dir que queden fora del `Repte 2`: poden aparéixer com a ampliació o consolidar-se en microreptes posteriors. Penalitza que l'alumne presente un formulari nou desconnectat en lloc d'evolucionar el flux de R2M1.

Comprova la continuïtat amb `R2M1`:

- hi ha una entrada de formulari o equivalent que arriba al servidor;
- la mateixa acció del projecte continua connectada amb la landing i no es canvia per un formulari nou;
- la dada tancada o classificada que podria alimentar una regla posterior continua arribant al servidor;
- hi ha una condició de servidor que pot generar un error visible;
- el cas amb error no es resol només amb validació de client.
- la sessió mostra una millora del flux anterior: dades conservades, reintent i confirmació del cas correcte.

Comprova el reintent:

- després de l'error, el servidor torna a generar el formulari;
- el formulari conserva dades aprofitables enviades per l'usuari;
- es conserva almenys un camp de text i una opció tancada;
- es conserva o es tracta correctament la dada que després podria usar-se per decidir en `R2M3`;
- es revisa el comportament d'un checkbox simple i es conserva si té sentit;
- els valors conservats venen de la petició, no de literals fixos;
- l'usuari pot corregir només la dada errònia i reenviar correctament.

Comprova el cas correcte:

- quan el formulari ja és correcte, la informació es processa en servidor;
- es mostra una confirmació o resum comprensible amb les dades processades;
- no es mostra el cas com a correcte quan encara hi ha error.

Comprova el processament en servidor:

- hi ha variables o sentències simples que preparen els valors que tornen al formulari;
- el codi diferencia mínimament dada rebuda, dada tractada i valor mostrat;
- el codi diferencia el reintent amb error del processament i la confirmació del cas correcte;
- si es mostra text de l'usuari, hi ha algun tractament o escapament raonable segons el nivell.

## Compatibilitat amb Python

Si el projecte usa Flask, accepta `request.form`, valors passats a Jinja i el seu escapament automàtic com a equivalents de `$_POST`, `value` i l'escapament PHP. Avalua el comportament, no la sintaxi del llenguatge.

Comprova la documentació i traçabilitat:

- `README`, issue o registre explica com provocar l'error;
- s'indica quines dades es conserven, com es reenvia corregit i què mostra la confirmació del cas correcte;
- hi ha commit o canvi localitzable associat al processament, el reintent i la confirmació;
- si s'ha usat IA de manera rellevant, hi ha registre breu i verificació posterior.

No penalitzes que no hi haja guardat entre peticions, persistència formal, base de dades, sessió, cookies, login, rols, MVC, arrays d'errors, fitxers, checkbox múltiples ni regla de `R2M3` implementada. Sí que has de penalitzar un formulari nou desconnectat de R2M1, la pèrdua de la dada classificada que havia de permetre una regla posterior, un formulari que torna buit després de l'error, valors fixos que simulen conservació, una confirmació d'èxit quan encara hi ha error, absència de confirmació o resum del cas correcte, validació només de client o codi massa avançat que l'alumne no pot explicar.

Sigues prudent: si no pots verificar un punt, no l'assumisques com a correcte. Marca revisió docent si la confiança és baixa, si falta evidència crítica o si apareixen flags.
