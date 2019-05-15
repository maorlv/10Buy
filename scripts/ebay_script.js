
// easy creation for divs, spans, etc...
function ElementCreate(elmType, elmClass, attributes = {}, text = "", father = null, insertFirst = false) {
    var elm = document.createElement(elmType);
    elm.textContent = text;
    elm.className = elmClass;

    for (const prop in attributes) {
        elm.setAttribute(prop, attributes[prop]);
    }

    if (father != null) {
        if (insertFirst) father.insertBefore(elm, father.childNodes[0]);
        else father.appendChild(elm);
    }

    return elm;
}

// create a box for the extension's form
var summary_panel = document.getElementById("RightSummaryPanel");
var div_container = ElementCreate("div", "vi-swc-wrapper vi-grBr", {"dir": "rtl"}, "", summary_panel, true);

// before clicking on the button
var content_before_click = ElementCreate("div", "si-content", {}, "", div_container);
var title_with_button = ElementCreate("div", "si-ttl", {}, "", content_before_click);
var start_button = ElementCreate("a", "btn btn-prim  vi-VR-btnWdth-XL", {}, "הוספה לחנות", title_with_button);
ElementCreate("img", "", {"src": "https://www.10buy.co.il/assets/62dc6c9a/img/logo.png", "style": "float: left; height: 30px"}, "", title_with_button);

// after clicking the button
var content_after_click = ElementCreate("div", "si-content", {"style": "display: none"}, "", div_container);
var title_no_button = ElementCreate("h2", "si-ttl", {"style": "line-height: 30px;"}, "הוספה לחנות", content_after_click);
ElementCreate("img", "", {"src": "https://www.10buy.co.il/assets/62dc6c9a/img/logo.png", "style": "float: left; height: 30px"}, "", title_no_button);

// when the button is clicked, show the full form to the user
start_button.addEventListener("click", ()=>{
    content_before_click.style.display = "none";
    content_after_click.style.display = "block";

    chrome.storage.local.get({"stores_info": []}, (res)=>{

        // if the user didn't configure any store, return an error
        if (res["stores_info"].length == 0) {
            ElementCreate("div", "si-bdg si-pd-eu", {"style": "padding-top: 10px;"}, "יש לחבר תחילה את החנות שלך מפאנל הניהול.", content_after_click);
            return;
        }
    
        ElementCreate("div", "si-bdg si-pd-eu", {}, "בחר חנות", content_after_click);
        var store_dropdown = ElementCreate("select", "msku-sel", {"style": "border: 1px solid lightgray; width: 200px;"}, "", ElementCreate("div", "si-bdg si-pd-eu", {}, "", content_after_click));
        
        ElementCreate("div", "si-bdg si-pd-eu", {}, "בחר קטגוריה", content_after_click);
        var category_dropdown = ElementCreate("select", "msku-sel", {"style": "border: 1px solid lightgray; width: 200px;"}, "", ElementCreate("div", "si-bdg si-pd-eu", {}, "", content_after_click));
        
        // to be used on form start-up and when the user changes to another store
        var load_categories = function (url, token) {
            while (category_dropdown.firstChild) {
                category_dropdown.removeChild(category_dropdown.firstChild);
            }
            
            ElementCreate("option", "", {"value": "", "disabled": "true", "selected": "true"}, "בחר קטגוריה", category_dropdown);
            var xhr = new XMLHttpRequest();
            xhr.responseType = "json";
            xhr.open("POST", "https://" + url + "/api/category/list", true);

            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4)
                    if (xhr.status === 200) {
                        xhr.response.forEach((category)=>{
                            ElementCreate("option", "", {"value": category["category_id"]}, category["title"], category_dropdown);
                        });
                    }
            };

            xhr.send("token=" + token);
        };

        // always load the first store at startup
        load_categories(res["stores_info"][0]["site_url"], res["stores_info"][0]["token"]);
    
        // create an <option> to each store
        var i = 0;
        res["stores_info"].forEach((store)=>{
            ElementCreate("option", "", {"value": i++}, store["site_url"], store_dropdown);
        });

        // when changing a store reload the categories
        store_dropdown.addEventListener("change", ()=>{
            var selected_store = res["stores_info"][store_dropdown.value];
            load_categories(selected_store["site_url"], selected_store["token"]);
        });
    
        var confirm_button = ElementCreate("a", "btn btn-prim  vi-VR-btnWdth-XL", {}, "הוסף", ElementCreate("div", "", {}, "", content_after_click));
        var message_container = ElementCreate("div", "", {"style": "display: none"}, "", content_after_click);

        // send info to 10buy when clicking the "confirm" button
        confirm_button.addEventListener("click", ()=>{
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://" + res["stores_info"][store_dropdown.value]["site_url"] + "/api/product/fetch", true);
            xhr.responseType = "json";
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4)
                    if (xhr.status === 200) {
                        var final_message = (xhr.response["success"]) ? "המוצר נוסף בהצלחה!" : "הוספת המוצר נכשלה.";
                        var color = (xhr.response["success"]) ? "green" : "red";
                        message_container.textContent = final_message;
                        message_container.style.display = "block";
                        message_container.setAttribute("style", "color: " + color + "; padding-top: 10px;")
                    }
            };

            xhr.send("token=" + res["stores_info"][store_dropdown.value]["token"] + "&category_id=" + category_dropdown.value + "&ebay_url=" + window.location.href);
        });
    });

});

