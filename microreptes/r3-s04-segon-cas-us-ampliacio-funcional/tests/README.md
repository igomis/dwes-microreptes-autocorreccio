# Estratègia de prova

1. Localitzar el component de vista i comprovar dos usos amb dades d'entrada.
2. Executar una actualitzacio correcta amb `PUT/PATCH` o equivalent i revisar BBDD i resposta.
3. Enviar una actualitzacio invalida i comprovar que la BBDD no canvia.
4. Executar una eliminacio correcta amb `DELETE` o equivalent.
5. Provar una eliminacio denegada i un identificador inexistent.
6. Provocar una fallada i comprovar `rollback` si l'operacio modifica diversos registres.
7. Repetir el primer flux d'R3M3.
