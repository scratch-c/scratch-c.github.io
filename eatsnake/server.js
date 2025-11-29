/**
 * 贪吃蛇联机游戏后端（根目录版）
 * 支持WebSocket联机、跨域、公网部署，前端文件直接放在根目录
 */
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

// 初始化Express应用
const app = express();
// 全局跨域允许（适配GitHub Pages前端跨域）
app.use(cors({
  origin: '*', // 生产环境可限定为你的GitHub Pages域名
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 托管根目录的前端文件（本地测试时访问 http://localhost:8080 直接打开index.html）
app.use(express.static(path.join(__dirname)));

// 创建HTTP服务器（WebSocket挂载到HTTP服务器）
const server = http.createServer(app);

// 初始化WebSocket服务器
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true
});

// ===================== 游戏核心逻辑 =====================
const players = new Map(); // 存储联机玩家
let playerId = 1;          // 自增玩家ID
const gridSize = 20;       // 格子尺寸（和前端一致）
const canvasWidth = 800;
const canvasHeight = 600;

// 生成随机食物（避开所有蛇身）
function generateFood() {
  let x, y;
  do {
    x = Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize;
    y = Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize;
  } while (Array.from(players.values()).some(player => 
    player.snake.some(seg => seg.x === x && seg.y === y)
  ));
  return { x, y };
}

let food = generateFood(); // 全局共享食物

// 广播消息给所有在线玩家
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// 处理新玩家连接
wss.on('connection', (ws) => {
  const currentId = playerId++;
  console.log(`玩家${currentId}已连接，当前在线：${players.size + 1}`);

  // 初始化玩家数据
  const initSnake = [
    { 
      x: Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize,
      y: Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize
    }
  ];
  players.set(currentId, {
    id: currentId,
    snake: initSnake,
    direction: 'right',
    score: 0,
    color: `hsl(${Math.random() * 360}, 80%, 50%)` // 随机玩家颜色
  });

  // 向新玩家发送初始化数据
  ws.send(JSON.stringify({
    type: 'init',
    playerId: currentId,
    food: food,
    players: Array.from(players.values())
  }));

  // 广播新玩家加入
  broadcast({
    type: 'playerJoin',
    player: players.get(currentId),
    onlineCount: players.size
  });

  // 处理玩家消息（方向控制等）
  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData);
      const player = players.get(currentId);
      if (!player) return;

      switch (data.type) {
        // 玩家方向更新
        case 'direction': {
          const oppositeMap = { up: 'down', down: 'up', left: 'right', right: 'left' };
          if (data.direction && data.direction !== oppositeMap[player.direction]) {
            player.direction = data.direction;
            broadcast({
              type: 'playerUpdate',
              player: { id: currentId, direction: player.direction }
            });
          }
          break;
        }

        // 玩家重置
        case 'reset': {
          player.snake = initSnake;
          player.direction = 'right';
          player.score = 0;
          broadcast({
            type: 'playerUpdate',
            player: { id: currentId, snake: player.snake, direction: 'right', score: 0 }
          });
          break;
        }
      }
    } catch (err) {
      console.error('消息解析失败：', err);
    }
  });

  // 玩家断开连接
  ws.on('close', () => {
    players.delete(currentId);
    console.log(`玩家${currentId}已断开，当前在线：${players.size}`);
    broadcast({
      type: 'playerLeave',
      playerId: currentId,
      onlineCount: players.size
    });
  });

  // 连接错误处理
  ws.on('error', (err) => {
    console.error(`玩家${currentId}连接错误：`, err);
  });
});

// 游戏主循环（10帧/秒）
setInterval(() => {
  if (players.size === 0) return;

  // 更新所有玩家蛇位置
  players.forEach(player => {
    const head = { ...player.snake[0] };
    // 移动头部
    switch (player.direction) {
      case 'up': head.y -= gridSize; break;
      case 'down': head.y += gridSize; break;
      case 'left': head.x -= gridSize; break;
      case 'right': head.x += gridSize; break;
    }

    // 边界穿墙
    if (head.x < 0) head.x = canvasWidth - gridSize;
    if (head.x >= canvasWidth) head.x = 0;
    if (head.y < 0) head.y = canvasHeight - gridSize;
    if (head.y >= canvasHeight) head.y = 0;

    // 插入新头部
    player.snake.unshift(head);

    // 检测吃食物
    let isEatFood = false;
    if (head.x === food.x && head.y === food.y) {
      isEatFood = true;
      player.score += 10;
      food = generateFood();
    }

    // 未吃食物则移除尾部
    if (!isEatFood) player.snake.pop();

    // 检测自身碰撞
    let isSelfCrash = false;
    for (let i = 1; i < player.snake.length; i++) {
      if (head.x === player.snake[i].x && head.y === player.snake[i].y) {
        isSelfCrash = true;
        break;
      }
    }

    // 检测玩家间碰撞
    let isPlayerCrash = false;
    let crashPlayerId = -1;
    players.forEach(other => {
      if (other.id === player.id) return;
      for (let seg of other.snake) {
        if (head.x === seg.x && head.y === seg.y) {
          isPlayerCrash = true;
          crashPlayerId = other.id;
          return;
        }
      }
    });

    // 碰撞后重置
    if (isSelfCrash || isPlayerCrash) {
      player.snake = [{ 
        x: Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize
      }];
      player.direction = 'right';
      player.score = 0;

      // 撞其他玩家则对方也重置
      if (isPlayerCrash && crashPlayerId > 0) {
        const crashPlayer = players.get(crashPlayerId);
        crashPlayer.snake = [{ 
          x: Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize,
          y: Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize
        }];
        crashPlayer.direction = 'right';
        crashPlayer.score = 0;
      }
    }
  });

  // 广播游戏状态
  broadcast({
    type: 'gameState',
    food: food,
    players: Array.from(players.values())
  });
}, 100);

// ===================== 服务器启动 =====================
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ 服务器启动成功！`);
  console.log(`🔌 本地访问：http://localhost:${PORT} (直接打开游戏)`);
  console.log(`🔌 WebSocket：ws://localhost:${PORT}`);
});

// 全局错误捕获
process.on('uncaughtException', (err) => console.error('未捕获异常：', err));
process.on('unhandledRejection', (reason) => console.error('Promise拒绝：', reason));