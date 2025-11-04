# Dockerfile para frontend Next.js
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Copiar package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar dependencias (usando npm si no hay pnpm-lock, o pnpm si existe)
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && \
      pnpm install; \
    else \
      npm install; \
    fi

# Copiar código fuente
COPY . .

# Exponer puerto de Next.js
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Comando de desarrollo
CMD ["npm", "run", "dev"]

