# Flux de treball

## Flux previst

1. El professor defineix l'autocorrecció de sessió en el repositori central.
2. L'alumne treballa al seu repositori individual.
3. L'alumne actualitza `ENTREGA.md` i els fitxers concrets del microrepte.
4. L'alumne fa `push`.
5. El workflow de correcció recull evidències i configuracio.
6. El sistema genera feedback provisional.
7. El professor revisa si hi ha flags, baixa confiança o necessitat docent.

El `README.md` arrel i els README de carpeta del template serveixen per orientar el repositori. No són, per defecte, documents d'entrega.

## Autocorrecció activa centralitzada pel professor

El professor pot mantindre una configuracio central que indique quina autocorrecció està activa per grup o per alumne.

El comportament esperat és:

- si un alumne té override, s'aplica la seua autocorrecció específica;
- si no té override, hereta l'autocorrecció activa del seu grup;
- si no hi ha assignacio, el workflow ha de fallar de forma clara i demanar configuracio.

## Feedback provisional

El feedback automàtic ha de:

- explicar punts forts;
- prioritzar millores concretes;
- indicar evidències absents;
- separar clarament la nota provisional de la revisio docent.
