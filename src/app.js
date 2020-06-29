import "./stylesheets/main.css";

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";
// import env from "env";

let ipc = require('electron').ipcRenderer
/**
 * creates a dataUrl from text via canvas
 * @param {number} temp 
 */
function createTextIconDataUrl(temp) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const formattedTemp = `${temp}°`
  let fontSize = 10
  if (process.platform === 'win32') {
    canvas.width = 32
    canvas.height = 32
    fontSize = 22
    ctx.lineWidth = 2
  } else if (process.platform === 'darwin') {
    canvas.width = 18
    canvas.height = 18
    fontSize = 12
    ctx.lineWidth = 1
  } else if (process.platform === 'linux') {

  }

  ctx.font = `${fontSize}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'white'
  ctx.fillText(formattedTemp, canvas.width / 2, canvas.height / 2)
  ctx.strokeText(formattedTemp, canvas.width / 2, canvas.height / 2)
  let canvasDataUrl = canvas.toDataURL()
  return canvasDataUrl
}

ipc.on('get-canvas-dataurl', (event, arg) => {
  let trayImage = createTextIconDataUrl(arg)
  ipc.send('canvas-dataurl', trayImage)
})