window.onhashchange = () => location.reload();
window.onerror = function (msg, url, line, col, error) {
    if (!msg.includes("projectbox")) {
        alert("Error: " + msg);
    }
};

window.onresize = () => handleResize();

document.querySelector("#prev").addEventListener("click", () => move(-10));
document.querySelector("#next").addEventListener("click", () => move(10));

function move(amount) {
    const params = new URLSearchParams(location.search);
    params.set("offset", parseInt(window.offset) + amount);
    location.search = "?" + params.toString();
}

function switchViewer(target) {
    const params = new URLSearchParams(location.search);
    params.set("viewer", target);
    location.search = "?" + params.toString();
}

function refresh() {
    const params = new URLSearchParams(location.search);
    params.set("new", true);
    location.search = "?" + params.toString();
}

function handleResize() {
    if (window.viewer == "scratch") {
        let { width, height } = getComputedStyle(document.querySelector("#container"));
        width = parseFloat(width.replace("px", ""));
        height = parseFloat(height.replace("px", ""));
        const treeEl = document.querySelector("#tree-container");
        const scaleWidth = width / 940;
        const scaleHeight = height / 500;
        const scale = Math.min(scaleWidth, scaleHeight);
        treeEl.style.scale = scale;

        const zoomEl = document.querySelector("#zoomContainer");
        zoomEl.style.scale = 1 / scale;
        // zoomEl.style.top = `calc(5px * ${scale})`
    }
}

function handleSubmit(evt) {
    evt.preventDefault();
    if (!document.querySelector("#idPicker").value) return;
    const params = new URLSearchParams(location.search);
    let paramsString = `?viewer=${params.get("viewer") || "scratch"}`;
    window.history.replaceState({}, "", `${location.origin}${location.pathname}${paramsString}${location.hash}`);
    location.hash = `#${document.querySelector("#idPicker").value}`;
}

function validate(evt) {
    var theEvent = evt || window.event;
    if (evt.key == "Enter") return;

    // Handle paste
    if (theEvent.type === "paste") {
        key = evt.clipboardData.getData("text/plain");
    } else {
        // Handle key press
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
    }
    var regex = /[0-9]|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
}

function consolidateData(scratchTree, level = 0) {
    // console.log(level)
    let size;
    if (level < 2) {
        size = 50;
        // } else if (level < 5) {
        //     size = 15
    } else {
        size = Math.max(10, 30 - level * 2);
    }

    let myVal = {
        image: `https://uploads.scratch.mit.edu/get_image/project/${scratchTree.id}_${size}x${Math.round(size * (3 / 4))}.png`,
        link: {
            href: `https://scratch.mit.edu/projects/${scratchTree.id}`,
            target: "_blank",
        },
        // stackChildren: true
    };
    if (scratchTree.children) {
        myVal.children = scratchTree.children.map((child) => consolidateData(child, level + 1));
    }
    return myVal;
}

function checkLoad() {
    if (document.querySelector(".Treant-loaded")) {
        // setTimeout(function() {
        const chart = document.querySelector(".chart");
        // chart.style.width = "100%"
        // chart.style.height = "100%"
        // chart.style.overflowY = "hidden"
        const nodes = Array.from(document.querySelectorAll(".Treant > .node"));
        nodes.at(-1).scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "center",
        });

        document.querySelector("#loading-container").hidden = true;
        // }, 500)
    } else {
        setTimeout(checkLoad, 50);
    }
}

async function showInfo() {
    const info = document.querySelector("#info");
    const r = await fetch(`https://trampoline.turbowarp.org/api/projects/${window.id}`);
    const response = await r.json();
    if (r.status == 404) {
        alert("Project not found");
        location.href = "/";
        window.nope = true;
        return;
    }
    const remixes = response.stats.remixes;
    info.querySelector("#title-link").innerText = response.title;
    info.querySelector("#title-link").href = `https://scratch.mit.edu/projects/${response.id}`;
    if (window.offset == 0) {
        document.querySelector("#prevCount").parentElement.hidden = true;
    } else {
        document.querySelector("#prevCount").innerText = window.offset;
    }
    if (remixes - 10 - window.offset <= 0) {
        document.querySelector("#nextCount").parentElement.hidden = true;
    } else {
        document.querySelector("#nextCount").innerText = remixes - 10 - window.offset;
    }
    document.querySelector("#buttons").hidden = false;
}

