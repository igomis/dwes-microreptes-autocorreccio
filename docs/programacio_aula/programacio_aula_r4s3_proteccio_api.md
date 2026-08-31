# R4S3. Autenticació i control d'accés de l'API

## Finalitat de la sessió

Esta sessió treballa `R4M3`: adaptar el control d'accés al context d'`API`. No es tracta de repetir el login de `R2`, sinó de demostrar que el servei publicat respon de manera diferent quan la petició està autoritzada, no autoritzada o mal formada.

Al final de la sessió, cada equip ha de poder mostrar un cas autoritzat, un cas denegat i el punt del codi on es comprova l'accés.

## Encaix dins del Repte 4

- **Repte**: `R4. API i serveis reutilitzables`
- **Microrepte**: `R4M3`
- **Sessió**: `R4S3`
- **Duració orientativa**: `3 hores`
- **Focus**: token, capçalera, clau o mecanisme coherent; cas autoritzat; cas denegat; resposta d'error clara
- **No entra encara**: sistema complet d'identitats, permisos avançats o seguretat de producció

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA7.e` | servei publicat amb accés controlat |
| `RA7.f` | comprovació de cas correcte i cas incorrecte |
| Evidència central | peticions autoritzades i denegades |
| Verificació docent | execució en directe i pregunta sobre on es comprova l'accés |

## Producte esperat

- Mecanisme de control d'accés coherent amb l'stack.
- Cas autoritzat que obté resposta correcta.
- Cas sense credencial o amb credencial incorrecta.
- Error d'API amb codi i missatge coherents.
- Documentació mínima d'ús de la credencial.

## Preparació prèvia del professorat

- Portar exemples de capçalera `Authorization`, token simple o clau d'API.
- Explicar que el mínim és didàctic, no seguretat completa de producció.
- Preparar prova negativa per absència de credencial.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Risc d'una API oberta

Discussió breu sobre quins recursos poden ser públics i quins no.

### 0:20-0:45. Modelatge de protecció

El professorat mostra una comprovació mínima i respostes `401`, `403` o equivalents.

### 0:45-1:35. Implementació del control

L'alumnat incorpora el mecanisme triat a l'endpoint o conjunt mínim d'endpoints.

### 1:35-2:15. Prova positiva i negativa

Es prova amb credencial correcta, sense credencial i amb credencial incorrecta.

### 2:15-2:40. Documentació del comportament

S'afegeix al README o document d'API com s'envia la credencial i què passa si falla.

### 2:40-3:00. Checkpoint docent

Demo autoritzada i denegada.

## Tasques concretes de l'alumnat

- Triar mecanisme de protecció adequat al nivell.
- Implementar comprovació real.
- Retornar error coherent quan falta o falla la credencial.
- Provar cas autoritzat i denegat.
- Documentar com enviar la credencial.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Control d'accés | no és només decoratiu |
| Cas autoritzat | retorna la resposta esperada |
| Cas denegat | bloqueja l'accés amb codi coherent |
| Documentació | explica com autenticar la petició |
| Demo | mostra els dos comportaments |

## Criteris d'èxit

- La protecció és observable.
- El comportament d'error és coherent.
- L'alumnat sap on i quan es comprova l'accés.
- El mecanisme no contradiu el contracte.

## Què no és suficient

- Posar un token al README però no comprovar-lo.
- Retornar sempre el mateix resultat.
- Fer login web complet si no cal.
- No provar cas denegat.

## Ús de la IA

La IA pot suggerir patrons, però l'alumnat ha de justificar la tria i demostrar que el control funciona.

## Suport i ampliació

Per a suport, usar una clau d'API didàctica i documentada. Com ampliació, separar permisos, rols o scopes simples.

## Checklist de tancament

- [ ] Mecanisme triat i justificat.
- [ ] Cas autoritzat.
- [ ] Cas denegat.
- [ ] Error coherent.
- [ ] Documentació actualitzada.

## Connexió amb el microrepte posterior

`R4M4` consumirà el servei. El consumidor ha de saber enviar credencials i tractar errors.
