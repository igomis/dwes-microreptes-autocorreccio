# Evidències esperades

Evidències mínimes:

- formulari o entrada equivalent que arriba al servidor;
- error visible generat per una condició de servidor;
- formulari regenerat després de l'error;
- conservació d'almenys un camp de text i una opció tancada;
- comprovació del comportament del checkbox simple;
- valors conservats a partir de dades enviades, no de literals fixos;
- en PHP, valors escapats i reconstruïts des de `$_POST`; en Python/Flask, dades de `request.form` passades a Jinja amb escapament automàtic o mecanisme equivalent;
- reenviament corregit amb resposta correcta;
- processament del cas correcte i confirmació o resum amb les dades processades;
- camp de fitxer relacionat amb el domini i recepció en servidor;
- comprovació bàsica de mida i tipus o extensió permesa;
- intent de guardat amb nom segur i error visible si falla;
- prova d'un fitxer acceptat i un de rebutjat;
- nota al `README`, issue o registre indicant com provar l'error i el reintent;
- commit o traçabilitat del canvi.

Queden fora del mínim de `R2M2`:

- arrays d'errors;
- checkbox múltiple;
- guardat entre peticions;
- persistència formal o base de dades obligatòria;
- estat, sessió, cookies, login o rols;
- MVC o arquitectura completa.

Això no els deixa fora de tot el `Repte 2`: poden aparéixer com a ampliació o consolidar-se en microreptes posteriors del mateix repte.

Ampliacions opcionals reconegudes en `R2M2`:

- guardar només els casos correctes en `JSON`, llegir-los en una petició posterior i mostrar una llista o resum;
- reforçar la pujada obligatòria amb detecció MIME, noms no predictibles, emmagatzematge fora de la zona pública i neteja de fitxers residuals.

Les ampliacions no compensen mancances del reintent obligatori. L'absència total d'intent de pujada deixa la dimensió específica en `0/1`, però no limita les altres dimensions.
