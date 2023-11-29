FROM node:21-alpine3.17 as builder

RUN apk update && apk add --no-cache \
git \
build-base \
make \
automake \
autoconf \
libtool \
pkgconf \
openssl \
curl \
wget \
bash \
libusb \
libzip \
readline \
openssl-dev \
curl-dev \
libusb-dev \
libzip-dev \
python3-dev \
#python-dev \
readline-dev \
libxml2-dev \
tmux


RUN git clone https://github.com/libimobiledevice/libplist.git /usr/src/libplist && \
cd /usr/src/libplist && \
# git checkout 2.3.0 && \
./autogen.sh --prefix=/usr/local && make && make install 

RUN git clone https://github.com/libimobiledevice/libimobiledevice-glue.git /usr/src/libimobiledevice-glue && \
cd /usr/src/libimobiledevice-glue && \
# git checkout 1.0.0 && \
./autogen.sh --prefix=/usr/local && make && make install

RUN git clone https://github.com/libimobiledevice/libusbmuxd.git /usr/src/libusbmuxd && \
cd /usr/src/libusbmuxd && \
# git checkout 2.0.2 && \
./autogen.sh --prefix=/usr/local && make && make install

RUN git clone https://github.com/libimobiledevice/libimobiledevice.git /usr/src/libimobiledevice && \
cd /usr/src/libimobiledevice && \
git checkout 860ffb707af3af94467d2ece4ad258dda957c6cd && \
./autogen.sh --prefix=/usr/local && make && make install

RUN git clone https://github.com/libimobiledevice/usbmuxd.git /usr/src/usbmuxd && \
cd /usr/src/usbmuxd && \
# git checkout 1.1.1 && \
./autogen.sh --prefix=/usr/local && make && make install

# RUN git clone https://github.com/libimobiledevice/libirecovery.git /usr/src/libirecovery && \
# cd /usr/src/libirecovery && \
# ./autogen.sh --prefix=/usr/local && make && make install

# RUN git clone https://github.com/libimobiledevice/idevicerestore.git /usr/src/idevicerestore && \
# cd /usr/src/idevicerestore && \
# ./autogen.sh --prefix=/usr/local && make && make install 

# RUN git clone https://github.com/libimobiledevice/libideviceactivation.git /usr/src/libideviceactivation && \
# cd /usr/src/libideviceactivation && \
# ./autogen.sh --prefix=/usr/local && make && make install

WORKDIR /ibackup-node
COPY . .
RUN npm ci

RUN wget -q https://github.com/jkcoxson/netmuxd/releases/download/v0.1.4/aarch64-linux-netmuxd
RUN chmod a+rwx aarch64-linux-netmuxd
RUN mv aarch64-linux-netmuxd netmuxd
RUN mv netmuxd /usr/bin

FROM node:21-alpine3.17 as runner

COPY --from=builder /usr/local /usr/local
RUN export LD_LIBRARY_PATH="/lib:/usr/lib:/usr/local/lib"

COPY --from=builder /ibackup-node /ibackup-node
COPY --from=builder /usr/bin/netmuxd /usr/bin/netmuxd

WORKDIR /ibackup-node
CMD "node" "build/index.js"
