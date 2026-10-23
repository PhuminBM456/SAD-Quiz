import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toQuestions } from './csv'
import * as sfx from './audio'

const SHAPES = ['▲', '◆', '●', '■']
const LB_KEY = 'quizblast-leaderboard'
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] } return a }
const loadLB = () => { try { return JSON.parse(localStorage.getItem(LB_KEY)) || [] } catch { return [] } }

export default function App() {
  const [all, setAll] = useState([])
  const [err, setErr] = useState('')
  const [screen, setScreen] = useState('menu') // menu | question | reveal | end
  const [name, setName] = useState(() => localStorage.getItem('quizblast-name') || '')
  const [cats, setCats] = useState([])
  const [count, setCount] = useState(10)
  const [deck, setDeck] = useState([])
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(0)
  const [last, setLast] = useState(null) // {choice, ok, pts}
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [log, setLog] = useState([])
  const [muted, setMuted] = useState(false)
  const [lb, setLb] = useState(loadLB)
  const startedAt = useRef(0)
  const lastTick = useRef(-1)

  const load = useCallback(text => {
    const qs = toQuestions(text)
    if (!qs.length) { setErr('ไม่พบคำถามที่ใช้ได้ใน CSV (ต้องมีคอลัมน์ category,question,a,b,c,d,answer,time)'); return }
    setErr(''); setAll(qs); setCats([...new Set(qs.map(q => q.category))])
  }, [])

  useEffect(() => {
    fetch('/questions.csv').then(r => r.text()).then(load).catch(() => setErr('โหลด questions.csv ไม่สำเร็จ'))
  }, [load])

  // start lobby music on first interaction (browsers block autoplay)
  useEffect(() => {
    const go = () => sfx.music('lobby')
    window.addEventListener('pointerdown', go, { once: true })
    return () => window.removeEventListener('pointerdown', go)
  }, [])

  const allCats = useMemo(() => [...new Set(all.map(q => q.category))], [all])
  const pool = useMemo(() => all.filter(q => cats.includes(q.category)), [all, cats])
  const q = deck[idx]

  const start = () => {
    sfx.unlock()
    localStorage.setItem('quizblast-name', name)
    const d = shuffle(pool).slice(0, count).map(x => {
      const order = shuffle(x.options.map((_, i) => i))
      return { ...x, options: order.map(i => x.options[i]), answer: order.indexOf(x.answer) }
    })
    setDeck(d); setIdx(0); setScore(0); setStreak(0); setLog([]); setLast(null)
    sfx.music('game'); setScreen('question')
  }

  // question timer
  useEffect(() => {
    if (screen !== 'question' || !q) return
    startedAt.current = Date.now(); lastTick.current = -1; setLeft(q.time)
    const id = setInterval(() => {
      const l = q.time - (Date.now() - startedAt.current) / 1000
      setLeft(Math.max(0, l))
      const s = Math.ceil(l)
      if (l > 0 && l <= 5 && s !== lastTick.current) { lastTick.current = s; sfx.tick() }
      if (l <= 0) { clearInterval(id); answer(null) }
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line
  }, [screen, idx])

  const answer = choice => {
    if (screen !== 'question' && choice !== null) return
    const used = (Date.now() - startedAt.current) / 1000
    const ok = choice === q.answer
    const ns = ok ? streak + 1 : 0
    const pts = ok ? Math.round(1000 * (1 - used / q.time / 2)) + Math.min(ns - 1, 5) * 100 : 0
    setStreak(ns); setScore(s => s + pts)
    setLast({ choice, ok, pts, ns })
    setLog(l => [...l, { q, choice, ok }])
    ok ? sfx.correct() : sfx.wrong()
    setScreen('reveal')
  }

  const next = useCallback(() => {
    if (idx + 1 >= deck.length) {
      const entry = { name: name || 'Player', score, date: new Date().toLocaleDateString() }
      const nl = [...lb, entry].sort((a, b) => b.score - a.score).slice(0, 10)
      localStorage.setItem(LB_KEY, JSON.stringify(nl)); setLb(nl)
      sfx.music('lobby'); sfx.fanfare(); setScreen('end')
    } else { setIdx(i => i + 1); setScreen('question') }
  }, [idx, deck.length, name, score, lb])

  useEffect(() => {
    const h = e => {
      if (screen === 'question' && q) {
        const i = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase())
        if (i >= 0 && i < q.options.length) answer(i)
      } else if (screen === 'reveal' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })

  const toggleMute = () => { const m = !muted; setMuted(m); sfx.setMuted(m) }
  const upload = e => { const f = e.target.files[0]; if (f) f.text().then(load) }
  const toggleCat = c => setCats(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])

  return (
    <div className="app">
      <button className="mute" onClick={toggleMute} aria-label="toggle sound">{muted ? '🔇' : '🔊'}</button>

      {screen === 'menu' && (
        <main className="card menu">
          <h1>⚡ QuizBlast</h1>
          <p className="sub">System Analysis & Design · Week 10–12</p>
          <input className="name" placeholder="ชื่อผู้เล่น / Nickname" value={name} maxLength={16} onChange={e => setName(e.target.value)} />
          <div className="chips">
            {allCats.map(c => <button key={c} className={'chip' + (cats.includes(c) ? ' on' : '')} onClick={() => toggleCat(c)}>{c}</button>)}
          </div>
          <label className="count">จำนวนข้อ: <b>{Math.min(count, pool.length)}</b> / {pool.length}
            <input type="range" min="3" max={Math.max(3, pool.length)} value={Math.min(count, pool.length)} onChange={e => setCount(+e.target.value)} />
          </label>
          {err && <p className="err">{err}</p>}
          <button className="play" disabled={!pool.length} onClick={start}>▶ เริ่มเล่น</button>
          <label className="upload">📄 ใช้ไฟล์ CSV ของคุณเอง<input type="file" accept=".csv,text/csv" onChange={upload} hidden /></label>
          {lb.length > 0 && <Board lb={lb} />}
        </main>
      )}

      {(screen === 'question' || screen === 'reveal') && q && (
        <main className="game">
          <header className="top">
            <span>{idx + 1} / {deck.length}</span>
            <span className="cat">{q.category}</span>
            <span>🔥 {streak} · {score.toLocaleString()} pts</span>
          </header>
          <div className="bar"><i style={{ width: (screen === 'question' ? left / q.time * 100 : 0) + '%' }} className={left <= 5 ? 'hot' : ''} /></div>
          <h2 className="q">{q.text}</h2>
          <div className="timer">{screen === 'question' ? Math.ceil(left) : ''}</div>
          <div className="grid">
            {q.options.map((o, i) => {
              let cls = 'ans c' + i
              if (screen === 'reveal') cls += i === q.answer ? ' right' : ' dim' + (i === last.choice ? ' mine' : '')
              return <button key={i} className={cls} disabled={screen === 'reveal'} onClick={() => answer(i)}><span className="shape">{SHAPES[i]}</span><span>{o}</span></button>
            })}
          </div>
          {screen === 'reveal' && (
            <div className={'reveal ' + (last.ok ? 'ok' : 'no')}>
              <b>{last.choice === null ? '⏰ หมดเวลา!' : last.ok ? '✅ ถูกต้อง!' : '❌ ผิด'}</b>
              <span>{last.ok ? `+${last.pts} pts${last.ns > 1 ? ` · 🔥 streak x${last.ns}` : ''}` : 'ไม่ได้คะแนน'}</span>
              <button onClick={next}>{idx + 1 >= deck.length ? 'ดูผลลัพธ์' : 'ข้อต่อไป ↵'}</button>
            </div>
          )}
        </main>
      )}

      {screen === 'end' && (
        <main className="card menu">
          <h1>🏆 {name || 'Player'}</h1>
          <p className="big">{score.toLocaleString()} pts</p>
          <p className="sub">ถูก {log.filter(l => l.ok).length} / {log.length} ข้อ</p>
          <Board lb={lb} />
          {log.some(l => !l.ok) && (
            <details className="review"><summary>ทบทวนข้อที่ผิด</summary>
              {log.filter(l => !l.ok).map((l, i) => <p key={i}><b>{l.q.text}</b><br />✔ {l.q.options[l.q.answer]}</p>)}
            </details>
          )}
          <button className="play" onClick={start}>🔁 เล่นอีกครั้ง</button>
          <button className="ghost" onClick={() => { sfx.music('lobby'); setScreen('menu') }}>เมนูหลัก</button>
        </main>
      )}
    </div>
  )
}

function Board({ lb }) {
  return (
    <div className="board"><h3>🏅 Top 10 (เครื่องนี้)</h3>
      <ol>{lb.map((e, i) => <li key={i}><span>{e.name}</span><span>{e.score.toLocaleString()}</span></li>)}</ol>
    </div>
  )
}
