## Purpose

Describe el comportamiento actual, observable desde fuera, del registro, el inicio de sesión, la consulta del perfil y el cierre de sesión de FlowSync, tanto en la API como en la pantalla. Documenta lo que el sistema hace hoy, no lo que debería hacer.

## Requirements

### Requirement: Formato común de las respuestas de la API de cuentas

El sistema SHALL responder siempre en JSON en los endpoints de cuentas, con independencia de la cabecera `Accept` que envíe el cliente. Las respuestas correctas de registro, login y perfil SHALL ir envueltas en un objeto `{ "data": ... }`; la respuesta de logout SHALL NOT ir envuelta. Los errores SHALL tener la forma `{ "errors": [ ... ] }`.

#### Scenario: Petición con Accept de HTML

- **WHEN** un cliente llama a cualquier endpoint de cuentas enviando `Accept: text/html`
- **THEN** la respuesta, sea de éxito o de error, llega en JSON y nunca como página HTML ni como redirección

#### Scenario: Representación pública de un usuario

- **WHEN** la API devuelve los datos de un usuario (en registro, login o perfil)
- **THEN** el objeto usuario contiene exactamente `id`, `fullName` (texto o `null`), `email`, `createdAt`, `updatedAt` e `initials`, y nunca incluye la contraseña ni su hash

### Requirement: Registro de cuenta por API

El sistema SHALL permitir crear una cuenta con `POST /api/v1/auth/signup` enviando `fullName`, `email`, `password` y `passwordConfirmation`, y SHALL devolver el usuario creado junto con un token de acceso ya válido, dejando a la persona con sesión iniciada sin pasar por el login.

#### Scenario: Registro correcto

- **WHEN** se envía un `email` con formato válido que no existe aún, una `password` de entre 8 y 32 caracteres, una `passwordConfirmation` idéntica y un `fullName` de texto o `null`
- **THEN** la respuesta tiene código 200 (no 201) y cuerpo `{ "data": { "user": { ... }, "token": "<texto>" } }`, y ese token sirve inmediatamente para consultar el perfil

#### Scenario: Nombre ausente frente a nombre nulo o vacío

- **WHEN** se envía la petición sin la clave `fullName`
- **THEN** la respuesta es 422 con un error de regla `required` sobre el campo `fullName`, mientras que enviar `fullName: null` o `fullName: ""` se acepta y la cuenta queda con `fullName` a `null`

#### Scenario: Nombre sin límite de longitud

- **WHEN** se envía un `fullName` muy largo
- **THEN** la cuenta se crea sin error de longitud sobre `fullName` [SIN CONFIRMAR: no se ha ejecutado]

#### Scenario: Email con formato no válido

- **WHEN** se envía un `email` que no tiene formato de dirección de correo
- **THEN** la respuesta es 422 con un error de regla `email` sobre el campo `email` y no se crea la cuenta

#### Scenario: Email demasiado largo

- **WHEN** se envía un `email` de más de 254 caracteres
- **THEN** la respuesta es 422 con un error de regla `maxLength` sobre el campo `email`, con el máximo (254) indicado en los metadatos del error

#### Scenario: Email ya registrado

- **WHEN** se envía un `email` idéntico al de una cuenta existente
- **THEN** la respuesta es 422 con un error de regla `database.unique` sobre el campo `email` y no se crea una segunda cuenta

#### Scenario: Email que solo difiere en mayúsculas o espacios

- **WHEN** se envía un `email` que coincide con uno existente salvo en mayúsculas/minúsculas o en espacios al principio o al final
- **THEN** previsiblemente la respuesta es 200 y se crea una cuenta distinta [SIN CONFIRMAR: no se ha ejecutado]

#### Scenario: Contraseña fuera de longitud

- **WHEN** se envía una `password` de menos de 8 o de más de 32 caracteres
- **THEN** la respuesta es 422 con un error de regla `minLength` o `maxLength` sobre el campo `password`, con el mínimo o máximo en los metadatos del error

#### Scenario: Confirmación de contraseña distinta

