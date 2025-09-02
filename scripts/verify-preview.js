#!/usr/bin/env node

/**
 * AI Inbox Digest 预览域名验证脚本
 * 功能：交互式输入预览域名，自动注入BASE_URL并运行测试
 */

const { execa } = require('execa');
const prompts = require('prompts');

async function main() {
  console.log('🚀 AI Inbox Digest 预览域名验证');
  console.log('=' * 50);
  
  try {
    // 交互式输入预览域名
    const response = await prompts({
      type: 'text',
      name: 'previewDomain',
      message: '请输入预览域名（如：https://xxx.vercel.app）',
      validate: (value) => {
        if (!value) return '预览域名不能为空';
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return '预览域名必须以 http:// 或 https:// 开头';
        }
        return true;
      }
    });

    if (!response.previewDomain) {
      console.log('❌ 未输入预览域名，退出验证');
      process.exit(0);
    }

    const previewDomain = response.previewDomain.trim();
    console.log(`\n📡 使用预览域名: ${previewDomain}`);
    
    // 验证预览域名可访问性
    console.log('🔍 正在验证预览域名可访问性...');
    try {
      const healthCheck = await execa('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', `${previewDomain}/api/health`]);
      if (healthCheck.stdout === '200') {
        console.log('✅ 预览域名健康检查通过');
      } else {
        console.log(`⚠️  健康检查返回状态码: ${healthCheck.stdout}`);
      }
    } catch (error) {
      console.log('⚠️  健康检查失败，但继续测试');
    }

    // 设置环境变量并运行测试
    console.log('🧪 正在运行预览域名测试...');
    const env = { ...process.env, BASE_URL: previewDomain };
    
    const result = await execa('npx', ['playwright', 'test'], {
      env,
      stdio: 'inherit'
    });

    // 根据退出码判断结果
    if (result.exitCode === 0) {
      console.log('\n🎉 预览域名测试通过！');
      console.log(`✅ 所有测试在 ${previewDomain} 上成功运行`);
    } else {
      console.log('\n❌ 预览域名测试失败！');
      console.log('请检查以下问题：');
      console.log('1. 预览域名是否正确且可访问');
      console.log('2. 环境变量是否配置正确');
      console.log('3. CORS策略是否允许测试');
      console.log('\n💡 请把报错原文贴回给Cursor，我会帮您分析问题');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    console.log('\n💡 请把报错原文贴回给Cursor，我会帮您分析问题');
    process.exit(1);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('❌ 未预期的错误:', error);
  process.exit(1);
});
