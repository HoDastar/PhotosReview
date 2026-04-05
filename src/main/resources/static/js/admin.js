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

panelBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        panelBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const page = btn.getAttribute('data-page');
        viewers.forEach(v => {
            v.style.display = v.id === page ? 'block' : 'none';
            history.pushState(null, "", "?p=" + page);
        });
    });
});

function goPage(p) {
    panelBtns.forEach(b => b.classList.remove('selected'));
    panelBtns.forEach(b => {
        if (b.getAttribute('data-page') == p) {
            b.classList.add('selected');
        }
    });
    viewers.forEach(v => {
        v.style.display = v.id === p ? 'block' : 'none';
    });
}

const uid = parseInt(getCookie('review_uid'), 10);
const token = getCookie('review_token');

// 检查登录情况（2分钟一次）
async function check_login() {
    // 获取结果
    let login_result = await getApi(window.location.origin + `/api/user/check_token?uid=${uid}&token=${token}`);
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

// Create Project
async function createProj() {
    const fileInput = document.getElementById("imgInputCreateThumbnail");
    const projName = document.querySelector('#createProj input[name="input_project_name"]').value;
    const reviewTypeInput = document.querySelector('#createProj input[name="review_type"]:checked');
    // 非空
    if (!projName || projName.trim() === "" || !reviewTypeInput || fileInput.value === '') {
        openModal(
            i18n.lookUp("modal_content_fail")[11].title,
            i18n.lookUp("modal_content_fail")[11].message
        );
        return;
    }

    if (projName.length > 100) {
        openModal(
            i18n.lookUp("modal_content_fail")[6].title,
            i18n.lookUp("modal_content_fail")[6].message
        );
        return;
    }

    const reviewType = parseInt(reviewTypeInput.value, 10);
    const param = {
        name: projName,
        type: reviewType,
        adminUid: uid,
        adminToken: token
    }
    const result = await postApiWithFile(window.location.origin + "/api/proj/create_proj", param, fileInput);
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg]["title"],
            i18n.lookUp("modal_content_fail")[msg]["message"]
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        cleanCreateProj();
        getProj();
    }
}

function getUserStatusText(status) {
    if (status === 0) {
        return i18n.lookUp("admin_user");
    }
    if (status === 2) {
        return i18n.lookUp("banned_user");
    }
    return i18n.lookUp("normal_user");
}

async function loadManageUserList() {
    const result = await getApi(window.location.origin + `/api/user/get_user_list_admin?adminUid=${uid}&adminToken=${token}`);
    if (!result.result) {
        return;
    }

    const tbody = document.getElementById("manageUserTableBody");
    if (!tbody) {
        return;
    }
    tbody.innerHTML = "";

    if (!result.data || result.data.length === 0) {
        const emptyTr = document.createElement("tr");
        emptyTr.innerHTML = `<td colspan="3">${i18n.lookUp("no_user")}</td>`;
        tbody.appendChild(emptyTr);
        return;
    }

    result.data.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.uid}</td>
            <td>${user.allname}</td>
            <td>${getUserStatusText(user.status)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getManageUserUid() {
    const uidInput = document.querySelector('#manageUser input[name="input_manage_user_uid"]');
    const targetUid = parseInt(uidInput.value, 10);
    if (!targetUid || targetUid < 10000 || targetUid > 999999999) {
        openModal(
            i18n.lookUp("modal_content_fail")[7].title,
            i18n.lookUp("modal_content_fail")[7].message
        );
        return null;
    }
    return targetUid;
}

function getManageUserAllname() {
    const allnameInput = document.querySelector('#manageUser input[name="input_manage_user_allname"]');
    const allname = allnameInput.value.trim();
    if (!allname) {
        openModal(
            i18n.lookUp("modal_content_fail")[11].title,
            i18n.lookUp("modal_content_fail")[11].message
        );
        return null;
    }
    if (allname.length > 10) {
        openModal(
            i18n.lookUp("modal_content_fail")[6].title,
            i18n.lookUp("modal_content_fail")[6].message
        );
        return null;
    }
    return allname;
}

async function registerUser() {
    const targetUid = getManageUserUid();
    if (!targetUid) {
        return;
    }
    const allname = getManageUserAllname();
    if (!allname) {
        return;
    }
    const statusEl = document.querySelector('#manageUser input[name="register_user_status"]:checked');
    if (!statusEl) {
        openModal(
            i18n.lookUp("modal_content_fail")[11].title,
            i18n.lookUp("modal_content_fail")[11].message
        );
        return;
    }
    const result = await postApi(window.location.origin + "/api/user/register", {
        uid: targetUid,
        allname,
        status: parseInt(statusEl.value, 10),
        adminUid: uid,
        adminToken: token
    });
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        await loadManageUserList();
    }
}