- **WHEN** se envía una `passwordConfirmation` de entre 8 y 32 caracteres que no coincide con `password`
- **THEN** la respuesta es 422 con un error de regla `sameAs` sobre el campo `passwordConfirmation`

#### Scenario: Confirmación de contraseña con su propio límite de longitud

- **WHEN** se envía una `passwordConfirmation` de menos de 8 o más de 32 caracteres
- **THEN** la respuesta es 422 con un error de longitud sobre el campo `passwordConfirmation`, además del error que pueda tener `password`

#### Scenario: Campos obligatorios vacíos

- **WHEN** se envía `email`, `password` o `passwordConfirmation` ausente o como cadena vacía
- **THEN** la respuesta es 422 con un error de regla `required` sobre cada campo afectado, tanto si falta como si es una cadena vacía

#### Scenario: Estructura de un error de validación

- **WHEN** falla la validación del registro
- **THEN** cada elemento de `errors` contiene `message` (texto en inglés), `rule`, `field` y, cuando aplica, `meta`, con un error por cada campo que falla

### Requirement: Iniciales del usuario

El sistema SHALL calcular las iniciales de cada usuario a partir de su nombre completo o, si no tiene, de su email, y SHALL devolverlas en mayúsculas.

#### Scenario: Nombre con dos o más palabras

- **WHEN** el usuario tiene `fullName` "Ada Lovelace" (o "Ada María López")
- **THEN** `initials` vale "AL" (o "AM"): la primera letra de la primera palabra y la primera letra de la segunda, sin tener en cuenta las siguientes

#### Scenario: Nombre de una sola palabra

- **WHEN** el usuario tiene `fullName` "Ada"
- **THEN** `initials` vale "AD", las dos primeras letras de esa palabra

#### Scenario: Nombre con espacios dobles entre palabras

- **WHEN** el usuario tiene `fullName` "Ada  Lovelace" (dos espacios)
- **THEN** `initials` vale "AD", como si el nombre tuviera una sola palabra

#### Scenario: Sin nombre

- **WHEN** el usuario no tiene `fullName` y su email es "ana@example.com"
- **THEN** `initials` vale "AE": la primera letra de lo que va antes de la arroba y la primera letra del dominio

### Requirement: Inicio de sesión por API

El sistema SHALL permitir iniciar sesión con `POST /api/v1/auth/login` enviando `email` y `password`, y SHALL devolver el usuario y un token de acceso nuevo en cada login correcto.

#### Scenario: Login correcto

- **WHEN** se envía el email y la contraseña de una cuenta existente
- **THEN** la respuesta es 200 con cuerpo `{ "data": { "user": { ... }, "token": "<texto>" } }`

#### Scenario: Varios logins generan varios tokens válidos a la vez

- **WHEN** la misma cuenta inicia sesión varias veces, o se registra y luego inicia sesión
- **THEN** cada respuesta trae un token distinto y todos siguen siendo válidos a la vez; los anteriores no se invalidan

#### Scenario: Contraseña incorrecta o email inexistente

- **WHEN** se envía una contraseña que no corresponde a la cuenta, o un email con formato válido que no pertenece a ninguna cuenta
- **THEN** la respuesta es 400 (no 401) con cuerpo `{ "errors": [ { "message": "Invalid user credentials" } ] }`, idéntica en ambos casos y sin indicar el campo

#### Scenario: Email con formato no válido en login

- **WHEN** se envía un `email` sin formato de correo o de más de 254 caracteres
- **THEN** la respuesta es 422 con un error de validación sobre el campo `email`, en lugar del 400 de credenciales no válidas

#### Scenario: Campos vacíos en login

- **WHEN** se envía `email` o `password` ausente o como cadena vacía
- **THEN** la respuesta es 422 con un error de regla `required` sobre cada campo afectado

#### Scenario: Contraseña sin límites de longitud en login

- **WHEN** se envía una `password` de cualquier longitud no vacía
- **THEN** no hay error de longitud en el login; la respuesta es 200 o 400 según las credenciales sean correctas o no

#### Scenario: Email en login con otras mayúsculas

