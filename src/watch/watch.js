const Consul = require('consul');
const log = require('../config/log')('gateway_watch');

class Watch {
  constructor({ consulhost, consulport }) {
    this.consul = new Consul({
      host: consulhost,
      port: consulport,
      promisify: true,
    });
  }
  /**
   * 监控需要的服务
   * @param {*} services
   * @param {*} onChanged
   */
  watch(services, onChanged) {
    const consul = this.consul;
    if (services === undefined) {
      throw new Error('service 不能为空');
    }
    if (typeof services === 'string') {
      serviceWatch(services);
    } else if (services instanceof Array) {
      services.forEach((service) => {
        serviceWatch(service);
      });
    }
    // 监听服务核心代码
    function serviceWatch(service) {
      const watch = consul.watch({
        method: consul.health.service,
        options: {
          service,
        },
      });
      // 监听服务如果发现，则触发回调方法
      watch.on('change', (data) => {
        const result = {
          name: service,
          data,
        };
        log.info(`监听${service}内容有变化：${JSON.stringify(result)}`);
        onChanged(null, result);
      });
      watch.on('error', (error) => {
        log.error(`监听${service}错误,错误的内容为：${error}`);
        onChanged(error, null);
      });
    }
    return this;
  }
}

module.exports = Watch;
