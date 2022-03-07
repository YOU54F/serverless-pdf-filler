FROM node:12.22.10-stretch-slim

RUN apt-get update && apt-get install -y qpdf

WORKDIR /app

ENTRYPOINT ["yarn"]
CMD ["run", "start"]