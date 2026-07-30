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

Nueve campos nuevos y dos valores nuevos de `status`, todo **opcional y
retrocompatible** (por eso MINOR): un documento `0.2.0` válido, con solo cambiar
`specVersion` a `"0.3.0"`, sigue siendo válido.

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

Además, un **segundo nivel de exigencia**: los perfiles de campos recomendados.
No cambian lo que es válido —ni un solo documento deja de validar— pero ponen
nombre a la diferencia entre un evento válido y uno que de verdad se puede
descubrir y seguir.

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
    son doce documentos, cada uno con su `id`, sus fechas y su `status`; un study
    jam en tres sesiones, tres. `partOf` solo dice a qué conjunto pertenecen.
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

- **`image`** (`array` de URLs `https`, mín. 1) en el **evento**. Imágenes
  promocionales: cartel, portada, tarjeta. **El orden es significativo** — la
  primera es la principal, y a menudo la única que un destino puede usar.
  - **No es una galería.** Las entradas son **la misma imagen** en distintos
    recortes o resoluciones, que es lo que pide Google (1:1, 4:3, 16:9) y lo que
    ya emiten Meetup, Luma y Guild.
  - **Lista de cadenas, no de objetos**, y por tanto **sin `alt`**: ningún
    productor real emite texto alternativo, y modelarlo hoy sería diseño
    especulativo. La pérdida de accesibilidad se reconoce; ensanchar cadena →
    objeto rompe, así que llegaría con su versión.
  - Traducción: `image` de schema.org **1:1**; `IMAGE;VALUE=URI` (RFC 7986) en
    iCal, solo la primera en la práctica; `<enclosure>` o `<media:content>` en
    RSS y `<link rel="enclosure">` en Atom — donde el `type` (MIME) hay que
    inferirlo, porque OTE no lo modela.
  - **Entra en el perfil recomendado.** No rompe nada en los tres destinos, pero
    el aviso es **accionable**: las cinco fuentes estudiadas ya emiten imagen, así
    que un feed sin `image` casi nunca es un evento sin cartel — es un cartel sin
    mapear. Sigue siendo un aviso: nada deja de validar.
  - Era una **extensión sin prefijo** en los ejemplos desde la v0.1 (como cadena
    suelta). Se gradúa a núcleo **como lista**: si la emitías como cadena, migra.

- **`location.address`** (`object`) en el **evento**: la dirección postal de la
  sede física **por partes** — `street`, `locality`, `region`, `postalCode` y
  `country`, todas opcionales, con al menos una presente.
  - **Complementa a `venue`, no lo sustituye.** `venue` sigue siendo la cadena
    legible que imprimen `LOCATION` de iCal y el texto de un ítem RSS —los dos
    formatos que **no modelan direcciones**—, y `Place.name` de schema.org.
    `address` es lo que necesita el traductor para emitir un `PostalAddress`
    cuyos subcampos **Google valida uno a uno** en el rich result de `Event`.
    `venue` para leer, `address` para procesar.
  - **Entra porque ya existe ahí fuera**: cuatro de las cinco fuentes estudiadas
    (Meetup, Eventbrite, Guild y el ejemplo canónico de Google) emiten
    `PostalAddress` con sus subcampos. Sin el campo, un exportador solo podía
    emitir la dirección como texto suelto o **partir `venue` por comas**, que es
    inventar datos.
  - **`country` es ISO 3166-1 alfa-2 en mayúsculas** (`ES`, `US`), la única parte
    con formato exigido: el nombre del país tiene una grafía por idioma, y quien
    agrupe por país vería «España», «Spain» y «Espagne» como tres países.
    Convertir nombre → código es consultar una tabla, no inventar. `region` se
    deja libre: no hay tabla universal (provincia, estado, condado, *Land*).
  - **Omitir es la forma correcta de no saber**: `""` y `null` se rechazan (cada
    parte es una cadena de longitud ≥ 1), y `"address": {}` también, igual que
    `location: {}`. Con caso real detrás: Guild emite hoy los cinco subcampos a
    `null`.
  - **No satisface `location` por sí solo**: sigue haciendo falta `venue` u
    `onlineUrl`, misma regla que `geo`.
  - **No entra en el perfil recomendado**: lo recomendado es `location`. Qué hace
    falta saber del sitio depende del tipo de evento —a uno online la dirección
    postal no le aplica, y a un meetup en un bar le basta el nombre del bar—, así
    que el aviso no sería accionable para buena parte de los eventos. Es una
    mejora real cuando se tiene, no un mínimo de calidad.

