#!/usr/bin/env bash

# ==============================================================================
# Deployment Script for OT Project 2026 (Ubuntu Server)
# ==============================================================================
# This script deploys and updates Next.js + MySQL + Nginx on an Ubuntu Server.
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh          (Deploy using current branch or default: main)
#   ./deploy.sh [branch] (Specify target branch, e.g., ./deploy.sh main)
# ==============================================================================

set -eo pipefail

LOG_FILE="deploy.log"

# Redirect stdout and stderr to both the console and deploy.log
exec > >(tee -a "$LOG_FILE") 2>&1

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging Functions
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

echo -e "\n${CYAN}====================================================================${NC}"
echo -e "${CYAN}       🚀 STARTING DEPLOYMENT PROCESS: OT PROJECT 2026              ${NC}"
echo -e "${CYAN}====================================================================${NC}"
log_info "Deployment log will be recorded to: ${LOG_FILE}"

# ------------------------------------------------------------------------------
# 1. Check Prerequisites
# ------------------------------------------------------------------------------
log_info "Step 1/7: Checking required prerequisites..."

if ! command -v git &> /dev/null; then
    log_error "Git is not installed. Install it with: sudo apt update && sudo apt install -y git"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker Engine before proceeding."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    log_error "Docker Compose (V2) is not installed. Please install docker-compose-plugin."
    exit 1
fi

log_success "Prerequisites verified: Git, Docker, and Docker Compose are available."

# ------------------------------------------------------------------------------
# 2. Fix Host Permissions Before Git Operations
# ------------------------------------------------------------------------------
# Ensure the current host user has ownership and write access to all files
# in the repository (especially uploads/) to prevent "Permission denied" during git pull/stash.
log_info "Preparing repository permissions for Git operations..."
CURRENT_UID=$(id -u)
CURRENT_GID=$(id -g)

if [ -d "uploads" ]; then
    if [ "$EUID" -eq 0 ]; then
        chown -R "$CURRENT_UID:$CURRENT_GID" uploads
        chmod -R 777 uploads
    elif command -v sudo &> /dev/null; then
        sudo chown -R "$CURRENT_UID:$CURRENT_GID" uploads 2>/dev/null || true
        sudo chmod -R 777 uploads 2>/dev/null || true
    else
        chmod -R 777 uploads 2>/dev/null || true
    fi
fi

# ------------------------------------------------------------------------------
# 3. Pull Latest Code from GitHub
# ------------------------------------------------------------------------------
TARGET_BRANCH="${1:-}"

if [ -d .git ]; then
    log_info "Step 2/7: Synchronizing latest code from GitHub..."

    # Ignore index changes on gitkeep files inside uploads if they exist
    for keepfile in uploads/.gitkeep uploads/audio/.gitkeep uploads/images/.gitkeep; do
        if [ -f "$keepfile" ]; then
            git update-index --assume-unchanged "$keepfile" 2>/dev/null || true
        fi
    done

    # If branch argument not provided, resolve current branch or fallback to 'main'
    if [ -z "$TARGET_BRANCH" ]; then
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        TARGET_BRANCH="$CURRENT_BRANCH"
    fi

    log_info "Working on Git branch: ${TARGET_BRANCH}"

    # Handle local uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warn "Uncommitted changes detected in local repository. Stashing them..."
        git stash --include-untracked 2>/dev/null || git stash 2>/dev/null || true
    fi

    git fetch origin "$TARGET_BRANCH"
    git checkout "$TARGET_BRANCH"
    git pull origin "$TARGET_BRANCH"

    LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%cr)")
    log_success "Code updated successfully! Latest commit: $LATEST_COMMIT"
else
    log_warn "Current directory is not a Git repository. Skipping git pull step."
fi

# ------------------------------------------------------------------------------
# 4. Verify Environment Configuration (.env)
# ------------------------------------------------------------------------------
log_info "Step 3/7: Verifying environment configuration (.env)..."

