// Site-wide settings.

/** The public address of the site. Share links made in the offline file point here. */
export const PUBLIC_URL = 'https://my-igcse-production.up.railway.app/';

/** True when running from the downloaded single file (opened by double-clicking). */
export const IS_OFFLINE_FILE = typeof location !== 'undefined' && location.protocol === 'file:';

/** Base URL for share links: this page when hosted, otherwise the public site. */
export const shareBase = () => (IS_OFFLINE_FILE ? PUBLIC_URL : `${location.origin}${location.pathname}`);
