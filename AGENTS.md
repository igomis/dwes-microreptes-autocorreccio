# AGENTS.md

## Criteri transversal d'alineació

Els continguts de `dwes-restructuracio-modul`, `dwes-documentacio-alumnat` i `dwes-microreptes-autocorreccio` han d'estar alineats. Quan es cree, canvie o elimine un repte, sessió o microrepte en un d'estos repositoris, cal revisar si també cal actualitzar els altres dos.

La coherència mínima ha d'incloure:

- mateix codi de repte, sessió i microrepte, per exemple `R2`, `R2S2`, `R2M2`;
- mateix nom funcional del microrepte;
- mateix abast pedagògic;
- mateixos criteris d'avaluació treballats;
- evidències compatibles entre programació d'aula, documentació d'alumnat i autocorrecció;
- mateixa decisió sobre què entra com a mínim i què queda com a ampliació.

## Paper de cada projecte

- `dwes-restructuracio-modul`: font docent de planificació, programació d'aula, seqüenciació, criteris curriculars i decisions metodològiques.
- `dwes-documentacio-alumnat`: materials que veu l'alumnat: reptes, microreptes, instruccions de treball, rúbriques/checklists i materials de suport.
- `dwes-microreptes-autocorreccio`: definició executable de les autocorreccions: `challenge.json`, `rubric.json`, prompts, evidències esperades i proves de revisió.
- `dwes-microreptes-alumnes`: base o plantilla de treball de l'alumnat; ha de reflectir el que es demana en la documentació i el que després es podrà autocorregir.

## Fonts de veritat

Cada repositori té una responsabilitat principal i no ha de contradir les altres fonts:

- La seqüència didàctica, els RA/CA, la programació d'aula i les decisions metodològiques es decideixen en `dwes-restructuracio-modul`.
- L'enunciat, les instruccions i el llenguatge final per a l'alumnat es decideixen en `dwes-documentacio-alumnat`.
- Les evidències autocorregibles, rúbriques tècniques, prompts i regles dures es decideixen en `dwes-microreptes-autocorreccio`.
- L'estructura inicial de treball i les plantilles base per a l'alumnat es decideixen en `dwes-microreptes-alumnes`.

Si hi ha conflicte entre repositoris, no s'ha de resoldre duplicant criteris diferents. Cal ajustar la font corresponent i propagar el canvi.

## Mínim, ampliació i fora d'abast

Cada microrepte ha d'indicar explícitament:

- mínim obligatori;
- ampliació possible;
- continguts o pràctiques que queden fora de moment.

Cap ampliació ha de convertir-se en requisit d'autocorrecció o rúbrica si no està declarada com a mínim en la documentació d'alumnat i en la programació d'aula.

## Coherència d'avaluació

No pot aparéixer en una rúbrica, checklist o autocorrecció cap requisit que no estiga demanat en la documentació d'alumnat i previst en la programació d'aula.

També s'ha de complir la regla inversa: si una evidència és obligatòria per a l'alumnat, ha d'estar contemplada en la rúbrica, checklist o autocorrecció corresponent.

## Convenció de nomenclatura

- `R2S2` identifica la sessió.
- `R2M2` identifica el microrepte.
- En programació d'aula, el títol ha de seguir el patró `R2S2. Nom de la sessió`.
- En documentació d'alumnat, el títol ha de seguir el patró `R2M2. Nom del microrepte` quan es treballe a nivell de microrepte.
- En autocorrecció, l'identificador ha de seguir el patró `r2-s02-nom-curt`.

La nomenclatura ha de ser estable i coherent en `mkdocs.yml`, títols, enllaços, carpetes i fitxers d'autocorrecció.

## Criteri de sessió acabada

Una sessió ordinària amb microrepte no es considera acabada fins que s'han creat o revisat les tres peces:

- programació d'aula en `dwes-restructuracio-modul`;
- documentació d'alumnat en `dwes-documentacio-alumnat`;
- autocorrecció o rúbrica/checklist equivalent en `dwes-microreptes-autocorreccio`.

Les sessions de presentació o tancament dels reptes `2`, `3`, `4` i `5` poden no tindre microrepte ni autocorrecció, però han d'estar identificades explícitament com a sessions sense microrepte propi.

## Estructura esperada de `dwes-documentacio-alumnat`

La documentació d'alumnat ha de diferenciar clarament tres blocs:

- Reptes i microreptes: què ha de construir l'alumnat, què ha d'entregar, requisits mínims i què queda per a més avant.
- Rúbriques, checklists o criteris de sessió/microrepte: com es valorarà cada sessió o microrepte, amb evidències observables.
- Materials de suport per als reptes: guies, consulta tècnica, exemples, plantilles i recursos que ajuden a resoldre el repte sense substituir l'enunciat.

No s'han de mesclar en una mateixa pàgina instruccions de lliurament, rúbrica i material teòric extens si això dificulta que l'alumnat entenga què ha de fer.

## Estructura obligatòria de les programacions d'aula

Les programacions d'aula de `dwes-restructuracio-modul` han de tractar sempre els mateixos punts. Quan es cree o es modifique una autocorrecció, s'ha de comprovar que les evidències i la rúbrica són coherents amb estos apartats de la programació:

- Finalitat de la sessió.
- Encaix dins del repte.
- Relació amb RA, CA i criteris de treball.
- Producte esperat.
- Preparació prèvia del professorat.
- Continguts a explicar.
- Seqüenciació de la sessió.
- Tasques concretes de l'alumnat.
- Evidències mínimes.
- Criteris d'èxit.
- Què no és suficient.
- Ús de la IA.
- Suport per a l'alumnat amb dificultats.
- Ampliació per a l'alumnat més avançat.
- Checklist de tancament.
- Connexió amb el microrepte posterior.

L'autocorrecció no ha d'avaluar apartats docents interns, com la preparació prèvia del professorat, però sí ha de respectar l'abast que estos apartats fixen.

## Relació entre sessions i microreptes

Cada sessió ordinària ha de tindre associat un microrepte. La nomenclatura ha de permetre veure la relació entre repte, sessió i microrepte, per exemple `R2S2` i `R2M2`.

Les úniques excepcions són les sessions de presentació o tancament dels reptes `2`, `3`, `4` i `5`. Estes sessions poden no tindre microrepte associat si la seua funció és introduir el repte, organitzar el treball, fer síntesi, revisar evidències o tancar el procés.

No s'ha de crear autocorrecció per a una sessió sense microrepte si està declarada com a presentació o tancament. Sí que cal autocorrecció quan la sessió és ordinària i té evidències de microrepte.

## Forma de treball

Abans d'editar:

- revisar com està definit el mateix repte o microrepte en `dwes-restructuracio-modul` i `dwes-documentacio-alumnat`;
- comprovar que `challenge.json`, `rubric.json`, `prompt.md`, `expected/README.md` i `tests/README.md` mantenen el mateix abast;
- evitar criteris d'autocorrecció que exigisquen continguts no demanats a l'alumnat.

Després d'editar:

- executar `npm run validate`;
- comprovar que les dimensions de rúbrica siguen compatibles amb el validador;
- revisar que les regles dures no penalitzen absències que s'han definit com a ampliació.
- al final de cada iteració, fer commit i push dels repositoris afectats;
- fer staging selectiu dels fitxers de la iteració i no incloure fitxers aliens o temporals, com `.DS_Store`.
