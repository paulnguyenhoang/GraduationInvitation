const shapes = {
  download: <><path d="M12 3.5v11m-4-4 4 4 4-4" /><path d="M5 15.5v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" /></>,
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  external: <path d="M6 18 18 6M9 6h9v9" />,
  pin: <><path d="M19 10a7 7 0 1 0-14 0c0 5 7 11 7 11s7-6 7-11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  plus: <path d="M6 12h12m-6-6v12" />,
  minus: <path d="M6 12h12" />,
}

export function Icon({ name, size = 20 }: { name: keyof typeof shapes; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </svg>
  )
}
