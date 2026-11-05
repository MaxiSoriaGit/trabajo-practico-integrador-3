# Trabajo Práctico Integrador N° III: API de Eventos

API REST hecha con **Node.js, Express y Mongoose** (MongoDB local) para gestionar **usuarios, eventos y categorías**. Incluye autenticación con **JWT en cookies httpOnly**, contraseñas hasheadas con **bcrypt**, roles (`user` / `admin`), relaciones embebidas y referenciadas, **virtual populate**, eliminación lógica y en cascada, y validaciones con **express-validator**.

**Autor:** Soria Maximiliano

---

## 1. Cómo instalar y correr el proyecto

```bash
npm install
npm run dev
```

Requisitos:

- Node.js 20.6 o superior
- MongoDB corriendo en la PC (puerto `27017`)

Si todo está bien, la consola muestra:

```
Conexión exitosa a la base de datos
Servidor listo en el puerto 3005
```

> `npm run dev` ejecuta `node --watch app.js`, así que el servidor se reinicia solo cada vez que se guarda un archivo.

### Variables de entorno

Crear un archivo `.env` en la **raíz** del proyecto, a partir de `.env.example`:

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `PORT` | Puerto donde escucha el servidor | `3005` |
| `MONGODB_URI` | Dirección de la base de datos (se crea sola al guardar el primer dato) | `mongodb://127.0.0.1:27017/db-eventos` |
| `JWT_SECRET` | Clave con la que se firman y verifican los tokens | un texto largo y aleatorio |
| `JWT_EXPIRES_IN` | Duración del token | `24h` |

El `.env` **no se sube** a GitHub (está en el `.gitignore`). Lo que se sube es el `.env.example`, que solo muestra qué variables hay que definir.

---

## 2. Estructura del proyecto

```
app.js                          -> arranca el servidor y monta las rutas
.env.example                    -> plantilla de variables de entorno
src/
  config/database.js            -> conexión a MongoDB con Mongoose
  models/                       -> esquemas (user, event, category)
  controllers/                  -> lógica de cada operación (auth, user, event, category)
  routes/                       -> URLs y qué controlador responde
  middlewares/                  -> autenticación, autorización y validaciones
  helpers/                      -> utilidades de JWT y bcrypt
```

Se usan **ESModules** (`import` / `export`) en todo el proyecto, y todos los controladores tienen `try/catch`.

### Cómo viaja un request

```
Request -> Ruta -> [authMiddleware] -> [adminMiddleware / ownerOrAdmin] -> Validador -> validarCampos -> Controlador -> MongoDB -> Respuesta
```

1. La **ruta** recibe la URL (por ejemplo `POST /api/events`).
2. **`authMiddleware`** verifica que haya una sesión válida (cookie con JWT).
3. Según la ruta, **`adminMiddleware`** o **`ownerOrAdminMiddleware`** verifican los permisos.
4. El **validador** (express-validator) revisa tipos, largos, IDs, unicidad y existencia de documentos relacionados.
5. **`validarCampos`** es un middleware reutilizable: si hubo errores, corta y responde `400` con la lista de errores.
6. El **controlador** usa `matchedData(req)` para trabajar solo con los datos que pasaron la validación y habla con la base.

### Códigos HTTP usados

| Código | Cuándo |
|---|---|
| `201` | Se creó algo (registro, evento, categoría) |
| `200` | Consulta, actualización o eliminación exitosa |
| `400` | Error de validación |
| `401` | Falta autenticación (sin token, token inválido o credenciales incorrectas) |
| `403` | Falta autorización (no sos admin, o no sos el organizador) |
| `404` | El recurso no existe |
| `500` | Error inesperado del servidor |

---

## 3. Modelos

Todos usan `timestamps: true` y `versionKey: false`.

### User

| Campo | Detalle |
|---|---|
| `username` | Obligatorio, único, 3 a 20 caracteres, alfanumérico |
| `email` | Obligatorio, único, en minúsculas, formato válido |
| `password` | Hash de bcrypt. Tiene `select: false` y se elimina en `toJSON`, así nunca sale en una respuesta |
| `role` | `user` o `admin`. Por defecto `user` |
| `profile` | **Documento embebido (1:1):** `firstName`, `lastName`, `birthDate` (opcional), `phone` (opcional) |
| `deletedAt` | `null` por defecto. Si tiene fecha, el usuario está eliminado (eliminación lógica) |
| `events` | **Virtual populate:** eventos que organizó el usuario |

