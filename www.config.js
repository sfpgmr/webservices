module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : 'www',
      script    : '/home/sfpg/www/webservices/webserver/bin/www.js',
      node_args:['--expose-gc'],
      exec_mode: "fork",
      cwd:'/home/sfpg/www/webservices/webserver'
    },
    {
      name      : 'metrop',
      script    : '/home/sfpg/www/webservices/metrop/node/getTrainInfo.js',
      node_args:['--expose-gc'],
      cwd:'/home/sfpg/www/webservices/metrop/node'
    }
  ]

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  /*deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    dev : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/development',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }*/
};
