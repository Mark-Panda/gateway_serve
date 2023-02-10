const { PrismaClient } = require('@prisma/client');
const { dbConfig } = require('./index').Config;
const log = require('./log')('gateway_prisma');

/**
 * 业务逻辑模块客户端
 */
const baseClient = new PrismaClient({
  errorFormat: 'colorless',
  datasources: {
    db: {
      url: dbConfig.link, //覆盖@prisma/client方式
    },
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

const { NODE_ENV } = process.env;
if (NODE_ENV !== 'production') {
  baseClient.$on('query', (event) => {
    log.debug(event, '查询日志');
  });
}

module.exports = baseClient;
