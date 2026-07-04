const panelBtns = document.querySelectorAll('.panel-btn');
const viewers = document.querySelectorAll('.viewer');
let projList;
let currentManageProjId;
let selectedUploadToProjName;
/**
 *  Example:
 *      {
 *          "10000": [
 *              [0, 219],[220, 438]
 *          ],
 *          "10010": [[0, 438]],
 *          "10011": [[0, 438]]
 *      }
 */
let currentTaskList;
let photosPool = {};
let currentManagePhotosList = [];

function goPage(p, u = true) {
    panelBtns.forEach(b => b.classList.remove('selected'));
    panelBtns.forEach(b => {
        if (b.getAttribute('data-page') == p) {
            b.classList.add('selected');
        }
    });
    viewers.forEach(v => {
        v.style.display = v.id === p ? 'block' : 'none';
        if (u) {
            history.pushState(null, "", "?p=" + p);
        }
    });
}

panelBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        /*
        panelBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const page = btn.getAttribute('data-page');
        viewers.forEach(v => {
            v.style.display = v.id === page ? 'block' : 'none';
            history.pushState(null, "", "?p=" + page);
        });
         */
        const page = btn.getAttribute('data-page');
        goPage(page)
    });
});

const uid = parseInt(getCookie('review_uid'), 10);
const token = getCookie('review_token');

// 检查登录情况（2分钟一次）
async function check_login() {
    // 获取结果
    let login_result = await getApi(url + `/api/user/check_token?uid=${uid}&token=${token}`);
    if (!login_result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[12].title,
            i18n.lookUp("modal_content_fail")[12].message
        );
        document.body.innerHTML = '';
        window.location.href = "./loginout.html";
        return false;
    }
    setTimeout(() => {
        check_login();
    }, 2000 * 60);
}

function fileInputChange(id, allowed = ["jpg", "png", "jpeg", "webp"]) {
    const fileInput = document.getElementById(id);
    const file = fileInput.files[0]
    const fileName = file.name;
    const fileExt = fileName.split(".").pop().toLowerCase();
    if (!allowed.includes(fileExt)) {
        fileInput.value = "";
        return;
    }
    const imgExt = ["jpg", "png", "jpeg", "webp"];
    const display = document.getElementById(id + "Display");
    display.innerHTML = '';
    if (imgExt.includes(fileExt)) {
        const imgEl = document.createElement("img");
        imgEl.classList.add("file-preview");
        display.appendChild(imgEl);
        // 创建图片预览
        const reader = new FileReader();
        reader.onload = (e) => {
            imgEl.src = e.target.result;
        }
        reader.readAsDataURL(file);
    } else {
        const fileNameEl = document.createElement("span");
        fileNameEl.innerText = fileName;
        display.appendChild(fileNameEl);
    }
}

async function loadWebsiteInfo() {
    const info = await getApi(url + "/api/system/get_website_info");
    if (info) {
        const infoObj = info.data;

        const link = document.createElement("link");
        link.rel = "icon";
        link.href = infoObj.website_icon;
        document.head.appendChild(link);

        document.querySelectorAll("[data-config]").forEach(el => {
            const key = el.getAttribute("data-config");
            if (key === "website_name") {
                el.innerText = infoObj.website_name;
            }
            if (key === "website_url") {
                el.addEventListener("click", () => {
                    window.location.href = url + "/admin.html";
                });
            }
        });

        document.getElementsByTagName("title")[0].innerText = infoObj.website_name + " " + i18n.lookUp("nav_title");

    } else {
        setTimeout(() => {
            loadWebsiteInfo()
        }, 500);
    }
}

// 退出登录
async function signout() {
    let a = await openModal(
        i18n.lookUp("modal_content_confirm")[0].title,
        i18n.lookUp("modal_content_confirm")[0].message
    );
    if (a) {
        window.location.href = "./loginout.html"
    } else {
        return;
    }
}


(async () => {
    await i18n.init();

    // 检查cookie
    if (!uid || !token) {
        document.body.innerHTML = '';
        window.location.href = "./login.html";
        return false;
    }
    check_login();
    document.getElementById("uidEl").innerHTML = 'UID: ' + uid.toString();

    // 读取GET参数p，切换到对应页面
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("p")) {
        goPage(urlParams.get("p"));
    }
    // Loading website information
    await loadWebsiteInfo();
    await getProj();
    await loadManageUserList();
    await loadSystemSettingsForm();
    initProgressPage();

    // Loading Button Events
    document.getElementById("submitCreateProj").addEventListener("click", createProj);
    document.getElementById("cleanCreateProj").addEventListener("click", cleanCreateProj);
    document.getElementById("saveManageProj").addEventListener("click", saveManageProj);
    document.getElementById("cancelManageProj").addEventListener("click", () => {
        goPage("projList");
    });
    document.getElementById("saveManageDist").addEventListener("click", saveManageDist);
    document.getElementById("cancelManageDist").addEventListener("click", () => {
        goPage("projList");
    });
    document.getElementById("imgInputCreateThumbnail").addEventListener("change", () => {
        fileInputChange("imgInputCreateThumbnail");
    });
    document.getElementById("imgInputManageThumbnail").addEventListener("change", () => {
        fileInputChange("imgInputManageThumbnail");
    });
    document.getElementById("systemWebsiteIcon").addEventListener("change", () => {
        fileInputChange("systemWebsiteIcon");
    });
    document.getElementById("cleanPhotosPool").addEventListener("click", cleanPhotosPool);
    document.getElementById("uploadPhotosPool").addEventListener("click", uploadImages);
    document.getElementById("submitRegisterUser").addEventListener("click", registerUser);
    document.getElementById("filterManagePhotos").addEventListener("click", filterManagePhotos);
    document.getElementById("saveSystemSettings").addEventListener("click", saveSystemSettings);
    document.getElementById("deleteSelectedPhotos").addEventListener("click", deleteSelectedPhotos);

    const imgInputUploadEl = document.getElementById("imgInputUpload")
    const selectImageToPoolEl = document.getElementById("selectImagesToPool")
    selectImageToPoolEl.addEventListener("click", () => {
        imgInputUploadEl.click();
    });
    imgInputUploadEl.addEventListener("change", (e) => {
        photosPoolChange(e.target.files)
    });

})();
