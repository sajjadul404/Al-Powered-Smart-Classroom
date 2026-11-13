export function Logo({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="#2563EB" />
        <path
          d="M9 10.5C9 9.67157 9.67157 9 10.5 9H21.5C22.3284 9 23 9.67157 23 10.5V15.5C23 16.3284 22.3284 17 21.5 17H15L11 21V17H10.5C9.67157 17 9 16.3284 9 15.5V10.5Z"
          stroke="white"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="13.5" cy="13" r="1.3" fill="white" />
        <circle cx="18.5" cy="13" r="1.3" fill="white" />
        <path d="M16 23H22.5" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span
          className={`font-display text-base font-bold tracking-tight whitespace-nowrap ${
            light ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          FastRobox 1.0
        </span>
      )}
    </div>
  );
}
