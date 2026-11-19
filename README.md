# My IGCSE

**Free, open-source revision for Cambridge IGCSE.** Find past papers, turn your notes into flashcards, quiz yourself and track your progress. No accounts, no ads, no tracking. Everything you do is saved in your own browser.

## Features

| | |
|---|---|
| 📄 **Past papers** | Question papers, mark schemes, inserts, examiner reports and grade thresholds for 20 subjects, by year and series. Tick off papers, log your scores, see your average, or pick a random paper you haven't done yet. You can also jump straight to a paper by its code (e.g. `0610_s23_qp_42`). |
| 🃏 **Flashcards** | Spaced repetition (an SM-2 style algorithm, like Anki) with Again/Hard/Good/Easy grading, keyboard shortcuts and a cram mode. Includes ready-made decks for Biology, Chemistry, Physics, Maths, Computer Science, Economics and Business. |
| ✨ **Flashcard generator** | Paste notes and get cards instantly. It understands `term - definition`, "X is the…" sentences, "… is called Y", `{{cloze}}` / `**bold**` blanks and `Q:`/`A:` pairs. It also imports CSV/TSV files (Quizlet, Anki, Excel). |
| ❓ **Quizzes** | Multiple choice (wrong answers are taken from the rest of the deck) or typed answers with forgiving marking, in either direction. |
| 🔗 **Share decks** | Share a deck as a link. The whole deck is compressed into the URL, so no server is needed. You can also export and import `.json` and `.csv`. |
| 🎯 **Topic tracker** | Rate every syllabus topic as weak, OK or confident, and see what to focus on next. |
| ⏱️ **Planner** | Exam countdowns, a Pomodoro focus timer that keeps running across pages, a study streak and an activity heat map. |
| 🗣️ **Command words** | What "describe", "explain", "evaluate" etc. actually ask for, with exam tips. Can be turned into a deck in one click. |
| 💾 **Your data** | Backup and restore as a file, light and dark themes, and it works on phones. |

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer. There are no dependencies to install.

```bash
npm start
```

Then open http://localhost:3000.

The site is plain HTML, CSS and JavaScript modules with no build step, so any static file server works too (e.g. `python3 -m http.server`). Opening `index.html` straight from disk won't work, because browsers block JS modules on `file://`.

## Deploy on Railway

1. Push this repo to GitHub.
2. In Railway, choose **New Project → Deploy from GitHub repo** and pick this repository.
3. That's it. Railway detects `package.json` and runs `npm start`, and `server.js` listens on Railway's `PORT`. `railway.json` sets the start command and a `/healthz` health check.
4. Under **Settings → Networking**, click **Generate Domain** to get a public URL.

`server.js` is a ~100-line static server with zero dependencies. It only serves the public files (`index.html`, `css/`, `js/`, etc.), not tests or server code. It also adds security headers and ETags.

## How past papers work

My IGCSE **does not host any PDFs**. Cambridge papers are © Cambridge University Press & Assessment. Every Cambridge file follows the same naming scheme (`<syllabus>_<series><yy>_<type>_<paper><variant>`, e.g. `0610_s23_qp_42`), so the site builds a link to free archives that already publish them.

* Sources are defined in [`js/data/sources.js`](js/data/sources.js). If an archive changes its URLs, fix it there (it's the only place).
* Users can switch source per page. The "Web search" option always finds a file by its official name.
* Not every subject sits every variant, especially in Feb/March, so a few links will 404. That's expected.

## Project structure

```
index.html            app shell
server.js             zero-dependency static server (Railway / any Node host)
css/style.css         all styles (light/dark via CSS variables)
js/main.js            hash router
js/store.js           localStorage persistence, backup/restore
js/lib/               pure logic: srs, generator, quiz, papers, share, timer, util
js/views/             one file per page
js/data/              subjects & topics, starter decks, command words, paper sources
tests/                node:test unit tests for the pure logic
```

## Tests

```bash
npm test
```

## Contributing

Contributions are very welcome, especially new subjects, better topic lists and more starter decks. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE). Do what you like with it. Past papers belong to Cambridge, and this project only links to them.
