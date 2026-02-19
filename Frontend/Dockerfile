# Build 
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your frontend source code
COPY . .

# Build the application
RUN npm run build

# Production using nginx
FROM nginx:stable-alpine

# Copy the build output from Vite (defaults to 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]