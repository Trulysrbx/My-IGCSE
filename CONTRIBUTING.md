# Contributing to My IGCSE

Thanks for helping other students! You don't need to be an experienced developer. Most useful contributions are edits to plain data files.

## Quick start

```bash
npm start      # http://localhost:3000
npm test       # run the unit tests
```

The site itself has no build step. Edit a file and refresh the browser. The only dev dependency is esbuild, which is used to regenerate the offline file `my-igcse.html`. Run `npm install` once, then `npm run build` before committing.

## Easy contributions

### Add or fix a subject — `js/data/subjects.js`

Copy an existing entry and change it:

```js
{
  code: '0610',                 // 4-digit syllabus code
  name: 'Biology',
  slug: 'biology',              // used by archive URLs: <slug>-<code>
  group: 'Sciences',            // heading it appears under
  icon: '🧬',
  papers: { 1: 'Multiple choice (Core)', 2: '…' },  // paper number -> description
  inserts: [1],                 // optional: papers that come with an insert
  march: false,                 // optional: no Feb/March series
  note: '…',                    // optional: shown at the top of the papers page
  topics: ['Topic 1', 'Topic 2'],
}
```

### Add a starter deck — `js/data/decks.js`

Each deck has a unique `id`, a `subject` code that exists in `subjects.js`, and `cards` as `[front, back]` pairs. Please keep cards **accurate and in line with the current syllabus**, and use mark-scheme wording for definitions.

### Fix a broken past paper link — `js/data/sources.js`

Each source has a `pdf({ file, subject, year })` function that returns a URL. `file` is the Cambridge filename without `.pdf`, e.g. `0610_s23_qp_42`.

## Code guidelines

* Vanilla JS modules, no frameworks and no build tools. Keep it that way so anyone can contribute.
* Logic that doesn't touch the DOM goes in `js/lib/` and gets a test in `tests/`.
* Always render user text with the `html` tagged template from `js/lib/util.js`, which escapes values. Never use raw string concatenation into `innerHTML`.
* No tracking, analytics, ads or accounts. User data stays in `localStorage`.
* Run `npm test` before opening a pull request.
