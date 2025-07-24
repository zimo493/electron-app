// 导入Electron核心模块和Node.js路径模块
const {
  app,
  dialog,
  BrowserWindow,
  Menu,
  nativeImage,
  Tray,
} = require("electron");
const path = require("path");

// 声明全局变量
let forceQuit = false;
let mainWindow = null; // 存储主窗口引用
let tray = null; // 存储托盘图标引用

// 应用图标路径
const appIcon = path.join(__dirname, "../build/icon.ico");

// 创建浏览器窗口的异步函数
const createWindow = async () => {
  // 创建新的浏览器窗口实例
  const win = new BrowserWindow({
    width: 1200, // 窗口宽度
    height: 800, // 窗口高度
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离，增强安全性
      preload: path.join(__dirname, "preload.js"), // 预加载脚本路径
    },
    icon: appIcon, // 应用图标路径
    show: false, // 初始不显示窗口
  });

  // 加载本地HTML文件作为应用界面
  await win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);

  // 窗口加载完成后显示
  win.once("ready-to-show", () => {
    win.show();
  });

  // 可选：打开开发者工具（调试时使用）
  // win.webContents.openDevTools();

  // 移除顶部菜单栏
  Menu.setApplicationMenu(null);

  // 创建自定义右键菜单
  createContextMenu(win);

  // 返回窗口实例
  return win;
};

// 显示主窗口函数
const showMainWindow = () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
};

// 创建托盘图标和菜单
const createTray = () => {
  // 使用正确的图标路径
  const trayIcon = createContextMenuIcon("icon.ico");

  // 创建托盘实例
  tray = new Tray(trayIcon);

  // 构建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示应用",
      icon: createContextMenuIcon("show.png"),
      click: () => showMainWindow(),
    },
    // { type: "separator" },
    {
      label: "退出应用",
      icon: createContextMenuIcon("logout.png"),
      click: () => {
        // 设置强制退出标志，然后退出
        forceQuit = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("待办事项清单");

  // 点击托盘图标显示/隐藏应用
  // tray.on("click", () => {
  //   if (win.isVisible()) {
  //     win.hide();
  //   } else {
  //     showMainWindow();
  //   }
  // });
};

// 创建带图标的右键上下文菜单
const createContextMenu = (win) => {
  // 构建菜单模板
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "刷新", // 菜单项标签
      icon: createContextMenuIcon("refresh.png"),
      click: () => win.reload(), // 点击刷新窗口
    },
    // { type: "separator" }, // 分隔线
    // 开发者工具，开发环境可打开
    // {
    //   label: "开发者工具",
    //   icon: createContextMenuIcon("console.png"),
    //   click: () => win.webContents.openDevTools(),
    // },
    {
      label: "退出应用",
      icon: createContextMenuIcon("logout.png"),
      click: () => {
        dialog
          .showMessageBox(win, {
            type: "question",
            buttons: ["取消", "最小化到托盘", "退出应用"],
            defaultId: 0,
            cancelId: 0,
            title: "退出选项",
            message: "您想如何退出应用？",
            detail: "选择'最小化到托盘'将使应用在后台继续运行",
            noLink: true,
            icon: appIcon,
          })
          .then((result) => {
            if (result.response === 1) {
              // 最小化到托盘
              win.hide();
            } else if (result.response === 2) {
              // 退出应用
              forceQuit = true;
              app.quit();
            }
          });
      },
    },
  ]);

  // 监听窗口的右键菜单事件
  win.webContents.on("context-menu", () => {
    contextMenu.popup(win); // 在窗口中弹出菜单
  });
};

/**
 * 创建自定义图标
 * @param {*} iconPath 图标路径
 * @returns {*} 创建的图标对象
 */
const createContextMenuIcon = (iconPath) => {
  return nativeImage
    .createFromPath(path.join(__dirname, `../build/${iconPath}`))
    .resize({ width: 16, height: 16 });
};

// 检查是否已有实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果已有实例运行，则退出当前进程
  app.quit();
} else {
  // 应用准备就绪后的初始化
  app.whenReady().then(async () => {
    // 创建主窗口
    mainWindow = await createWindow();

    // 创建托盘图标
    createTray(mainWindow);

    // 处理窗口关闭事件（改为最小化到托盘）
    mainWindow.on("close", (event) => {
      if (!forceQuit) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // 处理macOS激活事件
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        showMainWindow();
      }
    });
  });

  // 处理第二个实例启动
  app.on("second-instance", () => {
    showMainWindow();
  });
}

// 处理所有窗口关闭事件（macOS除外）
app.on("window-all-closed", () => {
  // macOS通常不会在关闭所有窗口时退出应用
  if (process.platform !== "darwin") {
    app.quit();
  }
});
