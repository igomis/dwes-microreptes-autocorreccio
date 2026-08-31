# R4S5. Documentació i prova del servei

## Finalitat de la sessió

Esta sessió treballa `R4M5` i tanca el `Repte 4`. L'objectiu és deixar el servei documentat, provat i defensable perquè una altra persona puga entendre el contracte, executar els casos principals i preparar el pas a `R5`.

Al final de la sessió, cada equip ha de poder contrastar documentació, prova, codi i comportament real del servei.

## Encaix dins del Repte 4

- **Repte**: `R4. API i serveis reutilitzables`
- **Microrepte**: `R4M5`
- **Sessió**: `R4S5`
- **Duració orientativa**: `3 hores`
- **Focus**: documentació d'endpoints, exemples, proves, incidències, correccions i mini defensa tècnica
- **No entra encara**: integració externa completa, orquestració híbrida o ampliacions de `R5`

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA7.f` | prova explícita del servei |
| `RA7.h` | documentació usable per tercers |
| `RA6.g` | registre d'incidències i coherència amb dades reals |
| Evidència central | documentació i registre de proves del servei |
| Verificació docent | contrast entre documentació, demo i codi |

## Producte esperat

- Documentació d'endpoints.
- Exemples de request i response.
- Requisits d'autenticació.
- Casos de prova mínims.
- Errors principals.
- Incidències i correccions.
- Mini defensa tècnica de contracte i consum.

## Preparació prèvia del professorat

- Preparar checklist de documentació d'API.
- Portar exemple de documentació que sí coincideix amb el servei real.
- Preparar preguntes de defensa sobre contracte, autenticació, consum i errors.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Revisió del paquet R4

Cada equip situa contracte, endpoint, protecció i consumidor.

### 0:20-0:55. Modelatge de documentació usable

El professorat mostra una documentació curta però executable.

### 0:55-1:45. Documentació i proves

L'alumnat actualitza README, document d'API, col·lecció o registre de proves.

### 1:45-2:20. Contrast documentació-comportament

Un altre equip intenta executar un cas documentat.

### 2:20-2:45. Incidències i correccions

Es registren discrepàncies i correccions aplicades.

### 2:45-3:00. Mini defensa i pas a R5

Cada equip defensa contracte, prova i possible integració futura.

## Tasques concretes de l'alumnat

- Documentar endpoints, autenticació i errors.
- Afegir exemples de request/response.
- Registrar proves positives i negatives.
- Corregir incoherències entre documentació i codi.
- Identificar quin servei pot alimentar `R5`.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Documentació | permet consumir almenys el flux principal |
| Proves | inclou cas correcte i cas d'error |
| Incidències | registra problemes i correccions |
| Defensa | connecta contracte, codi i resposta real |
| Pas a R5 | identifica possible ús del servei en integració |

## Criteris d'èxit

- La documentació coincideix amb el servei real.
- Les proves són reproduïbles.
- El consumidor confirma que l'API és usable.
- L'alumnat pot defensar decisions i límits.

## Què no és suficient

- Documentació embellida que no executa.
- Captures sense instruccions.
- No registrar incidències.
- Tancar R4 sense cas d'error.

## Ús de la IA

La IA pot ajudar a polir documentació i generar casos de prova, però tot s'ha de contrastar amb execució real.

## Suport i ampliació

Per a suport, documentar un endpoint crític complet. Com ampliació, millorar OpenAPI, col·lecció automatitzada, mocks o contract tests simples.

## Checklist de tancament

- [ ] Documentació d'endpoints.
- [ ] Exemples de request/response.
- [ ] Cas correcte i error.
- [ ] Incidències i correccions.
- [ ] Mini defensa.
- [ ] Possible pas a `R5`.

## Connexió amb el repte posterior

`R5` reutilitzarà l'experiència d'interoperabilitat de `R4`, però canviarà el centre: ja no serà publicar una API pròpia, sinó integrar fonts externes o fluxos híbrids amb valor real.

## Materials associats per a portar a l'aula

- **Presentació associada**: [MT11. Provar i documentar una API](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT11-Documentar-i-comprovar-una-API.pdf)
- **Teoria o material associat**: [Protecció, consum i documentació d'API](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R4-Proteccio-consum-i-documentacio-dAPI.pdf)

## Microtaller associat

- **Microtaller**: `MT11. Provar i documentar una API`
- **Moment recomanat**: abans de tancar `R4` i passar a integració.
- **Evidència mínima**: peticions reproduïbles, un cas d'error i documentació alineada amb el comportament real.