- **WHEN** se envía el email de una cuenta existente con otras mayúsculas o con espacios alrededor
- **THEN** previsiblemente la respuesta es 400 de credenciales no válidas [SIN CONFIRMAR: no se ha ejecutado]

### Requirement: Vigencia de los tokens de acceso

El sistema SHALL aceptar un token de acceso, enviado como `Authorization: Bearer <token>`, hasta que se revoca con un logout. Los tokens SHALL NOT tener fecha de caducidad.

#### Scenario: Token antiguo sin logout

- **WHEN** se usa un token emitido hace mucho tiempo que no se ha cerrado con logout
- **THEN** la API lo sigue aceptando

### Requirement: Consulta del perfil por API

El sistema SHALL devolver los datos de la cuenta autenticada en `GET /api/v1/account/profile` y SHALL rechazar la petición cuando no hay un token válido.

#### Scenario: Perfil con token válido

- **WHEN** se llama con un token válido en la cabecera `Authorization`
- **THEN** la respuesta es 200 con cuerpo `{ "data": { "id", "fullName", "email", "createdAt", "updatedAt", "initials" } }` del dueño del token

#### Scenario: Perfil sin token, con token inventado o con token revocado

- **WHEN** se llama sin cabecera `Authorization`, con un token que no existe o con un token ya cerrado mediante logout
- **THEN** la respuesta es 401 con cuerpo `{ "errors": [ { "message": "Unauthorized access" } ] }`

### Requirement: Cierre de sesión por API

El sistema SHALL revocar, con `POST /api/v1/account/logout`, solo el token usado en la petición, y SHALL exigir un token válido para aceptar la petición.

#### Scenario: Logout correcto

- **WHEN** se llama con un token válido
- **THEN** la respuesta es 200 con cuerpo `{ "message": "Logged out successfully" }` (sin envoltorio `data`) y ese token deja de ser válido

#### Scenario: Otros tokens de la misma cuenta tras el logout

- **WHEN** la cuenta tiene varios tokens activos y se hace logout con uno de ellos
- **THEN** los demás tokens de la misma cuenta siguen siendo válidos

#### Scenario: Logout sin token o con token ya revocado

- **WHEN** se llama sin token, con un token inventado o repitiendo el logout con un token ya revocado
- **THEN** la respuesta es 401 con cuerpo `{ "errors": [ { "message": "Unauthorized access" } ] }`

### Requirement: Navegación según el estado de la sesión en pantalla

El sistema SHALL ofrecer tres pantallas de cuentas: inicio de sesión (`/login`), registro (`/register`) y perfil (`/profile`). Las pantallas de login y registro SHALL ser solo para personas sin sesión, y el perfil solo para personas con sesión.

#### Scenario: Visitante sin sesión entra al perfil

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** se la lleva a `/login`, sustituyendo la entrada en el historial del navegador

#### Scenario: Persona con sesión entra a login o registro

- **WHEN** una persona con sesión abre `/login` o `/register`
- **THEN** se la lleva a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** alguien abre cualquier dirección que no sea `/login`, `/register` ni `/profile` (incluida la raíz `/`)
- **THEN** se le lleva a `/profile`, y desde ahí a `/login` si no tiene sesión

#### Scenario: Después de entrar no se vuelve a la página pedida

- **WHEN** una persona sin sesión intenta abrir una página protegida, es enviada a `/login` e inicia sesión
- **THEN** acaba siempre en `/profile`, sin recordar la dirección que pidió originalmente

#### Scenario: Espera mientras se comprueba una sesión guardada

- **WHEN** se carga la aplicación y hay una sesión guardada en el navegador pendiente de comprobar
- **THEN** se muestra solo un indicador de carga giratorio (anunciado como "Cargando…" para lectores de pantalla) hasta que termina la comprobación

### Requirement: Pantalla de inicio de sesión

El sistema SHALL mostrar en `/login` el título "FlowSync", una tarjeta "Inicia sesión" con el texto "Entra con tu cuenta para volver a tus tareas.", los campos "Email" (con ejemplo "tu@email.com") y "Contraseña", el botón "Entrar" y el enlace "¿Aún no tienes cuenta? Crea una" que lleva a `/register`.

