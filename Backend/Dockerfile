FROM node:18-alpine 
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies 
RUN npm ci

# Copy the rest of your backend source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build node.js
RUN npm run build

# Open port 3000
EXPOSE 3000

CMD ["npm", "start"]