/*
 * 读取配置文件内容
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const rootPath = path.resolve(process.cwd());
const { getField, setField } = require('../util');

let { NODE_ENV } = process.env;
const sysConfig = `${rootPath}/src/config.yml`;
const sysInfo = yaml.load(fs.readFileSync(sysConfig, 'utf8'));

/**
 * 根据环境变量初始化配置信息
 * @param {Object} fieldObject 对象
 * @param {String} fieldPath 路径
 * @param {String} envValue 环境变量值
 * @param {String} defValue 默认值
 */
const initConfigField = (fieldObject, fieldPath, envValue, defValue) => {
  const configFieldValue = getField(fieldObject, fieldPath, defValue);
  setField(fieldObject, fieldPath, envValue || configFieldValue);
};

let config = {
  gatewayServe: sysInfo.gatewayServe,
  consulServe: sysInfo.consulServe,
  serveList: sysInfo.serveList,
  serveSignURL: sysInfo.serveSignURL,
  rootPath,
  staticPath: `${rootPath}/src/public`,
  RuntimeENV: {
    //开发环境
    development: NODE_ENV === 'development',
    //生产环境
    production: NODE_ENV === 'production',
  },
};

// 获取环境变量中consul服务的访问地址
initConfigField(
  config.consulServe,
  'host',
  process.env.CONFIG_CONSULSERVE_HOST,
  '192.168.1.102',
);

// 获取环境变量中consul服务的访问端口
initConfigField(
  config.consulServe,
  'port',
  process.env.CONFIG_CONSULSERVE_PORT,
  8500,
);

module.exports = {
  get Config() {
    return config;
  },
};
