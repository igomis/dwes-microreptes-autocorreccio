# R2S7. Proves de flux, depuració i checkpoint tècnic

## Finalitat de la sessio

Esta sessió convertix les comprovacions manuals que l'alumnat ja ha fet en `R2M4`, `R2M5` i `R2M6` en una prova de flux HTTP executable. El producte central és `tests/flux-r2.php` o una alternativa equivalent que execute el recorregut, comprove respostes observables i acabe amb error quan el comportament no coincidix amb l'esperat.

L'objectiu no és afegir funcionalitats noves, sinó demostrar que el que ja existeix funciona amb casos positius, negatius i d'invalidacio.

En este punt encara no es demanen proves unitàries ni `PHPUnit` com a mínim. La prova de `R2M7` mira l'aplicació des de fora i comprova HTTP, sessió o token, operació protegida i logout. `R2M8` provarà des de dins una classe o regla aïllada amb `PHPUnit`, `pytest`, `JUnit` o equivalent. Les dos proves són complementàries.

## Encaix dins del Repte 2

- **Repte**: `R2. Processament bàsic, estat, autenticació i primera funcionalitat protegida`
- **Microrepte**: `R2M7`
- **Sessio**: `R2S7`
- **Duracio orientativa**: `3 hores`
- **Focus**: convertir casos ja provats manualment en una prova de flux HTTP executable, amb comprovacions automàtiques, depuració i evidència reproduïble
- **No entra encara**: proves unitàries obligatòries, `PHPUnit` com a mínim, mocks, refactoritzacio profunda, noves pantalles grans o migracio a framework

## Relacio amb RA i criteris de treball

| Element | Concrecio en el microrepte |
|---|---|
| `RA4.f` | prova, depuracio i documentacio del comportament real |
| Punt de partida | casos manuals i peticions externes ja construïts en microreptes anteriors |
| Prova de flux | `tests/flux-r2.php` o equivalent que faça peticions reals, mantinga sessió o token i comprove els resultats |
| Evidència central | script executable, eixida real guardada i instrucció única d'execució |
| Verificació docent | execució completa del script, provocació d'un error i explicació de per què la prova falla |

## Producte esperat

El lliurable principal és `tests/flux-r2.php`, o una prova HTTP equivalent en Bash, Python o Java, que execute en ordre:

1. accés sense autenticar a una ruta o operació protegida i denegació;
2. login incorrecte i denegació;
3. login correcte i creació de sessió o obtenció de token;
4. accés autenticat a una operació protegida i resultat permés;
5. logout o invalidació;
6. nou intent amb l'estat anterior i denegació.

L'script ha de:

- poder executar-se amb una sola ordre;
- usar una URL base configurable;
- usar credencials demo, mai secrets reals;
- conservar cookies en un directori temporal o reutilitzar el token retornat;
- comprovar automàticament codis HTTP, redireccions o text estable;
- acabar amb codi diferent de `0` si falla una expectativa;
- netejar fitxers temporals;
- mostrar quin cas ha passat o ha fallat.

Una ordre `curl` solta només és una petició manual. Pot servir per explorar o depurar, però no és la prova automàtica mínima si ningú comprova el resultat. En PHP, la comprovació pot encapsular-se així:

```php
function comprova(bool $condicio, string $missatge): void
{
    if (!$condicio) {
        fwrite(STDERR, "ERROR: $missatge\n");
        exit(1);
    }
}

$curl = curl_init("$baseUrl/protegida.php");
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEJAR => $cookies,
    CURLOPT_COOKIEFILE => $cookies,
]);
$cos = curl_exec($curl);
$codi = curl_getinfo($curl, CURLINFO_HTTP_CODE);
comprova($cos !== false && $codi === 302, "s'esperava 302 i s'ha rebut $codi");
```

Per mantindre una sessió entre peticions, totes les crides reutilitzen el mateix fitxer en `CURLOPT_COOKIEJAR` i `CURLOPT_COOKIEFILE`. Si el projecte usa token, la prova l'extrau de la resposta del login i l'envia en la petició següent.

El criteri no és tindre una suite formal, sinó que el mateix programa decidisca si el flux funciona. Un `tests/flux-r2.sh` en Bash, una prova HTTP amb `pytest`, el client de Flask, MockMvc o una eina equivalent també és vàlid si cobreix el recorregut i falla automàticament. No es penalitza la tecnologia triada; una prova unitària aïllada no substituïx este flux.

## Preparacio previa del professorat

Convé preparar:

- aplicació de demostració o projecte de mostra amb login, ruta protegida i logout;
- plantilla incompleta de `tests/flux-r2.php`, sense les rutes ni expectatives finals del projecte de l'alumnat;
- exemples curts de `curl_init()`, `curl_setopt_array()`, `curl_getinfo()`, cookies amb `CURLOPT_COOKIEJAR`/`CURLOPT_COOKIEFILE` i neteja amb `unlink()`;
- comprovació prèvia que PHP CLI té disponible l'extensió cURL;
- exemple d'una prova que passa i del mateix cas provocat perquè falle;
- criteri de prioritzacio d'incidencies bloquejants;
- recordatori que primer es reprodueix l'error i després es corregeix.

