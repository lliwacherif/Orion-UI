# VPS Deployment Technical Specification

## System Requirements

### Server
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB minimum
- **Network**: Public IP with ports 80, 443 open

---

## Stack Overview

### Frontend (AURA UI)
- **Framework**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **Runtime**: Node.js 16+ (Node 18+ recommended)
- **Output**: Static files (HTML/CSS/JS)
- **Web Server**: Nginx or Apache

### Backend (ORCHA API)
- **Language**: Python 3.9+ (Python 3.10+ recommended)
- **Framework**: FastAPI + Pydantic
- **Key Dependencies**: 
  - PyPDF2 (PDF processing)
  - axios/requests (HTTP client)
  - uvicorn (ASGI server)
- **Default Port**: 8000

---

## Installation Steps

### 1. System Packages
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.10+
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install Nginx
sudo apt install -y nginx

# Install process manager
sudo npm install -g pm2

# Install build essentials
sudo apt install -y build-essential git
```

### 2. Frontend Deployment

**Clone & Build:**
```bash
cd /var/www
git clone <repository-url> aura-ui
cd aura-ui

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
VITE_API_URL=https://yourdomain.com/api/v1
EOF

# Build for production
npm run build

# Output will be in: dist/
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/aura
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/aura-ui/dist;
    index index.html;
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Backend Deployment

**Setup Backend:**
```bash
cd /opt
git clone <backend-repository-url> orcha-backend
cd orcha-backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn pydantic PyPDF2 requests python-multipart
# Add other requirements as needed

# Create .env file for backend
cat > .env << EOF
LM_STUDIO_URL=http://localhost:1234
DATABASE_URL=sqlite:///./aura.db
CORS_ORIGINS=https://yourdomain.com
EOF
```

**PM2 Process Configuration:**
```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'orcha-backend',
    script: 'venv/bin/uvicorn',
    args: 'main:app --host 0.0.0.0 --port 8000',
    cwd: '/opt/orcha-backend',
    interpreter: 'none',
    env: {
      PYTHONUNBUFFERED: '1',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true
  }]
}
EOF

# Start backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (added automatically)
sudo systemctl status certbot.timer
```

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://yourdomain.com/api/v1
```

### Backend (.env)
```env
LM_STUDIO_URL=http://localhost:1234/v1/chat/completions
DATABASE_URL=sqlite:///./aura.db
CORS_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
```

---

## Port Configuration

| Service | Port | Access |
|---------|------|--------|
| Nginx | 80, 443 | Public |
| Backend API | 8000 | Internal (proxied via Nginx) |
| LM Studio | 1234 | Internal |

**Firewall:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Dependencies Summary

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^5.0.8",
  "axios": "^1.6.2",
  "tailwindcss": "^3.4.0",
  "react-query": "^3.39.3",
  "uuid": "^9.0.1"
}
```

### Backend
```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
PyPDF2>=3.0.0
requests>=2.31.0
python-multipart>=0.0.6
```

---

## Deployment Checklist

- [ ] Server with Ubuntu 20.04+ provisioned
- [ ] Domain name configured (DNS A record)
- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] Nginx installed and configured
- [ ] Frontend built and deployed to `/var/www/aura-ui/dist`
- [ ] Backend running on port 8000 (PM2)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured (ports 80, 443)
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API proxy configured in Nginx
- [ ] LM Studio configured (if using local LLM)

---

## Maintenance Commands

```bash
# Frontend update
cd /var/www/aura-ui
git pull
npm install
npm run build
sudo systemctl restart nginx

# Backend update
cd /opt/orcha-backend
git pull
source venv/bin/activate
pip install -r requirements.txt
pm2 restart orcha-backend

# View logs
pm2 logs orcha-backend
sudo tail -f /var/log/nginx/error.log

# Monitor processes
pm2 status
pm2 monit
```

---

## Quick Start Commands

```bash
# One-liner deployment (after initial setup)
cd /var/www/aura-ui && git pull && npm install && npm run build && \
cd /opt/orcha-backend && git pull && source venv/bin/activate && \
pip install -r requirements.txt && pm2 restart all && \
sudo systemctl restart nginx
```

---

**Last Updated**: November 2025  
**Tech Stack**: React 18 + TypeScript + Vite | Python 3.10+ + FastAPI

