# Arquitectura

## Visio conceptual

El sistema es planteja amb una separacio clara entre configuracio docent i treball de l'alumnat.

- Repositori central del professor:
  - defineix microreptes;
  - manté rúbriques;
  - publica polítiques globals;
  - conserva prompts base i esquemes de resposta;
  - valida que la configuracio siga coherent.
- Repositoris individuals d'alumnes:
  - contenen el codi de cada alumne;
  - executen workflows propis;
  - aporten evidències de prova, commits i documentacio mínima.
  - mantenen `ENTREGA.md` com a fitxer principal d'entrega; els `README.md` del template són context o índexs de carpeta, no l'evidència principal del microrepte.
- GitHub Actions:
  - valida este repositori central;
  - prepararà l'autocorrecció en repositoris d'alumnes;
  - permetrà execucions manuals de prova.
- Futur connector amb OpenAI:
  - rebrà evidències acotades;
  - retornarà una resposta estructurada segons `global/grading-schema.json`;
  - no substituirà la revisio docent quan hi haja baixa confiança.
- Registre de notes:
  - podrà guardar resultats provisionals;
  - haurà de diferenciar nota automàtica i nota confirmada pel professorat.

## Esquema textual

```text
Professorat
  -> repositori central
    -> microreptes
    -> rubriques
    -> politiques
    -> workflows de validacio

Alumnat
  -> repositori individual
    -> solucio
    -> evidencies
    -> workflow de correccio
      -> consulta configuracio central
      -> genera feedback provisional
      -> marca revisio docent si cal
```

## Decisions inicials

- El repositori central no assumeix cap framework concret d'alumne.
- Les rúbriques són JSON per facilitar validacio automàtica.
- El feedback esperat és estructurat i també inclou resum en Markdown.
- Les notes automàtiques són provisionals fins que la política indique el contrari.
- Les crides a IA queden fora de la primera versio executable.
- L'autocorrecció ha de prioritzar `ENTREGA.md` i els fitxers concrets de `docs/`, `evidence/`, `tests/` i `src/`; no ha de puntuar els README de carpeta del template com si foren treball de l'alumne.
