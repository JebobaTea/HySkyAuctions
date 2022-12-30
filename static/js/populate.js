getAuctions(0, true);

var obfuscators = [];
var styleMap = {
    '§0': 'color:#000000',
    '§1': 'color:#0000AA',
    '§2': 'color:#00AA00',
    '§3': 'color:#00AAAA',
    '§4': 'color:#AA0000',
    '§5': 'color:#AA00AA',
    '§6': 'color:#FFAA00',
    '§7': 'color:#AAAAAA',
    '§8': 'color:#555555',
    '§9': 'color:#5555FF',
    '§a': 'color:#55FF55',
    '§b': 'color:#55FFFF',
    '§c': 'color:#FF5555',
    '§d': 'color:#FF55FF',
    '§e': 'color:#FFFF55',
    '§f': 'color:#FFFFFF',
    '§l': 'font-weight:bold',
    '§m': 'text-decoration:line-through',
    '§n': 'text-decoration:underline',
    '§o': 'font-style:italic',
};
function obfuscate(string, elem) {
    var magicSpan,
        currNode;
    if(string.indexOf('<br>') > -1) {
        elem.innerHTML = string;
        for(var j = 0, len = elem.childNodes.length; j < len; j++) {
            currNode = elem.childNodes[j];
            if(currNode.nodeType === 3) {
                magicSpan = document.createElement('span');
                magicSpan.innerHTML = currNode.nodeValue;
                elem.replaceChild(magicSpan, currNode);
                init(magicSpan);
            }
        }
    } else {
        init(elem, string);
    }
    function init(el, str) {
        var i = 0,
            obsStr = str || el.innerHTML,
            len = obsStr.length;
        obfuscators.push( window.setInterval(function () {
            if(i >= len) i = 0;
            obsStr = replaceRand(obsStr, i);
            el.innerHTML = obsStr;
            i++;
        }, 0) );
    }
    function randInt(min, max) {
        return Math.floor( Math.random() * (max - min + 1) ) + min;
    }
    function replaceRand(string, i) {
        var randChar = String.fromCharCode( randInt(64, 95) );
        return string.substr(0, i) + randChar + string.substr(i + 1, string.length);
    }
}
function applyCode(string, codes) {
    var elem = document.createElement('span'),
        obfuscated = false;
    string = string.replace(/\x00*/g, '');
    for(var i = 0, len = codes.length; i < len; i++) {
        elem.style.cssText += styleMap[codes[i]] + ';';
        if(codes[i] === '§k') {
            obfuscate(string, elem);
            obfuscated = true;
        }
    }
    if(!obfuscated) elem.innerHTML = string;
    return elem;
}
function parseStyle(string) {
    var codes = string.match(/§.{1}/g) || [],
        indexes = [],
        apply = [],
        tmpStr,
        deltaIndex,
        noCode,
        final = document.createDocumentFragment(),
        i;
    string = string.replace(/\n|\\n/g, '<br>');
    for(i = 0, len = codes.length; i < len; i++) {
        indexes.push( string.indexOf(codes[i]) );
        string = string.replace(codes[i], '\x00\x00');
    }
    if(indexes[0] !== 0) {
        final.appendChild( applyCode( string.substring(0, indexes[0]), [] ) );
    }
    for(i = 0; i < len; i++) {
    	indexDelta = indexes[i + 1] - indexes[i];
        if(indexDelta === 2) {
            while(indexDelta === 2) {
                apply.push ( codes[i] );
                i++;
                indexDelta = indexes[i + 1] - indexes[i];
            }
            apply.push ( codes[i] );
        } else {
            apply.push( codes[i] );
        }
        if( apply.lastIndexOf('§r') > -1) {
            apply = apply.slice( apply.lastIndexOf('§r') + 1 );
        }
        tmpStr = string.substring( indexes[i], indexes[i + 1] );
        final.appendChild( applyCode(tmpStr, apply) );
    }
    return final;
}
function clearObfuscators() {
    var i = obfuscators.length;
    for(;i--;) {
        clearInterval(obfuscators[i]);
    }
    obfuscators = [];
}
function initParser(input) {
    clearObfuscators();
    input = input.replace("\n", "<br>");
    lore = document.getElementById("itemLore");
    lore.innerHTML = '';
    lore.appendChild(parseStyle(input));
}

