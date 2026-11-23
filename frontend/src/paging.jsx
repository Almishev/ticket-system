import { useCallback, useEffect, useRef, useState } from 'react'

export const PAGE_SIZE = 20

export function pageQuery(page, size, sort) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: sort.key,
    direction: sort.direction,
  })
  return params.toString()
}

export function useLazyPage(request, deps, enabled = true) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestRef = useRef(request)
  const busy = useRef(false)
  const runId = useRef(0)
  requestRef.current = request

  const load = useCallback(async (nextPage, append) => {
    if (busy.current) {
      return
    }
    busy.current = true
    const id = ++runId.current
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      let data
      try {
        data = await requestRef.current(nextPage, PAGE_SIZE)
      } catch {
        return
      }
      if (id !== runId.current || !data) {
        return
      }
      const content = data.content || []
      if (!append && data.totalPages > 0 && nextPage > data.totalPages - 1) {
        busy.current = false
        await load(data.totalPages - 1, false)
        return
      }
      setItems((current) => (append ? [...current, ...content] : content))
      setPage(data.page ?? nextPage)
      setTotalPages(data.totalPages ?? 0)
      setTotal(data.totalElements ?? content.length)
    } finally {
      if (id === runId.current) {
        busy.current = false
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    load(0, false)
    return undefined
  }, [enabled, load, ...deps])

  const loadMore = useCallback(() => {
    if (busy.current || page + 1 >= totalPages) {
      return
    }
    load(page + 1, true)
  }, [load, page, totalPages])

  const goToPage = useCallback(
    (nextPage) => {
      document.querySelector('.app-main')?.scrollTo({ top: 0 })
      load(nextPage, false)
    },
    [load],
  )

  const refresh = useCallback(() => {
    return load(page, false)
  }, [load, page])

  return { items, page, totalPages, total, loading, loadingMore, loadMore, goToPage, refresh }
}

export function LazySentinel({ enabled, watch, onVisible }) {
  const ref = useRef(null)
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible

  useEffect(() => {
    const node = ref.current
    const main = document.querySelector('.app-main')
    if (!enabled || !node || !main) {
      return undefined
    }
    function check() {
      if (main.scrollTop <= 24) {
        return
      }
      const rect = node.getBoundingClientRect()
      const mainRect = main.getBoundingClientRect()
      if (rect.top <= mainRect.bottom + 160) {
        onVisibleRef.current()
      }
    }
    main.addEventListener('scroll', check, { passive: true })
    check()
    return () => main.removeEventListener('scroll', check)
  }, [enabled, watch])

  return <div ref={ref} className="lazy-sentinel" aria-hidden="true" />
}

export function Pager({ page, totalPages, disabled, onPage }) {
  if (totalPages <= 1) {
    return null
  }
  const buttons = []
  for (let index = 0; index < totalPages; index += 1) {
    buttons.push(index)
  }
  return (
    <nav className="pager" aria-label="Страници">
      <button type="button" disabled={disabled || page === 0} onClick={() => onPage(page - 1)}>
        Назад
      </button>
      {buttons.map((index) => (
        <button
          key={index}
          type="button"
          className={index === page ? 'active' : undefined}
          disabled={disabled}
          onClick={() => onPage(index)}
        >
          {index + 1}
        </button>
      ))}
      <button type="button" disabled={disabled || page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        Напред
      </button>
    </nav>
  )
}
