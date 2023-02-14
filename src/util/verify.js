const jwt = require('jsonwebtoken');
const moment = require('moment');
const { gatewayServe } = require('../config/index').Config;
const { redisClient } = require('../config/redis');

/**
 * 创建令牌
 * @param {*} username 用户名
 * @param {*} loginType 登录方式 mobile webApp webAdmin win
 * @returns
 */
const createToken = async (username, loginType) => {
  //计算过期时间
  const expires = moment().add(gatewayServe.token.expires, 'days').valueOf();
  const token = jwt.sign(
    {
      name: username,
      loginType: loginType ? loginType : 'webApp',
      exp: expires,
    },
    gatewayServe.token.secret,
  );
  const expiresTTL = gatewayServe.token.expires * 24 * 60 * 60; //秒
  // 设置过期时间
  await redisClient.set(`${username}-${loginType}`, token, 'EX', expiresTTL);
  return { expires, token };
};

/**
 * 结构token信息
 * @param {*} token 令牌
 * @returns
 */
const decodeToken = async (token) => {
  const userInfo = jwt.decode(token, gatewayServe.token.secret);
  return userInfo;
};

/**
 * 登出删除token
 * @param {*} token
 */
const delToken = async (token, loginType) => {
  const userInfo = jwt.decode(token, gatewayServe.token.secret);
  await redisClient.del(`${userInfo.name}-${loginType}`);
};

module.exports = {
  createToken,
  decodeToken,
  delToken,
};
