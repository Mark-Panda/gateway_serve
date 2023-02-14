const { createProxyMiddleware } = require('http-proxy-middleware');
const { gatewayServe, serveSignURL } = require('../config').Config;
const serviceLocalStorage = require('../watch/local-storage');
const { getServiceHost } = require('./service');
const log = require('../config/log')('gateway_proxy');

/**
 * 动态获取代理目标地址
 */
const proxyTarget = async (req) => {
  let target = '';
  if (req.proxyServeName) {
    //随机访问地址
    const serverInfo = await getServiceHost(req.proxyServeName);
    if (serverInfo) {
      //拼接target地址
      target = 'http://' + serverInfo['address'] + ':' + serverInfo['port'];
    }
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
          return res.json({
            error: 'NOSERVER',
            msg: `${item[baseUrl]}服务未运行`,
          });
        }
      }
      return res.json({ error: 'NOAPI', msg: 'API不存在' });
    } catch (error) {
      res.status(401);
      res.json({ error: 'PROXY_CHECK_ERROR', msg: '路由代理规则检查异常' });
    }
  };
};

/**
 * 代理转发
 * @returns
 */
const proxyForward = () => {
  return createProxyMiddleware({
    changeOrigin: true,
    router: async function (req) {
      const url = await proxyTarget(req);
      return url;
    },
    onProxyReq: async function (proxyReq, req, res) {
      log.debug('服务代理地址', req.proxyTargetUrl);
      /* 如果req.proxyTargetUrl不存在或者为空字符串，表示代理服务未找到 */
      if (!req.proxyTargetUrl || req.proxyTargetUrl === '') {
        res.json({ error: 'NOSERVER', msg: '服务未启动或不可达!' });
      }
      /* 代理前赋值用户角色信息 */
    },
    onProxyRes: async function (proxyRes, req, res) {
      // console.log('----返回', res);
    },
    onError: async function (err, req, res) {
      log.error('服务代理异常', err);
      res.json({ error: 'PROXY_ERROR', msg: '服务请求异常!' });
    },
  });
};

module.exports = {
  proxyRuleCheck,
  proxyForward,
};
