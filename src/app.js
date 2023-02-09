const express = require('express');
const bodyParser = require('body-parser');
const child_process = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
const log4js = require('log4js');
const { gatewayServe, rootPath } = require('./config').Config;
const router = require('./proxy/router');
const serviceLocalStorage = require('./watch/local-storage.js');
const { proxyRuleCheck, proxyTarget } = require('./proxy/proxyMiddleware');

const app = express();

const logger = log4js.getLogger();
logger.level = 'debug';

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

/**
 * 健康检查 放在每个项目的最开始，不需要走中间件
 */
app.get('/health', bodyParser.json(), (req, res) => {
  return res.end('OK!');
});

/**
 * 鉴权中间件
 */
// app.use(authMiddlwware())

/**
 * 路由代理规则检查中间件
 */
app.use(proxyRuleCheck());

/**
 * 当前服务API必须放在路由转发中间件之前
 */
app.use('/', router);

/**
 * 路由代理转发中间件
 */
app.use(
  createProxyMiddleware({
    changeOrigin: true,
    logger,
    router: async function (req) {
      const url = await proxyTarget(req);
      return url;
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log('----代理前信息', req);
        /* 如果req.proxyTargetUrl不存在或者为空字符串，表示代理服务未找到 */
        if (!req.proxyTargetUrl || req.proxyTargetUrl === '') {
          res.json({ error: '', msg: '服务未启动或不可达!' });
        }
        /* 代理前赋值用户角色信息 */
      },
    },
  }),
);

// fork一个子进程，用于监听服务节点变化
const workerProcess = child_process.fork(rootPath + '/src/watch/startWatch.js');

// 子进程退出
workerProcess.on('exit', function (code) {
  console.log(`子进程已退出，退出码：${code}`);
});
workerProcess.on('error', function (error) {
  console.log(`error: ${error}`);
});

// 接收变化的服务列表，并更新到缓存中
workerProcess.on('message', (msg) => {
  if (msg) {
    console.log(`从监控中数据变化：${JSON.stringify(msg)}`);
    let serveList = [];
    for (let serveItem of msg.data) {
      if (serveItem['Checks'][0]['Status'] === 'passing') {
        const serveInfo = {
          serveName: serveItem['Service']['Service'],
          address: serveItem['Service']['Address'],
          port: serveItem['Service']['Port'],
          status: serveItem['Checks'][0]['Status'],
        };
        serveList.push(serveInfo);
      }
    }
    console.log(`${msg.name}微服务信息`, serveList);
    //更新缓存中服务列表
    serviceLocalStorage.setItem(msg.name, serveList);
  }
});

app.listen(gatewayServe.port, () => {
  console.log('服务运行端口', gatewayServe.port);
});
