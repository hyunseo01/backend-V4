FROM node:18-alpine

WORKDIR /app

COPY .env .env
COPY package*.json ./
RUN npm install
COPY dist ./dist
#COPY node_modules ./node_modules
COPY global-setup.js ./global-setup.js
ENV NODE_OPTIONS="--require ./global-setup.js"

EXPOSE 3050
CMD ["node", "dist/main.js"]