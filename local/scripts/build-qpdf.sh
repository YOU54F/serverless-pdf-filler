#! /usr/bin/env bash

docker build -f local/docker/qpdf.Dockerfile -t qpdf-builder .

mkdir -p layer

rm -rf layer/qpdf

container_id=$(docker create -ti qpdf-builder /bin/sh)
docker cp "$container_id:/opt/" ./layer/qpdf

cat > layer/qpdf/.slsignore << EOF
share/**
EOF

cd layer/qpdf || exit
ln -s bin/qpdf qpdf