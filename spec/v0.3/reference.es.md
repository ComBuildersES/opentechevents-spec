# Referencia de campos — OTE Spec 0.3.0

> 🤖 Generado a partir de los schemas — no lo edites a mano. Ejecuta `npm run build-reference`.
>
> Las reglas que un validador no puede comprobar (por qué el `id` no cambia nunca, por qué un evento cancelado sigue publicado) están en [README.md](README.md).

**Nivel** — `obligatorio`: sin él, el validador rechaza el documento. `recomendado`: el documento es válido sin él, pero un checker avisa — son los campos que deciden si el evento se puede encontrar, filtrar y seguir. Se leen de [`event.recommended.schema.json`](event.recommended.schema.json) y [`feed.recommended.schema.json`](feed.recommended.schema.json).

## `event` — Evento

Un evento de una comunidad técnica.

| Campo | Tipo | Nivel | Descripción | Ejemplos |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.3.0" | **obligatorio** | Versión de OTE Spec a la que se adhiere el documento. | `"0.3.0"` |
| `id` | string (uri) | **obligatorio** | Identificador estable y único a nivel global. Una URI bajo un dominio que controle quien publica. Se acuña una vez y no se reescribe jamás: es lo que permite a un consumidor actualizar el evento en vez de duplicarlo. | `"https://pyalmeria.example/eventos/2026-06-async"`<br>`"https://calendar.example/ics/rust-madrid#a1b2c3d4-uid"` |
| `url` | string (uri) | _recomendado_ | URL canónica donde se describe el evento hoy. Puede cambiar con el tiempo; el `id` no. | `"https://pyalmeria.example/eventos/2026-06-async"` |
| `name` | string | **obligatorio** | Nombre del evento. | `"PyAlmería — Introducción a async/await"` |
| `description` | string | _recomendado_ | Descripción breve. Texto plano o Markdown. | `"Charla introductoria a la programación asíncrona en Python, con ejemplos en vivo."` |
| `image` | string[] | _recomendado_ | Imágenes promocionales del evento: cartel, portada, tarjeta. Es una lista, en orden de preferencia — la primera es la principal, y a menudo la única que un destino puede usar. Varias entradas describen LA MISMA imagen en distintos recortes o resoluciones (Google pide 1:1, 4:3 y 16:9), no una galería de fotos. URLs https absolutas al fichero de imagen, nunca a una página que la muestre. | `["https://rustmadrid.example/img/2026-06-16x9.png"]`<br>`["https://rustmadrid.example/img/2026-06-1x1.png","https://rustmadrid.example/img/2026-06-4x3.png","https://rustmadrid.example/img/2026-06-16x9.png"]` |
| `organizers` | object[] | _recomendado_ | Quién organiza el evento — no de dónde salieron los datos (eso es `source`). Es una lista: la co-organización es lo normal, no la excepción. Dentro de un feed, el evento que la omite hereda la del feed; declararla REEMPLAZA la heredada, no se suma a ella. | `[{"name":"PyAlmería","url":"https://pyalmeria.example"}]`<br>`[{"name":"GDG Madrid","url":"https://gdgmadrid.example"},{"type":"person","name":"Ada Lovelace","url":"https://ada.example"}]` |
| `organizers[].name` | string | **obligatorio** | Nombre de quien organiza. | `"PyAlmería"`<br>`"Ada Lovelace"` |
| `organizers[].url` | string (uri) | opcional | Dónde vive en la web quien organiza: su propia página, o su perfil en la plataforma desde la que publica. | `"https://pyalmeria.example"`<br>`"https://www.meetup.com/pyalmeria/"` |
| `organizers[].type` | enum: organization \| person | opcional | Organización o persona. Por defecto, organización: al traducir hay que elegir un `@type` de schema.org sí o sí, y `Organization` es la opción tolerante. | `"organization"`<br>`"person"` |
| `startDate` | string | **obligatorio** | Inicio en hora de reloj de pared: una fecha (`2026-10-15`) para eventos de todo el día, o una fecha-hora local (`2026-10-15T09:00:00`). Nunca lleva offset UTC: eso lo aporta `timezone`. | `"2026-06-11T18:30:00"`<br>`"2026-10-15"` |
| `endDate` | string | _recomendado_ | Fin en hora de reloj de pared, en la MISMA forma que `startDate` (ambas fechas, o ambas fecha-hora). Si falta, se asume que el evento termina el día que empieza. | `"2026-06-11T20:00:00"`<br>`"2026-10-16"` |
| `timezone` | string | **obligatorio** | Zona horaria IANA (p. ej. `Europe/Madrid`). Convierte un `startDate` de reloj de pared en un instante inequívoco. En eventos de todo el día contextualiza la fecha: no la desplaza. | `"Europe/Madrid"`<br>`"America/Bogota"`<br>`"UTC"` |
| `attendanceMode` | enum: in-person \| online \| hybrid | _recomendado_ | Qué dice quien organiza que es este evento. SIN VALOR POR DEFECTO: ausente significa desconocido, nunca presencial. | `"in-person"`<br>`"online"`<br>`"hybrid"` |
| `location` | object | _recomendado_ | Qué se SABE de dónde ocurre el evento. Pregunta distinta de `attendanceMode`, que declara la intención de quien organiza. | `{"venue":"El Cable, Almería"}`<br>`{"onlineUrl":"https://meet.example/pyalmeria"}`<br>`{"venue":"Campus Madrid, Calle de Moreno Nieto 2, Madrid","address":{"street":"Calle de Moreno Nieto 2","locality":"Madrid","postalCode":"28005","country":"ES"},"onlineUrl":"https://meet.example/rust-madrid"}` |
| `location.venue` | string | opcional | Lugar físico, legible por personas. Su presencia significa que el evento tiene sede física. Es la cadena que cualquier destino puede imprimir tal cual: `LOCATION` de iCal, el texto de un ítem RSS, `Place.name` de schema.org. | `"El Cable, Almería"` |
| `location.address` | object | _recomendado_ | Dirección postal de la sede física, por partes. COMPLEMENTA a `venue`, no lo sustituye: `venue` es la única cadena que todo formato sabe imprimir; `address` es lo que necesita un traductor para emitir un `PostalAddress` de schema.org — cuyos subcampos Google valida uno a uno para el rich result de `Event`. Todas las partes son opcionales; omite lo que no sepas. Una clave ausente significa desconocido; `""` o `null` publican un desconocido como si fuera dato, que es lo único peor que callarse. | `{"street":"Calle de Moreno Nieto 2","locality":"Madrid","postalCode":"28005","country":"ES"}`<br>`{"locality":"Almería","country":"ES"}` |
| `location.address.street` | string | opcional | Calle y número, tal y como se escriben localmente. Puede llevar planta o puerta; es una línea de texto, no un sub-objeto. | `"Calle de Moreno Nieto 2"`<br>`"100 West Snickerpark Dr"` |
| `location.address.locality` | string | opcional | Ciudad, pueblo o localidad. | `"Madrid"`<br>`"Almería"` |
| `location.address.region` | string | opcional | Provincia, estado o comunidad autónoma — el nivel que en ese país queda entre localidad y país. Texto libre o código ISO 3166-2; ambos viajan sin cambios a `addressRegion` de schema.org. | `"Comunidad de Madrid"`<br>`"PA"` |
| `location.address.postalCode` | string | opcional | Código postal, tal y como lo escribe el correo local. Cadena, nunca número: los ceros a la izquierda forman parte de él. | `"28005"`<br>`"19019"` |
| `location.address.country` | string | opcional | Código ISO 3166-1 alfa-2, en mayúsculas (`ES`, `US`, `MX`). Un código y no el nombre del país, porque el nombre tiene una grafía por idioma: «España», «Spain» y «Espagne» son el mismo país, y un consumidor que agrupe eventos por país vería tres. Convertir un nombre en código es consultar una tabla, no inventar — por eso la spec lo pide aquí y en ningún otro sitio. | `"ES"`<br>`"US"` |
| `location.onlineUrl` | string (uri) | opcional | URL para asistir en remoto. Su presencia significa que el evento tiene acceso online. | `"https://meet.example/pyalmeria"` |
| `location.geo` | object | opcional | Coordenadas de la sede física (grados decimales WGS-84). Independiente de `venue`, que es texto libre: un punto, no un nombre. Mapea a `GEO` de iCal y a `Place.geo` (GeoCoordinates) de schema.org. | — |
| `location.geo.lat` | number | **obligatorio** | Latitud en grados decimales. | `40.4168` |
| `location.geo.lon` | number | **obligatorio** | Longitud en grados decimales. | `-3.7038` |
| `tags` | string[] | _recomendado_ | Etiquetas temáticas de forma libre. Mapea a `CATEGORIES` de iCal y a `keywords` de schema.org. Más adelante podría superponerse un vocabulario controlado; el campo en sí sigue siendo libre. Sin valor por defecto: ausente significa desconocido. | `["rust","wasm"]`<br>`["python","async"]` |
| `languages` | string[] | _recomendado_ | Etiquetas BCP 47, p. ej. `["es","en"]`. Sin valor por defecto: ausente significa desconocido. | `["es"]`<br>`["es","en"]` |
| `status` | enum: scheduled \| tentative \| cancelled \| postponed \| rescheduled \| moved-online | opcional | Qué le ha pasado al evento, no al dato. Un evento cancelado, pospuesto o movido a online DEBE seguir publicado: borrarlo deja un evento muerto en el calendario de quien se suscribió. `tentative` significa anunciado pero sin confirmar (el `STATUS:TENTATIVE` de iCal) — existe para que quien importa no tenga que ascender a `scheduled` un evento que nadie ha confirmado, ya que este es el único campo con valor por defecto. | `"scheduled"`<br>`"cancelled"`<br>`"moved-online"` |
| `partOf` | object | opcional | La serie o el evento multi-parte del que este documento es UNA ocurrencia. Es una REFERENCIA, nunca una regla de recurrencia: OTE no genera fechas — quien publica expande la recurrencia en un documento por ocurrencia, cada uno con su `id`, sus fechas y su `status`. Un consumidor que ignore este campo sigue viendo eventos completos y correctos. | `{"id":"https://rustmadrid.example/meetups","name":"Rust Madrid — meetup mensual","url":"https://rustmadrid.example/meetups"}`<br>`{"type":"multipart","id":"https://pyalmeria.example/study-jams/2026-testing","name":"Study Jam de testing en Python (3 sesiones)"}` |
| `partOf.id` | string (uri) | **obligatorio** | Identificador estable de la serie o del evento multi-parte. Mismas reglas que el `id` del evento: una URI bajo un dominio que controle quien publica, acuñada una vez. NO tiene por qué resolver a un documento OTE — es lo que permite a un consumidor agrupar las ocurrencias. | `"https://rustmadrid.example/meetups"`<br>`"https://pyalmeria.example/study-jams/2026-testing"` |
| `partOf.name` | string | opcional | Nombre de la serie o del evento multi-parte, para que un consumidor pueda agrupar sin resolver el `id`. | `"Rust Madrid — meetup mensual"`<br>`"Study Jam de testing en Python (3 sesiones)"` |
| `partOf.url` | string (uri) | opcional | Página que describe la serie o el evento multi-parte en conjunto. | `"https://rustmadrid.example/meetups"` |
| `partOf.type` | enum: series \| multipart | opcional | `series`: ocurrencias independientes que comparten identidad (un meetup mensual). `multipart`: partes de UN SOLO evento celebrado en fechas no consecutivas (un study jam de tres sesiones en sábados no consecutivos, con una sola inscripción). Por defecto `series`, que es la opción tolerante. Cambia la traducción: una serie se convierte en `EventSeries` de schema.org; un evento multi-parte, en un `Event` cuyas partes son su `subEvent`. | `"series"`<br>`"multipart"` |
| `license` | string | **obligatorio** | Licencia de ESTOS DATOS, no del evento. Identificador SPDX (`CC0-1.0`, `CC-BY-4.0`…, lista completa en https://spdx.org/licenses/) o una URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `source` | object | opcional | Procedencia. Obligatoria cuando el evento se importó o agregó de otro sitio; se omite cuando quien organiza describe su propio evento: es la fuente. | `{"name":"Rust Madrid","url":"https://calendar.example/ics/rust-madrid","license":"CC-BY-4.0","retrievedAt":"2026-06-01T05:00:00Z"}` |
| `source.name` | string | **obligatorio** | Nombre de la fuente (p. ej. «Rust Madrid», «Meetup»). | `"Rust Madrid"`<br>`"Meetup"` |
| `source.url` | string (uri) | opcional | Enlace a la ficha original, para poder verificar y corregir el dato en origen. | `"https://calendar.example/ics/rust-madrid"` |
| `source.license` | string | opcional | Licencia bajo la que la FUENTE publica el dato. Restringe lo que puede republicarse: declarar una licencia no concede derechos que la fuente nunca dio. | `"CC-BY-4.0"` |
| `source.retrievedAt` | string | opcional | Cuándo se obtuvo el dato. | `"2026-06-01T05:00:00Z"` |
| `updatedAt` | string | _recomendado_ | Instante en que los DATOS del evento cambiaron por última vez — equivalente a `LAST-MODIFIED` de iCal, no a `DTSTAMP` (que marca la generación y cambia en cada exportación). Permite a un consumidor sincronizar de forma incremental: traer solo lo que cambió desde su última lectura. Ausente significa desconocido, no «nunca cambió». | `"2026-06-10T18:00:00Z"` |

## `feed` — Feed

Una colección de eventos OTE publicada en una URL estable. Un formato de intercambio, no una API.

| Campo | Tipo | Nivel | Descripción | Ejemplos |
| --- | --- | :---: | --- | --- |
| `specVersion` | const: "0.3.0" | **obligatorio** | Versión de OTE Spec a la que se adhiere el feed. Aplica a todos sus eventos. | `"0.3.0"` |
| `title` | string | **obligatorio** | Nombre del feed, legible por personas. | `"Eventos de PyAlmería"` |
| `description` | string | _recomendado_ | Descripción breve del feed. | `"Meetups mensuales de Python en Almería."` |
| `url` | string (uri) | _recomendado_ | URL canónica de la comunidad, directorio u organización que publica el feed. | `"https://pyalmeria.example"` |
| `organizers` | object[] | opcional | Quién organiza los eventos de este feed — VALOR POR DEFECTO de todo evento que no declare el suyo. No es lo mismo que `title`/`url`, que nombran a quien publica el feed: un agregador publica eventos que no organiza, y debe omitir este campo para que cada evento declare el suyo. | `[{"name":"PyAlmería","url":"https://pyalmeria.example"}]` |
| `license` | string | **obligatorio** | Licencia del contenido del feed. Actúa como VALOR POR DEFECTO de todo evento que no declare la suya. Identificador SPDX (lista completa en https://spdx.org/licenses/) o URL. | `"CC-BY-4.0"`<br>`"CC0-1.0"` |
| `licenseUrl` | string (uri) | opcional | URL del texto completo de la licencia. | `"https://creativecommons.org/licenses/by/4.0/"` |
| `updatedAt` | string | **obligatorio** | Cuándo se generó este feed. | `"2026-07-06T10:00:00Z"` |
| `events` | object[] | **obligatorio** | Los eventos del feed. Cada uno hereda `specVersion` y `license` del feed salvo que declare los suyos. | — |
