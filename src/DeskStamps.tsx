const stamps = [
  {
    motif: 'cap',
    outline: 'M5 20 36 7l31 13-31 13L5 20Zm12 5v12c9 9 29 9 38 0V25M36 20l25 9v13m-2 7v-4a2 2 0 0 1 4 0v4Z',
    detail: 'M23 37c7 5 19 6 26 0M29 17l7-3 7 3',
  },
  {
    motif: 'diploma',
    outline: 'M15 12h41c6 0 6 9 0 9H20v21h37c6 0 6 9 0 9H15c-5 0-7-4-7-8V19c0-4 2-7 7-7Zm-1 0c6 0 8 9 0 9h-3m43 0v21m-39 9c6 0 7-9 0-9h-3m19-12 5 2 5-2-2 5 2 5-5-2-5 2 2-5-2-5Z',
    detail: 'M28 25h18m-18 1h5m10 0h4',
  },
  {
    motif: 'code',
    outline: 'm25 20-11 8 11 8m22-16 11 8-11 8m-6-20L31 40',
    detail: 'M11 17v-6h9m32 0h9v6m0 23v5h-9m-32 0h-9v-5',
  },
  {
    motif: 'chip',
    outline: 'M22 15h28v26H22zM30 22h12v12H30zm-1-7V7m7 8V7m7 8V7m-14 34v8m7-8v8m7-8v8M22 21h-8m8 7h-8m8 7h-8m36-14h8m-8 7h8m-8 7h8',
    detail: 'M30 22v4h4v-4m22-10 4-4m-44 4-4-4m44 36 4 4m-44-4-4 4',
  },
]

export function DeskStamps() {
  return (
    <div className="desk-stamps">
      {stamps.map(({ motif, outline, detail }) => (
        <div key={motif} className={`graduation-stamp graduation-stamp--${motif}`}>
          <div className="stamp-field">
            <svg viewBox="0 0 72 56" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <path d={outline} />
              <path d={detail} opacity=".6" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
