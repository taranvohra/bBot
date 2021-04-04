FROM node:14-alpine

WORKDIR /usr/app/bbot

RUN apk update && apk add --no-cache python g++ make

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
