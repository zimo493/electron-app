const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// const NODE_ENV = process.env.NODE_ENV
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // 加载 Vue 打包后的文件
  // win.loadFile(path.join(__dirname, "src", "index.html"));
  win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);
  Menu.setApplicationMenu(null);
  // 打开开发工具
  // if (NODE_ENV === "development") {
  //   mainWindow.webContents.openDevTools();
  // }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
