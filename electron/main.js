const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../build/icon.ico"),
  });

  // 加载 Vue 打包后的产物
  // win.loadFile(path.join(__dirname, "src", "index.html"));
  await win.loadURL(`file://${path.join(__dirname, "../src/index.html")}`);
  Menu.setApplicationMenu(null); // 移除菜单栏
  // 打开开发工具
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
