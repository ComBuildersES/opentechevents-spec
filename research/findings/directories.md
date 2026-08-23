# Findings — Directories and aggregators

Projects that **list/collect** events or CFPs (they are not the originating platform). See the shared template in [../README.md](../README.md).

## EventosWiki (eventoswiki)

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A GitHub repository collecting Spanish-speaking tech events; contributions are made through issues. |  |
| **Required fields** | The YAML template for requesting a new event has required fields: `event-name`, `event-website`, `short-description`, `start-date`, `end-date` and `location`[raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |
| **Optional fields** | `cover-image`, `social-networks` and `details` for extra information[raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |
| **How you contribute** | By hand: you open an issue with the template filled in and the maintainers review it. No API is mentioned. |  |
| **Standard consumption** | No export is provided; the value is in the website generated from GitHub. |  |
| **Aggregator?** | No. |  |
| **Relevant URLs** | [Event request template](https://github.com/achamorro-dev/eventoswiki/blob/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml) [raw.githubusercontent.com](https://raw.githubusercontent.com/achamorro-dev/eventoswiki/main/.github/ISSUE_TEMPLATE/solicitud-nuevo-evento.yaml#:~:text=name%3A%20Solicitud%20nuevo%20evento%20description%3A,como%20contenido%20del%20evento%20validations). |  |

## Event Garden

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A Spanish-language community directory for tech events and conferences. |  |
| **Required fields** | The event submission form includes: title (required), Markdown description, languages (Spanish/English), whether it is free or paid, start and end dates with a time picker, location (remote or country/city), main tags (at least one must be chosen) and an optional contact email[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **Optional fields** | A link to the event's main page, an image (uploaded or by URL), custom tags and a contact email[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **How you contribute** | Through a web form; the page states that the team reviews every submission before publishing it[eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |
| **Standard consumption** | No public API was found; the directory shows the data on the website. |  |
| **Aggregator?** | No. |  |
| **Relevant URLs** | [New event form](https://eventgarden.io/new-event) [eventgarden.io](https://eventgarden.io/new-event#:~:text=Quieres%20compartir%20algo%20con%20la,ten%20en%20cuenta%20algunas%20consideraciones). |  |

## developers.events (Scraly/Developers‑Conferences‑Agenda)

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A collaborative repository listing community-focused conferences and their calls for papers. |  |
| **Required fields and format** | Conferences are added to `README.md` using the format `* date: [Conference name](URL) – City, state (Country)`[raw.githubusercontent.com](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/master/CONTRIBUTING.md#:~:text=format%3A%20%60%60%60%20,Remove%20any%20trailing). The `METADATA.csv` file can add the attendee count (`YYYY-MM-DD-Conference Name,attendees:NUMBER`)[raw.githubusercontent.com](https://raw.githubusercontent.com/scraly/developers-conferences-agenda/master/CONTRIBUTING.md#:~:text=format%3A%20%60%60%60%20,Remove%20any%20trailing). |  |
| **Events as JSON** | The site generates `all-events.json`, where each event carries: `name`, `date` (an array of start/end timestamps), `hyperlink`, `location`, `city`, `country`, `misc`, a `cfp` object (with URL and dates), `closedCaptions`, `scholarship`, `sponsoringBadge`, `status` and `tags`[developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta). The `all-cfps.json` file lists calls for papers with: `link`, `until` (closing string), `untilDate` (timestamp) and a `conf` object with name, dates, URL and location[developers.events](https://developers.events/all-cfps.json#:~:text=%5B%7B%22link%22%3A%22https%3A%2F%2Fhashiconfeu.hashicorp.com%2F%23submit,31). |  |
| **How you contribute** | Through a pull request following the rules in `CONTRIBUTING.md`; the event must be a community conference and must have a CFP. |  |
| **Standard consumption** | JSON (all‑events.json and all‑cfps.json), plus the README. |  |
| **Aggregator?** | No, although the data can be used by other projects (CFP Tracker, CallingAllPapers). |  |
| **Relevant URLs** | [Directory on GitHub](https://github.com/scraly/developers-conferences-agenda) and [all-events.json](https://developers.events/all-events.json) [developers.events](https://developers.events/all-events.json#:~:text=%5B%7B%22name%22%3A%22Craft%20Conf%22%2C%22date%22%3A%5B1493078400000%2C1493337600000%5D%2C%22hyperlink%22%3A%22https%3A%2F%2Fcraft,ta). |  |

## CFP Tracker (bendechrai/cfps)

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A web app that lets speakers track CFPs and their submitted proposals. |  |
| **Data sources** | Aggregates CFPs from **Codosaurus**, Confs.tech, developers.events, joind.in, Leon Adato and Papercall.io[raw.githubusercontent.com](https://raw.githubusercontent.com/bendechrai/cfps/main/README.md#:~:text=desktop%20and%20mobile%20,0%20or%20later). |  |
| **Required fields** | The public documentation does not detail the format; the project is an aggregator consuming the feeds of the sources above. |  |
| **How you contribute** | No forms are offered; the data comes from other sources. |  |
| **Standard consumption** | It shows the information in a web interface and lets you keep submission state locally (in the browser). |  |
| **Aggregator?** | Yes; it aggregates several CFP sources[raw.githubusercontent.com](https://raw.githubusercontent.com/bendechrai/cfps/main/README.md#:~:text=desktop%20and%20mobile%20,0%20or%20later). |  |
| **Relevant URLs** | [CFP Tracker repository](https://github.com/bendechrai/cfps) and [website](https://cfp.bendechr.ai/). |  |

## Confs.tech

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | An open-source directory of tech conferences. |  |
| **Required fields (form)** | The web form for adding a conference asks for: language, topics (one or more), conference name (without the year), URL, start and end dates, event type (in person/online/hybrid), country, call for papers URL (if any), CFP closing date, code of conduct URL, a checkbox for sign language interpretation or captions, social accounts (Bluesky, Mastodon, Twitter) and a GitHub username for contact. _(Source: a screenshot of the submission form; a verifiable URL is still pending.)_ |  |
| **Optional fields** | Some fields such as social accounts, code of conduct and CFP dates can be left empty. |  |
| **Data as JSON** | In the repository, each conference is stored in JSON files with the fields `name`, `url`, `startDate`, `endDate`, `city`, `country`, `cfpUrl`, `cfpEndDate`, `bluesky`, `mastodon`, `twitter`[raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the). |  |
| **How you contribute** | Through the web form (which opens a pull request) or directly by PR on GitHub. |  |
| **Standard consumption** | JSON (inside the repository). |  |
| **Aggregator?** | No, although it is used by other aggregators. |  |
| **Relevant URLs** | The submission form, [repository README](https://github.com/tech-conferences/confs.tech) [raw.githubusercontent.com](https://raw.githubusercontent.com/tech-conferences/confs.tech/main/README.md#:~:text=pull%20requests,contributing%3F%20Tag%20any%20of%20the). |  |

## CallingAllPapers

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A site that collects open calls for papers and posts reminders on social media. |  |
| **Data sources** | Extracts information by crawling **joind.in**, Confs.tech, Papercall.io and Sessionize[callingallpapers.com](https://callingallpapers.com/#:~:text=To%20retrieve%20the%20list%20we,basis%20to%20find%20new%20CfPs). |  |
| **Available fields (API)** | Its public API returns a list of CFPs with: `name`, `uri` (submission link), `dateCfpStart`, `dateCfpEnd`, `location`, `latitude`, `longitude`, `description`, `dateEventStart`, `dateEventEnd`, `iconUri`, `eventUri`, `timezone`, `tags`, `sources`, `lastChange` and `_rel`[api.callingallpapers.com](https://api.callingallpapers.com/v1/cfp#:~:text=CFP%20%7BCall%20For%20Papers%7D%20,Edi%C3%A7%C3%A3o%20v21). |  |
| **How you contribute** | It accepts no manual submissions; to appear, the CFP has to be listed on one of the supported sources[callingallpapers.com](https://callingallpapers.com/#:~:text=To%20retrieve%20the%20list%20we,basis%20to%20find%20new%20CfPs). |  |
| **Standard consumption** | JSON through the public API. The site also offers an iCal feed. |  |
| **Aggregator?** | Yes; it unifies data from several platforms. |  |
| **Relevant URLs** | [CallingAllPapers API](https://api.callingallpapers.com/v1/cfp) [api.callingallpapers.com](https://api.callingallpapers.com/v1/cfp#:~:text=CFP%20%7BCall%20For%20Papers%7D%20,Edi%C3%A7%C3%A3o%20v21). |  |

## TechConf.Directory

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A repository storing conferences and speakers as YAML files. |  |
| **Conference fields** | Each YAML file has `title`, `website`, `tags`, and an `events` dictionary where each year carries `dates` (`start` and `end`), `format` (in person or online) and `location` (country and city). There may also be a `socials` section with Bluesky, Fediverse and other accounts, plus a tag list[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux). |  |
| **Speaker fields** | Speaker files carry `name`, `website`, `socials` sections with identities (Bluesky DID, YouTube, LinkedIn, etc.) and `location` (country and city)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/speakers/barret-blake.yaml#:~:text=name%3A%20Barret%20Blake%20website%3A%20barretblake,location%3A%20country%3A%20US%20city%3A%20Columbus). |  |
| **How you contribute** | Issues are accepted requesting the inclusion of conferences or speakers; the maintainers process the requests[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/README.md#:~:text=starting%20a%20local%20development%20server,https%3A%2F%2Fgithub.com%2FDeclanChidlow%2Ftechco). |  |
| **Standard consumption** | The data lives as YAML in the repository; no APIs are offered yet. |  |
| **Aggregator?** | No, but it can be consumed by other projects. |  |
| **Relevant URLs** | [techconf.directory repository](https://github.com/DeclanChidlow/techconf.directory) and its YAML files (e.g. `afup‑day‑bordeaux.yaml`)[raw.githubusercontent.com](https://raw.githubusercontent.com/DeclanChidlow/techconf.directory/main/data/conferences/afup-day-bordeaux.yaml#:~:text=title%3A%20AFUP%20Day%20Bordeaux%20website%3A,location%3A%20country%3A%20FR%20city%3A%20Bordeaux). |  |

## dev.events

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A portal listing tech conferences, meetups and hackathons. |  |
| **How you contribute** | An event can be added through the _new event_ button; after the form is submitted, the team reviews and approves it. For events to be added automatically, the site detects structured metadata on the event's own site using JSON‑LD[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |
| **Required fields** | Not all form fields are shown publicly, but the FAQ states that an event must include a date, a location, a registration link and some speakers so legitimacy can be checked[dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |
| **Standard consumption** | dev.events offers an RSS feed with the latest hundred conferences, categorised by tags[dev.events](https://dev.events/about#:~:text=subscribe%20to%20the%20RSS%20feed%2C,For%20example%2C%20%203%20this). |  |
| **Aggregator?** | Yes; roughly 20% of its events come from automatic sources and 80% from manual contributions[dev.events](https://dev.events/about#:~:text=The%20project%20is%20coded%20and,organizers%2C%20tech%20community%2C%20and%20volunteers). |  |
| **Relevant URLs** | [dev.events FAQ](https://dev.events/about) [dev.events](https://dev.events/about#:~:text=You%20can%20submit%20an%20event,it%20meets%20the%20eligibility%20criteria). |  |

## Developer Events.org

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A TechForge event directory for listing conferences and trade shows. |  |
| **Required fields** | The submission form asks for the sender's first and last name, email address, phone number, event title, start and end dates (MM/DD/YYYY), event description, registration URL, social links (Twitter, Facebook, Instagram, YouTube, LinkedIn), event logo, photos (up to 50), and the full location (address, city, state, postcode, country)[developerevents.org](https://www.developerevents.org/submit-event/#:~:text=Name). |  |
| **How you contribute** | By hand through a web form; the data is reviewed before publication. |  |
| **Standard consumption** | The information is shown on the website; no API is mentioned. |  |
| **Aggregator?** | No. |  |
| **Relevant URLs** | [Developer Events submission form](https://www.developerevents.org/submit-event/) [developerevents.org](https://www.developerevents.org/submit-event/#:~:text=Name). |  |

## Other directories and projects to research

These came up during the research and are still to be analysed in detail (status 🔲 in the inventory):

- **Sesamers** — a commercial platform listing startup/tech events. Subscribing allows filtering by industry; its fields and API would need reviewing.
- **Vendelu/Vendelux** — a directory of marketing and technology conferences. It may offer insight into sponsorship fields.
- **LegalTechConference.com** — specialised in legal conferences. It could contribute sector-specific fields (CLE credits, regulation).
- **StartUpPeople/FinDev Gateway** — they offer event forms with financial fields.
- **iotevents.org / marketing-events.net** — TechForge topic portals similar to Developer Events.org.
