// Share decks without a server: the deck is compressed and stored in the URL
// itself (after the #), so links work on any static host and nothing is uploaded.

const toB64Url = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== 'undefined';

/** Strip a deck down to what is needed to share it. */
export function packDeck(deck) {
  return { v: 1, n: deck.name, s: deck.subject || '', c: deck.cards.map((c) => [c.front, c.back]) };
}

export function unpackDeck(data) {
  if (!data || data.v !== 1 || !Array.isArray(data.c)) throw new Error('Not a valid shared deck');
  return {
    name: String(data.n || 'Shared deck').slice(0, 120),
    subject: String(data.s || ''),
    cards: data.c
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .map(([front, back]) => ({ front: String(front), back: String(back) })),
  };
}

/** Encode a deck to a URL-safe string. "z" prefix = deflate, "j" = plain JSON. */
export async function encodeDeck(deck) {
  const json = new TextEncoder().encode(JSON.stringify(packDeck(deck)));
  if (canCompress()) return 'z' + toB64Url(await pipe(json, new CompressionStream('deflate-raw')));
  return 'j' + toB64Url(json);
}

export async function decodeDeck(str) {
  const kind = str[0];
  const body = fromB64Url(str.slice(1));
  let bytes;
  if (kind === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('Your browser cannot open compressed links');
    bytes = await pipe(body, new DecompressionStream('deflate-raw'));
  } else if (kind === 'j') bytes = body;
  else throw new Error('Unknown link format');
  return unpackDeck(JSON.parse(new TextDecoder().decode(bytes)));
}
