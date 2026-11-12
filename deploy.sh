#!/usr/bin/env bash
# Upload versi terbaru aplikasi Lutut Kuat ke VPS (https://lututkuat.web.id)
# Pakai: bash deploy.sh
# Ingat: naikkan versi CACHE di lutut-kuat/sw.js setiap ada perubahan, agar HP pengguna ikut ter-update.
set -euo pipefail
cd "$(dirname "$0")"
tar --exclude=PANDUAN.md --exclude=secret.js --exclude=secret.example.js -czf - -C lutut-kuat . \
  | ssh -i ~/.ssh/pakaicloud_mmb root@31.58.103.170 \
    'tar -xzf - -C /opt/lutut-kuat && chmod -R a+rX /opt/lutut-kuat && echo "Selesai: https://lututkuat.web.id"'
