let draggingPresets = false
let addPresetValue;
let addType;
const iframe = document.getElementById("iframe");
const child = iframe.contentWindow;

const textarea = document.getElementById("textarea");
let textKeydown = "";
let deletedText = 0;
let pos = { type: "normal", value: 0 };

async function sendJsVariable() {
    const text = textarea.value.trim();

    try {
        child.postMessage({ absoluteType: "jsVariable", code: text }, "*");
    } catch (error) {
        console.error("Error sending JS variable to iframe:", error);
    }
}

async function setCode() {}

let saveTimeout = 0;
let saveTimeoutRun = false;
async function timeoutSave() {
    saveTimeoutRun = true;

    const interval = setInterval( async () => {
        saveTimeout--;

        if (saveTimeout <= 0 && !(deletedText <= 0 && textKeydown === "")) {
            clearInterval(interval);

            if (pos.type !== "normal") {
                pos.value = textarea.selectionStart + (pos.value - textarea.selectionStart);
                pos.type = "normal";
            } else {
                pos.value = textarea.selectionStart;
            }

            console.log(pos)
            console.log(textKeydown)

            saveTimeoutRun = false;
            console.log("Saving code...");

            const savedText = textKeydown || null;
            let savedTextLenght;
            try {
                savedTextLenght = savedText.replace("${space}", "e");
            } catch {
                savedTextLenght = savedText || 0;
            }
            textKeydown = "";
            const deleted = deletedText;
            deletedText = 0;
            const currentPos = savedText ? pos.value - savedTextLenght.length -1 : pos.value -1;
            console.log(currentPos)

            const urlParams = new URLSearchParams(window.location.search);
            const projectName = urlParams.get('name');
            const res = await fetch(`http://localhost:4000/setCode`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    start: currentPos,
                    replace: deleted,
                    insert: savedText,
                    name: projectName
                }),
            });
            
            const response = await res.json();
            console.log(response)
        }
    }, 1000);
}

textarea.addEventListener("keydown", async (event) => {
    const key = event.key;
    const selectStart = textarea.selectionStart;
    const selectEnd = textarea.selectionEnd;

    console.log("Start index:", selectStart, "End index:", selectEnd);

    if (/^[a-zA-Z0-9]$/.test(key) || key === "/") {
        textKeydown += key;
    } else if (key === "Tab") {
        textKeydown += "\t";
    } else if (key === "Enter") {
        textKeydown += "\n";
    } else if (key === "Backspace") {
        let spaceCheck = textKeydown.slice(0, -8);

        textKeydown = spaceCheck === "${space}" ? spaceCheck : textKeydown.slice(0, -1);

        if (textKeydown.length <= 0 && selectStart === selectEnd) {
            deletedText++;
        } else if (selectStart !== selectEnd) {
            deletedText += selectEnd - selectStart;
        }
    } else if (key === " ") {
        textKeydown += "${space}";
    }

    saveTimeout = 3;
    if (saveTimeoutRun === false) {
        timeoutSave();
    }

    if (deletedText <= 0 && textKeydown === "") return;

    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter"].includes(key)) {
        pos.type = "special";
        saveTimeout = 0;
    } else if (key === "Space") {
        pos.value = textarea.selectionStart;
        saveTimeout = 0;
    }

    textarea.addEventListener("click", function interuptTimeoutSave() {
        pos.type = "special";
        saveTimeout = 0;
        textarea.removeEventListener("click", interuptTimeoutSave);
    });
});

async function fetchCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectName = urlParams.get('name');

    try {
        const res = await fetch(`http://localhost:4000/fetchCode?name=${encodeURIComponent(projectName)}`, {
            method: "GET",
            credentials: "include"
        });
        const data = await res.json();
        console.log(data);

        if (data.code !== "") {
            textarea.value = data.code;
        }

        if (data.presets !== "") {
            child.postMessage({ type: "loadPresets", presets: data.presets }, "*");
        }
    } catch (error) {
        console.error("Error fetching code:", error);
    }
}
fetchCode();

