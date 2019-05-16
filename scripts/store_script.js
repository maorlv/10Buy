// get the button
var btn = document.querySelector(".google-extension-connect");
if (btn) {
    chrome.storage.local.get({"stores_info": []}, (res)=>{

        // check if current store is already configured in the extension
        var already_configured = false;
        res["stores_info"].forEach((store) => {
            if (store["site_url"] == window.location.hostname) {
                already_configured = true;
            }
        });

        var btn_click = function() {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "https://" + window.location.hostname + "/admin/api/getToken", true);
            xhr.responseType = "json";
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4)
                    if (xhr.status === 200) {
                        // add the store to the current stores-list and then save the new list
                        res["stores_info"].push(xhr.response);
                        chrome.storage.local.set({"stores_info": res["stores_info"]});

                        // tell the user that the connection was successful
                        btn.querySelector(".btn").textContent = "חיבור בוצע בהצלחה";

                        // we don't want the user to click again and add the same store more than once...
                        btn.removeEventListener("click", btn_click);
                    }
            };
        
            xhr.send();
        };

        // if not configured, show the button the user and assign btn_click() to the button
        if (!already_configured) {
            btn.style.display = "inline-block";
            btn.addEventListener("click", btn_click);
        }
    });
}