- **`offers`** (`array`, mín. 1) en el **evento**: qué cuesta asistir y dónde
  registrarse. Cada entrada: `name`, `price`, `currency`, `url`, `availability`
  (`in-stock` \| `sold-out`), `opensAt` y `closesAt`, con al menos `price` o
  `url` presente.
  - **Ausente significa DESCONOCIDO, nunca gratis.** Decir «gratis» tiene una
    forma, y es `price: 0`. Un consumidor que lea «sin `offers` = gratis»
    convierte en gratuita toda conferencia de pago cuyo exportador no mapeó el
    precio.
  - **Es una lista** porque el precio de un evento casi nunca es un número:
    early bird, general, estudiantes. Por eso **no hay rangos ni «desde 45 €»** —
    `price` es un **número**, sin símbolo ni separador de miles: un precio que no
    cabe en un número **son varias ofertas**, y como texto no se puede filtrar ni
    comparar, que es lo único por lo que merece la pena publicarlo como dato.
  - **`currency` (ISO 4217 alfa-3) es obligatoria en cuanto `price` pasa de 0**, y
    sobra cuando es 0 — lo gratis es gratis en cualquier moneda. Es exactamente
    cómo Luma acaba emitiendo `"price": 0, "priceCurrency": "usd"` para una sesión
    que no cuesta nada. El schema lo expresa con un `if`/`then`.
  - **`availability` no tiene valor por defecto**: ausente = desconocido. Un feed
    desactualizado que sigue afirmando `in-stock` es peor que uno callado, porque
    manda a alguien a una taquilla cerrada.
  - **Entra porque ya existe ahí fuera**: tres de las cinco fuentes estudiadas
    (Luma, Guild y el ejemplo canónico de Google) emiten `offers` con esta misma
    forma, y Google lo **muestra** en el rich result de `Event`.
  - **Sin `isFree`** (estaba en el boceto anterior): redundante con `price: 0`, y
    dos formas de afirmar lo mismo son dos formas de contradecirse. Sin `capacity`
    ni plazas restantes: eso es **taquilla**, no entrada. `registrationUrl` pasa a
    llamarse `url` — el objeto ya se llama oferta.
  - Traducción: `Offer` de schema.org **1:1** (`currency` → `priceCurrency`,
    `opensAt`/`closesAt` → `validFrom`/`validThrough`, `availability` → las URLs
    `InStock`/`SoldOut`). En **iCal y RSS/Atom no hay nada**: RFC 5545 no modela
    precio. Va a la `DESCRIPTION` o al cuerpo del ítem.

