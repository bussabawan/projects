# คู่มือโครงสร้างโปรเจกต์ (Next.js + MySQL + Docker)

โปรเจกต์นี้ถูกออกแบบและพัฒนาด้วย **Next.js (App Router)** ซึ่งมีแนวคิดการจัดการไฟล์ที่ค่อนข้างแตกต่างจาก Framework แบบดั้งเดิม แต่สามารถนำมาเทียบเคียงกับโครงสร้าง **MVC (Model-View-Controller)** ได้ดังนี้ครับ

## 📂 โครงสร้างโฟลเดอร์และไฟล์ (เทียบเคียง MVC)

```text
ot-project-2026/
├── app/                  # (View & Controller) โฟลเดอร์หลักของแอป
│   ├── api/              # (Controller) สำหรับสร้าง API Endpoint รับส่งข้อมูล
│   │   └── upload/
│   │       └── route.ts  # API สำหรับจัดการการอัปโหลดไฟล์
│   ├── globals.css       # ไฟล์ CSS หลัก
│   ├── page.module.css   # ไฟล์ CSS เฉพาะหน้าเว็บ (CSS Module)
│   └── page.tsx          # (View) หน้าจอ UI หลัก
├── lib/                  # (Model) สำหรับเก็บโค้ดที่เกี่ยวกับฐานข้อมูลหรือลอจิกส่วนกลาง
│   └── db.ts             # โค้ดเชื่อมต่อฐานข้อมูล MySQL
├── public/               # โฟลเดอร์เก็บไฟล์สาธารณะ (เข้าถึงได้ผ่าน URL โดยตรง)
│   └── uploads/          # โฟลเดอร์เก็บไฟล์ที่ผู้ใช้อัปโหลด
├── .env                  # ไฟล์ตั้งค่าตัวแปรระบบ (รหัสผ่านฐานข้อมูล, พอร์ต)
├── compose.yaml          # ไฟล์ตั้งค่า Docker (Database, Server)
└── Dockerfile            # ไฟล์สำหรับ Build โปรเจกต์ขึ้น Docker
```

---

## 🖥️ 1. View (หน้าจอแสดงผล)
**เก็บที่ไหน:** โฟลเดอร์ `app/` (ไฟล์ชื่อ `page.tsx` หรือ `layout.tsx`)
**วิธีแก้ไข/เพิ่มเติม:**
- หากต้องการสร้างหน้าใหม่ เช่น หน้า Dashboard ให้สร้างโฟลเดอร์ย่อยใน `app/` เช่น `app/dashboard/page.tsx` (จะเข้าถึงผ่าน URL: `/dashboard`)
- การตกแต่งหน้าจอ สามารถสร้างไฟล์ `.module.css` เพื่อกำหนดสไตล์เฉพาะหน้านั้นๆ ได้

## ⚙️ 2. Controller (จัดการลอจิกและ API)
**เก็บที่ไหน:** โฟลเดอร์ `app/api/` (ไฟล์ชื่อ `route.ts`)
**วิธีแก้ไข/เพิ่มเติม:**
- หากต้องการสร้าง API ใหม่ (เช่น จัดการข้อมูล User) ให้สร้างโฟลเดอร์ `app/api/users/route.ts` 
- ในไฟล์ `route.ts` คุณสามารถประกาศฟังก์ชัน `GET`, `POST`, `PUT`, `DELETE` เพื่อรองรับ HTTP Methods ต่างๆ 

## 🗄️ 3. Model & ฐานข้อมูล (การเชื่อมต่อและ CRUD)
**เก็บที่ไหน:** โฟลเดอร์ `lib/` (เช่น `lib/db.ts`)
**การเชื่อมต่อ:** โปรเจกต์นี้ใช้ไลบรารี `mysql2` โดยการตั้งค่าทั้งหมดถูกดึงมาจากไฟล์ `.env`

**วิธีจัดการข้อมูล (CRUD):** 
คุณสามารถเรียกใช้ `db.query()` ภายใน Controller (`app/api/.../route.ts`) เพื่อจัดการข้อมูลได้เลย ตัวอย่างเช่น:

*ตัวอย่างการนำเข้า Database:*
```typescript
import { db } from "@/lib/db";
```

* **C - Create (เพิ่มข้อมูล):**
  ```typescript
  const [result] = await db.query(
    "INSERT INTO users (name, email) VALUES (?, ?)", 
    ["John Doe", "john@example.com"]
  );
  ```
* **R - Read (ดึงข้อมูล):**
  ```typescript
  const [rows] = await db.query("SELECT * FROM users");
  ```
* **U - Update (แก้ไขข้อมูล):**
  ```typescript
  await db.query(
    "UPDATE users SET name = ? WHERE id = ?", 
    ["Jane Doe", 1]
  );
  ```
