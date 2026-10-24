module.exports = {
  apps: [
    {
      name: 'iotplatform',
      cwd: '/home/IoTPlatform',
      script: '/home/IoTPlatform/pm2-start.sh',
      interpreter: '/bin/bash',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
