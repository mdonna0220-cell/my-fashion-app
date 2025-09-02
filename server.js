// server.js

// 1. 引入必要的库 (Import necessary libraries)
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config(); // 用于从 .env 文件加载环境变量

// 2. 创建 Express 应用 (Create Express app)
const app = express();
const PORT = process.env.PORT || 3000; // 服务器运行的端口 (Port for the server)

// --- 安全措施 (Security Measure) ---
// 请在这里填入你的API密钥。
// 最佳实践是稍后在服务器上创建一个名为 .env 的文件，并在其中写入 API_KEY=你的密钥
const API_KEY = process.env.API_KEY || 'AIzaSyCcUxkWBvKO7EbMOhq8bc6gCakjBSmhIgs'; 

if (!API_KEY || API_KEY.includes('AIzaSyCcUxkWBvKO7EbMOhq8bc6gCakjBSmhIgs')) {
    console.warn("警告: 正在使用一个示例或空的 API 密钥。请确保在服务器上配置了正确的密钥。");
}

// 3. 使用中间件 (Use middleware)
app.use(express.json({ limit: '10mb' })); // 解析JSON格式的请求体 (Parse JSON request bodies)
app.use(express.static(path.join(__dirname, 'public'))); // 托管 public 文件夹中的静态文件 (Serve static files from 'public' folder)

// 4. 创建 API 代理路由 (Create API proxy route)
app.post('/api/generateContent/:model(*)', async (req, res) => {
    const { model } = req.params;
    const validModels = ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-image-preview'];

    if (!validModels.includes(model)) {
        return res.status(400).json({ error: '无效的模型名称' });
    }

    try {
        const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        
        const response = await axios.post(googleApiUrl, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.json(response.data);

    } catch (error) {
        console.error('代理请求到 Google API 时出错:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ 
            error: '代理服务器处理请求失败',
            details: error.response?.data 
        });
    }
});

// 捕获所有其他路由并返回前端页面 (Catch-all route to serve the frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. 启动服务器 (Start the server)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器正在 http://0.0.0.0:${PORT} 上运行`);
});