{

    function removeScript(el, position) {

        const last = document.querySelectorAll(".arrowVertical");
        const lastEl = last[last.length - 1];

        const corner = position === "both" ? document.querySelectorAll(`.presetBox`) : document.querySelector(`.${position}`);

        const corners = corner.length ? [].concat(...corner || []).filter(Boolean) : [corner];

        const bothStatuses = corner.length ? corners.map(el => el.style.display) : [corner.style.display];

        const status = bothStatuses.every(s => s === "none") ? "" : "none";

        corners.forEach(cornerEl => cornerEl.style.display = (status) ? "none" : "");

        if (status == "none" && position == "both") lastEl.style.display = "none";
        else if (status !== "none" && position == "both") lastEl.style.display = "flex";

        el.parentElement.style.alignSelf = status == "none" ? "flex-end" : "center";

        el.querySelector("h1").innerText = status == "none" ? "<" : ">";
    }

    function presetControllPages(e) {
        const allPages = document.getElementById("presetsControllBody").querySelectorAll("div")
        allPages.forEach(page => page.style.display = "none");

        const selectedPage = document.getElementById(`presetsControll${e}`);
        selectedPage.style.display = "block";


        const allDescendants = selectedPage.querySelectorAll("*");
        allDescendants.forEach(el => el.style.display = "");
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
                    addPresetValue = addType = "";
                    console.log("canceled selection")
                } else {
                    draggingPresets = true;
                    addPresetValue =`../../public/images/${e}/${file}`;
                    addType = e;
                    console.log("selected")
                }
            });
        });
    }

}

function deletePresetButton(number, type) {
    console.log("delete")
    document.getElementById(type+number).remove()
    child.postMessage({ absoluteType: "preset", absoluteTypeBranch: "delete", type: type, number: number }, "*");
};

function updatePresetValue(el) {
    const field = el.dataset.field;
    const value = el.value;
    const parent = el.parentElement.parentElement;

    child.postMessage({
        absoluteType: "preset", 
        type: "updatePresetValue", 
        array: parent.dataset.name, 
        number: parent.dataset.type, 
        variable: field, 
        value: value 
    }, "*");
}

window.addEventListener('message', event => {
    const child = document.getElementById("iframe").contentWindow;
    const data = event.data;
    if (data.type === 'canvasClick') {
        console.log('Canvas clicked at:', data.x, data.y);

        if (addPresetValue != "" && draggingPresets == true) {
            child.postMessage({
                absoluteType: "preset",
                absoluteTypeBranch: "addPreset", 
                type: addType+"Add", 
                text: addPresetValue, 
                x: data.x, 
                y: data.y 
            }, "*");
            
            draggingPresets = false;
            addPresetValue = addType = "";
        }
    }

    if (data.absoluteTypeBranch === "addPresetControll") {
        let presetControll;
        if (data.type === 'addFigureControll') presetControll = document.getElementById("presetsControllFigures");
        else if (data.type === 'addBackgroundControll') presetControll = document.getElementById("presetsControllBackground");
        else if (data.type === 'addButtonControll') presetControll = document.getElementById("presetsControllButtons");
        
        const info = presetControll.querySelector(`.info${data.number}`);
        const presetArray = data.array;

        if (!info) {
            presetControll.innerHTML+=`
                <div id="${presetArray+data.number}">
                    <img src="${data.img}" alt="">
                    <div data-type="${data.number}" data-name="${presetArray}" class="info${data.number}">
                        <h1><span>Name: </span><input oninput="updatePresetValue(this)" data-field="name" type="text" value="${data.name}"></h1>
                        <h1>Size: (<span style="font-weight: normal;">width: </span><input oninput="updatePresetValue(this)" data-field="width" type="number" value="${data.width}"> <span style="font-weight: normal;">height: </span><input oninput="updatePresetValue(this)" data-field="height" type="number" value="${data.height}">)</h1>
                        <h1>Position: (<span style="font-weight: normal;">x: </span><input oninput="updatePresetValue(this)" data-field="x" type="number" value="${data.x}"> <span style="font-weight: normal;">y: </span><input oninput="updatePresetValue(this)" data-field="y" type="number" value="${data.y}">)</h1>
                        <button onclick="deletePresetButton(${data.number}, '${presetArray}')">
                            <h1>Delete</h1>
                        </button>
                    </div>
                </div>
            `
        }
    }
});