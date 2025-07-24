// 导入Electron核心模块
const {
  app, // 应用生命周期控制
  dialog, // 系统对话框
  BrowserWindow, // 浏览器窗口类
  Menu, // 菜单类
  nativeImage, // 本地图像处理
  Tray, // 系统托盘图标
} = require("electron");
const path = require("path"); // 路径处理模块

/** 图标资源目录路径 */
const ICON_DIR = path.join(__dirname, "../build");
/** 图标资源路径 */
const ICON_PATHS = {
  APP: path.join(ICON_DIR, "icon.ico"),
  REFRESH: path.join(ICON_DIR, "refresh.png"),
  LOGOUT: path.join(ICON_DIR, "logout.png"),
  SHOW: path.join(ICON_DIR, "show.png"),
  CONSOLE: path.join(ICON_DIR, "console.png"),
};
/** 图标大小 */
const ICON_SIZE = { width: 16, height: 16 };
/** 窗口默认大小 */
const WINDOW_DEFAULT_SIZE = { width: 1200, height: 800 };

/**
 * 应用全局状态
 *  forceQuit: 强制退出标志位
 *   - true: 允许完全退出应用
 *   - false: 点击关闭按钮时最小化到托盘
 *  mainWindow: 主窗口
 *  tray: 托盘
 */
let forceQuit = false;
let mainWindow = null;
let tray = null;

/**
 * 创建浏览器主窗口
 * @returns {Promise<Electron.CrossProcessExports.BrowserWindow>} 创建的浏览器窗口实例
 * @description
 * 1. 初始化窗口基础配置
 * 2. 加载本地HTML文件
 * 3. 设置窗口就绪回调
 * 4. 配置上下文菜单和关闭事件
 */
const createWindow = async () => {
  try {
    const win = new BrowserWindow({
      ...WINDOW_DEFAULT_SIZE,
      webPreferences: {
        contextIsolation: true, // 开启上下文隔离确保安全
        preload: path.join(__dirname, "preload.js"), // 预加载脚本
      },
      icon: ICON_PATHS.APP, // 设置窗口图标
      show: false, // 初始隐藏等待加载完成
    });

    await win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);

    win.once("ready-to-show", () => {
      win.show(); // 首次加载完成后显示窗口

      // 恢复窗口最大化状态（如果上次关闭时处于最大化）
      if (win.isMaximized()) {
        win.maximize(); // 重新应用最大化
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

  // 确保窗口已最小化
  if (mainWindow.isMinimized()) {
    mainWindow.restore(); // 恢复窗口
  }
  mainWindow.show(); // 显示窗口
  mainWindow.focus(); // 聚焦窗口
};

/**
 * 处理窗口关闭事件
 * @param {Event} event - 关闭事件对象
 * @description
 * - 非强制退出时阻止默认关闭行为
 * - 隐藏窗口实现托盘驻留
 */
const handleWindowClose = (event) => {
  if (!forceQuit) {
    event.preventDefault(); // 阻止默认关闭行为
    mainWindow.hide(); // 隐藏窗口
  }
};

// 退出应用处理
const handleAppQuit = () => {
  forceQuit = true;
  app.quit(); // 强制退出应用
};

// 创建托盘图标
const createTray = () => {
  try {
    const trayIcon = createContextMenuIcon(ICON_PATHS.APP); // 创建托盘图标
    tray = new Tray(trayIcon); // 创建托盘实例

    /**
     * 创建托盘图标右键菜单
     */
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

    tray.setContextMenu(contextMenu); // 设置右键菜单
    tray.setToolTip("待办事项清单"); // 设置鼠标悬停提示

    // 托盘图标点击切换窗口显示
    // 托盘图标点击事件：切换窗口显隐状态
    tray.on("click", () => {
      mainWindow.isVisible()
        ? mainWindow.hide() // 已显示则隐藏
        : showMainWindow(); // 未显示则恢复显示
    });
  } catch (error) {
    console.error("创建托盘失败:", error);
  }
};

/**
 * 创建托盘图标
 * @param {*} win 窗口对象
 */
const createContextMenu = (win) => {
  /**
   * 构建右键菜单模板
   * @description
   * - 包含刷新、开发者工具和退出选项
   * - 刷新：重新加载当前页面
   * - 开发者工具：打开浏览器开发者工具
   * - 退出选项：提供最小化、退出应用的选项
   */
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
    //   icon: createContextMenuIcon(ICON_PATHS.CONSOLE),
    //   click: () => win.webContents.openDevTools({ mode: "detach" }), // 设置开发者工具打开方式（与主窗口分离）
    // },
    // { type: "separator" },
    {
      label: "退出选项",
      icon: createContextMenuIcon(ICON_PATHS.LOGOUT),
      click: () => showExitDialog(win),
    },
  ]);

  /**
   * 创建右键菜单
   */
  win.webContents.on("context-menu", (_, params) => {
    contextMenu.popup({ window: win, x: params.x, y: params.y });
  });
};

// 显示退出对话框
const showExitDialog = (win) => {
  // 弹出带图标的三选一对话框
  dialog
    .showMessageBox(win, {
      type: "question", // 问题类型对话框
      buttons: ["取消", "最小化", "退出"], // 按钮选项
      defaultId: 0, // 默认选中第一个按钮
      cancelId: 0, // 取消按钮索引
      title: "退出选项", // 对话框标题
      message: "您想如何退出应用？", // 主提示信息
      detail: "选择 '最小化' 将使应用在后台继续运行", // 补充说明
      noLink: true, // 禁用超链接解析
      icon: ICON_PATHS.APP, // 使用应用图标
    })
    .then((result) => {
      if (result.response === 1) {
        win.hide(); // 最小化
      } else if (result.response === 2) {
        handleAppQuit(); // 退出应用
      }
    });
};

// 创建图标
const createContextMenuIcon = (iconPath) => {
  try {
    return nativeImage.createFromPath(iconPath).resize(ICON_SIZE);
  } catch (error) {
    console.error(`加载图标失败: ${iconPath}`, error);
    return nativeImage.createEmpty(); // 返回一个空的图标
  }
};

/**
 * 单实例锁检查
 * - 确保应用只有一个运行实例
 * - 已存在实例时激活原有窗口
 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showMainWindow); // 监听第二个实例启动事件

  /** 应用准备就绪时创建主窗口 */
  app.whenReady().then(async () => {
    try {
      mainWindow = await createWindow(); // 创建主窗口
      createTray(); // 创建系统托盘

      /** 激活窗口 */
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow(); // 创建主窗口
        } else {
          showMainWindow(); // 显示主窗口
        }
      });
    } catch (error) {
      console.error("应用初始化失败:", error);
      app.quit();
    }
  });

  /**
   * 窗口关闭时退出应用
   */
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