- **`cfp`** (`object`) en el **evento**: la convocatoria de propuestas. `url`
  obligatoria; `opensAt`, `closesAt`, `coversTravel` y `coversAccommodation`
  opcionales.
  - **Es el único campo de la spec sin equivalente en ninguno de los tres
    destinos**, y entra igualmente — por el otro lado del tubo. «¿Qué conferencias
    aceptan propuestas ahora mismo?» es una de las preguntas que este proyecto
    existe para contestar, y hoy se contesta **scrapeando**: confs.tech,
    developers.events o CFP Land mantienen a mano justo estos dos datos, enlace y
    fecha límite. El productor existe; publica en HTML, no en JSON-LD. OTE no es
    solo un formato de exportación: es también donde puede vivir un dato que los
    otros tres no saben nombrar.
  - **Un objeto, no una lista**, al contrario que `organizers`: allí Luma **ya
    emite** varios, aquí ningún productor real publica dos convocatorias por
    evento. Si el caso aparece, ensanchar objeto → lista rompe y llegará con su
    versión; no se paga hoy por un caso hipotético.
  - **`coversTravel` y `coversAccommodation` no tienen valor por defecto**:
    ausente = desconocido, nunca `false`. Están porque son lo que se filtra antes
    de decidir si uno puede permitirse enviar una propuesta.
  - **`closesAt` entra en el perfil recomendado, de forma condicional** (solo si
    hay `cfp`): sin fecha límite, un consumidor ve un enlace y no sabe si cerró en
    marzo. `offers` y `cfp` **no** son recomendados en sí: la mayoría de eventos no
    tiene convocatoria, y el precio no siempre se puede recuperar de la fuente.
  - **Sin `timezone` propio** (lo tenía el boceto anterior): sus fechas son
    instantes con offset, ver abajo.
  - Traducción: **nada en schema.org, nada en iCal, nada en RSS/Atom.** Se
    degrada a texto en la `DESCRIPTION` o en el cuerpo del ítem, o a un
    `X-OTE-CFP-URL`.

- **`eligibility`** (`object`) en el **evento**: quién puede entrar, cuando la
  respuesta no es «cualquiera». `type` obligatorio (`open` \| `members-only` \|
  `approval-required` \| `restricted`); `note` y `url` opcionales.
  - **Es la tercera parte de «¿puedo ir?»**, junto a `attendanceMode` y
    `location`: esos dos dicen si el evento **está a tu alcance**, este si **te
    dejan entrar**. Se contradicen sin problema — una sesión online, gratis y
    abierta a cualquiera con conexión cuyo canal de voz está dentro de un Discord
    al que hay que pertenecer.
  - **Sustituye a la práctica de meterlo en `tags`.** En una lista libre,
    `["rust","members-only"]` obliga al consumidor a **adivinar** cuál de esas
    cadenas es una condición de acceso, y ninguna interfaz puede ofrecer un
    filtro «solo eventos a los que puedo entrar». La descripción de `tags` ahora
    dice explícitamente que es **de qué va** el evento, no quién puede entrar.
    El otro eje que también se cuela ahí —**público y nivel**— sigue sin
    resolver: es pregunta abierta, no este campo.
  - **`approval-required` es un juicio sobre la persona, no aforo.** Alguien mira
    tu solicitud y decide (el «request to approve» de Luma, un grupo de Meetup con
    pregunta de admisión). Un evento al que se entra **por orden de llegada** hasta
    que se acaban las plazas **no tiene puerta**: es `open`, y que se agoten es
    `offers[].availability: "sold-out"` (o `capacity`, que sigue siendo extensión).
    Regla que sostiene el campo: si la respuesta a «¿puedo ir?» cambia sola con el
    tiempo, **no es `eligibility`** — es taquilla.
  - **Sin `invite-only`**, y se cae **por alcance, no por forma**: esta spec existe
    para encontrar eventos y comunidades **en los que se puede participar**, y un
    evento al que solo se entra por invitación es un club privado. Los casos que
    rozan el límite —una cena de speakers y patrocinadores, un encuentro de un
    programa de embajadores— siguen siendo publicables con `restricted`, y con
    **más** información: su `note` obligatoria dice **quién** puede entrar, donde
    `invite-only` solo decía «tú no».
  - **`restricted` exige `note`**, con un `if`/`then` como el de `currency`: es
    el escape que mantiene el enum pequeño («solo alumnado de la UAL») sin que
    nadie tenga que meter a martillazos su condición en `members-only`. Y
    `restricted` a secas no dice nada.
  - **Sin valor por defecto**: ausente = desconocido, **nunca `open`**. Quien
    importa un `.ics` no tiene el dato, y un defecto convertiría cada evento
    importado en una afirmación que nadie hizo. Corolario: `"type": "open"` **sí
    aporta información**, al contrario que `"status": "scheduled"`.
  - **Un objeto, no una cadena**: *qué* comunidad es un dato que quien publica ya
    tiene, y ensanchar cadena → objeto después rompe. Solo `type` es obligatorio.
  - **No va dentro de `offers`**, aunque el eje por tramo exista (la tarifa de
    estudiante pide carné): `offers` está ausente en la mayoría de los eventos y
    nunca llega desde un `.ics`, así que la puerta desaparecería donde más
    eventos hay. `offers[].eligibility` queda **reservado**, con este mismo enum,
    para cuando haya productor real.
  - **No modela** aforo ni plazas (eso es taquilla), el estado de *tu* solicitud,
    códigos de acceso, listas de invitados ni el código de conducta: describe
    **la condición, no el trámite**.
  - Traducción: **nada estructurado en ninguno de los tres destinos** — el caso
    de `cfp`. Se degrada al texto (`DESCRIPTION`, cuerpo del ítem,
    `description`), que es para lo que está `note`, o a un `X-OTE-ELIGIBILITY`.
    Tres falsos amigos a evitar: `CLASS:PRIVATE` de iCal es la **visibilidad del
    dato**, `Offer.eligibleCustomerType` de schema.org es B2B/B2C, y
    `isAccessibleForFree` es el precio. Ninguno es la puerta.

