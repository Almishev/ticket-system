import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'

export default function MobileSort({ sort, options, onSort }) {
  return (
    <div className="mobile-sort only-mobile">
      <Form.Select
        aria-label="Сортиране"
        value={sort.key}
        onChange={(event) => {
          const option = options.find((item) => item.key === event.target.value)
          onSort(option.key, option.type)
        }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </Form.Select>
      <Button variant="outline-secondary" onClick={() => onSort(sort.key, sort.type)} aria-label="Посока на сортиране">
        {sort.direction === 'asc' ? '↑' : '↓'}
      </Button>
    </div>
  )
}
