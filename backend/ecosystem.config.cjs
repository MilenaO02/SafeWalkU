module.exports = {
  apps: [
    {
      name: 'safewalk-backend',
      script: 'dist/server.js',
      cwd: '/var/www/SafeWalkU',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      time: true,
      error_file: '/var/www/SafeWalkU/logs/pm2-error.log',
      out_file: '/var/www/SafeWalkU/logs/pm2-out.log'
    }
  ]
};
