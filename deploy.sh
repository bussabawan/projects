#!/usr/bin/env bash

# ==============================================================================
# Deployment Script for OT Project 2026 (Ubuntu Server)
# ==============================================================================
# สคริปต์นี้ใช้สำหรับ Deploy และ Update ระบบ Next.js + MySQL + Nginx บน Ubuntu Server
# วิธีการใช้งาน:
#   chmod +x deploy.sh
#   ./deploy.sh          (ดึงโค้ดจาก branch ปัจจุบัน หรือ main)
#   ./deploy.sh [branch] (ระบุ branch ที่ต้องการ เช่น ./deploy.sh main)
# ==============================================================================

set -eo pipefail

# สีสำหรับแสดงผลใน Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ฟังก์ชันแสดงข้อความพร้อมเวลา
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}       🚀 เริ่มต้นกระบวนการ Deploy: OT Project 2026                 ${NC}"
echo -e "${CYAN}====================================================================${NC}"

# ------------------------------------------------------------------------------
# 1. ตรวจสอบ Prerequisite Tools
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 1/7: ตรวจสอบเครื่องมือที่จำเป็น (Prerequisites)..."

if ! command -v git &> /dev/null; then
    log_error "ไม่พบ Git ในระบบ กรุณาติดตั้งด้วย: sudo apt update && sudo apt install -y git"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "ไม่พบ Docker ในระบบ กรุณาติดตั้ง Docker Engine ก่อนดำเนินการต่อ"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    log_error "ไม่พบ Docker Compose (V2) ในระบบ กรุณาติดตั้ง docker-compose-plugin"
    exit 1
fi

log_success "เครื่องมือ Git, Docker และ Docker Compose พร้อมใช้งาน"

# ------------------------------------------------------------------------------
# 2. จัดการดึงโค้ดล่าสุดจาก GitHub (Git Pull)
# ------------------------------------------------------------------------------
TARGET_BRANCH="${1:-}"

if [ -d .git ]; then
    log_info "ขั้นตอนที่ 2/7: กำลังดึงโค้ดล่าสุดจาก GitHub..."
    
    # หากไม่ได้ระบุ branch ใน argument ให้ใช้ branch ปัจจุบัน หรือค่าเริ่มต้น main
    if [ -z "$TARGET_BRANCH" ]; then
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        TARGET_BRANCH="$CURRENT_BRANCH"
    fi

    log_info "กำลังทำงานบน Branch: ${TARGET_BRANCH}"

    # ตรวจสอบการเปลี่ยนแปลงที่ยังไม่ได้ commit
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warn "พบการแก้ไขไฟล์ใน Local Server ที่ยังไม่ได้ commit กำลังทำการ stash เก็บไว้ชั่วคราว..."
        git stash
    fi

    git fetch origin "$TARGET_BRANCH"
    git checkout "$TARGET_BRANCH"
    git pull origin "$TARGET_BRANCH"

    LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%cr)")
    log_success "อัปเดตโค้ดสำเร็จ! Commit ล่าสุด: $LATEST_COMMIT"
else
    log_warn "โฟลเดอร์นี้ไม่ได้เป็น Git Repository (ข้ามขั้นตอน Git Pull)"
fi

# ------------------------------------------------------------------------------
# 3. ตรวจสอบไฟล์ Environment (.env)
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 3/7: ตรวจสอบความถูกต้องของไฟล์ Environment (.env)..."

if [ ! -f .env ]; then
    log_warn "ไม่พบไฟล์ .env ในระบบ!"
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warn "ระบบได้ทำการคัดลอกไฟล์ต้นแบบจาก .env.example เป็น .env ให้แล้ว"
        echo -e "${YELLOW}--------------------------------------------------------------------${NC}"
        echo -e "${YELLOW}กรุณาเปิดไฟล์ .env เพื่อแก้ไขค่า Configuration สำคัญก่อนเริ่มรัน:${NC}"
        echo -e "  - รหัสผ่าน MySQL (MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD)"
        echo -e "  - ค่า AUTH_SECRET สำหรับระบบ Auth.js"
        echo -e "  - GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET"
        echo -e "  - AUTH_URL สำหรับโดเมนจริงของเว็บไซต์"
        echo -e "${YELLOW}คำสั่งแก้ไข: nano .env${NC}"
        echo -e "${YELLOW}เมื่อแก้ไขเสร็จแล้ว ให้รัน ./deploy.sh ใหม่อีกครั้ง${NC}"
        echo -e "${YELLOW}--------------------------------------------------------------------${NC}"
        exit 1
    else
        log_error "ไม่พบทั้ง .env และ .env.example กรุณาสร้างไฟล์ .env ก่อนรันสคริปต์"
        exit 1
    fi
else
    log_success "พบไฟล์ .env เรียบร้อยแล้ว"
