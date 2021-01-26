FROM node:14-alpine

RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*

WORKDIR /usr/app/bbot

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
