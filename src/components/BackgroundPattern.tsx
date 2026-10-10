export function BackgroundPattern() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-primary opacity-[0.07]" width="100%" height="100%">
      <defs>
        <pattern id="join-background-shapes" x="0" y="0" width="520" height="440" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M45 90c-28-27 8-63 34-40s-3 53-20 35 6-30 15-19" />
            <path d="m218 49 8 19 21 3-16 14 4 21-17-11-19 10 5-21-15-15 21-2z" />
            <path d="M389 68c17-28 44 28 61 0s44 28 61 0" />
            <circle cx="131" cy="213" r="18" />
            <path d="m319 163 22 37-43 1z" transform="rotate(15 319 183)" />
            <path d="M435 220c-34-11-54 25-27 43s48-13 26-25-31 9-18 14" />
            <path d="m44 346 14-7 14 7 14-7 14 7" />
            <path d="M210 339c-13-24 24-36 34-14s-18 39-29 20 9-24 13-11" />
            <rect x="339" y="341" width="28" height="28" rx="7" transform="rotate(24 353 355)" />
            <path d="M470 388v20m-10-10h20M65 173v12m-6-6h12M252 246v16m-8-8h16" />
          </g>
          <g fill="currentColor"><circle cx="169" cy="111" r="3" /><circle cx="377" cy="270" r="3" /><circle cx="142" cy="398" r="3" /><circle cx="492" cy="149" r="3" /></g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#join-background-shapes)" />
    </svg>
  );
}
