function removeScript() {
    document.querySelector(".removeScriptArrow").classList.toggle("removeScript")
    document.querySelector(".textarea").classList.toggle("removeScript")
}

const canvas = document.getElementById('canvas');
canvas.addEventListener('click', e => {
  parent.postMessage({ type: 'canvasClick', x: e.clientX, y: e.clientY }, '*');
});