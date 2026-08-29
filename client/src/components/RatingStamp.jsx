import '../styles/RatingStamp.css';

// The app's signature mark: a store's average rating rendered as a
// stamped badge, the way a grade or approval mark reads in a ledger.
// `compact` drops the ring down for dense table rows.
export default function RatingStamp({ value, count, compact = false }) {
  const hasRatings = Boolean(count);
  const display = hasRatings ? Number(value).toFixed(1) : '\u2014';

  return (
    <span className={`rating-stamp ${compact ? 'compact' : ''} ${hasRatings ? '' : 'empty'}`}>
      <span className="rating-stamp-ring">
        <span className="rating-stamp-value">{display}</span>
      </span>
      {!compact && (
        <span className="rating-stamp-count">
          {hasRatings ? `${count} rating${count === 1 ? '' : 's'}` : 'not yet rated'}
        </span>
      )}
    </span>
  );
}
