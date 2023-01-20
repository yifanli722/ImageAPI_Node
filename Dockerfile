FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY .env_docker .env
COPY ./src ./src
COPY ./Postgres_Scripts ./Postgres_Scripts 
EXPOSE 3000
ENV isDocker=true
#ENTRYPOINT ["tail", "-f", "/dev/null"]
CMD [ "npm", "start" ]