# OTE Spec v0.3.0

> 🚧 **Borrador. Inestable.** `0.x` significa que **puede romper sin previo aviso**. Se publica para que existan implementaciones reales (empezando por el importador de `.ics`) y para que rompan lo que esté mal. Discusión: [#5 (evento)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).

Especificación mínima para describir eventos de comunidades técnicas y publicarlos en un feed reutilizable.

| Artefacto | Qué es |
| --- | --- |
| [`event.schema.json`](event.schema.json) | **Normativo, ejecutable.** JSON Schema (draft 2020-12) de un evento. |
| [`feed.schema.json`](feed.schema.json) | **Normativo, ejecutable.** JSON Schema de una colección de eventos. |
| [`event.recommended.schema.json`](event.recommended.schema.json)<br>[`feed.recommended.schema.json`](feed.recommended.schema.json) | **Normativos, ejecutables.** Perfiles de **calidad, no de validez**: los campos sin los que el evento no se puede descubrir ni seguir. Fallar aquí produce **avisos**, nunca un rechazo. Ver [Campos recomendados](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados). |
| Este documento | **Normativo, no ejecutable.** Las reglas que un validador no puede comprobar. |
| [`examples/`](examples/) | Ejemplos, **validados en CI**. Si no pasan el validador, el build falla. |
| [`DECISIONS.md`](DECISIONS.md) | **No normativo.** Por qué esta spec es como es, en inglés: decisiones de diseño con sus alternativas descartadas y la condición bajo la que valdría la pena reabrirlas. |

Los `$id` son las URLs bajo las que se publican los schemas:

```text
https://opentechevents.org/schema/v0.3/event.schema.json
https://opentechevents.org/schema/v0.3/feed.schema.json
https://opentechevents.org/schema/v0.3/event.recommended.schema.json
https://opentechevents.org/schema/v0.3/feed.recommended.schema.json
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
import { eventSchema, feedSchema, annotationKeywords } from "@opentechevents/schema";

const ajv = new Ajv2020({ strict: true, strictRequired: false });
addFormats(ajv);
for (const kw of annotationKeywords) ajv.addKeyword(kw); // anotaciones: no restringen nada
ajv.addSchema(eventSchema);          // el feed referencia al evento por $id: regístralo antes
const validateFeed = ajv.compile(feedSchema);
```

Los schemas llevan **anotaciones** que ningún keyword estándar sabe decir: `x-inheritsFrom` nombra el campo del feed del que hereda un campo del evento (`event.license` → `feed.license`), porque ese valor por defecto no es un literal, es lo que declare el feed que lo envuelve. No restringen nada: un validador que las ignore acepta exactamente los mismos documentos. JSON Schema permite keywords desconocidos, así que la mayoría de validadores no necesitan hacer nada; Ajv en `strict: true` se niega a compilar un schema que los lleve, y por eso `annotationKeywords` viene en el paquete.

Los perfiles de calidad vienen en el mismo paquete, y se usan **aparte** de la validación: lo que devuelven son avisos, no errores.

```js
import { eventRecommendedSchema } from "@opentechevents/schema";

const validateEvent = ajv.compile(eventSchema);
const checkEvent = ajv.compile(eventRecommendedSchema); // referencia al evento por $id, ya registrado

if (validateEvent(event) && !checkEvent(event)) {
  warn(checkEvent.errors); // publícalo igual: sigue siendo válido
}
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

Todo lo demás es opcional. **Deliberadamente**: la mayoría de los `.ics` publicados no traen ni URL ni descripción, y una spec que los exija obliga al importador a descartar el evento o a inventarse el dato. Ninguna de las dos cosas es aceptable.

Opcional **no** quiere decir prescindible, y ahí entra el segundo nivel: los [campos recomendados](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados).

Ejemplo mínimo real, con esos seis campos y nada más: [`examples/event-minimal.json`](examples/event-minimal.json) — es un fichero validado en CI, así que enlazarlo en vez de copiarlo aquí es lo que garantiza que este ejemplo nunca se desincronice del schema real.

### Válido no es lo mismo que útil: los campos recomendados

Nuevo en la v0.3. Un evento con solo los seis campos obligatorios es **válido** y, para el problema que esta spec existe para resolver, **casi inservible**: no se puede filtrar por tema, no se sabe si se puede ir, y en RSS no hay ni enlace que pinchar. Bajar el listón de la validez fue una decisión correcta; dejar ahí la conversación, no.

Por eso hay **dos schemas y dos preguntas distintas**:

| Schema | La pregunta que responde | Qué pasa si falla |
| --- | --- | --- |
| [`event.schema.json`](event.schema.json) | ¿Es esto un evento OTE? | **Error.** El documento se rechaza. |
| [`event.recommended.schema.json`](event.recommended.schema.json) | ¿Sirve para algo? | **Aviso.** El documento sigue siendo válido. |

**Regla normativa: una herramienta MAY avisar de un campo recomendado que falta, y MUST NOT rechazar el documento por ello.** Convertir una recomendación en un error reintroduce por la puerta de atrás justo lo que la permisividad evita: quien importa un `.ics` pelado se ve obligado a inventarse el dato o a tirar el evento. Que no se pueda rechazar el documento no obliga a nadie a **listarlo**: eso es [otra decisión, y es de quien consume](#sin-url-ni-location-válido-pero-descartable).

Los perfiles son schemas normales, publicados bajo su propio `$id` y distribuidos en el paquete npm. Referencian a los de base por `$ref`, así que hay que registrar primero los de base:

```text
https://opentechevents.org/schema/v0.3/event.recommended.schema.json
https://opentechevents.org/schema/v0.3/feed.recommended.schema.json
```

```bash
npm run validate -- mi-feed.json     # errores y avisos, en la misma pasada
```

#### Qué se recomienda, y por qué ese y no otro

El criterio **no** es «estaría bien tenerlo»: es **qué se rompe en los tres destinos si falta**, y si la ausencia impide descubrir o seguir el evento.

| Campo | Qué se pierde sin él |
| --- | --- |
| `url` | RSS y Atom no tienen otro sitio donde llevar el enlace: la entrada deja de ser pinchable. Es lo que convierte un dato en algo a lo que ir — y sin él ni `location`, [un agregador puede descartar el evento](#sin-url-ni-location-válido-pero-descartable). |
| `description` | Lo que muestra literalmente todo destino: `DESCRIPTION` en iCal, el cuerpo de la entrada en RSS/Atom, el snippet en schema.org. |
| `image` | La imagen es lo que hace que el evento **se vea** donde se lista: Google la pide para el `Event` (como recomendada), y es lo único que llena una tarjeta en cualquier interfaz. Además, el aviso es **accionable**: las cinco plataformas estudiadas ya emiten una, así que quien no la manda casi siempre la tiene y no la ha mapeado. |
| `location` | Google lo exige para el `Event`; en iCal es `LOCATION`. Sin él nadie puede contestar «¿me pilla cerca?» — y es [la última reserva cuando no hay `url`](#sin-url-ni-location-válido-pero-descartable). |
| `attendanceMode` | La primera pregunta de quien busca: ¿puedo ir desde casa? No se deriva de `location` de forma fiable — [por eso son campos distintos](#location-y-attendancemode-no-son-redundantes). |
| `tags` | **El campo del descubrimiento por interés.** Sin él, filtrar por tema exige adivinar a partir del título. Va a `CATEGORIES` en iCal y a `keywords` en schema.org. |
| `languages` | Un evento en un idioma que no hablas es ruido, y no es el título quien lo dice. |
| `organizers` | A quién sigues y de quién te fías. Sin él, un feed de agregador atribuye todo a quien agrega. |
| `updatedAt` | Es lo que hace posible **la suscripción**: sin él, un consumidor no puede sincronizar de forma incremental y tiene que releerlo todo cada vez. |
| `endDate` | Solo si `startDate` lleva hora: sin él el cliente de calendario se inventa la duración. En un evento de todo el día su ausencia ya significa «acaba el día que empieza», y avisar ahí sería ruido. |
| `cfp.closesAt` | **Solo si hay `cfp`.** Sin fecha límite, la pregunta que el campo existe para responder —¿sigue abierto?— se queda sin respuesta, y un consumidor ve un enlace que pudo cerrar hace meses. Accionable por definición: quien abre una convocatoria sabe cuándo la cierra. |

`cfp.closesAt` es **la única recomendación anidada, y la única condicional junto a `endDate`**: solo se pide cuando existe el campo padre, porque a un meetup pedirle una fecha límite de CFP es un aviso que nadie puede atender. El perfil lo expresa con un `if`/`then`, no con prosa, así que un checker cualquiera lo aplica sin saber nada de esta página.

**Lo recomendado es `location`, no `location.address`.** Qué hace falta saber del sitio depende del tipo de evento: a uno online la dirección postal no le aplica, y a un meetup en un bar el nombre del bar es todo lo que hay y todo lo que hace falta. `address` es lo que necesita quien exporta a schema.org para que Google valide la dirección por partes ([detalle abajo](#locationaddress-la-dirección-que-se-valida-por-partes)), y es una mejora real cuando se tiene — pero un aviso que la mitad de los eventos no puede atender es un aviso que enseña a ignorar los avisos.

**`textLanguage` tampoco es recomendado**, y es el que más cerca estuvo: cuesta una línea por feed y desbloquea cosas reales (el `lang` del HTML, la voz del lector de pantalla, la ordenación alfabética). Se queda fuera por el mismo criterio que todo lo demás: **quien importa un `.ics` no lo tiene** —Google Calendar no emite el parámetro `LANGUAGE`— y el único modo de atender el aviso sería adivinar el idioma a partir del texto. Un aviso que solo se puede callar inventando no es accionable. Para quien escribe su propio feed, en cambio, la recomendación de esta página se sostiene sola: **decláralo**.

**`offers`, `cfp` y `eligibility` tampoco son recomendados**, y no es un descuido. `cfp` porque la inmensa mayoría de los eventos no tiene convocatoria: avisar de su ausencia sería avisar a cada meetup de que no es una conferencia. `eligibility` porque quien importa un `.ics` no tiene forma de saber si hay puerta, y un aviso ahí solo puede atenderse **inventando** un `open` que nadie ha afirmado — que es justo lo que el campo existe para evitar. `offers` porque el aviso no es accionable de forma fiable — un exportador de `.ics` no tiene el precio en ninguna parte, y ninguna de las cinco fuentes estudiadas lo emite de forma universal. Recomendar es prometer que **quien publica puede arreglarlo**; donde no se puede, un aviso solo enseña a ignorar los avisos.

El perfil del feed es corto a propósito ([`feed.recommended.schema.json`](feed.recommended.schema.json)): `url` y `description`. Casi toda la calidad de un feed está en sus eventos, y un checker aplica el perfil de evento a cada uno por separado —  **con la herencia ya resuelta**, o todo evento de un feed comunitario avisaría por unos `organizers` que el feed ya declaró.

#### Sin `url` ni `location`: válido pero descartable

Que ninguna herramienta pueda **rechazar** un documento por un campo recomendado no significa que todo evento válido tenga derecho a ser publicado por otros. Son dos decisiones distintas, y conviene decirlo sin rodeos:

| Decisión | Quién la toma | Qué dice esta spec |
| --- | --- | --- |
| ¿Es válido el documento? | El validador | Lo decide [`event.schema.json`](event.schema.json), y solo él. Un campo recomendado que falta **nunca** invalida nada. |
| ¿Le doy visibilidad? | Quien consume: agregador, directorio, calendario, buscador | Es **suyo**. La validez no obliga a nadie a listar un evento. |

**Regla normativa: un consumidor o agregador MAY descartar —o dejar sin listar, o listar al final— un evento que no traiga ni `url`, ni `location`, ni `cfp.url`, y cuyo feed tampoco declare `url`.** No es un incumplimiento de la spec: es la consecuencia de que no haya **ningún** sitio a donde mandar a quien lea el anuncio.

El motivo es que un evento así no responde a ninguna de las dos preguntas que hacen que un anuncio sirva: **«¿dónde amplío información?»** (`url`) y **«¿dónde se celebra?»** (`location`). Sin ninguna de las dos, lo único que queda es un nombre y una fecha. Un agregador que lo liste no está dando visibilidad al evento: está publicando algo que frustra a quien lo pincha —porque no hay nada que pinchar— y gastando el hueco de una tarjeta en un dato que nadie puede usar. **Anunciar un evento al que no se puede ir ni sobre el que se puede leer más no es difundirlo.**

La cadena de reservas importa, y por eso la regla es tan concreta:

- **`url` es la respuesta normal.** Es lo que convierte el dato en algo a lo que ir.
- **`location`** salva el caso del `.ics` pelado: casi todo `.ics` real trae `LOCATION` aunque no traiga `URL`, y con un sitio y una hora ya se puede aparecer. `location.onlineUrl` cuenta doble: es sitio **y** enlace.
- **`cfp.url`** salva a la conferencia cuyo único enlace publicado, de momento, es la convocatoria.
- **`feed.url`** salva al resto: un evento sin enlace propio dentro de un feed que sí lo tiene **sigue siendo navegable** —«visto en X»—, y descartarlo sería castigar una jerarquía que funciona. Es la razón por la que la regla no se limita al evento.

Para quien publica, el arreglo es de una línea: si el evento no tiene página propia, manda `url` apuntando a la de la comunidad, o declara `url` en el feed. Cualquiera de las dos basta.

#### Dos ausencias que son la parte interesante

**`status` no es recomendado**, y es el único campo de la spec con valor por defecto. Escribir `"status": "scheduled"` no añade información: es lo que ya significa su ausencia. Lo que de verdad importa de `status` es una acción, no un campo — **actualizarlo cuando el evento se cae** —, y eso ningún schema lo puede comprobar: el documento que anuncia un evento cancelado como si nada es indistinguible del correcto hasta que alguien se planta en una puerta cerrada. Sigue siendo [la regla más importante de esta spec](#status-un-evento-cancelado-sigue-publicado); simplemente no es una regla que un perfil pueda vigilar.

**`feed.organizers` tampoco**, y por el motivo contrario: un agregador **debe** omitirlo para que cada evento declare el suyo. Un aviso ahí empujaría a quien agrega a atribuirse eventos que no organiza — corrompiendo exactamente el dato que el campo existe para proteger. Una recomendación que, seguida al pie de la letra, empeora los datos, es una recomendación mal puesta.

#### Qué promete este nivel, y qué no

La lista **puede crecer** en versiones futuras: recomendar algo no cuesta la compatibilidad de nadie, porque nada deja de validar. Lo que **no** hará es convertirse en la vía por la que un campo opcional pasa a obligatorio de tapadillo: ascender un campo al núcleo obligatorio sigue siendo un cambio que rompe, y va con su versión y su entrada en el [CHANGELOG](../../CHANGELOG.md). Recomendado es un nivel estable, no una sala de espera.

### El orden de los campos: no es normativo, pero hay uno

JSON no tiene orden: un documento con las claves barajadas es **exactamente igual de válido**, y ningún consumidor debe depender de cómo vengan colocadas. Aun así, la spec declara los campos en un orden concreto, y lo respetan el schema, los ejemplos y la [referencia generada](reference.es.md):

```text
specVersion                                    ← contra qué versión se valida
id, url, name, description, image, organizers  ← qué es y quién lo hace
startDate, endDate, timezone                   ← cuándo
attendanceMode, location, eligibility          ← ¿puedo ir?
tags, languages, textLanguage                  ← ¿me interesa, y en qué idioma está escrito?
offers, cfp                                    ← ¿cuánto cuesta, y puedo participar?
status, partOf                                 ← qué le ha pasado, y de qué forma parte
license, source, updatedAt                     ← datos sobre el dato
translations                                   ← todo lo de arriba, en otro idioma
```

Se lee como se rellena: primero lo que hace falta para **anunciar** el evento, al final la fontanería que solo importa a quien lo consume. `eligibility` va con `attendanceMode` y `location` —y no pegado a `offers`, donde también encajaría— porque las tres contestan **la misma pregunta**: si el evento está a tu alcance y si te dejan entrar. El precio viene después, y solo importa si la respuesta fue sí. `textLanguage` va pegado a `languages` para que la [diferencia entre los dos](#textlanguage-y-translations-en-qué-idioma-está-escrito-esto) se vea en la misma pantalla, y `translations` va **al final**, después incluso de la fontanería: es un bloque voluminoso que repite campos ya declarados arriba, y ponerlo en medio enterraría las veinte líneas que todo consumidor lee de verdad. No es alfabético, que separaría `startDate` de `endDate` y `id` de `url`; ni por obligatoriedad, que cambiaría en cada versión que recomiende un campo nuevo.

Importa porque es lo que se ve en los tres sitios donde alguien mira de verdad: el **ejemplo que copia**, la **tabla de referencia** —generada leyendo el schema en orden de declaración— y el **autocompletado del editor**. Que los tres coincidan es la diferencia entre una forma que se memoriza y una que hay que consultar cada vez. `npm run validate` lo comprueba en los ejemplos de esta versión.

Para tu feed es una **sugerencia, no una regla**: publicar en otro orden no rompe nada ni produce avisos.

### `id` y `url` empiezan siendo iguales, pero no son lo mismo

`url` es **dónde se describe el evento hoy**. `id` es **qué evento es esto, para siempre**.

Si una comunidad se muda de plataforma a dominio propio, `url` cambia y **`id` no puede cambiar**: es lo que permite a un consumidor *actualizar* el evento que ya tenía en vez de crear un duplicado. Un `id` se acuña una vez, bajo un dominio que controla quien publica (el DNS ya garantiza unicidad: no hace falta registro central), y no se reescribe jamás. «Controlar el dominio» no exige ser su dueño: una página canónica en una plataforma que se usa (Meetup, GitHub Pages, LinkedIn) sirve igual — lo que hace falta es que esa URL sea estable y que nadie más pueda acabar con la misma. Por eso `id`, igual que `url`, tiene que ser una URL HTTP(S): un identificador de otro tipo (`urn:`, `mailto:`) no da esa garantía de unicidad sin registro, y el validador lo rechaza. Detalle en [DECISIONS.md, D020](DECISIONS.md#d020--id-and-partofid-must-be-an-https-url-not-any-uri-scheme).

Nadie debería teclear un `id` a mano: las herramientas lo derivan de la URL canónica del evento (propia o de la plataforma que se use), o lo acuñan como `<dominio>/events/<comunidad>/<fecha>-<slug>` cuando el evento no tiene página propia.

**Dentro de un mismo feed, dos eventos no pueden compartir `id`** — el validador lo comprueba (igualdad exacta de cadena, sin normalizar URIs). No es la deduplicación heurística entre fuentes que la spec deja fuera de alcance ([más abajo](#lo-que-la-v03-no-resuelve)): es una sola fuente contradiciendo, en el mismo documento, la identidad que ella misma acuñó. Detalle en [DECISIONS.md, D011](DECISIONS.md#d011--no-two-events-in-a-feed-may-share-an-id-compared-by-exact-string-equality).

### Fechas: reloj de pared, no instantes

`startDate` y `endDate` llevan **la hora que aparece en el cartel**, en la zona horaria del evento. **Nunca llevan offset UTC** (`+02:00` ni `Z`): eso lo aporta `timezone`. El schema rechaza un offset dentro de `startDate`.

Dos formas, y **ambas fechas deben usar la misma**:

- **Todo el día**: `"2026-10-15"`.
- **Con hora**: `"2026-10-15T09:00"` — **sin segundos**: es la hora que aparece en un cartel, nunca un instante técnico ([DECISIONS.md, D004](DECISIONS.md#d004--dateTime-has-no-seconds-and-enddate-must-not-precede-startdate)).

Mezclar (`startDate` fecha, `endDate` fecha-hora) es inválido. Si `endDate` falta, el evento termina el día que empieza. Si `endDate` está presente, **no puede ser anterior a `startDate`** — un evento no termina antes de empezar; el schema lo rechaza.

**Para un evento de todo el día, `endDate` es INCLUSIVO: nombra el último día en que ocurre el evento, no el día siguiente.** `startDate: "2026-10-16"` + `endDate: "2026-10-17"` es un evento de **dos días** (16 y 17), no de uno. Es la misma convención que usan Google y schema.org para `endDate` — y la contraria a la de iCalendar: RFC 5545 define `DTEND;VALUE=DATE` como el final **no inclusivo**, con este mismo ejemplo en su propio texto: un evento del 28 de junio al 8 de julio inclusive se codifica como `DTEND;VALUE=DATE:20070709` — el día **siguiente** al último. Por eso la conversión no es copiar el valor:

| | OTE `endDate` | iCalendar `DTEND;VALUE=DATE` |
| --- | --- | --- |
| Exportar | `2026-10-17` | súmale 1 día → `20261018` |
| Importar | réstale 1 día → `2026-10-17` | `20261018` |

Copiar el valor sin este ajuste acorta en un día todo evento OTE de varios días al pasar a iCalendar, y lo alarga en uno al volver. Los valores con hora no llevan esta ambigüedad — un `endDate` con hora ya es un instante exacto, sin que quepan dos lecturas. Detalle en [DECISIONS.md, D013](DECISIONS.md#d013--all-day-enddate-is-inclusive-icalendar-dtend-is-not).

`timezone` (IANA, `Europe/Madrid`) es **siempre obligatoria**. Con hora, es lo que convierte el reloj de pared en un instante inequívoco. En eventos de todo el día, **contextualiza** la fecha: dice a qué región pertenece ese día — **no la desplaza**. Un consumidor **no debe** convertir un evento de todo el día a otra zona horaria.

**"Instante inequívoco" tiene una excepción real: las dos noches al año en que la zona cambia de horario.** Al atrasar el reloj (verano→invierno), una hora local se repite y nombra dos instantes distintos; al adelantarlo (invierno→verano), hay una hora que no llega a existir nunca. Rarísimo en la práctica —nadie programa una charla a las 2:30 de la madrugada a propósito—, pero puede colarse sin que nadie lo mire: un script que genera fechas de una serie de sesiones sin tener en cuenta esa noche concreta, o un `.ics` importado con ese mismo problema. La resolución es la misma que ya usa RFC 5545 §3.3.5 — cualquier herramienta iCalendar existente ya la aplica sin cambiar nada — con sus mismos ejemplos oficiales:

- **Hora repetida**: cuenta la **primera** ocurrencia. `TZID=America/New_York:20071104T013000` son las 1:30 del 4 de noviembre de 2007 en **EDT** (UTC−04:00), no en EST.
- **Hora inexistente**: se interpreta con el offset vigente **antes** del salto. `TZID=America/New_York:20070311T023000` son, en realidad, las 3:30 EDT (UTC−04:00) — una hora después de las 1:30 EST.

Detalle en [DECISIONS.md, D014](DECISIONS.md#d014--dst-ambiguous-or-nonexistent-local-times-resolve-per-rfc-5545-335).

La única fecha con offset en toda la spec es `source.retrievedAt` (y `updatedAt` en el feed): son metadatos, instantes reales, no cosas que le pasan a la gente en un sitio.

Todas las fechas y horas de esta spec, en cualquier campo, tienen que ser **calendáricamente reales** — nada de meses, días u horas que no existen — y `timezone` tiene que ser una **zona IANA real**, canónica o alias histórico. Ambas cosas las comprueba el validador, no son solo una recomendación de esta página. Por qué (y por qué la primera versión de la comprobación de `timezone` estaba mal) está en [DECISIONS.md, D001 y D002](DECISIONS.md#d001--temporal-fields-must-be-calendar-valid-not-just-lexically-shaped).

### Recurrencia y eventos multi-parte: `partOf`

Nuevo en la v0.3, opcional. Y lo primero que hay que decir es lo que **no** es: **no es una regla de recurrencia**.

**Un documento = una ocurrencia. Quien publica expande.** Un meetup mensual no es un documento con una regla: son doce documentos, cada uno con su `id`, sus fechas y su `status`. Un study jam de tres sesiones en sábados no consecutivos son tres documentos. `partOf` solo dice **de qué conjunto forman parte**:

```json
"partOf": {
  "id": "https://rustmadrid.example/meetups",
  "name": "Rust Madrid — meetup mensual",
  "url": "https://rustmadrid.example/meetups"
}
```

Solo `id` es obligatorio. `name` y `url` evitan que un consumidor tenga que resolver el `id` para poder agrupar. El `id` sigue las mismas reglas que el del evento (URI bajo un dominio propio, acuñado una vez) y **no tiene por qué resolver** a un documento OTE. **Lo que no puede ser es el mismo `id` del propio evento** — una ocurrencia no puede ser el conjunto al que pertenece; el validador lo rechaza. Detalle en [DECISIONS.md, D012](DECISIONS.md#d012--an-events-partofid-must-not-equal-its-own-id).

**`type`: `series` o `multipart`** (por defecto `series`). No es decoración: cambia la traducción.

- **`series`** — ocurrencias independientes que comparten identidad: el meetup de junio y el de julio. Cada una se anuncia, se asiste y se cancela por separado.
- **`multipart`** — partes de **un solo evento** repartido en fechas no consecutivas: un study jam de tres sesiones en sábados no consecutivos, con una sola inscripción. Las partes no son eventos independientes aunque tengan fecha propia.

Lo que `multipart` **no** arregla es «una sola inscripción»: eso no es una fecha. `offers` describe el precio y el registro **de cada documento**, no una inscripción compartida entre las partes — y la v0.3 no la modela. No lo resuelvas deformando el campo de tiempo.

⚠️ **Un evento multi-parte NO se expresa con un `startDate` en la primera parte y un `endDate` en la última.** `startDate: "2026-03-07"` + `endDate: "2026-03-21"` afirma un evento continuo de quince días — falso en los tres destinos, y en el calendario de quien se suscriba ocupa dos semanas enteras. Tres partes, tres documentos.

**Traducción a los tres formatos, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `superEvent` → `EventSeries` (`series`) o `Event` (`multipart`, con las partes como su `subEvent`) | Ninguna en el modelo. Google **no lee** `superEvent`, pero tampoco lo necesita: ya recibe una ocurrencia por documento, que es exactamente lo que pide. |
| **iCal** | `RELATED-TO;RELTYPE=PARENT:<id>` en cada `VEVENT` | Soporte desigual entre clientes: quien no lo entienda ve N eventos correctos. Nunca `RRULE`: la expansión ya ocurrió. |
| **Atom / RSS** | Sin equivalente — se ignora | Total, e **inocua**: la entrada sigue describiendo un evento con su fecha real. |

Que degrade a *ignorado* en los tres es justamente el diseño. Un campo de fechas que se ignora produce datos falsos; un campo de identidad que se ignora produce datos incompletos. Solo el segundo es aceptable.

#### Por qué no `eventSchedule` de schema.org

Se valoró sustituir `timezone` + `startDate` + `endDate` por un `eventSchedule` al estilo de schema.org (`repeatFrequency`, `byDay`, `scheduleTimezone`…). Se descarta, por cuatro razones:

1. **Mete un motor de expansión dentro de un fichero.** El feed es un formato de intercambio, no una API: el consumidor lee, no calcula. Con una regla, todo consumidor —incluido el script de treinta líneas que pinta un listado— pasa a necesitar aritmética de calendario: DST, `exceptDate`, series infinitas, semántica de `"2MO"`. Es la razón de que toda librería de iCal pese lo que pesa.
2. **RSS/Atom no pueden expresarla.** No modelan recurrencia. Quien exporte tiene que expandir igualmente: la expansión ocurre siempre, y la única pregunta es **quién** la hace. Que la haga quien publica —una vez, con el dato delante— y no cada consumidor por su cuenta, cada uno con su bug.
3. **Rompe reglas que esta spec ya tiene.** Un `id` estable no sobrevive a N ocurrencias bajo un mismo documento (haría falta un equivalente de `RECURRENCE-ID`), y `status: cancelled` deja de ser expresable por ocurrencia sin inventar excepciones y sobrescrituras. Cancelar **la sesión de agosto** volvería a ser imposible: exactamente el problema que `status` existe para resolver.
4. **No hay productor real.** De las cinco fuentes estudiadas ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)) —Meetup, Eventbrite, Luma, Guild y el ejemplo canónico de Google— **ninguna** emite `eventSchedule`. Todas emiten fecha plana por ocurrencia, incluida la sesión *semanal* de Luma, que es recurrente de verdad. Y Google, que es quien consume schema.org a escala, pide explícitamente un `Event` por fecha. Adoptarlo sería el diseño especulativo que la sección de Extensiones prohíbe.

#### Reglas para quien expande

- **Series infinitas: horizonte acotado.** Un `RRULE` sin `UNTIL` ni `COUNT` no se puede expandir entero. Expande un horizonte razonable —**12 meses o las próximas 12 ocurrencias** es la recomendación— y vuelve a publicar al regenerar el feed. Un feed no es un calendario perpetuo.
- **`id` por ocurrencia.** Si la ocurrencia tiene página propia, su URL. Si no, `<id-de-la-serie>/<fecha>` o `<id-de-la-serie>#<fecha>` — que es, literalmente, lo que `RECURRENCE-ID` hace en iCal. Lo que no vale es reutilizar el `id` de la serie en las doce: un consumidor las colapsaría en un solo evento.
- **Las excepciones ya no son excepciones.** Tras expandir, `EXDATE` es *no emitir ese documento* y una ocurrencia movida es *un documento con otra fecha*. Si ya se publicó y luego se cae, `status: cancelled` — no borrarlo.
- **Guardar la regla original es opcional, y con prefijo.** Si tu importador quiere no perderla para poder hacer round-trip, `"ics:rrule": "FREQ=MONTHLY;BYDAY=2MO"` es vocabulario externo (ver [Extensiones](#extensiones)): informativo, y **ningún consumidor de OTE está obligado a expandirlo**. Si sobrevive al uso real, se graduará.

### `location` y `attendanceMode` no son redundantes

Responden a preguntas distintas:

- **`location`** son **hechos observables**: ¿hay sitio físico?, ¿hay URL para conectarse? Puede estar incompleta.
- **`attendanceMode`** es **la intención de quien organiza**: qué tipo de evento es esto. No depende de que la URL de conexión sea pública todavía.

Casi siempre se podrían derivar el uno del otro, y coinciden. El campo existe para cuando **la derivación falla**. **Si se contradicen, manda `attendanceMode`.**

**`attendanceMode` no tiene valor por defecto.** Ausente significa **desconocido**, no `in-person`. Un valor por defecto dejaría que cualquier productor que simplemente *no tiene* el dato emitiera uno falso sin enterarse: un formulario en blanco, un CMS exportando de una plantilla, un importador leyendo un formato que no sabe expresarlo — **iCalendar, el formato de eventos más publicado del mundo, no modela la modalidad en absoluto**. Callarse y decir `in-person` son afirmaciones distintas, y solo una es honesta.

Si `location` está presente, debe traer al menos `venue` o `onlineUrl`. Un `location: {}` es inválido: no dice nada, y decir nada ya se hace omitiendo el campo. **`address` y `geo` no cuentan** para esa regla: describen la sede que `venue` nombra, no la sustituyen.

### `location.address`: la dirección que se valida por partes

Nueva en la v0.3, opcional, y **hermana de `venue`, no sustituta**:

```json
"location": {
  "venue": "Campus Madrid, Calle de Moreno Nieto 2, Madrid",
  "address": {
    "street": "Calle de Moreno Nieto 2",
    "locality": "Madrid",
    "region": "Comunidad de Madrid",
    "postalCode": "28005",
    "country": "ES"
  },
  "geo": { "lat": 40.4081, "lon": -3.7188 }
}
```

**Por qué se añade.** `venue` es una cadena, y una cadena no se puede validar por partes. Al traducir a schema.org, la sede se convierte en un `Place`, y la dirección de un `Place` es un `PostalAddress` con cinco subcampos que **Google comprueba uno a uno** para el rich result de `Event`. Con solo `venue`, un exportador tiene dos salidas: emitir `address` como texto suelto —válido en schema.org, no validado por Google— o *adivinar* dónde acaba la calle y empieza la ciudad partiendo por comas. Lo segundo es inventar datos, que es justo lo que esta spec no quiere provocar. De las cinco fuentes estudiadas ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **cuatro emiten `PostalAddress`** con sus subcampos: es un campo que ya existe ahí fuera, no una idea.

**Por qué `venue` sigue estando, y sigue siendo el que manda.** Porque los otros dos destinos no saben qué hacer con una dirección por partes: `LOCATION` de iCal es **una línea de texto libre**, y RSS/Atom no modelan direcciones en absoluto. Alguien tiene que producir esa línea, y la escribe mejor quien organiza («Campus Madrid, Calle de Moreno Nieto 2, Madrid») que un exportador uniendo partes con comas, que es lo que da direcciones como la de Meetup: `"calle de raimundo lulio, 9 28010, madrid, españa, Madrid"`. Los dos campos dicen el mismo sitio a propósito: **`venue` para leer, `address` para procesar**.

**Todas las partes son opcionales, y omitir es la forma correcta de no saber.** Una clave ausente significa desconocido. `""` y `null` **no son válidos** —cada parte es una cadena de al menos un carácter—, y esa es una decisión con caso real detrás: Guild emite hoy un `PostalAddress` con los cinco subcampos a `null`, que es publicar un desconocido con forma de dato. `"address": {}` también se rechaza, por el mismo motivo que `location: {}`.

**`country` es un código ISO 3166-1 alfa-2 en mayúsculas** (`ES`, `US`), y es la única parte con formato exigido. Un nombre de país tiene una grafía por idioma —«España», «Spain», «Espagne»— y un consumidor que agrupe eventos por país vería tres países donde hay uno. Convertir el nombre en código es **consultar una tabla, no inventar**: por eso aquí sí se exige, y no se exige en `region`, donde no hay tabla universal que valga (provincia, estado, condado o *Land*, según el país). El validador comprueba el código contra la lista de asignados vigentes, no solo su forma — mismo patrón que `timezone` y `currency`: ver [DECISIONS.md, D006](DECISIONS.md#d006--locationaddresscountry-must-be-a-real-currently-assigned-iso-3166-1-code). **Error frecuente: Reino Unido es `GB`, no `UK`** — «UK» no es un código ISO 3166-1, es de los reservados «indeterminadamente» precisamente por su uso extendido fuera del estándar.

**`locality` y `region` se escriben UNA vez, y no se traducen.** «València» y «Valencia», «Girona» y «Gerona», «Donostia» y «San Sebastián» son grafías reales del mismo sitio, y aquí no hay tabla que consultar como la de `country`. La regla, que es recomendación y no validación: **escribe la grafía más reconocible para la audiencia mayoritaria del evento**, la que esa gente teclearía al buscar. No pongas las dos, no las metas en `translations` —[no está cubierto a propósito](#traducciones-locales-el-texto-que-vive-dentro-de-un-objeto)— y recuerda que quien necesite precisión sin idioma ya la tiene: `location.geo` no tiene grafías.

**No se modelan** ni `addressType`, ni segunda línea de dirección, ni `postOfficeBoxNumber`: `street` es una línea, y las plantas o puertas van en ella. Ningún productor real emite más, y la sección de [Extensiones](#extensiones) prohíbe el diseño especulativo.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `location.address` → `PostalAddress`: `street` → `streetAddress`, `locality` → `addressLocality`, `region` → `addressRegion`, `postalCode` → `postalCode`, `country` → `addressCountry`. `venue` sigue siendo `Place.name` | Ninguna. Es 1:1 — y es el único mapeo que hace que Google valide la dirección. |
| **iCal** | `LOCATION:<venue>` — la dirección **no viaja por partes** | **Toda la estructura.** iCalendar no modela direcciones ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) solo tiene `LOCATION`, texto libre). Un exportador puede anexar las partes al `LOCATION` si `venue` no las incluye ya; lo que no debe es duplicar la dirección detrás de un nombre que ya la lleva. |
| **RSS / Atom** | Nada nativo: va dentro del texto del ítem | **Toda la estructura**, igual que en iCal. Ninguno de los dos modela lugares. |

Los nombres cortos (`street`, `locality`) frente a los de schema.org (`streetAddress`, `addressLocality`) son la misma decisión que `geo: { lat, lon }` frente a `GeoCoordinates`: **el objeto ya se llama `address`**, y repetir el prefijo en cada clave es ruido. El mapeo es literal y está en la tabla de arriba.

### `status`: un evento cancelado sigue publicado

Seis valores, alineados con el enum `eventStatus` de schema.org más el `TENTATIVE` de iCal:

| Valor | Qué afirma |
| --- | --- |
| **`scheduled`** *(por defecto)* | Confirmado, en la fecha y el sitio que dice el documento. |
| **`tentative`** | Anunciado pero **sin confirmar**: falta cerrar fecha, sede o ambas. |
| **`cancelled`** | No se celebra. Punto. |
| **`postponed`** | Aplazado **sin fecha nueva todavía**. |
| **`rescheduled`** | Aplazado **y ya con fecha nueva**, que es la que lleva el documento. |
| **`moved-online`** | Se mantiene, pero lo que era presencial pasa a ser online. |

Un evento **cancelado, pospuesto o movido debe seguir en el feed**. Borrarlo en silencio deja a quien se suscribió con un evento muerto en su calendario y sin forma de enterarse. El `status` **es** la forma de enterarse.

**`postponed` y `rescheduled` no son sinónimos, y la diferencia está en las fechas del propio documento.** `postponed` conserva las **fechas antiguas** — no te inventes una nueva ni borres `startDate` (es obligatorio): el evento sigue apuntando a un día que ya no vale, y eso es exactamente lo que `postponed` está diciendo. Al confirmar la nueva fecha, se **actualizan** `startDate`/`endDate` y se pasa a `rescheduled`. Como el `id` no cambia, un consumidor actualiza el evento que ya tenía en vez de duplicarlo.

> La v0.3 **no modela la fecha anterior** (el `previousStartDate` de schema.org). No hay productor real que la emita hoy, y `updatedAt` ya dice que algo cambió. Si te hace falta, es candidata a núcleo por la vía de siempre: un campo sin prefijo, en producción, y se gradúa si sobrevive.

**`moved-online` debería traer `location.onlineUrl` y `attendanceMode: "online"`.** Debería, no debe: el schema no lo exige porque el enlace de conexión a menudo no es público todavía (llega por email a quien se registró), y una spec que lo exigiera obligaría a quien importa a inventárselo o a descartar el evento. Si `location.venue` se queda ahí como rastro de dónde iba a ser, no pasa nada: [manda `attendanceMode`](#location-y-attendancemode-no-son-redundantes), y dice `online`.

**Por qué `tentative`, si schema.org no lo tiene.** Porque `status` es el **único campo de la spec con valor por defecto**: ausente significa `scheduled`, no «desconocido». Sin `tentative`, quien importa un `.ics` con `STATUS:TENTATIVE` —que es el estado que emite cualquier calendario para lo que aún no está cerrado— solo puede **ascender el evento a confirmado**, que es afirmar algo que nadie afirmó. Es el mismo argumento por el que `attendanceMode` no tiene valor por defecto: callarse y decir `scheduled` son afirmaciones distintas, y solo una es honesta.

`tentative` describe **el evento**, no la calidad del dato: se usa cuando quien organiza aún no ha cerrado fecha o sede, no cuando quien importa no las tiene claras. Y no es un estado permanente: en cuanto se confirma, se pasa a `scheduled`.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| OTE | schema.org `eventStatus` | iCal `STATUS` | Pérdida |
| --- | --- | --- | --- |
| `scheduled` | `EventScheduled` | `CONFIRMED` | Ninguna. |
| `tentative` | `EventScheduled` | `TENTATIVE` | **En schema.org.** No tiene equivalente: se emite `EventScheduled` y el matiz se pierde. El único que viaja mejor a iCal que a schema.org. |
| `cancelled` | `EventCancelled` | `CANCELLED` | Ninguna. |
| `postponed` | `EventPostponed` | `TENTATIVE` | **En iCal**, que no distingue aplazado de sin confirmar. Google sí lee `EventPostponed`. |
| `rescheduled` | `EventRescheduled` | `CONFIRMED` *(con la fecha nueva)* | Ninguna en las fechas; el hecho de que hubo un cambio se pierde en iCal. |
| `moved-online` | `EventMovedOnline` + `location` `VirtualLocation` | `CONFIRMED` *(con la URL en `LOCATION`/`URL`)* | **En iCal**, que no distingue una sede online de una física. |

**RSS y Atom no tienen `status` en absoluto.** No hay campo donde ponerlo, así que quien exporte debe llevarlo al **título** de la entrada (`[CANCELADO] Rust Madrid — junio`) o a las primeras líneas del contenido. Un canal de anuncios que anuncia un evento cancelado exactamente igual que uno confirmado es peor que no anunciarlo.

### `license` y `source`: qué se puede reutilizar, y de dónde salió

`license` es la licencia de **estos datos**, no del evento. SPDX (`CC0-1.0`, `CC-BY-4.0`) o una URL. Va en SPDX y no en prosa (`CC BY 4.0`) porque un importador tiene que compararla contra una allowlist, y para eso necesita un identificador, no una frase — y el validador la comprueba de verdad contra la [SPDX License List](https://spdx.org/licenses/) oficial, no solo por su forma. Identificadores retirados (*deprecated*) siguen siendo válidos, porque la propia SPDX los sigue publicando como tales; lo que no vale es uno inventado. Detalle en [DECISIONS.md, D008](DECISIONS.md#d008--license-validates-simple-spdx-identifiers-against-the-real-spdx-license-list).

**El perfil recomendado avisa (sin invalidar) si `license` tiene una cláusula que puede bloquear a un directorio o agregador**: *NonCommercial* descarta directamente cualquier directorio comercial, *NoDerivatives* bloquea el reformateo/traducción que hace cualquier agregador, y *ShareAlike* (incluido `ODbL`) es "viral" para una base de datos combinada — mezclar tu evento con otros podría obligar a todo el feed agregado a adoptar tu licencia. Las licencias de software copyleft (GPL y familia) tampoco entran en lo recomendado: su mecánica está pensada para "distribuir el Programa", algo legalmente ambiguo aplicado a un documento JSON, y esa ambigüedad ya es motivo suficiente para que el equipo legal de un directorio decline en vez de arriesgarse. Nada de esto invalida el documento — solo `CC0-1.0`, `CC-BY-*` (sin NC/ND/SA), `PDDL-1.0` y `ODC-By-1.0` se libran del aviso.

**La compatibilidad entre licencias de distintos eventos de un mismo feed es responsabilidad de quien agrega**, no algo que esta spec compruebe ni imponga: cada evento es una obra independiente, y `license` se puede sobreescribir por evento precisamente porque no todas las comunidades quieren los mismos términos. Quien construya un agregador y quiera combinar o redistribuir el feed entero como una sola cosa tiene que mirar la licencia de **cada evento**, no solo la del feed — la herencia (`x-inheritsFrom`) da un valor por defecto, no una garantía de que todos los eventos compartan licencia.

`source` es **obligatoria cuando el evento se importó o agregó** de otro sitio (un `.ics`, Meetup, otro directorio). Se omite cuando quien organiza describe su propio evento: **es** la fuente.

**Dentro de `source` basta con `name` o con `url`** —lo ideal es las dos—, y el schema rechaza una `source` que no lleve ninguna: una procedencia que no apunta a nada no es una procedencia. Exigir el `name` sería peor que aceptar la `url`: quien importa un `.ics` siempre conoce la dirección que descargó y a menudo no tiene nombre de publicador que leer (el `X-WR-CALNAME` de iCalendar es opcional), así que el requisito se cumpliría **inventándolo**, y una fuente inventada es peor que una fuente dada solo como enlace. Es la misma regla que siguen `offers` con `price` y `url`, y `location` con `venue` y `onlineUrl`.

`source.license` (lo que la fuente permite) y `license` (lo que este documento permite) son campos distintos y **no tienen por qué coincidir**. Pero los términos de la fuente **restringen lo que puede republicarse**: declarar una `license` no concede derechos que la fuente nunca dio.

### `organizers`: quién organiza — y las tres cosas que no es

Nuevo en la v0.3. Opcional, y **una lista**, no un objeto:

```json
"organizers": [
  { "name": "GDG Madrid", "url": "https://gdgmadrid.example", "email": "hola@gdgmadrid.example" },
  { "name": "Python Madrid", "url": "https://www.meetup.com/python-madrid/" },
  { "type": "person", "name": "Ada Lovelace", "url": "https://ada.example" }
]
```

Solo `name` es obligatorio. `url`, `email` y `type` (`organization` por defecto, o `person`) son opcionales. **Y nada más**: ni logo, ni identificadores. El campo describe **quién organiza y dónde escribirle**, no su ficha completa.

**Es una lista porque la co-organización es lo normal**, no la excepción: dos comunidades que juntan meetup, una comunidad y su anfitrión. Luma ya emite `organizer` como array (organización + persona) y schema.org lo acepta. Ensanchar un objeto a lista más tarde habría sido un cambio que rompe; nace lista. **El orden es significativo**: el primero es el principal, y es el único que sobrevive a iCal.

Tres confusiones que conviene desactivar antes de que ocurran:

1. **`organizers` no es `source`.** Quién hace el evento vs. de dónde salieron los datos. Un evento de PyAlmería recogido de Meetup tiene `organizers: [PyAlmería]` y `source: { name: "Meetup" }`. Son ortogonales y a menudo aparecen los dos.
2. **`organizers` no son ponentes.** Quien da la charla no está modelado en la v0.3 (ver «Lo que la v0.3 no resuelve»). Meter a un ponente en `organizers` corrompe el dato para todo el que lo consuma.
3. **`feed.organizers` no es `feed.title`/`feed.url`.** `title`/`url` nombran a **quien publica** el feed; `organizers`, a **quien organiza** los eventos. En un feed de una sola comunidad coinciden. En un feed de agregador **no**, y ahí está justo el valor del campo: sin él, un consumidor no tiene más remedio que caer en `feed.title` y atribuirle al agregador todos los eventos que agrega.

**Herencia: reemplazo, no fusión.** Igual que `license`, `feed.organizers` es el valor por defecto de todo evento que no declare el suyo. Un evento que **sí** lo declara **sustituye la lista entera**; no se suma a la heredada. Con fusión no habría forma de *quitar* un organizador heredado, y un evento invitado dentro del feed de una comunidad acabaría atribuido a quien no lo organiza. La consecuencia práctica: en el evento co-organizado de un feed comunitario hay que **repetir** la comunidad del feed junto a la invitada — ver [`examples/feed-community.json`](examples/feed-community.json).

#### `email`: la dirección que hace válido el `ORGANIZER` de iCal

Opcional, **una sola dirección**, y sin el prefijo `mailto:` — lo añade quien exporta:

```json
"organizers": [
  { "name": "GDG Madrid", "url": "https://gdgmadrid.example", "email": "hola@gdgmadrid.example" }
]
```

**Entra porque hay productor real, y es el de siempre: `.ics`.** Un `VEVENT` publicado trae `ORGANIZER;CN="Rust Madrid":mailto:hola@rustmadrid.example` con muchísima frecuencia, y hasta ahora el importador **tenía el dato delante y no había dónde ponerlo** — el mismo motivo exacto por el que `tags`, `location.geo` y `updatedAt` entraron en la v0.2. La consecuencia era que `.ics` → OTE → `.ics` **perdía el `ORGANIZER`**, la única pérdida que esta página califica de **grave**. Un formato que no puede dar la vuelta a la fuente más publicada del mundo tiene un agujero, no una decisión.

**Y arregla un segundo destino de rebote**: `<author>` de RSS 2.0 **exige un email**, así que sin él la única salida era `dc:creator`. Con `email` se puede emitir el elemento nativo.

**Hay que decir en voz alta lo que este campo no tiene**: ninguna de las cinco plataformas estudiadas ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)) emite email en su JSON-LD. Lo esconden detrás de un formulario, **y hacen bien**. El productor de este campo es iCalendar, no la web de eventos, y por eso el campo llega con más reglas que cualquier otro de la spec.

**El precio es el spam, y es real.** Publicar una dirección en un fichero JSON abierto y rastreable es regalarla a los recolectores, y **lo publicado no se despublica**: sigue en las cachés de quien lo leyó. De ahí las reglas:

1. **Una dirección de rol, no el buzón de nadie.** `info@`, `hola@`, `eventos@`. Con `type: "person"` piénsalo dos veces: la dirección de una persona en un feed rastreable es un problema que sufre ella, no el proyecto.
2. **Un importador MUST NOT rellenar `email` desde una fuente que no esté publicada públicamente.** Un `.ics` compartido por enlace, un calendario de empresa o una exportación privada **no son publicación**: copiar de ahí a un feed abierto no es traducir un dato, es **cambiarle el nivel de exposición**. Lo que `source.license` ya dice sobre republicación aquí se dice aparte, porque el dato es personal.
3. **Un consumidor MUST NOT usar `email` para nada que no sea escribir sobre el evento.** Ni listas de correo, ni directorios de contactos, ni bases de datos comerciales. Es una regla que ningún schema puede comprobar, como la de [actualizar `status`](#status-un-evento-cancelado-sigue-publicado), y se cumple igual.
4. **Quien exporta a JSON-LD lo piensa dos veces.** `Organization.email` existe, y emitirlo mete la dirección en una página pública. Es legítimo —es la web de quien organiza—, pero **Google no lo usa** para el rich result de `Event`: el email entra en esta spec por iCal, no por SEO.

**No es [recomendado](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados)**, y por dos motivos que se suman. Uno, el de siempre: quien importa un `.ics` sin `ORGANIZER` no puede atender el aviso. Y dos, uno nuevo que solo aparece aquí: **un aviso por un email ausente es presionar a alguien para que publique una dirección que decidió no publicar**. El perfil de calidad existe para señalar lo que le falta al evento, no para empujar a nadie a exponer datos de contacto. Es el único campo de la spec que se queda fuera del perfil por una razón que no es técnica.

**Y no añade ninguna regla de herencia.** Es la pregunta que este campo provoca sola —«¿se hereda del feed?»— y la respuesta ya estaba escrita: `email` vive **dentro** de `organizers[]`, y `organizers` se hereda **por reemplazo, no por fusión**. Las consecuencias, que son exactamente las que se quieren:

| Caso | Qué pasa con el email |
| --- | --- |
| Feed comunitario, evento sin `organizers` | Hereda la lista entera del feed, email incluido. **Correcto**: es la misma comunidad, y el email *es* el mismo. Una línea en el feed, cero repetición. |
| Feed comunitario, evento **con** `organizers` | **No hereda nada.** La lista declarada sustituye la entera, así que un evento co-organizado nunca acaba con el email de quien no lo organiza. |
| Feed de **agregador** | La spec ya obliga a **omitir** `feed.organizers`. Sin lista no hay email que heredar. |

El riesgo que se teme —heredar un email ajeno— **solo existiría si el email se heredara por su cuenta**, con un `feed.organizerEmail` suelto o con fusión campo a campo. Ninguna de las dos cosas se hace, y la [tabla de herencia](#el-feed) sigue teniendo las mismas cuatro filas que antes.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `organizer` (array), `@type` `Organization`/`Person` según `type`, `name`, `url`, `email` | Ninguna en el modelo. Emitir `email` es **opcional para quien exporta** (ver la regla 4): Google no lo lee para el `Event`. |
| **Atom** | `<author><name>…</name><uri>…</uri><email>…</email></author>`, repetible | Ninguna. Es el único destino que recibe los tres campos, y repetido. |
| **RSS 2.0** | `<author>` si hay `email`; `<dc:creator>` si no | El `<author>` de RSS 2.0 **exige email**: sin él sigue haciendo falta `dc:creator`, que no lleva dirección. |
| **iCal** | `ORGANIZER;CN="…":mailto:…` si hay `email` | **Sin `email` la pérdida sigue siendo grave**: `ORGANIZER` es un `CAL-ADDRESS`, en la práctica un `mailto:`, así que no hay nada válido que emitir → degrádalo a `X-OTE-ORGANIZER` o a la `DESCRIPTION`. Y `ORGANIZER` es **único** aunque haya email: del segundo organizador en adelante no hay dónde ponerlos. |

**Un exportador no se inventa la dirección.** Sin `email` no hay `ORGANIZER`, y punto: deducir un `mailto:` del dominio de `url` (`hola@` + el dominio, o el `webmaster@` de siempre) es fabricar un dato de contacto que nadie ha publicado, y encima obligar a quien lo reciba a escribir a una dirección que puede no existir. Es la misma regla que rige toda la spec: **callarse y adivinar son afirmaciones distintas, y solo una es honesta.**

**Por qué no hay `id` ni `communityId`.** Se valoró un identificador que enlazase al organizador con un directorio de comunidades, del estilo `combuilders:mi-comunidad`. Se descarta en la v0.3 por tres razones: exige una **gobernanza de prefijos** (quién asigna `combuilders`, quién resuelve colisiones) que este proyecto no tiene y que acoplaría OTE a otro; contradice la regla de `id` de la propia spec (*una URI bajo un dominio que controlas*, que no necesita registro central porque el DNS ya garantiza la unicidad); y sobre todo **no hay todavía un consumidor real** — el directorio no existe como especificación. Meterlo ahora sería exactamente el diseño especulativo que la sección de Extensiones prohíbe.

No hace falta esperar a nadie para usarlo: es un campo de extensión con prefijo (ver abajo), funciona hoy, y si sobrevive al uso real se gradúa a núcleo con la forma que dicte ese uso.

### `tags`, `location.geo`, `updatedAt`: lo que la v0.2 añade

Los tres son **opcionales** y entraron por la misma razón: el importador de `.ics` los tenía delante en cada `VEVENT` y no había dónde ponerlos. Ninguno es una idea especulativa; los tres tienen ya un productor real. Detalle en el [CHANGELOG](../../CHANGELOG.md).

- **`tags`** — lista libre de temáticas (`["rust","wasm"]`). Mapea a `CATEGORIES` de iCal y a `keywords` de schema.org. **Libre a propósito**: quien organiza etiqueta como quiera. Un vocabulario controlado (para no ensuciar interfaces de filtro o suscripción) podría superponerse más adelante **sin** cerrar el campo. Ausente = desconocido, no «sin temática». Sí se rechaza el duplicado exacto (`["rust","rust"]`): no es libertad de vocabulario, es la misma etiqueta afirmada dos veces. `languages` tiene la misma regla, por el mismo motivo — ver [DECISIONS.md, D024](DECISIONS.md#d024--tags-and-languages-must-not-carry-exact-duplicate-entries).
  > **`CATEGORIES` no viaja por Google Calendar** (no lo emite ni lo lee). Un importador puede recuperar temáticas de una convención de *hashtags* (`#rust`) en la `description` — pero eso es **comportamiento del importador, no del schema**: aquí `tags` es siempre la lista estructurada.

- **`location.geo`** — punto WGS-84 `{ lat, lon }` en grados decimales. Mapea a `GEO` de iCal y a `Place.geo` de schema.org. Es **independiente de `venue`** (texto libre): un punto en el mapa, no un nombre. Va **dentro de `location`** —hermano de `venue`/`onlineUrl`— igual que schema.org anida `geo` dentro de `Place`; no cuelga de `venue`, porque `venue` es una cadena, no un objeto. `geo` no basta por sí solo para satisfacer `location`: sigue haciendo falta `venue` u `onlineUrl`.

- **`updatedAt`** — instante (con offset/Z) en que **los datos del evento** cambiaron por última vez. Es el equivalente de `LAST-MODIFIED` de iCal, **no** de `DTSTAMP`: `DTSTAMP` marca *cuándo se generó el fichero* y cambia en cada exportación aunque no haya cambiado nada, así que no sirve para «qué cambió». Su valor está en la **sincronización incremental**: un consumidor que lee el feed a diario filtra por `updatedAt > última_lectura` en vez de recomparar la colección entera. El `updatedAt` del feed dice «algo cambió»; el del evento dice **qué**. Ausente = desconocido, no «nunca cambió». **Ningún evento puede tener un `updatedAt` posterior al del propio feed** — el feed no puede contener una revisión que, según sus propios sellos, todavía no existía cuando se generó; el validador lo comprueba comparando los instantes reales, no el texto. Detalle en [DECISIONS.md, D015](DECISIONS.md#d015--no-events-updatedat-may-be-later-than-the-feeds-own-updatedat).

### `image`: el cartel, su texto alternativo, y por qué la lista admite dos formas

Nuevo en la v0.3. Opcional —aunque [recomendado](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados)— y **una lista** cuyas entradas apuntan con URLs `https` **al fichero de imagen**, nunca a una página que lo muestre:

```json
"image": [
  {
    "url": "https://rustmadrid.example/img/2026-06-16x9.png",
    "alt": "Cartel sobre fondo morado: el cangrejo Ferris con casco de obra, y la fecha «26 de junio, 19:00» en grande"
  },
  "https://rustmadrid.example/img/2026-06-4x3.png",
  "https://rustmadrid.example/img/2026-06-1x1.png"
]
```

**El orden es significativo**: la primera es la principal, y a menudo la única que un destino puede usar. Quien solo pueda mostrar una, muestra la primera.

**No es una galería.** Lo habitual es que las entradas sean **la misma imagen** en distintos recortes o resoluciones — que es exactamente lo que [Google pide](https://developers.google.com/search/docs/appearance/structured-data/event) (1:1, 4:3 y 16:9) y lo que ya emiten Meetup, Luma y Guild. Pero eso es lo habitual, **no una garantía**: nada impide publicar el cartel y una foto de la sede, y un consumidor no tiene forma de distinguir los dos casos. Por eso la regla que sí vale es la del orden, y ninguna interfaz debe renderizar la lista como carrusel de fotos.

Entra por la vía de siempre —**un campo que ya emite todo el mundo**—: de las cinco fuentes estudiadas ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **las cinco** emiten `image`, y tres de ellas ya como array.

#### `image[].alt`: accesibilidad, y las tres decisiones que arrastra

Una entrada es **o una cadena o un objeto** `{ url, alt?, translations? }`. Las dos formas conviven en la misma lista a propósito, y cada parte de esa frase es una decisión:

**Por qué el `alt` va dentro de la entrada y no en un campo hermano del evento.** Un `imageAlt` al lado de `image` sería más simple de escribir y estaría mal: describiría la primera imagen y se aplicaría a las tres. Solo funciona si la lista es siempre el mismo cartel recortado, y acabamos de ver que eso **no se puede garantizar**. El texto alternativo describe *una* imagen concreta, así que viaja pegado a su URL.

**Por qué las dos formas conviven en vez de migrar la lista a objetos.** Porque un array de objetos rompería todos los documentos `0.2` y `0.3` ya publicados —la v0.3 se anuncia como retrocompatible con la v0.2, y lo sigue siendo— y porque los recortes extra **no necesitan `alt`**: describir tres veces la misma imagen es ruido para quien lo escribe y para quien lo escucha. La forma de cadena es la respuesta correcta para ellos. El precio es que quien consume normaliza en una línea (`typeof i === "string" ? { url: i } : i`), y es un precio bajo.

**Por qué el `alt` se traduce, y no se escribe en «inglés internacional».** Un `alt` lo lee un lector de pantalla con la voz y la pronunciación del idioma que lo rodea: meter inglés dentro de un documento en catalán produce audio destrozado, que es peor accesibilidad que la que venía a arreglar ([WCAG 3.1.2](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html) existe justo por esto). Así que `alt` está en el `textLanguage` del documento, como `name` y `description`, y se traduce con el mapa `translations` **de la propia entrada** — igual que `offers[].name`, y por la misma razón: [un espejo posicional](#textlanguage-y-translations-en-qué-idioma-está-escrito-esto) (`translations.es.image[0]`) pegaría el texto a la imagen equivocada en cuanto alguien reordene la lista. Ver [`examples/event-online.json`](examples/event-online.json).

Sobre qué escribir: **describe lo que se ve**, no lo que ya dice el evento. Repetir el `name` hace que un lector de pantalla lo diga dos veces seguidas, y «imagen de…» sobra porque el cliente ya anuncia que es una imagen. No hay cadena vacía: el `alt=""` de HTML significa «decorativa», y una imagen decorativa no pinta nada en un feed — una imagen que no tiene nada que decir es una imagen que se deja fuera.

Y una advertencia por si se confunde con lo de abajo: esto **no es SEO**. Google no puntúa el `alt` de `Event.image`; se añade porque hay personas que no ven el cartel.

**Es un campo [recomendado](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados)**, no obligatorio. Sin él nada deja de validar y nada se rompe en los tres destinos — pero el evento se lista sin cara, y en una interfaz llena de tarjetas eso decide si alguien lo mira. Pesa más el segundo test del perfil: **el aviso es accionable**. Las cinco fuentes estudiadas ya emiten imagen, así que un feed sin `image` casi nunca es un evento sin cartel: es un cartel que no se ha mapeado. Un aviso que quien publica puede arreglar en un minuto es exactamente lo que el perfil existe para dar.

La excepción conocida es quien importa un `.ics`: **iCalendar casi nunca trae imagen** (`IMAGE` es de 2016 y apenas se emite), así que ahí el aviso no es accionable. Se asume, por la misma razón que `url` y `description` siguen siendo recomendados pese a faltar en casi todo `.ics` publicado: el perfil describe **qué le falta al evento**, no a quién culpar de que falte. Ver [`examples/event-from-ics.json`](examples/event-from-ics.json), que avisa exactamente de eso.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `image`: URLs peladas para las entradas sin `alt`, y `ImageObject { url, caption }` para las que lo llevan | Ninguna en las URLs — el array de OTE **es** el que pide Google, y `Event.image` admite `ImageObject`, así que el rich result no se pierde por añadir `alt`. schema.org **no tiene una propiedad `alt`**: `caption` es la más cercana y es la que usa Google, así que el matiz «texto alternativo» y no «pie de foto» sí se pierde. |
| **iCal** | `IMAGE;VALUE=URI;DISPLAY=BADGE:<primera>` ([RFC 7986](https://www.rfc-editor.org/rfc/rfc7986)) | **De la segunda en adelante**, y **el `alt` entero**: `IMAGE` no tiene parámetro para texto alternativo. `IMAGE` admite varias, pero los clientes que la soportan enseñan una. Un cliente que ignore la propiedad —la mayoría— ve el evento completo igual. |
| **RSS 2.0** | `<enclosure url type length>` con la primera, o `<media:content>` + `<media:description>` para el `alt` | `<enclosure>` **exige `type` y `length`**, que OTE no modela: quien exporte tiene que inferir el MIME por la extensión y hacer un `HEAD` para el tamaño, o usar `media:content`, que no exige ninguno de los dos **y además es el único de los dos que sabe llevar el `alt`**. |
| **Atom** | `<link rel="enclosure" href="…" type="…">`, repetible; el `alt` va en el `alt=` del `<img>` dentro del `<content type="html">` | Ninguna en el número de imágenes; el `type` tiene el mismo problema que en RSS. |

Que el MIME no esté es la decisión **contraria** a la de [`organizers[].email`](#email-la-dirección-que-hace-válido-el-organizer-de-ical), y por el mismo criterio: un tipo MIME se **deriva** sin inventar nada —la extensión del fichero, o un `HEAD`—, así que el exportador lo resuelve solo y el schema no tiene que pedirlo. Un email no se deriva de ninguna parte, y por eso sí está.

### `textLanguage` y `translations`: en qué idioma está escrito esto

Nuevos en la v0.3, los dos opcionales. Son **dos campos porque son dos problemas**, y solo el segundo tiene que ver con eventos multilingües:

```json
"name": "Sessió setmanal de codificació — Rust Girona",
"description": "Cada setmana ens trobem en línia per picar Rust una estona.",
"languages": ["ca", "es"],
"textLanguage": "ca",
"translations": {
  "es": {
    "name": "Sesión semanal de programación — Rust Girona",
    "description": "Cada semana nos juntamos en línea para picar Rust un rato."
  }
}
```

**`languages` y `textLanguage` no son el mismo dato**, y este ejemplo es exactamente por qué: en la sesión **se habla** catalán y castellano, y el documento **está escrito** solo en catalán. Ninguno de los dos se deriva del otro, y confundirlos es el riesgo real de esta pareja: `languages` contesta «¿lo entenderé si voy?», `textLanguage` contesta «¿en qué idioma está este texto?». La descripción de `languages` ahora lo dice en el propio schema, porque es donde alguien lo va a leer. Que sea válido no significa que sea completo: el perfil recomendado avisa (sin invalidar) si algún idioma de `languages` no tiene ni `textLanguage` (propio o heredado del feed) ni una entrada en `translations` que lo cubra — quien solo lea ese idioma no encuentra ni una palabra que entender. Detalle en [DECISIONS.md, D019](DECISIONS.md#d019--recommended-profile-warns-when-a-spoken-languages-entry-has-no-available-text).

**`textLanguage` es una etiqueta, no una lista.** Un texto está escrito en un idioma. Sin él, un consumidor no puede poner `lang="ca"` en el HTML —lo que decide la separación de sílabas, la voz del lector de pantalla y el diccionario del corrector—, ni ordenar alfabéticamente bien, ni decidir si traducir automáticamente. Nada de eso se puede adivinar del texto sin adivinar.

**«Etiqueta BCP 47» se valida de verdad, no solo por su forma:** el núcleo (idioma, con script/región/variante opcionales) se comprueba subtag a subtag contra el registro real de IANA. Uso privado (`x-...`), etiquetas *grandfathered* (`i-klingon`) y extensiones quedan **deliberadamente fuera de alcance** — sin caso de uso real para «en qué idioma está este texto» — y códigos registrados que no nombran un idioma concreto (`und` Undetermined, `mis`, `mul`...) tampoco valen, mismo motivo que `ZZ` no vale como `country`. Detalle y alternativas descartadas en [DECISIONS.md, D007](DECISIONS.md#d007--languagetag-validates-the-core-of-bcp-47-against-the-real-iana-registry-not-all-of-it).

**Se hereda del feed, y ahí está lo barato.** Como `license` y `organizers`: el feed lo declara una vez y todo evento que no lo declare lo hereda. Para quien publica en un solo idioma —el 99%— el coste de este campo es **una línea en todo el fichero**. Ausente significa **desconocido**: ni el inglés, ni el idioma de la cabecera HTTP, ni el del feed si el feed tampoco lo dice.

**`translations` es un mapa, y el texto principal sigue siendo una cadena.** Es la decisión que sostiene todo lo demás:

- **`name` y `description` no cambian de forma.** Un consumidor de v0.2 lee un documento con `translations` y no se entera de que existe. La alternativa —mapas de idioma en el propio campo, `"name": {"ca": "…", "es": "…"}`, que es el `@container: @language` de JSON-LD— es técnicamente más limpia y **rompe `name` para todos los consumidores que existen hoy**, gravando al 99% monolingüe para servir al 1%. Descartada por eso.
- **Un mapa y no una lista, porque el idioma es la clave.** Una entrada por idioma, y **ninguna forma de publicar dos versiones en castellano** que se contradigan — ni siquiera escribiendo la etiqueta con mayúsculas distintas: `translations.en-US` y `translations.EN-us` son la misma etiqueta BCP 47 y el validador las trata como el mismo idioma, igual que ya hace al compararlas con `textLanguage`. Detalle en [DECISIONS.md, D023](DECISIONS.md#d023--a-translations-map-must-not-carry-two-keys-naming-the-same-language-in-different-case).
- **El texto que vive dentro de un objeto se traduce donde vive**, con un `translations` local a ese objeto: `offers[].translations`, `eligibility.translations`, `partOf.translations`. [Detalle abajo](#traducciones-locales-el-texto-que-vive-dentro-de-un-objeto).
- **Nunca se traduce al idioma en que ya está el documento.** Una entrada `ca` en un documento con `textLanguage: "ca"` es el mismo texto dos veces, y dos formas de afirmar lo mismo son dos formas de contradecirse — el argumento de [`isFree`](#offers-cuánto-cuesta-y-dónde-se-saca-la-entrada). **El validador lo comprueba de verdad** (no es solo una regla normativa que vigile quien publica): un *keyword* Ajv personalizado rechaza cualquier `translations` que repita `textLanguage`, comparando sin distinguir mayúsculas — `ca` y `CA` son el mismo idioma. Detalle en [DECISIONS.md, D010](DECISIONS.md#d010--a-translations-map-must-not-carry-a-key-equal-to-textlanguage).
- **Un mapa vacío es inválido**, igual que `location: {}`: decir nada ya se hace omitiendo el campo. Y las claves tienen que ser etiquetas BCP 47 — `"castellano"` no valida, que es justo el error que se comete a mano. **Y una entrada que solo lleva campos desconocidos tampoco vale como traducción**: sigue pudiendo llevar extensiones junto a `name`/`description` (o `title`/`description` en el feed), pero como único contenido no traduce nada que OTE reconozca — y silenciaría sin querer el aviso de idiomas cubiertos ([D019](DECISIONS.md#d019--recommended-profile-warns-when-a-spoken-languages-entry-has-no-available-text)). Detalle en [DECISIONS.md, D022](DECISIONS.md#d022--eventfeed-top-level-translations-must-carry-at-least-one-recognized-ote-field).

**Cualquier `translations` del documento exige `textLanguage`.** Es la **única dependencia entre campos de toda la spec**, y el schema la comprueba con un `if`/`then` — **a cualquier profundidad**: una traducción dentro de una oferta también la activa, porque el idioma del texto principal es propiedad del documento entero, no de cada objeto. Sin ella, un mapa de traducciones es inservible: nadie puede saber cuál de las entradas duplica el texto principal, ni a qué está cayendo de vuelta si no encuentra su idioma. El orden de lectura de un consumidor es: **el idioma que pide → `translations` → el texto principal**, y ese último paso necesita saber en qué idioma está.

#### Traducciones locales: el texto que vive dentro de un objeto

`name` y `description` no son el único texto libre de un evento. Hay más dentro de objetos y de listas, y **se traduce donde vive**:

```json
"offers": [
  { "name": "Estudiantes", "price": 0, "translations": { "en": { "name": "Students" } } }
],
"eligibility": {
  "type": "members-only",
  "note": "Membres del Discord de Rust Girona",
  "translations": { "es": { "note": "Miembros del Discord de Rust Girona" } }
},
"image": [
  {
    "url": "https://rustgirona.example/img/sessio-setmanal.png",
    "alt": "Quadrícula de webcams i un editor amb codi Rust compartit",
    "translations": { "es": { "alt": "Cuadrícula de webcams y un editor con código Rust compartido" } }
  }
]
```

**Nunca un espejo posicional.** `translations.es.offers[0].name` es la forma que esta spec **rechaza**: una lista no tiene claves estables, así que basta con que alguien reordene las ofertas para que la traducción quede colgada de la tarifa equivocada — **y nada dejaría de validar**. Un mapa local no puede desalinearse: vive dentro del objeto que traduce.

**Qué se traduce y qué no**, porque el texto libre de un evento no es todo la misma clase de cadena:

| Clase | Ejemplos | Qué hace la spec |
| --- | --- | --- |
| **Prosa y rótulos** | `name`, `description`, `offers[].name`, `eligibility.note`, `partOf.name`, `image[].alt` | **Se traducen**, con `translations` — el del evento para los dos primeros, uno local para el resto. `image[].alt` es el caso con más consecuencia: se lee **en voz alta** con la pronunciación del idioma que lo rodea. |
| **Nombres propios** | `organizers[].name`, `location.venue` | **No se traducen nunca.** «PyAlmería» es «PyAlmería» en todos los idiomas, y traducir el nombre de una sede es inventarse un sitio. |
| **Etiquetas** | `tags` | **No se traducen en el dato**, y aquí la spec deja una arista: `tags` es texto libre, así que un evento etiquetado `["aprenentatge-automàtic"]` y otro `["machine-learning"]` no se encuentran entre sí. La recomendación práctica es **etiquetar en el idioma del ecosistema técnico**, que es de hecho lo que ya pasa (`rust`, `wasm`, `ai`), y dejar la presentación a la interfaz. Un vocabulario controlado encima lo resolvería del todo; sigue siendo [pregunta abierta](#otras). |
| **Valores cerrados** | `eligibility.type`, `status`, `attendanceMode`, `offers[].availability` | **No necesitan traducción**: un enum es **multilingüe gratis**. `members-only` se renderiza en el idioma de quien lee, y el dato no cambia. Es el mejor argumento a favor de los enums de toda la spec. |
| **Códigos** | `address.country`, `languages`, `textLanguage`, `offers[].currency` | Ya resueltos, y por esto mismo: `ES` en vez de «España» es [una decisión que la spec ya tomó](#locationaddress-la-dirección-que-se-valida-por-partes). |
| **Identificadores** | `id`, `partOf.id`, todas las `url` | **Jamás.** Un `id` con dos grafías son dos eventos, y una serie con dos `id` son dos series. |

**`offers[].name` merece una nota**, porque es el caso donde había alternativa: un `kind` con enum (`general`, `early-bird`, `student`) habría sido multilingüe gratis, como `eligibility.type`. **Se descarta**: quitaría a quien organiza el derecho a nombrar sus propias entradas, que es una libertad real y usada. Texto libre es la decisión; traducirlo es su precio, y por eso `offers[].translations` existe.

**Lo que sigue sin traducirse, y la recomendación en su lugar:** `location.address.locality` y `region`, donde **València/Valencia** o **Girona/Gerona** son dos grafías reales del mismo sitio y no hay tabla como la de países. No se modela: escribe **la grafía más reconocible para la audiencia mayoritaria del evento**, y deja que el resto lo resuelva `geo` — unas coordenadas no tienen idioma.

**En el feed, lo mismo con una diferencia importante.** `feed.textLanguage` describe el `title` y la `description` **del feed** y además es el valor por defecto de sus eventos; `feed.translations` traduce **el título del feed, nunca sus eventos**. Y **no se hereda**: el título de un feed no es el nombre de un evento. Un publicador completamente bilingüe tiene además la salida que ya usa cualquier web —**un feed por idioma** (`/feed.ca.json`, `/feed.es.json`, cada uno con su `textLanguage`)—, y sigue siendo la opción más simple cuando *todo* el contenido está duplicado.

**Cómo entra, y qué le falta.** El listón de esta spec es que exista productor real, y hay que decirlo con claridad: **`textLanguage` lo cumple** —iCalendar tiene `LANGUAGE` como parámetro nativo desde el [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), RSS tiene `<language>` y JSON-LD tiene `@language`: los tres destinos saben recibirlo— y **`translations` no**: ninguna de las cinco plataformas estudiadas publica texto multilingüe por evento, porque cada una sirve una página por idioma. Entra igualmente, y por una razón concreta: en catalán, euskera, galego y valenciano el evento bilingüe **es el caso normal**, y hoy la única salida es meter los dos idiomas dentro de la misma cadena, que es peor que no tener el campo. Es la deuda declarada de esta pareja: si en la práctica nadie lo emite, sobra, y sobrará en voz alta.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org / JSON-LD** | `textLanguage` → `@language` del contexto o del valor; `translations` → mapas de idioma (`{"@language":"es","@value":"…"}` por entrada) | **Ninguna.** Es el único destino que recibe los dos campos completos, con estructura. |
| **iCal** | `textLanguage` → el parámetro `LANGUAGE` de cada propiedad de texto (`SUMMARY;LANGUAGE=ca:…`), nativo en RFC 5545 | **`translations`.** `SUMMARY` no se repite: solo sobrevive el texto principal. El resto va a la `DESCRIPTION` («ES: Sesión semanal…») o a un `X-OTE-TRANSLATION`. |
| **RSS / Atom** | `textLanguage` → `<language>` del canal (RSS) o `xml:lang` (Atom, que además lo admite por entrada) | **`translations` en RSS**, que solo tiene idioma a nivel de canal. Atom aguanta más porque `xml:lang` es por elemento. |

Que solo JSON-LD lo reciba entero es aceptable por la regla de siempre: quien ignore los dos campos **sigue viendo un evento correcto**, en un idioma concreto. Es pérdida de estructura, no de información.

### `eligibility`: quién puede entrar — y por qué no es un `tag`

Nuevo en la v0.3. Opcional, **un objeto**, y solo `type` es obligatorio:

```json
"eligibility": {
  "type": "members-only",
  "note": "Miembros del Discord de Rust Girona",
  "url": "https://rustgirona.example/join"
}
```

Un evento sin condiciones lo dice con una línea, y **dice algo**:

```json
"eligibility": { "type": "open" }
```

**Es la tercera parte de «¿puedo ir?».** `attendanceMode` dice si hay que desplazarse y `location` dónde; los dos contestan si el evento **está a tu alcance**. Ninguno contesta si **te dejan entrar**. Son preguntas distintas y se contradicen sin problema: la sesión semanal de Rust Girona es online, gratis y abierta a cualquiera con conexión —y aun así el canal de voz está dentro de un Discord al que hay que pertenecer. Hasta ahora ese requisito solo vivía en la prosa de `description`, que es exactamente donde un consumidor no puede filtrarlo.

**Cuatro valores, y el enum es el punto.** Corto a propósito: un consumidor que tiene que tratar veinte puertas no trata ninguna, y la razón de que esto sea un enum y no texto libre es que **«¿puedo ir?» es una casilla de filtro**, no un párrafo.

| Valor | Qué afirma | Ejemplo real |
| --- | --- | --- |
| `open` | Puede asistir cualquiera. **Incluye** el evento con entrada de pago y el que se queda sin plazas: un precio y un aforo no son condiciones sobre **quién eres**. | Un meetup con registro abierto; una conferencia con entradas a la venta. |
| `members-only` | Hay que **pertenecer** a algo antes. | La sesión que ocurre dentro del Discord de la comunidad. |
| `approval-required` | Te apuntas y **quien organiza decide**. | El «request to approve» de Luma; un grupo de Meetup con pregunta de admisión; un taller que selecciona a quien asiste. |
| `restricted` | Hay condición y **ninguno de los otros la nombra**. Obliga a escribir `note`. | «Solo alumnado de la Universidad de Almería»; una cena de speakers y patrocinadores dentro de una conferencia. |

**`approval-required` no es aforo, y conviene decirlo porque se confunde solo.** Va de un **juicio sobre la persona**: alguien mira tu solicitud y decide. Un evento al que puede ir cualquiera **por orden de llegada** hasta que se acaban las plazas **no tiene puerta**: es `open`, y que las plazas se agoten se dice con [`offers[].availability: "sold-out"`](#offers-cuánto-cuesta-y-dónde-se-saca-la-entrada) —o con `capacity`, que sigue siendo extensión—. Es la distinción que sostiene todo el campo: `eligibility` describe **una condición sobre quién puede entrar**, no el **estado de la taquilla**. Si la respuesta a «¿puedo ir?» cambia sola con el paso del tiempo, no es `eligibility`.

**`restricted` es el escape, y exige `note`.** Es lo que mantiene el enum pequeño y honesto: sin un catch-all, toda condición que no encaje —«solo alumnado de la UAL», los eventos con requisito de identidad de una comunidad— acaba metida a martillazos en `members-only`, que es afirmar algo que nadie afirmó. Y `restricted` a secas no dice nada, así que el schema **rechaza el documento** si falta `note`: es la misma condicional que exige `currency` en cuanto `price` pasa de 0. Cumple el papel que `tentative` cumple en `status`: el valor que evita que quien importa tenga que mentir.

**Sin valor por defecto: ausente significa desconocido, nunca `open`.** Misma regla que `attendanceMode` y `offers`. Quien importa un `.ics` no tiene el dato en ninguna parte, y un valor por defecto convertiría cada evento importado en una afirmación —«abierto a cualquiera»— que nadie ha hecho. El corolario es que **`"type": "open"` sí aporta información**, al contrario que `"status": "scheduled"`: aquí callarse no significa lo mismo que decirlo. Es el único par de la spec donde esa diferencia se ve tan de cerca.

**Por qué no hay `invite-only`.** Estuvo en el borrador y **se cae por alcance, no por forma**. Esta spec existe para que alguien encuentre eventos y comunidades **en los que puede participar**; un evento al que solo se entra por invitación no es un evento que buscar, es un club privado, y darle un valor propio del enum sería declarar que describir clubes privados es parte del trabajo. Los casos reales que rozan el límite —una cena de speakers y patrocinadores, un encuentro de un programa de embajadores— **siguen siendo publicables**, y con más información que antes: `restricted` con su `note` obligatoria («Solo speakers y patrocinadores») dice **quién** puede entrar, mientras que `invite-only` solo decía «tú no». Un valor menos, y el que queda obliga a explicarse.

**Por qué no son `tags`.** Es como se hace hoy, y por eso el campo existe: en cuanto `["rust","members-only","principiantes"]` es una lista libre, el consumidor tiene que **adivinar** cuál de esas cadenas es una condición de acceso, y ninguna interfaz puede ofrecer una casilla «solo eventos a los que puedo entrar» sin un vocabulario que la lista libre no tiene. `tags` es **de qué va** el evento; se queda libre justo por eso, y su descripción ahora lo dice. El otro eje que hoy también se cuela en `tags` —**el público y el nivel** («principiantes», «estudiantes»)— sigue sin resolver: es una [pregunta abierta](#otras), no este campo. La puerta y la recomendación no son lo mismo.

**Por qué un objeto y no una cadena** (`"eligibility": "members-only"`). Porque *qué* comunidad es un dato que quien publica ya tiene hoy, y en `members-only` sin nombrarla el campo se queda a medias. Ensanchar cadena → objeto después es un cambio que rompe —el precio que se pagó al declararlo en [`image`](#image-el-cartel-y-por-qué-es-una-lista-de-cadenas)—, así que se paga ahora, que es gratis. Solo `type` es obligatorio: quien no tenga más, escribe una línea.

**Y no va dentro de `offers`.** Se valoró, porque el eje por tramo existe de verdad —la tarifa de estudiante pide carné, la de socio pide alta— y aun así se descarta: `offers` es **opcional y ausente en la mayoría de los eventos** (ninguno de los 24 del feed de referencia lo trae, y un exportador de `.ics` no tiene precio que emitir), así que la puerta desaparecería justo donde más eventos hay. Además «¿puedo ir?» es propiedad **del evento**, no del tramo de precio: si vive solo en `offers`, cada consumidor tiene que plegar N ofertas en una respuesta, y dos formas de afirmar lo mismo son dos formas de contradecirse — el argumento por el que [no hay `isFree`](#offers-cuánto-cuesta-y-dónde-se-saca-la-entrada). Si aparece un productor real con requisito por tramo, `offers[].eligibility` entrará **reutilizando este mismo enum**, y hasta entonces no se paga por un caso hipotético.

**Lo que `eligibility` no modela**: aforo y plazas restantes (eso es [taquilla](#offers-cuánto-cuesta-y-dónde-se-saca-la-entrada)), el estado de *tu* solicitud, códigos de acceso, listas de invitados, edad mínima como campo aparte, ni el código de conducta. Describe **la condición, no el trámite**.

**Cómo entra**, porque el listón de esta spec es que alguien lo emita de verdad: ninguna plataforma lo publica **estructurado** —schema.org no tiene término para la puerta—, pero todas lo tienen **como funcionalidad**: la aprobación previa de Luma, los eventos solo para miembros de un grupo de Meetup, los eventos privados de Eventbrite, el canal cerrado de Discord. Es el mismo caso que [`cfp`](#cfp-la-convocatoria-de-charlas--y-el-primer-campo-que-no-viaja-a-ninguna-parte): el dato existe y se publica en HTML, y quien lo quiere estructurado hoy tiene que adivinarlo. Su valor está **dentro del ecosistema OTE**, no en la traducción.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | Sin término propio. Lo más cercano es `audience` (`Audience.audienceType`), que es **texto libre y otra cosa** —a quién va dirigido, no quién tiene permiso—; `note` y `url` van dentro de `description`. | **La estructura, no el dato.** El texto llega; el filtro no. Y ojo con dos falsos amigos: `Offer.eligibleCustomerType` es B2B/B2C, y `isAccessibleForFree` es el precio, no la puerta. |
| **iCal** | Nada nativo → `X-OTE-ELIGIBILITY` y el texto en `DESCRIPTION` («Solo miembros del Discord de Rust Girona») | **La estructura.** Falso amigo a evitar: `CLASS:PRIVATE` de [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) es la **visibilidad del dato en un calendario**, no el permiso de entrada al evento. Mapear ahí sería decir otra cosa. |
| **RSS / Atom** | Nada nativo: va dentro del texto del ítem | **La estructura.** Un anuncio que no dice que hace falta ser socio manda a alguien a una puerta cerrada. |

Que solo llegue como texto es aceptable por la regla de siempre: un cliente de calendario que ignora `eligibility` **sigue mostrando un evento correcto**. Es pérdida de estructura, no de información — y la información sobrevive porque `note` está pensada precisamente para que la lea una persona.

### `offers`: cuánto cuesta, y dónde se saca la entrada

Nuevo en la v0.3. Opcional, y **una lista**:

```json
"offers": [
  { "name": "Early bird", "price": 35, "currency": "EUR", "url": "https://…/entradas", "availability": "sold-out", "closesAt": "2026-06-30T23:59:59+02:00" },
  { "name": "General",    "price": 45, "currency": "EUR", "url": "https://…/entradas", "availability": "in-stock" },
  { "name": "Estudiantes","price": 0,  "url": "https://…/entradas#estudiantes" }
]
```

Un meetup gratuito es **una sola entrada**:

```json
"offers": [{ "price": 0, "url": "https://rustmadrid.example/meetups/2026-06#registro" }]
```

**Ausente significa desconocido, no gratis.** Es la misma regla que `attendanceMode`, y aquí duele igual: un consumidor que interprete «sin `offers` = gratis» convierte en gratuita cualquier conferencia de pago cuyo exportador no mapeó el precio. Decir «gratis» tiene una forma, y es `price: 0`.

**Es una lista porque el precio de un evento casi nunca es un número.** Early bird, general, estudiantes, empresa: son ofertas distintas, con fechas y disponibilidad distintas. Por eso **no hay rangos ni «desde 45 €»**: un precio que no se puede escribir con un solo número **son varias ofertas**, y escribirlo como texto rompe lo único por lo que merece la pena publicarlo como dato — que alguien pueda **filtrar y comparar**. `price` es un número, sin símbolo de moneda y sin separador de miles.

**`currency` es obligatoria en cuanto `price` pasa de 0**, y sobra cuando es 0. Lo gratis es gratis en cualquier moneda, y exigirla ahí es exactamente cómo Luma acaba publicando `"price": 0, "priceCurrency": "usd"` para una sesión semanal de Rust en Girona: una divisa inventada para un dato que no la necesita. Al revés, un `45` sin moneda no es un precio: es un número que cada consumidor leerá en la suya. Es la misma decisión que `country` en `address` — código ISO (4217 aquí, alfa-3 en mayúsculas), no nombre. El validador lo comprueba contra la lista ISO 4217 activa, no solo por su forma — mismo motivo y mismo patrón que `timezone`: ver [DECISIONS.md, D005](DECISIONS.md#d005--offerscurrency-must-be-a-real-iso-4217-code). Y al revés de esto: `currency` sin ningún `price` tampoco vale — es una moneda que no califica nada, huérfana en el `Offer.priceCurrency` que se mapea a schema.org. Si el precio todavía no se conoce, la forma de decirlo ya existe y es la misma de siempre: omitir el campo. Ver [DECISIONS.md, D021](DECISIONS.md#d021--offerscurrency-requires-offersprice-to-be-present).

**`availability` tiene dos valores, `in-stock` y `sold-out`, y no tiene valor por defecto.** Son los dos estados sobre los que quien asiste puede actuar. Ausente significa desconocido, y eso es deliberado: **un feed desactualizado que sigue afirmando `in-stock` es peor que uno que se calla**, porque manda a alguien a una página de entradas agotadas. Quien no mantenga el dato al día, que lo omita.

**Regla para quien consume, y vale para todos los enums de la spec: un valor que no conozcas se trata como desconocido, nunca como el valor tolerante.** Escrito como `availability !== "sold-out"` ⇒ disponible —que es como se escribe esto casi siempre— cualquier valor futuro se convierte en «a la venta», y eso manda a alguien a comprar lo que no se puede comprar. Es la misma regla que «ausente = desconocido», aplicada al futuro en vez de al vacío.

**`waitlistUrl`: agotado con cola no es lo mismo que agotado.** Cuando las plazas se acaban hay dos situaciones distintas —no hay nada que hacer, o puedes ponerte en la cola— y hasta ahora eran el mismo documento:

```json
{ "name": "Estudiantes", "price": 0, "availability": "sold-out",
  "waitlistUrl": "https://devfest-levante.example/2026/lista-espera" }
```

**Y por qué no es un tercer valor de `availability`.** Fue la primera idea, y pierde en lo único que importa aquí: **cómo degrada**. Con `availability: "waitlist"`, un consumidor que no conozca el valor no tiene ninguna lectura segura, y el que lo parsee con `availability !== "sold-out"` —lo normal— acaba anunciando como disponible algo que no lo está. Con `sold-out` + `waitlistUrl`, **todo consumidor que existe hoy sigue leyendo «agotado», que es verdad**: no puedes comprar. El que conozca el campo, además, ofrece la cola. Callarse sobre la cola es una omisión; decir «a la venta» es una mentira, y esta spec elige la omisión siempre.

**`price` no contradice a `sold-out`, ni a la cola.** Los dos ejes son ortogonales por diseño: `price` describe **el trato**, `availability` describe **si puedes actuar sobre él ahora**. «45 €, agotado» ya era un documento normal en la v0.3; con cola significa lo mismo que significaba `price` antes de comprar — **lo que costará si entras**. Apuntarse a una cola no cuesta dinero, y nada en el modelo insinúa lo contrario. Por eso el caso que más lo necesita —el **evento gratuito con aforo limitado**, que es el pan de cada día de un meetup— se escribe `price: 0` + `sold-out` + `waitlistUrl`, y quien lo lea sin entender colas ve «gratis, agotado».

**El schema rechaza `in-stock` + `waitlistUrl`**, con un `if`/`then` como el de `currency`: una cola para algo que está a la venta no es una cola. Lo que **sí** permite es `waitlistUrl` sin `availability`: quien sabe que hay cola y no mantiene el estado de la taquilla al día no debería verse forzado a **afirmar** `sold-out` para poder mencionarla. Se prohíbe la combinación incoherente, nunca la incompleta.

**Lo que se descartó por el camino: `last-tickets`.** schema.org tiene el término (`LimitedAvailability`, y Google lo lee), y aun así se queda fuera por tres razones que se refuerzan: de las cinco fuentes estudiadas, **las tres que emiten `availability` emiten `InStock` y nada más**; el umbral no se puede definir —¿cinco plazas, el 10%, lo que decida el marketing?—, así que nadie podría comparar ni filtrar, que es el argumento por el que `price` es un número y no «desde 45 €»; y es **el estado más volátil posible**, incompatible con un fichero que se publica cada noche. Sobre todo, **no cambia la acción**: sigues pudiendo comprar. Cambia la urgencia, y la urgencia es aforo — o sea taquilla, que esta spec deja fuera.

**`opensAt` y `closesAt` son INSTANTES, con offset o `Z`** — a diferencia de `startDate`, que es reloj de pared. No es una incoherencia: una venta que abre es **el momento en que un botón empieza a funcionar**, no una hora en un cartel. [Detalle abajo, junto al mismo caso en el CFP](#fechas-límite-por-qué-llevan-offset-y-startdate-no).

**Lo que `offers` no modela**, y no por olvido: **aforo** (`maximumAttendeeCapacity`, que Guild sí emite), **plazas restantes**, **cuánta gente hay en la cola**, códigos de descuento, cuotas por equipo, y la **inscripción única** de un evento multi-parte. Todo eso es *ticketing*: estado que cambia solo, que caduca en minutos y que un fichero JSON publicado cada noche no puede sostener. `offers` describe **la entrada, no la taquilla**. Si necesitas aforo hoy, ponlo como extensión sin prefijo (ver [`examples/event-meetup.json`](examples/event-meetup.json)) y dilo en el issue.

**Por qué no hay `isFree`.** Estaba en el boceto anterior, y es redundante: `price: 0` ya lo dice. Dos formas de afirmar lo mismo son dos formas de contradecirse — `{"isFree": true, "price": 45}` es un documento que valida y no significa nada —, y obliga a todo consumidor a decidir cuál gana. Por lo mismo, `registrationUrl` se llama aquí `url`: el objeto ya se llama «oferta».

Entra por la vía de siempre: de las cinco fuentes estudiadas ([`research/findings/json-ld-event-platforms.md`](../../research/findings/json-ld-event-platforms.md)), **tres emiten `offers`** —Luma, Guild y el ejemplo canónico de Google—, con la forma `price` + `priceCurrency` + `availability` + `url` que aquí se copia casi tal cual. Y es un campo que Google **muestra** en el rich result de `Event`.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | `offers` (array de `Offer`): `price` → `price`, `currency` → `priceCurrency`, `url` → `url`, `availability` → `https://schema.org/InStock` \| `SoldOut`, `opensAt` → `validFrom`, `closesAt` → `validThrough`, `name` → `name` | **Solo `waitlistUrl`.** El resto es 1:1 con el término que Google lee hoy. schema.org **no tiene término** para lista de espera —`BackOrder` y `PreOrder` significan otra cosa—, así que se emite `SoldOut`, que no es falso, y la cola se degrada al texto. Un valor de enum habría perdido exactamente lo mismo. |
| **iCal** | Nada nativo | **Total.** [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) no modela precio ni entradas: no hay propiedad donde ponerlo. Un exportador puede llevarlo a la `DESCRIPTION` («Entrada general: 45 €») o a un `X-OTE-PRICE`, y quien no lo entienda ve el evento entero igual. |
| **RSS / Atom** | Nada nativo: va dentro del texto del ítem | **Toda la estructura.** Un canal de anuncios que no dice el precio en el cuerpo está ocultando lo primero que se pregunta. |

Que solo schema.org lo reciba estructurado es aceptable porque **la pérdida es inocua**: un cliente de calendario que ignora el precio sigue mostrando un evento correcto. Es la misma regla que `partOf` — un campo de identidad o de contexto que se ignora deja datos incompletos; uno de tiempo que se ignora deja datos falsos.

### `cfp`: la convocatoria de charlas — y el primer campo que no viaja a ninguna parte

Nuevo en la v0.3. Opcional, **un objeto**, y solo `url` es obligatoria:

```json
"cfp": {
  "url": "https://devfest-levante.example/2026/cfp",
  "opensAt": "2026-05-01T00:00:00+02:00",
  "closesAt": "2026-07-15T23:59:59+02:00",
  "coversTravel": true,
  "coversAccommodation": true
}
```

**Es el único campo de la spec sin equivalente en ninguno de los tres destinos.** schema.org no tiene término para una convocatoria de propuestas, iCalendar tampoco, y RSS/Atom menos. Al exportar se degrada a texto, y punto. Así que hay que justificar por qué entra igualmente, porque el listón de esta spec es «lo emite alguien de verdad» y aquí ningún productor de JSON-LD lo emite.

Entra por **el otro lado del tubo**: el del consumidor. «¿Qué conferencias están aceptando propuestas ahora mismo?» es una de las preguntas que este proyecto existe para contestar, y hoy se contesta **scrapeando**: confs.tech, developers.events, CFP Land y demás listados mantienen a mano —o a base de raspar webs— exactamente estos dos datos, enlace y fecha límite. Que no haya un `Offer` de schema.org detrás no significa que no haya productores: significa que los productores lo publican **en HTML**, y que quien lo quiere estructurado tiene que adivinarlo. OTE no es solo un formato de exportación a otros tres formatos; es también el sitio donde puede vivir un dato que los otros tres no saben nombrar. `cfp` es el primer campo que ejerce eso, y conviene decirlo en voz alta: **su valor está dentro del ecosistema OTE, no en la traducción**.

**`closesAt` es [recomendado](#válido-no-es-lo-mismo-que-útil-los-campos-recomendados) en cuanto hay `cfp`.** Sin fecha límite, un consumidor ve un enlace y no puede saber si cerró en marzo — y la pregunta que el campo existe para responder («¿está abierto?») se queda sin responder. El aviso es accionable por definición: quien abrió la convocatoria sabe cuándo cierra. Es la otra recomendación condicional de la spec, junto a `endDate`.

**Un objeto, no una lista** — al contrario que `organizers` e `image`. La razón es la misma en los tres casos, aplicada a los hechos: `organizers` nace lista porque Luma **ya emite** varios; aquí ningún productor real publica dos convocatorias por evento, y los directorios de CFP que existen modelan exactamente **un enlace y una fecha**. Si aparecen de verdad los casos que se imaginan (charlas y talleres con plazos distintos), ensanchar objeto → lista es un cambio que rompe y llegará con su versión. No se paga hoy por un caso hipotético.

**`coversTravel` y `coversAccommodation` son booleanos sin valor por defecto**: ausente significa **desconocido**, nunca `false`. Están aquí, y «call for sponsors» o «call for volunteers» no, porque son **lo que se filtra antes de decidir si puedes permitirte enviar una propuesta**: para quien da charlas fuera de su ciudad, esa casilla decide si la convocatoria le concierne.

**Lo que `cfp` no modela**: tracks, formatos y duraciones, estado de la revisión, si es ciega, cuotas de diversidad o el resultado. Nada de eso lo tiene un directorio de eventos: lo tiene la plataforma de CFP, que ya es Sessionize o Pretalx, y a la que precisamente apunta `url`.

#### Fechas límite: por qué llevan offset, y `startDate` no

`cfp.opensAt`, `cfp.closesAt`, `offers[].opensAt` y `offers[].closesAt` son **instantes**: exigen offset (`+02:00`) o `Z`. Las fechas del evento, no. Parece una incoherencia y es justo lo contrario:

- **Un evento le pasa a la gente en un sitio.** «El 16 de octubre a las 9:00» es la hora del cartel, y quien esté ahí la lee tal cual. Por eso es reloj de pared, y por eso `timezone` la contextualiza.
- **Una fecha límite es un botón que deja de funcionar.** No la vive nadie en ninguna sede: la viven a la vez alguien en Madrid y alguien en Bogotá, y lo único que importa es el instante exacto.

Y hay un caso que zanja la discusión: **«anywhere on Earth»**. Un CFP que cierra AoE cierra a las 23:59 **en UTC-12**, que no es la zona del evento ni la de nadie que lo organice. Con reloj de pared + `timezone` del evento no se puede expresar; con offset se escribe `"2026-07-15T23:59:59-12:00"` y se acabó. Un `"23:59"` pelado es el bug clásico de las convocatorias — qué medianoche es literalmente toda la pregunta.

**El offset de cada instante es el que quien lo escribe elija — no se exige UTC.** Forzarlo simplificaría la validación, pero obligaría a convertir a mano una fecha que alguien ya piensa en su propia zona horaria, el mismo coste que ya se descartó para `startDate`. Lo que sí exige el validador es que `closesAt` no sea anterior a `opensAt` — comparando los instantes reales, no el texto, porque con offsets distintos el orden de las cadenas puede no coincidir con el orden real. Detalle en [DECISIONS.md, D009](DECISIONS.md#d009--offers-and-cfp-windows-opensatclosesat-must-not-be-inverted-and-instants-keep-their-own-offset-rather-than-being-forced-to-utc).

El precio es que Google, en su ejemplo canónico, emite `"validFrom": "2024-05-21T12:00"` **sin** offset. Un exportador de OTE emite el instante completo, que es un superconjunto: nada se pierde, y lo que llega es menos ambiguo que el ejemplo.

**Traducción a los tres formatos de destino, incluida la pérdida:**

| Destino | Mapeo | Pérdida |
| --- | --- | --- |
| **schema.org** | Ninguno | **Total.** No hay término. Un exportador puede mencionar la convocatoria en `description`; Google no la va a entender de ninguna forma. |
| **iCal** | Ninguno | **Total.** Ni `URL` (ya la ocupa la del evento) ni nada equivalente. Degrádalo a `DESCRIPTION` o a un `X-OTE-CFP-URL`. |
| **RSS / Atom** | Nada nativo: va dentro del texto del ítem | **Toda la estructura**, y aquí sí conviene compensarla: un feed de anuncios que no dice «CFP abierto hasta el 15 de julio» en el cuerpo está callándose la razón por la que mucha gente lo lee. |

## El feed

Obligatorio: `specVersion`, `title`, `license`, `updatedAt`, `events`.

**La `license` del feed es el valor por defecto de sus eventos**: un evento que no declare la suya hereda la del feed. Repetir `"license": "CC-BY-4.0"` en 200 eventos es ruido, no rigor. Un evento *dentro de un feed* tampoco repite `specVersion`: hereda la del feed. Un evento **suelto** (fuera de un feed) sí debe declarar ambas — no tiene de quién heredarlas.

**`organizers` se hereda igual, con una diferencia**: la lista del evento **reemplaza** la del feed, no se suma a ella (el porqué, arriba). Y un feed de **agregador** debe **omitir** `organizers`: no organiza lo que publica, y ponerlo ahí atribuiría mal cada evento del feed.

**`textLanguage` también se hereda** —una línea en el feed y ningún evento la repite— y **`translations` no se hereda nunca**: el `title` de un feed no es el `name` de un evento, así que `feed.translations` traduce el feed y cada evento lleva las suyas. [Detalle arriba](#textlanguage-y-translations-en-qué-idioma-está-escrito-esto). Y, igual que `organizers`, un feed de **agregador** cuyos eventos no comparten idioma debe **omitir** `feed.textLanguage`: heredarlo atribuiría a todo evento un idioma que puede no ser el suyo. El perfil recomendado avisa (sin invalidar) si `textLanguage` está presente y `organizers` no —la misma señal que ya usa el feed para saber que es de agregador—, precisamente para detectar este caso. Detalle en [DECISIONS.md, D016](DECISIONS.md#d016--feedtextlanguage-inheritance-is-enforced-against-the-effective-language-computed-at-the-feed-root).

**Resumen de qué se hereda**, porque son cuatro campos con tres comportamientos distintos:

| Campo del feed | Cómo llega al evento |
| --- | --- |
| `specVersion`, `license` | **Valor por defecto.** El evento que lo declara gana; suelto, es obligatorio declararlo. |
| `textLanguage` | **Valor por defecto.** Igual que `license`. |
| `organizers` | **Valor por defecto por REEMPLAZO**: la lista del evento sustituye la entera, no se fusiona. |
| `translations` | **No se hereda.** Traduce el texto del feed, y nada más. |

Por eso el schema del evento tiene dos capas: `$defs/event` (lo común) y el documento de nivel superior, que añade `specVersion` y `license` como obligatorios. El feed referencia `$defs/event`.

El feed es un **formato de intercambio, no una API**: sin paginación, sin filtrado, sin autenticación, sin federación.

## Extensiones

Los schemas **no prohíben campos adicionales**. Si tu comunidad necesita `sponsors` o `capacity` hoy, ponlos: tu documento sigue siendo válido. Es la vía por la que la spec debe crecer — **campos que alguien ya usa de verdad**, no campos que imaginamos que hará falta usar. Así entró `tags` en la v0.2, y así entraron `organizers`, `image`, `offers` y `cfp` en la v0.3.

Cuando un campo se estandarice, se le dará un significado normativo. Hasta entonces, un consumidor puede ignorarlos sin miedo.

### Dos tipos de extensión, y por qué distinguirlos

Bajo «campo adicional» conviven dos cosas muy distintas, y confundirlas se paga más adelante:

| | Qué es | Cómo se escribe | Ejemplo |
| --- | --- | --- | --- |
| **Candidato a núcleo** | Un campo genérico que **aspira a ser de OTE**. Lo usas hoy porque te hace falta; si a más gente le hace falta, se estandariza. | **Sin prefijo** | `capacity`, `sponsors`, `speakers` |
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

Deduplicación entre fuentes, sincronización, publicación automática en plataformas, modelado de ponentes/agenda/patrocinadores, y **la taquilla**: aforo, plazas restantes, códigos de descuento e inscripción única de un evento multi-parte. `offers` describe **la entrada**, no el estado de la venta; `cfp` describe **la convocatoria**, no la revisión de propuestas.

Tampoco resuelve **las grafías de una localidad**: `location.address.locality` y `region` se escriben una sola vez, en la grafía más reconocible para la audiencia del evento — «València» o «Valencia», no las dos. Lo demás sí se traduce, y [donde vive](#traducciones-locales-el-texto-que-vive-dentro-de-un-objeto).

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

- **Público y nivel.** [`eligibility`](#eligibility-quién-puede-entrar--y-por-qué-no-es-un-tag) resuelve la **puerta** («¿me dejan entrar?») y saca de `tags` ese eje. Queda el otro que hoy también se cuela ahí: «¿es para mí?» — «principiantes», «estudiantes», «senior». Es **recomendación, no permiso**, y por eso no cabe en `eligibility`. Un `level` con enum (`beginner` / `intermediate` / `advanced`) sería filtrable y lo etiquetan conferencias reales; un `audience` de texto libre, copiado de schema.org, solo movería el problema de sitio. No entra hasta que haya productor real: mientras tanto, `tags` sigue aceptándolo, con lo que eso cuesta.
- **`eligibility` por tramo de entrada.** El eje existe —la tarifa de estudiante pide carné— y el hueco está reservado: `offers[].eligibility`, reutilizando el mismo enum, en cuanto alguien lo emita de verdad.
- **`id` de un evento importado de un `.ics` sin URL.** Hoy los ejemplos usan `<url-del-ics>#<UID>`. Funciona y es estable, pero ata el `id` al calendario de origen: si la comunidad se muda, el `id` que acuñó el importador ya no está bajo un dominio que ella controle.
- **Serialización.** El schema es JSON. YAML es cómodo para escribir a mano (los issues usan YAML) y se mapea 1:1. ¿Se declaran ambos normativos?
- **`license` obligatoria en el evento suelto**: ¿es una barrera de entrada demasiado alta para quien solo quiere publicar su meetup?
