import { useRef, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const logo = require('../assets/support_icon.svg')
const logoLight = require('../assets/support_icon_light.svg')
const heroPhoto = require('../assets/landing/help-desk.jpg')

const sections = [
  ['how', 'Как работи'],
  ['product', 'Какво включва'],
  ['price', 'Цена'],
  ['faq', 'Въпроси'],
]

const shots = [
  {
    source: require('../assets/landing/tickets.png'),
    aspect: 1906 / 575,
    caption: 'Всички заявки на фирмата: номер, приоритет, статус, кой я е пуснал и на кого е възложена.',
  },
  {
    source: require('../assets/landing/tickets-id.png'),
    aspect: 1913 / 906,
    caption: 'В заявката са описанието, смяната на статус, възлагането и коментарите.',
  },
  {
    source: require('../assets/landing/users.png'),
    aspect: 1917 / 591,
    caption: 'Администраторът кани хората и им дава роля: служител, поддръжка или администратор.',
  },
  {
    source: require('../assets/landing/categories.png'),
    aspect: 1918 / 470,
    caption: 'Категория, която не ти трябва, се изключва и изчезва от новите заявки.',
  },
]

const steps = [
  ['Създаваш фирмата', 'Име, ЕИК и сфера на дейност. Първият профил е администратор.'],
  ['Каниш екипа', 'Добавяш служители и поддръжка. Слагаш категории — техника, почистване, резервации или свои.'],
  ['Заявката получава номер', 'Служителят пуска заявка. Тя получава номер INC-…. Поддръжката я възлага и я води, докато се затвори.'],
]

const roles = [
  ['Служител', 'Пуска заявка и вижда само своите. Пише коментар по тях.'],
  ['Поддръжка', 'Вижда заявките на фирмата, възлага ги на колега от поддръжката, сменя статуса и оставя вътрешна бележка.'],
  ['Администратор', 'Прави същото и добавя хора, категории и спира профил, когато човек напусне.'],
]

const statuses = ['Отворена', 'Възложена', 'В процес', 'Чака потребител', 'Решена', 'Затворена']

const questions = [
  ['Колко струва?', 'Безплатно е. Няма месечна такса за хелпдеска.'],
  ['За кого е?', 'За всяка фирма, в която хората съобщават проблем и някой трябва да го оправи.'],
  ['Какво ми трябва за регистрация?', 'Имейл и парола, после име на фирма, ЕИК и сфера на дейност. ЕИК е 9 цифри, или 13 за поделение.'],
  ['Кой вижда заявките?', 'Служителят вижда своите. Поддръжката и администраторът виждат всички на фирмата. Вътрешната бележка се вижда от поддръжката и администратора.'],
  ['Къде се пазят?', 'В Google Cloud. Входът с имейл и парола минава през Kinde.'],
]

const ink = '#2c3e50'
const muted = '#5c6770'
const blue = '#3498db'
const line = '#e6eaf0'

function StartButton({ user, onRegister, onEnterApp }) {
  if (user) {
    const label = user.role === 'SUPER_ADMIN' ? 'Към фирмите' : 'Към заявките'
    return (
      <Pressable onPress={onEnterApp} style={buttonStyle}>
        <Text style={buttonText}>{label}</Text>
      </Pressable>
    )
  }
  return (
    <Pressable onPress={onRegister} style={buttonStyle}>
      <Text style={buttonText}>Създай фирма</Text>
    </Pressable>
  )
}

export default function Landing({ user, message, onLogin, onRegister, onEnterApp }) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const wide = width >= 900
  const heroRow = width >= 760
  const scrollRef = useRef(null)
  const spots = useRef({})
  const [menuOpen, setMenuOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)
  const year = new Date().getFullYear()

  function jump(id) {
    setMenuOpen(false)
    scrollRef.current?.scrollTo({ y: Math.max((spots.current[id] || 0) - 8, 0), animated: true })
  }

  function mark(id) {
    return (event) => {
      spots.current[id] = event.nativeEvent.layout.y
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ backgroundColor: ink, paddingTop: insets.top }}>
        <View style={{ minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!wide && (
            <Pressable onPress={() => setMenuOpen((open) => !open)} hitSlop={8} accessibilityLabel={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}>
              <Text style={{ color: '#fff', fontSize: 22, width: 28 }}>{menuOpen ? '✕' : '☰'}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: wide ? undefined : 1 }}>
            <Image source={logoLight} style={{ width: 28, height: 28 }} contentFit="contain" />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600' }}>Хелпдеск</Text>
          </Pressable>
          {wide && (
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 22 }}>
              {sections.map(([id, label]) => (
                <Pressable key={id} onPress={() => jump(id)}>
                  <Text style={navText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable onPress={user ? onEnterApp : onLogin} style={navButton}>
            <Text style={navButtonText}>{user ? (user.role === 'SUPER_ADMIN' ? 'Фирми' : 'Заявки') : 'Вход'}</Text>
          </Pressable>
        </View>
        {!wide && menuOpen && (
          <View style={{ backgroundColor: ink, paddingBottom: 8 }}>
            {sections.map(([id, label]) => (
              <Pressable key={id} onPress={() => jump(id)} style={{ paddingVertical: 12, paddingHorizontal: 20 }}>
                <Text style={navText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <View style={heroRow ? { flexDirection: 'row', minHeight: 560, borderBottomWidth: 1, borderBottomColor: line } : { borderBottomWidth: 1, borderBottomColor: line }}>
          {!heroRow && <Image source={heroPhoto} style={{ width: '100%', height: 220 }} contentFit="cover" />}
          <View style={{ flex: heroRow ? 1 : undefined, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 8 }}>
            <Text style={{ color: blue, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>От Pirin Pixel</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={logo} style={{ width: 42, height: 42 }} contentFit="contain" />
              <Text style={{ color: ink, fontSize: 40, fontWeight: '700' }}>Хелпдеск</Text>
            </View>
            <Text style={{ color: ink, fontSize: 18, fontWeight: '600', lineHeight: 24 }}>Заявките към поддръжката на фирмата, с номер и отговорник.</Text>
            <Text style={{ color: muted, fontSize: 15, lineHeight: 22, maxWidth: 460 }}>
              Служителят описва проблема. Поддръжката го поема и го довършва. Всяка заявка има номер, приоритет и статус. Вижда се кой я е пуснал, на кого е възложена и докъде е стигнала.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <StartButton user={user} onRegister={onRegister} onEnterApp={onEnterApp} />
              {!user && (
                <Text style={{ color: muted }}>
                  Вече имаш профил?{' '}
                  <Text onPress={onLogin} style={{ color: blue, fontWeight: '700' }}>Вход</Text>
                </Text>
              )}
            </View>
            {!!message && <Text style={{ color: '#dc2626' }}>{message}</Text>}
          </View>
          {heroRow && <Image source={heroPhoto} style={{ flex: 1.05, minHeight: 560 }} contentFit="cover" />}
        </View>

        <View style={section}>
          <Text style={heading}>За кого е</Text>
          <Text style={lead}>За всеки бизнес с екип. Хотел, магазин, офис, сервиз, кухня. Заявката се пуска като съобщение, а фирмата вижда своите заявки отделно.</Text>
        </View>

        <View onLayout={mark('how')} style={[section, { backgroundColor: '#f5f5f5' }]}>
          <Text style={heading}>Как става</Text>
          <View style={wide ? { flexDirection: 'row', gap: 16 } : { gap: 16 }}>
            {steps.map(([title, text], index) => (
              <View key={title} style={[card, wide && { flex: 1 }]}>
                <Text style={cardTitle}><Text style={{ color: blue }}>{index + 1}. </Text>{title}</Text>
                <Text style={cardText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View onLayout={mark('product')} style={section}>
          <Text style={heading}>Какво се вижда</Text>
          <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 22 } : { gap: 22 }}>
            {shots.map((shot) => (
              <View key={shot.caption} style={wide ? { width: '48%' } : undefined}>
                <Image source={shot.source} style={{ width: '100%', aspectRatio: shot.aspect, borderRadius: 8, borderWidth: 1, borderColor: line, backgroundColor: '#fff' }} contentFit="contain" />
                <Text style={[cardText, { marginTop: 10 }]}>{shot.caption}</Text>
              </View>
            ))}
          </View>

          <Text style={[heading, { marginTop: 48 }]}>Три роли</Text>
          <View style={wide ? { flexDirection: 'row', gap: 16 } : { gap: 16 }}>
            {roles.map(([title, text]) => (
              <View key={title} style={[card, wide && { flex: 1 }]}>
                <Text style={cardTitle}>{title}</Text>
                <Text style={cardText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={[heading, { marginTop: 48 }]}>Пътят на заявката</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {statuses.map((status, index) => (
              <View key={status} style={pill}>
                <Text style={{ color: ink, fontWeight: '600' }}>{index > 0 ? '→  ' : ''}{status}</Text>
              </View>
            ))}
          </View>
          <Text style={[cardText, { marginTop: 14 }]}>От отворена или възложена заявката може да се отмени.</Text>
        </View>

        <View onLayout={mark('price')} style={[section, { backgroundColor: '#f5f5f5', alignItems: 'flex-start' }]}>
          <Text style={heading}>Цена</Text>
          <Text style={{ color: ink, fontSize: 64, fontWeight: '700', lineHeight: 68 }}>0 €</Text>
          <Text style={[lead, { marginBottom: 18 }]}>Без абонамент. Създаваш фирмата и я ползваш.</Text>
          <StartButton user={user} onRegister={onRegister} onEnterApp={onEnterApp} />
        </View>

        <View onLayout={mark('faq')} style={section}>
          <Text style={heading}>Въпроси</Text>
          <View style={{ gap: 8 }}>
            {questions.map(([question, answer]) => {
              const open = openQuestion === question
              return (
                <Pressable key={question} onPress={() => setOpenQuestion(open ? null : question)} style={card}>
                  <Text style={cardTitle}>{open ? '▾ ' : '▸ '}{question}</Text>
                  {open && <Text style={[cardText, { marginTop: 8 }]}>{answer}</Text>}
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={[section, { backgroundColor: '#f5f5f5' }]}>
          <Text style={heading}>За продукта</Text>
          <Text style={lead}>
            Хелпдеск е продукт на{' '}
            <Text style={link} onPress={() => Linking.openURL('https://www.pirinpixel.com/')}>Pirin Pixel</Text>
            , дигитална агенция на Антон Алмишев. Работи онлайн за фирми в цялата страна.
          </Text>
        </View>

        <View style={{ backgroundColor: ink, paddingHorizontal: 24, paddingVertical: 56, alignItems: 'center', gap: 12 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center' }}>Пусни първата заявка днес.</Text>
          <Text style={{ color: '#ecf0f1', fontSize: 18, textAlign: 'center' }}>Създаваш фирмата, каниш хората и всеки проблем получава номер.</Text>
          <StartButton user={user} onRegister={onRegister} onEnterApp={onEnterApp} />
        </View>

        <View style={{ backgroundColor: ink, paddingHorizontal: 20, paddingVertical: 16, gap: 6, borderTopWidth: 1, borderTopColor: '#3d5166' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Image source={logoLight} style={{ width: 16, height: 16 }} contentFit="contain" />
            <Text style={{ color: '#ecf0f1', fontWeight: '600' }}>Хелпдеск</Text>
          </View>
          <Text style={{ color: '#ecf0f1' }}>
            продукт на <Text style={link} onPress={() => Linking.openURL('https://www.pirinpixel.com/')}>Pirin Pixel</Text>
            {' · '}
            <Text style={link} onPress={() => Linking.openURL('tel:+359877382224')}>0877 382 224</Text>
            {' · '}
            <Text style={link} onPress={() => Linking.openURL('mailto:pirinpixel@gmail.com')}>pirinpixel@gmail.com</Text>
          </Text>
          <Text style={{ color: '#ecf0f1' }}>© {year}</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const buttonStyle = { backgroundColor: blue, borderRadius: 4, paddingVertical: 10, paddingHorizontal: 16 }
const buttonText = { color: '#fff', fontWeight: '700', fontSize: 16 }
const navText = { color: '#ecf0f1', fontWeight: '700', fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }
const navButton = { marginLeft: 'auto', backgroundColor: blue, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 }
const navButtonText = { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }
const section = { paddingHorizontal: 20, paddingVertical: 48, gap: 16, backgroundColor: '#fff' }
const heading = { color: ink, fontSize: 28, fontWeight: '700' }
const lead = { color: '#3d4853', fontSize: 18, lineHeight: 28 }
const card = { backgroundColor: '#fff', borderWidth: 1, borderColor: line, borderRadius: 8, padding: 16, gap: 8 }
const cardTitle = { color: ink, fontSize: 18, fontWeight: '700' }
const cardText = { color: muted, lineHeight: 22 }
const pill = { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d5dde6', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }
const link = { color: blue, fontWeight: '700' }
