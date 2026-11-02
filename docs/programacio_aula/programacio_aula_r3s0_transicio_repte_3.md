# R3S0. Transició al Repte 3

## Finalitat de la sessió

Esta sessió obri `R3` sense crear un microrepte nou. La seua funció és fer el pas des del projecte `PHP` funcional de `R2` cap a una estructura en framework amb capes, persistència i fluxos més mantenibles.

## Encaix dins del Repte 3

- **Repte**: `R3. Framework, arquitectura i persistència`
- **Microrepte**: `Sessió sense microrepte propi`
- **Sessió**: `R3S0`
- **Duració orientativa**: `3 hores`
- **Focus**: canvi d'escala, framework, MVC o equivalent, persistència i migració d'un flux de `R2`
- **No entra encara**: crear el projecte complet en framework, migrar tot `R2` o implementar un flux complet

## Relació amb RA, CA i criteris de treball

| Element | Concreció en la sessió |
|---|---|
| `RA5` | Preparació de `RA5.a-e`, que es treballaran en `R3M1` en identificar la separació de responsabilitats que aporta un framework. |
| `RA6` | Preparació de `RA6.a-e`, que es treballaran en `R3M2` en construir persistència reproduïble i reconstruir la base de dades. |
| `RA8` | Preparació de `RA8.c`, que es treballarà en `R3M1` en generar una primera resposta web des del framework. |
| CA qualificats | Cap en esta sessió de transició; els codis anteriors indiquen els criteris que es desenvoluparan i avaluaran més avant. |
| Criteris de treball | Observació formativa de la lectura del projecte, la justificació de decisions i l'explicació del recorregut d'una petició. |
| Avaluació | No genera microrepte, nota ni autocorrecció pròpia; els criteris s'apliquen en les sessions i microreptes posteriors de `R3`. |

## Producte esperat

Un mapa de transició breu que identifique un flux funcional de `R2` per a migrar, les responsabilitats que caldrà separar, una opció de framework raonada i l'entitat/dades que convé preparar primer. És una evidència de treball d'aula per orientar `R3`, no un lliurament ni una nota addicional.

## Preparació prèvia del professorat

- Tindre disponible un projecte funcional de `R2` o un exemple equivalent per a llegir-ne el recorregut i detectar acoblaments.
- Preparar una ruta mínima en Laravel per a mostrar el pas de petició a resposta i una comparació breu amb Express.
- Preparar un mapa de ruta, controlador, model/servei i vista/resposta que no pressupose que tots els frameworks tenen les mateixes carpetes o convencions.
- Tindre exemples senzills de migracions i càrrega inicial de dades, sense avançar la implementació de la persistència de `R3M2`.
- Revisar el protocol de retorn i consolidació i identificar com comprovar el punt de partida sense treball previ de `R3`.

## Conceptes a explicar

