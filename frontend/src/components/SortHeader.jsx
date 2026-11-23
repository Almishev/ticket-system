export default function SortHeader({ label, column, type = 'text', sort, onSort }) {
  const active = sort.key === column
  const mark = active ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <th>
      <button type="button" className="sort-button" onClick={() => onSort(column, type)}>
        {label}
        {mark}
      </button>
    </th>
  )
}
