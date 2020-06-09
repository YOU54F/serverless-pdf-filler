FROM node:12.18.0-stretch-slim

RUN apt-get update && apt-get install -y qpdf

WORKDIR /app

ENTRYPOINT ["yarn"]
CMD ["run", "start"]