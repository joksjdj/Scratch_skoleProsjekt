const canvasAdminControll = document.getElementById('canvas');

var figureAdminControllArray = []
var backgroundAdminControllArray = []
var buttonAdminControllArray = []

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function refreshPage() {
  const array = [figureAdminControllArray, backgroundAdminControllArray, buttonAdminControllArray];

  for (const arr of array) {
    for (const preset of arr) {
      preset.imgObj = new Image();
      preset.imgObj.onerror = () => {
        console.error("Failed to load image:", preset.img);
      };
      preset.imgObj.src = "../"+preset.img;
      preset.currentX = undefined;
      preset.currentY = undefined;
    }
  }
} refreshPage();

function updateArrayNumbers(array, newArray) {
  if (array === "figure") figureAdminControllArray = newArray;
  if (array === "background") backgroundAdminControllArray = newArray;
  if (array === "button") buttonAdminControllArray = newArray;
  refreshPage();
}
function placeHolderArray(type) {
  if (type === "figure") array = figureAdminControllArray;
  else if (type === "background") array = backgroundAdminControllArray;
  else if (type === "button") array = buttonAdminControllArray;

  return array;
}

function moveMentControll(type, name, moveType, x, y) {
  let array = placeHolderArray(type);

  const obj = array.filter(obj => obj.name === name);

  for (const item of obj) {
    if (moveType == "set") {
      item.currentX = x;
      item.currentY = y;
    } else if (moveType == "add") {
      item.currentX = Number((item.currentX ?? item.x)) + Number(x);
      item.currentY = Number((item.currentY ?? item.y)) + Number(y);
    }
  }
}

function resizeCanvasAdminControllToDisplaySize() {
  const rect = canvasAdminControll.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const displayWidth = rect.width * dpr;
  const displayHeight = rect.height * dpr;

  if (canvasAdminControll.width !== displayWidth || canvasAdminControll.height !== displayHeight) {
    canvasAdminControll.width = displayWidth;
    canvasAdminControll.height = displayHeight;
    return true;
  }
  return false;
}
resizeCanvasAdminControllToDisplaySize()

canvasAdminControll.addEventListener('click', e => {
  const rect = canvasAdminControll.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  parent.postMessage({ type: 'canvasClick', x: x, y: y }, '*');
});

function presetAdminControllParentMessage() {
  const arrays = [figureAdminControllArray, backgroundAdminControllArray, buttonAdminControllArray];

  for (const array of arrays) {
    let parentType;
    if (array === figureAdminControllArray) parentType = "addFigureControll";
    else if (array === backgroundAdminControllArray) parentType = "addBackgroundControll";
    else if (array === buttonAdminControllArray) parentType = "addButtonControll";

    let i = 0;
    for (const preset of array) {
      preset.number = i
      parent.postMessage({ 
        absoluteTypeBranch: "addPresetControll", 
        array: preset.array, 
        number: preset.number, 
        type: parentType, 
        name: preset.name, 
        img: preset.img, 
        x: preset.x, 
        y: preset.y, 
        width: preset.width, 
        height: preset.height 
      }, '*');
      i++;
    }
  }
}

window.addEventListener('message', event => {
  const data = event.data;

  if (data.absoluteTypeBranch === "addPreset") {

    const preset = {
      array: "",
      name: "",
      img: data.text,
      width: 100,
      height: 100,
      x: data.x,
      y: data.y,
    }

    preset.imgObj = new Image();
    preset.imgObj.onerror = () => {
      console.error("Failed to load image:", preset.img);
    };
    preset.imgObj.src = "../"+preset.img;

    let presetAdminControllArray;
    let addType;
    const presetMap = {
      figuresAdd: { addType: "figure", array: figureAdminControllArray },
      backgroundAdd: { addType: "background", array: backgroundAdminControllArray },
      buttonsAdd: { addType: "button", array: buttonAdminControllArray }
    };

    const newPreset = presetMap[data.type];

    addType = newPreset.addType;
    presetAdminControllArray = newPreset.array;

    preset.array = addType;
    preset.name = addType;

    presetAdminControllArray.push(preset);

    presetAdminControllParentMessage();

  } else if (data.absoluteTypeBranch === "delete") {

    const presetMap = {
      figure: figureAdminControllArray,
      background: backgroundAdminControllArray,
      button: buttonAdminControllArray
    };

    let presetAdminControllArray = presetMap[data.type];
    const filteredArray = presetAdminControllArray.filter( preset => preset.number !== data.number );
    updateArrayNumbers(data.type, filteredArray);

  } else if (data.type === 'updatePresetValue') {

    let presetAdminControllArray = placeHolderArray(data.array);

    const preset = presetAdminControllArray.find(preset => preset.number == data.number);
    if (preset) preset[data.variable] = data.value;
    updateArrayNumbers(data.array, presetAdminControllArray);

  } else if (data.absoluteType == "jsVariable") {
    location.reload();
    
    const code =
      "const addEvent = window.addEventListener.bind(window);\n"+
      data.code
    ;
    try {
      eval(code);
      console.log(code);
    } catch (err) {
      console.error(err)
    }
  }

});

async function drawLoop() {
  const ctx = canvasAdminControll.getContext("2d");

  while (true) {
    ctx.clearRect(0, 0, canvasAdminControll.width, canvasAdminControll.height);

    const presetArrays = [backgroundAdminControllArray, figureAdminControllArray, buttonAdminControllArray];
    for (const array of presetArrays) {
      for (const preset of array) {
        if (preset.imgObj.complete && preset.imgObj.naturalWidth > 0) {
          const x = preset.currentX !== undefined ? preset.currentX : preset.x;
          const y = preset.currentY !== undefined ? preset.currentY : preset.y;
          ctx.drawImage(preset.imgObj, x, y, preset.width, preset.height);
        }
      }
    }

    eventType = null;

    await wait(1000/30);
  }
}
drawLoop();