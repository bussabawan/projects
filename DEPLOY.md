# คู่มือการ Deploy ระบบ OT Project 2026 บน Ubuntu Server

คู่มือนี้สรุปขั้นตอนการติดตั้งและดูแลรักษาระบบ **OT Project 2026** (Next.js 16 + MySQL + Nginx) บนเซิร์ฟเวอร์ **Ubuntu 22.04 / 24.04 LTS**

---

## 1. การเตรียมเซิร์ฟเวอร์ Ubuntu (Prerequisites)

ก่อนเริ่มใช้งาน ให้ติดตั้ง **Docker Engine**, **Docker Compose V2** และ **Git** ตามขั้นตอนดังนี้:

### 1.1 อัปเดตระบบและติดตั้งแพ็กเกจพื้นฐาน
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw
```

### 1.2 ติดตั้ง Docker Engine และ Docker Compose Plugin
```bash
# เพิ่ม GPG Key ของ Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# เพิ่ม Repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ติดตั้ง Docker และ Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# อนุญาตให้ User ปัจจุบันรัน Docker โดยไม่ต้องพิมพ์ sudo (รันเสร็จให้ reconnect SSH)
sudo usermod -aG docker $USER
```

### 1.3 ตั้งค่า Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # สำหรับ SSH
sudo ufw allow 80/tcp    # สำหรับ HTTP (Nginx)
sudo ufw allow 443/tcp   # สำหรับ HTTPS (SSL ในอนาคต)
sudo ufw enable
```

---

## 2. ขั้นตอนการ Deploy ครั้งแรก (First Time Setup)

### ขั้นตอนที่ 1: Clone โค้ดจาก GitHub
```bash
git clone <URL_ของ_GITHUB_REPOSITORY> ot-project-2026
cd ot-project-2026
```

### ขั้นตอนที่ 2: ให้สิทธิ์รันสคริปต์
```bash
chmod +x deploy.sh
```

### ขั้นตอนที่ 3: รันสคริปต์ครั้งแรกเพื่อสร้างโครงสร้างและไฟล์ `.env`
```bash
./deploy.sh
```
> **หมายเหตุ**: ในการรันครั้งแรก สคริปต์จะคัดลอก `.env.example` ไปเป็น `.env` และจะหยุดพร้อมแจ้งเตือนให้ท่านเข้าไปตั้งค่าความลับ

### ขั้นตอนที่ 4: ตั้งค่าตัวแปรสภาพแวดล้อม (.env)
เปิดไฟล์ `.env` ขึ้นมาแก้ไข:
```bash
nano .env
```
ตรวจสอบและกำหนดค่าต่อไปนี้ให้ถูกต้อง:
- `MYSQL_ROOT_PASSWORD`: รหัสผ่าน Root สำหรับฐานข้อมูล
- `MYSQL_USER`: ชื่อผู้ใช้ฐานข้อมูล (เช่น `admin`)
- `MYSQL_PASSWORD`: รหัสผ่านผู้ใช้ฐานข้อมูล
- `AUTH_SECRET`: สุ่มคีย์ความลับ เช่น รัน `openssl rand -base64 32` แล้วนำมาวาง
- `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET`: ค่าจาก Google Cloud Console
- `AUTH_URL`: เปลี่ยนเป็น `http://<IP_หรือ_DOMAIN_ของ_SERVER>`

กด `Ctrl + O` แล้ว `Enter` เพื่อบันทึก และ `Ctrl + X` เพื่อออก

### ขั้นตอนที่ 5: รันสคริปต์ Deploy อีกครั้ง
```bash
./deploy.sh
```
สคริปต์จะทำการ:
1. สร้างโฟลเดอร์ `uploads/images`, `uploads/audio`, `uploads/cache/tts`
2. ตั้งค่าสิทธิ์โฟลเดอร์ uploads ให้ user `nextjs` (UID: 1001) เขียนไฟล์ได้
3. Build Docker Images และ Start ทุก Service
4. ล้าง Image ขยะที่ไม่ใช้งาน

เมื่อเสร็จสิ้น เว็บไซต์จะพร้อมเข้าใช้งานทันทีที่พอร์ต **80** (เช่น `http://your-server-ip`)

---

## 3. ขั้นตอนการอัปเดตระบบในครั้งต่อๆ ไป (Updating Application)

เมื่อมีการ Push โค้ดใหม่ขึ้น GitHub ให้เข้า SSH มาที่เซิร์ฟเวอร์แล้วรันเพียงคำสั่งเดียว:

```bash
cd ot-project-2026
./deploy.sh
```

หรือหากต้องการระบุ Branch เจาะจง:
```bash
./deploy.sh main
```

สคริปต์จะทำการ `git pull` โค้ดล่าสุด, build image ใหม่ และ restart container ให้อัตโนมัติ โดยที่ข้อมูลในฐานข้อมูลและไฟล์อัปโหลดทั้งหมดจะไม่สูญหาย

---

## 4. คำสั่งสำคัญในการดูแลรักษาระบบ (Maintenance Commands)

### ตรวจสอบสถานะ Containers
```bash
docker compose -f compose.prod.yaml ps
```

### ดู Logs แบบ Real-time
```bash
# ดู log รวมทุก service
docker compose -f compose.prod.yaml logs -f

# ดูเฉพาะ Next.js Web App
docker compose -f compose.prod.yaml logs -f server

# ดูเฉพาะ Nginx
docker compose -f compose.prod.yaml logs -f nginx

# ดูเฉพาะ MySQL
docker compose -f compose.prod.yaml logs -f mysql

# ดู Deployment log
tail -f deploy.log
```

### หยุดและเริ่มระบบใหม่
```bash
# หยุดระบบชั่วคราว
docker compose -f compose.prod.yaml stop

# เริ่มระบบใหม่อีกครั้ง
docker compose -f compose.prod.yaml start

# ปิดระบบทั้งหมด (ไม่ลบข้อมูลดิสก์)
docker compose -f compose.prod.yaml down
```

---

## 5. การสำรองข้อมูล (Backup & Restore)

### 5.1 สำรองไฟล์อัปโหลด (Uploads)
```bash
# บีบอัดโฟลเดอร์ uploads เป็นไฟล์ .tar.gz
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

### 5.2 สำรองฐานข้อมูล MySQL
```bash
docker exec -t ot_mysql_db mysqldump -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2 | tr -d '"') ot_project_db > backup_db_$(date +%Y%m%d).sql
```

### 5.3 นำข้อมูลกลับมาใช้ (Restore Database)
```bash
docker exec -i ot_mysql_db mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2 | tr -d '"') ot_project_db < backup_db_YYYYMMDD.sql
```
