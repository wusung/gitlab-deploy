#!/usr/bin/env bash
for i in "$@"
do
case $i in
    -p=*|--port=*)
    PORT="${i#*=}"
    shift
    ;;
    -a=*|--app=*)
    APP_NAME="${i#*=}"
    shift # past argument=value
    ;;
    -r=*|--root=*)
    APP_ROOT="${i#*=}"
    shift # past argument=value
    ;;
esac
done

APP_ROOT=${APP_ROOT:=/var/lib/www}
APP_NAME=${APP_NAME:=gitlab-deploy}
PORT=${PORT:=3030}
WORK_DIR=/opt/${APP_NAME}
SYSTEMD_SERVICE="/etc/systemd/system/${APP_NAME}.service"

if [ -d ${WORK_DIR} ]; then
    echo "${WORK_DIR} is existed. stop install."
    exit 1
fi

## Clone the repo
git clone https://github.com/wusung/gitlab-deploy.git ${WORK_DIR} || { echo >&2 "Clone failed with $?"; exit 1; }
pushd ${WORK_DIR}>/dev/null
npm install
popd >/dev/null

if [ ! -f ${SYSTEMD_SERVICE} ]; then
    cat >${SYSTEMD_SERVICE} <<EOF
[Unit]
Description=Deploy service (${APP_NAME})
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=${WORK_DIR}
ExecStart=/usr/bin/env node ${WORK_DIR}/server.js -p ${PORT} -n ${APP_NAME} -w /opt/.${APP_NAME} -a ${APP_ROOT}
TimeoutStartSec=600
TimeoutStopSec=600
StandardOutput=syslog
StandardError=syslog
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    echo "${SYSTEMD_SERVICE} created."
fi

systemctl enable ${APP_NAME}
systemctl start ${APP_NAME}
