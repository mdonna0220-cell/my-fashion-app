// 1. 引入必要的库 (Import necessary libraries)
const express = require('express');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

// 2. 创建 Express 应用 (Create Express app)
const app = express();
const PORT = process.env.PORT || 3000;

// --- 安全密钥配置 (Security Keys Configuration) ---
// 用于 API 代理的 Google AI API 密钥
const API_KEY = process.env.API_KEY || 'AIzaSyCcUxkWBvKO7EbMOhq8bc6gCakjBSmhIgs';
// 用于签发用户登录 Token 的密钥，在真实项目中应设置为一个长且复杂的随机字符串
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secret-and-long-string-for-jwt';

// 3. 中间件设置 (Middleware Setup)
app.use(cors()); // 允许跨域请求
app.use(express.json({ limit: '10mb' })); // 解析 JSON 请求体，并设置大小限制
app.use(express.static(path.join(__dirname, 'public'))); // 托管 public 文件夹中的静态文件 (如 index.html)

// --- 模拟数据库和验证码存储 ---
// 在真实应用中，这些应该被替换为真实的数据库 (如 Redis, MySQL, MongoDB)
const users = {}; // 用一个简单的对象模拟用户数据库 { '138...': { phone: '138...' } }
const verificationCodes = {}; // { '138...': { code: '1234', expires: 167... } }

// 4. API 路由 (API Routes)

// A. 发送手机验证码
app.post('/api/send-code', (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ error: '无效的手机号码' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 生成一个4位数验证码
    const expires = Date.now() + 5 * 60 * 1000; // 5分钟后过期

    verificationCodes[phone] = { code, expires };

    // --- 模拟短信发送 ---
    // 在真实应用中，这里会调用短信服务商的API
    console.log(`发送验证码到 ${phone}: ${code}`);
    // --- 模拟结束 ---

    res.json({ success: true, message: '验证码已发送' });
});

// B. 验证验证码并登录/注册
app.post('/api/verify-code', (req, res) => {
    const { phone, code } = req.body;
    const storedCode = verificationCodes[phone];

    if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires) {
        return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 用户验证成功，删除验证码
    delete verificationCodes[phone];

    // 如果是新用户，则“注册”
    if (!users[phone]) {
        console.log(`新用户注册: ${phone}`);
        users[phone] = { phone };
    }

    // 为用户签发一个JWT Token
    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' }); // Token有效期为7天

    res.json({ success: true, token });
});

// C. JWT 认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.sendStatus(401); // 未提供 Token，禁止访问
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Token 无效或已过期，禁止访问
        }
        req.user = user; // 将用户信息附加到请求对象上
        next(); // 继续执行下一个中间件或路由处理器
    });
};


// D. AI 功能的 API 代理 (受保护的路由)
app.post('/api/generateContent/:model(*)', authenticateToken, async (req, res) => {
    const { model } = req.params;
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    
    try {
        const response = await axios.post(googleApiUrl, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error('API 代理出错:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ 
            error: '代理服务器处理请求失败',
            details: error.response?.data 
        });
    }
});


// 5. 托管前端应用 (Catch-all Route)
// 确保所有未匹配到API路由的请求都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. 启动服务器 (Start the Server)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器正在 http://0.0.0.0:${PORT} 上运行`);
});

