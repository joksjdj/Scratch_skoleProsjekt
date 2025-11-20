let draggingPresets = false
let addPresetValue;
let addType;
const iframe = document.getElementById("iframe");
{

    function removeScript(el, position) {

        let corner;
        let corners;
        let status;
        let bothStatuses;
        const last = document.querySelectorAll(".arrowVertical");
        const lastEl = last[last.length - 1];

        corner = position === "both" ? document.querySelectorAll(`.presetBox`) : document.querySelector(`.${position}`);

        corners = corner.length ? [].concat(...corner || []).filter(Boolean) : [corner];

        bothStatuses = corner.length ? corners.map(el => el.style.display) : [corner.style.display];

        status = bothStatuses.every(s => s === "none") ? "" : "none";

        corners.forEach(cornerEl => cornerEl.style.display = (status) ? "none" : "");

        lastEl.style.display = (status == "none" && position == "both") ? "none" : "flex";

        el.parentElement.style.alignSelf = status == "none" ? "flex-end" : "center";

        el.querySelector("h1").innerText = status == "none" ? "<" : ">";
    }

    function presetControllPages(e) {
        const allPages = document.getElementById("presetsControllBody").querySelectorAll("div")
        allPages.forEach(page => page.style.display = "none");

        const selectedPage = document.getElementById(`presetsControll${e}`);
        selectedPage.style.display = "block";


        const allDescendants = selectedPage.querySelectorAll("*");
        allDescendants.forEach(el => {
            el.style.display = ""
        });
    }

    function presetPages(e) {
        const presetsBody = document.getElementById("presetsBody");
        presetsBody.querySelectorAll("div").forEach(div => div.remove());

        let imageFiles;
        if (e == "figures") {
            imageFiles = ["stickman.svg"];
        } else if (e == "background") {
            imageFiles = [];
        } else if (e == "buttons") {
            imageFiles = ["arrowUp.svg", "arrowDown.svg", "arrowLeft.svg", "arrowRight.svg"];
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
                    addType = "";
                    console.log("canceled selection")
                } else {
                    draggingPresets = true;
                    addPresetValue =`../../public/images/${e}/${file}`;
                    addType = e;
                    console.log("selected")
                }
            });
        });

        imageFiles = [];

    }

}

function deletePresetButton(number, type) {
    const child = iframe.contentWindow;
    console.log("delete")
    document.getElementById(type+number).remove()
    child.postMessage({ absoluteType: "delete", type: type+"Delete", number: number }, "*");
};

function updatePresetValue(el) {
    const child = iframe.contentWindow;
    const field = el.dataset.field;
    const value = el.value;
    const parent = el.parentElement.parentElement;

    child.postMessage({ type: "updatePresetValue", array: parent.dataset.name, number: parent.dataset.type, variable: field, value: value }, "*");
}
document.querySelector("textarea").addEventListener("click", (e) => {
    console.log("clicked")});

{

    window.addEventListener('message', event => {
        const child = document.getElementById("iframe").contentWindow;
        const data = event.data;
        if (data.type === 'canvasClick') {
            console.log('Canvas clicked at:', data.x, data.y);

            if (addPresetValue != "" && draggingPresets == true) {
                child.postMessage({ absoluteType: "addPreset", type: addType+"Add", text: addPresetValue, x: data.x, y: data.y }, "*");
                
                draggingPresets = false;
                addPresetValue = "";
                addType = "";
            }
        }

        if (data.type === 'addFigureControll') {
            console.log("added",data)
            const presetsControllFigures = document.getElementById("presetsControllFigures");

            let info = presetsControllFigures.querySelector(`.info${data.number}`);

            if (!info) {
                presetsControllFigures.innerHTML+=`
                    <div id="figure${data.number}">
                        <img src="${data.img}" alt="">
                        <div data-type="${data.number}" data-name="${data.array}" class="info${data.number}">
                            <h1><span>Name: </span><input oninput="updatePresetValue(this)" data-field="name" type="text" value="${data.name}"></h1>
                            <h1>Size: (<span style="font-weight: normal;">width: </span><input oninput="updatePresetValue(this)" data-field="width" type="number" value="${data.width}"> <span style="font-weight: normal;">height: </span><input oninput="updatePresetValue(this)" data-field="height" type="number" value="${data.height}">)</h1>
                            <h1>Position: (<span style="font-weight: normal;">x: </span><input oninput="updatePresetValue(this)" data-field="x" type="number" value="${data.x}"> <span style="font-weight: normal;">y: </span><input oninput="updatePresetValue(this)" data-field="y" type="number" value="${data.y}">)</h1>
                            <button onclick="deletePresetButton(${data.number}, 'figure')">
                                <h1>Delete</h1>
                            </button>
                        </div>
                    </div>
                `
            }
        } else if (data.type === 'addBackgroundControll') {
            console.log("added",data)
            const presetsControllBackground = document.getElementById("presetsControllBackground");

            let info = presetsControllBackground.querySelector(`.info${data.number}`);

            if (!info) {
                presetsControllBackground.innerHTML+=`
                    <div id="background${data.number}">
                        <img src="${data.img}" alt="">
                        <div data-type="${data.number}" data-name="${data.array}" class="info${data.number}">
                            <h1><span>Name: </span><input oninput="updatePresetValue(this)" data-field="name" type="text" value="${data.name}"></h1>
                            <h1>Size: (<span style="font-weight: normal;">width: </span><input oninput="updatePresetValue(this)" data-field="width" type="number" value="${data.width}"> <span style="font-weight: normal;">height: </span><input oninput="updatePresetValue(this)" data-field="height" type="number" value="${data.height}">)</h1>
                            <h1>Position: (<span style="font-weight: normal;">x: </span><input oninput="updatePresetValue(this)" data-field="x" type="number" value="${data.x}"> <span style="font-weight: normal;">y: </span><input oninput="updatePresetValue(this)" data-field="y" type="number" value="${data.y}">)</h1>
                            <button onclick="deletePresetButton(${data.number}, 'background')">
                                <h1>Delete</h1>
                            </button>
                        </div>
                    </div>
                `
            }
        } else if (data.type === 'addButtonControll') {
            console.log("added",data)
            const presetsControllButtons = document.getElementById("presetsControllButtons");

            let info = presetsControllButtons.querySelector(`.info${data.number}`);

            if (!info) {
                presetsControllButtons.innerHTML+=`
                    <div id="button${data.number}">
                        <img src="${data.img}" alt="">
                        <div data-type="${data.number}" data-name="${data.array}" class="info${data.number}">
                            <h1><span>Name: </span><input oninput="updatePresetValue(this)" data-field="name" type="text" value="${data.name}"></h1>
                            <h1>Size: (<span style="font-weight: normal;">width: </span><input oninput="updatePresetValue(this)" data-field="width" type="number" value="${data.width}"> <span style="font-weight: normal;">height: </span><input oninput="updatePresetValue(this)" data-field="height" type="number" value="${data.height}">)</h1>
                            <h1>Position: (<span style="font-weight: normal;">x: </span><input oninput="updatePresetValue(this)" data-field="x" type="number" value="${data.x}"> <span style="font-weight: normal;">y: </span><input oninput="updatePresetValue(this)" data-field="y" type="number" value="${data.y}">)</h1>
                            <button onclick="deletePresetButton(${data.number}, 'button')">
                                <h1>Delete</h1>
                            </button>
                        </div>
                    </div>
                `
            }
        }
    });

}