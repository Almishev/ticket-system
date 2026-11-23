import { useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import MobileSort from '../components/MobileSort'
import SortHeader from '../components/SortHeader'
import { LazySentinel, Pager, pageQuery, useLazyPage } from '../paging'
import { nextSort } from '../sort'

export default function CategoriesPage() {
  const { credentials } = useAuth()
  const toast = useToast()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [sort, setSort] = useState({ key: 'name', type: 'text', direction: 'asc' })
  const {
    items: sortedCategories,
    page,
    totalPages,
    loading,
    loadingMore,
    loadMore,
    goToPage,
    refresh,
  } = useLazyPage(
    async (nextPage, size) => {
      try {
        const response = await api(`/categories?${pageQuery(nextPage, size, sort)}`, { auth: credentials })
        return response.data
      } catch (requestError) {
        toast.error(requestError.message)
        throw requestError
      }
    },
    [credentials, sort.key, sort.direction, toast],
  )

  function changeSort(key, type) {
    setSort((current) => nextSort(current, key, type))
  }

  async function run(action, success) {
    try {
      await action()
      await refresh()
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
        className="category-create mb-3"
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

      <MobileSort
        sort={sort}
        onSort={changeSort}
        options={[
          { key: 'name', label: 'Име', type: 'text' },
          { key: 'active', label: 'Статус', type: 'text' },
        ]}
      />

      <div className="only-mobile record-list">
        {loading && sortedCategories.length === 0 && <p className="text-secondary text-center py-4 mb-0">Зареждане...</p>}
        {!loading && sortedCategories.length === 0 && <p className="text-secondary text-center py-4 mb-0">Няма категории</p>}
        {sortedCategories.map((category) => (
          <article key={category.id} className="record-card">
            <div className="record-card-top">
              {editingId === category.id ? (
                <Form.Control
                  value={editingName}
                  maxLength={100}
                  onChange={(event) => setEditingName(event.target.value)}
                />
              ) : (
                <strong>{category.name}</strong>
              )}
              <Badge bg={category.active ? 'success' : 'secondary'}>{category.active ? 'Активна' : 'Неактивна'}</Badge>
            </div>
            <div className="record-actions">
              {editingId === category.id ? (
                <>
                  <Button
                    size="sm"
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
            </div>
          </article>
        ))}
      </div>

      <div className="only-desktop bg-white border rounded">
        <Table className="mb-0 align-middle">
          <thead>
            <tr>
              <SortHeader label="Име" column="name" sort={sort} onSort={changeSort} />
              <SortHeader label="Статус" column="active" sort={sort} onSort={changeSort} />
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && sortedCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-secondary py-4">
                  Зареждане...
                </td>
              </tr>
            )}
            {!loading && sortedCategories.length === 0 && (
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

      <LazySentinel enabled={!loading && !loadingMore && page + 1 < totalPages} watch={page} onVisible={loadMore} />
      {loadingMore && <p className="text-secondary text-center mb-0">Зареждане...</p>}
      <Pager page={page} totalPages={totalPages} disabled={loading || loadingMore} onPage={goToPage} />
    </>
  )
}
