export const LITEPAPER_URL = "/MOILitePaper.pdf";
export const NAV_H = 72;

export const PARTICIPANTS = [
  { name: "Alice", color: "#7B5EA7" },
  { name: "Bob", color: "#3A8F6E" },
  { name: "Charlie", color: "#C47A2D" },
  { name: "Diana", color: "#2D7EC4" },
  { name: "Eve", color: "#C44D5A" },
];
export const P_COUNT = PARTICIPANTS.length;

export const ALICE_COLOR = "#8B6CC1";
export const BOB_COLOR = "#3A9F7E";

export const FIELD_COLORS = ["#3A9F7E","#8B6CC1","#D4853A","#3A7ED4","#D45A6A","#7A8B5A"];
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
