# Build 
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your frontend source code
COPY . .

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the application
RUN npm run build

# Production using nginx
FROM nginx:stable-alpine

# Copy custom nginx configuration 
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from Vite (defaults to 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]