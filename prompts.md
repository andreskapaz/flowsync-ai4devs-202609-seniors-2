# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Opus 5.5 xMedium

**Herramienta:** Claude Code

```
Arma la matriz de trazabilidad del requisito "Lo que cada tarea muestra de su responsable" de openspec/specs/tasks/spec.md, con sus 3 scenarios. Es sumamente importante que no cubras la capability entera, solo ese requisito.

Busca en backend/tests qué test cubre cada scenario, incluidos tests de otras carpetas que puedan cubrirlo de forma indirecta. Para marcar un scenario como Cubierto, abre el test y lee lo que afirma: no te fíes del nombre. Por cada Cubierto, cita la línea del assert que lo demuestra. Si dudas, prefiero un "No lo sé" honesto antes que un Cubierto dudoso.

Aparte de la tabla, indica qué campos del responsable devuelve hoy la API en cada tarea (míralo en el transformer), para contrastarlo con lo que pide la spec.

Formato: encima de la tabla, 2 números: cuántos scenarios tiene el requisito y cuántos resultaron cubiertos. Luego una fila por scenario con 4 columnas:
1. Scenario: qué se espera y en qué situación, en una sola línea.
2. Test que lo cubre, con el nombre exacto que aparece en la suite. Sin nombre concreto, la columna va vacía.
3. Estado: Cubierto / No cubierto / No lo sé.
4. Si es "No lo sé", en media línea qué faltó para decidirlo (no encontraste dónde se comprueba, o encontraste algo parecido que no dice exactamente lo mismo).

Escribe la matriz en docs/verificacion/acr.md. No escribas tests ni modifiques ningún otro archivo todavía.
```

**Qué salió:**  funcionó a la primera: 0 de 3 cubiertos (ningún test toca /tasks; los de auth solo se parecen), y de paso detectó que la lista expone el email del responsable.

## Prompt 2

**Modelo:** Opus 5.5 xMedium

**Herramienta:** Claude Code

```
Actúa como un especialista en tests de código que ha leído la matriz de trazabilidad de docs/verificacion/acr.md. Escribe un test por cada scenario en No cubierto (uno por scenario), siguiendo el estilo de los tests que ya existen en el proyecto.

- Crea los tests en backend/tests/functional/tasks/, con el mismo estilo de tests/functional/auth/: test.group, withGlobalTransaction.
- El scenario de "no filtra datos de cuenta" dice "suelta o dentro de la lista": compruébalo en las dos (GET /tasks/:id y GET /tasks).
- Importante: no toques nada fuera de backend/tests/ (fuera del scope).
- No debes cambiar ni arreglar el código para que los tests pasen, ni aflojar un test para que pase. El objetivo es saber qué está mal y no ocultarlo: si un test falla, se queda así y se entrega en rojo. Como eres especialista en tests, te dedicas a crearlos, no a arreglar los problemas.
- Cuando termines, ejecútalos y dime cuáles pasan y cuáles fallan, con el motivo del fallo.
- Dime también qué decidiste tú donde el scenario no lo fijaba (valores concretos, qué consideraste "dato de acceso", qué iniciales esperas para el responsable sin nombre).
```

**Qué salió:**  funcionó a la primera: 3 tests, 2 en verde y 1 en rojo (la lista GET /tasks expone el email del responsable; la tarea suelta no).