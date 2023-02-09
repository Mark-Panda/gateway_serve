const Watch = require('./watch');
const { consulServe, serveList } = require('../config').Config;
console.log('所有微服务列表', serveList);
const watch = new Watch(consulServe.host, consulServe.port);
// 监听服务节点，如果发现变化，则通知主进程的服务列表进行更新
watch.watch(serveList, (error, data) => {
  process.send(data);
});
