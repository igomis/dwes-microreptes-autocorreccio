# Flux de treball

## Flux previst

1. El professor defineix el microrepte en el repositori central.
2. L'alumne treballa al seu repositori individual.
3. L'alumne fa `push`.
4. El workflow de correcció recull evidències i configuracio.
5. El sistema genera feedback provisional.
6. El professor revisa si hi ha flags, baixa confiança o necessitat docent.

## Microrepte actiu centralitzat pel professor

El professor pot mantindre una configuracio central que indique quin microrepte està actiu per grup o per alumne.

El comportament esperat és:

- si un alumne té override, s'aplica el seu microrepte específic;
- si no té override, hereta el microrepte actiu del seu grup;
- si no hi ha assignacio, el workflow ha de fallar de forma clara i demanar configuracio.

## Feedback provisional

El feedback automàtic ha de:

- explicar punts forts;
- prioritzar millores concretes;
- indicar evidències absents;
- separar clarament la nota provisional de la revisio docent.