#### Scenario: Login correcto desde la pantalla

- **WHEN** la persona introduce credenciales correctas y pulsa "Entrar"
- **THEN** mientras espera el botón se desactiva y muestra "Entrando…", y al terminar se la lleva a `/profile` con la sesión guardada en el navegador

#### Scenario: Credenciales incorrectas

- **WHEN** la persona introduce un email existente con contraseña errónea, o un email que no existe
- **THEN** aparece arriba del formulario un aviso de error con "El email o la contraseña no son correctos.", se queda en `/login` y conserva lo escrito en los campos

#### Scenario: Campos vacíos o email mal formado

- **WHEN** la persona pulsa "Entrar" con el email vacío, la contraseña vacía o un email sin formato válido
- **THEN** el navegador no bloquea el envío, la petición llega al servidor y bajo cada campo afectado aparece su mensaje: "Falta rellenar el email.", "Falta rellenar la contraseña." o "Introduce una dirección de email válida.", sin aviso general arriba

#### Scenario: Servidor inaccesible

- **WHEN** la persona pulsa "Entrar" y no se puede contactar con el servidor
- **THEN** aparece el aviso "No se pudo conectar con el servidor. Comprueba que el backend está arrancado."

#### Scenario: Error inesperado del servidor

- **WHEN** el servidor responde con un error distinto de validación, credenciales o autorización (por ejemplo, un 500)
- **THEN** aparece el aviso "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento."

#### Scenario: Envíos repetidos

- **WHEN** la persona pulsa "Entrar" varias veces seguidas
- **THEN** el botón queda desactivado hasta que llega la respuesta y solo se procesa el primer envío

### Requirement: Pantalla de registro

El sistema SHALL mostrar en `/register` el título "FlowSync", una tarjeta "Crea tu cuenta" con el texto "Regístrate para empezar a organizar el trabajo del equipo.", los campos "Nombre completo (opcional)" (con ejemplo "Ada Lovelace"), "Email" (con ejemplo "tu@email.com"), "Contraseña" (con la ayuda "Entre 8 y 32 caracteres.") y "Repite la contraseña", el botón "Crear cuenta" y el enlace "¿Ya tienes cuenta? Inicia sesión" que lleva a `/login`.

#### Scenario: Registro correcto desde la pantalla

- **WHEN** la persona rellena datos válidos y pulsa "Crear cuenta"
- **THEN** mientras espera el botón se desactiva y muestra "Creando cuenta…", y al terminar se la lleva directamente a `/profile` con la sesión ya iniciada

#### Scenario: Nombre en blanco

- **WHEN** la persona deja el nombre vacío o escribe solo espacios
- **THEN** la cuenta se crea sin nombre; si escribe un nombre con espacios al principio o al final, se guarda sin esos espacios

#### Scenario: Contraseñas distintas

- **WHEN** la contraseña y su repetición no coinciden y la persona pulsa "Crear cuenta"
- **THEN** no se envía nada al servidor y bajo "Repite la contraseña" aparece "Las contraseñas no coinciden."

#### Scenario: Email ya registrado

- **WHEN** la persona usa un email que ya tiene cuenta
- **THEN** bajo el campo "Email" aparece "Ese email ya está registrado. Inicia sesión en su lugar.", sin aviso general arriba y sin enlace directo al login dentro del mensaje

#### Scenario: Contraseña corta o larga

- **WHEN** la contraseña (repetida igual) tiene menos de 8 o más de 32 caracteres
- **THEN** la ayuda "Entre 8 y 32 caracteres." se sustituye por "la contraseña debe tener al menos 8 caracteres." o "la contraseña no puede superar los 32 caracteres." (empezando en minúscula), y bajo "Repite la contraseña" aparece "la confirmación de la contraseña debe tener al menos 8 caracteres." o "la confirmación de la contraseña no puede superar los 32 caracteres."

#### Scenario: Email vacío o mal formado

