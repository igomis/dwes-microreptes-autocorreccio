# R3S4. Segon cas d'us o ampliacio funcional

## Finalitat de la sessio

Esta sessio evita que `R3` quede reduït a un únic flux demostratiu. L'alumnat ha d'implementar un segon recorregut end-to-end o una ampliacio funcional xicoteta però útil, aprofitant la base en framework i la BBDD real.

## Encaix dins del Repte 3

- **Repte**: `R3. Reconstruccio en framework, persistencia real i primers fluxos funcionals`
- **Microrepte**: `R3M4`
- **Sessio**: `R3S4`
- **Duracio orientativa**: `3 hores`
- **Focus**: segon flux, canvi dinàmic, reutilitzacio d'estructura, BBDD i verificacio
- **No entra encara**: API, integracio externa, rols complexos o funcionalitat massa gran

## Relacio amb RA i criteris de treball

| Element | Concrecio en el microrepte |
|---|---|
| `RA5.e` | afegeix nova entrada al framework |
| `RA5.f` | reutilitza estructura de responsabilitats |
| `RA5.g` | manté el codi explicable |
| `RA5.h` | amplia sense duplicacio buida |
| `RA6.c`, `RA6.d`, `RA6.f` | usa i verifica dades persistents |
| `RA8.f` | modifica resposta segons dades, parametres o interaccio |
| Evidencia central | segon flux funcional que aporta valor real |

## Producte esperat

- Segon cas d'us migrat o ampliacio funcional.
- Ruta i controlador o equivalents.
- Interaccio amb BBDD real.
- Canvi visible segons dades, parametre, estat, filtre o formulari.
- Validacio o error minim.
- Demo o prova del recorregut.
- Prova que el primer flux continua funcionant.

## Preparacio previa del professorat

- Preparar exemples de segons fluxos menuts.
- Preparar criteris per detectar canvis cosmeticos.
- Tindre pauta de regressio del primer flux.
- Preparar exemple de filtre, detall, canvi d'estat o alta simple.

## Continguts a explicar

- Diferencia entre ampliacio funcional i canvi visual.
- Com reutilitzar rutes, serveis, models o plantilles sense copiar sense criteri.
- Com provar dos fluxos sense convertir-ho en una suite extensa.
- Com decidir abast per no obrir una funcionalitat massa gran.

## Sequencia d'aula de 3 hores

### 0:00-0:25. Decisio del segon flux

Tasques:

- decidir si és migracio o ampliacio;
- escriure quin valor aporta;
- comprovar que no duplica el primer flux;
- identificar dades necessaries.

### 0:25-0:50. Modelatge docent

El professorat mostra un exemple curt de segon flux:

- detall d'un registre;
- filtre;
- alta simple;
- canvi d'estat;
- validacio amb error visible.

### 0:50-1:45. Implementacio

Tasques:

- crear ruta;
- crear controlador o equivalent;
- recuperar o modificar dades;
- preparar resposta dinàmica;
- reutilitzar vista, servei o model quan tinga sentit.

### 1:45-2:20. Validacio i regressio

Tasques:

- afegir validacio o error minim;
- provar segon flux;
- tornar a provar primer flux;
- revisar duplicacions evidents.

### 2:20-2:50. Documentacio i commits

Tasques:

- descriure el segon flux;
- justificar valor funcional;
- registrar prova dels dos fluxos;
- registrar commits i temps aproximat.

### 2:50-3:00. Checkpoint

Cada equip mostra:

- segon flux executat;
- canvi dinàmic visible;
- BBDD implicada;
- primer flux encara funcional.

## Tasques concretes de l'alumnat

- Decidir segon flux.
- Implementar ruta/controlador.
- Usar BBDD real.
- Generar resposta dinàmica.
- Afegir validacio o error.
- Provar primer i segon flux.
- Documentar valor i abast.

## Evidencies minimes

| Evidencia | Minim acceptable |
|---|---|
| Segon flux | descrit i justificat |
| Ruta/controlador | executables |
| Dades | BBDD real implicada |
| Dinamisme | resposta canvia segons dades o interaccio |
| Regressio | primer flux continua funcionant |
| Traçabilitat | commits i temps aproximat |

## Criteris d'exit

- El segon flux és funcional.
- No és una pantalla estatica.
- Aprofita estructura del framework.
- No trenca el primer flux.
- L'alumnat pot explicar què aporta.

## Que no és suficient

- Afegir una vista sense dades.
- Duplicar el primer flux canviant noms.
- Obrir una funcionalitat que queda a mitges.
- Fer només estils o navegacio.
- No provar regressio.

## Us de la IA

La IA pot suggerir idees de segon flux i casos de prova. L'alumnat ha de justificar per què eixa opcio aporta valor al producte i verificar-la en el projecte real.

## Suport per a alumnat amb dificultats

- Proposar detall o filtre com a segon flux.
- Reduir a una sola entitat.
- Donar plantilla de prova de regressio.
- Revisar duplicacions amb parella de contrast.

## Ampliacio per a alumnat avançat

- Afegir relacio simple entre entitats.
- Crear servei reutilitzable.
- Afegir test funcional automatitzat.

## Checklist de tancament

- [ ] Segon flux decidit.
- [ ] Hi ha ruta i controlador.
- [ ] Usa BBDD real.
- [ ] Hi ha canvi dinàmic.
- [ ] Hi ha validacio o error.
- [ ] Primer flux continua funcionant.
- [ ] Hi ha commits i temps aproximat.

## Connexio amb el microrepte posterior

`R3M5` protegira una accio significativa amb autenticacio, autoritzacio i middleware o equivalent. Per això el segon flux ha de quedar funcional i prou clar per poder decidir què té sentit protegir.

## Materials associats per a portar a l'aula

- **Presentació associada**: [MT09. On pose la lògica](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT09-On-pose-la-logica.pdf)
- **Teoria o material associat**: [Rutes, controladors, vistes i flux end-to-end](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R3-Rutes-controladors-vistes-i-flux-end-to-end.pdf)

## Microtaller associat

- **Microtaller**: `MT09. On pose la lògica`
- **Moment recomanat**: quan el segon cas d'ús confirma si l'estructura aguanta noves regles sense duplicar codi.
- **Evidència mínima**: una regla nova situada en la capa adequada i comparada amb el primer cas d'ús.
