# Evidències esperades

- Component de vista amb entrada explicita i almenys dos usos reals; en Django, template partial, include amb only o inclusion_tag.
- Actualitzacio `PUT/PATCH` o equivalent server-rendered documentat.
- Eliminacio `DELETE` o equivalent server-rendered documentat.
- Validacio en servidor, CSRF i control de `404` o equivalent.
- BBDD real i resposta basada en l'estat persistent.
- Actualitzacio o eliminacio denegada sense canvis parcials.
- Transaccio si una operacio modifica diversos registres relacionats.
- Proves d'actualitzacio, eliminacio i error.
- Regressio del primer flux.
