const Discovery = require('../discovery/discovery');
const consulClient = require('../consul/consul');
const { serveList } = require('../config').Config;

const discovery = new Discovery(consulClient);

/**
 * 根据服务名称获取服务对应host
 * @param {String} name 服务名称
 * @returns
 */
const getServiceHost = async (name) => {
  const services = await discovery.getService({ service: name });
  console.log('ppppppp----services', services);
  //生成[0,max]任意随机数
  random = Math.floor(Math.random() * services.length);
  //定义随机数，随机获取ip的负载均衡策略
  const host = services[random];
  return host;
};

/**
 * 获取所有的服务列表信息
 * @returns
 */
const getServiceList = async () => {
  let allServiceList = [];
  for (let item of serveList) {
    const services = await discovery.getService({ service: item });
    if (services) {
      if (Array.isArray(services)) {
        allServiceList = allServiceList.concat(services);
      } else {
        allServiceList.push(services);
      }
    }
  }
  return allServiceList;
};

/**
 * 检查服务运行状态
 * @param {String} serveName 服务名称
 * @returns
 */
const checkServiceStatus = async (serveName) => {
  const serviceStatus = await discovery.checkServeStatus(serveName);
  return serviceStatus;
};

module.exports = {
  getServiceHost,
  getServiceList,
  checkServiceStatus,
};