## Continguts que cal explicar

- diferència entre una comprovació manual, una prova de flux automatitzada i una prova unitària;
- estructura mínima d'un programa PHP de terminal: variables, funcions, condicionals, `STDERR` i `exit`;
- ús de l'extensió cURL de PHP per obtindre cos i codi HTTP, enviar dades i observar redireccions;
- manteniment de l'estat entre peticions amb cookies (`-c` i `-b`) o amb un token;
- assercions sobre codis, redireccions o textos estables, evitant detalls fràgils de presentació;
- codi d'eixida `0` quan tot passa i diferent de `0` davant qualsevol expectativa incomplida;
- fitxers temporals, `register_shutdown_function()`/`unlink()` i credencials demo sense secrets reals;
- depuració d'un cas fallit i registre d'una eixida reproduïble;
- relació amb `R2M8`: allí es provarà una unitat interna; ací es comprova el recorregut HTTP complet.

## Seqüencia d'aula de 3 hores

Aplicar el [protocol de retorn i consolidació](retorn_i_consolidacio_microreptes.md). Els blocs següents ja incorporen la consolidació dins de les tres hores: prioritzar mínims i proves, i reajustar el treball nou si persistixen bloquejos del grup.

### 0:00-0:15. Retorn i explicació dels errors anteriors

Revisar les evidències i els dubtes del punt de partida, explicar dos o tres errors comuns amb un exemple breu i fer predir el resultat. No donar per assolit el microrepte anterior pel fet d’haver canviat de sessió.

### 0:15-0:30. Correcció guiada o consolidació

Qui té un pendent aplica una correcció concreta i torna a provar-la amb ajuda. Qui ja ha assolit el mínim comprova variants o millora les proves. Si falta treball, començar per la peça mínima necessària; si falta comprensió, modificar i explicar un exemple.

### 0:30-0:35. Comprovació de la base per continuar

Demanar una execució, modificació o explicació curta de la peça necessària per al treball de hui. Si el bloqueig continua, acordar ajuda durant el treball guiat i comprovar la comprensió en l’obertura següent. És consolidació per continuar, no recuperació ni recorrecció del microrepte.

### 0:35-0:50. De prova manual a prova automàtica

Comparar una petició que una persona inspecciona amb una prova que comprova sola el resultat i retorna `0` o error. Presentar el recorregut mínim de sis casos.

### 0:50-1:10. PHP CLI mínim per a la tasca

Repassar només funcions, variables d'entorn amb `getenv()`, condicionals, `STDERR`, `exit(1)`, fitxers temporals i una funció `comprova()`. No introduir un framework de proves.

### 1:10-1:30. `curl`, resposta i assercions

Modelar `curl_init()`, `curl_setopt_array()`, `CURLOPT_RETURNTRANSFER`, `CURLOPT_POSTFIELDS`, `curl_getinfo()` i la diferència entre seguir o inspeccionar una redirecció. Resultat: una ruta pública o denegada queda comprovada automàticament.

### 1:30-1:50. Sessió o token entre peticions

Mostrar `CURLOPT_COOKIEJAR` i `CURLOPT_COOKIEFILE` amb un fitxer temporal, o l'extracció i reutilització del token si el projecte usa l'API de `R2M6`. Usar només comptes demo.

### 1:50-2:20. Construcció del flux propi

Cada alumne adapta rutes, camps, credencials demo i resultats estables del seu projecte. El script ha d'arribar de la denegació inicial a la denegació posterior al logout.

### 2:20-2:35. Depuracio guiada

Tasques:

- corregir primer errors que trenquen el flux;
- repetir el cas fallit;
- deixar constancia de la correccio;
- no obrir funcionalitats noves.

Resultat: els bloquejos principals queden resolts o documentats.

### 2:35-2:45. Documentació mínima

Tasques:

- actualitzar `README`;
- afegir usuaris de prova;
- indicar operacio protegida;
- indicar l'ordre única `php tests/flux-r2.php` o l'equivalent real;
- indicar URL base, requisits previs i compte demo sense publicar secrets;
- guardar una eixida real en `evidence/r2m7/verificacio.txt`;
- marcar una regla o comprovació candidata a convertir-se en classe testable en `R2M8`.

Resultat: la demo és reproduïble.

### 2:45-2:55. Checkpoint tecnic

El professorat executa el script complet i demana canviar temporalment una expectativa o una ruta per comprovar que falla. Pregunta: què observa la prova des de fora, com conserva la identitat entre peticions i per què no és encara una prova unitària?

### 2:55-3:00. Diagnòstic individual i següent pas

Amb les evidències observades durant la sessió, comprovar què funciona i què entén cada alumne. Registrar la base que domina, la dificultat i l’ajuda necessària per continuar. Reprendre els dubtes en l’obertura següent com a consolidació, sense reentrega ni recorrecció del microrepte. La recuperació, si cal, es planteja sobre el repte complet en el seu tancament. No cal fer totes les demos completes en estos deu minuts.

## Tasques concretes de l'alumnat

