let draggingPresets = false
let addPresetValue;
const iframe = document.getElementById("iframe");
{
    
    iframe.addEventListener("click", () => {
        if (addPresetValue != "" && draggingPresets) {
            console.log("print")
        } else {
            console.log("nothing")
        }
    });

    function presetPages(e) {
        const presetsBody = document.getElementById("presetsBody");
        presetsBody.querySelectorAll("div").forEach(div => div.remove());

        let imageFiles;
        if (e == "figures") {
            imageFiles = ["stickman.svg"];
        } else if (e == "background") {
            imageFiles = [];
        } else if (e == "buttons") {
            imageFiles = [];
        }

        imageFiles.forEach(file => {
            const div = document.createElement("div");
            presetsBody.appendChild(div);
            
            const img = document.createElement("img");
            img.src = `../../public/images/${e}/${file}`;
            div.appendChild(img);
            
            img.addEventListener("click", () => {
                console.log("click")
                if (draggingPresets && addPresetValue == `../../public/images/${e}/${file}`) {
                    draggingPresets = false;
                    addPresetValue = "";
                    console.log("canceled selection")
                } else {
                    draggingPresets = true;
                    addPresetValue =`../../public/images/${e}/${file}`;
                    console.log("selected")
                }
            });
        });

        imageFiles = [];

    }

}

{

    window.addEventListener('message', event => {
        if (event.data.type === 'canvasClick') {
            console.log('Canvas clicked at:', event.data.x, event.data.y);

            if (addPresetValue != "" && draggingPresets == true) {
                
                
                draggingPresets = false;
                addPresetValue = "";
                console.log("preset")
            }
        }
    });

}