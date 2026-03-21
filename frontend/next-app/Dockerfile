# Changed from node:18-alpine to node:20-alpine
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Keep the legacy-peer-deps flag to avoid the date-fns conflict
RUN npm install --legacy-peer-deps

COPY . .

# Now the build will succeed because Node.js version is >= 20.9.0
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
