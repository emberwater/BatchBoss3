FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y python3 g++ make && rm -rf /var/lib/apt/lists/*

# WORKDIR /server
COPY package*.json ./
RUN npm install --omit=dev
RUN npm rebuild better-sqlite3

COPY . .
ENV NODE_ENV=production

# Your server already reads process.env.PORT || 4000
CMD ["node", "src/server.js"]