- **`textLanguage`** (etiqueta BCP 47) en el **evento** y en el **feed**: el
  idioma en que está escrito el **texto libre del documento**.
  - **No es `languages`, y no se derivan.** `languages` son los idiomas que se
    **hablan** en el evento; `textLanguage` es el idioma en que está **escrito**
    este texto. Una sesión bilingüe descrita solo en catalán es
    `languages: ["ca","es"]` + `textLanguage: "ca"`. La descripción de
    `languages` ahora lo dice en el schema, que es donde alguien lo leerá.
  - **Una etiqueta, no una lista**: un texto está escrito en un idioma.
  - **Se hereda del feed**, como `license` y `organizers`: quien publica en un
    solo idioma lo declara **una vez en todo el fichero**. Ausente = desconocido,
    nunca el inglés ni el idioma de la respuesta HTTP.
  - **Desbloquea cosas concretas** que hoy no se pueden ni adivinar: el `lang`
    del HTML —del que dependen la separación de sílabas, el lector de pantalla y
    el corrector—, la ordenación alfabética correcta y la decisión de traducir
    automáticamente o no.
  - Traducción: **los tres destinos lo reciben**. `LANGUAGE` es un parámetro
    nativo de iCal (`SUMMARY;LANGUAGE=ca:…`, RFC 5545), RSS tiene `<language>`,
    Atom `xml:lang` y JSON-LD `@language`.

