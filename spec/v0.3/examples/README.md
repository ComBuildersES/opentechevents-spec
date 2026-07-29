# Ejemplos — OTE Spec v0.3

Todos **se validan en CI** contra [`../event.schema.json`](../event.schema.json) y [`../feed.schema.json`](../feed.schema.json). Si dejan de validar, el build falla. Cópialos con confianza.

| Fichero | Qué ilustra |
| --- | --- |
| [`event-minimal.json`](event-minimal.json) | Lo mínimo que la spec exige. Nada más. |
| [`event-from-ics.json`](event-from-ics.json) | Evento **importado de un `.ics`**: sin `url`, sin `image` —iCalendar casi nunca la trae—, con `source` y **sin `attendanceMode`** — porque iCalendar no sabe expresarlo, y callarse es más honesto que inventar. Muestra los campos que la v0.2 añadió desde iCal: `tags` (← `CATEGORIES`), `location.geo` (← `GEO`) y `updatedAt` (← `LAST-MODIFIED`). |
| [`event-all-day.json`](event-all-day.json) | Evento de **varios días completos**: `startDate`/`endDate` como fechas, sin hora. |
| [`event-meetup.json`](event-meetup.json) | Meetup híbrido, con `image` (el mismo cartel en tres recortes), `offers` con `price: 0` —así se dice «gratis»— y una extensión (ver abajo). |
| [`event-conference-cfp.json`](event-conference-cfp.json) | Conferencia con **tres tipos de entrada** (`offers`, uno ya agotado) y **CFP abierto** (`cfp`), ambos normativos desde la v0.3. |
| [`event-co-organized.json`](event-co-organized.json) | **Tres organizadores** —dos comunidades y una persona— y un campo de **vocabulario externo con prefijo** (`combuilders:communityId`). |
| [`event-online.json`](event-online.json) | Evento **solo online**: `location` con `onlineUrl` y sin sede física, más `partOf` de una serie semanal. |
| [`event-hackathon.json`](event-hackathon.json) | **Hackathon** continuo de fin de semana: cruza la medianoche y por eso **no** lleva `partOf` — es un evento, no dos sesiones. |
| [`event-recurring.json`](event-recurring.json) | **Una ocurrencia** de un meetup mensual, con [`partOf`](../README.md#recurrencia-y-eventos-multi-parte-partof). La recurrencia **se expande al publicar**: un documento por edición, nunca una regla dentro del feed. |
| [`feed.json`](feed.json) | Un **feed de agregador**: sus eventos heredan `specVersion` y `license`, pero **no** `organizers` — el agregador no organiza lo que publica, así que lo omite y cada evento declara el suyo. |
| [`feed-community.json`](feed-community.json) | Un **feed de comunidad**: `organizers` va en el feed y lo heredan sus eventos. El segundo evento lo declara y **reemplaza** la lista heredada — por eso repite la comunidad del feed. |
| [`feed-multipart.json`](feed-multipart.json) | Un **evento multi-parte**: un study jam en tres sesiones, en sábados no consecutivos, como **tres documentos** con el mismo `partOf` (`type: multipart`). No como un evento de quince días. |
| [`invalid/`](invalid/) | Documentos que **deben ser rechazados**. El CI falla si el validador los acepta: un schema que solo acepta no es un schema. |

## Campos en discusión (extensiones)

`event-meetup.json` y `event-recurring.json` usan campos que **NO forman parte de la v0.3**:

| Campo | Estado |
| --- | --- |
| `capacity` (aforo, en `event-meetup.json`) | 🗣️ En discusión — [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5). Se quedó fuera de `offers` a propósito: es estado de la taquilla, no de la entrada. |
| `ics:rrule` (en `event-recurring.json`) | 🔗 **Vocabulario externo**, con prefijo. La regla original del `.ics`, guardada para poder hacer round-trip. **Informativa**: las ocurrencias ya vienen expandidas, así que nadie tiene que evaluarla. |

> `offers` y `cfp` **ya son normativos desde la v0.3**, y con otra forma de la que tenían aquí como propuesta: `offers` es una **lista** (varios tipos de entrada) sin `isFree` —lo gratis es `price: 0`— y sin `capacity`; `cfp` ya no lleva `timezone`, porque sus fechas límite son **instantes con offset**. Si los emitías con la forma antigua, migra: ver [`offers`](../README.md#offers-cuánto-cuesta-y-dónde-se-saca-la-entrada) y [`cfp`](../README.md#cfp-la-convocatoria-de-charlas--y-el-primer-campo-que-no-viaja-a-ninguna-parte).
>
> `image` **también es normativo desde la v0.3**, y como lista (`image[]`, no una cadena). Entró por esta misma vía: lo emiten las cinco fuentes estudiadas y Google lo pide. Si lo emitías como cadena suelta, migra a lista.
>
> `tags` **ya es normativo desde la v0.2** (mapea a `CATEGORIES` de iCal). Entró justo por esta vía: un campo que un consumidor real —el agregador— ya usaba. Ver el [CHANGELOG](../../../CHANGELOG.md).
>
> `community` (`{ uri, name }`) estuvo aquí hasta la v0.3 y **lo sustituye [`organizers`](../README.md#organizers-quién-organiza--y-las-tres-cosas-que-no-es)**, ya normativo. Si lo emitías, migra.

### Dos tipos de extensión

Los de la tabla van **sin prefijo**: son **candidatos a núcleo**, campos genéricos que aspiran a ser de OTE. `combuilders:communityId`, en cambio, lleva **prefijo** porque su significado **lo define otro proyecto** y nunca será de OTE.

**OTE se compromete a no acuñar jamás un nombre de campo que contenga `:`**, así que un campo con prefijo no puede colisionar con uno del núcleo. Un campo sin prefijo sí: el día que OTE estandarice ese nombre, tu significado local desaparece bajo el normativo. Detalle en la [sección «Extensiones» del README](../README.md#extensiones).

**Y aun así esos documentos son válidos.** No es un descuido: **los schemas de OTE no prohíben campos adicionales**, a propósito. Si tu comunidad necesita `tags` hoy, los pones y tu feed sigue validando; un consumidor que no los entienda puede ignorarlos sin romperse.

Esa es la vía por la que la spec debe crecer: **campos que alguien ya usa de verdad**, no campos que imaginamos que harán falta. Los nombres y las formas que ves aquí son **una propuesta**, no un compromiso — pueden cambiar al estandarizarse.

👉 **Si los usas, dilo en el [issue #5](https://github.com/OpenTechEvents/opentechevents-spec/issues/5)**. El uso real es el argumento que hace avanzar un campo; una petición sin caso detrás, no.

## Validar los tuyos

```bash
npm install
npm run validate -- mi-feed.json
```
