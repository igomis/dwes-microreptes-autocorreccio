# R5S3. Transformació, mapping i valor afegit

## Finalitat de la sessió

Esta sessió treballa el microrepte `R5M3`. L'objectiu és transformar la informació externa perquè tinga sentit dins del domini del projecte i no quede com una simple visualització de dades alienes.

Al final de la sessió, cada equip ha de mostrar una comparativa entre la resposta externa i el resultat transformat, amb criteris clars de selecció, descart i valor afegit.

## Encaix dins del Repte 5

- **Repte**: `R5. Integració híbrida i tancament`
- **Microrepte**: `R5M3`
- **Sessió**: `R5S3`
- **Duració orientativa**: `3 hores`
- **Focus**: mapping, normalització, filtrat, enriquiment, coherència amb el domini i comparativa
- **No entra encara**: tancament complet, defensa final o ampliacions d'orquestració

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA9.d` | transformació de dades externes |
| `RA9.e` | integració coherent amb el domini del producte |
| `RA6.c` | ús de dades pròpies només si el mapping les combina o les consulta |
| `RA6.d` | persistència o integritat només si és necessària |
| Evidència central | taula de mapping i codi de transformació |
| Verificació docent | explicació de tres camps: origen, transformació i ús final |

## Producte esperat

Una capa de transformació que incloga:

- esquema o taula de mapping;
- funció, servei o classe que convertisca la resposta externa;
- filtrat de camps no útils;
- normalització de noms, formats, unitats o estats quan calga;
- comparativa font externa / resultat final;
- justificació del valor afegit.

## Preparació prèvia del professorat

- Portar una resposta externa real amb camps sobrants, formats irregulars o noms poc clars.
- Preparar un exemple de mapping senzill.
- Recordar que transformar no és embellir: és adaptar al domini.
- Definir quan té sentit persistir i quan no.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Lectura crítica de la resposta externa

L'alumnat identifica camps útils, camps sobrants, errors possibles i diferències de format.

### 0:20-0:45. Modelatge de mapping

El professorat mostra una taula amb camp extern, transformació, camp intern, ús final i risc.

### 0:45-1:35. Implementació de la transformació

Cada equip construeix una peça de transformació localitzable i executable.

### 1:35-2:10. Coherència amb el domini

Es revisa si el resultat transformat parla el llenguatge del producte i no el de la font externa.

### 2:10-2:40. Comparativa i evidència

Es documenta un exemple abans/després amb dades reals o anonimitzades.

### 2:40-3:00. Checkpoint docent

L'alumnat defensa el mapping de tres camps i justifica què descarta.

## Tasques concretes de l'alumnat

- Crear taula de mapping.
- Implementar transformació separada.
- Normalitzar o filtrar dades.
- Comparar resposta externa i resultat integrat.
- Indicar si hi ha persistència i per què.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Mapping | mostra origen, transformació i ús final |
| Codi | transforma dades en una peça localitzable |
| Filtrat | elimina o ignora informació no útil |
| Comparativa | contrasta resposta externa i resultat final |
| Valor | explica què aporta al producte |

## Criteris d'èxit

- El producte no depén del format cru de la font externa.
- El mapping és comprensible.
- La transformació aporta valor funcional.
- L'alumnat sap justificar dades usades i descartades.

## Què no és suficient

- Mostrar el JSON extern tal qual.
- Canviar només colors o etiquetes en pantalla.
- Fer transformacions que no responen a cap necessitat del producte.
- Persistir dades externes sense criteri.

## Ús de la IA

La IA pot ajudar a proposar mappings o normalitzacions, però cal validar-los amb exemples reals. Les decisions sobre què es conserva, què es descarta i què s'adapta són responsabilitat de l'alumnat.

## Suport i ampliació

Per a suport, limitar el mapping a cinc camps essencials. Com ampliació, afegir validació de dades externes, normalització robusta, cache o test automàtic de transformació.

## Checklist de tancament

- [ ] Taula de mapping.
- [ ] Transformació implementada.
- [ ] Comparativa abans/després.
- [ ] Criteris de descart documentats.
- [ ] Valor funcional justificat.

## Connexió amb el microrepte posterior

`R5M4` integrarà el resultat transformat dins d'una funcionalitat real del producte. Si el mapping no està clar, la funcionalitat híbrida serà fràgil i difícil de defensar.

## Materials associats per a portar a l'aula

- **Presentació associada**: [MT14. Mapping de resposta externa](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT14-Mapping-de-resposta-externa.pdf)
- **Teoria o material associat**: [Mapping, proves i defensa d'una integració](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R5-Mapping-proves-i-defensa-duna-integracio.pdf)

## Microtaller associat

- **Microtaller**: `MT14. Mapping de resposta externa`
- **Moment recomanat**: quan ja hi ha resposta externa i abans d'integrar-la en el flux final.
- **Evidència mínima**: taula de mapping, transformació i cas amb dada incompleta o inesperada.