### Event

| Campo | Detalle |
|---|---|
| `title` | Obligatorio, único, 3 a 150 caracteres |
| `description` | Obligatoria, mínimo 20 caracteres |
| `startDate`, `endDate` | Fechas obligatorias (`endDate` debe ser posterior a `startDate`) |
| `capacity` | Entero, mínimo 1 |
| `price` | Número, mínimo 0, por defecto 0 |
| `status` | `scheduled`, `cancelled` o `finished`. Por defecto `scheduled` |
| `location` | **Documento embebido (1:1):** `venue`, `address`, `city` |
| `organizer` | Referencia a User (relación 1:N) |
| `categories` | Array de referencias a Category (relación N:M) |

### Category

| Campo | Detalle |
|---|---|
| `name` | Obligatorio, único, 2 a 30 caracteres |
| `description` | Opcional, hasta 200 caracteres |
| `events` | **Virtual populate:** eventos que tienen esta categoría |

### Mapa de relaciones

```
User  1 ---- 1  Profile      (embebido dentro de User)
Event 1 ---- 1  Location     (embebido dentro de Event)
User  1 ---- N  Event        (Event guarda el organizer)
Event N ---- M  Category     (Event guarda el array categories)
```

---

## 4. Embebido vs. referenciado: por qué se eligió cada uno

**Embebidos: `profile` en User y `location` en Event.**
Ambos son datos chicos que pertenecen a un solo documento, se leen siempre junto con él y no los comparte ninguna otra colección. Guardarlos adentro evita colecciones extra y consultas extra. Son subesquemas con `_id: false` porque no necesitan identificarse por separado.

**Referenciada 1:N: `Event.organizer` -> User.**
Un usuario puede organizar muchísimos eventos y estos cambian todo el tiempo. Si fueran un array dentro de User, el documento crecería sin límite. Con la referencia del lado "muchos", cada evento es independiente y se consulta, actualiza o elimina por su cuenta.

**Referenciada N:M: `Event.categories` (array de ObjectId).**
Un evento tiene varias categorías y una categoría está en varios eventos. El array se guardó **solo en Event** (no en los dos lados) para que la "verdad" esté en un único lugar y no haya dos arrays que sincronizar. Desde Category se ven sus eventos con virtual populate.

---

## 5. Populate y virtual populate

**Populate normal** (en el modelo que guarda la referencia): Event trae a su organizador y sus categorías.

```javascript
Event.find().populate("organizer", "username email").populate("categories", "name");
```

**Virtual populate** (en el modelo que NO guarda la referencia): User y Category traen sus eventos sin guardar ningún dato extra.

```javascript
userSchema.virtual("events", {
  ref: "Event",
  localField: "_id",       // campo de User que se compara...
  foreignField: "organizer" // ...con este campo de Event
});
```

En Category el virtual usa `foreignField: "categories"`: como `Event.categories` es un array, Mongoose busca los eventos cuyo array contenga el `_id` de la categoría.

Dos reglas importantes:

- Hay que activar `toJSON: { virtuals: true }` y `toObject: { virtuals: true }` en el esquema, si no el virtual no aparece en las respuestas.
- Los virtuals se declaran **antes** de `model()`. Si se declaran después, falla en silencio.

---

## 6. Autenticación y autorización

### Helpers

- `bcrypt.helper.js`: `hashPassword` (hashea con 10 rondas) y `comparePassword`.
- `jwt.helper.js`: `generarToken` (firma con `JWT_SECRET` y `JWT_EXPIRES_IN`) y `verificarToken`.

### Flujo

1. **Registro** (`POST /api/auth/register`): valida los datos, hashea la contraseña con bcrypt y guarda el usuario con su `profile` embebido.
2. **Login** (`POST /api/auth/login`): busca al usuario (con `deletedAt: null`), compara la contraseña con bcrypt y, si es correcta, genera un JWT y lo manda en una **cookie `httpOnly`** (`sameSite: strict`, y `secure` en producción). La cookie dura 24 horas, igual que el token.
3. **Rutas privadas**: `authMiddleware` lee el token de la cookie, lo verifica, busca al usuario y lo deja en `req.user`. Sin token, token inválido o usuario eliminado, responde `401`.
4. **Logout**: limpia la cookie.

### Middlewares de autorización

