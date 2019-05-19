
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

// easy xhr
function easyXHR(url, r_type, l_func, e_func, params) {
	var xhr = new XMLHttpRequest();
	var pg = (params != "") ? "POST" : "GET";
	xhr.open(pg, url, true);
	xhr.responseType = r_type;
	if (params != "") xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	
	xhr.onreadystatechange = function() {
		if (this.readyState === 4)
			if (this.status === 200)
				l_func(xhr);
	};
	
	if (e_func != null)
		xhr.onerror = e_func;
	
	if (params != "") xhr.send(params)
		else xhr.send();
}


// where the box will be created
var summary_panel = document.getElementById("RightSummaryPanel");

var template_func = function(tmp) {
    // load template, parse to HTML and add it to the document
    var final_tmp = tmp.responseText.replace(/\{\$logo_img\}/gi, chrome.extension.getURL("icons/10BUYlogo.png"));
    final_tmp = final_tmp.replace(/\{\$pref_img\}/gi, chrome.extension.getURL("icons/preferences.svg"));

    var template = new DOMParser().parseFromString(final_tmp, "text/html");
    summary_panel.insertBefore(template.querySelector("div"), summary_panel.childNodes[0]);

    var start_button = document.getElementById("m_10buy_start_button");
    var contents = document.getElementById("m_10buy_wrapper").getElementsByClassName("si-content");
    var confirm_button = document.getElementById("m_10buy_wrapper").querySelector("button");
    var message_container = document.getElementById("m_10buy_message");
    var edit_link = document.getElementById("m_10buy_edit_in_store").querySelector("a");

    // when the button is clicked, show the full form to the user
    start_button.addEventListener("click", ()=>{
        contents[0].style.display = "none";
        contents[1].style.display = "block";

        chrome.storage.local.get({"stores_info": []}, (res)=>{
            // if the user didn't configure any store, return an error (keep template as is, change nothing)
            if (res["stores_info"].length == 0)
                return;
            
            // the user configured stores, show the full form, hide the error
            document.getElementById("m_10buy_no_stores").style.display = "none";
            document.getElementById("m_10buy_form").style.display = "block";

            var store_dropdown = document.getElementById("m_10buy_store_list");
            var category_dropdown = document.getElementById("m_10buy_categories");

            // category options button
            document.getElementById("m_10buy_options").addEventListener("click", () => chrome.runtime.sendMessage({"action": "openOptionsPage"}) );

            // to be used on form start-up and when the user changes to another store
            var load_categories = function (url, token) {
                while (category_dropdown.firstChild) {
                    category_dropdown.removeChild(category_dropdown.firstChild);
                }
                
                ElementCreate("option", "", {"value": "none", "disabled": "true", "selected": "true"}, "בחר קטגוריה", category_dropdown);

                var make_options = function(xhr) {
                    if (xhr.response.hasOwnProperty("api_error")){

                        if (xhr.response["api_error"] == "Unauthorized"){
                            message_container.style.display = "block";
                            message_container.textContent = "הקישור בין החנות {$1} לבין התוסף בוטל על ידי המערכת.".replace("{$1}", url);

                            chrome.storage.local.get({"stores_info": []}, (res2) => {
                                var resave = res2["stores_info"].filter(store => store["site_url"] != url);
                                chrome.storage.local.set({"stores_info": resave});
                            });
                        }

                        return;
                    }

                    xhr.response.forEach((category)=>{
                        ElementCreate("option", "", {"value": category["category_id"]}, category["title"], category_dropdown);
                    });
                };

                var options_error = function() {
                    message_container.style.display = "block";
                    message_container.textContent = "שגיאה בניסיון לייבא קטגוריות מהחנות.";
                };

                easyXHR("https://" + url + "/api/category/list", "json", make_options, options_error, "token=" + token)
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
                // all store are deleted
                if (parseInt(store_dropdown.value) == -1)
                    return;

                var selected_store = res["stores_info"][parseInt(store_dropdown.value)];
                load_categories(selected_store["site_url"], selected_store["token"]);
            });

            // send info to 10buy when clicking the "confirm" button
            confirm_button.addEventListener("click", ()=>{

                // don't continue if the user didn't pick a category
                if (category_dropdown.value == "none") {
                    message_container.style.display = "block";
                    message_container.textContent = "חובה לבחור קטגוריה.";

                    return;
                }

                // disable the button so the user will not use it again before we get a response
                confirm_button.disabled = true;

                var message_func = function(xhr) {
                    confirm_button.disabled = false;
                    var final_message = (xhr.response["success"]) ? "המוצר נוסף בהצלחה!" : "הוספת המוצר נכשלה.";
                    message_container.textContent = final_message;
                    message_container.style.display = "block";
                    message_container.style.color = (xhr.response["success"]) ? "green" : "red";
                    document.getElementById("m_10buy_edit_in_store").style.display = (xhr.response["success"]) ? "block" : "none";
                    document.getElementById("m_10buy_error_message").style.display = (!xhr.response["success"]) ? "block" : "none";

                    if (xhr.response["success"]) {
                        edit_link.setAttribute("href", xhr.response["update_url"]);
                    }
                    else {
                        document.getElementById("m_10buy_error_message").textContent = xhr.response["error"];
                    }
                };

                var params = "token=" + res["stores_info"][store_dropdown.value]["token"] + "&category_id=" + category_dropdown.value + "&ebay_url=" + window.location.href;
                var url = "https://" + res["stores_info"][store_dropdown.value]["site_url"] + "/api/product/fetch";

                var fetch_error = function () {
                    confirm_button.disabled = false;
                    message_container.style.display = "block";
                    message_container.textContent = "שגיאה בניסיון לתקשר עם החנות.";
                };

                easyXHR(url, "json", message_func, fetch_error, params);
            });

        });

    });
};


easyXHR(chrome.extension.getURL("ebay.html"), "text", template_func, null, "");



