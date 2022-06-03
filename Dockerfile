FROM node:16.15.0-alpine3.14

WORKDIR /usr/app/bbot

RUN apk update && apk add --no-cache python g++ make

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]
