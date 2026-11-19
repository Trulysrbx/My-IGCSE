// Cambridge IGCSE past-paper naming and release logic.
//
// Every Cambridge document follows the same filename convention:
//   <syllabus>_<session><yy>_<type>[_<paper><variant>]
//   e.g. 0610_s23_qp_42 = Biology, May/June 2023, question paper, Paper 4, variant 2
// Because this is universal, the site can build a link for any paper without
// storing a single PDF.

export const SESSIONS = {
  m: { label: 'Feb/March', short: 'Mar', month: 3 },
  s: { label: 'May/June', short: 'Jun', month: 6 },
  w: { label: 'Oct/Nov', short: 'Nov', month: 11 },
};
export const SESSION_ORDER = ['m', 's', 'w'];

export const DOC_TYPES = {
  qp: 'Question paper',
  ms: 'Mark scheme',
  in: 'Insert',
  ci: 'Confidential instructions',
  sf: 'Source files',
  er: 'Examiner report',
  gt: 'Grade thresholds',
};

/** Build the Cambridge filename (without .pdf). */
export function paperFilename({ code, year, session, type, paper, variant }) {
  if (!SESSIONS[session]) throw new Error(`Unknown session ${session}`);
  const yy = String(year).slice(-2);
  const base = `${code}_${session}${yy}_${type}`;
  if (type === 'er' || type === 'gt') return base;
  return `${base}_${paper}${variant ?? ''}`;
}

/** Parse a filename like 0610_s23_qp_42 back into its parts (or null). */
export function parseFilename(name) {
  const m = String(name).trim().replace(/\.pdf$/i, '').match(/^(\d{4})_([msw])(\d{2})_([a-z]{2})(?:_(\d)(\d)?)?$/i);
  if (!m) return null;
  const [, code, session, yy, type, paper, variant] = m;
  return {
    code,
    session: session.toLowerCase(),
    year: 2000 + Number(yy),
    type: type.toLowerCase(),
    paper: paper ? Number(paper) : undefined,
    variant: variant ? Number(variant) : undefined,
  };
}

/**
 * Cambridge publishes papers to schools a few months after each exam series
 * and they appear on free archives around then. This estimates whether a
 * series should be available yet so we don't show links that can't work.
 *   Feb/March -> ~May same year, May/June -> ~August, Oct/Nov -> ~January next year
 */
export function isReleased(year, session, now = new Date()) {
  const release = {
    m: new Date(year, 4, 15),
    s: new Date(year, 7, 20),
    w: new Date(year + 1, 0, 20),
  }[session];
  return release <= now;
}

/** The variants that normally exist for a session. Feb/March is (almost) always variant 2. */
export const variantsFor = (session, subject) =>
  session === 'm' ? subject.marchVariants ?? [2] : subject.variants ?? [1, 2, 3];

/** Years with at least one released session, newest first. */
export function availableYears(subject, now = new Date()) {
  const first = subject.firstYear ?? 2016;
  const years = [];
  for (let y = now.getFullYear(); y >= first; y--) {
    if (sessionsFor(subject, y, now).length) years.push(y);
  }
  return years;
}

export function sessionsFor(subject, year, now = new Date()) {
  return SESSION_ORDER.filter((s) => (s !== 'm' || subject.march !== false) && isReleased(year, s, now));
}

/** Every individual paper (qp) for a subject in a given year. */
export function listPapers(subject, year, now = new Date()) {
  const out = [];
  for (const session of sessionsFor(subject, year, now)) {
    for (const paper of Object.keys(subject.papers).map(Number)) {
      for (const variant of variantsFor(session, subject)) {
        out.push({ code: subject.code, year, session, paper, variant, id: paperFilename({ code: subject.code, year, session, type: 'qp', paper, variant }) });
      }
    }
  }
  return out;
}

export function describePaper(subject, p) {
  return `${subject.name} ${SESSIONS[p.session].label} ${p.year} · Paper ${p.paper} variant ${p.variant}`;
}
