# R5S4. Integració de la funcionalitat híbrida en el producte

## Finalitat de la sessió

Esta sessió treballa el microrepte `R5M4`. L'objectiu és connectar la font externa transformada amb una funcionalitat real del producte, de manera que l'usuari veja o utilitze un valor nou.

Al final de la sessió, la integració no ha de viure en un script aïllat: ha d'aparéixer en una pantalla, endpoint, procés, automatització o flux recognoscible del projecte.

## Encaix dins del Repte 5

- **Repte**: `R5. Integració híbrida i tancament`
- **Microrepte**: `R5M4`
- **Sessió**: `R5S4`
- **Duració orientativa**: `3 hores`
- **Focus**: flux complet, producte real, abans/després, resposta visible i control mínim d'ús
- **No entra encara**: defensa final formal o reobertura general del projecte

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA9.e` | funcionalitat híbrida amb valor de producte |
| `RA9.f` | incidències d'integració controlades |
| `RA8.f` | resposta dinàmica si la integració modifica vista o flux server-rendered |
| `RA7.f` | combinació de serveis si participa l'API pròpia o externa |
| Evidència central | demo completa de la funcionalitat híbrida |
| Verificació docent | execució del flux de punta a punta i commit comentat |

## Producte esperat

Una funcionalitat integrada que incloga:

- punt d'entrada clar per a l'usuari o per al sistema;
- ús del connector i de la transformació;
- combinació amb dades pròpies si aporta valor;
- resultat visible, resposta, acció o automatització observable;
- error controlat quan la font externa falla;
- commit rellevant amb explicació curta.

## Preparació prèvia del professorat

- Definir exemples de flux integrat versus demo aïllada.
- Preparar una pauta de comparativa abans/després.
- Recordar que el mínim és una sola integració completa i defensable.
- Preveure reduccions d'abast per a equips amb incidències tècniques.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Revisió del mapping i decisió de punt d'entrada

Cada equip concreta on apareixerà la integració dins del producte.

### 0:20-0:45. Modelatge d'integració en flux real

El professorat mostra com una peça externa passa per connector, transformació i ús final.

### 0:45-1:45. Implementació del flux híbrid

L'alumnat connecta les peces ja creades amb una pantalla, endpoint, procés o automatització.

### 1:45-2:15. Abans/després i control d'error

Es prepara una comparativa funcional i es comprova què passa si la font externa no respon.

### 2:15-2:40. Commit comentat i evidència de demo

Cada equip identifica el commit rellevant i documenta com reproduir la demo.

### 2:40-3:00. Checkpoint docent

Es fa una prova ràpida de punta a punta o es deixa incidència concreta per tancar en `R5M5`.

## Tasques concretes de l'alumnat

- Triar punt d'entrada del producte.
- Connectar connector, transformació i ús final.
- Mostrar resultat visible o efecte funcional.
- Preparar comparativa abans/després.
- Registrar commit rellevant i incidències.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Funcionalitat | integrada dins del producte real |
| Demo | mostra flux complet amb dades externes |
| Error | resposta controlada si falla la font |
| Abans/després | explica què millora o canvia |
| Commit | identifica la integració principal |

## Criteris d'èxit

- La integració no és un exemple solt.
- El flux és reproduïble.
- El resultat té valor per al producte.
- L'alumnat pot explicar el recorregut complet de dades.

## Què no és suficient

- Deixar el connector funcionant però sense ús en el producte.
- Mostrar dades externes sense transformar ni contextualitzar.
- Fer una automatització que no resol cap necessitat.
- No controlar cap fallada de la font externa.

## Ús de la IA

La IA pot ajudar a revisar el flux o suggerir punts d'integració, però l'alumnat ha de validar la funcionalitat en el seu projecte i registrar decisions rellevants.

## Suport i ampliació

Per a suport, integrar un únic resultat transformat en una pantalla o endpoint existent. Com ampliació, afegir reintent, cache, observabilitat bàsica, comparació de fonts o integració amb l'API pròpia de `R4`.

## Checklist de tancament

- [ ] Punt d'entrada definit.
- [ ] Connector i mapping usats dins del producte.
- [ ] Demo completa preparada.
- [ ] Cas d'error controlat.
- [ ] Comparativa abans/després.
- [ ] Commit rellevant comentat.

## Connexió amb el microrepte posterior

`R5M5` convertirà la integració en una evidència defensable: proves, documentació, mapa final i mini defensa.
