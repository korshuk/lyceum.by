FROM node:0.10

#RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

RUN npm i nodemon@1.11.0 -g

#COPY package*.json ./

#USER node

#RUN npm install

#COPY --chown=node:node . .

EXPOSE 3000

CMD [ "node", "app.js" ]