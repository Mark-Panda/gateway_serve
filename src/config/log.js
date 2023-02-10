const log4js = require('log4js');

const PROCESS_NAME = process.env.name ? process.env.name : 'develop',
  PM_ID = process.env.pm_id ? process.env.pm_id : 0,
  LEVEL = 'debug',
  LAYOUT_TYPE = 'pattern',
  LAYOUT_PATTERN = '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%z] [%c] - [%m]',
  LAYOUT = { type: LAYOUT_TYPE, pattern: LAYOUT_PATTERN },
  OUT_TYPE = 'stdout',
  APP_TYPE = 'dateFile',
  APP_FILENAME = `gateway_logs/${PROCESS_NAME}/${PROCESS_NAME}_${PM_ID}.log`,
  APP_PATTERN = '.yyyy-MM-dd',
  APP_KEEPFILEEXT = true,
  APP_FILENAMESEP = '-',
  APP_NUMBACKUPS = 90,
  APPENDERS = ['out', 'app'];

log4js.configure({
  appenders: {
    out: { type: OUT_TYPE },
    app: {
      type: APP_TYPE,
      filename: APP_FILENAME,
      keepFileExt: APP_KEEPFILEEXT,
      pattern: APP_PATTERN,
      layout: LAYOUT,
      numBackups: APP_NUMBACKUPS,
      fileNameSep: APP_FILENAMESEP,
    },
  },
  categories: { default: { appenders: APPENDERS, level: LEVEL } },
  disableClustering: true,
});

module.exports = (category) => log4js.getLogger(category);
