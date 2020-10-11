FROM node:14.13.1 as builder
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN yarn build

FROM nginx
COPY --from=builder /usr/src/app/public /apps/sharegit/web
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]