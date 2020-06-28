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
  canvas.width = 32
  canvas.height = 32

  let formattedTemp = `${temp}°`
  let fontSize = 25
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px Arial`
  ctx.textAlign = 'start'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  // let textWidth = ctx.measureText(formattedTemp).width
  // console.log(`initial width: ${textWidth}`)
  // while (textWidth > 32) {
  //     fontSize -= 1
  //     ctx.font = `${fontSize}px Arial`
  //     textWidth = ctx.measureText(formattedTemp).width
  //     console.log(`next width: ${textWidth}`)
  // }
  // ctx.scale(1.2, 1.2)
  ctx.fillText(formattedTemp, 0, 16, 31)
  ctx.strokeText(formattedTemp, 0, 16, 31)
  let canvasDataUrl = canvas.toDataURL()
  return canvasDataUrl
}

ipc.on('get-canvas-dataurl', (event, arg) => {
  let trayImage = createTextIconDataUrl(arg)
  ipc.send('canvas-dataurl', trayImage)
})