# Tests del microrepte

Estratègia de comprovació manual:

- executar o revisar `docker compose up` o ordre equivalent;
- obrir la URL del servei web documentada;
- comprovar que existeixen serveis per a `PHP`, servidor web, BBDD i phpMyAdmin quan corresponga;
- obrir phpMyAdmin o revisar que el servei està definit i accessible;
- obrir la ruta, vista, endpoint, landing mínima o healthcheck documentat;
- comprovar que la resposta ve del backend i no és només una maqueta estàtica desconnectada;
- seguir el `README` buscant passos ocults;
- revisar documentació, decisió tècnica, incidències i pendent de pas a R2;
- demanar a l'alumne què fa cada servei, quin fitxer respon a la petició i què ha adaptat respecte del model docent.

Si l'entorn no arranca, comprova que hi ha log d'error, hipòtesi de causa, canvi intentat i pròxima acció. Si no hi ha punt d'entrada funcional, la sessió no acredita el tancament de R1.
