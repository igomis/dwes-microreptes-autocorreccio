# Ampliació 9→10 per repte

Les notes dels microreptes es mantenen separades sobre 10. El programa no calcula una nota global del repte ni aplica pesos entre microreptes.

Cada repte pot generar una valoració d’ampliació independent entre `0` i `1`, en passos de `0,25`. Esta dada servix al professorat com a evidència per a la defensa oral:

- `proposed_score`: proposta provisional de l’autocorrecció;
- `validated_score`: valor confirmat pel professorat després de comprovar que l’ampliació és real, verificable i defensable;
- l’absència d’ampliació no modifica cap nota de microrepte;
- la valoració no se suma automàticament a un RA ni genera una nota del repte.

| Repte | Microrepte que recull l’ampliació | Declaració |
| --- | --- | --- |
| R1 | R1M2 | `docs/r1-ampliacio.md` |
| R2 | R2M9 | `docs/r2-ampliacio.md` |
| R3 | R3M7 | `docs/r3-ampliacio.md` |
| R4 | R4M5 | `docs/r4-ampliacio.md` |
| R5 | R5M5 | `docs/r5-ampliacio.md` |

L’autocorrecció prepara una proposta i preguntes de contrast; el professor valida la valoració durant la defensa. El camp queda separat de `final_score_over_10` i de `ra_scores`. Una nova evidència d’ampliació invalida una revisió anterior, però els canvis en les notes dels altres microreptes no alteren esta valoració.

| Qualitat de l’ampliació | Valoració |
| --- | ---: |
| Absent o no funcional | 0 |
| Parcial, amb mancances importants | 0,25 |
| Funcional, amb verificació o justificació incompleta | 0,50 |
| Completa i verificada, amb una mancança menor | 0,75 |
| Completa, verificada i ben justificada en la defensa | 1 |

L’últim `challenge.json` ordinari de cada repte conté `repte_extension`. `npm run validate` comprova que hi haja un únic propietari per repte. La proposta i la validació es conserven en JSON, CSV i en el dashboard, sense produir cap camp de nota global calculada.
