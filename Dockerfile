## this is the stage one , also know as the build step

FROM node:14-alpine
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY . .
RUN yarn 
RUN yarn run build

## this is stage two , where the app actually runs

FROM node:14-alpine

WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn --only=production
COPY --from=0 /app/dist ./dist
EXPOSE 3000
CMD yarn start
