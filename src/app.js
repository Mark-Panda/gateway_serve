const express = require('express');
const bodyParser = require('body-parser');
const child_process = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
const log4js = require('log4js');
const path = require('path');
const { gatewayServe, rootPath, staticPath } = require('./config').Config;
const router = require('./proxy/router');
const serviceLocalStorage = require('./watch/local-storage.js');
const { proxyRuleCheck, proxyTarget } = require('./proxy/proxyMiddleware');

const app = express();

const logger = log4js.getLogger();
logger.level = 'debug';

// TODO: 代理graphql请求的话bodyParser中间件会影响代理转发，如果后续仍有问题需要解决
// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
// app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/**
 * 健康检查 放在每个项目的最开始，不需要走中间件
 */
app.get('/health', bodyParser.json(), (req, res) => {
  return res.end('OK!');
});

//静态资源
app.use(express.static(staticPath));

/**
 * 在网关提供graphql-playground调试界面
 */
app.get('/playground', (req, res) => {
  return res.render('playground', {
    path: '/commonApi/graphql',
    username: 'panda',
  });
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
    onProxyReq: async function (proxyReq, req, res) {
      // proxyReq.setHeader('Content-Type', 'application/json; charset=UTF-8;');
      console.log('----代理前信息', req.proxyTargetUrl);
      /* 如果req.proxyTargetUrl不存在或者为空字符串，表示代理服务未找到 */
      if (!req.proxyTargetUrl || req.proxyTargetUrl === '') {
        res.json({ error: '', msg: '服务未启动或不可达!' });
      }
      /* 代理前赋值用户角色信息 */
    },
    onProxyRes: async function (proxyRes, req, res) {
      // console.log('----返回', res);
    },
    onError: async function (err, req, res) {
      console.log('----异常', err);
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
