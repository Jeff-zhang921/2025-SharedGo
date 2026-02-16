# Build
FROM node:18-alpine AS builder
# prisma needs openssl to gerenate client on Alphine
RUN apk add --no-cache openssl
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies 
RUN npm ci

# Copy the rest of your backend source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

#Production 
FROM node:18-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# Copy the built code and prisma client from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/index.js"]