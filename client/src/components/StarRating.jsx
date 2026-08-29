import '../styles/StarRating.css';

// A five-segment "punch strip" rating control - a nod to a ticket stub
// rather than generic star icons. Same props as before: value (1-5 or
// null), onChange(n), disabled.
export default function StarRating({ value, onChange, disabled }) {
  const marks = [1, 2, 3, 4, 5];

  return (
    <div className={`punch-strip ${disabled ? 'disabled' : ''}`} role="group" aria-label="Rate this store">
      {marks.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={n <= (value || 0) ? 'punch filled' : 'punch'}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={n === value}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
