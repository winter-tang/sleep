const { execSync } = require('child_process');
const path = require('path');

console.log('正在打包 APK...');

try {
  const output = execSync('cd /Users/wintert/Documents/trae_projects/android && ./gradlew assembleDebug', {
    encoding: 'utf8'
  });
  
  console.log('打包成功！');
  console.log('输出:', output);
  
} catch (error) {
  console.error('打包失败:');
  console.error('stderr:', error.stderr);
  console.error('stdout:', error.stdout);
  console.error('代码:', error.status);
}