async function resetUserPassword() {
    const targetUid = getManageUserUid();
    if (!targetUid) {
        return;
    }
    const result = await postApi(window.location.origin + "/api/user/reset_password", {
        uid: targetUid,
        adminUid: uid,
        adminToken: token
    });
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        await loadManageUserList();
    }
}

async function banUser() {
    const targetUid = getManageUserUid();
    if (!targetUid) {
        return;
    }
    const result = await postApi(window.location.origin + "/api/user/ban_user", {
        uid: targetUid,
        adminUid: uid,
        adminToken: token
    });
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        await loadManageUserList();
    }
}

async function deleteUser() {
    const targetUid = getManageUserUid();
    if (!targetUid) {
        return;
    }
    const confirm = await openModal(
        i18n.lookUp("modal_content_confirm")[2].title,
        i18n.lookUp("modal_content_confirm")[2].message,
        true
    );
    if (!confirm) {
        return;
    }

    const result = await postApi(window.location.origin + "/api/user/delete_user", {
        uid: targetUid,
        adminUid: uid,
        adminToken: token
    });
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        await loadManageUserList();
    }
}

// Clean Create Project Form
function cleanCreateProj() {
    document.querySelector("#createProj .text-input").value = "";
    document.querySelector('input[name="review_type"][value="0"]').checked = true;
    const fileInput = document.getElementById("imgInputCreateThumbnail");
    fileInput.value = "";
    const display = document.getElementById("imgInputCreateThumbnailDisplay");
    display.innerHTML = `<span>${i18n.lookUp("you_havent_chosen")}</span>`;
}

