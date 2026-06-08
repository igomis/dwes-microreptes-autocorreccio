# Evidencies esperades

Evidencies minimes:

- flux executable que continue el formulari, reintent o guardat funcional de `R2M2`;
- regla del projecte escrita o explicada en llenguatge natural;
- decisio de servidor connectada a dades reals del flux;
- array o estructura equivalent usada amb sentit funcional;
- fitxer separat de llibreria pròpia, per exemple `src/regles.php`, `includes/regles.php`, `lib/funcions.php` o equivalent;
- import real de la llibreria amb `require_once`, `include_once` o mecanisme equivalent;
- funcio útil dins de la llibreria pròpia, amb nom clar i responsabilitat recognoscible;
- dos casos de prova amb resultats visibles diferents;
- resposta, pantalla, resum o missatge on es veja la decisio presa;
- nota al `README`, issue o registre indicant la regla, les dades utilitzades i com provar els dos casos;
- indicacio d'on està la funcio pròpia i des d'on s'importa;
- commit o traçabilitat del canvi.

Queden fora del minim:

- sessio i cookies;
- login, rols i autoritzacio;
- persistencia formal o base de dades obligatoria;
- MVC o arquitectura completa;
- refactoritzacio general del projecte;
- regles grans o difícils d'explicar.