- **WHEN** la persona envía el registro con el email vacío o sin formato válido
- **THEN** la petición llega al servidor y bajo "Email" aparece "Falta rellenar el email." o "Introduce una dirección de email válida."

#### Scenario: Contraseñas vacías

- **WHEN** la persona envía el registro con la contraseña y su repetición vacías
- **THEN** la petición llega al servidor y bajo cada campo aparece "Falta rellenar la contraseña." y "Falta rellenar la confirmación de la contraseña."

#### Scenario: Varios errores en un mismo campo

- **WHEN** el servidor devuelve más de un error para el mismo campo
- **THEN** bajo ese campo solo se muestra el primero

#### Scenario: Registro con servidor inaccesible o con error inesperado

- **WHEN** no se puede contactar con el servidor o este responde con un error inesperado
- **THEN** aparece arriba el mismo aviso que en el login: "No se pudo conectar con el servidor. Comprueba que el backend está arrancado." o "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento."

#### Scenario: El registro no explica la pérdida de una sesión anterior

- **WHEN** se perdió una sesión anterior al recargar y la persona va a `/register` en lugar de quedarse en `/login`
- **THEN** la pantalla de registro no muestra el motivo de esa pérdida; solo lo muestra la de login

### Requirement: Pantalla de perfil

El sistema SHALL mostrar en `/profile` los datos de la persona con sesión: un círculo con sus iniciales, su nombre completo (o "Sin nombre" si no tiene), su email, la fecha de alta como "Miembro desde" y un botón "Cerrar sesión".

#### Scenario: Persona con nombre

- **WHEN** una persona que se registró como "Ada Lovelace" abre su perfil
- **THEN** ve "AL" en el círculo, "Ada Lovelace" como título y su email debajo

#### Scenario: Persona sin nombre

- **WHEN** una persona registrada sin nombre abre su perfil
- **THEN** ve "Sin nombre" como título y en el círculo las iniciales calculadas a partir de su email

#### Scenario: Fecha de alta

- **WHEN** se muestra el perfil
- **THEN** "Miembro desde" aparece en castellano en formato largo, por ejemplo "30 de septiembre de 2026", según la zona horaria del navegador

#### Scenario: Datos mostrados justo después de entrar

- **WHEN** la persona llega al perfil justo después de registrarse o iniciar sesión
- **THEN** se muestran los datos recibidos en esa misma respuesta, sin volver a pedir el perfil al servidor

### Requirement: Cierre de sesión desde la pantalla

El sistema SHALL cerrar la sesión en el navegador en cuanto se pulsa "Cerrar sesión", SHALL pedir al servidor que revoque el token, y SHALL NOT depender de la respuesta del servidor para dar la sesión por cerrada.

#### Scenario: Cerrar sesión

- **WHEN** la persona pulsa "Cerrar sesión" en su perfil
- **THEN** la sesión guardada en el navegador se borra, se la lleva a `/login` sin ningún aviso y se envía al servidor la petición de logout

#### Scenario: Fallo del servidor al cerrar sesión

- **WHEN** la petición de logout falla (servidor caído o token ya no válido)
- **THEN** no se muestra ningún error; la persona queda igualmente fuera en esa pantalla, aunque en el caso de servidor caído el token sigue siendo válido en la API

#### Scenario: Otras pestañas abiertas

- **WHEN** la persona tiene la aplicación abierta en otra pestaña y cierra sesión en una de ellas
- **THEN** la otra pestaña sigue mostrando el perfil hasta que se recarga; al recargarla, termina en `/login`

### Requirement: Recarga de página y restauración de la sesión

El sistema SHALL guardar el token en el navegador al registrarse o iniciar sesión, y SHALL comprobarlo contra el servidor cada vez que se carga la aplicación antes de dar la sesión por válida.

#### Scenario: Recargar con sesión válida

- **WHEN** una persona con sesión recarga `/profile`
- **THEN** ve el indicador de carga, se piden sus datos al servidor y sigue en `/profile` con los datos actualizados

