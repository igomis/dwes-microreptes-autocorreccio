# Evidències esperades

- `tests/flux-r2.php` com a via recomanada, `tests/flux-r2.sh` o prova HTTP equivalent executable;
- denegació inicial d'una operació protegida;
- login incorrecte denegat i login demo correcte acceptat;
- cookies o token conservats entre peticions;
- operació protegida autenticada permesa;
- logout o invalidació i denegació final;
- assercions sobre codis, redireccions o textos estables;
- codi d'eixida diferent de `0` davant una expectativa incomplida;
- URL configurable, credencials demo i neteja de temporals;
- una única ordre documentada;
- eixida real en `evidence/r2m7/verificacio.txt` o equivalent;
- incidències o confirmació que no n'hi ha;
- `README.md` o guia actualitzada.

Fora del mínim: proves unitàries obligatòries, `PHPUnit`, `pytest`, `JUnit`, mocks i suite formal. Una prova unitària no substituïx el flux HTTP.