- **`translations`** (`object` indexado por etiqueta BCP 47) en el **evento**
  (`name`, `description`) y en el **feed** (`title`, `description`): el mismo
  texto en otros idiomas.
  - **Aditivo: `name` y `description` siguen siendo cadenas.** Un consumidor de
    v0.2 lee un documento con `translations` sin enterarse de que existe. La
    alternativa —mapas de idioma en el propio campo, `"name": {"ca":…,"es":…}`,
    el `@container: @language` de JSON-LD— es más limpia y **rompe `name` para
    todos los consumidores actuales**, gravando al 99% monolingüe para servir al
    1%. Descartada por eso.
  - **Un mapa, no una lista**, porque el idioma **es** la clave: una entrada por
    idioma y ninguna forma de publicar dos versiones en castellano que se
    contradigan. Claves BCP 47 (`"castellano"` no valida) y **mapa vacío
    inválido**, como `location: {}`.
  - **El texto que vive dentro de un objeto se traduce donde vive**, con un
    `translations` local: `offers[].translations` (`name`),
    `eligibility.translations` (`note`) y `partOf.translations` (`name`).
    **Nunca un espejo posicional** (`translations.es.offers[0].name`): una lista
    no tiene claves estables, así que reordenar las ofertas colgaría la
    traducción de la tarifa equivocada **sin que nada dejara de validar**.
  - **Lo que NO se traduce, y por qué.** Nombres propios (`organizers[].name`,
    `location.venue`): «PyAlmería» es «PyAlmería» en todos los idiomas.
    Identificadores (`id`, `partOf.id`, las `url`): dos grafías serían dos
    eventos. Códigos (`country`, `currency`, `languages`) y **enums**
    (`eligibility.type`, `status`, `attendanceMode`, `availability`): un valor
    cerrado es **multilingüe gratis** — se renderiza en el idioma de quien lee y
    el dato no cambia. Y `tags`, que al ser texto libre deja una arista real
    —`["aprenentatge-automàtic"]` y `["machine-learning"]` no se encuentran—:
    la recomendación es etiquetar en el idioma del ecosistema técnico.
  - **`offers[].name` sigue siendo texto libre**: se valoró un `kind` con enum,
    que habría sido multilingüe gratis, y se descarta porque le quitaría a quien
    organiza el derecho a nombrar sus propias entradas. Libertad ahora, y
    `offers[].translations` es su precio.
  - **`locality` y `region` no se traducen**: «València»/«Valencia» son grafías
    del mismo sitio y no hay tabla como la de países. Regla, no validación:
    **la grafía más reconocible para la audiencia mayoritaria del evento**. Quien
    necesite precisión sin idioma tiene `location.geo`, que no tiene grafías.
  - **Cualquier `translations` del documento exige `textLanguage`**, con un
    `if`/`then` y **a cualquier profundidad**: una traducción dentro de una oferta
    también lo activa. Es la **única dependencia entre campos de la spec**. Sin
    saber en qué idioma está el texto principal, nadie puede saber cuál entrada
    lo duplica ni a qué está cayendo de vuelta.
  - **Nunca se traduce al idioma que ya declara `textLanguage`** — sería el mismo
    texto dos veces. Regla **normativa que el schema no puede comprobar**:
    comparar el valor de un campo con el nombre de una clave está fuera de JSON
    Schema.
  - **En el feed no se hereda**: `feed.translations` traduce el título DEL FEED,
    nunca el nombre de sus eventos. `feed.textLanguage` sí se hereda.
  - **Deuda declarada**: a diferencia del resto de campos de esta versión,
    **ningún productor real lo emite** — cada plataforma sirve una página por
    idioma. Entra porque en catalán, euskera, galego y valenciano el evento
    bilingüe **es el caso normal**, y hoy la única salida es meter dos idiomas
    dentro de la misma cadena, que es peor. Sigue en pie la alternativa de **un
    feed por idioma** (`/feed.ca.json`, `/feed.es.json`). Si nadie lo emite, se
    retirará igual de en voz alta.
  - Traducción: **solo JSON-LD lo recibe entero** (mapas de idioma). En iCal no
    hay dónde —`SUMMARY` no se repite— y en RSS el idioma es del canal; Atom
    aguanta algo más porque `xml:lang` es por elemento.

- **Fechas límite como INSTANTES** (`cfp.opensAt`, `cfp.closesAt`,
  `offers[].opensAt`, `offers[].closesAt`): exigen offset o `Z`, a diferencia de
  `startDate`/`endDate`, que son reloj de pared. No es una incoherencia: un evento
  le pasa a la gente **en un sitio**, y una fecha límite es **un botón que deja de
  funcionar**, que ocurre a la vez en Madrid y en Bogotá. El caso que lo zanja es
  *anywhere on Earth*: un CFP que cierra AoE lo hace en **UTC-12**, que no es la
  zona del evento ni la de nadie que lo organice, y con reloj de pared +
  `timezone` no se puede expresar. Un `"23:59"` pelado es el bug clásico de las
  convocatorias.

