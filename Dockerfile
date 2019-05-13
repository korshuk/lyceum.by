FROM node:4

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install --quiet

RUN npm install -g nodemon

COPY . . 

EXPOSE 3000