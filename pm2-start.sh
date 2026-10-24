#!/bin/bash
cd /home/IoTPlatform

cleanup() {
    echo "Stopping IoTPlatform containers..."
    docker compose stop
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting IoTPlatform services via Docker Compose..."
exec docker compose up
