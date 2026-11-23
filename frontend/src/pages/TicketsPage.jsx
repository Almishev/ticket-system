import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import { api } from '../Helper/api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import MobileSort from '../components/MobileSort'
import SortHeader from '../components/SortHeader'
import { PRIORITY_LABELS, TICKET_STATUS_LABELS, formatDate, statusBadge } from '../Helper/labels'
import { LazySentinel, Pager, pageQuery, useLazyPage } from '../paging'
import { nextSort } from '../Helper/sort'

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
  const [categories, setCategories] = useState([])
  const employee = user?.role === 'EMPLOYEE'
  const [mineOnly, setMineOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyTicket)
  const [pending, setPending] = useState(false)
  const [sort, setSort] = useState({ key: 'createdAt', type: 'date', direction: 'desc' })

  const {
    items: tickets,
    page,
    totalPages,
    total,
    loading,
    loadingMore,
    loadMore,
    goToPage,
  } = useLazyPage(
    async (nextPage, size) => {
      const query = pageQuery(nextPage, size, sort)
      const path = employee || mineOnly ? `/tickets/my?userId=${user.id}&${query}` : `/tickets?${query}`
      try {
        const response = await api(path, { auth: credentials })
        return response.data
      } catch (requestError) {
        toast.error(requestError.message)
        throw requestError
      }
    },
    [credentials, employee, mineOnly, sort.key, sort.direction, user?.id, toast],
    !!user,
  )

  useEffect(() => {
    let cancelled = false
    api('/categories', { auth: credentials })
      .then((response) => {
        if (!cancelled) {
          setCategories(response.data || [])
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          toast.error(requestError.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [credentials, toast])

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
      goToPage(0)
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

  const sortedTickets = tickets

  return (
    <>
      <div className="page-heading">
        <div>
          <h1 className="h3 mb-1">Заявки</h1>
          <p className="text-secondary mb-0">{total} записа</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Нова заявка</Button>
      </div>

      {!employee && (
        <div className="btn-group mb-3">
          <Button variant={mineOnly ? 'outline-primary' : 'primary'} onClick={() => setMineOnly(false)}>
            Всички
          </Button>
          <Button variant={mineOnly ? 'primary' : 'outline-primary'} onClick={() => setMineOnly(true)}>
            Моите
          </Button>
        </div>
      )}

      <MobileSort
        sort={sort}
        onSort={(key, type) => setSort((current) => nextSort(current, key, type))}
        options={[
          { key: 'ticketNumber', label: 'Номер', type: 'text' },
          { key: 'title', label: 'Заглавие', type: 'text' },
          { key: 'priority', label: 'Приоритет', type: 'priority' },
          { key: 'status', label: 'Статус', type: 'text' },
          { key: 'categoryName', label: 'Категория', type: 'text' },
          { key: 'createdByName', label: 'Създал', type: 'text' },
          { key: 'assignedToName', label: 'Възложен', type: 'text' },
          { key: 'createdAt', label: 'Дата', type: 'date' },
        ]}
      />

      <div className="only-mobile record-list">
        {!loading && sortedTickets.length === 0 && <p className="text-secondary text-center py-4 mb-0">Няма заявки</p>}
        {loading && sortedTickets.length === 0 && <p className="text-secondary text-center py-4 mb-0">Зареждане...</p>}
        {sortedTickets.map((ticket) => (
          <button key={ticket.id} type="button" className="record-card" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            <div className="record-card-top">
              <strong>{ticket.ticketNumber}</strong>
              <span className="record-badges">
                <Badge bg={statusBadge(ticket.priority)}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                <Badge bg={statusBadge(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
              </span>
            </div>
            <p className="record-title">{ticket.title}</p>
            <div className="record-meta">
              <div>
                <span>Категория</span>
                {ticket.categoryName}
              </div>
              <div>
                <span>Създал</span>
                {ticket.createdByName}
              </div>
              <div>
                <span>Възложен</span>
                {ticket.assignedToName || '—'}
              </div>
              <div>
                <span>Дата</span>
                {formatDate(ticket.createdAt)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="only-desktop bg-white border rounded">
        <Table hover className="mb-0 align-middle">
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
            {loading && sortedTickets.length === 0 && (
              <tr>
                <td colSpan={8} className="text-secondary text-center py-4">
                  Зареждане...
                </td>
              </tr>
            )}
            {!loading && tickets.length === 0 && (
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

      <LazySentinel enabled={!loading && !loadingMore && page + 1 < totalPages} watch={page} onVisible={loadMore} />
      {loadingMore && <p className="text-secondary text-center mb-0">Зареждане...</p>}
      <Pager page={page} totalPages={totalPages} disabled={loading || loadingMore} onPage={goToPage} />

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
