import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { api } from '../api'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import {
  NEXT_TICKET_STATUS,
  PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  VISIBILITY_LABELS,
  formatDate,
  statusBadge,
} from '../labels'
import { nextSort, sortRows } from '../sort'

export default function TicketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { credentials, user } = useAuth()
  const toast = useToast()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [users, setUsers] = useState([])
  const [nextStatus, setNextStatus] = useState('')
  const [supportUserId, setSupportUserId] = useState('')
  const [message, setMessage] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [failed, setFailed] = useState(false)
  const [commentSort, setCommentSort] = useState({ key: 'createdAt', type: 'date', direction: 'asc' })

  const canAssign = user?.role === 'ADMIN' || user?.role === 'SUPPORT'
  const isAdmin = user?.role === 'ADMIN'
  const employee = user?.role === 'EMPLOYEE'
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function load() {
    const ticketResponse = await api(`/tickets/${id}`, { auth: credentials })
    const commentResponse = await api(`/tickets/${id}/comments`, { auth: credentials })
    setTicket(ticketResponse.data)
    setComments(commentResponse.data || [])
    const allowed = NEXT_TICKET_STATUS[ticketResponse.data.status] || []
    setNextStatus(allowed[0] || '')
  }

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        await load()
        if (canAssign) {
          const userResponse = await api('/users', { auth: credentials })
          if (!cancelled) {
            setUsers(userResponse.data || [])
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setFailed(true)
          toast.error(requestError.message)
        }
      }
    }
    start()
    return () => {
      cancelled = true
    }
  }, [id, credentials, canAssign, toast])

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

  const sortedComments = useMemo(
    () =>
      sortRows(comments, {
        ...commentSort,
        key: (comment) => (commentSort.key === 'userName' ? comment.userName : comment.createdAt),
      }),
    [comments, commentSort],
  )

  if (!ticket) {
    return failed ? <p className="text-secondary">Заявката не е заредена.</p> : <p className="text-secondary">Зареждане...</p>
  }

  const allowedStatuses = NEXT_TICKET_STATUS[ticket.status] || []
  const closed = ticket.status === 'CLOSED' || ticket.status === 'CANCELLED'
  const supportUsers = users
    .filter((person) => person.role === 'SUPPORT' && person.status === 'ACTIVE')
    .sort((left, right) =>
      `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`, 'bg', {
        sensitivity: 'base',
      }),
    )

  return (
    <>
      <Link to="/tickets" className="link-secondary text-decoration-none">
        ← Към заявките
      </Link>
      <div className="page-heading mt-3">
        <div>
          <p className="text-secondary mb-1">{ticket.ticketNumber}</p>
          <h1 className="h3 mb-2">{ticket.title}</h1>
          <Badge bg={statusBadge(ticket.priority)} className="me-2">
            {PRIORITY_LABELS[ticket.priority]}
          </Badge>
          <Badge bg={statusBadge(ticket.status)}>{TICKET_STATUS_LABELS[ticket.status]}</Badge>
        </div>
        {isAdmin && (
          <Button variant="outline-danger" onClick={() => setConfirmDelete(true)}>
            Изтрий
          </Button>
        )}
      </div>

      <p className="bg-white border rounded p-3">{ticket.description}</p>

      <div className="ticket-meta mb-4">
        <div>
          <span>Категория</span>
          {ticket.categoryName}
        </div>
        <div>
          <span>Създал</span>
          {ticket.createdByName}
        </div>
        <div>
          <span>Възложен на</span>
          {ticket.assignedToName || '—'}
        </div>
        <div>
          <span>Създаден</span>
          {formatDate(ticket.createdAt)}
        </div>
        <div>
          <span>Обновен</span>
          {formatDate(ticket.updatedAt)}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <Card>
            <Card.Body>
              <Card.Title className="h6">Смяна на статус</Card.Title>
              {allowedStatuses.length === 0 ? (
                <p className="text-secondary mb-0">Този статус не се променя.</p>
              ) : (
                <Form
                  onSubmit={(event) => {
                    event.preventDefault()
                    run(async () => {
                      await api(`/tickets/${id}/status`, {
                        method: 'PUT',
                        auth: credentials,
                        body: { status: nextStatus },
                      })
                    }, 'Статусът е обновен.')
                  }}
                >
                  <Form.Select className="mb-3" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {TICKET_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Form.Select>
                  <Button type="submit">Запази статуса</Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </div>
        {canAssign && (
          <div className="col-lg-4">
            <Card>
              <Card.Body>
                <Card.Title className="h6">Възлагане</Card.Title>
                <Form
                  onSubmit={(event) => {
                    event.preventDefault()
                    run(async () => {
                      await api(`/tickets/${id}/assign`, {
                        method: 'PUT',
                        auth: credentials,
                        body: { supportUserId: Number(supportUserId) },
                      })
                    }, 'Заявката е възложена.')
                  }}
                >
                  <Form.Select
                    className="mb-3"
                    value={supportUserId}
                    onChange={(event) => setSupportUserId(event.target.value)}
                    required
                    disabled={closed}
                  >
                    <option value="">Избери поддръжка</option>
                    {supportUsers.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </Form.Select>
                  <Button type="submit" disabled={closed || supportUsers.length === 0}>
                    Възложи
                  </Button>
                  {supportUsers.length === 0 && (
                    <Form.Text className="d-block mt-2">Няма активен потребител с роля поддръжка.</Form.Text>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </div>
        )}
        {allowedStatuses.includes('CANCELLED') && (
          <div className="col-lg-4">
            <Card>
              <Card.Body>
                <Card.Title className="h6">Отказ</Card.Title>
                <p className="text-secondary">Статусът става „Отменен“. Заявката остава в списъка.</p>
                <Button
                  variant="outline-danger"
                  onClick={() =>
                    run(async () => {
                      await api(`/tickets/${id}/status`, {
                        method: 'PUT',
                        auth: credentials,
                        body: { status: 'CANCELLED' },
                      })
                    }, 'Заявката е отменена.')
                  }
                >
                  Отмени заявката
                </Button>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
        <h2 className="h5 mb-0">Коментари</h2>
        <div className="btn-group">
          <Button
            size="sm"
            variant={commentSort.key === 'createdAt' ? 'primary' : 'outline-primary'}
            onClick={() => setCommentSort((current) => nextSort(current, 'createdAt', 'date'))}
          >
            Дата{commentSort.key === 'createdAt' ? (commentSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
          </Button>
          <Button
            size="sm"
            variant={commentSort.key === 'userName' ? 'primary' : 'outline-primary'}
            onClick={() => setCommentSort((current) => nextSort(current, 'userName', 'text'))}
          >
            Име{commentSort.key === 'userName' ? (commentSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
          </Button>
        </div>
      </div>
      <div className="d-flex flex-column gap-2 mb-3">
        {sortedComments.length === 0 && <p className="text-secondary">Няма коментари.</p>}
        {sortedComments.map((comment) => (
          <div key={comment.id} className="bg-white border rounded p-3">
            <div className="d-flex justify-content-between gap-3">
              <strong>{comment.userName}</strong>
              <span className="text-secondary small">{formatDate(comment.createdAt)}</span>
            </div>
            <Badge bg={statusBadge(comment.visiblity)} className="my-2">
              {VISIBILITY_LABELS[comment.visiblity]}
            </Badge>
            <p className="mb-0">{comment.message}</p>
          </div>
        ))}
      </div>

      <Modal show={confirmDelete} onHide={() => setConfirmDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Изтриване на заявка</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ticket.ticketNumber} и коментарите към нея се изтриват.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setConfirmDelete(false)}>
            Отказ
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await api(`/tickets/${id}`, { method: 'DELETE', auth: credentials })
                setConfirmDelete(false)
                toast.success('Заявката е изтрита.')
                navigate('/tickets')
              } catch (requestError) {
                toast.error(requestError.message)
              }
            }}
          >
            Изтрий
          </Button>
        </Modal.Footer>
      </Modal>

      <Card>
        <Card.Body>
          <Form
            onSubmit={(event) => {
              event.preventDefault()
              run(async () => {
                await api(`/tickets/${id}/comments`, {
                  method: 'POST',
                  auth: credentials,
                  body: {
                    message: message.trim(),
                    userId: user.id,
                    visiblity: employee ? 'PUBLIC' : visibility,
                  },
                })
                setMessage('')
                setVisibility('PUBLIC')
              }, 'Коментарът е добавен.')
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label>Нов коментар</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex gap-2 align-items-center">
              <Form.Select
                style={{ maxWidth: 220 }}
                value={employee ? 'PUBLIC' : visibility}
                onChange={(event) => setVisibility(event.target.value)}
                disabled={employee}
              >
                <option value="PUBLIC">{VISIBILITY_LABELS.PUBLIC}</option>
                {!employee && <option value="INTERNAL">{VISIBILITY_LABELS.INTERNAL}</option>}
              </Form.Select>
              <Button type="submit">Добави</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  )
}
