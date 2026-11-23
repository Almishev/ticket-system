import { useEffect, useMemo, useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import SortHeader from '../components/SortHeader'
import { nextSort, sortRows } from '../sort'

export default function CategoriesPage() {
  const { credentials } = useAuth()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [sort, setSort] = useState({ key: 'name', type: 'text', direction: 'asc' })

  async function load() {
    const response = await api('/categories', { auth: credentials })
    setCategories(response.data || [])
  }

  useEffect(() => {
    load().catch((requestError) => toast.error(requestError.message))
  }, [credentials])

  const sortedCategories = useMemo(
    () =>
      sortRows(categories, {
        ...sort,
        key: (category) => (sort.key === 'active' ? (category.active ? 'Активна' : 'Неактивна') : category.name),
      }),
    [categories, sort],
  )

  function changeSort(key, type) {
    setSort((current) => nextSort(current, key, type))
  }

  async function run(action, success) {
    try {
      await action()
      await load()
      if (success) {
        toast.success(success)
      }
    } catch (requestError) {
      toast.error(requestError.message)
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1 className="h3 mb-0">Категории</h1>
      </div>
      <Form
        className="d-flex gap-2 mb-3"
        onSubmit={(event) => {
          event.preventDefault()
          run(async () => {
            await api('/categories', {
              method: 'POST',
              auth: credentials,
              body: { name: name.trim() },
            })
            setName('')
          }, 'Категорията е създадена.')
        }}
      >
        <Form.Control
          value={name}
          maxLength={100}
          placeholder="Име на категория"
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Button type="submit">Добави</Button>
      </Form>

      <div className="bg-white border rounded">
        <Table responsive className="mb-0 align-middle">
          <thead>
            <tr>
              <SortHeader label="Име" column="name" sort={sort} onSort={changeSort} />
              <SortHeader label="Статус" column="active" sort={sort} onSort={changeSort} />
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-secondary py-4">
                  Няма категории
                </td>
              </tr>
            )}
            {sortedCategories.map((category) => (
              <tr key={category.id}>
                <td>
                  {editingId === category.id ? (
                    <Form.Control
                      value={editingName}
                      maxLength={100}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                  ) : (
                    category.name
                  )}
                </td>
                <td>
                  <Badge bg={category.active ? 'success' : 'secondary'}>
                    {category.active ? 'Активна' : 'Неактивна'}
                  </Badge>
                </td>
                <td className="text-end">
                  {editingId === category.id ? (
                    <>
                      <Button
                        size="sm"
                        className="me-2"
                        onClick={() =>
                          run(async () => {
                            await api(`/categories/${category.id}`, {
                              method: 'PUT',
                              auth: credentials,
                              body: { name: editingName.trim() },
                            })
                            setEditingId(null)
                          }, 'Категорията е обновена.')
                        }
                      >
                        Запази
                      </Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => setEditingId(null)}>
                        Отказ
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => {
                          setEditingId(category.id)
                          setEditingName(category.name)
                        }}
                      >
                        Преименувай
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() =>
                          run(() =>
                            api(`/categories/${category.id}/status`, {
                              method: 'PATCH',
                              auth: credentials,
                              body: { status: !category.active },
                            }),
                            'Статусът на категорията е обновен.',
                          )
                        }
                      >
                        {category.active ? 'Деактивирай' : 'Активирай'}
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}