async function showProjectInfo(event) {
    if (window.scheduleHide) clearInterval(window.scheduleHide);
    window.scheduleHide = null;

    document.querySelector("#project-preview").hidden = false;
    const id = event.target.href.split("/").at("-1");
    window.fetchTarget = id;
    console.log(id);
    document.querySelector("#preview-img").src = `https://cdn2.scratch.mit.edu/get_image/project/${id}_200x150.png`;
    document.querySelector("#preview-title").innerText;
    const response = await (await fetch(`https://trampoline.turbowarp.org/api/projects/${id}`)).json();
    if (window.fetchTarget == id) {
        document.querySelector("#preview-title").innerText = response.title;
        document.querySelector("#preview-author").innerText = "by " + response.author.username;
        document.querySelector("#preview-created").innerText = "Created " + new Date(response.history.shared).toLocaleDateString();
        document.querySelector("#preview-loves").innerText = `${response.stats.loves} ❤️`;
        document.querySelector("#preview-faves").innerText = `${response.stats.favorites} ⭐`;
        document.querySelector("#preview-views").innerText = `${response.stats.views} 👁️`;
        document.querySelector("#preview-remixes").innerText = `${response.stats.remixes}`;
    }
}

function scheduleHideProjectInfo() {
    window.scheduleHide = setTimeout(hideProjectInfo, 1000);
}

function hideProjectInfo() {
    document.querySelector("#project-preview").hidden = true;
    document.querySelector("#preview-img").src = "";
    document.querySelectorAll("#preview-title, #preview-author, #preview-created").forEach((el) => (el.innerText = ""));
}

function convertDataForScratch(data, newData, parentId) {
    function makeDate(date) {
        return new Date(date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    }
    newData[data.id.toString()] = {
        title: data.title,
        creator: data.author.username,
        favorite_count: data.stats.favorites,
        love_count: data.stats.loves,
        parent_id: parentId,
        visibility: "visible",
        moderation_status: "safe",
        is_published: true,
        children: data.children.map((r) => r.id.toString()),
    };
    for (const remix of data.children) {
        convertDataForScratch(remix, newData, data.id);
    }
}

(async function () {
    window.id = parseInt(location.hash.slice(1));
    if (!window.id) {
        location.href = "/";
        return;
    }
    const params = new URLSearchParams(location.search);
    window.offset = params.get("offset") ?? 0;
    window.viewer = params.get("viewer") ?? "scratch";
    document.querySelector("select").value = viewer;
    const getNew = params.get("new");
    params.delete("new");
    let paramsString = "?" + params.toString();
    if (paramsString == "?") {
        paramsString = "";
    }
    window.history.replaceState({}, "", `${location.origin}${location.pathname}${paramsString}${location.hash}`);
    console.log(id, offset);
    document.querySelector("#idPicker").value = id;
    await showInfo();
    if (window.nope) return;

    let noticeTimer = setTimeout(function () {
        document.querySelector("#loading-info").innerHTML = "<div>Generating remix tree...</div><div>This might take a while</div>";
    }, 2500);

    window.data = await (
        await fetch(`https://renderapi.quuq.dev/remixtree/${id}?offset=${offset}`, {
            headers: getNew ? { "X-RefreshTree": "true" } : undefined,
            cache: getNew ? "reload" : undefined,
            signal: AbortSignal.timeout(999999999),
        })
    ).json();
    clearTimeout(noticeTimer);
    document.querySelector("#loading-info").innerHTML = "Rendering remix tree...";
    console.log(consolidateData(data));

    if (viewer == "treant") {
        document.querySelector("#treant-remixtree").hidden = false;
        var chart_config = {
            chart: {
                container: "#treant-remixtree",
                rootOrientation: "SOUTH",
                maxDepth: 10000,
                levelSeparation: 10,
                siblingSeparation: 5,
                // subTreeSeperation: 1,
                // subTeeSeperation: 1,
                // animateOnInit: false,
                // node: {
                //     collapsable: false
                // },
                // animation: {
                //     nodeAnimation: "easeOutBounce",
                //     nodeSpeed: 700,
                //     connectorsAnimation: "bounce",
                //     connectorsSpeed: 700
                // },
                connectors: {},
            },
            // node: {
            //     stackChildren: true
            // }
        };

        chart_config.nodeStructure = consolidateData(data);
        setTimeout(checkLoad, 100);

        window.tree = new Treant(chart_config);
        const nodes = Array.from(document.querySelectorAll(".Treant > .node"));
        for (const node of nodes) {
            let str = node.children[0].src;
            let idx = str.lastIndexOf("_") + 1;
            let idx2 = str.lastIndexOf(".png");
            let targetSize = str.slice(idx, idx2).split("x");
            node.style.width = targetSize[0] + "px";
            node.style.height = targetSize[1] + "px";

            node.addEventListener("mouseenter", showProjectInfo);
            node.addEventListener("mouseleave", scheduleHideProjectInfo);
        }
        nodes.at(-1).scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "center",
        });
    } else if (viewer == "scratch") {
        document.querySelector("#container").style.display = "flex";
        await treeScratch(data);
        handleResize();
        setTimeout(() => {
            document.querySelector("#container").style.backgroundColor = "#92b5ca";
            document.querySelector("#zoomContainer").hidden = false;
        }, 0);
    }
})();