fi

# ------------------------------------------------------------------------------
# 4. จัดการโฟลเดอร์ Uploads และกำหนดสิทธิ์ (Permissions)
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 4/7: จัดการไดเรกทอรีและสิทธิ์ไฟล์อัปโหลด (Uploads Directory)..."

# โครงสร้างโฟลเดอร์ uploads ที่ระบบต้องใช้งาน
mkdir -p uploads/audio
mkdir -p uploads/images
mkdir -p uploads/cache/tts

# ใน Dockerfile ของ Next.js กำหนดรันด้วย user 'nextjs' (UID: 1001, GID: 1001)
# จำเป็นต้องปรับเจ้าของไฟล์บน Host ให้ container เขียนไฟล์ได้
log_info "กำลังตั้งค่า Permission ของโฟลเดอร์ uploads ให้ UID 1001 (nextjs container user)..."
if [ "$EUID" -eq 0 ]; then
    chown -R 1001:1001 uploads
    chmod -R 775 uploads
else
    if command -v sudo &> /dev/null; then
        sudo chown -R 1001:1001 uploads
        sudo chmod -R 775 uploads
    else
        log_warn "ไม่สามารถรัน sudo ได้ กรุณาตรวจสอบให้แน่ใจว่าโฟลเดอร์ uploads มีสิทธิ์ให้ UID 1001 เขียนได้"
        chmod -R 777 uploads 2>/dev/null || true
    fi
fi

log_success "โฟลเดอร์ uploads และสิทธิ์ไฟล์พร้อมใช้งานเรียบร้อย"

# ------------------------------------------------------------------------------
# 5. สั่งรัน Docker Compose (Build & Up)
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 5/7: สั่ง Build และ Start Docker Containers (compose.prod.yaml)..."

COMPOSE_FILE="compose.prod.yaml"

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "ไม่พบไฟล์ $COMPOSE_FILE ในโฟลเดอร์ปัจจุบัน"
    exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d --build

log_success "สั่งรัน Docker Compose สำเร็จ!"

# ------------------------------------------------------------------------------
# 6. ตรวจสอบสถานะการทำงานของ Container (Health Check)
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 6/7: รอตรวจสอบสถานะ Container (กำลังรอ 5 วินาที)..."
sleep 5

docker compose -f "$COMPOSE_FILE" ps

# ตรวจสอบว่า container หลักกำลังรันอยู่หรือไม่
if docker compose -f "$COMPOSE_FILE" ps | grep -q "ot_web_app"; then
    log_success "คอนเทนเนอร์ ot_web_app กำลังทำงาน"
else
    log_warn "คอนเทนเนอร์ ot_web_app อาจกำลังเริ่มต้น หรือพบข้อผิดพลาด โปรดตรวจสอบ log"
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "ot_nginx"; then
    log_success "คอนเทนเนอร์ ot_nginx กำลังทำงาน"
else
    log_warn "คอนเทนเนอร์ ot_nginx อาจกำลังเริ่มต้น หรือพบข้อผิดพลาด โปรดตรวจสอบ log"
fi

# ------------------------------------------------------------------------------
# 7. ล้าง Docker Images ขยะที่ไม่ใช้งาน (Prune Dangling Images)
# ------------------------------------------------------------------------------
log_info "ขั้นตอนที่ 7/7: ทำความสะอาด Docker Images เก่าที่ไม่ใช้งาน..."
docker image prune -f > /dev/null 2>&1 || true
log_success "ล้างข้อมูลขยะเสร็จสิ้น"

# ------------------------------------------------------------------------------
# สรุปผลการ Deploy
# ------------------------------------------------------------------------------
echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}       🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!                       ${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "🌐 เว็บไซต์พร้อมให้บริการที่: ${CYAN}http://localhost${NC} หรือ IP/Domain ของ Server"
echo -e "📁 โฟลเดอร์ Uploads ถูก Mount ไว้ที่: ${CYAN}$(pwd)/uploads${NC}"
echo -e "📜 คำสั่งสำหรับดู Logs ระบบ:"
echo -e "   - ดูทั้งหมด: ${YELLOW}docker compose -f compose.prod.yaml logs -f${NC}"
echo -e "   - ดู Web App: ${YELLOW}docker compose -f compose.prod.yaml logs -f server${NC}"
echo -e "   - ดู Nginx:   ${YELLOW}docker compose -f compose.prod.yaml logs -f nginx${NC}"
echo -e "   - ดู MySQL:   ${YELLOW}docker compose -f compose.prod.yaml logs -f mysql${NC}"
echo -e "🛑 คำสั่งหยุดการทำงาน:"
echo -e "   - ${YELLOW}docker compose -f compose.prod.yaml down${NC}"
echo -e "${GREEN}====================================================================${NC}"
