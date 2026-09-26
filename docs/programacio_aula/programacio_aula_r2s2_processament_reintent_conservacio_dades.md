# R2S2. Processament, reintent i confirmació

## Finalitat de la sessió

Esta sessió continua el microrepte `R2M1`: el formulari ja envia dades, el servidor les rep i almenys una condició simple pot mostrar un error. Ara el pas natural és millorar el reintent.

El focus principal és que, quan hi ha un error, el servidor torne a generar el formulari conservant les dades aprofitables que l'usuari ja havia escrit o seleccionat. Quan l'entrada ja és correcta, el servidor la processa i mostra una confirmació o resum comprensible.

Al final de la sessió, cada alumne o parella ha de poder demostrar dos camins: un enviament amb error que conserva dades per al reintent, i un enviament correcte que es processa i genera una confirmació o resum.

## Encaix dins del Repte 2

- **Repte**: `R2. Processament bàsic, estat, autenticació i primera funcionalitat protegida`
- **Microrepte**: `R2M2`
- **Sessió**: `R2S2`
- **Duració orientativa**: `3 hores`
- **Focus**: recuperació de dades enviades, tractament en servidor, resposta generada amb valors conservats, error visible, reintent corregit, confirmació del cas correcte i pujada bàsica d'un fitxer del domini
- **No entra encara**: persistència formal com a centre del treball, base de dades obligatòria, sessió, cookies, login, rols, arquitectura MVC, arrays d'errors com a mínim o checkbox múltiple

Esta frontera no expulsa el guardat entre peticions, els arrays d'errors ni la validació més completa del `Repte 2`; només indica que no són el mínim de `R2M2`. En esta sessió el criteri de tancament és demostrar el reintent amb dades conservades i la confirmació del cas correcte. El guardat entre peticions i la validació acumulada poden entrar com a ampliació o en una consolidació posterior.

## Frontera amb `R2S1`

`R2S2` no és “fer un altre formulari”. Ha de partir del flux de `R2S1` i respondre una pregunta nova:

> Què fa el servidor perquè l'usuari puga corregir l'error sense perdre dades útils, i què passa amb la informació quan el cas ja és correcte?

Per tant, la sessió només està ben tancada si es poden demostrar els dos camins:

- cas amb error: formulari regenerat amb dades aprofitables conservades;
- cas correcte: informació processada i mostrada en una confirmació o resum.

