# R3S6. Esdeveniments i correu

## Finalitat de la sessió

Ampliar una acció protegida amb una reacció del framework que envie un correu quan el canvi ja està confirmat.

## Encaix dins del repte

R3 · R3S6 · R3M6 · 3 hores

## Relació amb RA, CA i criteris

RA5.g i RA5.h orienten la separació entre l’operació, l’esdeveniment i el listener. RA6.f i RA6.g contextualitzen la confirmació de les dades i els errors.

## Producte esperat

- Tria una acció protegida existent i emet un esdeveniment de domini quan l’operació ha quedat confirmada. Si hi ha transacció, el correu només es pot generar després del commit.
- Connecta un listener o equivalent que prepare un correu per a un destinatari demo determinat pel domini. Usa una bústia local o el mecanisme de proves del framework.
- Guarda els resultats de tres casos: èxit amb un únic correu per al destinatari esperat, error sense correu i accés denegat sense correu.

## Preparació prèvia del professorat

Prepara l’acció d’exemple, dos usuaris demo i un transport local o simulat.

## Continguts a explicar

En Laravel, seguix el recorregut `IntercanviCompletat` → listener → `Mailable`. Per exemple, en completar un intercanvi, avisa l’altra persona amb una bústia local com Mailpit o comprova el destinatari amb `Mail::fake()` en una prova funcional. En Symfony, Django o NestJS, usa el mecanisme equivalent d’esdeveniments o senyals i correu.

## Seqüència d’aula

| Temps | Treball |
|---|---|
| 0:00–0:35 | Retorn d’R3M5, consolidació i comprovació de l’acció protegida. |
| 0:35–1:05 | Modelatge de l’esdeveniment, el listener i el correu. |
| 1:05–2:05 | Implementació guiada al projecte. |
| 2:05–2:40 | Execució i registre dels tres casos. |
| 2:40–3:00 | Demostració breu, commits i diagnòstic individual. |

## Tasques de l’alumnat

Tria l’acció, definix el destinatari, connecta el listener, configura el transport de prova i verifica el flux.

## Evidències mínimes

Codi, commits, instruccions de reproducció i resultat dels tres casos.

## Criteris d’èxit

Un correu per a l’èxit i zero per a l’error o la denegació.

## Què no és suficient

Una captura d’un correu sense evidència que prové de l’esdeveniment de l’acció.

## Ús de la IA

Si s’utilitza, registra la consulta i valida el resultat amb els tres casos.

## Suport per a l’alumnat amb dificultats

Facilita un esquema de listener i una bústia de prova. Comença per una acció que ja tinga els permisos verificats.

## Ampliació possible

Personalitza el contingut del correu amb dades del domini i comprova-les en una prova.

## Fora d’abast

El mínim es resol amb transport local o simulat. Les cues, l’SMTP real i l’API queden fora de la sessió.

## Checklist de tancament

- [ ] Esdeveniment emés després de confirmar l’operació.
- [ ] Listener i destinatari verificats.
- [ ] Error i denegació sense enviament.
- [ ] Evidències i configuració de prova reproduïbles.

## Connexió amb el microrepte posterior

R3M7 comprova la regressió de tots els fluxos des d’una còpia neta.
