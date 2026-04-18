FROM mcr.microsoft.com/playwright:v1.46.1-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 3002

CMD ["node", "dist/index.js"]
