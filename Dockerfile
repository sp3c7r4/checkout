FROM node

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

#[Exposes port 3000]
EXPOSE 4111

CMD ["npm","run","dev"]