La sessió també ha de mantindre la dada que farà possible `R2S3`: categoria, franja, prioritat, tipus, quantitat, estat inicial o equivalent. Si eixa dada desapareix en el reintent o se substitueix per un literal fix, el flux queda pobre per a la sessió següent.

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA2` | generació de resposta amb codi de servidor, ús de variables, sentències simples, valors calculats per a la vista i àmbits bàsics |
| `RA3` | recuperació de dades de formulari, tractament de valors, error visible i reintent amb conservació de la informació aprofitable |
| Evidència central | formulari que, després d'un error, torna carregat amb dades aprofitables; entrada correcta processada i confirmada |
| Verificació docent | execució d'un cas amb error i d'un cas correcte, comprovant valors conservats, reenviament i resum final |

## Producte esperat

Una evolució del flux de `R2M1` que incloga, com a mínim:

- recuperació de les dades enviades amb `$_POST` o mecanisme equivalent;
- tractament mínim de les dades abans de tornar-les a mostrar;
- detecció d'un error en servidor;
- missatge d'error visible;
- formulari regenerat pel servidor amb les dades aprofitables conservades;
- correcció només de la dada errònia;
- reenviament correcte amb resposta final;
- processament de l'entrada correcta;
- confirmació o resum de la informació correcta processada;
- camp de fitxer connectat amb la mateixa acció del projecte;
- recepció i intent de guardat del fitxer en servidor, amb error visible si falla;
- comprovació bàsica de mida i tipus o extensió permesa;
- prova d'un fitxer acceptat i un de rebutjat;
- conservació o processament d'almenys una dada classificada que puga alimentar una regla en `R2S3`;
- nota breu al `README`, issue o registre indicant com provar el cas amb error i el reintent.

Cal diferenciar conservar valors dins del formulari quan hi ha error de processar i confirmar la informació correcta. Conservar una entrada per recuperar-la en una petició posterior és una ampliació i requerix un mecanisme d'estat o persistència que no forma part del mínim.

## Preparació prèvia del professorat

Abans de la sessió convé tindre preparat:

- un formulari mínim amb text, select o radio i checkbox;
- un exemple d'error de servidor que torne a mostrar el formulari;
- una mostra curta de com omplir `value`, `selected` o `checked` amb dades rebudes;
- una pauta sobre quines dades convé conservar i quines no;
- una pauta per revisar que la dada candidata a decisió de `R2S3` continua arribant i conservant-se;
- un mecanisme simple per guardar una entrada correcta;
- un exemple d'escapament o eixida segura de text abans de tornar-lo a pintar.

## Seqüència d'aula de 3 hores

Aplicar el [protocol de retorn i consolidació](retorn_i_consolidacio_microreptes.md). Els blocs següents ja incorporen la consolidació dins de les tres hores: prioritzar mínims i proves, i reajustar el treball nou si persistixen bloquejos del grup.

### 0:00-0:15. Retorn i explicació dels errors anteriors

Revisar les evidències i els dubtes del punt de partida, explicar dos o tres errors comuns amb un exemple breu i fer predir el resultat. No donar per assolit el microrepte anterior pel fet d’haver canviat de sessió.

### 0:15-0:30. Correcció guiada o consolidació

Qui té un pendent aplica una correcció concreta i torna a provar-la amb ajuda. Qui ja ha assolit el mínim comprova variants o millora les proves. Si falta treball, començar per la peça mínima necessària; si falta comprensió, modificar i explicar un exemple.

### 0:30-0:35. Comprovació de la base per continuar

Demanar una execució, modificació o explicació curta de la peça necessària per al treball de hui. Si el bloqueig continua, acordar ajuda durant el treball guiat i comprovar la comprensió en l’obertura següent. És consolidació per continuar, no recuperació ni recorrecció del microrepte.

### 0:35-0:50. Recuperació de R2M1

El professorat demana executar el formulari de la sessió anterior amb un cas incorrecte.

Tasques:

- localitzar on es recuperen les dades;
- localitzar on es genera l'error;
- observar què passa amb les dades ja introduïdes;
- decidir quines dades té sentit conservar en el reintent.
- comprovar si la dada candidata per a `R2S3` continua existint en el flux.

Resultat del tram: cada equip sap quin problema d'usabilitat resoldrà en el reintent.

### 0:50-1:10. Modelatge docent

El professorat mostra un flux mínim:

- recepció de dades;
- normalització o preparació simple;
- variable d'error;
- generació del formulari amb valors conservats;
- ús de `value`, `selected` i `checked` o equivalent;
- reenviament corregit.

Resultat del tram: l'alumnat veu que el servidor no només valida, sinó que també reconstrueix una resposta útil per a corregir.

### 1:10-1:45. Conservació de dades de text i opció tancada

L'alumnat adapta el formulari perquè conserve almenys les dades més simples.

Tasques:

- conservar un camp de text o textarea;
- conservar una opció de select o radio;
- comprovar que el valor reapareix després de l'error;
- tractar o escapar el text abans de mostrar-lo;
- evitar conservar dades que no pertoquen.

Resultat del tram: el formulari ja no torna completament buit després d'un error.

### 1:45-2:10. Checkbox i cas d'error

L'alumnat revisa com es comporta el checkbox simple.

Tasques:

- comprovar què arriba quan el checkbox està marcat;
- comprovar què passa quan no està marcat;
- conservar l'estat `checked` si té sentit;
- mostrar l'error sense perdre la resta de dades aprofitables;
- mantindre la condició simple de validació.

Resultat del tram: el reintent conserva text, opció tancada i, si correspon, checkbox simple.

### 2:10-2:35. Reenviament corregit, confirmació i fitxer

L'alumnat prova el cicle complet.

Tasques:

- enviar un cas amb error;
- comprovar que el formulari torna amb dades conservades;
- corregir només la dada errònia;
- reenviar;
- comprovar que la resposta correcta es genera.
- mostrar una confirmació o resum amb la informació correcta processada.
- afegir un fitxer relacionat amb l'acció del projecte;
- comprovar en servidor l'error de pujada, una mida màxima i un tipus o extensió permesa;
- guardar-lo amb un nom segur quan el cas és vàlid i mostrar un error quan es rebutja.

Resultat del tram: el flux d'error i reintent és demostrable, i el cas correcte no es perd.

### 2:35-2:45. Traçabilitat i documentació mínima

L'alumnat deixa rastre del que ha fet.

Tasques:

- actualitzar el `README`, issue o registre de treball;
- escriure com provocar l'error;
- indicar quines dades es conserven;
- indicar què cal corregir per arribar al cas correcte.
- indicar quines dades processades apareixen en la confirmació del cas correcte.

Resultat del tram: una altra persona pot repetir el reintent.

### 2:45-2:50. Checkpoint docent

Cada equip mostra:

- enviament incorrecte;
- error visible;
- formulari recarregat amb dades conservades;
- correcció de la dada errònia;
- reenviament correcte;
- confirmació o resum del cas correcte;
- prova mínima d'un fitxer acceptat i un de rebutjat;
- fragment de codi on es preparen els valors que tornen al formulari.

Pregunta de tancament: quines dades conserva el servidor per ajudar l'usuari a corregir, i en quin punt del codi es tornen a pintar?

### 2:50-3:00. Diagnòstic individual i següent pas

Amb les evidències observades durant la sessió, comprovar què funciona i què entén cada alumne. Registrar la base que domina, la dificultat i l’ajuda necessària per continuar. Reprendre els dubtes en l’obertura següent com a consolidació, sense reentrega ni recorrecció del microrepte. La recuperació, si cal, es planteja sobre el repte complet en el seu tancament. No cal fer totes les demos completes en estos deu minuts.

## Tasques concretes de l'alumnat

- Executar un cas incorrecte de `R2M1`.
- Recuperar les dades enviades en servidor.
- Preparar els valors que tornaran al formulari.
- Regenerar el formulari amb dades aprofitables conservades.
- Mostrar un error visible.
- Corregir només la dada errònia i reenviar.
- Processar el cas correcte i mostrar-ne una confirmació o resum.
- Pujar un fitxer del domini, validar-lo bàsicament en servidor i intentar guardar-lo amb un nom segur.
- Mantindre visible o recuperable la dada que pot alimentar una regla posterior.
- Mostrar les dades processades en la resposta correcta.
- Documentar com provar el reintent.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Recuperació | el codi llig les dades enviades pel formulari |
| Tractament | hi ha variables preparades per tornar a pintar valors |
| Error visible | el cas incorrecte mostra un missatge útil |
| Conservació | almenys text i opció tancada es mantenen després de l'error |
| Checkbox | es comprova i, si té sentit, es conserva el seu estat |
| Reintent | l'usuari corregeix només la dada errònia i reenvia |
| Confirmació | el cas correcte mostra un resum comprensible de les dades processades |
| Fitxer | hi ha un intent funcional de pujada vinculat al domini, amb validació bàsica i casos acceptat/rebutjat |
| Preparació per a R2S3 | una dada classificada del flux queda disponible per a una regla posterior |
| Documentació | el repositori explica com provar l'error i el reintent |

## Criteris d'èxit

El microrepte està aconseguit si:

- el formulari no torna buit després d'un error;
- l'error continua generant-se en servidor;
- les dades conservades corresponen a dades enviades realment;
- el codi mostra com es preparen els valors de resposta;
- el reintent permet corregir sense repetir-ho tot;
- el cas correcte queda processat i confirmat amb un resum;
- el formulari intenta pujar un fitxer del domini i el servidor diferencia almenys un cas acceptat d'un de rebutjat;
- el cas correcte acaba en una resposta final;
- l'alumnat pot assenyalar on es rep, on es valida i on es torna a pintar cada dada.

## Què no és suficient

- Mostrar un error però perdre totes les dades del formulari.
- Posar valors fixos en el formulari que no venen de l'enviament.
- Conservar dades sense validar o sense saber d'on ixen.
- Guardar una dada quan el formulari encara té error.
- Fer només validació de client.
- Introduir arrays d'errors abans d'entendre un reintent simple.
- Convertir la sessió en base de dades, login, sessió o arquitectura.
- Fer checkbox múltiple com a mínim obligatori.

## Ús de la IA

La IA es pot usar per:

- recordar com omplir `value`, `selected` o `checked`;
- revisar una condició simple de reintent;
- proposar missatges d'error;
- explicar per què cal escapar text abans de mostrar-lo;
- ajudar a redactar la prova del `README`.

Control obligatori:

- l'alumnat ha de provar una dada pròpia;
- ha de poder canviar un valor del formulari i explicar per què es conserva;
- ha de diferenciar conservar en el reintent de processar i confirmar un cas correcte;
- si la IA ha generat codi rellevant, s'ha de registrar breument al `AI log` o registre equivalent.

## Suport per alumnat amb més dificultat

Reduir el flux a:

- un camp de text obligatori;
- un select amb tres opcions;
- un error simple;
- formulari recarregat amb el text i el select conservats;
- reenviament correcte.

Frase guia: "No afegis més validacions fins que el formulari torne amb les dades que l'usuari no hauria de repetir."

## Ampliació per alumnat avançat

Si el mínim ja està tancat, l'alumnat pot:

- conservar més controls del formulari;
- acumular errors en un array i mostrar-los tots;
- conservar checkbox múltiple amb opcions permeses;
- millorar l'escapament i normalització de dades;
- guardar entrades correctes en un fitxer `JSON`, llegir-les en una petició posterior i mostrar-les en una llista o resum;
- reforçar la pujada amb detecció MIME, noms no predictibles, emmagatzematge fora de la zona pública i neteja de fitxers residuals;
- documentar casos positius i negatius amb més precisió.

L'ampliació de `JSON` ha de ser reproduïble: una petició posterior recupera la dada. Les millores avançades del fitxer reforcen el requisit bàsic, però no compensen mancances del reintent ni han d'obrir encara sessió, autenticació o arquitectura completa.

## Checklist de tancament

- [ ] He enviat un cas amb error.
- [ ] L'error es mostra en servidor.
- [ ] El formulari torna amb dades aprofitables conservades.
- [ ] Conserve almenys text i opció tancada.
- [ ] He revisat què passa amb el checkbox simple.
- [ ] Puc assenyalar on prepare els valors que tornen al formulari.
- [ ] Corregisc només la dada errònia i reenvie.
- [ ] El cas correcte genera resposta final.
- [ ] El cas correcte mostra una confirmació o resum amb les dades processades.
- [ ] He intentat pujar un fitxer relacionat amb el domini.
- [ ] El servidor diferencia un fitxer acceptat d'un de rebutjat.
- [ ] El `README`, issue o registre explica com provar el reintent.
- [ ] Si he usat IA, he registrat què m'ha aportat i què he verificat.

## Connexió amb R2M3

`R2M3` només té sentit si `R2M2` deixa clar com el servidor tracta dades, reconstrueix respostes i conserva funcionalment les entrades correctes. La pregunta de pas és:

Quina regla del teu projecte podrà aplicar el backend quan el flux d'entrada i reintent ja és comprensible?

## Materials associats per a portar a l'aula

- **Material principal, després del microrepte**: [Reintent, conservació de dades i confirmació](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R2-Reintent-conservacio-de-dades-i-guardat-funcional.pdf), pendent de regenerar perquè el PDF encara conserva l'abast anterior.
- **Alternativa Python**: [R2M2 amb Flask: reintent i confirmació](https://cipfpbatoi.github.io/dwes2627/04_materials/repte_02/python/r2m2_reintent_guardat.html)
- **Material opcional de reforç**: [MT03. Validació de servidor amb casos roïns](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT03-Validacio-de-servidor-amb-casos-roins.pdf), només si les proves de casos invàlids continuen bloquejant el grup.

No s'han d'usar els dos materials seguits com una explicació llarga. El retorn posterior ha de partir d'un error observat, mostrar el patró mínim i tornar de seguida a la prova del projecte.

## Microtaller associat

- **Microtaller**: `MT03. Validació de servidor amb casos roïns`
- **Moment recomanat**: quan el reintent i la conservació de dades ja mostren què passa amb entrades incorrectes.
- **Evidència mínima**: taula de casos vàlids i invàlids, amb tractament de reintent i dada conservada o rebutjada.
