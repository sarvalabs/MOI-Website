export default function BadgePill({ children }) {
  return (
    <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#4B17E5]/15 bg-[#4B17E5]/8 font-mono text-[10px] tracking-[0.2em] uppercase text-[#4B17E5] font-medium">
      {children}
    </span>
  );
}
