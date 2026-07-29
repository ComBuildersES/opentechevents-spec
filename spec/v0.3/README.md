# OTE Spec v0.3.0

> 🚧 **Borrador. Inestable.** `0.x` significa que **puede romper sin previo aviso**. Se publica para que existan implementaciones reales (empezando por el importador de `.ics`) y para que rompan lo que esté mal. Discusión: [#5 (evento)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

Especificación mínima para describir eventos de comunidades técnicas y publicarlos en un feed reutilizable.

| Artefacto | Qué es |
| --- | --- |
| [`event.schema.json`](event.schema.json) | **Normativo, ejecutable.** JSON Schema (draft 2020-12) de un evento. |
| [`feed.schema.json`](feed.schema.json) | **Normativo, ejecutable.** JSON Schema de una colección de eventos. |
| Este documento | **Normativo, no ejecutable.** Las reglas que un validador no puede comprobar. |
| [`examples/`](examples/) | Ejemplos, **validados en CI**. Si no pasan el validador, el build falla. |

Los `$id` son las URLs bajo las que se publican los schemas:

```text
https://opentechevents.org/schema/v0.3/event.schema.json
https://opentechevents.org/schema/v0.3/feed.schema.json
```

**Una vez publicada, una versión no se toca.** Las `v0.1` y `v0.2` siguen congeladas en [`spec/v0.1/`](../v0.1/) y [`spec/v0.2/`](../v0.2/); los cambios futuros irán a `spec/v0.4/`. Es lo que permite que un documento diga `specVersion: "0.3.0"` y un consumidor sepa dentro de tres años contra qué validarlo. Qué cambió entre versiones vive en el [CHANGELOG](../../CHANGELOG.md).

## Consumir los schemas

**Como paquete** (recomendado para implementaciones: te ata a una versión, no a lo que hoy haya en una URL):

```bash
npm install @opentechevents/schema
```

```js
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { eventSchema, feedSchema } from "@opentechevents/schema";

const ajv = new Ajv2020({ strict: true, strictRequired: false });
addFormats(ajv);
ajv.addSchema(eventSchema);          // el feed referencia al evento por $id: regístralo antes
const validateFeed = ajv.compile(feedSchema);
```

**Por URL** (para editores, CI de terceros o quien no use npm):

```text
https://opentechevents.org/schema/v0.3/event.schema.json
https://opentechevents.org/schema/v0.3/feed.schema.json
```

## Validar este repo

```bash
npm install
npm run validate
```

## El evento

Obligatorio: `id`, `name`, `startDate`, `timezone` — y, en un documento suelto, `specVersion` y `license`.

Todo lo demás es opcional. **Deliberadamente**: la mayoría de los `.ics` publicados no traen ni URL ni descripción, y una spec que los exija obliga al importador a descartar el evento o a inventarse el dato. Ninguna de las dos cosas es aceptable. `url` y `description` se recomiendan con fuerza; no se exigen.

Ejemplo mínimo real ([`examples/event-minimal.json`](examples/event-minimal.json)):

```json
{
  "specVersion": "0.3.0",
  "id": "https://pyalmeria.example/eventos/2026-06-async",
  "name": "PyAlmería — Introducción a async/await",
  "startDate": "2026-06-11T18:30:00",
  "timezone": "Europe/Madrid",
  "license": "CC-BY-4.0"
}
```

### `id` y `url` empiezan siendo iguales, pero no son lo mismo

`url` es **dónde se describe el evento hoy**. `id` es **qué evento es esto, para siempre**.

Si una comunidad se muda de plataforma a dominio propio, `url` cambia y **`id` no puede cambiar**: es lo que permite a un consumidor *actualizar* el evento que ya tenía en vez de crear un duplicado. Un `id` se acuña una vez, bajo un dominio que controla quien publica (el DNS ya garantiza unicidad: no hace falta registro central), y no se reescribe jamás.

Nadie debería teclear un `id` a mano: las herramientas lo derivan de la URL canónica del evento, o lo acuñan como `<dominio>/events/<comunidad>/<fecha>-<slug>` cuando el evento no tiene página propia.

### Fechas: reloj de pared, no instantes

`startDate` y `endDate` llevan **la hora que aparece en el cartel**, en la zona horaria del evento. **Nunca llevan offset UTC** (`+02:00` ni `Z`): eso lo aporta `timezone`. El schema rechaza un offset dentro de `startDate`.

Dos formas, y **ambas fechas deben usar la misma**:

- **Todo el día**: `"2026-10-15"`.
- **Con hora**: `"2026-10-15T09:00:00"`.

Mezclar (`startDate` fecha, `endDate` fecha-hora) es inválido. Si `endDate` falta, el evento termina el día que empieza.

`timezone` (IANA, `Europe/Madrid`) es **siempre obligatoria**. Con hora, es lo que convierte el reloj de pared en un instante inequívoco. En eventos de todo el día, **contextualiza** la fecha: dice a qué región pertenece ese día — **no la desplaza**. Un consumidor **no debe** convertir un evento de todo el día a otra zona horaria.

La única fecha con offset en toda la spec es `source.retrievedAt` (y `updatedAt` en el feed): son metadatos, instantes reales, no cosas que le pasan a la gente en un sitio.

### `location` y `attendanceMode` no son redundantes

Responden a preguntas distintas:

- **`location`** son **hechos observables**: ¿hay sitio físico?, ¿hay URL para conectarse? Puede estar incompleta.
- **`attendanceMode`** es **la intención de quien organiza**: qué tipo de evento es esto. No depende de que la URL de conexión sea pública todavía.

Casi siempre se podrían derivar el uno del otro, y coinciden. El campo existe para cuando **la derivación falla**. **Si se contradicen, manda `attendanceMode`.**

**`attendanceMode` no tiene valor por defecto.** Ausente significa **desconocido**, no `in-person`. Un valor por defecto dejaría que cualquier productor que simplemente *no tiene* el dato emitiera uno falso sin enterarse: un formulario en blanco, un CMS exportando de una plantilla, un importador leyendo un formato que no sabe expresarlo — **iCalendar, el formato de eventos más publicado del mundo, no modela la modalidad en absoluto**. Callarse y decir `in-person` son afirmaciones distintas, y solo una es honesta.

Si `location` está presente, debe traer al menos `venue` o `onlineUrl`. Un `location: {}` es inválido: no dice nada, y decir nada ya se hace omitiendo el campo.

### `status`: un evento cancelado sigue publicado

`scheduled` (por defecto), `cancelled`, `postponed`, `rescheduled`.

Un evento **cancelado o pospuesto debe seguir en el feed**. Borrarlo en silencio deja a quien se suscribió con un evento muerto en su calendario y sin forma de enterarse. El `status` **es** la forma de enterarse.

### `license` y `source`: qué se puede reutilizar, y de dónde salió

`license` es la licencia de **estos datos**, no del evento. SPDX (`CC0-1.0`, `CC-BY-4.0`) o una URL. Va en SPDX y no en prosa (`CC BY 4.0`) porque un importador tiene que compararla contra una allowlist, y para eso necesita un identificador, no una frase.

`source` es **obligatoria cuando el evento se importó o agregó** de otro sitio (un `.ics`, Meetup, otro directorio). Se omite cuando quien organiza describe su propio evento: **es** la fuente.

`source.license` (lo que la fuente permite) y `license` (lo que este documento permite) son campos distintos y **no tienen por qué coincidir**. Pero los términos de la fuente **restringen lo que puede republicarse**: declarar una `license` no concede derechos que la fuente nunca dio.

### `organizers`: quién organiza — y las tres cosas que no es

Nuevo en la v0.3. Opcional, y **una lista**, no un objeto:

```json
"organizers": [
  { "name": "GDG Madrid", "url": "https://gdgmadrid.example" },
  { "name": "Python Madrid", "url": "https://www.meetup.com/python-madrid/" },
  { "type": "person", "name": "Ada Lovelace", "url": "https://ada.example" }
]
```

Solo `name` es obligatorio. `url` y `type` (`organization` por defecto, o `person`) son opcionales. **Y nada más**: ni logo, ni email, ni identificadores. El campo describe *quién*, no *cómo contactarle*.

**Es una lista porque la co-organización es lo normal**, no la excepción: dos comunidades que juntan meetup, una comunidad y su anfitrión. Luma ya emite `organizer` como array (organización + persona) y schema.org lo acepta. Ensanchar un objeto a lista más tarde habría sido un cambio que rompe; nace lista. **El orden es significativo**: el primero es el principal, y es el único que sobrevive a iCal.

Tres confusiones que conviene desactivar antes de que ocurran:

1. **`organizers` no es `source`.** Quién hace el evento vs. de dónde salieron los datos. Un evento de PyAlmería recogido de Meetup tiene `organizers: [PyAlmería]` y `source: { name: "Meetup" }`. Son ortogonales y a menudo aparecen los dos.
2. **`organizers` no son ponentes.** Quien da la charla no está modelado en la v0.3 (ver «Lo que la v0.3 no resuelve»). Meter a un ponente en `organizers` corrompe el dato para todo el que lo consuma.
3. **`feed.organizers` no es `feed.title`/`feed.url`.** `title`/`url` nombran a **quien publica** el feed; `organizers`, a **quien organiza** los eventos. En un feed de una sola comunidad coinciden. En un feed de agregador **no**, y ahí está justo el valor del campo: sin él, un consumidor no tiene más remedio que caer en `feed.title` y atribuirle al agregador todos los eventos que agrega.

**Herencia: reemplazo, no fusión.** Igual que `license`, `feed.organizers` es el valor por defecto de todo evento que no declare el suyo. Un evento que **sí** lo declara **sustituye la lista entera**; no se suma a la heredada. Con fusión no habría forma de *quitar* un organizador heredado, y un evento invitado dentro del feed de una comunidad acabaría atribuido a quien no lo organiza. La consecuencia práctica: en el evento co-organizado de un feed comunitario hay que **repetir** la comunidad del feed junto a la invitada — ver [`examples/feed-community.json`](examples/feed-community.json).

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `organizer` (array), `@type` `Organization`/`Person` según `type`, `name`, `url` | Ninguna. Es el destino que mejor encaja junto a Atom. |
| **Atom** | `<author><name>…</name><uri>…</uri></author>`, repetible | Ninguna. |
| **RSS 2.0** | `<dc:creator>` | `<author>` de RSS 2.0 **exige un email**, que OTE no modela; por eso `dc:creator`. |
| **iCal** | `ORGANIZER;CN="…"` | **Grave, y asumida.** `ORGANIZER` es un `CAL-ADDRESS`: en la práctica un `mailto:`. Sin email **no hay `ORGANIZER` válido** que emitir → degrádalo a `X-OTE-ORGANIZER` o a la `DESCRIPTION`. Y `ORGANIZER` es **único**: del segundo en adelante no hay dónde ponerlos. |

Que el email arreglaría iCal es cierto, y aun así se queda fuera de la v0.3: publicar la dirección de quien organiza en un feed abierto y rastreable es regalarla a los recolectores de spam. La pérdida en iCal es el precio, y es un precio deliberado. Si alguien lo necesita de verdad, entra por la vía de siempre —una extensión, en producción— y se gradúa si sobrevive.

**Por qué no hay `id` ni `communityId`.** Se valoró un identificador que enlazase al organizador con un directorio de comunidades, del estilo `combuilders:mi-comunidad`. Se descarta en la v0.3 por tres razones: exige una **gobernanza de prefijos** (quién asigna `combuilders`, quién resuelve colisiones) que este proyecto no tiene y que acoplaría OTE a otro; contradice la regla de `id` de la propia spec (*una URI bajo un dominio que controlas*, que no necesita registro central porque el DNS ya garantiza la unicidad); y sobre todo **no hay todavía un consumidor real** — el directorio no existe como especificación. Meterlo ahora sería exactamente el diseño especulativo que la sección de Extensiones prohíbe.

No hace falta esperar a nadie para usarlo: es un campo de extensión con prefijo (ver abajo), funciona hoy, y si sobrevive al uso real se gradúa a núcleo con la forma que dicte ese uso.

### `tags`, `location.geo`, `updatedAt`: lo que la v0.2 añade

Los tres son **opcionales** y entraron por la misma razón: el importador de `.ics` los tenía delante en cada `VEVENT` y no había dónde ponerlos. Ninguno es una idea especulativa; los tres tienen ya un productor real. Detalle en el [CHANGELOG](../../CHANGELOG.md).

- **`tags`** — lista libre de temáticas (`["rust","wasm"]`). Mapea a `CATEGORIES` de iCal y a `keywords` de schema.org. **Libre a propósito**: quien organiza etiqueta como quiera. Un vocabulario controlado (para no ensuciar interfaces de filtro o suscripción) podría superponerse más adelante **sin** cerrar el campo. Ausente = desconocido, no «sin temática».
  > **`CATEGORIES` no viaja por Google Calendar** (no lo emite ni lo lee). Un importador puede recuperar temáticas de una convención de *hashtags* (`#rust`) en la `description` — pero eso es **comportamiento del importador, no del schema**: aquí `tags` es siempre la lista estructurada.

- **`location.geo`** — punto WGS-84 `{ lat, lon }` en grados decimales. Mapea a `GEO` de iCal y a `Place.geo` de schema.org. Es **independiente de `venue`** (texto libre): un punto en el mapa, no un nombre. Va **dentro de `location`** —hermano de `venue`/`onlineUrl`— igual que schema.org anida `geo` dentro de `Place`; no cuelga de `venue`, porque `venue` es una cadena, no un objeto. `geo` no basta por sí solo para satisfacer `location`: sigue haciendo falta `venue` u `onlineUrl`.

- **`updatedAt`** — instante (con offset/Z) en que **los datos del evento** cambiaron por última vez. Es el equivalente de `LAST-MODIFIED` de iCal, **no** de `DTSTAMP`: `DTSTAMP` marca *cuándo se generó el fichero* y cambia en cada exportación aunque no haya cambiado nada, así que no sirve para «qué cambió». Su valor está en la **sincronización incremental**: un consumidor que lee el feed a diario filtra por `updatedAt > última_lectura` en vez de recomparar la colección entera. El `updatedAt` del feed dice «algo cambió»; el del evento dice **qué**. Ausente = desconocido, no «nunca cambió».

## El feed

Obligatorio: `specVersion`, `title`, `license`, `updatedAt`, `events`.

**La `license` del feed es el valor por defecto de sus eventos**: un evento que no declare la suya hereda la del feed. Repetir `"license": "CC-BY-4.0"` en 200 eventos es ruido, no rigor. Un evento *dentro de un feed* tampoco repite `specVersion`: hereda la del feed. Un evento **suelto** (fuera de un feed) sí debe declarar ambas — no tiene de quién heredarlas.

**`organizers` se hereda igual, con una diferencia**: la lista del evento **reemplaza** la del feed, no se suma a ella (el porqué, arriba). Y un feed de **agregador** debe **omitir** `organizers`: no organiza lo que publica, y ponerlo ahí atribuiría mal cada evento del feed.

Por eso el schema del evento tiene dos capas: `$defs/event` (lo común) y el documento de nivel superior, que añade `specVersion` y `license` como obligatorios. El feed referencia `$defs/event`.

El feed es un **formato de intercambio, no una API**: sin paginación, sin filtrado, sin autenticación, sin federación.

## Extensiones

Los schemas **no prohíben campos adicionales**. Si tu comunidad necesita `image` o `cfp` hoy, ponlos: tu documento sigue siendo válido. Es la vía por la que la spec debe crecer — **campos que alguien ya usa de verdad**, no campos que imaginamos que hará falta usar. Así entró `tags` en la v0.2, y así entró `organizers` en la v0.3.

Cuando un campo se estandarice, se le dará un significado normativo. Hasta entonces, un consumidor puede ignorarlos sin miedo.

### Dos tipos de extensión, y por qué distinguirlos

Bajo «campo adicional» conviven dos cosas muy distintas, y confundirlas se paga más adelante:

| | Qué es | Cómo se escribe | Ejemplo |
| --- | --- | --- | --- |
| **Candidato a núcleo** | Un campo genérico que **aspira a ser de OTE**. Lo usas hoy porque te hace falta; si a más gente le hace falta, se estandariza. | **Sin prefijo** | `image`, `cfp`, `offers` |
| **Vocabulario externo** | Un campo cuyo significado **lo define otro proyecto** y que nunca será de OTE, porque no le pertenece. | **Con prefijo `proyecto:campo`** | `combuilders:communityId` |

**Compromiso de la spec: OTE no acuñará jamás un nombre de campo que contenga `:`.** Es una reserva de espacio de nombres, y es lo que hace segura la segunda fila: un campo con prefijo **no puede colisionar** con un campo del núcleo, hoy ni en la v1.0. Un campo sin prefijo sí puede — y el día que OTE estandarice ese nombre, tu significado local desaparece bajo el normativo. Elige en consecuencia: sin prefijo estás proponiendo, con prefijo estás integrando.

Un consumidor de OTE ignora ambos tipos sin miedo. La diferencia no la nota él: la nota quien mantiene el dato dentro de dos versiones.

Esto es lo que permite que OTE **conecte** con otras especificaciones sin **acoplarse** a ellas. Un directorio de comunidades puede definir su propio identificador y publicarlo dentro de un documento OTE válido, hoy, sin pedir permiso ni esperar a una versión:

```json
"organizers": [
  {
    "name": "GDG Madrid",
    "url": "https://gdgmadrid.example",
    "combuilders:communityId": "gdg-madrid"
  }
]
```

OTE no sabe qué significa `combuilders:communityId` y no le hace falta saberlo. El prefijo garantiza que las dos especificaciones puedan evolucionar por separado sin pisarse. Ver [`examples/event-co-organized.json`](examples/event-co-organized.json).

## Lo que la v0.3 no resuelve

Deduplicación entre fuentes, sincronización, publicación automática en plataformas, modelado de ponentes/agenda/patrocinadores, entradas y registro, CFP.

El objetivo es describir **el evento**, no el registro en una base de datos.

## Preguntas abiertas

### Descubrimiento: cómo se encuentra un feed desde una web

Ver [#6](https://github.com/OpenTechEvents/opentechevents-spec/issues/6). Los tres mecanismos **no son excluyentes**, y probablemente hagan falta los tres:

| Mecanismo | Para quién | Estado |
| --- | --- | --- |
| **`<link rel="alternate">`** en el `<head>`, símil RSS | **Todo el mundo.** Es el único que funciona para quien publica en una ruta cuyo dominio no controla: GitHub Pages de proyecto (`usuario.github.io/repo`), una página dentro de un dominio corporativo, un CMS ajeno. | Propuesto como **mecanismo principal**. Falta decidir el MIME: `application/ote+json` propio vs. reutilizar `application/feed+json`. |
| **`/.well-known/ote-feed`** | Quien **sí controla el apex** de su dominio. Permite descubrir sin parsear HTML — barato para un crawler. | Propuesto como **complemento**. Ver abajo. |
| **JSON-LD `schema.org/Event`** embebido en la página | Reaprovecha lo que ya detectan Google y agregadores como dev.events. | Es una **fuente para importadores** (ver la [extensión de navegador](../../ecosystem/browser-extension.md)), no un feed: describe *un* evento, no una colección. |

> 📌 **Dato relevante sobre `/.well-known/`**: el [registro de IANA](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) **no tiene ninguna entrada para feeds** — ni RSS, ni Atom, ni JSON Feed. Su procedimiento de registro es *«Specification Required»*, y **OTE tiene una especificación**, así que `ote-feed` podría **registrarse formalmente** (aunque sea con estado provisional) en vez de okupar una ruta. Sería, de hecho, el primer well-known de feeds del registro.

### Serialización: ¿solo un fichero, o también metadatos embebidos?

Hoy la spec asume **un fichero JSON en una URL**. La alternativa —o el complemento— es permitir el feed **embebido en la propia página**, al estilo del JSON-LD de schema.org:

```html
<script type="application/ote+json">{ "specVersion": "0.3.0", "kind": "feed", … }</script>
```

- **A favor**: quien usa un CMS o un generador de sitios puede pegar un bloque en su plantilla, pero a menudo **no puede publicar un fichero suelto** ni tocar `/.well-known/`. Baja la barrera de entrada justo para quien menos herramientas tiene.
- **En contra**: obliga a los consumidores a parsear HTML, acopla el feed a una página concreta, y complica servir el mismo dato como `.ics` o RSS.

Pendiente de decidir. Si se acepta, sería una **serialización equivalente** del mismo documento, no un formato distinto — y habría que cambiar la promesa de la web («es un archivo que publicas»).

### Otras

- **`id` de un evento importado de un `.ics` sin URL.** Hoy los ejemplos usan `<url-del-ics>#<UID>`. Funciona y es estable, pero ata el `id` al calendario de origen: si la comunidad se muda, el `id` que acuñó el importador ya no está bajo un dominio que ella controle.
- **Serialización.** El schema es JSON. YAML es cómodo para escribir a mano (los issues usan YAML) y se mapea 1:1. ¿Se declaran ambos normativos?
- **`license` obligatoria en el evento suelto**: ¿es una barrera de entrada demasiado alta para quien solo quiere publicar su meetup?
