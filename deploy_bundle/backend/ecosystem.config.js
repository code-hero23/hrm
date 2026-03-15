module.exports = {
  apps: [
    {
      name: 'employee-database-backend',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5018
      }
    }
  ]
};
