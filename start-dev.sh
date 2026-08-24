#!/bin/bash
# Keep dev server alive
while true; do
  cd /home/z/my-project
  bun run dev 2>&1 | tee -a dev.log
  echo "[$(date)] Server died, restarting in 2s..." >> dev.log
  sleep 2
done
