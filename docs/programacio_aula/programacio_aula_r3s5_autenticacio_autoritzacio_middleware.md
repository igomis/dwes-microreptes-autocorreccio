# R3S5. Autenticacio, autoritzacio i middleware

## Finalitat de la sessio

Esta sessio introdueix la seguretat pròpia del framework dins de `R3`. L'alumnat ja ha treballat autenticacio en `R2`, però ara ha d'usar les peces del framework per protegir una accio significativa: middleware, guard, voter, policy o mecanisme equivalent.

L'objectiu no és muntar un sistema complet de rols, sinó diferenciar clarament autenticacio, autoritzacio i proteccio real en servidor.

## Encaix dins del Repte 3

- **Repte**: `R3. Reconstruccio en framework, persistencia real i primers fluxos funcionals`
- **Microrepte**: `R3M5`
- **Sessio**: `R3S5`
- **Duracio orientativa**: `3 hores`
- **Focus**: login, logout, accio protegida, middleware/guard/voter/policy, cas autoritzat i cas denegat
- **No entra encara**: OAuth, 2FA, sistema complet de rols, JWT avançat, API completa o gestio d'usuaris complexa

## Relacio amb RA i criteris de treball

| Element | Concrecio en el microrepte |
|---|---|
| `RA5.f` | integra seguretat en l'estructura del framework |
| `RA5.g` | separa responsabilitats entre ruta, controlador i proteccio |
| `RA5.h` | evita proteccions visuals o duplicades |
| `RA6.f` | controla errors i accessos vinculats a dades o estat |
| `RA8.g` | usa mecanismes del framework en un flux dinàmic |
| Evidencia central | accio protegida amb cas autoritzat i cas denegat |

## Producte esperat

- Login o mecanisme d'autenticacio funcional.
- Logout o invalidacio de sessio/token.
- Usuari demo reproduïble.
- Accio significativa protegida en servidor.
- Middleware, guard, voter, policy o equivalent.
- Regla d'autoritzacio mínima vinculada al domini.
- Cas autoritzat i cas denegat verificats.
- README o nota de prova.

## Preparacio previa del professorat

- Preparar equivalencies entre stacks:
  - `Laravel`: middleware, guard, policy.
  - `Symfony`: security, access control, voter.
  - `NestJS`: guard, middleware, decorator, pipe.
- Preparar exemple de proteccio incorrecta: botó ocult però ruta accessible.
- Tindre criteri de mínim: una accio real protegida i cas denegat verificable.

## Continguts a explicar

- Diferencia entre autenticacio i autoritzacio.
- Per què ocultar una vista no protegeix el servidor.
- On s'aplica la proteccio segons el framework.
- Com documentar credencials demo sense exposar secrets reals.
- Com provar cas sense autenticar, cas autoritzat, cas denegat i logout.

## Sequencia d'aula de 3 hores

### 0:00-0:25. Recuperacio de R2 i canvi de mentalitat

Tasques:

- recordar què feia l'autenticacio en `R2`;
- identificar què canvia en un framework;
- triar una accio significativa que tinga sentit protegir;
- descartar proteccions només visuals.

### 0:25-0:55. Modelatge docent

El professorat mostra:

- login o usuari demo;
- ruta protegida;
- middleware/guard/voter/policy o equivalent;
- resposta denegada;
- logout o invalidacio.

### 0:55-1:40. Implementacio d'autenticacio

Tasques:

- activar o implementar mecanisme d'autenticacio;
- preparar usuari demo reproduïble;
- comprovar login correcte i incorrecte;
- documentar credencials demo no personals.

### 1:40-2:20. Autoritzacio i accio protegida

Tasques:

- seleccionar una accio real del projecte;
- aplicar middleware, guard, voter, policy o equivalent;
- definir regla mínima de permís;
- controlar resposta sense permisos.

### 2:20-2:45. Verificacio

Tasques:

- provar accés sense autenticar;
- provar usuari autoritzat;
- provar usuari sense permís o cas denegat;
- fer logout i repetir accés;
- registrar evidències.

### 2:45-3:00. Tancament

Cada grup deixa:

- ruta o accio protegida;
- regla d'autoritzacio;
- usuaris demo;
- passos de prova;
- incidència o dubte si alguna part queda fràgil.

## Tasques concretes de l'alumnat

- Implementar autenticacio amb eines del framework.
- Implementar logout o invalidacio.
- Crear o documentar usuari demo.
- Protegir una accio real.
- Afegir autoritzacio mínima.
- Provar cas autoritzat i cas denegat.
- Documentar com es verifica.

## Evidencies minimes

| Evidencia | Minim acceptable |
|---|---|
| Autenticacio | login o equivalent funcional |
| Invalidacio | logout o mecanisme equivalent |
| Proteccio | ruta o accio protegida en servidor |
| Autoritzacio | regla mínima de permís |
| Verificacio | cas autoritzat i cas denegat |
| Documentacio | passos de prova i usuari demo |

## Criteris d'exit

- La proteccio no depén de la vista.
- La ruta protegida no és decorativa.
- L'alumnat pot explicar on es comprova la identitat i on el permís.
- El cas denegat és observable.
- No hi ha secrets reals ni contrasenyes personals versionades.

## Que no és suficient

- Ocultar un enllaç però deixar la ruta accessible.
- Fer login sense protegir cap accio.
- Crear rols que no s'usen.
- No provar cas denegat.
- Copiar una configuracio sense poder explicar-la.

## Us de la IA

La IA pot ajudar a localitzar l'equivalent de middleware, guard, voter o policy en cada stack. L'alumnat ha de contrastar-ho amb el codi real i demostrar que la proteccio funciona en servidor.

## Connexio amb el microrepte posterior

`R3M6` estabilitzara els fluxos, errors, proves i proteccio. Si `R3M5` no deixa clara la diferència entre autenticacio i autoritzacio, el tancament de `R3` quedarà feble.
