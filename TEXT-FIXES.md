# Text fixes — awaiting your approval

Every word of copy on the new site is taken verbatim from the live
domisignature.com. The list below is **every** change I made, and **every**
question I have. Nothing else was edited, reworded, shortened or translated.

---

## A. Fixes applied (technical artefacts only)

### A1. Mountain Escape — "A major advantage for weddings:" repeated three times

The live modal renders this line **3×** in a row, twice of them glued together
mid-sentence:

> …or multi-day celebrations.**A major advantage for weddings:A major advantage
> for weddings:**
>
> **A major advantage for weddings:**

**Applied:** kept the line once, as the heading that introduces the bullet list —
which is clearly what it was meant to be. No wording changed.

---

### A2. Thalasses — "Thallases" vs "Thalasses"

The card, the modal heading and the nav all say **Thalasses**. The first line of
the description says **"Thallases Villas includes four independent…"**.

**Applied:** normalised the body text to **Thalasses**, matching the venue name
used everywhere else.

---

### A3. Stripped CMS markup, kept the words

The venue descriptions were pasted out of a word processor, so the live HTML
carries `border: 1pt none rgba(0,0,0,1)`, `font-size: 10.5pt`, `<span lang="el">`,
`&nbsp;` runs and empty `<p></p>` shells around every sentence. Bullets were
literal `●` characters inside styled spans.

**Applied:** the prose is reflowed into clean paragraphs and real `<ul>` lists.
**No word was added, removed or reordered.** Bold emphasis is preserved where
the original used `<strong>` (e.g. "small, meaningful weddings", "up to 12
overnight guests across 6 bedrooms"), as is the underline on the Villa Aetos
curfew note.

---

## B. Questions — I have changed nothing here

### B1. "germans" as a public gallery category ⚠️ recommend renaming

Signature Events gallery #2 is published with the category label **`germans`**,
shown to visitors under the title "Party". The other categories are
descriptive (`dance`, `celebration`, `rituals`, `drone`); this one names a
nationality and reads as an internal file label that escaped into production.

It currently appears **as-is** on the new site, including in the category
filter.

**Suggested replacements:** `celebration`, `summer party`, or `villa party`.
Tell me which and I will change it. I will not touch it otherwise.

---

### B2. Step 6 of the Wedding Journey has no body text

"Step 6 — Come and get married!" has an empty body on the live site. The new
timeline renders it as a deliberate closing beat — title only, no empty box.

If you would like a closing sentence there, send me the words.

---

### B3. Two venue sentences read as if a word is missing

Both are **unchanged** on the new site — flagging only so you can decide:

| Where | Live text |
|---|---|
| Mountain Escape | "…rented together as one exclusive home **-** perfect for intimate destination weddings…" (hyphen where an em dash was likely intended) |
| Journey, Step 5 | "We take care of **the all organization**  so you can enjoy the process" (also a double space) |

---

### B4. `posterimage.png` appears inside a photo gallery

In Signature Events → "Wedding / rituals" (the Olive Stories gallery), the file
`/media/posterimage.png` is listed as gallery image #10. The name suggests it is
the poster frame for `Wedding clip.mp4` rather than a photograph.

**Applied:** it is used as the video's poster frame **and** kept in the gallery,
so nothing is lost either way. Say the word and I will remove it from the
gallery grid.

---

### B5. The hero image looks like an AI render, not your photography

`/media/spire2.png` — the current masthead background — shows a couple at a
sunset pool with palms. Next to your real photography (Mountain Escape, the
Thalasses banquet, the beach ceremonies) it reads as synthetic stock, and it is
the very first thing a visitor sees.

**Applied:** the homepage hero now runs a slow cinematic sequence of **your own
photographs** instead. `spire2.png` is still downloaded and available.

If you want the original image back as the hero, that is a one-line change.

---

## C. Confirmed untouched

- Meta title, description, keywords, author — carried over byte-for-byte.
- Hero: "Where Every Moment Is Signed", "Plan your perfect event with us",
  "Luxury Events, Weddings & Private Celebrations in Crete", CTA "Tell me more".
- All five service blocks, including both external creteholidayhome.com links.
- All four venue descriptions, bullet lists, capacities and curfew notes.
- All seven Signature Events galleries, titles and categories.
- All six Wedding Journey steps.
- Team names, roles and the team paragraph.
- Phone, WhatsApp, email, Monday.com form URL, brochure PDF, social links,
  Γ.Ε.ΜΗ. 021943650000, "© 2026 Domisignature".
