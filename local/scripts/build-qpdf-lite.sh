
#! /usr/bin/env bash

docker build -f local/docker/qpdf.Dockerfile -t qpdf-builder .

rm layer/qpdf-layer.zip
# rm -rf layer/qpdf

# mkdir -p layer/qpdf


container_id=$(docker create -ti qpdf-builder /bin/sh)
docker cp "$container_id:/qpdf/qpdf-layer.zip" ./layer/qpdf-layer.zip
# zip -y -d layer/qpdf-layer.zip "lib/libqpdf.so.28.0.1"
# docker cp "$container_id:/qpdf/bin/" ./layer/qpdf/bin
# docker cp "$container_id:/qpdf/lib/" ./layer/qpdf/lib
# ln -s libqpdf.so.28.0.1 libqpdf.so.28.0
# rm layer/qpdf/bin/busybox
# rm layer/qpdf/bin/env
# rm layer/qpdf/bin/less
# rm layer/qpdf/lib/libffi.so.*
# rm layer/qpdf/lib/libhogweed.so.*
# rm layer/qpdf/lib/libtasn1.so.*
# rm layer/qpdf/lib/libgnutls.so.*
# rm layer/qpdf/lib/libidn.so.*
# rm layer/qpdf/lib/libnettle.so.*
# rm layer/qpdf/lib/libqpdf.so.28.0.1

# cd layer/qpdf
# zip -9r qpdf-layer.zip ./bin ./lib || exit