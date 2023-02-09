const { gatewayServe, serveSignURL } = require('../config').Config;
const serviceLocalStorage = require('../watch/local-storage');
const { getServiceHost } = require('./service');

/**
 * 动态获取代理目标地址
 */
const proxyTarget = async (req) => {
  let target = '';
  //随机访问地址
  const serverInfo = await getServiceHost(req.proxyServeName);
  if (serverInfo) {
    //拼接target地址
    target = 'http://' + serverInfo['address'] + ':' + serverInfo['port'];
  }
  req.proxyTargetUrl = target;
  return target;
};

/**
 * 代理规则判断
 * @returns
 */
const proxyRuleCheck = () => {
  return async (req, res, next) => {
    try {
      // 匹配出当前请求路由
      const baseUrl = req.url.split('?')[0].split('/')[1];
      // 白名单直接过
      const whileUrl = gatewayServe.whileList.filter(
        (fileld) => fileld === baseUrl,
      );
      if (whileUrl.length > 0) {
        return next();
      }
      // 根据路由判断需要寻址到哪个微服务上面
      for (let item of serveSignURL) {
        // 找到了对应的微服务
        if (item[baseUrl]) {
          // 判断当前微服务是否正常运行
          const serverInfo = serviceLocalStorage.getItem(item[baseUrl]);
          // 服务正常运行继续
          if (serverInfo && serverInfo.length > 0) {
            // 代理转发
            req.proxyServeName = item[baseUrl];
            return next();
          }
          // 没有运行直接抛出错误提示服务尚未运行
          return res.json({ error: '', msg: `${item[baseUrl]}服务未运行` });
        }
      }
      return res.json({ error: '', msg: 'API不存在' });
    } catch (error) {
      res.status(401);
      res.json({ error: '', msg: '路由代理规则检查异常' });
    }
  };
};

module.exports = {
  proxyTarget,
  proxyRuleCheck,
};
