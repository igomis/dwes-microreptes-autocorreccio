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
- nota al `README`, issue o registre indicant com provar l'error i el reintent;
- commit o traçabilitat del canvi.

Queden fora del mínim de `R2M2`:

- arrays d'errors;
- checkbox múltiple;
- fitxers;
- guardat entre peticions;
- persistència formal o base de dades obligatòria;
- estat, sessió, cookies, login o rols;
- MVC o arquitectura completa.

Això no els deixa fora de tot el `Repte 2`: poden aparéixer com a ampliació o consolidar-se en microreptes posteriors del mateix repte.

Ampliacions opcionals reconegudes en `R2M2`:

- guardar només els casos correctes en `JSON`, llegir-los en una petició posterior i mostrar una llista o resum;
- pujar i guardar un fitxer relacionat amb el formulari, validant en servidor l'error, la mida i el tipus permés, generant un nom segur i demostrant un fitxer acceptat i un de rebutjat.

Les ampliacions no compensen mancances del reintent obligatori. El fitxer, quan siga possible, s'ha de guardar fora de la zona pública i no ha de poder executar-se com a codi.