- **Dos valores nuevos de `status`: `moved-online` y `tentative`.** El enum pasa a
  ser `scheduled` (por defecto), `tentative`, `cancelled`, `postponed`,
  `rescheduled`, `moved-online`. Añadir valores a un enum no invalida ningún
  documento anterior.
  - **`moved-online`** completa el enum `eventStatus` de schema.org
    (`EventMovedOnline`), que es el que consume Google. **Debería** —no debe—
    venir con `location.onlineUrl` y `attendanceMode: "online"`: el schema no lo
    exige porque el enlace de conexión a menudo no es público todavía, y exigirlo
    obligaría a quien importa a inventárselo o a descartar el evento. En iCal no
    hay forma de distinguirlo: se emite `CONFIRMED` con la URL en `LOCATION`.
  - **`tentative`** no viene de schema.org sino de iCal (`STATUS:TENTATIVE`), que
    es lo que emite cualquier calendario para lo que aún no está cerrado. Entra
    porque `status` es **el único campo de la spec con valor por defecto**: sin
    `tentative`, quien importa un `.ics` solo puede **ascender el evento a
    `scheduled`**, afirmando algo que nadie afirmó. Mismo argumento que el de
    `attendanceMode` sin valor por defecto. Al traducir a schema.org se pierde
    (se emite `EventScheduled`): es el único valor que viaja mejor a iCal.
  - Se documenta también la diferencia entre **`postponed`** (aplazado, **sin**
    fecha nueva: el documento conserva las fechas antiguas) y **`rescheduled`**
    (ya con fecha nueva, que es la que lleva el documento). Y que **RSS/Atom no
    tienen `status`**: quien exporte debe llevarlo al título de la entrada
    (`[CANCELADO] …`).

- **Campos recomendados**, como dos schemas nuevos y publicados:
  [`event.recommended.schema.json`](spec/v0.3/event.recommended.schema.json) y
  [`feed.recommended.schema.json`](spec/v0.3/feed.recommended.schema.json).
  - **Son perfiles de calidad, no de validez.** `event.schema.json` responde «¿es
    esto un evento OTE?»; el perfil responde «¿sirve para algo?». Regla
    normativa: una herramienta **puede avisar** de un campo recomendado que
    falta y **no debe rechazar** el documento por ello. Lo contrario
    reintroduciría por la puerta de atrás lo que la permisividad evita: quien
    importa un `.ics` pelado tendría que inventarse el dato o tirar el evento.
  - **Recomendados en el evento**: `url`, `description`, `organizers`,
    `location`, `attendanceMode`, `tags`, `languages`, `updatedAt` — y `endDate`
    **solo si `startDate` lleva hora** (en un evento de todo el día su ausencia
    ya significa «acaba el día que empieza», así que avisar sería ruido). El
    criterio no es «estaría bien tenerlo» sino **qué se rompe en los tres
    destinos si falta**: sin `url` no hay enlace en RSS/Atom, sin `tags` no hay
    filtrado por interés, sin `updatedAt` no hay sincronización incremental —
    que es lo que hace posible *suscribirse* en vez de releerlo todo.
  - **Recomendados en el feed**: solo `url` y `description`. Casi toda la calidad
    de un feed está en sus eventos, y un checker aplica el perfil de evento a
    cada uno **con la herencia ya resuelta**.
  - **`status` NO es recomendado**: es el único campo con valor por defecto, y
    escribir `"scheduled"` no añade nada a su ausencia. Lo que importa de
    `status` es *actualizarlo cuando el evento se cae*, y eso ningún schema lo
    puede comprobar.
  - **`feed.organizers` NO es recomendado**: un agregador **debe** omitirlo. Un
    aviso ahí le empujaría a atribuirse eventos que no organiza, corrompiendo el
    dato que el campo existe para proteger.
  - La referencia de campos pasa a tener tres niveles (`obligatorio`,
    `recomendado`, `opcional`), leídos **de los perfiles**, no escritos a mano.
    En el índice de la web, un punto naranja marca los recomendados junto al
    punto de acento que ya marcaba los obligatorios.
    `npm run validate` los reporta como avisos y **nunca** cambia el código de
    salida.

