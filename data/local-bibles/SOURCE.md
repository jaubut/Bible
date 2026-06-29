# 1812 Bible — source & license

**Version id:** `local-1812-kjva`  ·  **Display:** "1812 Bible (KJV + Apocrypha)"

## What it is
The 1812 Bible catalogued at <https://www.felzbooks.com/books/1812-bible> is an
early American stereotype printing in the **King James / Authorized Version**
tradition, **including the Apocrypha**. That felzbooks catalog page is behind a
WordPress login ("Soul Power") and is not scrapeable, so the page itself is not
the data source — only the identification of the edition.

## Text source
The text of an 1812 KJV+Apocrypha printing is the **1769 Authorized Version with
the Apocrypha (KJVA)**. We bundle that public-domain text as the faithful
equivalent, sourced from **getBible.net's CrossWire KJVA module**
(<https://api.getbible.net/v2/kjva.json>, clean plain text, Strong's numbers
stripped). 80 books: 39 OT + 14 Apocrypha + 27 NT.

## License
The KJV/Authorized Version base text + Apocrypha is **public domain in the United
States and Canada**. The 1812 American imprint is pre-1929 (public domain); the
KJV's Crown letters-patent restriction applies only within the United Kingdom.
(The `distribution_license: "GPL"` field on the getBible module is SWORD
module-packaging metadata, not a copyright claim over the public-domain text.)

## Regenerate
```
bun scripts/fetch-1812-bible.ts
```
