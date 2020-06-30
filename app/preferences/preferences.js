const ipc = require('electron').ipcRenderer

let defaultScale = null;
const saveButton = document.getElementById('save')
const closeButton = document.getElementById('close')
const notification = document.getElementById('notification')

Array.from(document.getElementsByClassName('scale-radio')).forEach((el) => {
    el.addEventListener('change', () => {
        defaultScale = el.id;
    })
})

saveButton.addEventListener('click', () => {
    //store data in storage
    defaultScale === null ? 'farenheit' : defaultScale
    ipc.send('pref-save-data', defaultScale)
    notification.innerHTML = 'Preferences Saved'
    notification.style.visibility = 'visible'
    setTimeout(() => {
        notification.style.visibility = 'hidden'
    }, 2000)

})

closeButton.addEventListener('click', () => {
    ipc.send('pref-close')
})