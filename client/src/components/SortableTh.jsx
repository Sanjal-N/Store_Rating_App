// A single <th> that toggles sort direction on click and shows an
// arrow indicating the current sort state. Kept intentionally tiny -
// the parent page owns the actual sortBy/sortOrder state.
export default function SortableTh({ label, field, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === field;
  const arrow = isActive ? (sortOrder === 'asc' ? '\u2191' : '\u2193') : '';

  return (
    <th onClick={() => onSort(field)} className="sortable-th">
      {label} {arrow}
    </th>
  );
}
