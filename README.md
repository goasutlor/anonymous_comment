# Anonymous Webboard (ASC3 & ATF)

กระดานแสดงความคิดเห็นแบบไม่ระบุตัวตน พร้อมโหวตเห็นด้วย/ไม่เห็นด้วย ข้อมูลเก็บในไฟล์ JSON บนเซิร์ฟเวอร์

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

**หมายเหตุ:** ข้อมูลโหวตและความเห็นเก็บในไฟล์ `data/data.json` บนเซิร์ฟเวอร์ ถ้า Railway restart หรือ redeploy ข้อมูลอาจหาย (ถ้าไม่มี persistent volume) ถ้าต้องการเก็บถาวรอาจพิจารณาใช้ Redis หรือ database แทนไฟล์ในอนาคต
