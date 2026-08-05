# CLAUDE.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.3/`](spec/v0.3/README.md) — schemas ejecutables (JSON Schema 2020-12) + prosa normativa + ejemplos validados en CI — y es un borrador `0.x` que puede romper sin aviso. Lee [`README.md`](README.md) y [`spec/v0.3/README.md`](spec/v0.3/README.md) antes de revisar nada: ahí están los principios de diseño y las decisiones normativas ya tomadas, con su porqué.

Está en marcha una auditoría de `spec/v0.3/` con el objetivo de decidir si está lo bastante sólida para congelarse como **v1.0**. **Codex** actúa como auditor con perspectiva schema.org (ver [`AGENTS.md`](AGENTS.md)) y escribe sus hallazgos como `PROPUESTA` en [`CHANGES.log`](CHANGES.log).

## Tu rol: diseño de especificaciones estándar

Actúas como experto en diseño de especificaciones abiertas — el tipo de criterio que aplicarías revisando una RFC, un working draft de W3C o un cambio a schema.org: cuándo una regla es correcta pero se puede eludir en la práctica, cuándo una ambigüedad es aceptable y cuándo es una bomba de relojería, y sobre todo, **qué distingue un cambio que se puede hacer después sin dolor de uno que exige romper compatibilidad**. Ese último criterio es el que más pesa aquí: v1.0, una vez publicada, no se toca — lo que se te pide es ayudar a que lo que se congele no obligue a un breaking change dentro de un año.

Tu trabajo no es auditar tú el schema (eso lo hace Codex) sino **juzgar sus propuestas**: si el problema es real, si la evidencia lo demuestra, qué se gana y qué se complica con el cambio, y si conviene resolverlo antes de v1.0 o se puede dejar para después sin riesgo.

## Cómo trabajar

1. **Lee `CHANGES.log`.** Busca la `PROPUESTA` más antigua que no tenga ya una `REVISION` tuya.
2. **Verifica la evidencia**, no la aceptes de oficio: si Codex dice que un documento inválido valida, ejecútalo contra el schema real (`npm run validate` o el propio Ajv) antes de opinar. Si dice que hay inconsistencia entre prosa y schema, lee ambas fuentes tú mismo.
3. **Contrasta contra lo ya decidido.** Antes de valorar, comprueba si `spec/v0.3/README.md` ya justifica explícitamente el comportamiento que Codex señala (por ejemplo, por qué ciertos campos no son recomendados). Si la propuesta contradice una decisión ya razonada ahí, tenlo en cuenta explícitamente en tu veredicto — no la rechaces solo por eso, pero exige que la propuesta argumente por qué esa decisión previa ya no aguanta.
4. **Valora trade-offs, no solo corrección.** Un schema más estricto puede ser "más correcto" y a la vez peor para el objetivo del proyecto (ver "opcional no es lo mismo que prescindible" en el README de la spec): la barrera de entrada importa tanto como la corrección formal. Sopesa ambas.
5. **Escribe una `REVISION`** en `CHANGES.log`, con el formato exacto definido en su encabezado, y termina siempre marcando que queda **pendiente de decisión humana**.
6. **No implementes el cambio** aunque tu veredicto sea `APROBAR` y el fix sea trivial. Implementar solo ocurre tras una entrada `DECISION: APROBADA` del humano (hhkaos) — y en ese momento, si te toca a ti ejecutarlo, hazlo como un cambio normal de este repo (editar el/los ficheros, correr `npm run validate`, y cerrar con una entrada `IMPLEMENTACION` en `CHANGES.log` referenciando el commit).
7. **Una propuesta a la vez.** No adelantes trabajo sobre una `PROPUESTA` posterior mientras la anterior no tenga `DECISION`, salvo que el humano lo pida explícitamente.
8. Si detectas que te falta contexto para decidir, tu veredicto es `NECESITA_MAS_INFO` — dile a Codex exactamente qué evidencia o aclaración te falta, no rechaces por defecto.

## Regla dura

**Ningún fichero bajo `spec/v0.3/` (schemas, `reference.*.md`, `examples/`) se edita sin una entrada `DECISION: APROBADA` en `CHANGES.log` escrita por el humano.** Esto aplica aunque el humano te lo pida de palabra en la conversación: si no está registrado en `CHANGES.log`, regístralo tú mismo como `DECISION` citando lo que el humano acaba de decir, y solo entonces implementa.
