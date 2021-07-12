FROM node:lts-buster

WORKDIR /usr/src/sso

COPY package*.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

EXPOSE 5000

CMD ["yarn", "start"]