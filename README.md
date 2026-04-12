# boomerang-2

`boomerang-2` 是一个 Windows 友好的浏览器双人联机小游戏脚手架。当前阶段完成了 Vite + TypeScript + Canvas 前端、Node.js + `ws` 服务端、共享协议、唯一双人房间、join / leave / snapshot 广播，以及生产静态资源服务。

## 目录结构

```text
boomerang-2/
  client/                 # 浏览器前端
    index.html
    vite.config.ts
    tsconfig.json
    src/
      game/GameLoop.ts     # 基础游戏循环
      input/InputController.ts
      net/NetworkClient.ts
      render/SceneRenderer.ts
      ui/Hud.ts
      main.ts
      styles.css
  server/                 # Node.js + ws 服务端
    tsconfig.json
    src/
      index.ts             # HTTP + WebSocket 入口
      Room.ts              # 唯一房间与权威状态
      staticFiles.ts       # 生产静态资源服务
  shared/                 # 前后端共享类型、协议、常量
    constants.ts
    protocol.ts
  package.json
  README.md
```

## 当前能力

- 前端使用 Vite + TypeScript + Canvas。
- 前端模块已拆分为游戏循环、输入、网络、地图渲染、HUD。
- 服务端使用 Node.js + `ws`，监听 `0.0.0.0`。
- 服务端维护唯一房间，最多 2 名玩家。
- 客户端发送输入，服务端保存权威状态并广播快照。
- 玩家移动使用服务端权威加速度、最大速度和阻尼。
- 每一小局随机生成内部墙体，并用 BFS 确保可通行区域连通。
- 每一小局随机出生，两名玩家出生点保持较远距离。
- 回旋镖命中对手后结束小局，击杀方得 1 分。
- 回旋镖有 held、charging、flying_returning、flying_bouncing、grounded 状态。
- 鼠标按住蓄力，松开投掷；蓄力影响初速度和飞行距离。
- 未撞墙时，回旋镖始终受到指向主人角色的恒定加速度。
- 回旋镖撞墙会按碰撞法线反弹并失去指向角色的加速度，之后只受到与运动方向相反的恒定阻力，速度过低后落地。
- 落地后的回旋镖只有主人靠近才能拾取。
- 先到 10 分者赢得大局，页面显示重玩按钮。
- 生产模式下服务端直接托管 `dist/` 前端构建产物。
- 两个浏览器可以加入同一个房间，并看到基础占位场景、玩家圆点和连接状态。

## 操作方式

- `WASD` 或方向键：移动
- 鼠标：瞄准
- 按住鼠标左键或 `Space`：蓄力
- 松开鼠标左键或 `Space`：投掷回旋镖
- 大局结束后点击页面上的“重玩”按钮重新开始

## 安装依赖

```bash
npm install
```

## 开发脚本

前端开发服务：

```bash
npm run dev:client
```

服务端开发服务：

```bash
npm run dev:server
```

联合启动前端和服务端：

```bash
npm run dev
```

开发模式默认地址：

```text
前端：http://localhost:5173
服务端：http://localhost:3000
WebSocket：ws://localhost:3000/ws
```

## 构建与生产运行

构建前端和服务端：

```bash
npm run build
```

生产运行：

```bash
npm start
```

生产模式访问：

```text
http://localhost:3000
```

## 双浏览器本地测试

1. 执行 `npm run build`
2. 执行 `npm start`
3. 打开第一个浏览器窗口访问 `http://localhost:3000`
4. 打开第二个浏览器窗口访问 `http://localhost:3000`
5. 页面 HUD 会显示玩家编号和 `房间 2/2`

## Radmin VPN 联机测试

主机电脑：

1. 加入 Radmin VPN 网络
2. 执行 `npm run build`
3. 执行 `npm start`
4. 允许 Windows 防火墙中的 Node.js 专用网络访问

加入方电脑：

1. 加入同一个 Radmin VPN 网络
2. 在浏览器打开：

```text
http://主机RadminIP:3000
```

如果端口 `3000` 被占用，可以在 PowerShell 中换端口：

```powershell
$env:PORT=3001; npm start
```

此时加入方访问：

```text
http://主机RadminIP:3001
```

## 共享协议范围

`shared/protocol.ts` 已定义：

- 玩家输入消息
- 连接 / 加入 / 离开房间消息
- 游戏状态快照消息
- 小局开始 / 结束消息
- 大局结束消息
- 重玩消息
- 错误消息

后续可以在这个基础上继续扩展回旋镖飞行、碰撞、得分、回合规则和手感优化。
