FROM node:16.17.1-alpine

USER node

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

EXPOSE 1453

CMD [ "npm", "start" ]

COPY package*.json ./
RUN npm install

COPY --chown=node:node . .
