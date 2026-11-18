# R3S4. Components de vista i manteniment d'un recurs

## Finalitat de la sessio

Esta sessio fa evolucionar el primer flux de creacio d'R3M3 cap al manteniment d'un recurs existent. L'alumnat ha de reutilitzar una peça de vista i implementar actualitzacio i eliminacio amb les convencions HTTP i server-rendered del framework, BBDD real i errors controlats.

## Encaix dins del Repte 3

- **Repte**: `R3. Reconstruccio en framework, persistencia real i primers fluxos funcionals`
- **Microrepte**: `R3M4`
- **Sessio**: `R3S4`
- **Duracio orientativa**: `3 hores`
- **Focus**: component de vista reutilitzable, `PUT/PATCH`, `DELETE`, CSRF, `404`, BBDD i regressio
- **No entra encara**: API, autenticacio, integracio externa, rols complexos o CRUD complet

## Relacio amb RA i criteris de treball

| Element | Concrecio en el microrepte |
|---|---|
| `RA5.e` | usa les convencions del framework per a actualitzar i eliminar |
| `RA5.f` | reutilitza estructura i presentacio amb un component de vista |
| `RA5.g` | manté el codi explicable |
| `RA5.h` | amplia sense duplicacio HTML ni responsabilitats barrejades |
| `RA6.c`, `RA6.d`, `RA6.f` | usa i verifica dades persistents |
| `RA8.f` | modifica resposta segons dades, parametres o interaccio |
| Evidencia central | recurs actualitzat i eliminat amb component reutilitzat i BBDD coherent |

## Producte esperat

- Component, parcial, macro, *include* o equivalent amb entrada explícita i dos usos reals.
- Actualitzacio amb `PUT/PATCH` o equivalent server-rendered documentat.
- Eliminacio amb `DELETE` o equivalent server-rendered documentat.
- Validacio en servidor, CSRF i `404` o resposta equivalent.
- Interaccio amb BBDD real i resposta posterior basada en l'estat persistent.
- Transaccio quan una operacio modifica diversos registres relacionats.
- Prova d'actualitzacio, error, eliminacio i regressio d'R3M3.

## Preparacio previa del professorat

- Preparar un exemple de component de vista reutilitzat en dos contextos.
- Preparar equivalencies de `PUT/PATCH/DELETE` i *method override* en els frameworks del grup.
- Preparar un recurs editable i un altre que no es puga eliminar per una regla del domini.
- Tindre pauta de regressio del primer flux i exemple de `rollback` per a una operacio múltiple.

## Continguts a explicar

- Diferencia semantica entre `POST`, `PUT`, `PATCH` i `DELETE`.
- Limitacio dels formularis HTML a `GET/POST` i mecanismes natius de *method override* o equivalents.
- Components, parcials, macros, *includes* o equivalents amb dades d'entrada explícites: Blade en Laravel, Twig en Symfony, *template partials* en Django 6, `include ... only` o `inclusion_tag` en Django anterior, i el mecanisme del motor de plantilles en NestJS.
- Resolucio de recurs i `404` amb convencions del framework.
- CSRF, validacio en servidor i errors de domini en actualitzacio i eliminacio.
- Transaccio i `rollback` quan una operacio modifica diversos registres.

## Sequencia d'aula de 3 hores

Aplicar el [protocol de retorn i consolidació](retorn_i_consolidacio_microreptes.md). Els blocs següents ja incorporen la consolidació dins de les tres hores: prioritzar mínims i proves, i reajustar el treball nou si persistixen bloquejos del grup.

### 0:00-0:15. Retorn i explicació dels errors anteriors

Revisar les evidències i els dubtes del punt de partida, explicar dos o tres errors comuns amb un exemple breu i fer predir el resultat. No donar per assolit el microrepte anterior pel fet d’haver canviat de sessió.

### 0:15-0:30. Correcció guiada o consolidació

Qui té un pendent aplica una correcció concreta i torna a provar-la amb ajuda. Qui ja ha assolit el mínim comprova variants o millora les proves. Si falta treball, començar per la peça mínima necessària; si falta comprensió, modificar i explicar un exemple.

### 0:30-0:35. Comprovació de la base per continuar

Demanar una execució, modificació o explicació curta de la peça necessària per al treball de hui. Si el bloqueig continua, acordar ajuda durant el treball guiat i comprovar la comprensió en l’obertura següent. És consolidació per continuar, no recuperació ni recorrecció del microrepte.

### 0:35-0:55. Disseny del manteniment

Tasques:

- triar el recurs, els camps editables i la regla d'eliminacio;
- identificar el fragment visual repetit que es convertira en component;
- decidir si l'actualitzacio és parcial (`PATCH`) o completa (`PUT`);
- comprovar si alguna operacio necessita transaccio.

### 0:55-1:15. Modelatge docent

El professorat mostra un exemple curt amb:

- component de vista reutilitzat en llistat i formulari o detall; en Django pot ser un *template partial*, un `include ... only` o un `inclusion_tag`;
- ruta parametrizada amb recurs existent i cas `404`;
- formulari d'edicio amb *method override* o equivalent;
- eliminacio permesa i denegada;
- transaccio i `rollback` si hi ha diversos canvis.

### 1:15-1:55. Implementacio

Tasques:

