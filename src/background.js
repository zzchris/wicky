// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { devMenuTemplate } from "./menu/dev_menu_template";
import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";
const { app, Menu, Tray, BrowserWindow, ipcMain, nativeImage } = require('electron')

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

// Modules to control application life and create native browser window
// require('electron-reload')(__dirname, {
//   electron: require(`${__dirname}/node_modules/electron`)
// });
const needle = require('needle')
const WICKY_CURRENT_WEATHER_URL = 'https://us-central1-wicky-9511d.cloudfunctions.net/weather/currentWeather'
const Store = require('electron-store')
const store = new Store()

let isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
  app.quit()
}

let tray = null
let _currentTempKelvin = 0
let _currentTemp = 0
let round = 0
let mainWindow = null
let preferenceWindow = null
let scale = null
let menu = [
  {
    id: 'celcius',
    label: 'Celcius',
    type: 'radio',
    click() {
      updateScaleTemp('celcius')
    },
  },
  {
    id: 'farenheit',
    label: 'Farenheit',
    type: 'radio',
    click() {
      updateScaleTemp('farenheit')
    },
  },
  // {
  //   id: 'kelvin',
  //   label: 'Kelvin',
  //   type: 'radio',
  //   click() {
  //     updateScaleTemp('kelvin')
  //   },
  // },
  {
    label: '',
    type: 'separator'
  },
  {
    label: 'Preferences',
    type: 'normal',
    click() {
      openPreferences()
    }
  },
  {
    label: 'Exit',
    type: 'normal',
    click() {
      app.quit()
    }
  }
]

function updateScaleTemp(_scale) {
  if (_scale === 'farenheit') {
    scale = 'farenheit'
  } else if (_scale === 'celcius') {
    scale = 'celcius'
  } else {
    scale = 'kelvin'
  }
  if (scale === 'kelvin') {
    _currentTemp = _currentTempKelvin
  } else if (scale === 'farenheit') {
    _currentTemp = getFarenheitFromKelvin(_currentTempKelvin)
  } else if (scale === 'celcius') {
    _currentTemp = getCelciusFromKelvin(_currentTempKelvin)
  }
  mainWindow.webContents.send('get-canvas-dataurl', _currentTemp)
}

async function getUserPreferences() {
  scale = await store.get('wicky-pref')
  if (scale) {
    updateScaleTemp(scale)
  } else {
    updateScaleTemp('farenheit')
  }
}

function getFarenheitFromKelvin(K) {
  return (K * (9 / 5) - 459.67).toFixed(round)
}

function getCelciusFromKelvin(K) {
  return (K - 273.15).toFixed(round)
}

function openPreferences() {
  preferenceWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    height: 400,
    width: 400,
    autoHideMenuBar: true
  })
  preferenceWindow.loadFile('./preferences/preferences.html')
}

function createMainWindow() {
  mainWindow = createWindow("main", {
    show: false,
    icon: 'resources/icon.ico',
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  // Open the DevTools.
  // mainWindow.web.openDevTools()
}

function createTray(nativeImage) {
  tray = new Tray(nativeImage)
  tray.setToolTip('Right click to change temperature scale.')
  tray.on('right-click', () => {
    let contextMenu = Menu.buildFromTemplate(menu)
    contextMenu.items.forEach((menuItem) => {
      if (menuItem.id === scale)
        menuItem.checked = true
    })
    tray.popUpContextMenu(contextMenu)
  })
}

ipcMain.on('pref-save-data', (event, data) => {
  store.set('wicky-pref', data)
  updateScaleTemp(data)
})

ipcMain.on('canvas-dataurl', (event, data) => {
  let trayNativeImage = nativeImage.createFromDataURL(data)
  if (tray) {
    tray.setImage(trayNativeImage)
  } else {
    createTray(trayNativeImage)
  }
})

ipcMain.on('pref-close', (event, data) => {
  preferenceWindow.close()
})

// -----
const setApplicationMenu = () => {
  const menus = [editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

app.on("ready", () => {
  setApplicationMenu();
  createMainWindow()
  mainWindow.webContents.on('did-finish-load', () => {

    async function retrieveCurrentWeather() {
      let res = await needle('get', WICKY_CURRENT_WEATHER_URL).catch((err) => {
        console.log(err)
      })
      let cityData = res.body
      _currentTempKelvin = cityData.main.temp.toFixed(round)
      getUserPreferences()
    }

    retrieveCurrentWeather()

    let timeout = 60 * 1000 * 11
    setInterval(async () => {
      retrieveCurrentWeather();
    }, timeout)
  })

  if (env.name === "development") {
    mainWindow.openDevTools();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
