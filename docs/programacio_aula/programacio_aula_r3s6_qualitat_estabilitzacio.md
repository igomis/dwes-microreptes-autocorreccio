# R3S6. Qualitat i estabilitzacio

## Finalitat de la sessio

Esta sessio converteix els fluxos de `R3` en una base minima mantenible. El repte ja no és afegir més funcionalitat, sinó comprovar que els dos fluxos funcionen, que la BBDD es reconstrueix, que les responsabilitats són explicables i que errors i proves no són ficticis.

## Encaix dins del Repte 3

- **Repte**: `R3. Reconstruccio en framework, persistencia real i primers fluxos funcionals`
- **Microrepte**: `R3M6`
- **Sessio**: `R3S6`
- **Duracio orientativa**: `3 hores`
- **Focus**: proves, errors, validacio, neteja de responsabilitats, regressio i estabilitat
- **No entra encara**: noves funcionalitats grans, API, desplegament o refactoritzacio total

## Relacio amb RA i criteris de treball

| Element | Concrecio en el microrepte |
|---|---|
| `RA5.g` | revisa mantenibilitat i responsabilitats |
| `RA5.h` | millora estructura sense reescriure-ho tot |
| `RA6.f` | verifica fluxos amb dades reals |
| `RA6.g` | documenta i controla errors de persistencia |
| Evidencia central | dos fluxos estables amb proves i errors visibles |

## Producte esperat

- Checklist o proves dels dos fluxos.
- Cas positiu i negatiu.
- Tractament d'errors basic.
- Validacio reforçada quan calga.
- Revisio de controladors, serveis, models o equivalents.
- Comprovacio de migracions/fixtures/seeders o mecanisme equivalent.
- Incidencies detectades i corregides.

## Preparacio previa del professorat

- Preparar checklist de regressio.
- Preparar exemples de controlador massa carregat.
- Preparar pauta de cas positiu/negatiu.
- Preparar exemples d'errors visibles adequats.
- Definir criteri: no s'obri `R4` amb fluxos no reproduïbles.

## Continguts a explicar

- Que és regressio minima.
- Diferencia entre prova manual, checklist i test automatitzat.
- Com detectar responsabilitats barrejades.
- Com documentar errors corregits.
- Com evitar que la neteja trenque migracions o càrrega inicial.

## Sequencia d'aula de 3 hores

### 0:00-0:25. Inventari d'estat

Tasques:

- executar els dos fluxos;
- anotar què falla;
- comprovar migracions i càrrega inicial;
- prioritzar correccions.

### 0:25-0:55. Modelatge docent

El professorat mostra:

- checklist de regressio;
- exemple d'error controlat;
- exemple de neteja de controlador;
- registre d'incidencia i correccio.

### 0:55-1:45. Correccions prioritzades

Tasques:

- corregir error bloquejant;
- reforçar validacio minima;
- evitar duplicacio evident;
- separar responsabilitat si el controlador concentra massa.

### 1:45-2:25. Proves i regressio

Tasques:

- provar cas positiu i negatiu;
- executar reset de BBDD si toca;
- repetir els dos fluxos;
- guardar resultats en README, issue o checklist.

### 2:25-2:50. Documentacio i traçabilitat

Tasques:

- registrar incidencies i correccions;
- fer commits de correccio i prova;
- actualitzar temps aproximat;
- registrar IA usada en depuracio si aplica.

### 2:50-3:00. Checkpoint

Cada equip mostra:

- dos fluxos funcionant;
- un error controlat;
- prova/checklist;
- una millora de responsabilitat o justificacio de per què no cal.

## Tasques concretes de l'alumnat

- Executar dos fluxos.
- Detectar incidencies.
- Corregir les prioritaries.
- Afegir o reforçar validacio.
- Fer prova positiva i negativa.
- Revisar responsabilitats.
- Documentar resultats.

## Evidencies minimes

| Evidencia | Minim acceptable |
|---|---|
| Proves | checklist o proves executades |
| Casos | positiu i negatiu |
| Errors | tractament visible |
| BBDD | migracions i fixtures/seeders o equivalent continuen funcionant |
| Qualitat | revisio de responsabilitats |
| Traçabilitat | incidencies, commits i temps aproximat |

## Criteris d'exit

- Els dos fluxos funcionen després de corregir.
- Les proves no són només text inventat.
- Hi ha almenys un error observable controlat.
- La BBDD es pot reconstruir.
- L'estructura és explicable.

## Que no és suficient

- Fer proves només del cami feliç.
- Afegir funcionalitat nova en lloc d'estabilitzar.
- Documentar proves que no s'han executat.
- Trencar migracions o càrrega inicial.
- Amagar errors sense tractar-los.

## Us de la IA

La IA pot ajudar a interpretar errors, proposar proves o suggerir separacio de responsabilitats. L'alumnat ha d'executar i validar les correccions.

## Suport per a alumnat amb dificultats

- Retallar proves a dos casos essencials.
- Prioritzar un error bloquejant.
- Donar plantilla de checklist.
- Fer revisio guiada d'un controlador.

## Ampliacio per a alumnat avançat

- Afegir test funcional automatitzat.
- Crear servei o repositori quan reduïsca complexitat real.
- Afegir validacions més completes.

## Checklist de tancament

- [ ] Primer flux funciona.
- [ ] Segon flux funciona.
- [ ] Hi ha cas positiu i negatiu.
- [ ] Hi ha error controlat.
- [ ] Migracions i càrrega inicial funcionen.
- [ ] Hi ha registre d'incidencies.
- [ ] Hi ha commits i temps aproximat.

## Connexio amb el microrepte posterior

`R3M7` tancara documentacio, demo i backlog. Esta sessio ha de deixar el projecte prou estable perquè el tancament no siga una llista d'intencions.
