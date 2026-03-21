FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# ADDED: --legacy-peer-deps to handle the date-fns conflict
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
