import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import MobileSort from '../components/MobileSort'
import SortHeader from '../components/SortHeader'
import { ROLE_LABELS, USER_STATUS_LABELS, formatDate, statusBadge } from '../labels'
import { LazySentinel, Pager, pageQuery, useLazyPage } from '../paging'
import { nextSort } from '../sort'

const emptyUser = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  department: '',
}

export default function UsersPage() {
  const { credentials, user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.role === 'ADMIN'
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState(null)
  const [personToDelete, setPersonToDelete] = useState(null)
  const [sort, setSort] = useState({ key: 'name', type: 'text', direction: 'asc' })
  const {
    items: sortedUsers,
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
        const response = await api(`/users?${pageQuery(nextPage, size, sort)}`, { auth: credentials })
        return response.data
      } catch (requestError) {
        toast.error(requestError.message)
        throw requestError
      }
    },
    [credentials, sort.key, sort.direction, toast],
    user?.role === 'ADMIN' || user?.role === 'SUPPORT',
  )

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

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

  if (user?.role === 'EMPLOYEE') {
    return <Alert variant="warning">Нямаш достъп до потребителите.</Alert>
  }

  return (
    <>
      <div className="page-heading">
        <h1 className="h3 mb-0">Потребители</h1>
        {isAdmin && <Button onClick={() => setShowCreate(true)}>Нов потребител</Button>}
      </div>
      <MobileSort
        sort={sort}
        onSort={changeSort}
        options={[
          { key: 'name', label: 'Име', type: 'text' },
          { key: 'email', label: 'Имейл', type: 'text' },
          { key: 'role', label: 'Роля', type: 'text' },
          { key: 'department', label: 'Отдел', type: 'text' },
          { key: 'status', label: 'Статус', type: 'text' },
          { key: 'createdAt', label: 'Създаден', type: 'date' },
        ]}
      />

      <div className="only-mobile record-list">
        {sortedUsers.map((person) => (
          <article key={person.id} className="record-card">
            <div className="record-card-top">
              <strong>
                {person.firstName} {person.lastName}
              </strong>
              <Badge bg={statusBadge(person.status)}>{USER_STATUS_LABELS[person.status]}</Badge>
            </div>
            <div className="record-meta">
              <div>
                <span>Имейл</span>
                {person.email}
              </div>
              <div>
                <span>Роля</span>
                {ROLE_LABELS[person.role]}
              </div>
              <div>
                <span>Отдел</span>
                {person.department}
              </div>
              <div>
                <span>Създаден</span>
                {formatDate(person.createdAt)}
              </div>
            </div>
            {isAdmin && (
              <div className="row-actions">
                <Button size="sm" variant="outline-primary" onClick={() => setEditing(person)}>
                  Редакция
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() =>
                    run(() =>
                      api(`/users/${person.id}/status`, {
                        method: 'PATCH',
                        auth: credentials,
                        body: { status: person.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
                      }),
                      'Статусът на потребителя е обновен.',
                    )
                  }
                >
                  {person.status === 'ACTIVE' ? 'Деактивирай' : 'Активирай'}
                </Button>
                {person.id !== user.id && (
                  <Button size="sm" variant="outline-danger" onClick={() => setPersonToDelete(person)}>
                    Изтрий
                  </Button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="only-desktop bg-white border rounded">
        <Table className="mb-0 align-middle">
          <thead>
            <tr>
              <SortHeader label="Име" column="name" sort={sort} onSort={changeSort} />
              <SortHeader label="Имейл" column="email" sort={sort} onSort={changeSort} />
              <SortHeader label="Роля" column="role" sort={sort} onSort={changeSort} />
              <SortHeader label="Отдел" column="department" sort={sort} onSort={changeSort} />
              <SortHeader label="Статус" column="status" sort={sort} onSort={changeSort} />
              <SortHeader label="Създаден" column="createdAt" type="date" sort={sort} onSort={changeSort} />
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((person) => (
              <tr key={person.id}>
                <td>
                  {person.firstName} {person.lastName}
                </td>
                <td>{person.email}</td>
                <td>{ROLE_LABELS[person.role]}</td>
                <td>{person.department}</td>
                <td>
                  <Badge bg={statusBadge(person.status)}>{USER_STATUS_LABELS[person.status]}</Badge>
                </td>
                <td>{formatDate(person.createdAt)}</td>
                {isAdmin && (
                  <td>
                    <div className="row-actions">
                    <Button size="sm" variant="outline-primary" onClick={() => setEditing(person)}>
                      Редакция
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() =>
                        run(() =>
                          api(`/users/${person.id}/status`, {
                            method: 'PATCH',
                            auth: credentials,
                            body: { status: person.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
                          }),
                          'Статусът на потребителя е обновен.',
                        )
                      }
                    >
                      {person.status === 'ACTIVE' ? 'Деактивирай' : 'Активирай'}
                    </Button>
                    {person.id !== user.id && (
                      <Button size="sm" variant="outline-danger" onClick={() => setPersonToDelete(person)}>
                        Изтрий
                      </Button>
                    )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <LazySentinel enabled={!loading && !loadingMore && page + 1 < totalPages} watch={page} onVisible={loadMore} />
      {loadingMore && <p className="text-secondary text-center mb-0">Зареждане...</p>}
      <Pager page={page} totalPages={totalPages} disabled={loading || loadingMore} onPage={goToPage} />

      <Modal show={personToDelete !== null} onHide={() => setPersonToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Изтриване на потребител</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {personToDelete && (
            <>
              {personToDelete.firstName} {personToDelete.lastName} се изтрива заедно със заявките, които е създал, и с
              коментарите му. Ако друга заявка е била възложена на него, тя остава и става отново отворена.
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setPersonToDelete(null)}>
            Отказ
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const person = personToDelete
              setPersonToDelete(null)
              run(
                () => api(`/users/${person.id}`, { method: 'DELETE', auth: credentials }),
                'Потребителят е изтрит.',
              )
            }}
          >
            Изтрий
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Form
          onSubmit={(event) => {
            event.preventDefault()
            run(async () => {
              await api('/users', {
                method: 'POST',
                auth: credentials,
                body: {
                  ...form,
                  firstName: form.firstName.trim(),
                  lastName: form.lastName.trim(),
                  email: form.email.trim(),
                  department: form.department.trim(),
                },
              })
              setForm(emptyUser)
              setShowCreate(false)
            }, 'Потребителят е създаден.')
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>Нов потребител</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <UserFields form={form} updateForm={updateForm} includePassword />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>
              Отказ
            </Button>
            <Button type="submit">Създай</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(editing)} onHide={() => setEditing(null)} centered>
        {editing && (
          <Form
            onSubmit={(event) => {
              event.preventDefault()
              run(async () => {
                await api(`/users/${editing.id}`, {
                  method: 'PUT',
                  auth: credentials,
                  body: {
                    firstName: editing.firstName.trim(),
                    lastName: editing.lastName.trim(),
                    email: editing.email.trim(),
                    role: editing.role,
                    department: editing.department.trim(),
                  },
                })
                setEditing(null)
              }, 'Потребителят е обновен.')
            }}
          >
            <Modal.Header closeButton>
              <Modal.Title>Редакция</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <UserFields
                form={editing}
                updateForm={(field, value) => setEditing((current) => ({ ...current, [field]: value }))}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setEditing(null)}>
                Отказ
              </Button>
              <Button type="submit">Запази</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </>
  )
}

function UserFields({ form, updateForm, includePassword = false }) {
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Име</Form.Label>
        <Form.Control
          value={form.firstName}
          maxLength={100}
          onChange={(event) => updateForm('firstName', event.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Фамилия</Form.Label>
        <Form.Control
          value={form.lastName}
          maxLength={100}
          onChange={(event) => updateForm('lastName', event.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Имейл</Form.Label>
        <Form.Control
          type="email"
          value={form.email}
          onChange={(event) => updateForm('email', event.target.value)}
          required
        />
      </Form.Group>
      {includePassword && (
        <Form.Group className="mb-3">
          <Form.Label>Парола</Form.Label>
          <Form.Control
            type="password"
            minLength={4}
            value={form.password}
            onChange={(event) => updateForm('password', event.target.value)}
            required
          />
          <Form.Text>Поне 4 символа.</Form.Text>
        </Form.Group>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Роля</Form.Label>
        <Form.Select value={form.role} onChange={(event) => updateForm('role', event.target.value)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group>
        <Form.Label>Отдел</Form.Label>
        <Form.Control
          value={form.department}
          onChange={(event) => updateForm('department', event.target.value)}
          required
        />
      </Form.Group>
    </>
  )
}