// Get Project List
async function getProj() {
    const result = await getApi(window.location.origin + `/api/proj/get_proj_list_admin?adminUid=${uid}&adminToken=${token}`);
    if (!result.result) {
        const msg = parseInt(result.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
        return;
    }
    projList = result.data;

    const projListContainerEl = document.getElementById("projListContainer");
    // const projListSCardContainerEl = document.getElementById("projListSCardContainer");
    projListContainerEl.innerHTML = "";
    // projListSCardContainerEl.innerHTML = "";
    projList.forEach((el, index) => {
        /**
         * Project List渲染
         * @Begin
         */
        const cardEl = document.createElement("div");
        cardEl.classList.add("card");
        const backgroundUrl = "/data/proj/" + el.name + "/icon/" + el.thumbnail;

        const cardBackgroundEl = document.createElement("div");
        cardBackgroundEl.classList.add("card_background");
        cardBackgroundEl.style.cssText = `background: url("${backgroundUrl}") center / cover;`;
        cardEl.appendChild(cardBackgroundEl);

        const cardContentEl = document.createElement("div");
        cardContentEl.style.zIndex = "1";
        const imgEl = document.createElement("img");
        imgEl.src = backgroundUrl;
        cardContentEl.appendChild(imgEl);

        const cardTextEl = document.createElement("div");
        cardTextEl.classList.add("card_text");
        const h3El = document.createElement("h3");
        h3El.innerText = el.name;
        cardTextEl.appendChild(h3El);

        const pEl = document.createElement("p");

        pEl.innerHTML += `<i class="fa-solid fa-folder"></i>`;
        switch (el.type) {
            case 0:
                pEl.innerHTML += i18n.lookUp("review_review_type");
                break;

            case 1:
                pEl.innerHTML += i18n.lookUp("screening_review_type");
                break;

            default:
                pEl.innerHTML += `Unknow`;
                break;
        }
        pEl.innerHTML += `<br>`;

        pEl.innerHTML += `<i class="fa-solid fa-list-check"></i>`;
        switch (el.status) {
            case 0:
                pEl.innerHTML += `<span class="tag color_blue">${i18n.lookUp("pending")}</span>`
                break;

            case 1:
                pEl.innerHTML += `<span class="tag color_green">${i18n.lookUp("progress")}</span>`
                break;

            case 2:
                pEl.innerHTML += `<span class="tag color_purple">${i18n.lookUp("closing")}</span>`
                break;

            case 3:
                pEl.innerHTML += `<span class="tag color_red">${i18n.lookUp("finished")}</span>`
                break;

            default:
                pEl.innerHTML += `<span class="tag color_red">Unknown</span>`
                break;
        }
        pEl.innerHTML += `<br>`;

        pEl.innerHTML += `<i class="fa-regular fa-clock"></i>` + el.time;
        pEl.innerHTML += `<br>`;

        pEl.innerHTML += `<i class="fa-solid fa-display"></i>` + (el.display ? i18n.lookUp("show") : i18n.lookUp("hide"));

        cardTextEl.appendChild(pEl);

        const buttonManageEl = document.createElement("button");
        buttonManageEl.innerHTML = `<i class="fa-solid fa-gear"></i> ${i18n.lookUp("manage_project")}`;
        buttonManageEl.addEventListener("click", () => {
            loadManageProj(index, el.id);
        });
        cardTextEl.appendChild(buttonManageEl);

        const buttonDistEl = document.createElement("button");
        buttonDistEl.innerHTML = `<i class="fa-solid fa-diagram-project"></i> ${i18n.lookUp("manage_distribution")}`;
        buttonDistEl.addEventListener("click", () => {
            loadManageDist(index, el.id);
        });
        cardTextEl.appendChild(buttonDistEl);

        const buttonDeleteEl = document.createElement("button");
        buttonDeleteEl.style.background = "rgb(220, 38, 38)";
        buttonDeleteEl.innerHTML = `<i class="fa-solid fa-trash"></i> ${i18n.lookUp("delete")}`;
        buttonDeleteEl.addEventListener("click", () => {
            deleteProj(el.name);
        });
        cardTextEl.appendChild(buttonDeleteEl);

        cardContentEl.appendChild(cardTextEl);
        cardEl.appendChild(cardContentEl);
        projListContainerEl.appendChild(cardEl);
        /**
         * Project List渲染
         * @End
         */


        /**
         * Project List S Card渲染
         * @Begin
         * Discard
         */
        /*
        selectedUploadToProjName = '';
        // 判断status
        if (el.status === 0 || el.status === 1) {
            let statusText = "";
            let typeText = "";
            const sCardEl = document.createElement("div");
            sCardEl.classList.add("sCard");
            const h3El = document.createElement("h3");
            h3El.innerHTML = el.name;
            sCardEl.appendChild(h3El);
            switch (el.type) {
                case 0:
                    typeText = i18n.lookUp("review_review_type");
                    break;

                case 1:
                    typeText = i18n.lookUp("screening_review_type");
                    break;

                default:
                    typeText = `Unknow`;
                    break;
            }
            switch (el.status) {
                case 0:
                    statusText = `<span class="tag color_blue">${i18n.lookUp("pending")}</span>`;
                    break;

                case 1:
                    statusText = `<span class="tag color_green">${i18n.lookUp("progress")}</span>`;
                    break;

                default:
                    statusText = `<span class="tag color_red">Unknown</span>`;
                    break;
            }
            const pEl1 = document.createElement("p");
            pEl1.innerHTML = `<i class="fa-solid fa-folder"></i> ${typeText}`;
            const pEl2 = document.createElement("p");
            pEl2.innerHTML = `<i class="fa-solid fa-list-check"></i> ${statusText}`;
            sCardEl.appendChild(pEl1);
            sCardEl.appendChild(pEl2);
            sCardEl.addEventListener("click", () => {
                if (selectedUploadToProjName !== el.name) {
                    selectedUploadToProjName = el.name;
                    document.querySelectorAll(".projListSCardContainer .sCard").forEach(card => {
                        card.classList.remove("active");
                    });
                    sCardEl.classList.add("active");
                }
            });
            projListSCardContainerEl.appendChild(sCardEl);
        }
        */
        /**
         * Project List S Card渲染
         * @End
         * Discard
         */
    });

    if (!projList || projList.length === 0) {
        projListContainerEl.innerHTML = `<p style="font-size: 38px;text-align: center;width: 100%;color: var(--color-fg);">${i18n.lookUp("no_project")}</p>`;
    }
}

function loadManageProj(index, id) {
    if (!projList[index]) {
        openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }
    goPage("manageProj");

    const projNameEl = document.querySelector('#manageProj input[name="input_project_name"]');
    const reviewDisplayInput = document.querySelectorAll('#manageProj input[name="review_display"]');
    const reviewStatusInput = document.querySelectorAll('#manageProj input[name="review_status"]');
    const proj = projList[index];

    projNameEl.value = proj.name;
    if (proj.display === 0) {
        reviewDisplayInput[1].checked = true;
    } else {
        reviewDisplayInput[0].checked = true;
    }
    switch (proj.status) {
        case 0:
            reviewStatusInput[0].checked = true;
            break;

        case 1:
            reviewStatusInput[1].checked = true;
            break;

        case 2:
            reviewStatusInput[2].checked = true;
            break;

        case 3:
            reviewStatusInput[3].checked = true;
            break;

        default:
            break;
    }
    currentManageProjId = id;
}

async function loadManageDist(index, id) {
    if (!projList[index]) {
        openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }
    // 获取工程总量
    const resultTotal = await getApi(window.location.origin + `/api/proj/get_proj_count?proj_name=${projList[index].name}&adminUid=${uid}&adminToken=${token}`);
    if (!resultTotal.result) {
        const msg = parseInt(resultTotal.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
        return;
    }
    goPage("manageDist");

    const distributionContainerEl = document.getElementById("distributionContainer");
    const manageDistProjNameEl = document.getElementById("manageDistProjName");
    const manageDistTotalEl = document.getElementById("manageDistTotal");

    currentManageProjId = id;

    const total = resultTotal.data;
    manageDistProjNameEl.innerHTML = projList[index].name;
    manageDistTotalEl.innerHTML = total;

    // 获取当前项目的task分发列表
    currentTaskList = JSON.parse(projList[index].task);

    /**
     * 通过uid和第n项修改first和end
     * @param uid uid
     * @param n 第n项
     * @param first first
     * @param end end
     */
    const editTask = (uid, n, first, end) => {
        const uidStr = String(uid);
        currentTaskList[uidStr][n] = [first, end];
    }
    /**
     * 新增此uid用户一项任务
     * @param uid uid
     * @param first first
     * @param end end
     */
    const addTask = (uid, first, end) => {
        const uidStr = String(uid);
        // 判断是不是第一个
        if (Object.keys(currentTaskList).length === 0) {
        }
        if (currentTaskList[uidStr]) {
            currentTaskList[uidStr].push([first, end]);
        } else {
            currentTaskList[uidStr] = [[first, end]];
        }
        render();
    }
    /**
     * 删除此uid用户的第n项任务
     * @param uid
     * @param n
     */
    const delTask = (uid, n) => {
        const uidStr = String(uid);
        if (currentTaskList[uidStr]) {
            currentTaskList[uidStr].splice(n, 1);
            if (currentTaskList[uidStr].length === 0) {
                delete currentTaskList[uidStr];
            }
            render();
        }
    }
    // 渲染
    const render = () => {
        distributionContainerEl.innerHTML = "";

        /**
         * 添加表单
         * @Begin
         */
        // UID
        const addEl = document.createElement("tr");
        const addUidTdEl = document.createElement("td");
        addUidTdEl.classList.add("text-edit");
        const addUidInputEl = document.createElement("input");
        addUidInputEl.classList.add("text-input", "on-distribution");
        addUidInputEl.placeholder = "UID";
        addUidTdEl.appendChild(addUidInputEl);
        addEl.appendChild(addUidTdEl);

        // first
        const addFirstTdEl = document.createElement("td");
        addFirstTdEl.classList.add("text-edit");
        const addFirstInputEl = document.createElement("input");
        addFirstInputEl.classList.add("text-input", "on-distribution");
        addFirstInputEl.placeholder = i18n.lookUp("first");
        addFirstTdEl.appendChild(addFirstInputEl);
        addEl.appendChild(addFirstTdEl);

        // last
        const addLastTdEl = document.createElement("td");
        addLastTdEl.classList.add("text-edit");
        const addLastInputEl = document.createElement("input");
        addLastInputEl.classList.add("text-input", "on-distribution");
        addLastInputEl.placeholder = i18n.lookUp("last");
        addLastTdEl.appendChild(addLastInputEl);
        addEl.appendChild(addLastTdEl);

        // add按钮
        const addBtnTdEl = document.createElement("td");
        const addBtnEl = document.createElement("span");
        addBtnEl.classList.add("btn", "edit");
        addBtnEl.title = i18n.lookUp("add");
        addBtnEl.innerHTML = `<i class="fa-solid fa-circle-plus"></i>`;
        addBtnTdEl.appendChild(addBtnEl);
        addEl.appendChild(addBtnTdEl);

        distributionContainerEl.appendChild(addEl);
        /**
         * 添加表单
         * @End
         */

        if (Object.keys(currentTaskList).length === 0) {
            const trEl = document.createElement("tr");
            const tdEl = document.createElement("td");
            tdEl.colSpan = 4;
            tdEl.innerHTML = i18n.lookUp("no_task");
            trEl.appendChild(tdEl);
            distributionContainerEl.appendChild(trEl);
        } else {
            // UID的所有任务
            Object.entries(currentTaskList).forEach(([uid, tasks]) => {
                // UID下的每一项任务
                tasks.forEach((task, index) => {
                    // 创建行
                    const trEl = document.createElement("tr");

                    // UID列
                    const uidTdEl = document.createElement("td");
                    uidTdEl.classList.add("text-edit");
                    uidTdEl.innerHTML = uid;
                    uidTdEl.style.cursor = 'default';
                    trEl.appendChild(uidTdEl);

                    // first列
                    const firstTdEl = document.createElement("td");
                    firstTdEl.classList.add("text-edit");
                    firstTdEl.title = i18n.lookUp("dblclick_to_edit");
                    firstTdEl.innerHTML = task[0];
                    // 双击事件
                    firstTdEl.addEventListener("dblclick", () => {
                        const inputEl = document.createElement("input");
                        inputEl.value = task[0];
                        inputEl.classList.add("text-input", "on-distribution");
                        firstTdEl.innerHTML = "";
                        firstTdEl.appendChild(inputEl);
                        inputEl.focus();
                        // 失去焦点事件
                        inputEl.addEventListener("blur", () => {
                            const newValue = parseInt(inputEl.value, 10);
                            if (isNaN(newValue) || newValue < 0 || newValue >= total || newValue > task[1]) {
                                openModal(
                                    i18n.lookUp("modal_content_fail")[17].title,
                                    i18n.lookUp("modal_content_fail")[17].message
                                );
                                firstTdEl.innerHTML = task[0];
                            } else {
                                editTask(uid, index, newValue, task[1]);
                                firstTdEl.innerHTML = String(newValue);
                            }
                        });
                    });
                    trEl.appendChild(firstTdEl);

                    // last列
                    const lastTdEl = document.createElement("td");
                    lastTdEl.classList.add("text-edit");
                    lastTdEl.title = i18n.lookUp("dblclick_to_edit");
                    lastTdEl.innerHTML = task[1];
                    // 双击事件
                    lastTdEl.addEventListener("dblclick", () => {
                        const inputEl = document.createElement("input");
                        inputEl.value = task[1];
                        inputEl.classList.add("text-input", "on-distribution");
                        lastTdEl.innerHTML = "";
                        lastTdEl.appendChild(inputEl);
                        inputEl.focus();
                        // 失去焦点事件
                        inputEl.addEventListener("blur", () => {
                            const newValue = parseInt(inputEl.value, 10);
                            if (isNaN(newValue) || newValue < 0 || newValue >= total || newValue < task[0]) {
                                openModal(
                                    i18n.lookUp("modal_content_fail")[17].title,
                                    i18n.lookUp("modal_content_fail")[17].message
                                );
                                lastTdEl.innerHTML = task[1];
                            } else {
                                editTask(uid, index, task[0], newValue);
                                lastTdEl.innerHTML = String(newValue);
                            }
                        });
                    });
                    trEl.appendChild(lastTdEl);

                    // 删除按钮
                    const delTdEl = document.createElement("td");
                    const delBtnEl = document.createElement("span");
                    delBtnEl.classList.add("btn", "del");
                    delBtnEl.title = i18n.lookUp("delete");
                    delBtnEl.innerHTML = `<i class="fa-solid fa-trash"></i>`;
                    // 删除按钮事件
                    delBtnEl.addEventListener("click",async  () => {
                        let confirm = await openModal(
                            i18n.lookUp("modal_content_confirm")[4].title,
                            i18n.lookUp("modal_content_confirm")[4].message
                        );
                        if (confirm) {
                            delTask(uid, index);
                        }
                    });
                    delTdEl.appendChild(delBtnEl);
                    trEl.appendChild(delTdEl);

                    distributionContainerEl.appendChild(trEl);
                })
            });
        }

        // 注册Add表单
        addBtnEl.addEventListener("click", () => {
            const uid = parseInt(addUidInputEl.value, 10);
            const first = parseInt(addFirstInputEl.value, 10);
            const last = parseInt(addLastInputEl.value, 10);
            if (isNaN(uid) || isNaN(first) || isNaN(last) || uid <= 0 || first < 0 || last < 0 || first > last) {
                openModal(
                    i18n.lookUp("modal_content_fail")[17].title,
                    i18n.lookUp("modal_content_fail")[17].message
                );
                return;
            }
            if (last >= total) {
                openModal(
                    i18n.lookUp("modal_content_fail")[18].title,
                    i18n.lookUp("modal_content_fail")[18].message
                );
                return;
            }
            addTask(uid, first, last);
        });
    }

    // 首次渲染
    render();
}

// Save Manage Project
async function saveManageProj() {
    const projName = document.querySelector('#manageProj input[name="input_project_name"]').value;
    const reviewDisplayInput = document.querySelector('#manageProj input[name="review_display"]:checked');
    const reviewStatusInput = document.querySelector('#manageProj input[name="review_status"]:checked');
    const fileInput = document.getElementById("imgInputManageThumbnail");


    // 非空
    if (!projName || projName.trim() === "" || !reviewStatusInput || !reviewDisplayInput) {
        openModal(
            i18n.lookUp("modal_content_fail")[11].title,
            i18n.lookUp("modal_content_fail")[11].message
        );
        return;
    }

    // 长度超过限制
    if (projName.length > 100) {
        openModal(
            i18n.lookUp("modal_content_fail")[6].title,
            i18n.lookUp("modal_content_fail")[6].message
        );
        return;
    }

    const reviewDisplay = parseInt(reviewDisplayInput.value, 10);
    const reviewStatus = parseInt(reviewStatusInput.value, 10);
    const param = {
        id: currentManageProjId,
        name: projName,
        display: reviewDisplay,
        status: reviewStatus,
        adminUid: uid,
        adminToken: token
    };
    const result = await postApiWithFile(window.location.origin + "/api/proj/update_proj", param, fileInput);
    console.log(result);
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        await openModal(
            i18n.lookUp("modal_content_success")[0].title,
            i18n.lookUp("modal_content_success")[0].message
        );
        getProj();
        goPage("projList");
    }
}

// Save Manage Distribution
async function saveManageDist() {}

// Delete Project
async function deleteProj(name) {
    const confirm = await openModal(
        i18n.lookUp("modal_content_confirm")[1].title,
        i18n.lookUp("modal_content_confirm")[1].message,
        true
    );
    if (confirm) {
        const result = await postApi(window.location.origin + "/api/proj/delete_proj", {
            projName: name,
            adminUid: uid,
            adminToken: token
        });
        const msg = parseInt(result.message, 10);
        if (!result.result) {
            await openModal(
                i18n.lookUp("modal_content_fail")[msg].title,
                i18n.lookUp("modal_content_fail")[msg].message
            );
        } else {
            await openModal(
                i18n.lookUp("modal_content_success")[0].title,
                i18n.lookUp("modal_content_success")[0].message
            );
            await getProj();
        }
    }
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

function photosPoolChange(files) {
    const filePoolEl = document.getElementById("filePool");
    const imgExt = ["jpg", "png", "jpeg", "webp"];

    [...files].forEach(file => {
        // 分配uuid
        const uuid = crypto.randomUUID();
        const fileName = file.name;
        const fileExt = fileName.split(".").pop().toLowerCase();
        if (!imgExt.includes(fileExt)) {
            return;
        }

        const itemEl = document.createElement("div");
        itemEl.classList.add("item");
        // 创建图片预览
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgEl = document.createElement("img");
            imgEl.src = e.target.result;
            itemEl.appendChild(imgEl);
            //itemEl.style.cssText = `background: url("${e.target.result}")`;
        }
        reader.readAsDataURL(file);

        const progressContainerEl = document.createElement("div");
        progressContainerEl.classList.add("progress-container");
        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar");
        progressBar.style.width = '0%';
        progressBar.style.display = "none";
        progressContainerEl.appendChild(progressBar);
        const closeEl = document.createElement("div");
        closeEl.classList.add("close");
        closeEl.innerHTML = '×';
        closeEl.addEventListener("click", () => {
            delete photosPool[uuid];
            itemEl.remove();
        });
        const labelEl = document.createElement("div");
        labelEl.classList.add("label", "color_blue");
        labelEl.innerHTML = "READY";

        itemEl.appendChild(progressContainerEl);
        itemEl.appendChild(closeEl);
        itemEl.appendChild(labelEl);
        filePoolEl.appendChild(itemEl);

        let fileX = {};
        fileX.file = file;
        fileX.progressBar = progressBar;
        fileX.labelEl = labelEl;
        // 添加数组
        photosPool[uuid] = fileX;
    });
}

async function uploadImages() {
    const filePoolEl = document.getElementById("filePool");
    const author = document.querySelector('#manageProj input[name="input_author"]').value;
    if (!currentManageProjId || !author|| Object.keys(photosPool).length === 0) {
        openModal(
            i18n.lookUp("modal_content_fail")[11].title,
            i18n.lookUp("modal_content_fail")[11].message
        );
        return;
    }
    if (author.length > 50) {
        openModal(
            i18n.lookUp("modal_content_fail")[6].title,
            i18n.lookUp("modal_content_fail")[6].message
        );
        return;
    }

    const f = async (fileX, uuid) => {
        const progressBar = fileX.progressBar;
        const labelEl = fileX.labelEl
        let param = {
            id: currentManageProjId,
            author: author,
            adminUid: uid,
            adminToken: token
        };

        progressBar.style.display = "block";
        labelEl.innerHTML = 'UPLOADING';

        const result = await postApiWithFileOnProgress(
            window.location.origin + "/api/proj/upload_image",
            param,
            fileX.file,
            progressBar
        );
        if (!result.result) {
            const msg = result.message;
            showBubble(i18n.lookUp("modal_content_fail")[19].message);
            labelEl.classList.remove("color_blue");
            labelEl.classList.add("color_red");
            labelEl.innerHTML = "FAIL";
        } else {
            labelEl.classList.remove("color_blue");
            labelEl.classList.add("color_green");
            labelEl.innerHTML = "SUCCESS";
            delete photosPool[uuid];
        }

    }

    const limit = 3; // 限制同时上传的数量
    const uuids = Object.keys(photosPool);
    const queue = Object.values(photosPool);
    let index = 0;

    const runNext = () => {
        if (index < queue.length) {
            const fileX = queue[index];
            const uuid = uuids[index];
            index++;
            f(fileX, uuid)
                .then(runNext);
        }
    }
    for (let i = 0; i < limit && i < queue.length; i++) {
        runNext();
    }
}

function cleanPhotosPool() {
    const filePoolEl = document.getElementById("filePool");
    filePoolEl.innerHTML = '';
    Object.keys(photosPool).forEach(key => delete photosPool[key]);
}

function loadWebsiteInfo() {
    const info = localStorage.getItem("website_info");
    if (info) {
        const infoObj = JSON.parse(info);
        url = infoObj.website_url;

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
                    window.location.href = infoObj.website_url + "/admin";
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
    loadWebsiteInfo();
    await getProj();
    await loadManageUserList();

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
    document.getElementById("cleanPhotosPool").addEventListener("click", cleanPhotosPool);
    document.getElementById("uploadPhotosPool").addEventListener("click", uploadImages);
    document.getElementById("submitRegisterUser").addEventListener("click", registerUser);
    document.getElementById("resetUserPassword").addEventListener("click", resetUserPassword);
    document.getElementById("banUserBtn").addEventListener("click", banUser);
    document.getElementById("deleteUserBtn").addEventListener("click", deleteUser);

    const imgInputUploadEl = document.getElementById("imgInputUpload")
    const selectImageToPoolEl = document.getElementById("selectImagesToPool")
    selectImageToPoolEl.addEventListener("click", () => {
        imgInputUploadEl.click();
    });
    imgInputUploadEl.addEventListener("change", (e) => {
        photosPoolChange(e.target.files)
    });

})();
