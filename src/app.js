const express = require('express');
const child_process = require('child_process');
const path = require('path');
const { gatewayServe, rootPath, staticPath } = require('./config').Config;
const router = require('./routers/router');
const serviceLocalStorage = require('./watch/local-storage.js');
const { proxyRuleCheck, proxyForward } = require('./proxy/proxyMiddleware');
const log = require('./config/log')('gateway_proxy');

const app = express();

// TODO: 代理graphql请求的话bodyParser中间件会影响代理转发，如果后续仍有问题需要解决

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/**
 * 健康检查 放在每个项目的最开始，不需要走中间件
 */
app.get('/health', (req, res) => {
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
app.use(proxyForward());

// fork一个子进程，用于监听服务节点变化
const workerProcess = child_process.fork(rootPath + '/src/watch/startWatch.js');

// 子进程退出
workerProcess.on('exit', function (code) {
  log.info(`服务发现子进程已退出: ${code}`);
});
workerProcess.on('error', function (error) {
  log.info(`服务发现进程错误: ${error}`);
});

// 接收变化的服务列表，并更新到缓存中
workerProcess.on('message', (msg) => {
  if (msg) {
    log.info(`从监控中数据变化：${JSON.stringify(msg)}`);
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
    log.debug(`${msg.name}微服务信息`, serveList);
    //更新缓存中服务列表
    serviceLocalStorage.setItem(msg.name, serveList);
  }
});

app.listen(gatewayServe.port, () => {
  log.info('服务运行端口', gatewayServe.port);
});
