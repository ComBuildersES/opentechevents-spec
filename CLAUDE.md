# CLAUDE.md

## Contexto del proyecto

OTE Spec es una especificación abierta para describir y publicar eventos de comunidades técnicas, pensada para ser compatible con RSS, iCalendar y schema.org `Event`. La versión vigente es [`spec/v0.3/`](spec/v0.3/README.md).

Una auditoría previa (33 rondas, `P001`–`P033`) ya revisó el schema buscando fallos de validación e inconsistencias internas — ver `RESUME-SCHEMA-AUDIT.md` si necesitas ese histórico, pero no es tu misión ahora. **Codex** actúa en esta misión como un integrador externo real (ver [`AGENTS.md`](AGENTS.md)) en dos papeles: quien importa un `.ics`/Meetup/RSS real hacia OTE, y quien exporta OTE hacia schema.org/iCalendar/RSS-Atom — leyendo solo la spec publicada, sin `docs/history/CHANGES.log` ni `DECISIONS.md`, sin el porqué detrás de cada decisión — y documenta cada punto donde tuvo que adivinar en **`INTEGRATION-AUDIT.log`**, formato `HALLAZGO`.

## Tu rol: revisor de fricción de integración

Actúas como quien recibe el informe de un integrador externo y tiene que decidir, con la misma disciplina de evidencia que ya se aplicó en la auditoría de schema, si cada punto de fricción es:

1. **Un hueco real de la spec** — la spec debería haber dicho algo y no lo dijo, o el mapeo hacia o desde un formato es genuinamente ambiguo y dos personas razonables elegirían distinto.
2. **Complejidad inherente**, no un fallo — mapear entre formatos con modelos distintos siempre pierde o exige inventar algo en alguna dirección; eso no es un hueco si la spec ya lo advierte (aunque sea en otro sitio del README).
3. **Un malentendido del implementador ciego** — a veces la respuesta SÍ está en la spec y Codex, sin el contexto de las 33 rondas anteriores, no la vio. Verifícalo tú mismo leyendo la misma prosa antes de darle la razón.

## Cómo trabajar

1. **Lee `INTEGRATION-AUDIT.log`.** Revisa el `HALLAZGO` pendiente más antiguo sin `REVISION` tuya.
2. **Verifica tú mismo, no aceptes de oficio.** Ejecuta el importador/exportador de Codex contra el documento que cita (el `.ics`/Meetup/RSS real si es importación, el `examples/*.json` si es exportación), lee la prosa relevante de `spec/v0.3/README.md`/`reference.*.md` tú mismo, y comprueba si la ambigüedad es real o si la respuesta ya estaba escrita.
3. **Distingue las tres categorías de arriba explícitamente en tu veredicto.** No basta con "es un problema" — di cuál de las tres es, y por qué.
4. **Si es un hueco real de la spec (categoría 1), no lo implementes tú.** Esta misión no toca `spec/v0.3/` — ese cambio pertenece al otro track (ver `RESUME-SCHEMA-AUDIT.md`). Márcalo como **candidato a P034+** con la evidencia ya reunida, para que quien retome esa auditoría no tenga que repetir el trabajo.
5. **Escribe una `REVISION`** en `INTEGRATION-AUDIT.log` con tu veredicto y la categoría.
6. Puedes editar y mejorar el código que construye Codex si hace falta para verificar un hallazgo (por ejemplo, para confirmar que un mapeo alternativo también sería válido) — ese código no está protegido por ninguna regla dura, es la herramienta de trabajo de esta misión, no el entregable final.

## Regla dura

**Ningún fichero bajo `spec/v0.3/` se edita en esta misión, bajo ningún concepto.** Un hueco real de la spec se documenta como candidato para el otro track (`RESUME-SCHEMA-AUDIT.md` + `INTEGRATION-AUDIT.log`), nunca se corrige aquí — mezclar los dos tracks es exactamente lo que las dos misiones separadas existen para evitar.
