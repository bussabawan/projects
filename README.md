# คู่มือโครงสร้างโปรเจกต์ (Next.js + MySQL + Docker)

โปรเจกต์นี้ถูกออกแบบและพัฒนาด้วย **Next.js (App Router)** ซึ่งมีแนวคิดการจัดการไฟล์ที่ค่อนข้างแตกต่างจาก Framework แบบดั้งเดิม แต่สามารถนำมาเทียบเคียงกับโครงสร้าง **MVC (Model-View-Controller)** ได้ดังนี้ครับ

## 🚀 วิธีการเริ่มต้นโปรเจกต์หลังจาก Clone (Getting Started)

คุณสามารถเลือกรันโปรเจกต์ได้ 2 แบบ ตามวัตถุประสงค์การใช้งานครับ:

### แบบที่ 1: โหมดนักพัฒนา (Development) - สำหรับเขียนโค้ดและแก้ไข
ในโหมดนี้เราจะรันฐานข้อมูลด้วย Docker และรันตัวเว็บด้วยคำสั่ง `npm run dev` ในเครื่องของเราเพื่อให้มันอัปเดตโค้ดแบบ Real-time (Hot Reload)

1. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```
2. **ตั้งค่าไฟล์ .env:**
   สร้างหรือแก้ไขไฟล์ `.env` โดยกำหนด Host เป็น `localhost` เพื่อให้เครื่องเราเชื่อมกับ Docker ได้:
   ```env
   PORT=3000
   MYSQL_ROOT_PASSWORD=password
   MYSQL_DATABASE=ot_project_db
   MYSQL_USER=admin
   MYSQL_PASSWORD=password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   ```
3. **รันเฉพาะ Database และ phpMyAdmin ใน Docker:**
   ```bash
   docker compose up -d mysql phpmyadmin
   ```
4. **รันเว็บเซิร์ฟเวอร์สำหรับการพัฒนา:**
   ```bash
   npm run dev
   ```
   *เข้าใช้งานเว็บไซต์: http://localhost:3000*
   *จัดการฐานข้อมูล: http://localhost:8081*

---

### แบบที่ 2: โหมดใช้งานจริง (Production / Docker All-in-one)
หากต้องการรันเพื่อดูผลลัพธ์อย่างเดียว (ไม่เขียนโค้ด) คุณสามารถรันทุกอย่าง (รวมถึง Next.js) ผ่าน Docker ได้เลย:

1. แก้ไขไฟล์ `.env` (ไม่จำเป็นต้องเปลี่ยน `MYSQL_HOST` เพราะ Docker จะจัดการให้)
2. รันคำสั่งเดียวจบ:
   ```bash
   docker compose up -d
   ```
   *(รอให้ระบบ Build และทำงานสักครู่)*
3. เข้าใช้งานเว็บไซต์ได้เลยที่ http://localhost:3000 และจัดการฐานข้อมูลที่ http://localhost:8081
**(หมายเหตุ: หากรันด้วยวิธีนี้ คุณจะใช้คำสั่ง `npm run dev` ซ้ำไม่ได้ เพราะ Port 3000 จะถูกใช้งานโดย Docker ไปแล้ว และจะเกิด Error: `EADDRINUSE`)**

---

## 📂 โครงสร้างโฟลเดอร์และไฟล์ (เทียบเคียง MVC)

```text
ot-project-2026/
├── src/
│   ├── app/                  # (View & Route) ทำหน้าที่แสดงผลและรับ Request (Next.js App Router)
│   │   ├── actions/          # (Controller) Server Actions สำหรับรับ Input จาก View ไปเรียกใช้ Service
│   │   ├── api/              # (Controller) API Endpoints รับส่ง HTTP Request
│   │   ├── admin/            # (View) ระบบจัดการสำหรับแอดมิน
│   │   ├── user/             # (View) ระบบสำหรับผู้ป่วย/ผู้ใช้งาน
│   │   ├── login/            # (View) หน้าต่างเข้าสู่ระบบ
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── globals.css       # (Design System) ตัวแปร Design Tokens และ CSS รวมของแอป
│   │   ├── layout.tsx        # (View) โครงสร้างหน้าเว็บหลัก
│   │   └── page.tsx          # (View) หน้าจอเริ่มต้น (Landing)
│   ├── components/           # (View) Global Components ที่ถูกดึงมาใช้ซ้ำทั่วโปรเจกต์
│   │   ├── ui/               # Base Components (เช่น BaseButton, BaseModal)
│   │   ├── games/            # Components เฉพาะสำหรับการเล่นเกม
│   │   └── ...
│   ├── services/             # (Business Logic Layer) หัวใจของระบบ! ทำหน้าที่คำนวณและประมวลผลต่างๆ
│   │   ├── games/            # ระบบกติกาและการสุ่มของเกม (เช่น MatchingGameService, MemoryGameService)
│   │   ├── media/            # ระบบประมวลผลไฟล์เสียง (เช่น AudioProcessor ด้วย FFmpeg)
│   │   └── storage/          # ระบบการจัดเก็บไฟล์ (เช่น LocalStorageService)
│   ├── lib/                  # (Data Access Layer) จัดการการเข้าถึงข้อมูล
│   │   ├── db.ts             # ระบบ Database Connection Pool สำหรับ MySQL
│   │   └── models/           # (Model / Repository) คลาสสืบทอด BaseModel ที่จัดการคำสั่ง SQL เท่านั้น
│   ├── auth.config.ts        # การตั้งค่าพื้นฐานสำหรับ Auth.js
│   ├── auth.ts               # ระบบ Login / Authentication Session
│   └── proxy.ts              # (Middleware) Next.js Middleware ช่วยดักจับและกรอง Request
├── uploads/                  # โฟลเดอร์สำหรับจัดเก็บไฟล์สื่อและระบบ Cache
├── .env                      # ไฟล์ตั้งค่าตัวแปรระบบและรหัสผ่านต่างๆ (ต้องสร้างเองตอนใช้งาน)
├── compose.dev.yaml          # ไฟล์ตั้งค่า Docker สำหรับโหมด Development
├── compose.yaml              # ไฟล์ตั้งค่า Docker สำหรับโหมด Production
└── Dockerfile                # สคริปต์สำหรับ Build แอปพลิเคชันขึ้น Docker Image
```

---

## 🖥️ 1. View (หน้าจอแสดงผล)
**เก็บที่ไหน:** โฟลเดอร์ `src/app/` (ไฟล์ชื่อ `page.tsx` หรือ `layout.tsx`)
**วิธีแก้ไข/เพิ่มเติม:**
- หากต้องการสร้างหน้าใหม่ เช่น หน้า Dashboard ให้สร้างโฟลเดอร์ย่อยใน `src/app/` เช่น `src/app/dashboard/page.tsx` (จะเข้าถึงผ่าน URL: `/dashboard`)
- การตกแต่งหน้าจอ สามารถสร้างไฟล์ `.module.css` เพื่อกำหนดสไตล์เฉพาะหน้านั้นๆ ได้

## ⚙️ 2. Controller (จัดการลอจิกและ API)
**เก็บที่ไหน:** โฟลเดอร์ `app/api/` (สำหรับ API) และ `app/actions/` (สำหรับ Server Actions)
**วิธีแก้ไข/เพิ่มเติม:**
- **Server Actions:** หากมีไฟล์ที่มีลักษณะเป็น `"use server";` (เช่น การดึงข้อมูลลอจิกเกมส์ หรือฟังก์ชันการทำงานอื่นๆ) ให้นำมาเก็บไว้ในโฟลเดอร์ `app/actions/` (เช่น `app/actions/matchingActions.ts`) เพื่อให้เป็นระเบียบและเรียกใช้จาก View ได้ง่าย
- **API Endpoints:** หากต้องการสร้าง API ใหม่ (เช่น จัดการข้อมูล User ที่สื่อสารผ่าน HTTP) ให้สร้างโฟลเดอร์ `app/api/users/route.ts` 
- ในไฟล์ `route.ts` คุณสามารถประกาศฟังก์ชัน `GET`, `POST`, `PUT`, `DELETE` เพื่อรองรับ HTTP Methods ต่างๆ

## 🗄️ 3. Model & ฐานข้อมูล (Data Access & Repository)
**เก็บที่ไหน:** โฟลเดอร์ `src/lib/models/` และ Service ที่เรียกใช้งานใน `src/services/`
**การเชื่อมต่อ:** โปรเจกต์นี้ใช้ไลบรารี `mysql2` ผ่านคลาส `BaseModel` ที่คอยจัดการ Connection Pool

**วิธีจัดการข้อมูล (CRUD):** 
เพื่อรักษาโครงสร้าง MVC ที่ดี ห้ามเรียกใช้ `db.query()` โดยตรงใน Controller ให้เรียกใช้ผ่านคลาส Model หรือ Service แทน ตัวอย่างเช่น:

```typescript
// ในฝั่ง Controller (app/actions/ หรือ app/api/)
import { ManageExercisesModel } from '@/lib/models/manageExercises';

