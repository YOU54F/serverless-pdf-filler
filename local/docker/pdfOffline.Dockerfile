FROM node:12.18.0-stretch-slim

# Make sure we error in handler if we can't find QPDF
RUN apt-get update && apt-get install -y qpdf

COPY . .