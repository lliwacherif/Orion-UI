# Deployment Guide for Scaleway (Dedicated Server / Instance)

This guide outlines the specifications and steps required to host the **Orion** frontend application on a Scaleway server (Ubuntu/Debian environment).

## 1. Server Specifications

Since this is a React frontend application (SPA), the resource requirements are minimal for serving the application, but you need some resources for the *build process*.

### Recommended "Start" Configuration
*   **Instance Type**: DEV1-M (or Dedicated Server equivalent)
*   **OS**: Ubuntu 22.04 LTS (Jammy Jellyfish) or Debian 12
*   **CPU**: 2 vCPUs (helps with build speed)
*   **RAM**: 4GB (Recommended for building typical React apps without memory issues; 2GB works but might require swap space)
*   **Storage**: 20GB+ SSD

> **Note**: If you are only serving the *pre-built* static files (copied from your local machine), you can get away with a much smaller server (e.g., 512MB RAM). The specs above assume you are *building* the application on the server.

## 2. Environment Setup

Connect to your server via SSH:
```bash
ssh root@your-server-ip
```

### Step 1: Update System
```bash
apt update && apt upgrade -y
```

### Step 2: Install Node.js (v18 or v20 LTS)
We use `nvm` (Node Version Manager) or the official setup script. Here is the setup script method:

```bash
# Install curl if missing
apt install -y curl

# Add NodeSource repo
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt install -y nodejs

# Verify install
node -v
npm -v
```

### Step 3: Install Nginx (Web Server)
Nginx is excellent for serving static files and handling high traffic.

```bash
apt install -y nginx
```

## 3. Deployment Steps

### Step 1: Clone the Repository
Navigate to the web root or your home directory:
```bash
cd /var/www
git clone <your-repository-url> orion
cd orion
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the project root.
```bash
nano .env
```

Paste your production environment variables (update the API URL to your real backend):
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```
*Press `Ctrl+O` to save and `Ctrl+X` to exit.*

### Step 4: Build the Project
This compiles the React code into static HTML/CSS/JS files in the `dist` folder.
```bash
npm run build
```

## 4. Nginx Configuration

Configure Nginx to serve the `dist` folder and handle client-side routing (SPA).

1.  Create a new config file:
    ```bash
    nano /etc/nginx/sites-available/orion
    ```

2.  Paste the following configuration (replace `your-domain.com`):

    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        root /var/www/orion/dist;
        index index.html;

        # Compressions
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache control for static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }
    ```

3.  Enable the site:
    ```bash
    ln -s /etc/nginx/sites-available/orion /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default  # Optional: Remove default site if not needed
    ```

4.  Test and Reload Nginx:
    ```bash
    nginx -t
    systemctl reload nginx
    ```

## 5. SSL Certificate (HTTPS)

Secure your site using Certbot (Let's Encrypt).

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to auto-redirect HTTP to HTTPS.

## 6. Maintenance (Updates)

To update the application in the future:

```bash
cd /var/www/orion
git pull
npm install     # If dependencies changed
npm run build
# No need to restart Nginx usually, just the build updates the files
```
