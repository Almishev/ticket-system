import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import SortHeader from '../components/SortHeader'
import { PRIORITY_LABELS, TICKET_STATUS_LABELS, formatDate, statusBadge } from '../labels'
import { nextSort, sortRows } from '../sort'

const emptyTicket = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  categoryId: '',
}

export default function TicketsPage() {
  const { credentials, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [mineOnly, setMineOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyTicket)
  const [pending, setPending] = useState(false)
  const [sort, setSort] = useState({ key: 'createdAt', type: 'date', direction: 'desc' })

  async function loadTickets(onlyMine = mineOnly) {
    const path = onlyMine ? `/tickets/my?userId=${user.id}` : '/tickets'
    const response = await api(path, { auth: credentials })
    setTickets(response.data || [])
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ticketResponse, categoryResponse] = await Promise.all([
          api('/tickets', { auth: credentials }),
          api('/categories', { auth: credentials }),
        ])
        if (!cancelled) {
          setTickets(ticketResponse.data || [])
          setCategories(categoryResponse.data || [])
        }
      } catch (requestError) {
        if (!cancelled) {
          toast.error(requestError.message)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [credentials, toast])

  async function toggleMine(nextValue) {
    setMineOnly(nextValue)
    try {
      await loadTickets(nextValue)
    } catch (requestError) {
      toast.error(requestError.message)
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function createTicket(event) {
    event.preventDefault()
    setPending(true)
    try {
      await api('/tickets', {
        method: 'POST',
        auth: credentials,
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          categoryId: Number(form.categoryId),
          createdById: user.id,
        },
      })
      setShowCreate(false)
      setForm(emptyTicket)
      await loadTickets(mineOnly)
      toast.success('Заявката е създадена.')
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setPending(false)
    }
  }

  const activeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.active)
        .sort((left, right) => left.name.localeCompare(right.name, 'bg', { sensitivity: 'base' })),
    [categories],
  )

  const sortedTickets = useMemo(
    () =>
      sortRows(tickets, {
        ...sort,
        key: (ticket) => (sort.key === 'status' ? TICKET_STATUS_LABELS[ticket.status] : ticket[sort.key]),
      }),
    [tickets, sort],
  )

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="h3 mb-1">Заявки</h1>
          <p className="text-secondary mb-0">{tickets.length} записа</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Нова заявка</Button>
      </div>

      <div className="btn-group mb-3">
        <Button variant={mineOnly ? 'outline-primary' : 'primary'} onClick={() => toggleMine(false)}>
          Всички
        </Button>
        <Button variant={mineOnly ? 'primary' : 'outline-primary'} onClick={() => toggleMine(true)}>
          Моите
        </Button>
      </div>

      <div className="bg-white border rounded">
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              <SortHeader label="Номер" column="ticketNumber" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Заглавие" column="title" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Приоритет" column="priority" type="priority" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Статус" column="status" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Категория" column="categoryName" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Създал" column="createdByName" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Възложен" column="assignedToName" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
              <SortHeader label="Дата" column="createdAt" type="date" sort={sort} onSort={(key, type) => setSort((current) => nextSort(current, key, type))} />
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="text-secondary text-center py-4">
                  Няма заявки
                </td>
              </tr>
            )}
            {sortedTickets.map((ticket) => (
              <tr key={ticket.id} className="clickable-row" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                <td>{ticket.ticketNumber}</td>
                <td>{ticket.title}</td>
                <td>
                  <Badge bg={statusBadge(ticket.priority)}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                </td>
                <td>
                  <Badge bg={statusBadge(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
                </td>
                <td>{ticket.categoryName}</td>
                <td>{ticket.createdByName}</td>
                <td>{ticket.assignedToName || '—'}</td>
                <td>{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Form onSubmit={createTicket}>
          <Modal.Header closeButton>
            <Modal.Title>Нова заявка</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Заглавие</Form.Label>
              <Form.Control
                value={form.title}
                maxLength={200}
                onChange={(event) => updateForm('title', event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                maxLength={2000}
                onChange={(event) => updateForm('description', event.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Приоритет</Form.Label>
              <Form.Select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Категория</Form.Label>
              <Form.Select
                value={form.categoryId}
                onChange={(event) => updateForm('categoryId', event.target.value)}
                required
              >
                <option value="">Избери категория</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
              {activeCategories.length === 0 && (
                <Form.Text>Няма активна категория. Първо създай категория.</Form.Text>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>
              Отказ
            </Button>
            <Button type="submit" disabled={pending || activeCategories.length === 0}>
              {pending ? 'Запис...' : 'Създай'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}
