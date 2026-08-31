# R4S2. Implementació del primer endpoint funcional

## Finalitat de la sessió

Esta sessió treballa `R4M2`: publicar un primer endpoint real, coherent amb el contracte de `R4S1`, alimentat per dades o lògica real del projecte.

Al final de la sessió, cada equip ha de poder executar una petició, veure una resposta estructurada i explicar d'on ixen les dades o el resultat que retorna el servei.

## Encaix dins del Repte 4

- **Repte**: `R4. API i serveis reutilitzables`
- **Microrepte**: `R4M2`
- **Sessió**: `R4S2`
- **Duració orientativa**: `3 hores`
- **Focus**: endpoint funcional, dades reals, resposta estructurada, coherència amb contracte i demo del cas correcte
- **No entra encara**: consumidor complet, documentació final, col·lecció completa de proves o integració externa

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA7.d` | implementació del servei segons contracte |
| `RA7.e` | publicació d'un endpoint verificable |
| `RA6.c` | lectura o ús de dades reals ja existents |
| `RA6.d` | coherència entre dada, operació i resposta |
| Evidència central | endpoint funcional amb resposta estructurada |
| Verificació docent | execució en directe i pregunta sobre l'origen de les dades |

## Producte esperat

- Endpoint publicat i accessible.
- Resposta en format coherent amb el contracte.
- Ús de dades reals o acció real del sistema.
- Cas correcte demostrable.
- Commit associat a la implementació.

## Preparació prèvia del professorat

- Portar un exemple d'endpoint complet amb resposta correcta.
- Preparar exemples d'errors habituals: ruta incorrecta, format inconsistent, dades simulades sense justificació.
- Recordar la frontera: no reobrir el model de dades de `R3`.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Recuperació del contracte

Cada equip selecciona l'endpoint que implementarà primer.

### 0:20-0:45. Modelatge docent

El professorat mostra ruta, controlador/handler, accés a dades i resposta.

### 0:45-1:40. Implementació guiada

L'alumnat implementa l'endpoint i comprova que respon.

### 1:40-2:15. Coherència contracte-resposta

Es compara la resposta real amb el contracte escrit en `R4S1`.

### 2:15-2:40. Prova i evidència

Cada equip guarda captura, comanda, col·lecció o registre de prova.

### 2:40-3:00. Checkpoint docent

Demo curta de l'endpoint i pregunta sobre l'origen de dades.

## Tasques concretes de l'alumnat

- Implementar una ruta o endpoint real.
- Connectar-lo amb dades o lògica del projecte.
- Retornar resposta estructurada.
- Provar el cas correcte.
- Ajustar el contracte si la implementació mostra una incoherència.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Endpoint | respon a una petició real |
| Dades | no són ornamentals ni desconnectades del projecte |
| Resposta | té estructura clara i estable |
| Contracte | coincideix amb el comportament observat |
| Demo | mostra petició i resposta |

## Criteris d'èxit

- El servei respon segons contracte.
- La resposta és consumible per un tercer.
- Les dades o accions són reals.
- L'alumnat pot assenyalar el codi que construeix la resposta.

## Què no és suficient

- Retornar un JSON estàtic sense motiu.
- Fer una ruta que només diu `ok`.
- Canviar el contracte sense documentar-ho.
- No provar l'endpoint fora del navegador si el context ho requereix.

## Ús de la IA

La IA pot ajudar amb esquelets de ruta o serialització, però la resposta s'ha de provar i contrastar amb el contracte.

## Suport i ampliació

Per a suport, limitar-se a un endpoint de lectura. Com ampliació, afegir validació d'entrada, filtres o resposta d'error més completa.

## Checklist de tancament

- [ ] Endpoint implementat.
- [ ] Resposta estructurada.
- [ ] Dades reals o acció real.
- [ ] Prova del cas correcte.
- [ ] Contracte actualitzat si cal.

## Connexió amb el microrepte posterior

`R4M3` protegirà el servei. Un endpoint funcional però obert sense control no és suficient quan el recurs és sensible.
