# R2S0. Transició al Repte 2

## Finalitat de la sessió

Esta sessió obri `R2` sense crear un microrepte nou. La seua funció és fer la transició des de la base executable de `R1` cap al primer flux funcional amb dades, validació, estat i autenticació.

Com que `R2` es treballa sobre una base comuna en `PHP`, esta sessió dedica temps explícit a una introducció pràctica a `PHP`: sintaxi mínima, barreja controlada de codi `HTML` i `PHP`, variables, condicions i exemples fàcils d'ús dins d'una pàgina generada pel servidor.

## Encaix dins del Repte 2

- **Repte**: `R2. Processament, estat i autenticació`
- **Microrepte**: `Sessió sense microrepte propi`
- **Sessió**: `R2S0`
- **Duració orientativa**: `3 hores`
- **Focus**: lectura de `R1`, introducció pràctica a `PHP`, barreja `HTML/PHP`, formularis, recorregut de dades, errors i abast de `R2`
- **No entra encara**: implementar el primer microrepte complet

## Conceptes a explicar

- Diferència entre punt d'entrada de `R1` i flux funcional de `R2`.
- Què fa `PHP` al servidor abans que el navegador reba l'`HTML`.
- Com s'intercala `PHP` dins d'una pàgina `HTML` sense convertir-la en un fitxer desordenat.
- Sintaxi mínima: variables, concatenació o interpolació simple, `if/else`, arrays bàsics i `foreach` senzill si cal.
- Exemples fàcils: saludar amb una variable, mostrar una llista d'opcions, pintar un missatge condicional i generar una xicoteta taula.
- Recorregut mínim: formulari, petició, servidor, validació, resposta i reintent.
- Per què l'estat, la sessió i l'autenticació no són peces soltes.
- Evidències que s'esperen en `R2`: dades, errors, proves, README i commits.

## Exemples fàcils per modelar

Els exemples han de ser curts i orientats al que després apareixerà en `R2S1`.

```php
<?php
$nom = 'Aina';
?>
<h1>Benvinguda, <?= htmlspecialchars($nom) ?></h1>
```

```php
<?php
$edat = 18;
$missatge = $edat >= 18 ? 'Pot continuar' : 'Cal revisar l'edat';
?>
<p><?= htmlspecialchars($missatge) ?></p>
```

```php
<?php
$opcions = ['alta', 'consulta', 'modificacio'];
?>
<ul>
  <?php foreach ($opcions as $opcio): ?>
    <li><?= htmlspecialchars($opcio) ?></li>
  <?php endforeach; ?>
</ul>
```

Punt docent important: `htmlspecialchars` s'introdueix com a hàbit de seguretat i higiene en eixida, sense convertir encara la sessió en una classe completa de seguretat.

## Seqüència d'aula de 3 hores

### 0:00-0:20. Revisió del punt de partida

Cada equip comprova que el projecte de `R1` arranca i que el README permet reproduir-lo.

### 0:20-1:15. Introducció pràctica a PHP dins d'HTML

El professorat mostra com el servidor executa `PHP` i retorna `HTML`. Es modelen exemples molt curts: variable, condició, llista i missatge generat.

### 1:15-1:45. Barreja controlada de codi HTML i PHP

Es treballen bones pràctiques mínimes: separar càlcul inicial de presentació, evitar blocs llargs dins de l'HTML i escapar eixides amb `htmlspecialchars`.

### 1:45-2:10. Modelatge del flux de dades

El professorat mostra un recorregut senzill de formulari a servidor i resposta.

### 2:10-2:35. Elecció del primer flux del producte

L'alumnat decideix quin cas d'ús real convertirà en formulari o entrada de dades.

### 2:35-2:50. Mapa de `R2`

Cada equip dibuixa com creixerà el flux: validació, reintent, estat i operació protegida.

### 2:50-3:00. Checkpoint de pas

Validació docent de l'abast abans d'entrar en `R2S1`.

## Evidències mínimes

| Evidència | Mínim acceptable |
|---|---|
| Base `R1` | arranca i està documentada |
| Exemple `PHP` | l'alumnat ha executat o entés un exemple curt amb eixida `HTML` |
| Primer flux | cas d'ús real identificat |
| Mapa de `R2` | inclou entrada, validació, estat i protecció |
| Riscos | punts de bloqueig anotats |

## Checklist de tancament

- [ ] Projecte de `R1` verificat.
- [ ] Sintaxi mínima de `PHP` situada.
- [ ] Barreja `HTML/PHP` mostrada amb exemples simples.
- [ ] Primer flux funcional triat.
- [ ] Mapa de `R2` preparat.
- [ ] Preparat per a `R2S1`.
