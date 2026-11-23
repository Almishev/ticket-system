import { useEffect, useState } from 'react'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'
import { api } from '../Helper/api'
import { useAuth } from '../auth'
import MobileSort from '../components/MobileSort'
import SortHeader from '../components/SortHeader'
import { COMPANY_STATUS_LABELS, formatDate, statusBadge } from '../Helper/labels'
import { nextSort, sortRows } from '../Helper/sort'
import { useToast } from '../toast'

export default function CompaniesPage() {
  const { credentials } = useAuth()
  const toast = useToast()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [companyToDelete, setCompanyToDelete] = useState(null)
  const [confirmName, setConfirmName] = useState('')
  const [confirmEik, setConfirmEik] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)
  const [sort, setSort] = useState({ key: 'createdAt', type: 'date', direction: 'desc' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const response = await api('/companies', { auth: credentials })
        if (!cancelled) {
          setCompanies(response.data || [])
        }
      } catch (requestError) {
        if (!cancelled) {
          toast.error(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [credentials, toast])

  const sorted = sortRows(companies, sort)
  const deleteReady =
    companyToDelete &&
    confirmName.trim() === companyToDelete.name &&
    confirmEik.trim() === companyToDelete.eik

  function changeSort(key, type) {
    setSort((current) => nextSort(current, key, type))
  }

  function openDelete(company) {
    setCompanyToDelete(company)
    setConfirmName('')
    setConfirmEik('')
  }

  async function reload() {
    const response = await api('/companies', { auth: credentials })
    setCompanies(response.data || [])
  }

  async function changeStatus(company) {
    try {
      await api(`/companies/${company.id}/status`, {
        method: 'PATCH',
        auth: credentials,
        body: { status: company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
      })
      await reload()
      toast.success(company.status === 'ACTIVE' ? 'Фирмата е спряна.' : 'Фирмата е активирана.')
    } catch (requestError) {
      toast.error(requestError.message)
    }
  }

  async function removeCompany() {
    setPendingDelete(true)
    try {
      await api(`/companies/${companyToDelete.id}`, { method: 'DELETE', auth: credentials })
      setCompanyToDelete(null)
      await reload()
      toast.success('Фирмата е изтрита.')
    } catch (requestError) {
      toast.error(requestError.message)
    } finally {
      setPendingDelete(false)
    }
  }

  function actions(company) {
    return (
      <>
        <Button size="sm" variant="outline-secondary" onClick={() => changeStatus(company)}>
          {company.status === 'ACTIVE' ? 'Деактивирай' : 'Активирай'}
        </Button>
        <Button size="sm" variant="outline-danger" onClick={() => openDelete(company)}>
          Изтрий
        </Button>
      </>
    )
  }

  return (
    <>
      <div className="page-heading">
        <h1 className="h3 mb-0">Фирми</h1>
      </div>
      <MobileSort
        sort={sort}
        onSort={changeSort}
        options={[
          { key: 'name', label: 'Име', type: 'text' },
          { key: 'eik', label: 'ЕИК', type: 'text' },
          { key: 'activity', label: 'Сфера на дейност', type: 'text' },
          { key: 'status', label: 'Статус', type: 'text' },
          { key: 'createdAt', label: 'Дата', type: 'date' },
        ]}
      />
      {loading && <p className="text-secondary">Зареждане...</p>}
      {!loading && sorted.length === 0 && <p className="text-secondary">Няма регистрирани фирми.</p>}

      <div className="only-mobile record-list">
        {sorted.map((company) => (
          <article key={company.id} className="record-card">
            <div className="record-card-top">
              <strong>{company.name}</strong>
              <Badge bg={statusBadge(company.status)}>{COMPANY_STATUS_LABELS[company.status]}</Badge>
            </div>
            <div className="record-meta">
              <div>
                <span>ЕИК</span>
                {company.eik}
              </div>
              <div>
                <span>Сфера на дейност</span>
                {company.activity || '—'}
              </div>
              <div>
                <span>Дата</span>
                {formatDate(company.createdAt)}
              </div>
            </div>
            <div className="record-actions">{actions(company)}</div>
          </article>
        ))}
      </div>

      <div className="only-desktop bg-white border rounded">
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              <SortHeader label="Име" column="name" sort={sort} onSort={changeSort} />
              <SortHeader label="ЕИК" column="eik" sort={sort} onSort={changeSort} />
              <SortHeader label="Сфера на дейност" column="activity" sort={sort} onSort={changeSort} />
              <SortHeader label="Статус" column="status" sort={sort} onSort={changeSort} />
              <SortHeader label="Дата" column="createdAt" type="date" sort={sort} onSort={changeSort} />
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.eik}</td>
                <td>{company.activity || '—'}</td>
                <td>
                  <Badge bg={statusBadge(company.status)}>{COMPANY_STATUS_LABELS[company.status]}</Badge>
                </td>
                <td>{formatDate(company.createdAt)}</td>
                <td>
                  <div className="d-flex gap-2 justify-content-end">{actions(company)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={companyToDelete !== null} onHide={() => setCompanyToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Изтриване на фирма</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {companyToDelete && (
            <>
              <p>
                Ще се изтрият потребителите, категориите, заявките и коментарите на{' '}
                <strong>{companyToDelete.name}</strong>, ЕИК <strong>{companyToDelete.eik}</strong>.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Име на фирма</Form.Label>
                <Form.Control value={confirmName} onChange={(event) => setConfirmName(event.target.value)} />
              </Form.Group>
              <Form.Group>
                <Form.Label>ЕИК</Form.Label>
                <Form.Control
                  value={confirmEik}
                  inputMode="numeric"
                  maxLength={13}
                  onChange={(event) => setConfirmEik(event.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setCompanyToDelete(null)}>
            Отказ
          </Button>
          <Button variant="danger" disabled={!deleteReady || pendingDelete} onClick={removeCompany}>
            {pendingDelete ? 'Изтриване...' : 'Изтрий'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