| Middleware | Qué verifica | Si falla |
|---|---|---|
| `authMiddleware` | Hay un JWT válido y el usuario existe (no eliminado) | `401` |
| `adminMiddleware` | `req.user.role === "admin"` | `403` |
| `ownerOrAdminMiddleware` | El usuario es el organizador del evento o es admin. Deja el evento en `req.event` | `403` (o `404` si el evento no existe) |

### Seguridad del registro

El campo `role` **no se valida** en el registro a propósito. Como los controladores usan `matchedData()`, que descarta todo lo que no pasó por un validador, un `"role": "admin"` enviado en el body simplemente se ignora y el usuario queda como `user`. Para crear un admin hay que cambiar el rol a mano en Compass (ver sección 10).

---

## 7. Eliminación lógica y en cascada

| Operación | Qué pasa |
|---|---|
| **Eliminar User** | Eliminación **lógica**: se pone `deletedAt = new Date()`. Todas las consultas filtran por `deletedAt: null`, así que la API lo trata como inexistente (tampoco puede loguearse). **Cascada:** se borran físicamente todos los eventos que organizó (`Event.deleteMany({ organizer: id })`) |
| **Eliminar Category** | Eliminación física. **Cascada:** se quita de todos los eventos que la tenían (`Event.updateMany(..., { $pull: { categories: id } })`) |
| **Eliminar Event** | Eliminación **física** (`findByIdAndDelete`) |

Las cascadas se hacen en el controlador (y no con hooks de Mongoose) porque así quedan visibles y fáciles de seguir.

### Decisión sobre `unique` y la eliminación lógica

En User se usó `unique: true` normal. Eso significa que un usuario eliminado **sigue reservando su username y email**. Por eso los validadores de User buscan duplicados **sin filtrar por `deletedAt`**: si filtraran, el validador dejaría pasar el request y MongoDB lo rechazaría con un error `E11000` (500). En Category y Event el borrado es físico, así que el `unique` normal alcanza.

---

## 8. Validaciones (express-validator)

- Campos obligatorios, tipos de datos y longitudes en todas las rutas de creación y actualización.
- Campos de los documentos embebidos (`profile.*` y `location.*`).
- IDs de la URL validados con `isMongoId()` (`validarId`).
- **Contraseña:** mínimo 8 caracteres, una mayúscula, una minúscula y un número.
- **Profile:** nombre y apellido solo letras; `birthDate` fecha válida y no futura; `phone` solo números (8 a 15 dígitos).
- `custom()` para: unicidad (username, email, título, nombre de categoría), `endDate` posterior a `startDate`, y que las categorías enviadas existan y no estén repetidas.
- Un único middleware `validarCampos` con `validationResult()` que devuelve los errores con código `400`.
- `matchedData()` en los controladores: solo se usan los datos validados.
- Además, los esquemas de Mongoose tienen sus propias validaciones (`required`, `minlength`, `enum`, `min`, etc.).

El **organizador** de un evento nunca viene del body: lo pone el controlador con el usuario autenticado (`req.user._id`), así nadie puede crear un evento a nombre de otro.

---

## 9. Endpoints

Base: `http://localhost:3005`

### Auth: `/api/auth`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuario con perfil embebido | Público |
| POST | `/api/auth/login` | Login (JWT en cookie httpOnly) | Público |
| GET | `/api/auth/profile` | Ver mi perfil | Autenticado |
| PUT | `/api/auth/profile` | Actualizar mi perfil embebido | Autenticado |
| POST | `/api/auth/logout` | Cerrar sesión | Autenticado |

### Users: `/api/users`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/users` | Listar usuarios activos (con `events`) | Admin |
| GET | `/api/users/:id` | Obtener un usuario activo con sus eventos | Admin |
| PUT | `/api/users/:id` | Actualizar un usuario | Admin |
| DELETE | `/api/users/:id` | Eliminación lógica + cascada de sus eventos | Admin |

### Events: `/api/events`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/events` | Crear evento (organizador = usuario logueado) | Autenticado |
| GET | `/api/events` | Listar eventos (con `organizer` y `categories`) | Autenticado |
| GET | `/api/events/my` | Listar mis eventos | Autenticado |
| GET | `/api/events/:id` | Obtener un evento | Autenticado |
| PUT | `/api/events/:id` | Actualizar evento y sus categorías | Organizador o admin |
| DELETE | `/api/events/:id` | Eliminación física | Organizador o admin |

> `/api/events/my` se declara **antes** de `/api/events/:id`. Si fuera al revés, Express interpretaría "my" como un id.

