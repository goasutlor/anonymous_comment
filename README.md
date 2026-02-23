# Anonymous Webboard (ASC3 & ATF)

กระดานแสดงความคิดเห็น / Feedback แบบไม่ระบุตัวตน (มี Like / Love ต่อความเห็น) ข้อมูลเก็บในไฟล์ JSON บนเซิร์ฟเวอร์

## รัน locally

```bash
npm install
npm start
```

เปิด http://localhost:3000

## Deploy บน Railway

1. Push โค้ดไปที่ GitHub (หรือเชื่อม repo กับ Railway โดยตรง)
2. ใน Railway: New Project → Deploy from GitHub repo เลือก `anonymous_comment`
3. Railway จะ detect เป็น Node.js และรัน `npm start` อัตโนมัติ
4. กำหนดตัวแปร `PORT` ไม่จำเป็น — Railway ส่งให้อยู่แล้ว

**หมายเหตุ:** ข้อมูลความเห็นเก็บในไฟล์ `data/data.json` ถ้า Railway restart/redeploy ข้อมูลอาจหาย (ถ้าไม่มี persistent volume)

---

## วิธีล้างความเห็น (Clear Comment) — ให้เริ่ม 0 หลังเทส

ใช้เมื่อเทสเสร็จแล้วอยากเคลียร์ทุกความเห็นให้เป็น 0 ก่อนปล่อยให้คนเข้ามา

### 1. ตั้งรหัสล้างบน Railway

1. เข้าโปรเจกต์บน Railway → เลือก Service
2. ไปที่ **Variables** (หรือ Settings → Variables)
3. เพิ่มตัวแปร:
   - **Name:** `CLEAR_SECRET`
   - **Value:** รหัสที่คุณตั้งเอง (เช่น `mySecretClear2024`) — **อย่าแชร์รหัสนี้**
4. Save / Deploy ใหม่ถ้าจำเป็น

### 2. ล้างผ่านหน้าเว็บ

1. เปิด URL ของแอป (เช่น `https://xxx.up.railway.app`)
2. เลื่อนลงไปที่บล็อก **「ผู้ดูแล: ล้างความเห็นทั้งหมดเพื่อเริ่มใหม่」**
3. ในช่อง **รหัสล้างข้อมูล** ใส่รหัสที่ตรงกับ `CLEAR_SECRET`
4. กด **「ล้างข้อมูลและเริ่มใหม่」**
5. ถ้าสำเร็จจะขึ้นข้อความแล้วรีเฟรช — ความเห็นทั้งหมดจะหาย เหลือ 0

### 3. ล้างด้วยคำสั่ง (curl)

ถ้าอยู่ที่เครื่องตัวเองหรือมี curl:

```bash
curl -X POST https://你的網址.up.railway.app/api/clear \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"รหัสที่ตั้งใน CLEAR_SECRET\"}"
```

แทน `https://your-app.up.railway.app` ด้วย URL จริงของแอป

---

**สรุป:** ตั้ง `CLEAR_SECRET` ใน Railway แล้วใช้รหัสเดียวกันกรอกในช่องล้างข้อมูลบนหน้าเว็บ → กดล้าง = ความเห็นเป็น 0 พร้อมให้คนเริ่มเข้ามาได้
