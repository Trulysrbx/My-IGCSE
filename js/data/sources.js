// Where past-paper PDFs are fetched from. My IGCSE never hosts papers itself —
// they are © Cambridge University Press & Assessment — it just builds links to
// archives that already publish them for free.
//
// URL patterns change from time to time. If a source breaks, fix it here (it's
// the only place) and send a pull request. `file` is the Cambridge filename
// without ".pdf", e.g. "0610_s23_qp_42".

export const SOURCES = [
  {
    id: 'papacambridge',
    name: 'PapaCambridge',
    home: 'https://pastpapers.papacambridge.com/',
    pdf: ({ file }) => `https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/${file}.pdf`,
  },
  {
    id: 'bestexamhelp',
    name: 'Best Exam Help',
    home: 'https://bestexamhelp.com/',
    pdf: ({ file, subject, year }) =>
      `https://bestexamhelp.com/exam/cambridge-igcse/${subject.slug}-${subject.code}/${year}/${file}.pdf`,
  },
  {
    id: 'search',
    name: 'Web search (always works)',
    home: 'https://duckduckgo.com/',
    pdf: ({ file }) => `https://duckduckgo.com/?q=${encodeURIComponent(`"${file}" pdf`)}`,
  },
];

export const DEFAULT_SOURCE = 'papacambridge';

export const sourceById = (id) => SOURCES.find((s) => s.id === id) ?? SOURCES[0];

/** Cambridge's own subject page (has the most recent specimen and past papers). */
export const officialPage = (subject) =>
  `https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-${subject.slug}-${subject.code}/`;