- **Política de extensiones con prefijo**, en el README de la spec. Se distinguen
  dos tipos de campo adicional: **candidato a núcleo** (sin prefijo: `capacity`,
  `sponsors`) y **vocabulario externo** (con prefijo: `combuilders:communityId`).
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
- **`previousStartDate`** (schema.org), la fecha que tenía un evento
  `rescheduled` antes de moverse. Ninguna de las fuentes estudiadas la emite, y
  `updatedAt` ya dice que el dato cambió. Entra como candidata a núcleo (campo sin
  prefijo) el día que alguien la use de verdad.
- **Aforo y estado de la venta** (`maximumAttendeeCapacity`, plazas restantes,
  códigos de descuento, inscripción única de un evento multi-parte). Guild sí
  emite el aforo, así que es un candidato razonable — pero el resto es **estado
  de la taquilla**: cambia solo, caduca en minutos y un fichero JSON regenerado
  cada noche no lo puede sostener. `offers` describe **la entrada**, no la venta.
  El aforo entra hoy como extensión sin prefijo (ver
  [`event-meetup.json`](spec/v0.3/examples/event-meetup.json)).
- **Ponentes (`speakers` / `performer`) y agenda.** Siguen fuera: `cfp` modela la
  convocatoria, no lo que sale de ella. Meter a un ponente en `organizers`
  corrompe el dato para todo el que lo consuma.
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
- **Los campos se declaran en un orden canónico** —identidad, cuándo, dónde,
  filtros, estado, procedencia— y lo siguen el schema, los ejemplos y la
  referencia generada. **No cambia nada de lo que es válido**: JSON no tiene
  orden y ningún consumidor debe depender de él. Cambia lo que se lee: la tabla
  de referencia, el autocompletado del editor y el ejemplo que alguien copia
  ahora enseñan la misma forma. `npm run validate` lo comprueba en los ejemplos
  de `v0.3`; las versiones congeladas conservan el suyo. El orden y el porqué,
  en [«El orden de los campos»](spec/v0.3/README.md#el-orden-de-los-campos-no-es-normativo-pero-hay-uno).

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
  `Organization` o `Person` según `type`. `offers` → `offers` (array de `Offer`),
  con `currency` → `priceCurrency` y `availability` → la URL
  `https://schema.org/InStock` o `SoldOut`. `cfp` no tiene destino: menciónalo en
  `description` si quieres que un humano lo vea.
- **Quien emitía `cfp` u `offers` como extensión** (estaban en los ejemplos desde
  la v0.1): ya son normativos, y con otra forma. `offers` pasa a **lista**, sin
  `isFree` (usa `price: 0`) y sin `capacity` (extensión); `registrationUrl` se
  llama ahora `url`. `cfp` pierde su `timezone`: las fechas límite llevan offset.
- **Exportadores a Atom / RSS:** Atom → un `<author>` por entrada, con `<name>` y
  `<uri>`. RSS 2.0 → `<dc:creator>`, **no** `<author>`: el `<author>` de RSS 2.0
  exige un email que OTE no modela. `textLanguage` → `<language>` del canal (RSS)
  o `xml:lang` (Atom, que además lo admite por entrada).
- **Exportadores a iCal:** solo `organizers[0]`, y solo si tienes un email por
  otra vía; si no, `X-OTE-ORGANIZER`. Los demás no tienen dónde ir.
  `textLanguage` → el parámetro `LANGUAGE` de cada propiedad de texto
  (`SUMMARY;LANGUAGE=ca:…`); de `translations` solo sobrevive el texto principal,
  porque `SUMMARY` no se repite.
- **Consumidores con interfaz multilingüe:** el orden de resolución es **el
  idioma que pide quien lee → `translations[idioma]` → el texto principal**, y
  ese último paso necesita `textLanguage` para saber en qué idioma está lo que
  está mostrando. Ausente = desconocido: no lo supongas del feed ni del
  `Accept-Language`.
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
