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

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Actua como un Analista de QA que documenta el comportamiento actual de un sistema heredado, donde se quiere documentar el comportamiento actual de cuentas y acceso al proyecto FlowSync para las funcionalidades de registro, login, perfil y logout.
Describe lo que el sistema hace hoy, aunque se vean errores y no el comportamiento deseado, con el objetivo de que yo compruebe despues cada requisito contra el codigo.

Alcance:
- Las dos capas, tanto la pantalla como el api (Frontend y Backend), analizando el codigo.
- En la API, lo observable es la peticion y la respuesta (codigos de estado, cuerpo, mensajes de error).
- En la pantalla, lo observable es lo que una persona ve y puede hacer (formularios, mensajes, a donde se le lleva, que pasa al recargar).
- Solo cuentas y acceso. Nada de tareas ni de ninguna otra parte del sistema, aunque la veas en el codigo.

Entrega en el siguiente formato:
- Arriba, un `## Purpose` de una o dos frases.
- Debajo, `## Requirements`.
- Debajo, cada requisito como `### Requirement: <nombre>`, redactado con el sistema SHALL.
- Debajo de cada requisito, al menos un `#### Scenario: <nombre>` con 2 viñetas: `- **WHEN** ...` y `- **THEN** ...`. No incluyas el GIVEN, la precondicion va dentro del WHEN.
- Todo debe ir en castellano (español) salvo las mayusculas de la RFC (SHALL, MUST...).

Prohibiciones:
- Nada de secciones ADDED, MODIFIED o REMOVED. No es un delta.
- Ningún nombre de clase, fichero, ruta de código ni tecnología interna. Solo comportamiento observable desde fuera.
- No tocar el código, ni para arreglar lo que encuentre.
- No escribas listas de incoherencias, dudas ni resumenes de verificacion al final: eso lo hago yo.

No rellenes huecos inventando: si algo no se puede saber leyendo el codigo, marcalo con `[SIN CONFIRMAR: motivo]` en el escenario en vez de suponer.

Proceso:
- Deja el resultado en el fichero docs/spec-viva/cuentas-y-acceso.md (crealo), no en el chat.
- Ese es el unico fichero que puedes crear o modificar.
- Ya estoy en la rama de trabajo: no crees ramas, no hagas commit, no hagas push ni abras PR, aunque las instrucciones del proyecto lo indiquen para cerrar tareas.
```

**Qué salió:** Cumplió formato, vertical y proceso (13 requisitos, 3 marcados SIN CONFIRMAR, no tocó código), pero coló explicaciones de implementación ("porque…", validador, base de datos) y un título H1 encima del Purpose.

## Prompt 2

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Revisa docs/spec-viva/cuentas-y-acceso.md y corrige solo lo siguiente, sin cambiar el comportamiento que describe:

1. Quita las explicaciones de implementacion. La spec solo puede describir lo observable desde fuera (peticion/respuesta en la API, lo que la persona ve y puede hacer en pantalla), nunca el porque interno. Casos concretos:
   - "Nombre sin limite de longitud": quita lo del validador y la columna de base de datos; deja solo lo que se observa.
   - "Email que solo difiere en mayusculas o espacios" y "Email en login con otras mayusculas": quita "no se normaliza" y "como compare textos el motor de base de datos"; describe solo la respuesta esperada.
   - "Token antiguo sin logout": quita "porque no se configura caducidad".
   - "Contraseñas vacias" (pantalla de registro): quita "la comprobacion local da por buenas las dos".
   - "Otras pestañas abiertas": quita "ya que no escucha los cambios de la sesion guardada".
   Busca ademas cualquier otro "porque...", "ya que..." o mencion a validador, base de datos, motor, configuracion o almacenamiento interno, y quitalo igual.

2. Mantén las marcas [SIN CONFIRMAR: motivo], pero que el motivo diga que no se ha podido comprobar desde fuera (por ejemplo "no se ha ejecutado"), sin describir la implementacion.

3. Quita el titulo "# Cuentas y acceso": el fichero debe empezar por "## Purpose".

Reglas:
- No añadas, quites ni fusiones requisitos ni escenarios. Solo reescribe las frases afectadas.
- Mantén el formato (### Requirement:, #### Scenario:, - **WHEN** / - **THEN**), el castellano y las prohibiciones del prompt anterior.
- No toques ningun otro fichero ni el codigo. No crees ramas, no hagas commit, no hagas push ni abras PR.
- Al terminar, dime en una lista corta que frases cambiaste.
```
**Qué salió:** Corrigió los casos señalados y 4 más que encontró solo, sin cambiar requisitos ni escenarios; los motivos de SIN CONFIRMAR quedaron genéricos ("no se ha ejecutado") y perdieron el porqué de la duda.

## Prompt 3

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
que debo validar exactamente en cada requisito… damelas y ejecuto, pero todo crealo en una tabla". Generó la tabla de validación y los curls.
```
**Qué salió:** Generó la tabla requisito → qué validar → dónde mirar, más los curls y las pruebas de pantalla; con las pruebas de pantalla encontré que el ejemplo de "otra pestaña" de la spec no se cumple.

## Prompt 4

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
Ayudame a validar el backend con los curls q propusiste, ya valide el frontend directamente en pantalla.
```
**Qué salió:**  El agente ejecutó los curls y comparó con la spec: 3 escenarios no se cumplen (email largo, email con espacios en registro y en login) y confirmó los 3 SIN CONFIRMAR.

## Prompt 5

**Modelo:** Opus 5.5
**Herramienta:** Claude Code

```
preparame el esqueleto de la parte B, esto donde lo debemos agregar?
```
**Qué salió:** Redactó las tres listas a partir de los resultados; las revisé y las dejé en la spec.
