# AGENTS.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.3/`](spec/v0.3/README.md) — schemas ejecutables (JSON Schema 2020-12) + prosa normativa + ejemplos validados en CI.

Una auditoría previa (33 rondas, `P001`–`P033`, ver `RESUME-SCHEMA-AUDIT.md` si hace falta el histórico) ya revisó el schema línea a línea buscando fallos de validación e inconsistencias entre prosa y schema. Esa auditoría **no es tu misión** y no debes repetirla. Lo que queda por comprobar es distinto: **si alguien que solo tiene la spec publicada, sin el porqué detrás de cada decisión, puede construir un exportador real sin adivinar.** Un schema puede ser internamente perfecto y aun así ser inconsumible en la práctica — mapeos ambiguos, campos sin traducción limpia a los tres formatos de destino, decisiones que solo tienen sentido si conoces la discusión que las produjo.

## Tu rol: implementador ciego

Actúas como un integrador externo real: alguien a quien han encargado construir un exportador de eventos de OTE Spec a **schema.org `Event`** (JSON-LD), **iCalendar** (RFC 5545) y **RSS/Atom**, y que llega a este repo sin más contexto que el que cualquier tercero tendría al descubrir la spec.

**Regla dura de la que depende todo lo demás: NO leas `CHANGES.log` ni `DECISIONS.md`.** Esos ficheros contienen el porqué de cada decisión de diseño, y ese conocimiento es precisamente lo que un integrador real no tiene. Si los lees, tu trabajo deja de medir lo que se supone que mide. Tu universo de lectura permitida es:

1. [`README.md`](README.md) (raíz) — visión general.
2. [`spec/v0.3/README.md`](spec/v0.3/README.md) — normativa.
3. Los schemas: `event.schema.json`, `feed.schema.json`, `event.recommended.schema.json`, `feed.recommended.schema.json`.
4. [`reference.en.md`](spec/v0.3/reference.en.md) / [`reference.es.md`](spec/v0.3/reference.es.md) — referencia de campos generada.
5. [`spec/v0.3/examples/`](spec/v0.3/examples/) — documentos de ejemplo reales.

## Qué construir

Un exportador real, ejecutable, en el lenguaje que prefieras (recomendado: el mismo Node/JS del repo, para poder reutilizar `event.schema.json` y validar tus entradas). Debe:

- Leer un documento OTE (evento o feed) válido y producir: un `Event` de schema.org (JSON-LD), un `VEVENT` de iCalendar, y un ítem de RSS o Atom.
- Cubrir al menos los campos marcados como recomendados en `reference.*.md`, y al menos un ejemplo de cada campo opcional "interesante" (`offers`, `cfp`, `eligibility`, `partOf`, `translations`, `image[]` con y sin `alt`).
- Correr contra varios `examples/*.json` reales del repo, no solo contra un caso inventado por ti.

## Qué reportar

Cada vez que tengas que **adivinar, elegir entre alternativas igual de razonables, o dejar un campo sin mapeo limpio**, es un hallazgo. Escribe una entrada `HALLAZGO` en **`EXPORT-AUDIT.log`** (mismo mecanismo de *hand-off* que `CHANGES.log`, formato definido en su encabezado) — una por hallazgo, con:

- El campo o la situación concreta.
- Qué tuviste que decidir sin que la spec te lo dijera, y qué alternativas consideraste.
- El JSON/documento real que dispara el caso.
- Tu mejor intento de mapeo, aunque no estés seguro de que sea el correcto.

No hace falta "una a la vez" como en la auditoría anterior — este es un ejercicio exploratorio, documenta todo lo que encuentres a medida que avanzas construyendo. Sí evita repetir un hallazgo ya registrado por otro campo si la causa raíz es idéntica (cítalo en vez de duplicarlo).

## Qué NO es un hallazgo

- Que un campo sea opcional y por tanto tu exportador tenga que manejar su ausencia — eso es el diseño funcionando, no un fallo.
- Complejidad inherente a mapear a TRES formatos con modelos distintos (algo va a perderse siempre yendo a RSS, por ejemplo) — solo repórtalo si la spec no te avisa de esa pérdida en ningún sitio y tú tuviste que descubrirla construyendo.
