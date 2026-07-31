# Cómo contribuir

Gracias por pasarte. OTE Spec está en **fase de diseño**: nada está cerrado y por eso ahora mismo una opinión vale más que un *pull request*. Si organizas eventos, montas un directorio o mantienes una herramienta, tienes justo el contexto que le falta a este proyecto.

> ⚠️ **Aviso importante.** La especificación vigente es **[OTE Spec v0.3](spec/v0.3/README.md)** y es un **borrador `0.x`: puede romper sin previo aviso**. Se publicó para que existan implementaciones reales y para que rompan lo que esté mal. El debate sigue abierto en los issues [#5 (evento)](https://github.com/OpenTechEvents/opentechevents-spec/issues/5) y [#6 (feed)](https://github.com/OpenTechEvents/opentechevents-spec/issues/6).
>
> Los documentos de `spec/data-model.md` y `spec/feed.md` son el **boceto anterior** y **no son normativos**. No los implementes ni los edites.

## Lo que más falta ahora mismo

En este orden:

1. **Casos reales que rompan el modelo.** Un evento tuyo que no se pueda describir con la spec actual es información valiosísima. Cuéntalo aunque no traigas solución.
2. **Gente que diga que la adoptaría.** Un «lo publicaremos cuando haya una spec estable» cuesta dos minutos y es lo que hace que un directorio decida que este formato merece la pena leerlo. Ver [apoyar sin publicar nada](#apoyar-sin-publicar-nada).
3. **Comunidades dispuestas a publicar un feed.** Un estándar sin datos reales es teoría. Ver [adherirse](#adherirse-publicar-tus-eventos-en-ote).
4. **Consumidores.** Directorios, newsletters o bots que lean feeds OTE. Cada consumidor hace que adherirse compense más.
5. **Difusión.** Nadie da feedback sobre algo de lo que no ha oído hablar. Ver [difusión y embajadores](#difusión-y-embajadores).
6. **Herramientas del ecosistema.** Catálogo en [`docs/data/tools.json`](docs/data/tools.json), pintado en [opentechevents.org#tools](https://opentechevents.org#tools).
7. **Código y documentación.** Llegará, pero va después de lo anterior.

## Todas las formas de participar

Cada fila es una puerta de entrada distinta, ordenadas de menos a más esfuerzo. **Ninguna es un peldaño obligatorio para la siguiente**: entra por donde te apetezca.

| Qué | Cuánto cuesta | Por dónde |
| --- | --- | --- |
| Comprometerte a adoptarla cuando haya una spec estable | 2 min | [issue de apoyo](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) |
| Contárnoslo en una llamada en vez de por escrito | 20 min | [reservar hueco](https://calendar.app.google/ZQuRkVw53h8nC2uQA) |
| Dar un testimonio publicable | 5 min | [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions) |
| Ponerte la chapa en tu README | 1 min | [`docs/badge/`](docs/badge/README.md) |
| Contar un evento tuyo que la spec no sabe describir | 10 min | [issue de caso real](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=case.yml) |
| Revisar la spec cuando toque tu caso | reactivo | [issue de apoyo](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) («asesora») |
| Presentarnos a un directorio, plataforma o conferencia | 1 mensaje | [issue de embajador](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml) |
| Hablar de esto (charla, artículo, podcast, hilo) | variable | [issue de embajador](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml) |
| Traducir la web o las descripciones de campos | 1-3 h | [traducir](#traducir) |
| Debatir la especificación | variable | [issues](https://github.com/OpenTechEvents/opentechevents-spec/issues) |
| Publicar un feed | ~1 h | [adherirse](#adherirse-publicar-tus-eventos-en-ote) |
| Consumir feeds (directorio, bot, newsletter) | días | [issue de consumidor](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=consumer.yml) |
| Montar una herramienta | días | [issue de herramienta](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=tool.yml) |

¿Prefieres que lo hablemos y no escribir un issue? **[Reserva 20 minutos](https://calendar.app.google/ZQuRkVw53h8nC2uQA)** y ya está. Quien organiza eventos tiene cosas mejores que hacer que aprenderse nuestras plantillas. Si no te encaja ningún hueco, abre un [hilo en Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions) y buscamos uno.

## Cómo participar

### Apoyar sin publicar nada

No hace falta que publiques un feed para que tu apoyo sirva. Un estándar joven se muere de dos cosas: de que nadie lo conozca y de que nadie se crea que alguien lo va a usar. Contra la segunda solo hay un remedio, y es **decirlo en público**.

Abre un [issue de apoyo](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) y marca lo que te encaje:

- **Compromiso** — «publicaremos (o consumiremos) OTE cuando haya una spec estable». No es vinculante: se retira comentando en el mismo issue. Se lista **aparte** de quien ya publica, porque prometer y hacerlo no son lo mismo y mezclarlo sería mentir.
- **Apoyo** — te parece bien la idea y quieres aparecer respaldándola.
- **Asesoría** — no vas a implementar nada, pero revisas borradores y traes tu caso real cuando la spec toque tu terreno.
- **Recursos** — hosting, dominio, diseño, ilustración, una revisión legal o de accesibilidad, un volcado de eventos históricos contra el que probar, un hueco en tu evento, una sala para un taller de adopción. No todo lo útil es código.

Y si tienes una frase publicable sobre por qué esto importa en tu comunidad, déjala en [Discussions](https://github.com/OpenTechEvents/opentechevents-spec/discussions): los testimonios se revisan **a mano** y se pasan a [`docs/data/consumers.json`](docs/data/consumers.json) con tu permiso explícito.

Todo esto sale en [opentechevents.org#support](https://opentechevents.org#support), desde [`docs/data/supporters.json`](docs/data/supporters.json).

### Difusión y embajadores

Nadie da feedback sobre algo de lo que no ha oído hablar. Ahora mismo **la difusión rinde más que el código**: [issue de embajador](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=ambassador.yml).

- **Hablar de esto.** Una charla, una lightning talk, un artículo, una newsletter, un podcast, un hilo. **Pídenos el material**: slides, una demo, un diagrama, media hora para ponerte al día o que alguien copresente contigo. Si te toca fabricarte tú el material, no lo vas a hacer, y con razón.
- **Presentarnos a alguien.** Esto es lo más valioso y lo que menos cuesta. Si conoces a quien mantiene un directorio, un calendario, una plataforma de eventos o la web de una conferencia, **un mensaje tuyo vale más que cincuenta correos fríos nuestros**.
- **Abrir un issue en un proyecto de terceros** pidiendo soporte OTE. Dinos dónde y te pasamos el texto; que llegue de alguien que ya usa ese proyecto pesa mucho más que si llega de nosotros.
- **Ponerte la chapa** en tu README o en el pie de tu web: [`docs/badge/`](docs/badge/README.md). Es lo único de esta lista que sigue funcionando mientras nadie lo mira.
- **Traducir** a un tercer idioma: abre una región entera de comunidades. Ver [traducir](#traducir).

A los embajadores se les lista en la web y se les reconoce con [all-contributors](https://allcontributors.org) (`talk`, `blog`, `translation`, `ideas`…). Si has hecho algo y no apareces, dilo: es un olvido.

### Debatir la especificación

**Abre un [issue](https://github.com/OpenTechEvents/opentechevents-spec/issues)** (o comenta en uno existente). No hace falta que la propuesta esté pulida ni que sepas de estándares. Lo que sí ayuda a que un cambio avance:

- **El caso real detrás.** «En mi comunidad hacemos X y no sé cómo representarlo» pesa más que «faltaría un campo Y».
- **Qué se rompe si no se arregla.** ¿Se pierde información? ¿Un importador se inventa un dato? ¿Un evento aparece mal en un directorio?
- **Cómo lo resuelven otros.** Si iCalendar, schema.org o RSS ya tienen una solución para eso, dilo: la compatibilidad es un principio de diseño, no un extra.

**Un caso real vale más que una propuesta de campo.** Si tu evento no cabe en la spec, cuéntalo aunque no traigas solución: eso es exactamente lo que necesitamos, y tiene [plantilla propia](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=case.yml).

### Cambiar la especificación

Un cambio en la spec **no es solo editar un `.md`**. La versión vigente tiene cuatro piezas que se validan entre sí, y **van en el mismo PR**:

| Pieza | Fichero |
| --- | --- |
| El schema ejecutable | `spec/v0.3/event.schema.json` / `feed.schema.json` |
| La prosa normativa (lo que un validador no puede comprobar) | `spec/v0.3/README.md` |
| Los ejemplos, incluidos los que **deben fallar** | `spec/v0.3/examples/` y `examples/invalid/` |
| La ficha del ejemplo en la galería de la web (EN + traducciones) | `spec/<versión>/examples/catalog/` → `npm run build-examples` |
| Las copias publicadas (los `$id` deben resolver) | `docs/schema/` → `npm run publish-schemas` |

Antes de enviar: `npm run validate`. **Si el cambio no viene con un ejemplo que lo demuestre, no está terminado** — y si relaja una regla, quita el ejemplo de `invalid/` que ya no debe fallar.

**Un campo nuevo se declara donde le toca.** El orden en que el schema declara sus `properties` es el orden canónico de los campos: lo hereda la referencia generada y el autocompletado del editor, y los ejemplos deben seguirlo (`npm run validate` falla si no). Está explicado, con sus bloques y el porqué, en [«El orden de los campos»](spec/v0.3/README.md#el-orden-de-los-campos-no-es-normativo-pero-hay-uno). Colocarlo al final «porque es nuevo» es lo único que no vale.

**Añadir un campo no requiere cambiar el schema.** Los schemas no prohíben campos adicionales: si tu comunidad necesita `tags` o `cfp` hoy, los pones y tu documento sigue siendo válido. La spec crece con **campos que alguien ya usa de verdad**, no con campos que imaginamos que harán falta. Trae el uso real y hablamos de estandarizarlo.

### Versionado

- **`0.x` puede romper.** No hay compromiso de compatibilidad hasta la 1.0.
- **Una versión publicada no se toca.** Los cambios que rompen van a un directorio nuevo (`spec/v0.4/`), no encima de `spec/v0.3/`. Es lo que permite que un documento diga `specVersion: "0.3.0"` y alguien sepa dentro de tres años contra qué validarlo.
- Correcciones que **no** cambian qué documentos son válidos (una errata en la prosa, una descripción) sí van sobre la versión vigente.

### Adherirse: publicar tus eventos en OTE

Tres pasos, explicados con detalle en [opentechevents.org](https://opentechevents.org#adopt):

1. Publica un archivo JSON con tus eventos en una URL que controles.
2. Enlázalo desde el `<head>` de tu web para que las herramientas lo descubran solas.
3. **Regístralo** con el [formulario](https://opentechevents.org/register/) —que te rellena el issue— o directamente con la [plantilla de adherido](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=adopter.yml), para que lo validemos y te listemos en la web.

**Valida tu feed antes de abrir el issue.** Clona este repo y pásale tu fichero:

```bash
npm install
npm run validate -- mi-feed.json
```

Detecta si es un evento suelto o un feed, y te dice qué falta (`data/events/0 must have required property 'timezone'`). Desde código, con el paquete `@opentechevents/schema`: ver [spec/v0.3/README.md](spec/v0.3/README.md#consumir-los-schemas).

> 🗓️ **¿Ya tienes un `.ics` y no quieres escribir JSON?** El agregador —que convierte calendarios existentes a OTE— es una de las herramientas del catálogo y **está por construir**. Dinos la URL de tu calendario en un [issue de apoyo](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=supporter.yml) y la damos de alta como fuente en cuanto exista: es la vía de entrada más barata y no te compromete a nada.

Al dar de alta una fuente que no sea tuya, ten en cuenta que el agregador **solo ingerirá datos con licencia abierta declarada o con permiso explícito del organizador** — y que un `.ics` público no es automáticamente reutilizable (los TdS de muchas plataformas lo restringen).

### Aparecer en la web

Las listas de la web salen de cuatro archivos JSON. Añadirte es un PR de una entrada:

| Archivo | Para |
| --- | --- |
| [`docs/data/adopters.json`](docs/data/adopters.json) | Comunidades que **ya publican** sus eventos en OTE |
| [`docs/data/supporters.json`](docs/data/supporters.json) | Quien apoya el proyecto: compromisos de adopción, apoyos, embajadores, asesoras, recursos |
| [`docs/data/consumers.json`](docs/data/consumers.json) | Quien consume feeds OTE (directorios, apps, personas) y sus testimonios |
| [`docs/data/tools.json`](docs/data/tools.json) | Herramientas del ecosistema |

Los textos libres admiten `{ "en": "…", "es": "…" }`. Detalles y ejemplos en [`docs/README.md`](docs/README.md). Si prefieres no tocar JSON, abre el issue que corresponda y lo añadimos nosotros.

### Reclamar o proponer una herramienta

El catálogo está en [`docs/data/tools.json`](docs/data/tools.json) y se pinta en [opentechevents.org#tools](https://opentechevents.org#tools). **Ninguna de las ideas marcadas como *proposed* tiene dueño.** Si te quieres poner con una, **[abre un issue diciéndolo](https://github.com/OpenTechEvents/opentechevents-spec/issues/new?template=tool.yml)** antes de empezar: te ahorra duplicar trabajo y sirve para acordar el alcance.

### Traducir

Inglés y español. Hay **tres sitios distintos**, y no se mezclan:

| Qué | Dónde |
| --- | --- |
| Los textos de la web | [`docs/i18n/`](docs/i18n/) — ver [`docs/README.md`](docs/README.md) |
| Las descripciones de los campos de la spec | [`spec/v0.3/i18n/`](spec/v0.3/i18n/) |
| Las fichas de la galería de ejemplos | [`spec/v0.3/examples/catalog/`](spec/v0.3/examples/catalog/) |

Las `description` **dentro de los schemas se quedan en inglés**: viajan en el paquete npm hacia implementadores de todo el mundo. Las traducciones van aparte, indexadas por campo, y `npm run validate` **falla si falta alguna**. Tras traducir: `npm run build-reference` regenera `reference.<idioma>.md` y la página de referencia, y `npm run build-examples` regenera la galería de <https://opentechevents.org/examples/>.

**¿Un idioma nuevo?** Se puede, y hace falta: cada idioma abre una región entera de comunidades. Añade `docs/i18n/<código>.json`, mete el código en `SUPPORTED` de [`docs/app.js`](docs/app.js) y añade el botón al grupo `.lang`. Dilo antes en un issue: hay que decidir si ese idioma se mantiene también en la spec, no solo en la web, porque una traducción que se queda a medias envejece peor que no tenerla.

## Pull requests

Para cambios pequeños (erratas, enlaces rotos, una entrada en una lista, una traducción), manda el PR directamente.

Para cualquier cosa que toque **la especificación**, abre antes un issue. Un PR al modelo de datos sin debate previo es muy probable que se quede parado, no por burocracia sino porque el acuerdo es justo la parte difícil.

- Una rama por cambio, desde `main`.
- Mensajes de commit en imperativo; si sigues [Conventional Commits](https://www.conventionalcommits.org/), mejor.
- Explica **el porqué** en la descripción del PR. El qué ya se ve en el diff.
- Si **añades un ejemplo**, catalógalo en `spec/<versión>/examples/catalog/en.json` (y tradúcelo): el CI falla si un ejemplo no está catalogado o si le falta una traducción. La galería de la web lee el JSON **del propio fichero validado**, así que no puede enseñar un documento inválido.
- Si tocas los **schemas o los ejemplos**, ejecuta `npm run validate` antes de enviar. El CI lo hace igualmente y **falla si un ejemplo deja de validar** — es lo que impide que la spec y sus ejemplos se separen (ya pasó una vez).
- Si añades o cambias un schema, `npm run publish-schemas` copia la versión publicada a `docs/schema/` (las URLs de los `$id` deben resolver). El validador comprueba que no se hayan separado.
- Si tocas la **web**, levántala en local con `npm run dev` (→ <http://localhost:8000>) y comprueba que no rompes nada.

## Publicar una versión (mantenedores)

Los schemas se publican en npm como [`@opentechevents/schema`](https://www.npmjs.com/package/@opentechevents/schema) y se sirven en `https://opentechevents.org/schema/v0.3/…`.

1. `npm run publish-schemas` — sincroniza las copias que sirve la web.
2. Sube la versión en `package.json`.
3. Tag: `git tag schema-v0.3.1 && git push origin schema-v0.3.1`.

El resto lo hace [`publish-schema.yml`](.github/workflows/publish-schema.yml), con dos frenos deliberados: **falla si el tag no coincide con la versión del `package.json`**, y **no publica si los ejemplos no validan** — un schema que rompe sus propios ejemplos no llega a npm. No hay token: npm confía en este repo y en este workflow (*trusted publishing*, OIDC), y el paquete se firma con *provenance*.

## Idioma

El repositorio está en **español**, pero la especificación tiene vocación internacional. **Escribe en el idioma que te resulte cómodo**: si abres un issue en inglés, se te responde en inglés. Los nombres de campo de la spec son en inglés, sin discusión.

## Reconocimiento

Se usa [all-contributors](https://allcontributors.org): se reconoce **cualquier tipo de contribución**, no solo código — ideas, investigación, documentación, traducción, difusión, charlas, presentaciones que abren una puerta, revisión. Si has aportado algo y no apareces, dilo: es un olvido, no un criterio.

## Licencia de tus contribuciones

Al contribuir aceptas que tu aportación se publique bajo las licencias del proyecto (ver [LICENSE](LICENSE)):

- **prosa** (spec, docs, web, investigación) → [CC0-1.0](LICENSES/CC0-1.0.txt), dominio público;
- **schemas y código** → [MIT](LICENSES/MIT.txt).

No hace falta firmar ningún CLA. Si esto te supone un problema, dilo en el issue **antes** de contribuir y lo hablamos.

## Conducta

Todavía no hay un código de conducta formal (falta, y se agradecen propuestas). Mientras tanto, la regla es la obvia: se debate sobre ideas, no sobre personas. Quien organiza comunidades ya sabe de qué va esto.
