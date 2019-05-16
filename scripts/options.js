
function saveStores() {
    var stores = [];
    var store_list = document.getElementsByClassName("store");
    for (var i = 0; i < store_list.length; i++) {
        stores.push({"site_url": store_list[i].textContent.trim(), "token": store_list[i].getAttribute("token").trim()});
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
    opt.setAttribute("tabindex", "0");
    container.appendChild(opt);

    var handle = document.createElement("span");
    handle.className = "move_icon";
    opt.appendChild(handle);

    var trash = document.createElement("span");
    trash.className = "delete_icon";
    opt.appendChild(trash);

    opt.addEventListener("drop", ()=>{
        // save after reorder
        saveStores();
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

Sortable.create(list_container, {
    handle: '.move_icon',
    animation: 150
  });

chrome.storage.local.get({"stores_info": []}, (res)=>{

    // no stores yet, display an error instead.
    if (res["stores_info"].length == 0) {
        showError("עדיין לא קישרת את התוסף אל אף חנות...", list_container);

        return;
    }

    res["stores_info"].forEach((store)=>{addOption(store, list_container)});
});