- extraure i reutilitzar el component de vista;
- crear rutes i manejadors d'actualitzacio i eliminacio;
- validar, recuperar i modificar dades reals;
- protegir operacions insegures amb CSRF;
- preparar resposta, redireccio i missatges visibles.

### 1:55-2:20. Validacio i regressio

Tasques:

- provar actualitzacio correcta i invàlida;
- provar eliminacio correcta, denegada i identificador inexistent;
- comprovar `rollback` si l'operacio és múltiple;
- tornar a provar primer flux;
- revisar que el component evita duplicacio real.

### 2:20-2:45. Documentacio i commits

Tasques:

- descriure el component, els verbs i l'equivalent server-rendered usat;
- justificar `PUT` o `PATCH` i l'ús real de `DELETE`;
- registrar proves de manteniment i regressio;
- registrar commits i temps aproximat.

### 2:45-2:50. Checkpoint

Cada equip mostra:

- component renderitzat en dos llocs;
- actualitzacio i eliminacio executades;
- BBDD coherent i error controlat;
- primer flux encara funcional.

### 2:50-3:00. Diagnòstic individual i següent pas

Amb les evidències observades durant la sessió, comprovar què funciona i què entén cada alumne. Registrar la base que domina, la dificultat i l’ajuda necessària per continuar. Reprendre els dubtes en l’obertura següent com a consolidació, sense reentrega ni recorrecció del microrepte. La recuperació, si cal, es planteja sobre el repte complet en el seu tancament. No cal fer totes les demos completes en estos deu minuts.

## Tasques concretes de l'alumnat

- Crear i reutilitzar un component de vista.
- Implementar `PUT/PATCH` i `DELETE` o equivalents documentats.
- Validar en servidor, aplicar CSRF i controlar `404`.
- Usar BBDD real i transaccio quan hi ha diversos canvis.
- Provar actualitzacio, error, eliminacio i regressio.
- Documentar semantica, mecanisme del framework i abast.

## Evidencies minimes

| Evidencia | Minim acceptable |
|---|---|
| Component | peça amb entrada explícita reutilitzada almenys dues vegades |
| Actualitzacio | `PUT/PATCH` o equivalent documentat amb validacio i BBDD |
| Eliminacio | `DELETE` o equivalent documentat amb CSRF i regla de domini |
| Errors | actualitzacio invàlida, eliminacio denegada i `404` o equivalent |
| Atomicitat | transaccio si canvien diversos registres relacionats |
| Regressio | primer flux continua funcionant |
| Traçabilitat | commits i temps aproximat |

## Criteris d'exit

- El component evita duplicacio de presentacio i rep dades explícites.
- L'actualitzacio i l'eliminacio usen les convencions del framework.
- Les operacions mantenen la BBDD coherent davant d'errors.
- No trenca el primer flux.
- L'alumnat pot explicar els verbs HTTP i l'equivalent server-rendered aplicat.

## Que no és suficient

- Comptar el *layout* existent com a component nou.
- Copiar HTML en lloc de reutilitzar una peça.
- Canviar dades amb `GET`, sense CSRF o sense validacio en servidor.
- Usar `DELETE` per a cancel·lar, completar o arxivar un estat.
- Simular l'actualitzacio o l'eliminacio sense comprovar BBDD.
- No provar regressio.

## Us de la IA

La IA pot suggerir l'extraccio del component, les rutes i casos de prova. L'alumnat ha de justificar la semantica de cada metode, verificar el codi en el seu framework i registrar qualsevol adaptacio acceptada.

## Suport per a alumnat amb dificultats

- Donar un fragment HTML repetit perquè l'alumnat l'extraga a component.
- Proporcionar esquelet de rutes d'edicio i eliminacio del framework triat.
- Reduir l'operacio a una sola entitat quan no calga transaccio.
- Donar una taula de prova d'actualitzacio, eliminacio i regressio.

## Ampliacio per a alumnat avançat

- Afegir variants o *slots* justificats al component.
- Implementar *soft delete* quan el domini ho necessite.
- Afegir prova de `rollback` o concurrencia.

## Checklist de tancament

- [ ] Component reutilitzat almenys dues vegades.
- [ ] Actualitzacio `PUT/PATCH` o equivalent documentat.
- [ ] Eliminacio `DELETE` o equivalent documentat.
- [ ] CSRF, validacio i `404` o equivalent controlats.
- [ ] BBDD coherent i transaccio quan cal.
- [ ] Primer flux continua funcionant.
- [ ] Hi ha commits i temps aproximat.

## Connexio amb el microrepte posterior

`R3M5` protegira l'actualitzacio o l'eliminacio amb autenticacio, autoritzacio i middleware o equivalent. Per això les dues operacions han de quedar funcionals abans d'afegir identitat i permisos.

## Materials associats per a portar a l'aula

- **Presentació associada**: [MT09. On pose la lògica](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT09-On-pose-la-logica.pdf)
- **Teoria o material associat**: [Rutes, controladors, vistes i flux end-to-end](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R3-Rutes-controladors-vistes-i-flux-end-to-end.pdf)

## Microtaller associat

- **Microtaller**: `MT09. On pose la lògica`
- **Moment recomanat**: quan l'actualitzacio i l'eliminacio obliguen a separar presentacio, coordinacio, regla i persistencia.
- **Evidència mínima**: component reutilitzat i regla de manteniment situada en la capa adequada.
