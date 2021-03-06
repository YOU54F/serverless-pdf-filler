FROM lambci/lambda:build-nodejs12.x

RUN yum groupinstall -y "Development Tools"

RUN yum update -y && yum install -y tar gzip make libjpeg-turbo-devel zlib-devel

ENV QPDF_VERSION "10.0.1"

WORKDIR /qpdf

RUN curl -L "https://github.com/qpdf/qpdf/releases/download/release-qpdf-10.0.1/qpdf-10.0.1.tar.gz" -o qpdf.tar.gz

RUN ls

RUN tar -xzf qpdf.tar.gz

RUN cd qpdf-10.0.1 && \
    ./configure --prefix=/opt/ && \
    make && \
    make install