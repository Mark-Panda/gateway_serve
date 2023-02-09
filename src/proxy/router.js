const express = require('express');
const {
  getServiceHost,
  checkServiceStatus,
  getServiceList,
} = require('./service');
const router = express.Router();

router.get('/gateway_serve', async (req, res) => {
  //获取具体ip信息
  const host = await getServiceHost('gateway_serve');
  console.log('-----host', host);
  return res.json({ data: host });
});

router.get('/getAllServe', async (req, res) => {
  //获取具体ip信息
  const allserveList = await getServiceList();
  return res.json({ data: allserveList });
});

router.get('/checkServiceStatus/llllll', async (req, res) => {
  const sss = req.url.split('?')[0].split('/')[1];
  // const sss = req.url.split('?')[0].replace(/(#|\/)/g, '');
  console.log('UUUUU', sss);
  //获取具体ip信息
  const allserveList = await checkServiceStatus('gateway_serve');
  return res.json({ data: allserveList });
});

module.exports = router;
