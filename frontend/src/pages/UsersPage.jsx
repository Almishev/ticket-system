import { useEffect, useMemo, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import SortHeader from '../components/SortHeader'
import { ROLE_LABELS, USER_STATUS_LABELS, formatDate, statusBadge } from '../labels'
import { nextSort, sortRows } from '../sort'

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
  const [users, setUsers] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState(null)
  const [sort, setSort] = useState({ key: 'name', type: 'text', direction: 'asc' })

  async function load() {
    const response = await api('/users', { auth: credentials })
    setUsers(response.data || [])
  }

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      return
    }
    load().catch((requestError) => toast.error(requestError.message))
  }, [credentials, user])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const sortedUsers = useMemo(
    () =>
      sortRows(users, {
        ...sort,
        key: (person) => {
          if (sort.key === 'name') return `${person.firstName} ${person.lastName}`
          if (sort.key === 'role') return ROLE_LABELS[person.role]
          if (sort.key === 'status') return USER_STATUS_LABELS[person.status]
          return person[sort.key]
        },
      }),
    [users, sort],
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

  if (user?.role === 'EMPLOYEE') {
    return <Alert variant="warning">Нямаш достъп до потребителите.</Alert>
  }

  return (
    <>
      <div className="page-heading">
        <h1 className="h3 mb-0">Потребители</h1>
        {isAdmin && <Button onClick={() => setShowCreate(true)}>Нов потребител</Button>}
      </div>
      <div className="bg-white border rounded">
        <Table responsive className="mb-0 align-middle">
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
                  <td className="text-end">
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => setEditing(person)}>
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
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

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
