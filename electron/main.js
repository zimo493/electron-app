// 导入Electron核心模块和Node.js路径模块
const { app, BrowserWindow, Menu, nativeImage } = require("electron");
const path = require("path");

// 创建浏览器窗口的异步函数
async function createWindow() {
  // 创建新的浏览器窗口实例
  const win = new BrowserWindow({
    width: 1280, // 窗口宽度
    height: 800, // 窗口高度
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离，增强安全性
      preload: path.join(__dirname, "preload.js"), // 预加载脚本路径
    },
    icon: path.join(__dirname, "../build/icon.ico"), // 应用图标路径
  });

  // 加载本地HTML文件作为应用界面
  await win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);

  // 可选：打开开发者工具（调试时使用）
  // win.webContents.openDevTools();

  // 移除顶部菜单栏
  Menu.setApplicationMenu(null);

  // 创建自定义右键菜单
  createContextMenu(win);

  // 返回窗口实例（可用于后续操作）
  return win;
}

// 创建带图标的右键上下文菜单
function createContextMenu(win) {
  // 构建菜单模板
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "刷新", // 菜单项标签
      icon: nativeImage // 创建图标
        .createFromPath(path.join(__dirname, "../build/refresh.png"))
        .resize({ width: 16, height: 16 }), // 调整图标尺寸
      click: () => win.reload(), // 点击刷新窗口
    },
    // 以下是可选菜单项（示例）：
    // { label: "开发者工具", click: () => win.webContents.toggleDevTools() },
    // { type: "separator" }, // 分隔线
    {
      label: "退出应用",
      icon: nativeImage
        .createFromPath(path.join(__dirname, "../build/logout.png"))
        .resize({ width: 16, height: 16 }),
      click: () => app.quit(), // 点击退出应用
    },
  ]);

  // 监听窗口的右键菜单事件
  win.webContents.on("context-menu", () => {
    contextMenu.popup(win); // 在窗口中弹出菜单
  });
}

// 应用准备就绪后的初始化
app.whenReady().then(async () => {
  // 创建主窗口（原注释掉的菜单功能保留说明）
  // const mainWindow = await createWindow();
  // createMenu(mainWindow); // 可在此创建顶部应用菜单

  await createWindow();

  // 处理macOS激活事件（无窗口时重新创建）
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 处理所有窗口关闭事件（macOS除外）
app.on("window-all-closed", () => {
  // macOS通常不会在关闭所有窗口时退出应用
  if (process.platform !== "darwin") app.quit();
});