if [ ! -f .env ]; then
    log_warn "File .env not found in project root!"
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warn "Created .env from .env.example template."
        echo -e "${YELLOW}--------------------------------------------------------------------${NC}"
        echo -e "${YELLOW}IMPORTANT: Please update critical secrets in .env before deploying:${NC}"
        echo -e "  - MySQL passwords (MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD)"
        echo -e "  - AUTH_SECRET (e.g. run 'openssl rand -base64 32')"
        echo -e "  - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
        echo -e "  - AUTH_URL (e.g., http://your-server-ip or domain)"
        echo -e "${YELLOW}Edit file using: nano .env${NC}"
        echo -e "${YELLOW}After editing, run ./deploy.sh again.${NC}"
        echo -e "${YELLOW}--------------------------------------------------------------------${NC}"
        exit 1
    else
        log_error "Neither .env nor .env.example found. Please create .env first."
        exit 1
    fi
else
    log_success "Environment file .env found."
fi

# ------------------------------------------------------------------------------
# 5. Manage Uploads Directory and Permissions
# ------------------------------------------------------------------------------
log_info "Step 4/7: Managing uploads directory structure and permissions..."

mkdir -p uploads/audio
mkdir -p uploads/images
mkdir -p uploads/cache/tts

# In Next.js runner Dockerfile, the application runs under user 'nextjs' (UID: 1001, GID: 1001).
# We grant UID 1001 ownership and 777 permissions so both host and container can read/write without conflict.
log_info "Setting permissions for uploads directory (UID: 1001 / nextjs container user)..."
if [ "$EUID" -eq 0 ]; then
    chown -R 1001:1001 uploads
    chmod -R 777 uploads
elif command -v sudo &> /dev/null; then
    sudo chown -R 1001:1001 uploads 2>/dev/null || true
    sudo chmod -R 777 uploads 2>/dev/null || true
else
    chmod -R 777 uploads 2>/dev/null || true
fi

log_success "Uploads directory structure and permissions configured."

# ------------------------------------------------------------------------------
# 6. Execute Docker Compose (Build & Up)
# ------------------------------------------------------------------------------
log_info "Step 5/7: Building and starting Docker containers (compose.prod.yaml)..."

COMPOSE_FILE="compose.prod.yaml"

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Docker Compose file $COMPOSE_FILE not found."
    exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d --build

log_success "Docker Compose command executed successfully."

# ------------------------------------------------------------------------------
# 7. Health Check and Container Validation
# ------------------------------------------------------------------------------
log_info "Step 6/7: Checking container status (waiting 5 seconds)..."
sleep 5

docker compose -f "$COMPOSE_FILE" ps

if docker compose -f "$COMPOSE_FILE" ps | grep -q "ot_web_app"; then
    log_success "Container 'ot_web_app' is running."
else
    log_warn "Container 'ot_web_app' is not detected as running. Check logs for details."
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "ot_nginx"; then
    log_success "Container 'ot_nginx' is running."
else
    log_warn "Container 'ot_nginx' is not detected as running. Check logs for details."
fi

# ------------------------------------------------------------------------------
# 8. Clean Up Unused Docker Images (Prune)
# ------------------------------------------------------------------------------
log_info "Step 7/7: Cleaning up dangling Docker images..."
docker image prune -f > /dev/null 2>&1 || true
log_success "Dangling images cleaned up."

# ------------------------------------------------------------------------------
# Deployment Summary
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}       🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!                       ${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "🌐 Web Application URL : ${CYAN}http://localhost${NC} or http://<server-ip>"
echo -e "📁 Uploads Directory    : ${CYAN}$(pwd)/uploads${NC}"
echo -e "📝 Deployment Log File  : ${CYAN}$(pwd)/${LOG_FILE}${NC}"
echo -e ""
echo -e "📜 Useful Maintenance Commands:"
echo -e "   - View all logs      : ${YELLOW}docker compose -f compose.prod.yaml logs -f${NC}"
echo -e "   - View Next.js logs  : ${YELLOW}docker compose -f compose.prod.yaml logs -f server${NC}"
echo -e "   - View Nginx logs    : ${YELLOW}docker compose -f compose.prod.yaml logs -f nginx${NC}"
echo -e "   - View MySQL logs    : ${YELLOW}docker compose -f compose.prod.yaml logs -f mysql${NC}"
echo -e "   - View deploy log    : ${YELLOW}tail -f ${LOG_FILE}${NC}"
echo -e "   - Stop all services  : ${YELLOW}docker compose -f compose.prod.yaml down${NC}"
echo -e "${GREEN}====================================================================${NC}\n"
