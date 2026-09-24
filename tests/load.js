// 从 index.html 取出游戏脚本，在 Node 里无界面运行；patch 用于注入测试专用接口
const fs = require('fs'), path = require('path');
module.exports = function load(patch) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  let src = html.split('<script>')[1].split('</script>')[0];
  if (patch) src = patch(src);
  return new Function('window', src + '\nreturn GAME;')(undefined);
};