- Per què es passa de `PHP` base a un framework i quines responsabilitats continuen sent de l'equip.
- Què resol un framework, què són les dependències i com s'instal·len i s'arranca una demo.
- Diferència entre ruta, controlador, model, vista/resposta i servei, sense exigir una estructura idèntica entre stacks.
- Què significa persistència reproduïble: migracions o equivalents, fixtures/seeders o càrrega inicial i configuració amb `.env`.
- Com triar un flux de `R2` que siga representatiu i acotat per a migrar primer.
- Diferència entre `Node.js` (entorn d'execució) i `Express` (framework web); demo principal amb Laravel i comparació breu amb Express.

## Seqüència d'aula de 3 hores

Aplicar el protocol de retorn i consolidació en els trams de revisió i checkpoint. En ser una sessió inicial de `R3`, comprovar el punt de partida i els bloquejos sense demanar la recuperació individual de cap microrepte.

### 0:00-0:35. Lectura crítica de `R2`

Revisar un flux funcional de `R2`. L'alumnat identifica què funciona, quines responsabilitats estan massa acoblades i quines parts del flux convé conservar com a referència.

### 0:35-1:15. Mapa d'arquitectura

El professorat modela el recorregut petició -> ruta -> controlador -> model/servei -> vista/resposta amb una ruta mínima en Laravel. Mostra com s'instal·len les dependències i com s'arranca la demo; després identifica la mateixa idea en Express sense exigir que les carpetes ni les convencions coincidisquen. L'alumnat consulta els miniapunts «Què aporta un framework?» en els materials de suport de `R3`.

### 1:15-1:55. Decisió de stack i flux inicial

L'alumnat compara opcions disponibles, confirma provisionalment el framework o itinerari i tria el primer flux que reconstruirà. La decisió tècnica es concreta i es prova en `R3S1`.

### 1:55-2:35. Preparació de persistència

Cada equip identifica l'entitat principal del flux, les dades inicials necessàries i com haurien de poder reconstruir la base de dades. No cal crear encara migracions ni connectar una BBDD.

### 2:35-3:00. Checkpoint de pas

Cada equip explica el flux triat, el mapa de capes, la decisió provisional de stack i l'entitat inicial. El professorat comprova els bloquejos i concreta el següent pas abans de `R3S1`.

## Tasques concretes de l'alumnat

- Revisar un flux existent de `R2` i distingir què funciona del que caldrà reorganitzar.
- Dibuixar el recorregut de la petició i situar ruta, controlador, dades i resposta.
- Comparar breument un framework amb una alternativa i justificar la tria provisional.
- Triar un flux acotat de `R2` i explicar per què és adequat per a començar la migració.
- Identificar l'entitat principal, les dades inicials i el criteri per a reconstruir la BBDD.
- Compartir el mapa i les decisions amb el professorat en el checkpoint.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Lectura de `R2` | un flux existent i un punt d'acoblament identificats |
| Flux inicial | triat i acotat per a migrar |
| Stack | opció provisional comparada i justificada |
| Mapa de capes | petició, ruta, controlador, dades i resposta situats |
| Persistència | entitat principal, dades inicials i criteri de reconstrucció identificats |

## Criteris d'èxit

- L'equip pot explicar un flux actual de `R2` i què vol conservar-ne.
- El mapa diferencia les responsabilitats principals sense imposar convencions pròpies d'un únic framework.
- La tria provisional de stack respon al projecte i està comparada amb una alternativa.
- El flux i l'entitat inicial tenen un abast prou acotat per a començar en `R3S1`.
- L'alumnat diferencia una decisió de disseny de la implementació, que encara no es demana en esta sessió.

## Què no és suficient

- Dir que es migrarà tota l'aplicació sense seleccionar un primer flux.
- Enumerar capes sense poder situar-hi una petició i la resposta corresponent.
- Triar un framework només per preferència, sense cap raó vinculada al projecte.
- Confondre `Node.js` amb `Express` o presentar una única estructura de carpetes com a universal.
- Proposar persistència sense identificar quines dades caldrà reconstruir.
- Presentar captures o una demo del professorat com si foren evidència de treball propi.

## Ús de la IA

La IA pot ajudar a comparar frameworks, resumir responsabilitats o proposar preguntes per a revisar un flux. L'alumnat ha de contrastar les propostes amb el projecte i explicar les decisions pròpies. No cal exigir un registre d'IA si no s'ha utilitzat.

## Suport per a l'alumnat amb dificultats

- Començar per un flux de `R2` conegut i dibuixar només entrada, processament, dades i resposta.
- Oferir una plantilla buida del mapa de capes i completar-la amb preguntes guiades.
- Donar una comparativa curta de frameworks per a ajudar a justificar la decisió, sense decidir-la per l'equip.
- Reduir la primera selecció a una entitat i un flux senzill, i revisar la comprensió abans del checkpoint.

## Ampliació per a l'alumnat més avançat

- Comparar com es resol el mateix recorregut en Laravel i Express, distingint concepte i convenció.
- Identificar un segon flux candidat i explicar per què convindria ajornar-lo.
- Proposar com separar dades de prova i secrets de configuració, sense avançar la implementació de migracions.

## Checklist de tancament

- [ ] Flux de `R2` revisat i primer flux de migració triat.
- [ ] Stack provisional comparat i justificat.
- [ ] Mapa de petició, ruta, controlador, dades i resposta preparat.
- [ ] Entitat principal i dades inicials identificades.
- [ ] Bloquejos i suport necessari registrats per a continuar en `R3S1`.

## Connexió amb el microrepte posterior

`R3S0` no té microrepte propi. Les decisions de stack, arrencada i abast es concreten en `R3S1/R3M1`, que demana un projecte base reproduïble amb una primera ruta funcional. L'entitat i les dades identificades ací orienten després `R3S2/R3M2`, on es treballarà la BBDD real, les migracions o equivalents i la càrrega inicial reproduïble.

## Seguiment dels pendents

Identificar els bloquejos abans del treball que en depén, donar ajuda concreta per continuar i comprovar la comprensió. Els microreptes són treball d'aula i no es recuperen individualment; la recuperació correspon al repte complet. Esta actuació no crea un microrepte propi ni una nota addicional.
