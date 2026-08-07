/** PDF asset (file still named MOILitePaper.pdf in /public) */
export const WHITEPAPER_URL = "/MOILitePaper.pdf";

export const WHITEPAPER_SITE_URL = "https://moi.technology/whitepaper";
export const NAV_H = 72;

/* Participants — all rendered in brand indigo on the dark page,
   differentiated by saturation/lightness only. */
export const PARTICIPANTS = [
  { name: "Alice",   color: "#5B47E0" },
  { name: "Bob",     color: "#7B6CE8" },
  { name: "Charlie", color: "#9B8FF0" },
  { name: "Diana",   color: "#6E59E4" },
  { name: "Eve",     color: "#8B7AEB" },
];
export const P_COUNT = PARTICIPANTS.length;

export const ALICE_COLOR = "#5B47E0";
export const BOB_COLOR = "#7B6CE8";

/* Field accent palette — collapsed to indigo + coral.
   Last entry is the "decay/broken" accent. */
export const FIELD_COLORS = ["#5B47E0","#7B6CE8","#9B8FF0","#6E59E4","#E07B5B","#8B7AEB"];
export const FIELD_KEYS = ["assets","trust","auth","keys","creds","logic"];
export const FIELD_BARS = [0.8, 0.94, 0.4, 0.85, 0.3, 0.5];
export const ALICE_VALS = ["2,400 MOI","0.94","scoped","ed25519","3 active","4 bound"];
export const BOB_VALS = ["890 MOI","0.87","open","secp256k1","1 active","2 bound"];

export const ALICE_APPS = [
  { name: "DEX", color: "#3A9F7E", field: "assets", fieldIdx: 0 },
  { name: "Lend", color: "#D4853A", field: "trust", fieldIdx: 1 },
  { name: "NFT", color: "#3A7ED4", field: "logic", fieldIdx: 5 },
];
export const BOB_APPS = [
  { name: "Bridge", color: "#7A8B5A", field: "keys", fieldIdx: 3 },
];

export const BLOB_R = 54;
export const CARD_W = 210;
export const CARD_H = 252;
export const CARD_R = 14;
