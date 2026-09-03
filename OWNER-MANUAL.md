# Owner's manual

This is your site. This document is how you change it without breaking it, and
what stops you breaking it if you try.

It assumes you are not a developer. Where something genuinely needs one, it says
so plainly instead of pretending otherwise.

**The one rule.** After any change, run this and wait for green:

```bash
npm run qa
```

Eleven checks. If it says `the gate is green`, the change is safe. If it names a
failure, the change is not on the site yet and nothing is broken — fix what it
names, or undo. It is very hard to publish something wrong past this.

---

## Contents

1. [Where the words and pictures live](#1-where-the-words-and-pictures-live)
2. [Editing a venue](#2-editing-a-venue)
3. [Changing a capacity, and the numbers that follow it](#3-changing-a-capacity-and-the-numbers-that-follow-it)
4. [Retiring a venue](#4-retiring-a-venue)
5. [Bringing a venue back — the Villa Aetos procedure](#5-bringing-a-venue-back--the-villa-aetos-procedure)
6. [Adding a gallery of photographs](#6-adding-a-gallery-of-photographs)
7. [Replacing the wedding brochure](#7-replacing-the-wedding-brochure)
8. [The three sections waiting on you](#8-the-three-sections-waiting-on-you)
9. [What protects you](#9-what-protects-you)
10. [How the site gets published](#10-how-the-site-gets-published)
11. [Γρήγορος οδηγός](#γρήγορος-οδηγός)

---

## 1. Where the words and pictures live

Almost everything you would want to change is in one folder: **`content/`**.

| File | What is in it |
| --- | --- |
| `content/venues.ts` | The three venues — names, descriptions, capacities, galleries, maps. |
| `content/events.ts` | The seven Signature Events galleries. |
| `content/services.ts` | The services page. |
| `content/journey.ts` | The step-by-step wedding journey. |
| `content/team.ts` | The team. |
| `content/site.ts` | Phone, WhatsApp, email, the menu, the homepage hero. |
| `content/pending.ts` | Testimonials, FAQ and statistics — empty until you send them. See §8. |

They look like code, but the parts you edit are just text in quotation marks.
Change what is **between the quote marks**; leave the quote marks, commas and
brackets exactly where they are. That is the whole trick.

Photographs live in **`public/media/`**. The brochure is at
`public/assets/files/Weddingbrochure.pdf`.

**Never edit anything in `src/`.** That is the machinery. If a change seems to
need it, it needs a developer.

---

## 2. Editing a venue

Open `content/venues.ts`. Each venue is a block that starts with `slug:`. To
change Thalasses' description, find `slug: "thalasses"` and edit the text under
`body:`.

```ts
    body: [
      "White walls, blue water, and a pool fifty metres from the sea.",
      "The second paragraph is a second line in the list.",
    ],
```

- Each `"…"` line is one paragraph on the page.
- Add a paragraph by adding a line — remember the comma at the end.
- Delete one by deleting its whole line.

`standfirst` is the single line under the venue's name. `advantages` is the
"Perfect for:" list. `name` is the venue's title everywhere on the site.

**A word of warning about `slug`.** It is the venue's web address —
`slug: "thalasses"` is `domisignature.com/venues/thalasses`. Changing it breaks
every link anyone has ever shared to that venue. Don't, unless a developer sets
up a redirect at the same time.

Then `npm run qa`, and wait for green.

---

## 3. Changing a capacity, and the numbers that follow it

Capacity is one line per venue:

```ts
    capacity: "How many people can fit: up to 300",
```

Two formats, and only two:

- `"How many people can fit: up to 300"` → the site shows **Up to 300 guests**
- `"How many people can fit: up to 200-300"` → the site shows **200–300 guests**

**The homepage numbers follow automatically. This matters.** The two figures in
the arrival sequence are not typed anywhere — they are worked out from this file
every time the site is built:

- **Venue count** — how many venues are in `content/venues.ts`. Three venues, so
  it reads `03`.
- **Guest figure** — the *largest* capacity of any venue. Thalasses holds 300, so
  it reads `Up to 300 guests`.

So if you raise Thalasses to 350, the homepage says `Up to 350 guests` on its
own. If you add a fourth venue, the homepage says `04` on its own. You never
touch those numbers, and you must never try to — there is an audit whose entire
job is to fail if someone types a figure by hand instead of deriving it.

This also cuts the other way, and it is worth knowing so it does not look like a
bug: adding a *small* venue does not change the guest figure. A 30-guest venue
alongside a 300-guest one leaves the headline at 300, because it is a maximum.
That is correct.

---

## 4. Retiring a venue

Deleting the venue's block from `content/venues.ts` is only the first of four
steps. Do all four or you leave broken links behind.

1. **Delete the block** in `content/venues.ts`, from its `{` to its matching
   `},`. Copy it somewhere safe first — §5 is much easier if you kept it.
2. **Add a redirect** so its old address still works, in `next.config.ts`:
   ```ts
   { source: "/venues/the-slug", destination: "/venues", permanent: true },
   ```
   Without this, anyone with the old link gets a "page not found".
3. **Repoint the old anchor**, if that venue was on the original one-page site.
   In `src/components/layout/LegacyAnchorRedirect.tsx`, send its `#portfolioModal`
   entry to `/venues`.
4. **`npm run contact-sheets`**, then `npm run qa`.

Steps 2 and 3 are developer-shaped. If that is not you, this is the point to
ask — the site will look fine to you and be quietly broken for anyone arriving
from Google.

---

## 5. Bringing a venue back — the Villa Aetos procedure

Villa Aetos was withdrawn. Bringing it back was rehearsed end to end on a
throwaway branch, and **it is not one step — it is five.** Four of them are easy
to miss, because after only the first one the site builds cleanly, passes the
type check, lists the venue on `/venues`, and puts it in the sitemap — while the
venue's own page is unreachable.

This is the tested procedure.

**1. Put the venue's data back.** Its block still exists in the project's
history. A developer restores it with:

```bash
git show 921d48f~1:content/venues.ts
```

Copy the `villa-aetos` block from that output into `content/venues.ts`, before
the closing `];`.

**2. Remove its redirect from `next.config.ts`.** Delete this line:

```ts
{ source: "/venues/villa-aetos", destination: "/venues", permanent: true },
```

**This is the step that catches people.** Leave it and `/venues/villa-aetos`
keeps bouncing to the venue list, so the page exists, is linked from the index,
is advertised in the sitemap, and can never actually be opened. In the rehearsal
it returned `308 → /venues` until this line went.

**3. Point the old anchor back at it.** In
`src/components/layout/LegacyAnchorRedirect.tsx`:

```ts
"#portfolioModal4": "/venues/villa-aetos",
```

**4. Regenerate the contact sheets** — with no argument, which rebuilds all of
them. Passing a single name replaces the whole set with just that one:

```bash
npm run contact-sheets
```

**5. Update the redirect map test.** `npm run qa` will fail until
`scripts/launch-check.mjs` stops expecting `/venues/villa-aetos` to redirect and
`#portfolioModal4` to land on `/venues`. That failure is the system working —
it is telling you the map on file no longer matches the site.

**What happens on its own, correctly:** the homepage venue count goes to `04`.
The guest figure stays `Up to 300` — Villa Aetos holds far fewer, and the figure
is a maximum. The venue page, its row on `/venues`, its map and its related
cards all come back with no further work.

Rehearsed on `2026-08-19`; the branch was deleted afterwards and nothing shipped.
Screenshots of the restored page and index are in `design-review/run3/`.

---

## 6. Adding a gallery of photographs

There is a tool for this. It does the machine's half and refuses to do yours.

```bash
npm run ingest:gallery -- "C:/path/to/the/photos" --slug olive-stories-2027
```

It will:

- resize every photograph for the web and put it in `public/media/`,
- **strip all hidden data from the files** — holiday photographs carry the GPS
  coordinates of where they were taken, and publishing a private client's villa
  location because it was hidden inside a JPEG is the kind of mistake nobody
  notices until it matters,
- build a **numbered contact sheet** in `design-review/ingest/`,
- write a text file with blanks for you to fill in.

Then the part only you can do. **Open the contact sheet and look at the
photographs.** Fill in the gallery title and one line describing each frame —
what is actually in it, for someone who cannot see it. Not what the filename
says. Paste the finished block into `content/venues.ts` or `content/events.ts`.

The blanks are marked `TODO(`. While a single one is left, `npm run qa` fails and
so does the automatic check on publishing. That is deliberate: an unfilled title
puts a placeholder on the site, and unfilled descriptions leave a blind visitor
with twenty-four photographs announced as "image 3 of 24".

---

## 7. Replacing the wedding brochure

Replace the file, keep the name:

```
public/assets/files/Weddingbrochure.pdf
```

Every link to it — on the site, and every one shared since the old site — points
at that exact address. Keep the filename and they all keep working. Rename it and
they all break silently. Then `npm run qa`.

---

## 8. The three sections waiting on you

Three parts of the site are **built, styled and wired up**, and render nothing
because they have no content. They are empty because inventing them was
forbidden, and rightly. They appear the moment you supply real material — no
design work needed.

They live in `content/pending.ts`, and `CONTENT-NEEDED.md` says exactly what to
send:

| Section | What is needed |
| --- | --- |
| **Testimonials** | Real client quotes with a name (or initials). Three is a strong start; five to eight is ideal. The biggest single gap on the site — a luxury wedding brand with no client voice. |
| **FAQ** | Real answers, particularly the legal paperwork for marrying in Crete. |
| **Statistics** | Verified figures — weddings planned, years active, nationalities hosted. Verified, meaning you can stand behind them. |

Add them to the lists in `content/pending.ts` and the sections switch on.

---

## 9. What protects you

Eleven automatic checks run on your machine with `npm run qa`, and again on every
publish. `QA-TOOLKIT.md` has the full detail; in plain words:

| Check | What it stops |
| --- | --- |
| **claims** | Any number on the site that isn't worked out from `content/`. This is what enforces "no invented facts" — nobody can type "3 venues" and let it drift out of date. |
| **prose** | Placeholder text, lorem ipsum, doubled spaces, the wrong kind of quotation mark. |
| **media** | A photograph or video referenced but missing. Catches a renamed file before a visitor finds the gap. |
| **assets** | Anything the finished pages ask for that doesn't come back. |
| **manifest** | **The privacy gate.** Seven photographs were deliberately withheld from the public code — identifiable people, a licence plate, a frame you pulled. This fails if any of them is ever referenced again, so a withheld photograph cannot quietly return through an innocent edit. |
| **ingest** | A gallery published with its title or descriptions unfilled (§6). |
| **a11y** | Accessibility faults. The standard here is zero, not "few". |
| **launch** | The search-engine settings, the sitemap, and all 21 old addresses from the previous site still landing in the right place. |
| **graffiti**, **typecheck**, **lint** | A specific photograph staying inside its dark band, and the code being valid. |

**What is withheld, and why.** Seven photographs are not in the public code:
frames showing identifiable people who did not agree to appear in a public code
repository, a readable licence plate, and the frames you asked to be pulled.
The raw camera files are also excluded — 135 MB of masters that nothing on the
site needs. Every reason is recorded per file in
`design-review/publish-manifest.md`. This is checked by exact filename against
the published code before every publish.

---

## 10. How the site gets published

There are three different things, and it is worth keeping them straight.

**A preview.** Every change produces a preview address ending in
`.vercel.app`. It is the real site, working, for you to look at. It is invisible
to Google by design.

**The sealed address.** `domisignature-redesign.vercel.app` also exists and also
works. It is deliberately hidden from Google. This was once a genuine problem —
it was briefly visible to search engines, which risked it competing with your
real site for your own content — and it is now blocked at two levels. You can
check it any time:

```bash
npm run check:alias
```

It should say `sealed.`

**Production — the real thing.** `domisignature.com` still points at the old
site. Going live is a decision, not an accident: nobody has done it, and it
cannot happen by pushing a change. **`LAUNCH-RUNBOOK.md`** is the complete
procedure — domain, DNS, checks before and after, and what to watch in the first
week.

**If something goes wrong after launch**, the runbook's rollback puts the old
site back within about five minutes, provided its two preparation steps were
done: lower the DNS time-to-live beforehand, and photograph the DNS settings
before changing them. Keep the old hosting paid for a month after launch — it is
the thing you would roll back to.

**If a change is wrong but the site is up**, that is smaller: in Vercel, open
Deployments, find the last good one, and Promote to Production. Seconds, no DNS.

---

## Γρήγορος οδηγός

Οδηγίες χρήσης — δεν είναι κείμενο του site.

### Ο βασικός κανόνας

Μετά από κάθε αλλαγή, τρέξε την εντολή:

```bash
npm run qa
```

Περίμενε να γράψει `the gate is green`. Αν βγάλει σφάλμα, η αλλαγή **δεν** έχει
δημοσιευτεί και τίποτα δεν έχει χαλάσει — διόρθωσε αυτό που σου λέει ή ακύρωσε
την αλλαγή.

### Πού βρίσκονται τα κείμενα

Όλα στον φάκελο **`content/`**:

- `venues.ts` — οι τρεις χώροι
- `events.ts` — οι επτά γκαλερί εκδηλώσεων
- `site.ts` — τηλέφωνο, WhatsApp, email, μενού
- `pending.ts` — μαρτυρίες, συχνές ερωτήσεις, στατιστικά (κενά μέχρι να τα
  στείλεις)

Άλλαξε **μόνο** ό,τι βρίσκεται ανάμεσα στα εισαγωγικά `"…"`. Άφησε τα εισαγωγικά,
τα κόμματα και τις αγκύλες ακριβώς εκεί που είναι.

Τον φάκελο `src/` **δεν τον αγγίζεις ποτέ**.

### Οι πιο συνηθισμένες εργασίες

| Θέλω να… | Τι κάνω |
| --- | --- |
| αλλάξω περιγραφή χώρου | `content/venues.ts`, βρες το `slug:` του χώρου, άλλαξε το `body:` |
| αλλάξω χωρητικότητα | `content/venues.ts`, η γραμμή `capacity:` |
| αλλάξω τηλέφωνο ή email | `content/site.ts` |
| προσθέσω γκαλερί | `npm run ingest:gallery -- "διαδρομή/φακέλου" --slug το-slug` |
| αλλάξω το brochure | αντικατέστησε το αρχείο `public/assets/files/Weddingbrochure.pdf` **με το ίδιο όνομα** |
| δω αν είναι όλα εντάξει | `npm run qa` |

### Οι αριθμοί στην αρχική σελίδα

Δεν γράφονται πουθενά με το χέρι. Υπολογίζονται μόνοι τους από το
`content/venues.ts`:

- ο αριθμός των χώρων = πόσοι χώροι υπάρχουν στο αρχείο
- ο αριθμός των καλεσμένων = η **μεγαλύτερη** χωρητικότητα από όλους τους χώρους

Αν αλλάξεις μια χωρητικότητα, η αρχική σελίδα ενημερώνεται μόνη της. Μην
προσπαθήσεις να τους αλλάξεις χειροκίνητα — υπάρχει έλεγχος που θα το κόψει.

Προσοχή: αν προσθέσεις έναν **μικρό** χώρο, ο αριθμός καλεσμένων δεν αλλάζει.
Είναι το μέγιστο, όχι το άθροισμα. Αυτό είναι σωστό.

### Φωτογραφίες

Το εργαλείο `npm run ingest:gallery` κάνει τη μισή δουλειά: μικραίνει τις
φωτογραφίες, **σβήνει τα κρυφά δεδομένα τους** (οι φωτογραφίες κουβαλούν
συντεταγμένες GPS) και φτιάχνει ένα αριθμημένο contact sheet.

Την άλλη μισή την κάνεις εσύ: ανοίγεις το contact sheet, **βλέπεις** τις
φωτογραφίες και γράφεις τον τίτλο και μία περιγραφή για κάθε μία. Όσο μένουν
κενά (`TODO`), το `npm run qa` δεν περνάει. Είναι σκόπιμο.

### Δημοσίευση

Το `domisignature.com` δείχνει ακόμα στο **παλιό** site. Η μετάβαση στο νέο
είναι δική σου απόφαση και γίνεται με το χέρι — δεν συμβαίνει κατά λάθος.
Η πλήρης διαδικασία είναι στο **`LAUNCH-RUNBOOK.md`**, μαζί με τον τρόπο
επιστροφής στο παλιό site αν χρειαστεί (περίπου πέντε λεπτά).