// ...
const data = await ManageExercisesModel.getExercises();
```
*ตัวอย่างการสร้าง Model:*
```typescript
import { BaseModel } from "./BaseModel";

export class UserModel extends BaseModel {
  // C - Create (เพิ่มข้อมูล)
  static async addUser(name: string, email: string) {
    return await this.insert('users', { name, email });
  }

  // R - Read (ดึงข้อมูล)
  static async getUsers() {
    return await this.query("SELECT * FROM users");
  }

  // U - Update (แก้ไขข้อมูล)
  static async updateUser(id: number, name: string) {
    return await this.execute("UPDATE users SET name = ? WHERE id = ?", [name, id]);
  }

  // D - Delete (ลบข้อมูล)
  static async deleteUser(id: number) {
    return await this.execute("DELETE FROM users WHERE id = ?", [id]);
  }
}
```

---

## 📁 ระบบอัปโหลดไฟล์ (File Management)

ไฟล์ที่ผู้ใช้อัปโหลดจะถูกนำไปเก็บในเครื่องเซิร์ฟเวอร์ที่ตำแหน่ง `storage/uploads/` (ซึ่งถูกผูก Volume ไว้ใน Docker เพื่อไม่ให้ไฟล์หาย) การเก็บไว้ที่โฟลเดอร์นี้จะทำให้ไฟล์ไม่เป็น Public และต้องโหลดผ่าน API เท่านั้นเพื่อความปลอดภัย

**วิธีจัดการไฟล์ (เพิ่ม ลบ เรียกดู):**

1. **การเพิ่ม (Upload):**
   ใช้ API `app/api/upload/route.ts` (ที่เขียนไว้ให้แล้ว) API นี้จะรับไฟล์ผ่าน `FormData` แล้วใช้คำสั่ง `fs.writeFile` บันทึกไฟล์ลงในโฟลเดอร์ `storage/uploads/` พร้อมสร้างชื่อใหม่ไม่ให้ซ้ำกัน
   
2. **การเรียกดู (Read/View):**
   เมื่อไฟล์ถูกเซฟใน `storage/uploads/test.png` คุณสามารถดึงรูปไปแสดงในหน้าเว็บ (View) ได้โดยอ้างอิงผ่าน API เส้นนี้: `/api/uploads/test.png`

3. **การลบไฟล์ (Delete):**
   หากต้องการลบไฟล์ออกจากเครื่องเซิร์ฟเวอร์ ให้สร้าง API ใหม่ (เช่น ส่ง Request มาที่ `DELETE /api/upload`) และใช้คำสั่ง `fs.unlink()` ของ Node.js ดังนี้:
   ```typescript
   import { promises as fs } from 'fs';
   import path from 'path';

   // สมมติว่ารับชื่อไฟล์ที่ต้องการลบมาในตัวแปร filename
   const filename = "12345-test.png"; 
   const filePath = path.join(process.cwd(), "storage/uploads", filename);
   
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
