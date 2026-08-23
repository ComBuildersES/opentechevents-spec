# Findings — Platforms

Platforms that **create and manage** events or calls for papers (CFP). See the shared template in [../README.md](../README.md).

## Meetup

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | Meetup is for organising group events. It allows creating simple events and, for Pro customers, managing calls for papers. | Meetup help article[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |
| **Required fields (form)** | Creating an event from the web interface requires: title (max. 80 characters), start date and time, duration, description and location (physical or online). Pro accounts add speaker information[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). | Meetup documentation[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |
| **Optional fields** | Featured image, group topics, additional hosts, attendance fees, recurrence, waiting list and questions for attendees[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title). |  |
| **API/formats** | Meetup's API uses GraphQL. The `createEvent` mutation requires `groupUrlname`, `title`, `description`, `startDateTime`, `venueId`, `duration` and `publishStatus`[meetup.com](https://www.meetup.com/graphql/guide/#graphQl-guide#:~:text=mutation%28%24input%3A%20CreateEventInput%21%29%20,). It allows creating, editing, searching and announcing events[help.meetup.com](https://help.meetup.com/hc/en-us/articles/41455194927373-What-can-I-achieve-through-Meetup-s-API-and-what-are-its-limitations#:~:text=Meetup%E2%80%99s%20API%20allows%20Pro%20customers,and%20keep%20the%20platform%20secure). |  |
| **How you contribute** | Through the web interface, or through the GraphQL API if you have credentials (mostly for Pro customers). |  |
| **Standard consumption** | Meetup offers no standardised exporter, but the API returns JSON objects through GraphQL. |  |
| **Aggregator?** | No, it is an event platform of its own. |  |
| **Relevant URLs** | Meetup help — field descriptions[help.meetup.com](https://help.meetup.com/hc/en-us/articles/39790436736525-Creating-an-event#:~:text=Title); [GraphQL documentation](https://www.meetup.com/meetup_api/) — creation mutation[meetup.com](https://www.meetup.com/graphql/guide/#graphQl-guide#:~:text=mutation%28%24input%3A%20CreateEventInput%21%29%20,). |  |

## Sessionize

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A platform for managing talks and agendas for conferences. It handles calls for speakers (CFP), sessions and speakers. | Sessionize guide[sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page). |
| **Required fields** | A call for speakers requires, by default: session title, description, speaker name, email address, tagline and bio[sessionize.com](https://sessionize.com/playbook/fields-explained#:~:text=Some%20Submission%20fields%20are%20predefined,information%20would%20make%20little%20sense). Adding sessions manually requires the session title, the owner and the speaker's details[sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page). |  |
| **Optional fields** | Organisers can add custom fields and mark them as required or optional[sessionize.com](https://sessionize.com/playbook/fields-explained#:~:text=Some%20Submission%20fields%20are%20predefined,information%20would%20make%20little%20sense). |  |
| **API/formats** | Sessionize offers a read-only API returning sessions, speakers and rooms in JSON or XML; it can also export to iCalendar. Endpoints are generated from the event's page and usually require no authentication[sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |
| **How you contribute** | Sessions come in through CFP forms or are added by hand. There is no public API for creating events; the platform focuses on collecting sessions and speakers. |  |
| **Standard consumption** | JSON, XML and iCalendar[sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |
| **Aggregator?** | No, it is a conference management platform. |  |
| **Relevant URLs** | Guide to adding sessions [sessionize.com](https://sessionize.com/playbook/adding-sessions-and-speakers#:~:text=Using%20a%20Call%20for%20Speakers,page); Sessionize API [sessionize.com](https://sessionize.com/playbook/api#:~:text=What%20formats%20are%20available%3F). |  |

## Luma

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A platform aimed at online and hybrid events. It allows creating events and managing registrations and communications. It offers an open API. |  |
| **Required fields (form)** | Luma's form asks for: title, date and time (with time zone), event type (in person, online or hybrid), cover image, physical location, event description, topic/area, associated calendar and visibility (public/private)[help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events). |  |
| **Optional fields** | Registration question setup, co-hosts, pricing and capacity, waiting list and confirmation email[help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events). |  |
| **API/formats** | Luma's `POST /v1/event/create` endpoint requires `name`, `start_at` and `timezone`; everything else (end, Markdown description, cover URL, maximum capacity, address, meeting link, etc.) is optional[docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). Authentication is via an `x-luma-api-key` header[docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). |  |
| **How you contribute** | Events can be created through the web interface or through the official API. |  |
| **Standard consumption** | The API returns JSON; the platform also exposes events over iCalendar and webhooks. |  |
| **Aggregator?** | No. |  |
| **Relevant URLs** | Guide to creating events on Luma [help.luma.com](https://help.luma.com/p/creating-an-event#:~:text=Event%20Title%20Enter%20a%20clear%2C,guests%20see%20when%20browsing%20events); API specification [docs.luma.com](https://docs.luma.com/reference/post_v1-event-create.md). |  |

## joind.in

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A community platform for technical events and talks. It allows publishing events and talks and collecting feedback. |  |
| **Required fields (API)** | Submitting an event through the API requires: `name`, `description`, `location`, `start_date`, `end_date`, `tz_continent` and `tz_place`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **Optional fields** | `href` (event URL), `cfp_url`, `cfp_start_date`, `cfp_end_date` and `tags[]`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=You%20may%20also%20add%20any,all%20of%20these%20additional%20fields). |  |
| **Event format (response)** | The API returns JSON with fields such as `name`, `url_friendly_name`, dates, `description`, `stub`, `href`, `attendee_count`, `event_comments_count`, `tracks_count`, `talks_count`, `icon` and several URIs (comments, talks, tracks, attendees, etc.)[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). In _verbose_ mode it adds `latitude`, `longitude`, `tz_continent`, `tz_place`, `location`, `hashtag`, CFP data and `tags`[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **How you contribute** | Through the authenticated REST API; events submitted by non-admin users stay pending approval[docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |
| **Standard consumption** | JSON (with the option of more fields via `verbose=yes`). |  |
| **Aggregator?** | No, but it is a data source for others. |  |
| **Relevant URLs** | [API documentation (events)](https://docs.joind.in/joindin-api/events.html) [docs.joind.in](https://docs.joind.in/joindin-api/events.html#:~:text=the%20images%20associated%20with%20this,See%20also%20%202). |  |

## Papercall.io

| Aspect | Information | Sources |
| --- | --- | --- |
| **What it supports** | A platform dedicated to managing calls for proposals. |  |
| **Required fields** | Papercall's guide states that creating a CFP means choosing an event name, uploading a logo and entering the call's details (opening and closing dates). It also offers an option to anonymise submissions and a field for whether travel expenses are covered[papercall.zendesk.com](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals#:~:text=Creating%20a%20New%20Call%20for,Proposals). |  |
| **Optional fields** | Additional event details can be added and visibility configured; the public documentation offers no complete field listing. |  |
| **How you contribute** | Only through the web platform; there is no public API for creating events. |  |
| **Standard consumption** | Events are consumed from the website; there is no official export, although some services extract data by scraping. |  |
| **Aggregator?** | No, but it is an important CFP source for several aggregators. |  |
| **Relevant URLs** | ["Creating a New Call for Proposals"](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals) [papercall.zendesk.com](https://papercall.zendesk.com/hc/en-us/articles/216407857-Creating-a-New-Call-for-Proposals#:~:text=Creating%20a%20New%20Call%20for,Proposals). |  |