async function getAuctionData(event) {
    target = event.target;
    uuid = target.getAttribute("uuid");
    id = target.getAttribute("id");

    const auc = await fetch("/api/id?id=" + id);
    a = await auc.json();
    if (a["caching"] == "false") {
        l = a["auction"]["item_lore"];
        initParser(l);
    } else {
        lore = document.getElementById("itemLore");
        lore.innerHTML = "Current data is outdated, please refresh your page";
    }

    itemName = target.getAttribute("itemName");
    className = target.getAttribute("className");
    i = document.getElementById("itemName");
    i.innerHTML = itemName;
    i.className = "card-title " + className;
    const r = await fetch("https://api.ashcon.app/mojang/v2/user/" + uuid);
    res = await r.json();
    playerName = res["username"];
    n = document.getElementById("auctioneerName");
    n.innerHTML = "/ah " + playerName;
}

function clearData() {
    n = document.getElementById("auctioneerName");
    i = document.getElementById("itemName");
    lore = document.getElementById("itemLore");

    lore.innerHTML = "Loading...";
    i.innerHTML = "Loading..."
    i.className = "card-title";
    n.innerHTML = "/ah None"
}

function clearAuctions() {
    items = document.getElementsByClassName("item");
    for (let i = items.length-1; i >= 0; i--) {
        items[i].remove();
    }
}

function dispNext() {
    info = document.getElementById("current");
    current = info.innerHTML.split(" ");
    max = parseInt(current[current.length - 1]);
    current = parseInt(current[0]);
    if (current < max - 1) {
        clearAuctions();
        getAuctions(current + 1);
        info.innerHTML = `${current + 1} out of ${max}`;
    }
}

function dispPrev() {
    info = document.getElementById("current");
    current = info.innerHTML.split(" ");
    max = parseInt(current[current.length - 1]);
    current = parseInt(current[0]);
    if (current > 0) {
        clearAuctions();
        getAuctions(current - 1);
        info.innerHTML = `${current - 1} out of ${max}`;
    }
}

async function getAuctions(p, first=false) {
    type = document.getElementById("type");
    tier = document.getElementById("tier");
    query = document.getElementById("query");
    url = "/api/page?p= " + p + "&type=" + type.value + "&tier=" + tier.value;
    if (query) {
        url += "&query=" + query.value;
    }
    const response = await fetch(url);
    resp = await response.json();
    parent = document.getElementById("auctionGrid");
    if (resp["caching"] == "false") {
        for (let i = 0; i < resp["auctions"].length; i++) {
            item = document.createElement("div");
            item.classList.add("item");
            auction = resp["auctions"][i][1];
            pages = resp["pages"];
            itemName = auction["item_name"].replace("➊", "⬤").replace("➋", "⬤⬤").replace("➌", "⬤⬤⬤").replace("➍", "⬤⬤⬤⬤");
            tier = auction["tier"];
            className = tier.toLowerCase();
            if (auction["bin"]) {
                price = auction["starting_bid"];
                priceText = "BIN: " + price.toLocaleString();
            } else {
                price = auction["highest_bid_amount"];
                if (price == 0) {
                    price = auction["starting_bid"]
                    priceText = "Starting Bid: " + price.toLocaleString();
                } else {
                    priceText = "Highest Bid: " + price.toLocaleString();
                }
            }
            lastUpdated = auction["last_updated"];
            playerUUID = auction["auctioneer"];
            updated = new Date(lastUpdated * 1000);
            hours = updated.getHours();
            minutes = "0" + updated.getMinutes();
            seconds = "0" + updated.getSeconds();
            updatedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

            endTime = auction["end"];
            end = new Date(endTime * 1000);
            hours = end.getHours();
            minutes = "0" + end.getMinutes();
            seconds = "0" + end.getSeconds();
            endTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

            id = resp["auctions"][i][0];

            item.innerHTML = `
            <div class="card card-compact w-96 bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title ${className}">${itemName}</h2>
                <p>${priceText}</p>
                <p>Last Updated: ${updatedTime}</p>
                <p>Ends At: ${endTime}</p>
                <div class="card-actions justify-end">
                  <label for="my-modal-3" class="btn gap-2" onclick="getAuctionData(event)" className="${className}" itemName="${itemName}" uuid="${playerUUID}" id="${id}">
                    Details
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            `
            parent.appendChild(item);
            if (first) {
                pagination = document.getElementById("current");
                pagination.innerHTML = "0 out of " + pages;
            }
        }
    } else {
        for (let i = 0; i < 30; i++) {
            item = document.createElement("div");
            item.classList.add("item");
            item.innerHTML = `
            <div class="card card-compact w-96 bg-base-100 shadow-xl">
              <div class="card-body">
                <h2 class="card-title">Currently Caching</h2>
                <p>Please allow for a few moments for our data to refresh</p>
              </div>
            </div>
            `
            parent.appendChild(item);
        }
    }
}