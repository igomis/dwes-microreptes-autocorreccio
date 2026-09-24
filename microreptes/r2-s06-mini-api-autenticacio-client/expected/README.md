# Evidència esperada

Un lliurament acceptable hauria de mostrar:

- endpoint de login API;
- respostes `JSON`;
- codi `200` amb credencials correctes;
- codi `401` amb credencials incorrectes o sense token;
- token simple o mecanisme equivalent documentat;
- ruta protegida que comprova el token;
- prova externa amb `curl`, Postman/Insomnia o `fetch`;
- documentació del contracte perquè DWEC el puga consumir.

S'accepten igualment endpoints PHP o rutes Python/Flask/FastAPI que complisquen el mateix contracte HTTP; no s'avalua la sintaxi del llenguatge.

No cal que hi haja JWT professional, OAuth, refresh tokens, OpenAPI ni API completa.
