# Evidència esperada

Un lliurament acceptable hauria de mostrar:

- `database/schema.sql` o instruccions equivalents per crear la taula.
- Un fitxer de configuració de connexió separat, per exemple `config/database.php`, `config/database.py` o equivalent.
- Cap credencial real en fitxers versionats.
- Codi que connecta amb `PDO` en PHP, `sqlite3` o un connector DB-API en Python, o mecanisme equivalent justificat.
- Un `INSERT` amb dades que venen del flux validat.
- Un `SELECT` que recupera dades persistides.
- Ús de consultes preparades o parametritzades quan hi ha dades d'usuari, amb l'API pròpia del connector PHP o Python.
- `README` amb passos per crear la BBDD i provar alta/lectura.
- Evidència que el flux principal de R2 continua funcionant.

No cal que hi haja ORM, migrations, seeders, framework ni una capa completa de repositori.

Ampliació opcional del repte: si es presenta, és obligatori crear `docs/r2-ampliacio.md` amb descripció, referències a la implementació i proves. Sense este fitxer no es considera presentada la candidatura 9→10. Es revisa separadament en R2M9; el professorat valida 0–1 en la presentació. No altera la nota del microrepte.
