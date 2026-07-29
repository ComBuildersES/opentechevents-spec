# Changelog — OTE Spec

Todos los cambios relevantes de la especificación. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado es
[SemVer](https://semver.org/lang/es/): mientras la spec esté en `0.x` se
considera **inestable** (puede romper entre versiones menores; la `1.0.0` será
la primera estable).

Cada versión publicada vive congelada en su carpeta (`spec/v0.1/`, `spec/v0.2/`, `spec/v0.3/`…)
y bajo su `$id` (`https://opentechevents.org/schema/vX.Y/…`). Un documento declara
a cuál se adhiere con `specVersion`, así que **nada se rompe al publicar una
versión nueva**: los documentos `0.1.0` siguen validando contra `spec/v0.1/`.

## [0.3.0] — 2026-07-29

Dos campos nuevos, **opcionales y retrocompatibles** (por eso MINOR): un documento
`0.2.0` válido, con solo cambiar `specVersion` a `"0.3.0"`, sigue siendo válido.

Entra `organizers` —**quién organiza el evento**— porque era el único hueco del
núcleo que aparece en **las cuatro** plataformas estudiadas (Meetup, Eventbrite,
Luma, Guild) y en el ejemplo canónico de Google, y porque tiene destino nativo en
los tres formatos de salida: `organizer` de schema.org, `ORGANIZER` de iCal,
`<author>` de Atom.

El agujero que tapa es concreto: sin él, un consumidor solo puede atribuir un
evento cayendo en `feed.title` — lo que hace que **un feed de agregador atribuya
al agregador todos los eventos que agrega**.

Y entra `partOf`, que agrupa las ocurrencias de una serie o las partes de un
evento multi-parte **sin** meter una regla de recurrencia dentro del feed.

### Added

- **`organizers`** (`array`, mín. 1) en el **evento** y en el **feed**. Cada
  entrada: `name` (obligatorio), `url` y `type` (`organization` por defecto, o
  `person`) opcionales. **Nada más** — sin logo, email ni identificadores: el
  campo describe *quién*, no *cómo contactarle*.
  - **Es una lista, no un objeto.** La co-organización es lo normal (dos
    comunidades, o comunidad + anfitrión); Luma ya emite `organizer` como array.
    Ensanchar objeto → lista después habría roto. **El orden es significativo**:
    el primero es el principal, y es el único que sobrevive a iCal.
  - **`type` sí tiene valor por defecto** (`organization`), a diferencia de
    `attendanceMode`. Motivo: al traducir hay que elegir un `@type` de schema.org
    sí o sí, y `Organization` es la opción tolerante.
  - **Herencia feed → evento por REEMPLAZO, no por fusión.** Como `license`, el
    `organizers` del feed es el valor por defecto de sus eventos; pero el evento
    que declara el suyo **sustituye la lista entera**. Con fusión no habría forma
    de *quitar* un organizador heredado. Consecuencia práctica: en un evento
    co-organizado dentro de un feed comunitario hay que **repetir** la comunidad
    del feed.
  - **Un feed de agregador debe OMITIR `organizers`**: no organiza lo que
    publica.

- **`partOf`** (`object`) en el **evento**. La serie o el evento multi-parte del
  que este documento es **una ocurrencia**. `id` obligatorio; `name`, `url` y
  `type` (`series` por defecto, o `multipart`) opcionales.
  - **Es una referencia, no una regla de recurrencia.** La norma que lo acompaña:
    **un documento = una ocurrencia, y quien publica expande**. Un meetup mensual
    son doce documentos, cada uno con su `id`, sus fechas y su `status`; un curso
    en tres sábados, tres. `partOf` solo dice a qué conjunto pertenecen.
  - **`type` cambia la traducción**, no es decoración: `series` → `EventSeries` de
    schema.org; `multipart` → un `Event` cuyas partes son su `subEvent`. En iCal,
    `RELATED-TO;RELTYPE=PARENT` en ambos casos. En Atom/RSS no hay equivalente y
    **se ignora, sin daño**: la entrada sigue describiendo un evento con su fecha
    real. Un campo de identidad que se ignora deja datos incompletos; uno de
    fechas que se ignora deja datos **falsos**. Solo lo primero es aceptable.
  - **Un evento multi-parte no se expresa estirando las fechas.** `startDate` en
    la primera parte + `endDate` en la última afirma un evento continuo de quince
    días y ocupa dos semanas en el calendario de quien se suscriba.
  - Reglas para quien expande: horizonte acotado en series infinitas (12 meses o
    12 ocurrencias), `id` por ocurrencia (`<id-serie>#<fecha>` si no tiene página
    propia — el equivalente de `RECURRENCE-ID`), y `EXDATE` deja de existir: es
    *no emitir* ese documento, o `status: cancelled` si ya se había publicado.

- **Política de extensiones con prefijo**, en el README de la spec. Se distinguen
  dos tipos de campo adicional: **candidato a núcleo** (sin prefijo: `image`,
  `cfp`) y **vocabulario externo** (con prefijo: `combuilders:communityId`).
  - **Compromiso normativo: OTE no acuñará jamás un nombre de campo que contenga
    `:`.** Es una reserva de espacio de nombres — un campo con prefijo no puede
    colisionar con uno del núcleo, hoy ni en la v1.0.
  - Es lo que permite que OTE **conecte** con otras especificaciones (un
    directorio de comunidades, por ejemplo) sin **acoplarse** a ellas.

### Decidido NO incluir

- **`eventSchedule` (schema.org `Schedule`), en sustitución de
  `timezone`/`startDate`/`endDate`.** Sería más expresivo —`repeatFrequency`,
  `byDay`, `exceptDate`— y se descarta por cuatro razones:
  1. **Mete un motor de expansión en un fichero.** El feed es un formato de
     intercambio, no una API: el consumidor lee, no calcula. Con una regla, hasta
     el script de treinta líneas que pinta un listado necesita aritmética de
     calendario (DST, excepciones, series infinitas, semántica de `"2MO"`).
  2. **RSS/Atom no pueden expresarla.** Quien exporte tiene que expandir
     igualmente: la expansión ocurre siempre, y la pregunta es solo **quién** la
     hace. Mejor quien publica —una vez, con el dato delante— que cada consumidor
     por su cuenta, cada uno con su bug.
  3. **Rompe reglas que la spec ya tiene.** Un `id` estable no sobrevive a N
     ocurrencias en un documento (haría falta un `RECURRENCE-ID`), y
     `status: cancelled` deja de ser expresable por ocurrencia: cancelar *la
     sesión de agosto* volvería a ser imposible.
  4. **No hay productor real.** De las cinco fuentes estudiadas (Meetup,
     Eventbrite, Luma, Guild y el ejemplo canónico de Google), **ninguna** emite
     `eventSchedule` — todas emiten fecha plana por ocurrencia, incluida la sesión
     *semanal* de Luma. Y Google, que consume schema.org a escala, pide
     explícitamente un `Event` por fecha.
- **`RRULE` como campo del núcleo.** Misma razón. Un importador que quiera
  round-trip sin pérdida la guarda como vocabulario externo con prefijo
  (`"ics:rrule": "FREQ=MONTHLY;BYDAY=2MO"`): informativa, y ningún consumidor de
  OTE está obligado a evaluarla.
- **`organizers[].email`.** Arreglaría la traducción a iCal (`ORGANIZER` es un
  `CAL-ADDRESS`, en la práctica un `mailto:`, así que **sin email no hay
  `ORGANIZER` válido que emitir**). Se queda fuera igualmente: publicar la
  dirección de quien organiza en un feed abierto y rastreable es regalarla a los
  recolectores de spam. La pérdida en iCal es un precio deliberado; degrádalo a
  `X-OTE-ORGANIZER` o a la `DESCRIPTION`.
- **`organizers[].logo`, `organizers[].sameAs`.** Sobrecargan el campo sin que
  ningún consumidor los pida todavía.
- **`organizers[].id` / `linking.communityId`.** Se valoró un identificador
  (`combuilders:mi-comunidad`) que enlazara con un directorio de comunidades.
  Descartado: exige una **gobernanza de prefijos** que este proyecto no tiene y
  que acoplaría OTE a otro; contradice la regla de `id` de la propia spec (*una
  URI bajo un dominio que controlas*, que no necesita registro central porque el
  DNS ya garantiza unicidad); y **no hay todavía un consumidor real** — el
  directorio no existe como especificación. Entra hoy como extensión con prefijo,
  y se graduará a núcleo si sobrevive al uso real, con la forma que dicte ese uso.

### Changed

- El campo de extensión **`community`** (`{ uri, name }`) que aparecía en los
  ejemplos como campo *en discusión* queda **superado por `organizers`** y se
  retira de ellos. Nunca fue normativo, así que esto no rompe nada: quien lo
  emita seguirá validando.
- El paquete npm exportaba solo los subpaths de `v0.1`. Ahora expone `v0.1`,
  `v0.2` y `v0.3`.

### Migration — cómo actualizar una herramienta

- **Consumidores:** el campo es opcional; el código de v0.2 lo ignora sin
  romperse. Para aprovecharlo: leer `event.organizers` y, si falta, caer en
  `feed.organizers` — **nunca** en `feed.title`. Ausente en ambos = desconocido.
  Si usabas el campo de extensión `community`, migra a `organizers`.
- **Validadores por paquete:** `npm install @opentechevents/schema@0.3.0`. El
  paquete exporta ahora los schemas de `v0.3` y `specVersion === "0.3.0"`.
- **Validadores por URL:** apuntar a
  `https://opentechevents.org/schema/v0.3/{event,feed}.schema.json`. Las URLs de
  `v0.1` y `v0.2` siguen sirviéndose sin cambios.
- **Exportadores a schema.org:** `organizers` → `organizer` (array), con `@type`
  `Organization` o `Person` según `type`.
- **Exportadores a Atom / RSS:** Atom → un `<author>` por entrada, con `<name>` y
  `<uri>`. RSS 2.0 → `<dc:creator>`, **no** `<author>`: el `<author>` de RSS 2.0
  exige un email que OTE no modela.
- **Exportadores a iCal:** solo `organizers[0]`, y solo si tienes un email por
  otra vía; si no, `X-OTE-ORGANIZER`. Los demás no tienen dónde ir.
- **Importadores (`.ics` → OTE):** `ORGANIZER;CN="…"` → `organizers[0].name`. El
  `mailto:` se descarta. **`RRULE`/`RDATE` → expandir**: un documento por
  ocurrencia, todos con el mismo `partOf.id`; `EXDATE` → no emitir ese documento;
  `RECURRENCE-ID` → el `id` de esa ocurrencia. La regla original, si la quieres
  conservar, en `ics:rrule`.
- **Exportadores a iCal:** `partOf` → `RELATED-TO;RELTYPE=PARENT:<id>`. **Nunca
  reconstruyas un `RRULE`**: emites las ocurrencias que tienes.

## [0.2.0] — 2026-07-15

Primera ampliación del núcleo. Los tres campos son **opcionales y
retrocompatibles** (por eso MINOR, no MAJOR): un documento `0.1.0` válido, con
solo cambiar `specVersion` a `"0.2.0"`, sigue siendo válido. Entraron los tres
por la misma vía —la primera implementación real, el agregador de `.ics`
([`opentechevents-data`](https://github.com/OpenTechEvents/opentechevents-data)),
los tenía delante en cada `VEVENT` y no había dónde ponerlos— no por diseño
especulativo.

### Added

- **`tags`** (`string[]`) en el evento. Etiquetas temáticas de forma libre.
  Mapea a `CATEGORIES` de iCal y a `keywords` de schema.org. Se mantiene libre a
  propósito; un vocabulario controlado podría superponerse después sin cerrar el
  campo. Graduó desde el estado «en discusión» de la v0.1.
- **`location.geo`** (`{ lat, lon }`, grados decimales WGS-84) en el evento.
  Mapea a `GEO` de iCal y a `Place.geo` de schema.org. Va **dentro de
  `location`**, hermano de `venue`/`onlineUrl` (no cuelga de `venue`, que es una
  cadena). No basta por sí solo para satisfacer `location`.
- **`updatedAt`** (instante ISO 8601 con offset/Z, mismo `$defs/instant` que
  `Feed.updatedAt`) en el evento. Instante en que **los datos del evento**
  cambiaron por última vez — equivalente a `LAST-MODIFIED` de iCal, **no** a
  `DTSTAMP`. Habilita sincronización incremental por evento
  (`updatedAt > última_lectura`).

### Migration — cómo actualizar una herramienta

- **Consumidores:** los tres campos son opcionales; el código de v0.1 los ignora
  sin romperse. Para aprovecharlos, leer `tags`, `location.geo` y `updatedAt`
  cuando estén presentes; ausente significa *desconocido*, nunca un valor por
  defecto.
- **Validadores por paquete:** `npm install @opentechevents/schema@0.2.0`. El
  paquete ahora exporta los schemas de `v0.2` y `specVersion === "0.2.0"`.
- **Validadores por URL:** apuntar a
  `https://opentechevents.org/schema/v0.2/{event,feed}.schema.json`. Las URLs de
  `v0.1` siguen sirviéndose sin cambios.
- **Productores / importadores (`.ics` → OTE):**
  - `CATEGORIES` → `tags` (separar por coma, `trim`, dedupe).
  - `GEO` → `location.geo` (parsear `"lat;lon"`, separador `;`, a `number`).
    ⚠️ Es `location.geo`, **no** `location.venue.geo`: en OTE `venue` es una
    cadena.
  - `LAST-MODIFIED` → `updatedAt` (si falta, `DTSTAMP` como último recurso, pero
    es ruidoso: marca generación, no edición).
  - `CATEGORIES` no viaja por Google Calendar (no lo emite ni lo lee). Un
    importador puede recuperar temáticas de *hashtags* (`#rust`) en la
    `description`; es convención del importador, no del schema.

## [0.1.0] — 2026-07

Primera versión publicada. Núcleo mínimo para describir un evento de comunidad
técnica y publicarlo en un feed reutilizable: `id`, `name`, `startDate`,
`timezone` obligatorios (más `specVersion` y `license` en un documento suelto);
`url`, `description`, `endDate`, `location` (`venue`/`onlineUrl`),
`attendanceMode`, `languages`, `status`, `source` opcionales. Feed con
`specVersion`, `title`, `license`, `updatedAt`, `events`. Congelada en
[`spec/v0.1/`](spec/v0.1/).

[0.3.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.3
[0.2.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.2
[0.1.0]: https://github.com/OpenTechEvents/opentechevents-spec/tree/main/spec/v0.1
