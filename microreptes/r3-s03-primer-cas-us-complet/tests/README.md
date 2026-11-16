# Estratègia de prova

1. Identificar el flux heretat d'R2 i l'entrada que processa.
2. Executar el recorregut complet i revisar ruta i controlador.
3. Si crea o modifica dades, revisar GET/POST, formulari server-rendered, CSRF, reintent i redireccio.
4. Verificar que les dades provenen de BBDD i no d'arrays fixos.
5. Provar el cas positiu i comprovar resposta i canvi persistent.
6. Provocar una entrada invalida i comprovar error visible.
7. Verificar que el cas invalid no crea ni modifica dades parcialment.
8. Revisar que validacio, regla, coordinacio, persistencia i presentacio no queden concentrades en una sola peça.
