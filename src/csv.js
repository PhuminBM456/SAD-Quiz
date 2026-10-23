// Minimal RFC-4180 CSV parser (handles quotes, commas and newlines inside quotes)
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false
  text = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false }
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(x => x.trim() !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some(x => x.trim() !== '')) rows.push(row)
  return rows
}

// columns: category,question,a,b,c,d,answer,time   (answer = A/B/C/D, time = seconds)
export function toQuestions(text) {
  const [head, ...rows] = parseCSV(text)
  const h = head.map(x => x.trim().toLowerCase())
  const col = n => h.indexOf(n)
  return rows.map((r, i) => {
    const g = n => (r[col(n)] ?? '').trim()
    const options = ['a', 'b', 'c', 'd'].map(g).filter(Boolean)
    const ans = 'ABCD'.indexOf(g('answer').toUpperCase())
    return { id: i, category: g('category') || 'General', text: g('question'), options, answer: ans, time: Math.max(5, parseInt(g('time')) || 20) }
  }).filter(q => q.text && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length)
}
