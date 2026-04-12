// 游戏名称。
export const APP_NAME = 'boomerang-2';

// Vite 前端开发服务器默认端口。
export const CLIENT_DEV_PORT = 5173;
// Node.js 游戏服务器默认端口。
export const SERVER_PORT = 3000;
// WebSocket 服务路径。
export const WS_PATH = '/ws';

// 单房间最大玩家数。
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
// 服务端权威模拟帧率。
export const SERVER_TICK_RATE = 60;
// 客户端每秒发送输入次数。
export const INPUT_SEND_RATE = 60;

// 地图宽度，单位为 Canvas 世界像素。
export const ARENA_WIDTH = 960;
// 地图高度，单位为 Canvas 世界像素。
export const ARENA_HEIGHT = 540;

// 随机地图的网格列数。
export const MAP_COLS = 20;
// 随机地图的网格行数。
export const MAP_ROWS = 12;
// 单个地图网格的宽度。
export const TILE_WIDTH = ARENA_WIDTH / MAP_COLS;
// 单个地图网格的高度。
export const TILE_HEIGHT = ARENA_HEIGHT / MAP_ROWS;
// 内部障碍物圆角矩形墙块的宽度。
export const WALL_WIDTH = TILE_WIDTH;
// 内部障碍物圆角矩形墙块的高度。
export const WALL_HEIGHT = TILE_HEIGHT;
// 内部障碍物圆角矩形墙块的圆角半径。
export const WALL_CORNER_RADIUS = 8;
// 每小局尝试生成的内部墙体格子数量。
export const WALL_CELL_COUNT = 18;
// 随机地图生成失败后重试的最大次数。
export const MAP_GENERATION_ATTEMPTS = 80;

// 玩家角色圆形半径。
export const PLAYER_RADIUS = 15;
// 玩家移动加速度，数值越大起步越快。
export const PLAYER_ACCELERATION = 4000;
// 玩家最大移动速度。
export const PLAYER_MAX_SPEED = 500;
// 玩家松开移动键后的速度阻尼，数值越大停得越快。
export const PLAYER_DAMPING = 7.5;
// 玩家蓄力时的额外刹车阻尼，用于快速减速到接近静止。
export const PLAYER_CHARGING_BRAKE = 22;
// 玩家撞墙反弹时，法线方向速度的保留比例；1 表示完全弹性反弹。
export const PLAYER_WALL_BOUNCE = 0.82;
// 玩家贴墙时判定为接触墙面的距离容差，单位为像素。
export const PLAYER_WALL_CONTACT_EPSILON = 0.35;

// 回旋镖碰撞半径。
export const BOOMERANG_RADIUS = 21;
// 回旋镖手持时，回旋镖中心到角色圆心的距离。
export const BOOMERANG_HAND_DISTANCE = PLAYER_RADIUS + 8;
// 最小蓄力时的回旋镖初速度。
export const BOOMERANG_MIN_THROW_SPEED = 430;
// 最大蓄力时的回旋镖初速度。
export const BOOMERANG_MAX_THROW_SPEED = 1200;
// 达到满蓄力所需时间，单位毫秒。
export const BOOMERANG_MAX_CHARGE_TIME_MS = 600;
// 未撞墙时，回旋镖始终指向主人角色的恒定加速度。
export const BOOMERANG_HOMING_ACCELERATION = 980;
// 回旋镖撞墙反弹后的速度保留比例。
export const BOOMERANG_BOUNCE_DAMPING = 0.72;
// 撞墙后，回旋镖受到的反向恒定阻力加速度。
export const BOOMERANG_BOUNCE_DRAG_ACCELERATION = 520;
// 反弹飞行速度低于该值时，回旋镖落地静止。
export const BOOMERANG_GROUND_SPEED = 70;
// 飞行中的自己回旋镖距离主人多近时自动接回。
export const BOOMERANG_CATCH_DISTANCE = 30;
// 落地回旋镖距离主人多近时可被拾取。
export const BOOMERANG_PICKUP_DISTANCE = 34;
// 回旋镖接回后的冷却时间预留值，当前机制暂未使用。
export const BOOMERANG_COOLDOWN_MS = 120;
// 回旋镖撞墙后的闪烁反馈持续时间，单位毫秒。
export const BOOMERANG_BOUNCE_FLASH_MS = 140;
// 回旋镖飞行中的最小旋转速度，单位为弧度/秒。
export const BOOMERANG_MIN_SPIN_SPEED = 20;
// 回旋镖飞行速度转换为旋转速度的倍率，飞得越快转得越快。
export const BOOMERANG_SPIN_SPEED_MULTIPLIER = 0.035;

// 小局结束后进入下一小局前的等待时间，单位毫秒。
export const ROUND_END_DELAY_MS = 1700;
// 大局胜利所需分数。
export const SCORE_TO_WIN = 20;
// 两名玩家随机出生点之间的最小几何距离。
export const MIN_SPAWN_DISTANCE = 220;
