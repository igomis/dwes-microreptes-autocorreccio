# Evidència esperada

Un lliurament acceptable hauria de mostrar:

- `database/schema.sql` o instruccions equivalents per crear la taula.
- Un fitxer de configuració de connexió separat, per exemple `config/database.php`.
- Cap credencial real en fitxers versionats.
- Codi que connecta amb `PDO` o mecanisme equivalent justificat.
- Un `INSERT` amb dades que venen del flux validat.
- Un `SELECT` que recupera dades persistides.
- Ús de `prepare` i `execute` quan hi ha dades d'usuari.
- `README` amb passos per crear la BBDD i provar alta/lectura.
- Evidència que el flux principal de R2 continua funcionant.

No cal que hi haja ORM, migrations, seeders, framework ni una capa completa de repositori.
