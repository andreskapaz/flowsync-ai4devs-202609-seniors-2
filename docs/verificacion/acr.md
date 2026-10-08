# Verificación: «Lo que cada tarea muestra de su responsable»

Requisito de `openspec/specs/tasks/spec.md`.

**Scenarios del requisito:** 3
**Scenarios cubiertos:** 0

| Scenario | Test que lo cubre | Estado | Qué faltó para decidir |
|---|---|---|---|
| Al obtener una tarea de "Ada Lovelace", `assignee` trae su nombre y sus iniciales | | No cubierto | |
| Al obtener cualquier tarea (suelta o en la lista), `assignee` no trae email ni datos de acceso | | No cubierto | |
| Si el responsable se registró sin nombre, `assignee` trae nombre nulo e iniciales | | No cubierto | |

## Las tres líneas

1. Cuántos scenarios creías cubiertos antes de mirar, y cuántos lo estaban: Creía cubiertos 1-2 de 3 antes de mirar; cubiertos de verdad, 0.
2. El scenario en el que no supiste si faltaba un test o faltaba la regla en la spec: «La tarea no filtra datos de cuenta»: el requisito prohíbe «ningún otro dato de esa cuenta» y el scenario solo nombra el email y los datos de acceso, así que no supe si el id o las fechas de la cuenta en el assignee eran un hueco de test o algo que la spec no llega a decidir.
3. Algo que el scenario no determinaba y tuviste que decidir al escribir el test: En «Responsable sin nombre» el scenario no dice qué iniciales esperar: el agente decidió comprobar solo que llegan y no están vacías, sin fijar un valor (hoy salen AE, del email), y lo acepté sin cuestionarlo hasta después: esa decisión no la tomé yo, y debería haberla revisado.

## Cómo se decidió

- En `backend/tests/` solo existe `functional/auth/`. Ningún test llama a `/api/v1/tasks`, ni en lista ni suelta, ni lee un `assignee`.
- Hay tests parecidos que se descartaron porque comprueban otra respuesta:
  - `Auth | iniciales` → `sin nombre, las iniciales salen del email` (`initials.spec.ts:33`, `assert.equal(response.body().data.user.initials, esperadas)`) prueba las iniciales del usuario en la respuesta del **login** (`UserTransformer`), no en el `assignee` de una tarea.
  - `Auth | registro` → `una cuenta puede quedarse sin nombre` (`signup.spec.ts:52`) prueba que `fullName` es nulo en el **registro**, no en una tarea.
  - Los dos comparten con el `assignee` el getter `User.initials`, pero no la serialización, que es justo lo que regula este requisito.

## Qué devuelve hoy la API en `assignee` (según los transformers)

| Endpoint | Transformer de la tarea | Transformer del `assignee` | Campos del `assignee` |
|---|---|---|---|
| `GET /tasks/:id` (tarea suelta) | `TaskDetailTransformer` | `TaskAssigneeTransformer` | `id`, `fullName`, `initials` |
| `PUT /tasks/:id/due-date` | `TaskDetailTransformer` | `TaskAssigneeTransformer` | `id`, `fullName`, `initials` |
| `GET /tasks` (lista) | `TaskTransformer` | `UserTransformer` | `id`, `fullName`, **`email`**, `createdAt`, `updatedAt`, `initials` |
| `POST /tasks` | `TaskTransformer` | `UserTransformer` | ídem, con **`email`** |
| `PATCH /tasks/:id/status` | `TaskTransformer` | `UserTransformer` | ídem, con **`email`** |

Contraste con la spec, que pide solo nombre e iniciales y prohíbe expresamente el email:

- **La lista, la creación y el cambio de estado incumplen el requisito leyendo el código:** exponen el email del responsable y las fechas de su cuenta.
- La tarea suelta lo cumple en cuanto al email. Aun así añade `id`, que la spec no menciona ni como permitido ni como prohibido.
- Con el responsable sin nombre, `User.initials` (`app/models/user.ts:11`) **saca las iniciales del email** (`ada@example.com` → `AE`). El scenario pide iniciales "sin recurrir a su email". Las iniciales salen derivadas del email, aunque el email no viaje en la respuesta.
