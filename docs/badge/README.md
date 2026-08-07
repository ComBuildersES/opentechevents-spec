# Badges

Static SVGs, served from `https://opentechevents.org/badge/`. Hand-written, no service behind
them: they keep rendering if shields.io is down, and they never phone home about who is reading
your README. Localised wordings exist too — see [Other languages](#other-languages) below.

| Badge | Use it if | File |
| --- | --- | --- |
| ![OTE feed](ote-feed.svg) | You publish an OTE feed and want a "subscribe" button, RSS-style | `ote-feed.svg` |
| ![OTE feed icon](ote-feed-icon.svg) | Same, but you're out of horizontal space — a nav bar, a table cell, a mobile footer | `ote-feed-icon.svg` |
| ![OTE: supporter](ote-supporter.svg) | You back the spec, consume it, or plan to adopt it | `ote-supporter.svg` |

## The feed badge: link it to your feed, not to opentechevents.org

This is the one meant to be clicked, the same way an RSS icon is: it must take the visitor
straight to something that resolves — your OTE feed itself, `https://your-domain/events.json`,
not a page about OTE. Point it anywhere else and it stops working as a subscribe button.

Markdown:

```markdown
[![OTE feed](https://opentechevents.org/badge/ote-feed.svg)](https://your-domain.example/events.json)
```

HTML:

```html
<a href="https://your-domain.example/events.json"><img src="https://opentechevents.org/badge/ote-feed.svg" alt="OTE feed"></a>
```

Tight on space (nav bar, table row, mobile footer)? Use the icon-only variant instead, same rule
for the link:

```html
<a href="https://your-domain.example/events.json"><img src="https://opentechevents.org/badge/ote-feed-icon.svg" alt="OTE feed" width="20" height="20"></a>
```

Nobody checks whether the link is real before you publish it. If you wear the badge, please make
sure it points at a feed that actually resolves — a badge that lies is worse than no badge.

## The supporter badge

This one is a merit badge, not a subscribe button: it links to the project, not to a feed you
publish.

Markdown:

```markdown
[![OTE: supporter](https://opentechevents.org/badge/ote-supporter.svg)](https://opentechevents.org#support)
```

HTML:

```html
<a href="https://opentechevents.org#support"><img src="https://opentechevents.org/badge/ote-supporter.svg" alt="OTE: supporter"></a>
```

## Other languages

Spanish wording exists: `ote-feed.es.svg` ("feed OTE") and `ote-supporter.es.svg` ("apoya OTE"),
same files and same linking rules as above — just swap the filename. `feed` is left untranslated
on purpose: it's what Spanish-speaking technical communities actually say, and `canal` or `fuente`
would be less recognisable, not more.

```markdown
[![feed OTE](https://opentechevents.org/badge/ote-feed.es.svg)](https://your-domain.example/events.json)
[![apoya OTE](https://opentechevents.org/badge/ote-supporter.es.svg)](https://opentechevents.org#support)
```

Want another language? Open an issue with the wording — the files are ~10-20 lines each.
