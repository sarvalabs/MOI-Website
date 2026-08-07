/**
 * Alice nucleus — breathing purple orb with 6-color segmented ring.
 * Pure CSS animation, no canvas needed.
 */
const RING_COLORS = [
  "#4B17E5", // authority   — MOI Main
  "#BCA6FF", // preferences — accent on dark
  "#6F45EA", // assets      — lav-4
  "#320F99", // permissions — MOI Dark
  "#E20FBF", // trust       — signal magenta
  "#009EF7", // history     — signal blue
];

export default function AliceNucleus({ size = 56 }) {
  const r = size / 2;
  const ringR = r - 4;
  const strokeW = 3;
  const circumference = 2 * Math.PI * ringR;
  const segLen = circumference / RING_COLORS.length;

  return (
    <div className="alice-nucleus flex items-center justify-center mb-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow */}
        <defs>
          <radialGradient id="nucleus-glow">
            <stop offset="0%" stopColor="#4B17E5" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#4B17E5" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#4B17E5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={r} fill="url(#nucleus-glow)" />

        {/* Core */}
        <circle cx={r} cy={r} r={r * 0.52} fill="#4B17E5" opacity="0.85" />
        <circle cx={r} cy={r} r={r * 0.3} fill="#BCA6FF" opacity="0.5" />

        {/* Segmented ring */}
        {RING_COLORS.map((color, i) => (
          <circle
            key={i}
            cx={r}
            cy={r}
            r={ringR}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeDasharray={`${segLen - 2} ${circumference - segLen + 2}`}
            strokeDashoffset={-i * segLen}
            strokeLinecap="round"
            opacity="0.7"
            transform={`rotate(-90 ${r} ${r})`}
          />
        ))}

        {/* Label */}
        <text
          x={r}
          y={r + size * 0.46}
          textAnchor="middle"
          fill="#0A051A"
          opacity="0.4"
          style={{ fontSize: "7px", fontFamily: '"Poppins", system-ui, sans-serif' }}
        >
          alice
        </text>
      </svg>
    </div>
  );
}