* **D - Delete (ลบข้อมูล):**
  ```typescript
  await db.query("DELETE FROM users WHERE id = ?", [1]);
  ```

---

## 📁 ระบบอัปโหลดไฟล์ (File Management)

ไฟล์ที่ผู้ใช้อัปโหลดจะถูกนำไปเก็บในเครื่องเซิร์ฟเวอร์ที่ตำแหน่ง `public/uploads/` (ซึ่งถูกผูก Volume ไว้ใน Docker เพื่อไม่ให้ไฟล์หาย)

**วิธีจัดการไฟล์ (เพิ่ม ลบ แก้ไข):**

1. **การเพิ่ม (Upload):**
   ใช้ API `app/api/upload/route.ts` (ที่เขียนไว้ให้แล้ว) API นี้จะรับไฟล์ผ่าน `FormData` แล้วใช้คำสั่ง `fs.writeFile` บันทึกไฟล์ลงในโฟลเดอร์ `public/uploads/` พร้อมสร้างชื่อใหม่ไม่ให้ซ้ำกัน
   
2. **การเรียกดู (Read/View):**
   เมื่อไฟล์ถูกเซฟใน `public/uploads/test.png` คุณสามารถดึงรูปไปแสดงในหน้าเว็บ (View) ได้โดยอ้างอิง URL ตรงๆ คือ `/uploads/test.png`

3. **การลบไฟล์ (Delete):**
   หากต้องการลบไฟล์ออกจากเครื่องเซิร์ฟเวอร์ ให้สร้าง API ใหม่ (เช่น ส่ง Request มาที่ `DELETE /api/upload`) และใช้คำสั่ง `fs.unlink()` ของ Node.js ดังนี้:
   ```typescript
   import { promises as fs } from 'fs';
   import path from 'path';

   // สมมติว่ารับชื่อไฟล์ที่ต้องการลบมาในตัวแปร filename
   const filename = "12345-test.png"; 
   const filePath = path.join(process.cwd(), "public/uploads", filename);
   
   try {
       await fs.unlink(filePath); // ลบไฟล์ออกจากโฟลเดอร์
   } catch (err) {
       console.error("ลบไฟล์ไม่สำเร็จ", err);
   }
   ```

4. **การแก้ไขไฟล์ (Update/Replace):**
   ตามหลักปฏิบัติทั่วไป หากผู้ใช้อัปโหลดรูปโปรไฟล์ใหม่ เราจะทำการ **"ลบไฟล์เก่าทิ้ง"** (ด้วย `fs.unlink`) จากนั้น **"อัปโหลดไฟล์ใหม่"** (ด้วย `fs.writeFile`) เข้าไปแทนที่ และนำชื่อไฟล์ใหม่ไปอัปเดตในฐานข้อมูล (Update Database)

---

## 🛠️ การจัดการฐานข้อมูลด้วย phpMyAdmin

โปรเจกต์นี้ได้เพิ่ม **phpMyAdmin** ไว้ใน Docker เพื่อความสะดวกในการจัดการและตรวจสอบข้อมูลระหว่างการพัฒนา (Development)

**ขั้นตอนการเข้าใช้งาน:**
1. เปิดเบราว์เซอร์และเข้าไปที่ URL: **[http://localhost:8081](http://localhost:8081)**
2. ระบบจะแสดงหน้าล็อกอิน ให้คุณกรอกข้อมูลดังต่อไปนี้ (อ้างอิงค่าจากไฟล์ `.env`):
   - **เซิร์ฟเวอร์ (Server):** `mysql` *(ต้องกรอกชื่อ Service ของฐานข้อมูลใน Docker)*
   - **ชื่อผู้ใช้ (Username):** `root` (หากต้องการสิทธิ์สูงสุด) หรือ `admin`
   - **รหัสผ่าน (Password):** รหัสผ่านที่คุณตั้งไว้ (ค่าเริ่มต้นคือ `password`)
3. เมื่อเข้าสู่ระบบสำเร็จ คุณสามารถเข้าไปที่ฐานข้อมูล `ot_project_db` เพื่อสร้างตาราง (Create Table), เพิ่มข้อมูล (Insert), แก้ไขข้อมูล (Update), หรือลบข้อมูล (Delete) ผ่านหน้าเว็บได้เลยโดยไม่ต้องเขียน SQL เอง

**หมายเหตุ:** หากคุณใช้เครื่องมือจัดการฐานข้อมูลตัวอื่น (เช่น DBeaver หรือ TablePlus) ก็สามารถเชื่อมต่อได้โดยตั้งค่าโฮสต์เป็น `localhost` และพอร์ต `3306` ครับ
