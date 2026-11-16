# Prompt base del corrector

Avalua `r3-s03-primer-cas-us-complet` només amb evidencies del repositori.

Comprova que el flux està identificat com a heretat de `R2` i que funciona en el framework amb entrada real processada, ruta, controlador o equivalent, model/servei/capa de dades, BBDD real, resposta visible i validacio o error minim.

Si el flux crea o modifica dades, revisa que hi haja un formulari server-rendered o equivalent amb recorregut GET/POST, proteccio CSRF del framework, valors previs o reintent, errors visibles, validacio real en servidor, persistencia només del cas valid i redireccio després de l'exit. La sintaxi pot variar entre Laravel, Symfony, Django i NestJS.

Verifica el cas positiu tant en la resposta com en la BBDD i un cas invalid que mostre error sense crear ni modificar dades parcialment.

Revisa si almenys este flux o un altre de `R3` és server-rendered amb vista o plantilla. Per a este microrepte, no exigisques segon flux ni API.

Penalitza pantalles estàtiques, formularis decoratius que no processen dades, confiança exclusiva en validacio HTML, dades fixes, tota la logica dins d'una ruta, absencia de BBDD real o falta de prova del cas positiu.
