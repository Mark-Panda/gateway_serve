const Consul = require('consul');
const { consulServe, gatewayServe } = require('../config').Config;
class ConsulConfig {
  /**
   * consul初始化信息
   * @param {String} consulhost consul连接地址
   * @param {Number} consulport consul连接端口
   * @param {String} servicehost 注册服务连接地址
   * @param {Number} serviceport 注册服务端口
   * @param {String} serviceName 注册服务名称
   */
  constructor({
    consulhost,
    consulport,
    servicehost,
    serviceport,
    serviceName,
  }) {
    // console.log('===', 'http://' + servicehost + ':' + serviceport + '/health');
    this.consul = new Consul({
      host: consulhost,
      port: consulport,
      promisify: true,
    });
    if (servicehost && serviceport && serviceName) {
      // 服务注册
      this.consul.agent.service.register(
        {
          name: serviceName,
          address: servicehost,
          port: serviceport,
          check: {
            http: 'http://' + servicehost + ':' + serviceport + '/health',
            interval: '10s',
            timeout: '5s',
          },
        },
        function (err, result) {
          if (err) {
            console.error(err);
            throw err;
          }

          console.log(serviceName + ' 注册成功！');
        },
      );
    }
  }

  async getConfig(key) {
    const result = await this.consul.kv.get(key);

    if (!result) {
      return Promise.reject(key + '不存在');
    }

    return JSON.parse(result.Value);
  }

  async getUserConfig(key) {
    const result = await this.getConfig('develop/user');

    if (!key) {
      return result;
    }

    return result[key];
  }

  async setUserConfig(key, val) {
    const user = await this.getConfig('develop/user');

    user[key] = val;

    return this.consul.kv.set('develop/user', JSON.stringify(user));
  }

  async delNode(key) {
    //删除节点
    this.consul.agent.service.deregister(key);
    return true;
  }

  /**
   * 服务状态列表
   * @returns
   */
  /**
   * Example
   *
   * {
   *    'service:gateway_serve': {
   *      Node: 'consulserver',
   *      CheckID: 'service:gateway_serve',
   *      Name: "Service 'gateway_serve' check",
   *      Status: 'passing',
   *      Notes: '',
   *      Output: 'HTTP GET http://172.26.166.27:6701/health: 200 OK Output: OK!',
   *      ServiceID: 'gateway_serve',
   *      ServiceName: 'gateway_serve'
   *    }
   * }
   */
  async serviceStatusList() {
    return this.consul.agent.check.list();
  }

  /**
   * 服务列表
   * @returns
   */
  async serviceList() {
    return this.consul.agent.service.list();
  }

  /**
   * 返回服务的节点和健康信息
   * @param {*} serveName 服务名称
   * @returns
   */
  /**
   * Example
   * [
   *    {
   *      "Node": {
   *        "Node": "consulserver",
   *        "Address": "172.18.0.2"
   *      },
   *      "Service": {
   *        "ID": "gateway_serve",
   *        "Service": "gateway_serve",
   *        "Tags": null,
   *        "Address": "172.26.166.27",
   *        "Port": 6701
   *       },
   *      "Checks": [
   *          {
   *            "Node": "consulserver",
   *            "CheckID": "service:gateway_serve",
   *            "Name": "Service 'gateway_serve' check",
   *            "Status": "passing",
   *            "Notes": "",
   *            "Output": "HTTP GET http://172.26.166.27:6701/health: 200 OK Output: OK!",
   *            "ServiceID": "gateway_serve",
   *            "ServiceName": "gateway_serve"
   *          },
   *          {
   *            "Node": "consulserver",
   *            "CheckID": "serfHealth",
   *            "Name": "Serf Health Status",
   *            "Status": "passing",
   *            "Notes": "",
   *            "Output": "Agent alive and reachable",
   *            "ServiceID": "",
   *            "ServiceName": ""
   *          }
   *      ]
   *    }
   * ]
   */
  async getHealthServe(serveName) {
    console.log('999999', serveName);
    return this.consul.health.service(serveName);
  }

  /**
   * 获取指定服务的信息
   * @param {*} opts 查询节点节点名称
   * @returns
   */
  /**
   * Example
   *
   * {
   *    "Node": "consulserver",
   *    "Address": "172.19.0.3",
   *    "ServiceID": "gateway_serve",
   *    "ServiceName": "gateway_serve",
   *    "ServiceTags": null,
   *    "ServiceAddress": "172.26.166.27",
   *    "ServicePort": 6701
   * }
   */
  async getCatalogNode(opts) {
    return this.consul.catalog.service.nodes(opts);
  }

  /**
   * 监听端点变化
   * @param {*} opts
   * @returns
   */
  async watch(opts) {
    return this.consul.watch(opts);
  }
}

const consulClient = new ConsulConfig({
  consulhost: consulServe.host,
  consulport: consulServe.port,
  servicehost: '172.26.165.67',
  serviceport: 3100,
  serviceName: gatewayServe.serveName,
});

module.exports = consulClient;
