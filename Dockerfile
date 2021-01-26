FROM node:14-alpine

WORKDIR /usr/app/bbot

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
