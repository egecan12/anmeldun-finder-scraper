# Puppeteer için özel base image kullan
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# Çalışma dizini
WORKDIR /app

# Package files'ı kopyala
COPY package*.json ./

# Dependencies kur
RUN npm ci --omit=dev

# Uygulama dosyalarını kopyala
COPY . .

# Port expose
EXPOSE 3000

# Non-root user (güvenlik)
USER pptruser

# Environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Başlat
CMD ["node", "server.js"]

