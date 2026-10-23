# ⚡ QuizBlast – Kahoot-style quiz (React + Vite)

เกมควิซสไตล์ Kahoot: จับเวลา, คะแนนตามความเร็ว, streak bonus, Top 10 (localStorage), เพลง/เอฟเฟกต์เสียง (สังเคราะห์ด้วย Web Audio ไม่ต้องมีไฟล์เสียง)

## รันในเครื่อง
```bash
npm install
npm run dev
```

## Deploy ขึ้น Vercel
1. push โฟลเดอร์นี้ขึ้น GitHub
2. vercel.com → Add New → Project → เลือก repo (Vercel ตรวจเจอ Vite อัตโนมัติ: build `npm run build`, output `dist`)
3. กด Deploy  — หรือใช้ CLI: `npx vercel --prod`

## เพิ่ม/แก้คำถาม
ทุกอย่างอยู่ใน `public/questions.csv` (แก้แล้ว deploy ใหม่ ไม่ต้องแก้โค้ด) หรือกด “ใช้ไฟล์ CSV ของคุณเอง” ในเมนูเพื่ออัปโหลดไฟล์ชั่วคราว

| คอลัมน์ | ความหมาย |
|---|---|
| category | หมวด (ใช้เป็นตัวกรองในเมนู) |
| question | โจทย์ (ถ้ามีคอมมา ให้ใส่ "..." ครอบ) |
| a,b,c,d | ตัวเลือก (เว้น c,d ว่างได้ = ข้อ 2 ตัวเลือก/ถูก-ผิด) |
| answer | A / B / C / D |
| time | วินาทีต่อข้อ (ขั้นต่ำ 5) |

ตัวเลือกจะถูกสลับตำแหน่งทุกครั้งที่เล่น คีย์ลัด: 1-4 หรือ A-D เลือกคำตอบ, Enter/Space ไปข้อต่อไป
