# Proves recomanades

Localitza i executa `tests/flux-r2.php`, `tests/flux-r2.sh` o la prova HTTP equivalent amb l'ordre documentada. PHP és la via recomanada, però Bash s'accepta amb els mateixos criteris. Ha de verificar:

1. accés protegit sense autenticar denegat;
2. login incorrecte denegat;
3. login correcte i estat conservat;
4. operació protegida permesa;
5. logout o invalidació;
6. reutilització de l'estat anterior denegada.

Revisa que cada pas faça una asserció observable i que el procés retorne un codi diferent de `0` quan una expectativa falla. Si és segur, canvia temporalment una expectativa o una ruta per comprovar-ho.

Són alternatives vàlides un script Python amb `requests`, el client de Flask, MockMvc o un client HTTP Java si mantenen l'estat i cobrixen el mateix recorregut.

No són suficients una ordre `curl` que només mostra la resposta, una col·lecció sense assercions, una taula manual o una prova unitària aïllada. No cal exigir `PHPUnit`, `pytest`, `JUnit`, mocks ni una suite formal en este microrepte.
