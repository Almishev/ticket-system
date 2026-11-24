import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../auth'

const registerHref = '/api/auth/kinde/login?screen=register'
const loginHref = '/api/auth/kinde/login'

const shots = [
  {
    src: '/images/tickets.png',
    alt: 'Списък със заявки с номер, приоритет и статус',
    caption: 'Всички заявки на фирмата: номер, приоритет, статус, кой я е пуснал и на кого е възложена.',
  },
  {
    src: '/images/tickets-id.png',
    alt: 'Отворена заявка с описание, статус и възлагане',
    caption: 'В заявката са описанието, смяната на статус, възлагането и коментарите.',
  },
  {
    src: '/images/users.png',
    alt: 'Списък с потребители и техните роли',
    caption: 'Администраторът кани хората и им дава роля: служител, поддръжка или администратор.',
  },
  {
    src: '/images/categories.png',
    alt: 'Категории на заявките и техният статус',
    caption: 'Категория, която не ти трябва, се изключва и изчезва от новите заявки.',
  },
]

const questions = [
  ['Колко струва?', 'Безплатно е. Няма месечна такса за хелпдеска.'],
  ['За кого е?', 'За всяка фирма, в която хората съобщават проблем и някой трябва да го оправи.'],
  ['Какво ми трябва за регистрация?', 'Имейл и парола, после име на фирма, ЕИК и сфера на дейност. ЕИК е 9 цифри, или 13 за поделение.'],
  ['Кой вижда заявките?', 'Служителят вижда своите. Поддръжката и администраторът виждат всички на фирмата. Вътрешната бележка се вижда от поддръжката и администратора.'],
  ['Къде се пазят?', 'В Google Cloud. Входът с имейл и парола минава през Kinde.'],
]

function StartButton({ user, ready }) {
  if (ready && user) {
    const to = user.role === 'SUPER_ADMIN' ? '/companies' : '/tickets'
    const label = user.role === 'SUPER_ADMIN' ? 'Към фирмите' : 'Към заявките'
    return <Button as={Link} to={to}>{label}</Button>
  }
  return <Button as="a" href={registerHref}>Създай фирма</Button>
}

export default function HomePage() {
  const { user, ready } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) {
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">От Pirin Pixel</p>
          <h1>
            <span className="logo-mark" aria-hidden="true" />
            Хелпдеск
          </h1>
          <p className="hero-lead">Заявките към поддръжката на фирмата, с номер и отговорник.</p>
          <p className="hero-text">
            Служителят описва проблема. Поддръжката го поема и го довършва. Всяка заявка има номер, приоритет и статус. Вижда се кой я е пуснал, на кого е възложена и докъде е стигнала.
          </p>
          <div className="hero-actions">
            <StartButton user={user} ready={ready} />
            {!(ready && user) && (
              <p className="hero-register mb-0">
                Вече имаш профил? <a href={loginHref}>Вход</a>
              </p>
            )}
          </div>
        </div>
        <div className="hero-media">
          <img src="/images/help-desk.jpg" alt="Работа по заявка за поддръжка" />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-inner">
          <h2>За кого е</h2>
          <p className="landing-lead">
            За всеки бизнес с екип. Хотел, магазин, офис, сервиз, кухня. Заявката се пуска като съобщение, а фирмата вижда своите заявки отделно.
          </p>
        </div>
      </section>

      <section id="how" className="landing-section landing-alt">
        <div className="landing-inner">
          <h2>Как става</h2>
          <ol className="step-list">
            <li>
              <h3>Създаваш фирмата</h3>
              <p>Име, ЕИК и сфера на дейност. Първият профил е администратор.</p>
            </li>
            <li>
              <h3>Каниш екипа</h3>
              <p>Добавяш служители и поддръжка. Слагаш категории — техника, почистване, резервации или свои.</p>
            </li>
            <li>
              <h3>Заявката получава номер</h3>
              <p>Служителят пуска заявка. Тя получава номер INC-…. Поддръжката я възлага и я води, докато се затвори.</p>
            </li>
          </ol>
        </div>
      </section>

      <section id="product" className="landing-section">
        <div className="landing-inner">
          <h2>Какво се вижда</h2>
          <div className="shot-grid">
            {shots.map((shot) => (
              <figure key={shot.src}>
                <img src={shot.src} alt={shot.alt} />
                <figcaption>{shot.caption}</figcaption>
              </figure>
            ))}
          </div>

          <h2 className="landing-subhead">Три роли</h2>
          <ul className="role-grid">
            <li>
              <h3>Служител</h3>
              <p>Пуска заявка и вижда само своите. Пише коментар по тях.</p>
            </li>
            <li>
              <h3>Поддръжка</h3>
              <p>Вижда заявките на фирмата, възлага ги на колега от поддръжката, сменя статуса и оставя вътрешна бележка.</p>
            </li>
            <li>
              <h3>Администратор</h3>
              <p>Прави същото и добавя хора, категории и спира профил, когато човек напусне.</p>
            </li>
          </ul>

          <h2 className="landing-subhead">Пътят на заявката</h2>
          <ol className="status-path">
            <li>Отворена</li>
            <li>Възложена</li>
            <li>В процес</li>
            <li>Чака потребител</li>
            <li>Решена</li>
            <li>Затворена</li>
          </ol>
          <p className="landing-note">От отворена или възложена заявката може да се отмени.</p>
        </div>
      </section>

      <section id="price" className="landing-section landing-alt">
        <div className="landing-inner landing-narrow">
          <h2>Цена</h2>
          <p className="price-figure">0 €</p>
          <p className="landing-lead">Без абонамент. Създаваш фирмата и я ползваш.</p>
          <StartButton user={user} ready={ready} />
        </div>
      </section>

      <section id="faq" className="landing-section">
        <div className="landing-inner landing-narrow">
          <h2>Въпроси</h2>
          <div className="faq-list">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="landing-section landing-alt">
        <div className="landing-inner landing-narrow">
          <h2>За продукта</h2>
          <p className="landing-lead">
            Хелпдеск е продукт на <a href="https://www.pirinpixel.com/" target="_blank" rel="noreferrer">Pirin Pixel</a>, дигитална агенция на Антон Алмишев. Работи онлайн за фирми в цялата страна.
          </p>
        </div>
      </section>

      <section className="landing-close">
        <div className="landing-inner landing-narrow">
          <h2>Пусни първата заявка днес.</h2>
          <p>Създаваш фирмата, каниш хората и всеки проблем получава номер.</p>
          <StartButton user={user} ready={ready} />
        </div>
      </section>
    </div>
  )
}
