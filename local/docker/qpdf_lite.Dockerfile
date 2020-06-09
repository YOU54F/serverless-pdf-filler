FROM lambci/lambda:build-nodejs12.x

RUN yum groupinstall -y "Development Tools"

RUN yum update -y && yum install -y tar gzip make libjpeg-turbo-devel zlib-devel appimage wget

WORKDIR /qpdf

RUN wget https://github.com/qpdf/qpdf/releases/download/release-qpdf-10.0.1/qpdf-10.0.1-x86_64.AppImage -O qpdf.AppImage

RUN ls

RUN chmod a+x ./qpdf.AppImage
RUN ./qpdf.AppImage --appimage-extract

RUN mkdir -p ./bin ./lib
# RUN cp -R squashfs-root/usr/bin/* ./bin
# RUN cp -R squashfs-root/usr/lib/* ./lib
RUN cp -R squashfs-root/usr/bin/fix-qdf ./bin/fix-qdf
RUN cp -R squashfs-root/usr/bin/qpdf ./bin/qpdf
RUN cp -R squashfs-root/usr/bin/zlib-flate ./bin/zlib-flate
RUN cp -R squashfs-root/usr/lib/libjpeg.so.8 ./lib/libjpeg.so.8
RUN cp -R squashfs-root/usr/lib/libqpdf.so.28.0.1 ./lib/libqpdf.so.28.0.1
RUN cp -R squashfs-root/usr/lib/libqpdf.so.28 ./lib/libqpdf.so.28

RUN zip -9 --filesync -y --recurse-paths qpdf-layer.zip bin/ lib/