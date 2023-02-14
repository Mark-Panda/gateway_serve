const os = require('os');
/**
 * 根据路径获得属性,支持数组
 * @param {object} obj 对象
 * @param {string} path 路径
 * @param {string} def 默认值
 */
function getField(obj, path, def) {
  /**
   * If the path is a string, convert it to an array
   * @param  {String|Array} path The path
   * @return {Array}             The path array
   */
  const stringToPath = function (path) {
    // If the path isn't a string, return it
    if (typeof path !== 'string') return path;

    // Create new array
    var output = [];

    // Split to an array with dot notation
    path.split('.').forEach(function (item, _index) {
      // Split to an array with bracket notation
      item.split(/\[([^}]+)\]/g).forEach(function (key) {
        // Push to the new array
        if (key.length > 0) {
          output.push(key);
        }
      });
    });

    return output;
  };

  // Get the path as an array
  path = stringToPath(path);

  // Cache the current object
  var current = obj;

  // For each item in the path, dig into the object
  for (var i = 0; i < path.length; i++) {
    // If the item isn't found, return the default (or null)
    if (current[path[i]] === undefined) return def;

    // Otherwise, update the current  value
    current = current[path[i]];
  }
  return current;
}

/**
 * 为对象添加属性
 * @param {Object} obj 对象
 * @param {String} keyPath 路径
 * @param {Object} value 值
 */
function setField(obj, keyPath, value) {
  //匹配出属性名
  var array = keyPath.match(/\w+/g);
  //遍历属性名数组
  for (var i = 0; i < array.length - 1; i++) {
    var cur = array[i];
    var next = array[i + 1];
    //创建对象
    if (!obj[cur]) {
      //如果要创建的是对象
      if (isNaN(next)) {
        obj[cur] = {};
      } //如果要创建的是数组
      else {
        obj[cur] = [];
      }
    }
    //obj指向新创建的对象
    obj = obj[cur];
  }
  //最后一步赋值
  obj[array[i]] = value;
}

/**
 * 获取当前机器的ip地址
 */
function getIpAddress() {
  let ifaces = os.networkInterfaces();
  for (let dev in ifaces) {
    let iface = ifaces[dev];
    for (let i = 0; i < iface.length; i++) {
      let { family, address, internal } = iface[i];
      if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
        return address;
      }
    }
  }
}

module.exports = {
  setField,
  getField,
  getIpAddress,
};