async function treeScratch(data) {
    /*
    Some code from https://github.com/CST1229/treemix under the MIT license, modified by me
    The license for the code used:

    MIT License

    Copyright (c) 2025 CST1229

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */

    // if (treeURL) {
    //     URL.revokeObjectURL(treeURL);
    //     treeURL = "";
    // }
    let treeURL = "";

    // const treeDiv = document.createElement("div");
    // treeDiv.id = "tree";
    // document.body.appendChild(treeDiv);
    const treeDiv = document.getElementById("#tree");

    const newData = {};
    newData.id = data.id;
    // this would require fetching the root project. i am not doing that yet
    const USE_ROOT = false;
    if (USE_ROOT) {
        newData.root_id = data.remix.root || data.id;
        convertDataForScratch(data, newData, data.remix.parent || null);
    } else {
        newData.root_id = data.id;
        convertDataForScratch(data, newData, null);
    }

    window.scratchTreeData = newData;

    window.navData = [];
    window.Scratch = {};
    Scratch.INIT_DATA = {};
    Scratch.INIT_DATA.GLOBAL_URLS = {
        media_url: "https://uploads.scratch.mit.edu/",
        static_url: "https://cdn.scratch.mit.edu/scratchr2/static/__5b3e40ec58a840b41702360e9891321b__/",
        static_path: "https://scratch.mit.edu/scratchr2/static/__5b3e40ec58a840b41702360e9891321b__/",
    };
    treeURL = URL.createObjectURL(new Blob([JSON.stringify(newData)], { type: "text/plain" }));

    // setStatus("Loading libraries...");
    function loadScript(src) {
        const script = document.createElement("script");
        script.src = src;
        document.body.appendChild(script);
        return new Promise((res, rej) => {
            script.onload = res;
            script.onerror = rej;
        });
    }
    await loadScript("/assets/libraries/jquery.min.js");
    await loadScript("/assets/libraries/treejs.js");
    // await loadScript(Scratch.INIT_DATA.GLOBAL_URLS.static_url + "js/jquery.min.js");
    // await loadScript(Scratch.INIT_DATA.GLOBAL_URLS.static_url + "js/treejs.js");
    window.buildTree(treeURL, data.id);
}