#### Scenario: Recargar con un token que el servidor ya no acepta

- **WHEN** se recarga la aplicación con un token guardado que el servidor rechaza (por ejemplo, revocado desde otra pestaña)
- **THEN** el token se borra del navegador, se lleva a la persona a `/login` y arriba del formulario aparece "Tu sesión ha caducado. Vuelve a iniciar sesión."

#### Scenario: Recargar con el servidor caído

- **WHEN** se recarga la aplicación con un token guardado y no se puede contactar con el servidor
- **THEN** se lleva a la persona a `/login` con el aviso "No se pudo conectar con el servidor. Comprueba que el backend está arrancado.", el token se conserva en el navegador y, al recargar cuando el servidor vuelve, la sesión se restaura sin volver a introducir credenciales

#### Scenario: Recargar con error inesperado del servidor

- **WHEN** se recarga la aplicación con un token guardado y el servidor responde con un error inesperado
- **THEN** se lleva a la persona a `/login` con el aviso "Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento." y el token se conserva en el navegador

#### Scenario: Permanencia del aviso de sesión perdida

- **WHEN** la persona está en `/login` con el aviso de sesión perdida y hace un intento que falla solo por errores bajo los campos
- **THEN** el aviso de sesión perdida sigue visible arriba del formulario; desaparece solo cuando un nuevo error general lo sustituye o cuando la persona entra correctamente

#### Scenario: Recargar sin sesión

- **WHEN** una persona sin sesión guardada recarga `/login` o `/register`
- **THEN** la pantalla aparece directamente, sin indicador de carga y sin aviso

## Parte B

### 1. Requisitos escritos y comprobados

- Escritos por el agente: 13
- Comprobados por mí abriendo el código: 10

### 2. Incoherencias

- Email con espacios frente a mayúsculas: con espacios alrededor el email cuenta como ya registrado y permite entrar, pero en mayúsculas se crea otra cuenta y el login falla; se ve en "Email que solo difiere en mayúsculas o espacios" y "Email en login con otras mayúsculas" al registrarse y entrar con ambas variantes.
- Límite de 254 del email: un email de más de 254 caracteres siempre devuelve el error de formato y nunca el de longitud que promete "Email demasiado largo"; se ve al registrarse con un email de 260 caracteres.
- Fecha de alta: `createdAt` lleva milisegundos en la respuesta del registro y sale con milisegundos a cero en login y perfil para la misma cuenta; se ve comparando las tres respuestas.
- Envoltorio `data`: todas las respuestas correctas lo llevan salvo la del logout; se ve en "Logout correcto".
- Sesión revocada desde otra pestaña: el ejemplo de "Recargar con un token que el servidor ya no acepta" no se cumple, porque al cerrar sesión en una pestaña la otra se queda sin token y al recargar va a login sin el aviso "Tu sesión ha caducado…"; se ve en pantalla con dos pestañas.
- Mayúsculas en mensajes de pantalla: los de longitud de contraseña empiezan en minúscula ("la contraseña debe tener…") y el resto en mayúscula ("Falta rellenar…"); se ve en "Contraseña corta o larga" del registro.

### 3. Bug o contrato

- Email y mayúsculas: `prueba@…` y `PRUEBA@…` son dos cuentas distintas y el login en mayúsculas entra en una u otra según exista la gemela; puede ser una decisión (el email se guarda tal cual se escribe) o un bug (un email no distingue mayúsculas y debería ser una sola cuenta).
- Códigos de respuesta: el registro responde 200 y las credenciales incorrectas 400; puede ser el contrato elegido o un descuido frente al 201 y 401 habituales.
- Tokens sin caducidad: un token vale para siempre hasta el logout; puede ser una decisión de simplicidad o un hueco que nadie configuró.
- Otra pestaña tras cerrar sesión: sigue mostrando el perfil hasta recargar; puede ser aceptable para esta versión o un bug de sesión.
- Iniciales sin nombre: salen de la primera letra del usuario y de la del dominio (AG para andres_romero@gmail.com); puede ser lo pensado o se esperaban iniciales solo del usuario.