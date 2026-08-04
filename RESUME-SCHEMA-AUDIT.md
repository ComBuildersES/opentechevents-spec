# Cómo retomar la auditoría de schema.org (P0xx)

Este repo tiene dos misiones activas en paralelo, y por eso `CLAUDE.md`/`AGENTS.md` (los ficheros que Claude Code y Codex cargan automáticamente en la raíz) apuntan ahora a la misión **nueva** (auditoría de un exportador real — ver `CLAUDE.md`/`AGENTS.md` actuales). La auditoría original del schema, con 33 rondas ya cerradas (P001–P033), sigue viva pero archivada bajo otro nombre para no colisionar.

## Estado a 2026-08-04

`P001`–`P033` implementadas y comiteadas. `DECISIONS.md` tiene D001–D030. Los 6 huecos del informe externo están cerrados. Quedan pendientes de prioridad Baja/Muy baja (ver memoria de proceso o `CHANGES.log`), ninguno bloqueante. El ciclo estaba limpio (sin `PROPUESTA` abierta sin `REVISION`/`DECISION`) en el momento de archivar esto.

## Para retomarlo

1. Restaura los ficheros de rol:
   ```
   git mv CLAUDE.md CLAUDE.export-audit.md    # o el nombre que se le diera a la misión nueva
   git mv AGENTS.md AGENTS.export-audit.md
   git mv CLAUDE.schema-audit-v03.md CLAUDE.md
   git mv AGENTS.schema-audit-v03.md AGENTS.md
   ```
   (Si la misión nueva ya no está activa, basta con los dos últimos `mv`.)
2. Abre una sesión de Claude Code en este repo. Con `CLAUDE.md`/`AGENTS.md` restaurados, el contexto del proyecto se carga automáticamente.
3. Pide "sigue" o "lee CHANGES.log y continúa la auditoría" — el flujo Codex↔Claude retoma exactamente donde lo dejó, empezando por la siguiente `PROPUESTA` (P034).
4. Si usaste memoria de Claude (`~/.claude/projects/.../memory/`), el fichero `project_codex_claude_audit_workflow.md` tiene el resumen completo de las 33 rondas — dile a Claude que lo consulte si hace falta contexto.

Este fichero (`RESUME-SCHEMA-AUDIT.md`) puede borrarse una vez restaurado.