- Reutilitzar els casos i peticions de `R2M4`-`R2M6`.
- Crear `tests/flux-r2.php` o un equivalent HTTP automatitzat.
- Automatitzar el recorregut denegat → login → permés → logout → denegat.
- Afegir comprovacions que facen fallar la prova davant un resultat inesperat.
- Registrar incidencies.
- Depurar bloquejos.
- Repetir proves fallides.
- Actualitzar README.
- Marcar una regla o comprovació candidata per a `R2M8`.

## Evidencies minimes

| Evidencia | Minim acceptable |
|---|---|
| Prova de flux | `tests/flux-r2.php` o equivalent executable amb comprovacions reals |
| Denegació inicial | accés protegit sense identitat bloquejat |
| Login | credencial incorrecta denegada i credencial demo correcta acceptada |
| Operació protegida | accés autenticat permés i comportament observable comprovat |
| Invalidació | logout o invalidació i nou accés denegat |
| Estat entre peticions | cookies temporals o token reutilitzat sense exposar secrets |
| Execució | una sola ordre documentada i codi d'eixida no zero quan falla |
| Eixida real | `evidence/r2m7/verificacio.txt` o registre equivalent |
| Incidencies | errors registrats o absencia explícita |
| README | demo reproduïble |

## Criteris d'exit

- No es prova només el camí feliç.
- La documentacio permet repetir la demo.
- Hi ha un flux HTTP executable complet, no només una petició solta.
- Les expectatives es comproven automàticament i una discrepància produïx error.
- La identitat es conserva amb cookies o token i queda invalidada al final.
- La prova automàtica és de caixa negra o flux, no unitària.
- Els casos registrats coincideixen amb el comportament real.
- Els errors bloquejants estan corregits o identificats.
- Hi ha una regla o comprovació concreta candidata a classe testable.

## Que no és suficient

- Llista de proves, captures o col·lecció de peticions sense assercions executables.
- Una ordre `curl` que imprimix la resposta però no comprova res.
- Un script que sempre acaba correctament encara que el servidor responga malament.
- Dir que hi ha prova automàtica però no indicar com executar-la ni aportar una eixida real.
- Confondre este mínim amb proves unitàries obligatòries.
- Captures sense passos.
- README desactualitzat.
- Corregir sense reproduir.
- Afegir funcionalitats noves en lloc de tancar el flux.

## Us de la IA

La IA pot ajudar a generar casos addicionals, interpretar errors o proposar una comanda `curl`. Control: la bateria mínima comuna ha d'estar executada, els resultats han de ser reals i la prova automàtica ha de poder executar-se o revisar-se.

## Suport per alumnat amb més dificultat

Donar una plantilla PHP amb la URL base, el fitxer temporal de cookies i les funcions de petició i comprovació ja preparades. L'alumne ha d'adaptar rutes, camps i textos del seu projecte i completar com a mínim denegació inicial, login correcte, operació protegida, logout i denegació final. Una ordre que només mostra la resposta no és suficient.

## Ampliacio per alumnat avançat

- Afegir validació del formulari o una regla de domini al mateix flux.
- Fer el script independent de dades prèvies i repetible sense neteja manual.
- Integrar la prova de flux en CI sense substituir la defensa.
- Logs o captures comparatives.
- Matriu d'incidencies prioritzades.

## Checklist de tancament

- [ ] Tinc `tests/flux-r2.php` o una alternativa HTTP equivalent.
- [ ] El flux comprova accés inicial denegat i login incorrecte.
- [ ] Manté sessió o token després del login correcte.
- [ ] Comprova una operació protegida permesa.
- [ ] Fa logout o invalida l'estat i comprova una nova denegació.
- [ ] Cada expectativa pot fer acabar la prova amb error.
- [ ] He documentat una única ordre d'execució i els requisits previs.
- [ ] He guardat una eixida real en `evidence/r2m7/`.
- [ ] He registrat incidencies.
- [ ] He actualitzat README.
- [ ] He triat una regla o comprovació candidata a classe testable.

## Connexió amb R2M8

`R2M8` parteix d'un flux comprovat des de fora. La pregunta de pas és:

Quina regla o comprovació del flux funciona ja i es podria provar millor si la convertim en una classe simple?

## Materials associats per a portar a l'aula

- **Presentació associada**: [MT06. Debugging i prova curta](https://cipfpbatoi.github.io/dwes2627/recursos/Tallers/MT06-Debugging-i-prova-curta.pdf)
- **Teoria o material associat**: [Proves, depuració i checkpoint](https://cipfpbatoi.github.io/dwes2627/recursos/Teoria/Teoria-R2-Proves-depuracio-i-checkpoint.pdf)
- **Alternativa Python**: [R2M7 amb Flask: proves i depuració](https://cipfpbatoi.github.io/dwes2627/04_materials/repte_02/python/r2m7_proves_debug.html)

## Microtaller associat

- **Microtaller**: `MT06. Debugging i prova curta`
- **Moment recomanat**: abans del checkpoint de tancament de `R2`.
- **Evidència mínima**: una prova curta reproduïble i una correcció o limitació registrada.
