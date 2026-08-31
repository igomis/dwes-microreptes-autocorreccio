# R4S4. Consum real del servei

## Finalitat de la sessió

Esta sessió treballa `R4M4`: demostrar que l'`API` és reusable. El servei no queda validat només perquè el servidor responga; cal consumir-lo amb una eina, script, client o peça del sistema i observar què passa en cas correcte i en cas d'error.

Al final de la sessió, cada equip ha de poder executar un consumidor mínim, llegir la resposta i explicar què necessitaria un tercer per usar el servei.

## Encaix dins del Repte 4

- **Repte**: `R4. API i serveis reutilitzables`
- **Microrepte**: `R4M4`
- **Sessió**: `R4S4`
- **Duració orientativa**: `3 hores`
- **Focus**: consumidor mínim, col·lecció de proves, script o client; lectura de resposta; tractament mínim d'error
- **No entra encara**: integració híbrida completa de `R5` o automatització externa com a centre del treball

## Relació amb RA i criteris de treball

| Element | Concreció en el microrepte |
|---|---|
| `RA7.f` | prova del servei en condicions d'ús |
| `RA7.g` | consum del servei des d'un client o eina |
| Evidència central | consumidor mínim o prova equivalent |
| Verificació docent | execució en directe del consumidor |

## Producte esperat

- Col·lecció de proves, script, vista, component o client mínim.
- Consum correcte del servei.
- Tractament d'un error o resposta inesperada.
- Instruccions de reproducció.
- Evidència de consum real.

## Preparació prèvia del professorat

- Portar exemple de consum amb `curl`, Postman/Insomnia, script o client simple.
- Preparar un cas d'error: credencial incorrecta, endpoint no trobat o dada invàlida.
- Reforçar que `R5` encara no comença: ací es valida la reutilització del servei.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Què vol dir consumir una API

El professorat diferencia provar el servidor de consumir un contracte.

### 0:20-0:45. Modelatge de consumidor mínim

Es mostra una petició completa amb capçaleres, cos si cal, lectura de resposta i error.

### 0:45-1:40. Construcció del consumidor

L'alumnat prepara l'eina, script o peça client.

### 1:40-2:15. Cas correcte i cas d'error

Es comprova resposta vàlida i comportament davant error o denegació.

### 2:15-2:40. Instruccions de reproducció

S'afegeix al README o documentació com executar el consumidor.

### 2:40-3:00. Checkpoint docent

Demo del consumidor i pregunta sobre requisits per a tercers.

## Tasques concretes de l'alumnat

- Crear o configurar consumidor mínim.
- Enviar petició correcta amb credencial si cal.
- Llegir i interpretar resposta.
- Provocar i documentar un error.
- Escriure instruccions de reproducció.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Consumidor | executa petició real al servei |
| Cas correcte | mostra resposta usable |
| Error | tracta un cas negatiu |
| Instruccions | permeten repetir el consum |
| Contracte | es contrasta amb el resultat observat |

## Criteris d'èxit

- L'API és consumible fora del codi intern.
- El consumidor no és ornamental.
- El cas d'error està documentat.
- La resposta es pot interpretar.

## Què no és suficient

- Mirar la resposta només al navegador.
- Captura sense instruccions.
- Consum que no envia credencial quan el servei la requereix.
- No mostrar cap error.

## Ús de la IA

La IA pot ajudar a escriure un script o col·lecció, però l'alumnat ha de verificar-la i adaptar-la al contracte real.

## Suport i ampliació

Per a suport, usar una col·lecció amb dues peticions. Com ampliació, crear client simple, tests automatitzats o consumidor amb millor tractament d'errors.

## Checklist de tancament

- [ ] Consumidor mínim.
- [ ] Cas correcte.
- [ ] Cas d'error.
- [ ] Instruccions de reproducció.
- [ ] Contracte contrastat.

## Connexió amb el microrepte posterior

`R4M5` tancarà el servei amb documentació, proves i defensa. El consumidor aporta la prova que l'API és realment reusable.
