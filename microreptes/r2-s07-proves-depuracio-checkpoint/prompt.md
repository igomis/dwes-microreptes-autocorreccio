# Prompt base del corrector

Avalua `r2-s07-proves-depuracio-checkpoint` només amb evidències del repositori i, quan l'entorn ho permeta, amb una execució real.

Localitza `tests/flux-r2.sh` o una prova HTTP equivalent en Python o Java. Ha d'executar en ordre:

1. accés sense autenticar a una operació protegida i denegació;
2. login incorrecte i denegació;
3. login correcte i obtenció de sessió o token;
4. operació protegida autenticada i resultat permés;
5. logout o invalidació;
6. reutilització de l'estat anterior i nova denegació.

Comprova que la URL base és configurable, que s'usen credencials demo, que les cookies o el token es conserven entre peticions i que els temporals es netegen. Cada cas ha de contindre una asserció sobre un codi HTTP, una redirecció o un text estable. Qualsevol expectativa incomplida ha de produir un codi d'eixida diferent de `0`.

La documentació ha d'incloure una única ordre d'execució, els requisits previs i una eixida real en `evidence/r2m7/verificacio.txt` o equivalent. Revisa també les incidències i correccions registrades.

No acceptes com a prova automàtica suficient:

- una ordre `curl` que només imprimix la resposta;
- una col·lecció de peticions sense assercions executables;
- captures o una taula manual sense el guió;
- un script que sempre acaba correctament;
- una prova unitària que no recorre el flux HTTP.

## Compatibilitat amb Python i Java

Accepta `requests`, el client de proves de Flask, MockMvc o un client HTTP equivalent si cobrix els sis passos, conserva l'estat i falla automàticament. No exigisques `PHPUnit`, `pytest`, `JUnit`, mocks ni una suite formal. Eixes proves unitàries corresponen a `R2M8` i complementen, però no substituïxen, `R2M7`.

Marca revisió docent si no es pot executar l'aplicació o si la documentació afirma resultats que no es poden contrastar amb el repositori.
