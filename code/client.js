const iframe = document.querySelector("iframe");

async function getProfile(request, collumn) {

    console.log(request, collumn);
    try {
        let requestInfo;
        if (request) {
            requestInfo = `?table=${request}&collumn=${collumn}`;
        }
        const res = await fetch("http://localhost:4000/profile"+requestInfo, {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();
        console.log(data);

        iframe.contentWindow.postMessage({ type: "responseInfo", value: data.info }, "*");

        if (!data.success) {
            iframe.src = "login/login.html";
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        iframe.src = "login/login.html";
    }
}

async function loginUser(username, password) {
    
    const res = await fetch(`http://localhost:4000/login?username=${username}&password=${password}`, {
        method: "GET",
        credentials: "include"
    });
    const data = await res.json();
    console.log(data);

    if (data.success) {
        iframe.src = "profile/profile.html";
    }
}

window.addEventListener("message", (event) => {
    const data = event.data;
    const type = data.type;
    if (type === "login") {
        loginUser(data.username, data.password);

    } else if (type === "requestInfo") {
        getProfile(data.table, data.collumn);
    } else if (type === "editProject") {
        console.log(data)
        iframe.src = 'codespace/codespace.html?name=' + encodeURIComponent(data.name);
    }
});