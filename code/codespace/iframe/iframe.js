const canvasAdminControll = document.getElementById('canvas');

var figureAdminControllArray = []
var backgroundAdminControllArray = []
var buttonAdminControllArray = []

function resizeCanvasAdminControllToDisplaySize() {
  const rect = canvasAdminControll.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const displayWidth = rect.width * dpr;
  const displayHeight = rect.height * dpr;

  if (canvasAdminControll.width !== displayWidth || canvasAdminControll.height !== displayHeight) {
    canvasAdminControll.width = displayWidth;
    canvasAdminControll.height = displayHeight;
    return true; // resized
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
    if (array === figureAdminControllArray) {
      parentType = "addFigureControll";
    } else if (array === backgroundAdminControllArray) {
      parentType = "addBackgroundControll";
    } else if (array === buttonAdminControllArray) {
      parentType = "addButtonControll";
    }

    let i = 0;
    for (const preset of array) {
      preset.number = i
      parent.postMessage({ array: preset.array, number: preset.number, type: parentType, name: preset.name, img: preset.img, x: preset.x, y: preset.y, width: preset.width, height: preset.height }, '*');
      i++;
    }
  }
}

window.addEventListener('message', event => {
  const data = event.data;

  if (data.absoluteType === "addPreset") {

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

    if (data.type === 'figuresAdd') {
      preset.array = "figure";
      preset.name = "figure";

      figureAdminControllArray.push(preset)
      console.log(figureAdminControllArray)

    } else if (data.type === 'backgroundAdd') {
      preset.array = "background";
      preset.name = "background";

      backgroundAdminControllArray.push(preset)
      console.log(backgroundAdminControllArray)

    } else if (data.type === 'buttonsAdd') {
      preset.array = "button";
      preset.name = "button";

      buttonAdminControllArray.push(preset)
      console.log(buttonAdminControllArray)

    }
    presetAdminControllParentMessage();

  } else if (data.absoluteType === "delete") {

    if (data.type === 'figureDelete') {
      console.log(data.number)
      figureAdminControllArray = figureAdminControllArray.filter(
        figure => figure.number !== data.number
      );
      console.log(figureAdminControllArray)
    } else if (data.type === 'backgroundDelete') {
      console.log(data.number)
      backgroundAdminControllArray = backgroundAdminControllArray.filter(
        background => background.number !== data.number
      );
      console.log(backgroundAdminControllArray)
    } else if (data.type === 'buttonDelete') {
      console.log(data.number)
      buttonAdminControllArray = buttonAdminControllArray.filter(
        button => button.number !== data.number
      );
      console.log(buttonAdminControllArray)
    }

  } else if (data.type === 'updatePresetValue') {

    let presetAdminControllArray;
    if (data.array === "figure") {
      presetAdminControllArray = figureAdminControllArray;
    } else if (data.array === "background") {
      presetAdminControllArray = backgroundAdminControllArray;
    } else if (data.array === "button") {
      presetAdminControllArray = buttonAdminControllArray;
    }
    const preset = presetAdminControllArray.find(
      preset => preset.number == data.number
    );
    if (preset) {
      preset[data.variable] = data.value;
    }
  }

});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for (const figure of figureAdminControllArray) {
  if (!figure.imgObj) {
    figure.imgObj = new Image();
    figure.imgObj.onerror = () => {
      console.error("Failed to load image:", figure.img);
    };
    figure.imgObj.src = "../"+figure.img;
    console.log(figureAdminControllArray)
  }
}

async function drawLoop() {
  const ctx = canvasAdminControll.getContext("2d");

  while (true) {
    ctx.clearRect(0, 0, canvasAdminControll.width, canvasAdminControll.height);

    for (const figure of figureAdminControllArray) {
      if (figure.imgObj.complete && figure.imgObj.naturalWidth > 0) {
        ctx.drawImage(figure.imgObj, figure.x, figure.y, figure.width, figure.height);
      }
    }

    for (const background of backgroundAdminControllArray) {
      if (background.imgObj.complete && background.imgObj.naturalWidth > 0) {
        ctx.drawImage(background.imgObj, background.x, background.y, background.width, background.height);
      }
    }

    for (const button of buttonAdminControllArray) {
      if (button.imgObj.complete && button.imgObj.naturalWidth > 0) {
        ctx.drawImage(button.imgObj, button.x, button.y, button.width, button.height);
      }
    }

    await wait(1000/30);
  }
}


drawLoop();