### Categories: `/api/categories`

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/categories` | Crear categoría | Admin |
| GET | `/api/categories` | Listar categorías | Autenticado |
| GET | `/api/categories/:id` | Obtener una categoría (con `events`) | Autenticado |
| PUT | `/api/categories/:id` | Actualizar categoría | Admin |
| DELETE | `/api/categories/:id` | Eliminar con cascada | Admin |

### Ejemplos de body

Registro:

```json
{
  "username": "maxi123",
  "email": "maxi@mail.com",
  "password": "Maxi1234",
  "profile": { "firstName": "Maxi", "lastName": "Soria", "phone": "3704123456" }
}
```

Crear evento:

```json
{
  "title": "Festival de Verano",
  "description": "Gran festival con música en vivo y comida",
  "startDate": "2026-12-10T20:00:00.000Z",
  "endDate": "2026-12-10T23:00:00.000Z",
  "capacity": 200,
  "price": 1500,
  "location": { "venue": "Club Social", "address": "Belgrano 123", "city": "Formosa" },
  "categories": ["<id de una categoría>"]
}
```

---

## 10. Cómo probarlo (Postman)

1. Levantar el servidor con `npm run dev`.
2. En cada request con body: **Body -> raw -> JSON**.
3. Postman guarda la cookie `token` solo después del login: las requests siguientes la mandan automáticamente.

### Crear un admin

El registro siempre crea usuarios con `role: "user"`. Para tener un admin:

1. Registrar el usuario con `POST /api/auth/register`.
2. En **MongoDB Compass** -> base `db-eventos` -> colección `users`, editar el usuario y cambiar `role` a `"admin"`.
3. Volver a hacer login (el token anterior tiene el rol viejo).

### Recorrido de pruebas

| # | Qué probar | Esperado |
|---|---|---|
| 1 | Registrar un usuario | `201`, sin `password`, `role: "user"` |
| 2 | Registrar con `"role": "admin"` en el body | `201`, pero el rol queda `"user"` |
| 3 | `GET /api/auth/profile` sin login | `401` |
| 4 | Login y luego `GET /api/auth/profile` | `200` con los datos |
| 5 | Como usuario común, `POST /api/categories` | `403` |
| 6 | Como admin, crear categoría y evento | `201` |
| 7 | Crear evento con `endDate` anterior a `startDate` | `400` |
| 8 | Usuario común intenta `PUT` sobre un evento ajeno | `403` |
| 9 | Admin hace `PUT` sobre un evento ajeno | `200` |
| 10 | `GET /api/categories/:id` | `200`, con `events` (virtual populate) |
| 11 | `DELETE` de una categoría y luego `GET` del evento | La categoría ya no está en `categories` |
| 12 | `DELETE` de un usuario | Sus eventos desaparecen, el usuario sigue en Compass con `deletedAt`, y no puede loguearse |

---

## 11. Errores que aparecieron y cómo se resolvieron

| Error | Causa real | Solución |
|---|---|---|
| `ERR_MODULE_NOT_FOUND ... category.validator.js` | El archivo no existía en `src/middlewares/` (no creado, mal ubicado o con otro nombre) | Crearlo en la ruta exacta que usa el `import` |
| `does not provide an export named 'validarId'` | El archivo existía pero estaba vacío o sin guardar, o le faltaba `export` | Poner el contenido, guardar y usar `export const` |
| `require is not defined in ES module scope` | Un modelo estaba escrito con `require` (CommonJS) y el proyecto usa `"type": "module"` | Reescribirlo con `import` / `export default` |
| `node_modules` y `.env` subidos a GitHub | `.gitignore` solo evita archivos **nuevos**; los ya commiteados se siguen rastreando | `git rm -r --cached node_modules` y `git rm --cached .env`, y commitear |
| El squash de commits no se aplicaba | En el editor del rebase no se guardó el cambio de `pick` a `squash` | Guardar el archivo y **cerrar** la ventana del editor para que Git continúe |

---

## 12. Control de versiones

- Repositorio `trabajo-practico-integrador-3` con README inicial en `main`.
- Rama `develop` creada desde `main`.
- Rama `integrador-eventos` creada desde `develop`, donde se hizo todo el desarrollo con commits chicos y descriptivos (configuración, helpers, modelos, middlewares, auth, CRUD de cada recurso, README).
- Al terminar: merge de `integrador-eventos` a `develop`, y de `develop` a `main`, sin conflictos.
- `.env` y `node_modules` no se suben; el `.env.example` sí.