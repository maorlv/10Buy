
function saveStores() {
    var stores = [];
    var store_list = document.getElementsByClassName("store");
    for (var i = 0; i < store_list.length; i++) {
        stores.push({"site_url": store_list[i].id.trim(), "token": store_list[i].getAttribute("token").trim()});
    }
    chrome.storage.local.set({"stores_info": stores});
}

function showError(text, container) {
    var opt = document.createElement("div");
    opt.className = "error";
    opt.textContent = text;
    container.appendChild(opt);
}

function addOption(store, container) {
    var opt = document.createElement("div");
    opt.className = "store";
    opt.textContent = store["site_url"];
    opt.setAttribute("token", store["token"]);
    opt.id = store["site_url"];
    opt.setAttribute("tabindex", "0");
    container.appendChild(opt);

    var handle = document.createElement("span");
    handle.className = "move_icon";
    handle.draggable = true;
    opt.appendChild(handle);

    var trash = document.createElement("span");
    trash.className = "delete_icon";
    opt.appendChild(trash);

    opt.addEventListener("dragend", ()=>{
        opt.classList.remove("active");
        container.classList.remove("dragging");

        document.getElementById("current").value = "";

        // save after reorder
        saveStores();
    });

    opt.addEventListener("dragover", (ev)=>{
        ev.preventDefault();
        var dragged = document.getElementById("current").value;

        if (dragged == opt.id)
            return;

        var stores = [];
        document.querySelectorAll(".store").forEach(store => {if (store.id != dragged || true) stores.push(store.id);});

        if (stores.indexOf(dragged) > stores.indexOf(opt.id))
            document.getElementById("list_container").insertBefore(document.getElementById(dragged), opt);
        else
            document.getElementById("list_container").insertBefore(document.getElementById(dragged), opt.nextSibling);
        
    });

    handle.addEventListener("dragstart", (ev)=>{
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("text/html", ev.target.parentNode);
        ev.dataTransfer.setDragImage(ev.target.parentNode, 350, 17);
        document.getElementById("current").value = ev.target.parentNode.id;

        ev.target.parentNode.classList.add("active");
        container.classList.add("dragging");

    });

    trash.addEventListener("click", ()=>{
        // remove a store
        container.removeChild(opt);

        saveStores();
        
        if (container.childNodes.length == 0) {
            showError("התוסף אינו מקושר לאף חנות.", container);
        }
    });
}

var list_container = document.getElementById("list_container");

chrome.storage.local.get({"stores_info": []}, (res)=>{

    // no stores yet, display an error instead.
    if (res["stores_info"].length == 0) {
        showError("עדיין לא קישרת את התוסף אל אף חנות...", list_container);

        return;
    }

    res["stores_info"].forEach((store)=>{addOption(store, list_container)});
});