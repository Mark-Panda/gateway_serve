const express = require('express');
const bodyParser = require('body-parser');
const { createToken, delToken } = require('../util/verify');
const router = express.Router();

/**
 * 登录
 */
router.post('/login', bodyParser.json(), async (req, res) => {
  try {
    const { username, password, loginType } = req.body;
    // 验证用户名和密码

    // 验证用户状态

    // 如果用户基础信息存在有效期设置，判断用户权限是否过了有效期

    // 如果web端支持锁屏，针对web端单独进行锁屏时间判断，锁屏重新登录时，需要删除token重新生成，或者进行token续签

    // 个性化逻辑判断

    // 生成token
    const tokenInfo = await createToken(username, loginType);
    // 返回token信息
    return res.json({ data: tokenInfo });
  } catch (error) {
    return res.json({ error: '', msg: '登录异常' });
  }
});

/**
 * 登出
 */
router.post('/logout', bodyParser.json(), async (req, res) => {
  try {
    const { loginType } = req.body;
    const token = req.headers['authorization'];
    // token验证
    // 删除缓存及关联Redis等信息
    await delToken(token, loginType);
    return res.json({ data: { logout: true } });
  } catch (error) {
    return res.json({ error: '', msg: '登出异常' });
  }
});

module.exports = router;
