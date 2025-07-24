const {
  app,
  dialog,
  BrowserWindow,
  Menu,
  nativeImage,
  Tray,
} = require("electron");
const path = require("path");

// 常量定义
const ICON_DIR = path.join(__dirname, "../build");
const ICON_PATHS = {
  APP: path.join(ICON_DIR, "icon.ico"),
  REFRESH: path.join(ICON_DIR, "refresh.png"),
  LOGOUT: path.join(ICON_DIR, "logout.png"),
  SHOW: path.join(ICON_DIR, "show.png"),
};
const ICON_SIZE = { width: 16, height: 16 };
const WINDOW_DEFAULT_SIZE = { width: 1200, height: 800 };

// 全局状态
let forceQuit = false;
let mainWindow = null;
let tray = null;

// 创建浏览器窗口
const createWindow = async () => {
  try {
    const win = new BrowserWindow({
      ...WINDOW_DEFAULT_SIZE,
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
      icon: ICON_PATHS.APP,
      show: false,
    });

    await win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);

    win.once("ready-to-show", () => {
      win.show();
      // 恢复窗口状态（如果之前最大化）
      if (win.isMaximized()) {
        win.maximize();
      }
    });

    // 移除顶部菜单栏
    Menu.setApplicationMenu(null);

    // 创建右键菜单
    createContextMenu(win);

    // 窗口关闭处理
    win.on("close", handleWindowClose);

    return win;
  } catch (error) {
    console.error("创建窗口失败:", error);
    dialog.showErrorBox("初始化错误", "无法创建应用程序窗口");
    app.quit();
  }
};

// 显示主窗口
const showMainWindow = () => {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
};

// 窗口关闭处理
const handleWindowClose = (event) => {
  if (!forceQuit) {
    event.preventDefault();
    mainWindow.hide();
  }
};

// 退出应用处理
const handleAppQuit = () => {
  forceQuit = true;
  app.quit();
};

// 创建托盘图标
const createTray = () => {
  try {
    const trayIcon = createContextMenuIcon(ICON_PATHS.APP);
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "显示应用",
        icon: createContextMenuIcon(ICON_PATHS.SHOW),
        click: showMainWindow,
      },
      // { type: "separator" },
      {
        label: "退出应用",
        icon: createContextMenuIcon(ICON_PATHS.LOGOUT),
        click: handleAppQuit,
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("待办事项清单");

    // 托盘图标点击切换窗口显示
    tray.on("click", () => {
      mainWindow.isVisible() ? mainWindow.hide() : showMainWindow();
    });
  } catch (error) {
    console.error("创建托盘失败:", error);
  }
};

// 创建右键菜单
const createContextMenu = (win) => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "刷新",
      icon: createContextMenuIcon(ICON_PATHS.REFRESH),
      click: () => win.reload(),
      // accelerator: "CmdOrCtrl+R",
    },
    // { type: "separator" },
    // {
    //   label: "开发者工具",
    //   click: () => win.webContents.openDevTools({ mode: "detach" }),
    //   accelerator: "CmdOrCtrl+Shift+I",
    // },
    // { type: "separator" },
    {
      label: "退出选项",
      icon: createContextMenuIcon(ICON_PATHS.LOGOUT),
      click: () => showExitDialog(win),
    },
  ]);

  win.webContents.on("context-menu", (_, params) => {
    contextMenu.popup({ window: win, x: params.x, y: params.y });
  });
};

// 显示退出对话框
const showExitDialog = (win) => {
  dialog
    .showMessageBox(win, {
      type: "question",
      buttons: ["取消", "最小化", "退出"],
      defaultId: 0,
      cancelId: 0,
      title: "退出选项",
      message: "您想如何退出应用？",
      detail: "选择 '最小化' 将使应用在后台继续运行",
      noLink: true,
      icon: ICON_PATHS.APP,
    })
    .then((result) => {
      if (result.response === 1) {
        win.hide();
      } else if (result.response === 2) {
        handleAppQuit();
      }
    });
};

// 创建图标
const createContextMenuIcon = (iconPath) => {
  try {
    return nativeImage.createFromPath(iconPath).resize(ICON_SIZE);
  } catch (error) {
    console.error(`加载图标失败: ${iconPath}`, error);
    return nativeImage.createEmpty();
  }
};

// 单实例锁检查
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showMainWindow);

  app.whenReady().then(async () => {
    try {
      mainWindow = await createWindow();
      createTray();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        } else {
          showMainWindow();
        }
      });
    } catch (error) {
      console.error("应用初始化失败:", error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
