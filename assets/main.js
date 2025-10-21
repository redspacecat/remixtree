window.onhashchange = () => location.reload();
window.onerror = function (msg, url, line, col, error) {
    alert("Error: " + msg);
};

document.querySelector("#prev").addEventListener("click", () => move(-10));
document.querySelector("#next").addEventListener("click", () => move(10));

function move(amount) {
    const params = new URLSearchParams(location.search);
    params.set("offset", parseInt(window.offset) + amount);
    location.search = "?" + params.toString();
}

function refresh() {
    const params = new URLSearchParams(location.search);
    params.set("new", true);
    location.search = "?" + params.toString();
}

function handleSubmit(evt) {
    evt.preventDefault();
    if (!document.querySelector("#idPicker").value) return;
    location.search = "";
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
        location.href = "/"
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

(async function () {
    window.id = parseInt(location.hash.slice(1));
    if (!window.id) {
        location.href = "/";
        return;
    }
    const params = new URLSearchParams(location.search);
    window.offset = params.get("offset") ?? 0;
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
            signal: AbortSignal.timeout(999999999)
        })
    ).json();
    clearTimeout(noticeTimer);
    document.querySelector("#loading-info").innerHTML = "Rendering remix tree...";
    console.log(consolidateData(data));
    var chart_config = {
        chart: {
            container: "#remixtree",
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
})();
