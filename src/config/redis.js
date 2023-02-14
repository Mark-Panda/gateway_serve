const Redis = require('ioredis');
const { cacheConfig } = require('./index').Config;
/**
 * Redis连接客户端
 */
const redisClient = new Redis({
  port: cacheConfig.port ? cacheConfig.port : 6379,
  host: cacheConfig.host ? cacheConfig.host : 'localhost',
  password: cacheConfig.password ? cacheConfig.password : null,
  db: cacheConfig.db ? cacheConfig.db : null,
});

module.exports = {
  redisClient,
};
