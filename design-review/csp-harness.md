# CSP harness

The policy and document headers proposed in `design-review/BRIEF-AUDIT.md` §4.2,
injected into documents by the harness as §4.3 describes. Nothing is shipped:
the server's responses are unchanged, and the Lighthouse baselines never see
these headers.

- Source: preview. Framework: next 15.5.25 (local node_modules). Routes from the local `.next/server/app` (BUILD_ID `ZfBBRTpMGG-jIqCSRk4_T`).
- Engines: chromium 151.0.7922.34 (measured).
- Matrix: 31 routes x 2 viewports x 2 motion modes x 1 measured engine(s) x 1 disposition(s) = 124 runs.
- Monday form: stubbed on every run except `/contact 1440x900 no-preference chromium report`, which loads it for real.
- Positive controls: an img and an iframe to `https://csp-probe.invalid/` on every page, after the embed checks.
- Transport retries (a dropped connection to the server, retried by the harness): none.
- Embed documents that failed at the network: none. Frames reloaded once after such a failure: none.
- Generated: 2026-09-19T12:58:06.933Z.

**Verdict: PASS**. 124 of 124 runs clean; 0 failure line(s).

## The injected policy

```text
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; frame-src https://forms.monday.com https://www.google.com; worker-src 'none'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
```

Report disposition: `Content-Security-Policy-Report-Only`. Enforce disposition: `Content-Security-Policy`.
Also on every document: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self "https://www.google.com")`, `cross-origin-opener-policy: same-origin`. `x-content-type-options: nosniff` is also added to same-origin scripts and stylesheets.

The server already sent a policy on 124 run(s); the harness replaced it, so these runs measure the proposed policy alone.

## Failures

None.

## Runs

| Route | Viewport | Motion | Engine | Disposition | Status | Unexpected violations | Controls (img / iframe) | Embeds navigated | Result |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/about` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/about` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/about` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/about` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/contact` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub), maps 3/3 | ok |
| `/contact` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub), maps 3/3 | ok |
| `/contact` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub), maps 3/3 | ok |
| `/contact` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | monday 1/1 (real), maps 3/3 | ok |
| `/direction/a` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/a` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/a` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/a` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/b` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/b` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/b` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/b` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/c` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/c` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/c` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/c` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/d` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/d` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/d` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/direction/d` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/dinner-celebration` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/dinner-celebration` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/dinner-celebration` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/dinner-celebration` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-celebration` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-celebration` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-celebration` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-celebration` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-drone` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-drone` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-drone` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/party-drone` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/sunset-by-the-pool` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/sunset-by-the-pool` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/sunset-by-the-pool` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/sunset-by-the-pool` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/villa-party` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/villa-party` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/villa-party` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/villa-party` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-aerial` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-aerial` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-aerial` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-aerial` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-olive` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-olive` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-olive` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/events/wedding-rituals-olive` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/services` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/services` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/services` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/services` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/chapter` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/chapter` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/chapter` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/chapter` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/plate` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/plate` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/plate` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/arrival/plate` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/grade` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/grade` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/grade` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/grade` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/hero` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/hero` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/hero` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/hero` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/venue` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/venue` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/venue` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/aegean/venue` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/backlog` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/backlog` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/backlog` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/backlog` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/enquiry` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub) | ok |
| `/study/enquiry` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub) | ok |
| `/study/enquiry` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub) | ok |
| `/study/enquiry` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | monday 1/1 (stub) | ok |
| `/study/motion` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/motion` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/motion` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/study/motion` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/venues` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/venues` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/venues` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/venues` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/venues/mountain-escape` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/mountain-escape` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/mountain-escape` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/mountain-escape` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/olive-stories` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/olive-stories` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/olive-stories` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/olive-stories` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/thalasses` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/thalasses` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/thalasses` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/venues/thalasses` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | maps 1/1 | ok |
| `/wedding-guide` | 390x844 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/wedding-guide` | 390x844 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/wedding-guide` | 1440x900 | reduce | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/wedding-guide` | 1440x900 | no-preference | chromium | report | 200 | 0 | yes / yes | none | ok |
| `/no-such-page` | 390x844 | reduce | chromium | report | 404 | 0 | yes / yes | none | ok |
| `/no-such-page` | 390x844 | no-preference | chromium | report | 404 | 0 | yes / yes | none | ok |
| `/no-such-page` | 1440x900 | reduce | chromium | report | 404 | 0 | yes / yes | none | ok |
| `/no-such-page` | 1440x900 | no-preference | chromium | report | 404 | 0 | yes / yes | none | ok |

## Unexpected violations, by directive

None. Every violation recorded came from the two positive-control probes.

## Embeds

Expected = facades in the served HTML; mounted = iframes present at the check; pressed = facades the scroll did not mount and the harness pressed; navigated = child frames that navigated to the origin.

| Route | Viewport | Motion | Engine | Disposition | Embed | Origin | Expected | Mounted | Pressed | Navigated | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/contact` | 390x844 | reduce | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/contact` | 390x844 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 3 | 3 | 0 | 3 | ok |
| `/contact` | 390x844 | no-preference | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/contact` | 390x844 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 3 | 3 | 0 | 3 | ok |
| `/contact` | 1440x900 | reduce | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/contact` | 1440x900 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 3 | 3 | 0 | 3 | ok |
| `/contact` | 1440x900 | no-preference | chromium | report | monday (real) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/contact` | 1440x900 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 3 | 3 | 0 | 3 | ok |
| `/study/enquiry` | 390x844 | reduce | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/study/enquiry` | 390x844 | no-preference | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/study/enquiry` | 1440x900 | reduce | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/study/enquiry` | 1440x900 | no-preference | chromium | report | monday (stub) | https://forms.monday.com/forms/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/mountain-escape` | 390x844 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/mountain-escape` | 390x844 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/mountain-escape` | 1440x900 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/mountain-escape` | 1440x900 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/olive-stories` | 390x844 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/olive-stories` | 390x844 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/olive-stories` | 1440x900 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/olive-stories` | 1440x900 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/thalasses` | 390x844 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/thalasses` | 390x844 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/thalasses` | 1440x900 | reduce | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |
| `/venues/thalasses` | 1440x900 | no-preference | chromium | report | maps | https://www.google.com/maps/embed | 1 | 1 | 0 | 1 | ok |

Child-frame destinations seen across all runs (origin and at most two path segments): `https://forms.monday.com/forms/embed`, `https://www.google.com/maps/embed`.

## Console notices (recorded, not failures)

None.

CSP messages from embedded documents' own policies (not the policy under test): 0. Uncaught page errors across all runs (not failures): 0.

Raw output: `design-review/csp-harness.json`.
