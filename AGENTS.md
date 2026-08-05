# AGENTS.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.3/`](spec/v0.3/README.md) — schemas ejecutables (JSON Schema 2020-12) + prosa normativa + ejemplos validados en CI.

Una auditoría previa (33 rondas, `P001`–`P033`, ver `RESUME-SCHEMA-AUDIT.md` si hace falta el histórico) ya revisó el schema línea a línea buscando fallos de validación e inconsistencias entre prosa y schema. Esa auditoría **no es tu misión** y no debes repetirla. Lo que queda por comprobar es distinto: **si alguien que solo tiene la spec publicada, sin el porqué detrás de cada decisión, puede producir y consumir documentos OTE reales sin adivinar.** Un schema puede ser internamente perfecto y aun así ser inconsumible en la práctica — mapeos ambiguos, campos sin traducción limpia hacia o desde otros formatos, decisiones que solo tienen sentido si conoces la discusión que las produjo.

## Tu rol: implementador ciego

Actúas como un integrador externo real, en dos papeles distintos (haz los dos, no solo uno):

1. **Quien importa**: alguien que solo tiene un `.ics` real, una exportación de Meetup, o un feed RSS/Atom de una comunidad, y necesita producir un documento OTE válido a partir de eso. La propia spec reconoce este caso como real y frecuente (`source`, el ejemplo `event-from-ics.json`, la pregunta abierta sobre `id` de un evento importado sin URL propia) — es probablemente donde encuentres más fricción.
2. **Quien exporta**: alguien a quien han encargado construir un exportador de eventos OTE a **schema.org `Event`** (JSON-LD), **iCalendar** (RFC 5545) y **RSS/Atom**.

En ambos casos, llegas a este repo sin más contexto que el que cualquier tercero tendría al descubrir la spec.

**Regla dura de la que depende todo lo demás: NO leas `CHANGES.log` ni `DECISIONS.md`.** Esos ficheros contienen el porqué de cada decisión de diseño, y ese conocimiento es precisamente lo que un integrador real no tiene. Si los lees, tu trabajo deja de medir lo que se supone que mide. Tu universo de lectura permitida es:

1. [`README.md`](README.md) (raíz) — visión general.
2. [`spec/v0.3/README.md`](spec/v0.3/README.md) — normativa.
3. Los schemas: `event.schema.json`, `feed.schema.json`, `event.recommended.schema.json`, `feed.recommended.schema.json`.
4. [`reference.en.md`](spec/v0.3/reference.en.md) / [`reference.es.md`](spec/v0.3/reference.es.md) — referencia de campos generada.
5. [`spec/v0.3/examples/`](spec/v0.3/examples/) — documentos de ejemplo reales.

## Qué construir

Código real, ejecutable, en el lenguaje que prefieras (recomendado: el mismo Node/JS del repo, para poder reutilizar `event.schema.json` y validar tus salidas). Dos piezas:

**Importador** (`.ics` / Meetup / RSS-Atom → OTE):
- Consigue al menos un `.ics` REAL (expórtalo de Google Calendar, de un calendario público conocido, o de cualquier herramienta real — no te lo inventes desde cero) y, si puedes, una exportación real de un evento de Meetup y un ítem de RSS real de una web de eventos.
- Produce un documento OTE válido (que pase `event.schema.json`) a partir de cada uno.
- Presta atención especial a: cómo acuñas `id` cuando la fuente no tiene URL propia, qué pones en `license` cuando la fuente no dice nada, cómo derivas `attendanceMode`/`location` de un formato que no modela esa distinción (iCalendar no la tiene en absoluto), y qué haces con campos que la fuente no tiene ni forma de tener.

**Exportador** (OTE → schema.org / iCalendar / RSS-Atom):
- Lee un documento OTE (evento o feed) válido y produce: un `Event` de schema.org (JSON-LD), un `VEVENT` de iCalendar, y un ítem de RSS o Atom.
- Cubrir al menos los campos marcados como recomendados en `reference.*.md`, y al menos un ejemplo de cada campo opcional "interesante" (`offers`, `cfp`, `eligibility`, `partOf`, `translations`, `image[]` con y sin `alt`).
- Corre contra varios `examples/*.json` reales del repo, no solo contra un caso inventado por ti.

## Qué reportar

Cada vez que tengas que **adivinar, elegir entre alternativas igual de razonables, o dejar un campo sin mapeo limpio** — en cualquiera de las dos direcciones — es un hallazgo. Escribe una entrada `HALLAZGO` en **`INTEGRATION-AUDIT.log`** (mismo mecanismo de *hand-off* que `CHANGES.log`, formato definido en su encabezado) — una por hallazgo, con:

- La dirección (importar/exportar) y el campo o la situación concreta.
- Qué tuviste que decidir sin que la spec te lo dijera, y qué alternativas consideraste.
- El documento real que dispara el caso (el `.ics`/Meetup/RSS de origen si es importación, o el `examples/*.json` de OTE si es exportación).
- Tu mejor intento de mapeo, aunque no estés seguro de que sea el correcto.

No hace falta "una a la vez" como en la auditoría anterior — este es un ejercicio exploratorio, documenta todo lo que encuentres a medida que avanzas construyendo. Sí evita repetir un hallazgo ya registrado por otro campo si la causa raíz es idéntica (cítalo en vez de duplicarlo).

## Qué NO es un hallazgo

- Que un campo sea opcional y por tanto tu código tenga que manejar su ausencia — eso es el diseño funcionando, no un fallo.
- Complejidad inherente a mapear entre formatos con modelos distintos (algo va a perderse siempre yendo a RSS, por ejemplo; un `.ics` real casi nunca tendrá `license`) — solo repórtalo si la spec no te avisa de esa pérdida/ausencia en ningún sitio y tú tuviste que descubrirla construyendo.
