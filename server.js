// server.js

// 1. 引入必要的库
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config(); 

// 2. 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// --- API 密钥 (安全地存储在后端) ---
const API_KEY = process.env.API_KEY || 'AIzaSyCcUxkWBvKO7EbMOhq8bc6gCakjBSmhIgs'; 

// 3. 使用中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));


// 4. 创建一个更强大的 API 代理路由
// 它可以处理所有类型的请求，包括带有 Google 搜索工具的请求
app.post('/api/generateContent/:model(*)', async (req, res) => {
    const { model } = req.params;
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    
    try {
        // 将前端发来的完整请求体 (包括可能的 'tools' 字段) 直接转发给 Google
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

// 5. 托管前端文件
// 当用户访问任何未匹配到 API 的路径时，都返回 public 文件夹中的 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器正在 http://0.0.0.0:${PORT} 上运行`);
});

