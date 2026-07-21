// Get Project List
async function getProj() {
    const result = await getApi(url + `/api/proj/get_proj_list_admin?adminUid=${uid}&adminToken=${token}`);
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
        const backgroundUrl = "/data/proj/" + el.projId + "/icon/" + el.thumbnail;

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
            loadManageProj(index, el.projId);
        });
        cardTextEl.appendChild(buttonManageEl);

        const buttonGalleryEl = document.createElement("button");
        buttonGalleryEl.innerHTML = `<i class="fa-solid fa-images"></i> ${i18n.lookUp("manage_photos")}`;
        buttonGalleryEl.addEventListener("click", () => {
            loadManageGallery(index, el.projId);
        });
        cardTextEl.appendChild(buttonGalleryEl);

        const buttonDeleteEl = document.createElement("button");
        buttonDeleteEl.style.background = "rgb(220, 38, 38)";
        buttonDeleteEl.innerHTML = `<i class="fa-solid fa-trash"></i> ${i18n.lookUp("delete")}`;
        buttonDeleteEl.addEventListener("click", () => {
            deleteProj(el.projId);
        });
        cardTextEl.appendChild(buttonDeleteEl);

        cardContentEl.appendChild(cardTextEl);
        cardEl.appendChild(cardContentEl);
        projListContainerEl.appendChild(cardEl);
        /**
         * Project List渲染
         * @End
         */
    });

    if (!projList || projList.length === 0) {
        projListContainerEl.innerHTML = `<p style="font-size: 38px;text-align: center;width: 100%;color: var(--color-fg);">${i18n.lookUp("no_project")}</p>`;
    }
}

// Load Manage Project List
async function loadManageProj(index, id) {
    if (!projList[index]) {
        openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }
    goPage("manageProj", false);

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
    await loadManageDist(index, id);
}
// Load Manage Distribution List
async function loadManageDist(index, id) {
    if (!projList[index]) {
        openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }
    // 获取工程总量
    const resultTotal = await getApi(url + `/api/proj/get_proj_count?proj_id=${projList[index].projId}&adminUid=${uid}&adminToken=${token}`);
    if (!resultTotal.result) {
        const msg = parseInt(resultTotal.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
        return;
    }
    const distributionContainerEl = document.getElementById("distributionContainer");
    const manageProjNameEl = document.getElementById("manageProjName");
    const manageTotalEl = document.getElementById("manageTotal");

    currentManageProjId = id;

    const total = resultTotal.data;
    manageProjNameEl.innerHTML = projList[index].name;
    manageTotalEl.innerHTML = total;

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
        render();
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
        addUidInputEl.setAttribute("autocomplete", "off");
        addUidInputEl.placeholder = "UID";
        addUidTdEl.appendChild(addUidInputEl);
        addEl.appendChild(addUidTdEl);

        // first
        const addFirstTdEl = document.createElement("td");
        addFirstTdEl.classList.add("text-edit");
        const addFirstInputEl = document.createElement("input");
        addFirstInputEl.classList.add("text-input", "on-distribution");
        addFirstInputEl.setAttribute("autocomplete", "off");
        addFirstInputEl.placeholder = i18n.lookUp("first");
        addFirstTdEl.appendChild(addFirstInputEl);
        addEl.appendChild(addFirstTdEl);

        // last
        const addLastTdEl = document.createElement("td");
        addLastTdEl.classList.add("text-edit");
        const addLastInputEl = document.createElement("input");
        addLastInputEl.classList.add("text-input", "on-distribution");
        addLastInputEl.setAttribute("autocomplete", "off");
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
async function refreshManageProjectInfo() {
    await getProj();
    const index = projList.findIndex((proj) => proj.projId === currentManageProjId);
    if (index >= 0) {
        await loadManageDist(index, currentManageProjId);
    }
}
async function loadManageGallery(index, id) {
    if (!projList[index]) {
        openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }
    currentManageProjId = id;
    goPage("manageGallery", false);
    loadManagePhotosList();
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
        projId: currentManageProjId,
        name: projName,
        display: reviewDisplay,
        status: reviewStatus,
        adminUid: uid,
        adminToken: token
    };
    const result = await postApiWithFile(url + "/api/proj/update_proj", param, fileInput);
    console.log(result);
    const msg = parseInt(result.message, 10);
    if (!result.result) {
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        showBubble(i18n.lookUp("modal_content_success")[0].message, 'blue', '#fff');
        await refreshManageProjectInfo();
    }
}
// Save Manage Distribution
async function saveManageDist() {
    const task = JSON.stringify(currentTaskList);
    const param = {
        projId: currentManageProjId,
        task: task,
        adminUid: uid,
        adminToken: token
    }
    const result = await postApi(url + "/api/proj/update_task", param);
    if (!result.result) {
        const msg = parseInt(result.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
    } else {
        showBubble(i18n.lookUp("modal_content_success")[0].message, 'blue', '#fff');
        await refreshManageProjectInfo();
    }
}

// Delete Project
async function deleteProj(id) {
    const confirm = await openModal(
        i18n.lookUp("modal_content_confirm")[1].title,
        i18n.lookUp("modal_content_confirm")[1].message,
        true
    );
    if (confirm) {
        const result = await postApi(url + "/api/proj/delete_proj", {
            projId: id,
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

// 通过file创建缩略图
async function createThumbnailFromFile(file, maxSize = 100) {
    const img = new Image();
    // 生成本地临时 URL，不会把图片转成 Base64
    const objectUrl = URL.createObjectURL(file);

    try {
        img.src = objectUrl;
        // 等待图片加载完成
        await img.decode();

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > height) {
            if (width > maxSize) {
                height = height * (maxSize / width);
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = width * (maxSize / height);
                height = maxSize;
            }
        }

        if (!width || !height) {
            throw new Error("图片宽高异常");
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 输出低分辨率图片
        return canvas.toDataURL("image/jpeg", 0.75);
    } finally {
        // 释放临时 URL
        URL.revokeObjectURL(objectUrl);
    }
}
// 添加图片后
async function photosPoolChange(files) {
    // 图片池
    const filePoolEl = document.getElementById("filePool");
    // 图片扩展名
    const imgExt = ["jpg", "png", "jpeg", "webp"];
    // 队列
    const queue = new Queue();

    [...files].forEach(file => {
        queue.add(async () => {
            // 分配uuid
            const uuid = generateUuid();
            const fileName = file.name;
            const fileExt = fileName.split(".").pop().toLowerCase();
            if (!imgExt.includes(fileExt)) {
                return;
            }

            const itemEl = document.createElement("div");
            itemEl.classList.add("item");
            // 创建图片预览
            const imgEl = document.createElement("img");

            try {
                // 创建缩略图
                imgEl.src = await createThumbnailFromFile(file);
                itemEl.appendChild(imgEl);

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
            } catch (e) {
                console.error("Failed to create thumbnail:", e);
            }
        });
    });
}
// 上传
async function uploadImages() {
    const filePoolEl = document.getElementById("filePool");
    const author = document.querySelector('#manageGallery input[name="input_author"]').value;
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

    const uuids = Object.keys(photosPool);
    const files = Object.values(photosPool);
    const queue = new Queue();
    let successCount = 0;

    // 添加完成事件
    queue.addFinalTask(() => {
        loadManagePhotosList();
        showBubble(i18n.lookUp("successful_rows") + successCount, "blue", "#fff");
    });
    // 添加任务
    for (let i = 0; i < files.length; i++) {
        const fileX = files[i];
        const uuid = uuids[i];

        queue.add(async () => {
            const progressBar = fileX.progressBar;
            const labelEl = fileX.labelEl
            let param = {
                projId: currentManageProjId,
                author: author,
                adminUid: uid,
                adminToken: token
            };

            progressBar.style.display = "block";
            labelEl.classList.remove(...labelEl.classList);
            labelEl.classList.add("label", "color_blue");
            labelEl.innerHTML = 'UPLOADING';

            const result = await postApiWithFileOnProgress(
                url + "/api/proj/upload_image",
                param,
                fileX.file,
                progressBar
            );
            if (!result.result) {
                const msg = result.message;
                showBubble(i18n.lookUp("modal_content_fail")[19].message, "red", "#fff");
                labelEl.classList.remove(...labelEl.classList);
                labelEl.classList.add("label", "color_red");
                labelEl.innerHTML = "FAIL";
            } else {
                labelEl.classList.remove(...labelEl.classList);
                labelEl.classList.add("label", "color_green");
                labelEl.innerHTML = "SUCCESS";
                delete photosPool[uuid];
                successCount += 1;
            }
        });
    }
}
// 清除
function cleanPhotosPool() {
    const filePoolEl = document.getElementById("filePool");
    filePoolEl.innerHTML = '';
    Object.keys(photosPool).forEach(key => delete photosPool[key]);
}

let managePhotosCurrentPage = 1;
let managePhotosPageSize = 10;
let managePhotosCurrentAuthor = null;

function reviewDataText(value, fallback = "-") {
    return value === undefined || value === null || value === "" ? fallback : String(value);
}

function getReviewTypeLabel(projectType) {
    return Number(projectType) === 1
        ? (i18n.lookUp("screening_review_type") || "筛片模式")
        : (i18n.lookUp("review_review_type") || "审片模式");
}

function getReviewEntries(data) {
    if (Number(data.project_type) === 1 && Array.isArray(data.value)) {
        return [{
            reviewer: data.value[0],
            score: data.value[1],
            comment: data.value[2]
        }];
    }

    if (data.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        return Object.entries(data.value).map(([reviewer, item]) => ({
            reviewer,
            score: Array.isArray(item) ? item[0] : "",
            comment: Array.isArray(item) ? item[1] : ""
        }));
    }

    return [];
}

function getReviewAverageScore(entries) {
    const scores = entries
        .map((entry) => Number(entry.score))
        .filter((score) => Number.isFinite(score));
    if (scores.length === 0) {
        return "-";
    }
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Number.isInteger(average) ? String(average) : average.toFixed(1);
}
function getReviewVarianceScore(entries) {
    const scores = entries
        .map((entry) => Number(entry.score))
        .filter((score) => Number.isFinite(score));
    if (scores.length === 0) {
        return "-";
    }
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDifferences = scores.map((score) => Math.pow(score - average, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / squaredDifferences.length;
    return Number.isInteger(variance) ? String(variance) : variance.toFixed(1);
}

function appendReviewDataMeta(parent, label, value) {
    const itemEl = document.createElement("div");
    itemEl.classList.add("review-data-meta-item");

    const labelEl = document.createElement("span");
    labelEl.classList.add("review-data-label");
    labelEl.textContent = label;
    itemEl.appendChild(labelEl);

    const valueEl = document.createElement("span");
    valueEl.classList.add("review-data-value");
    valueEl.textContent = reviewDataText(value);
    itemEl.appendChild(valueEl);

    parent.appendChild(itemEl);
}

function appendReviewStat(parent, label, value) {
    const statEl = document.createElement("div");
    statEl.classList.add("review-data-stat");

    const valueEl = document.createElement("strong");
    valueEl.textContent = reviewDataText(value);
    statEl.appendChild(valueEl);

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    statEl.appendChild(labelEl);

    parent.appendChild(statEl);
}

function createReviewCommentEl(comment) {
    const commentEl = document.createElement("div");
    commentEl.classList.add("review-data-comment");
    const normalizedComment = comment === undefined || comment === null ? "" : String(comment);
    if (normalizedComment === "") {
        commentEl.classList.add("review-data-empty-comment");
        commentEl.textContent = i18n.lookUp("no_note");
    } else {
        commentEl.textContent = normalizedComment;
    }
    return commentEl;
}

function appendReviewScoreRow(parent, entry) {
    const rowEl = document.createElement("div");
    rowEl.classList.add("review-data-review-card");

    const topEl = document.createElement("div");
    topEl.classList.add("review-data-review-top");

    const reviewerEl = document.createElement("div");
    reviewerEl.classList.add("review-data-reviewer");
    const reviewerLabelEl = document.createElement("span");
    reviewerLabelEl.textContent = "UID";
    reviewerEl.appendChild(reviewerLabelEl);
    const reviewerValueEl = document.createElement("strong");
    reviewerValueEl.textContent = reviewDataText(entry.reviewer);
    reviewerEl.appendChild(reviewerValueEl);
    topEl.appendChild(reviewerEl);

    const scoreEl = document.createElement("div");
    scoreEl.classList.add("review-data-score-pill");
    scoreEl.textContent = i18n.lookUp("score") + ": " + reviewDataText(entry.score);
    topEl.appendChild(scoreEl);

    rowEl.appendChild(topEl);
    rowEl.appendChild(createReviewCommentEl(entry.comment));
    parent.appendChild(rowEl);
}

function renderReviewDataModal(data) {
    const modal = document.getElementById("reviewDataModal");
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("reviewDataModalTitle");
    const bodyEl = document.getElementById("reviewDataModalBody");
    const closeBtnEl = document.getElementById("reviewDataCloseBtn");
    const confirmBtnEl = document.getElementById("reviewDataConfirmBtn");

    if (!modal || !overlay || !titleEl || !bodyEl || !closeBtnEl || !confirmBtnEl) {
        return;
    }

    const closeModal = () => {
        modal.classList.remove("active");
        modalNum--;
        if (modalNum === 0) {
            overlay.classList.remove("active");
        }
    }

    const entries = getReviewEntries(data);
    titleEl.textContent = "Preview";
    bodyEl.innerHTML = "";

    const shellEl = document.createElement("div");
    shellEl.classList.add("review-data-shell");

    const summaryEl = document.createElement("section");
    summaryEl.classList.add("review-data-summary");

    const summaryMainEl = document.createElement("div");
    summaryMainEl.classList.add("review-data-summary-main");

    const photoIdEl = document.createElement("div");
    photoIdEl.classList.add("review-data-photoid");
    photoIdEl.textContent = "Photoid " + reviewDataText(data.photoid);
    summaryMainEl.appendChild(photoIdEl);

    const nameEl = document.createElement("h4");
    nameEl.textContent = reviewDataText(data.name, "Unname");
    summaryMainEl.appendChild(nameEl);

    const authorEl = document.createElement("p");
    authorEl.textContent = reviewDataText(data.author);
    summaryMainEl.appendChild(authorEl);

    summaryEl.appendChild(summaryMainEl);

    const typeEl = document.createElement("div");
    typeEl.classList.add("review-data-type-badge");
    typeEl.textContent = getReviewTypeLabel(data.project_type);
    summaryEl.appendChild(typeEl);
    shellEl.appendChild(summaryEl);

    const statEl = document.createElement("section");
    statEl.classList.add("review-data-stats");
    appendReviewStat(statEl, i18n.lookUp("average"), getReviewAverageScore(entries));
    appendReviewStat(statEl, i18n.lookUp("variance"), getReviewVarianceScore(entries));
    shellEl.appendChild(statEl);

    const metaSectionEl = document.createElement("section");
    metaSectionEl.classList.add("review-data-section");
    const metaTitleEl = document.createElement("h5");
    metaTitleEl.textContent = i18n.lookUp("basic_info");
    metaSectionEl.appendChild(metaTitleEl);

    const metaEl = document.createElement("div");
    metaEl.classList.add("review-data-meta");
    appendReviewDataMeta(metaEl, "Photoid", data.photoid);
    appendReviewDataMeta(metaEl, i18n.lookUp("author"), data.author);
    appendReviewDataMeta(metaEl, i18n.lookUp("file_name"), data.name);
    appendReviewDataMeta(metaEl, i18n.lookUp("proj"), data.proj);
    appendReviewDataMeta(metaEl, i18n.lookUp("project_type"), getReviewTypeLabel(data.project_type));
    metaSectionEl.appendChild(metaEl);
    shellEl.appendChild(metaSectionEl);

    const reviewSectionEl = document.createElement("section");
    reviewSectionEl.classList.add("review-data-section");
    const reviewTitleEl = document.createElement("h5");
    reviewTitleEl.textContent = i18n.lookUp("scoring_details");
    reviewSectionEl.appendChild(reviewTitleEl);

    const listEl = document.createElement("div");
    listEl.classList.add("review-data-review-list");
    if (entries.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.classList.add("review-data-no-score");
        emptyEl.textContent = i18n.lookUp("score_empty");
        listEl.appendChild(emptyEl);
    } else {
        entries.forEach((entry) => appendReviewScoreRow(listEl, entry));
    }
    reviewSectionEl.appendChild(listEl);
    shellEl.appendChild(reviewSectionEl);

    bodyEl.appendChild(shellEl);

    closeBtnEl.onclick = closeModal;
    confirmBtnEl.onclick = closeModal;
    modal.classList.add("active");
    overlay.classList.add("active");
    modalNum++;
}
function createManagePhotoRow(photo, index) {
    const trEl = document.createElement("tr");
    trEl.setAttribute("data-photo-id", photo.id);
    trEl.setAttribute("data-photo-index", index);

    const photoIdTdEl = document.createElement("td");
    photoIdTdEl.innerHTML = `<label class="checkbox">
                    <input type="checkbox" name="input_manage_photo" value="${photo.id}"><span class="box"></span>${photo.id}
                </label>
                `;
    trEl.appendChild(photoIdTdEl);

    const thumbnailTdEl = document.createElement("td");
    const thumbnailImgEl = document.createElement("img");
    thumbnailImgEl.src = `/data/proj/${currentManageProjId}/thumbnail/${photo.name}`;
    thumbnailImgEl.style.cursor = "pointer";
    thumbnailImgEl.addEventListener("click", () => {
        go_url(`/data/proj/${currentManageProjId}/img/${photo.name}`, 1);
    });
    thumbnailTdEl.appendChild(thumbnailImgEl);
    trEl.appendChild(thumbnailTdEl);

    const authorTdEl = document.createElement("td");
    authorTdEl.innerHTML = photo.author;
    trEl.appendChild(authorTdEl);

    const actionTdEl = document.createElement("td");
    const actionGroupEl = document.createElement("div");
    actionGroupEl.classList.add("photo-actions");

    const previewBtnEl = document.createElement("span");
    previewBtnEl.classList.add("btn", "edit");
    previewBtnEl.title = "preview";
    previewBtnEl.innerHTML = `<i class="fa-solid fa-eye"></i>`;
    previewBtnEl.addEventListener("click", async () => {
        const result = await getApi(url + `/api/review/fetch_photo_data?adminUid=${uid}&adminToken=${token}&photoid=${photo.id}`);
        if (!result.result) {
            const msg = parseInt(result.message, 10);
            await openModal(
                i18n.lookUp("modal_content_fail")[msg]?.title || "Error",
                i18n.lookUp("modal_content_fail")[msg]?.message || result.message
            );
            return;
        }
        renderReviewDataModal(result.data || {});
    });
    actionGroupEl.appendChild(previewBtnEl);

    const delBtnEl = document.createElement("span");
    delBtnEl.classList.add("btn", "del");
    delBtnEl.title = i18n.lookUp("delete");
    delBtnEl.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    delBtnEl.addEventListener("click", async () => {
        const confirm = await openModal(
            i18n.lookUp("modal_content_confirm")[4].title,
            i18n.lookUp("modal_content_confirm")[4].message
        );
        if (confirm) {
            delPhoto(photo.id, trEl, index);
        }
    });
    actionGroupEl.appendChild(delBtnEl);
    actionTdEl.appendChild(actionGroupEl);
    trEl.appendChild(actionTdEl);

    return trEl;
}

function getManagePhotosPaginationItems(totalPages, currentPage) {
    const maxButtons = 17;
    if (totalPages <= maxButtons) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const edgePageCount = maxButtons - 1;
    const middlePageCount = maxButtons - 2;
    const middleHalf = Math.floor(middlePageCount / 2);

    if (currentPage <= middleHalf + 2) {
        return [
            ...Array.from({ length: edgePageCount }, (_, index) => index + 1),
            "ellipsis-right"
        ];
    }

    if (currentPage >= totalPages - middleHalf - 1) {
        return [
            "ellipsis-left",
            ...Array.from({ length: edgePageCount }, (_, index) => totalPages - edgePageCount + index + 1)
        ];
    }

    return [
        "ellipsis-left",
        ...Array.from({ length: middlePageCount }, (_, index) => currentPage - middleHalf + index),
        "ellipsis-right"
    ];
}

/**
 * 根据当前照片列表、页码和每页数量，渲染照片管理表格及分页控件。
 */
function renderManagePhotosPage() {
    // 获取照片表格、统计信息和分页区域所需的页面元素。
    const managePhotosTableBodyEl = document.getElementById("managePhotosTableBody");
    const photosTotalEl = document.getElementById("photosTotal");
    const paginationEl = document.getElementById("managePhotosPagination");
    const pageNumbersEl = document.getElementById("managePhotosPageNumbers");
    const prevBtnEl = document.getElementById("managePhotosPrevPage");
    const nextBtnEl = document.getElementById("managePhotosNextPage");
    const pageSizeSelectEl = document.getElementById("managePhotosPageSize");

    if (!managePhotosTableBodyEl || !photosTotalEl) {
        return;
    }

    // 清空旧表格内容，并同步照片总数和每页显示数量。
    managePhotosTableBodyEl.innerHTML = "";
    const length = currentManagePhotosList.length;
    photosTotalEl.innerHTML = String(length);

    if (pageSizeSelectEl) {
        pageSizeSelectEl.value = String(managePhotosPageSize);
    }

    // 列表为空时展示空状态，同时隐藏分页控件。
    if (length === 0) {
        const trEl = document.createElement("tr");
        const tdEl = document.createElement("td");
        tdEl.colSpan = 4;
        tdEl.innerHTML = i18n.lookUp("no_photo");
        trEl.appendChild(tdEl);
        managePhotosTableBodyEl.appendChild(trEl);
        if (paginationEl) {
            paginationEl.style.display = "none";
        }
        return;
    }

    // 计算分页范围并校正当前页，防止删除或切换数据后页码越界。
    const totalPages = Math.max(1, Math.ceil(length / managePhotosPageSize));
    managePhotosCurrentPage = Math.min(Math.max(1, managePhotosCurrentPage), totalPages);
    const start = (managePhotosCurrentPage - 1) * managePhotosPageSize;
    const end = Math.min(start + managePhotosPageSize, length);

    // 截取当前页数据并逐行渲染照片信息。
    currentManagePhotosList.slice(start, end).forEach((photo, offset) => {
        managePhotosTableBodyEl.appendChild(createManagePhotoRow(photo, start + offset));
    });

    // 分页元素不完整时保留已渲染的表格，不继续更新分页区域。
    if (!paginationEl || !pageNumbersEl || !prevBtnEl || !nextBtnEl) {
        return;
    }

    // 显示分页控件，并根据当前页更新上一页、下一页按钮状态。
    paginationEl.style.display = "flex";
    prevBtnEl.disabled = managePhotosCurrentPage === 1;
    nextBtnEl.disabled = managePhotosCurrentPage === totalPages;
    pageNumbersEl.innerHTML = "";

    // 创建页码或省略号按钮；点击具体页码后重新渲染对应页面。
    getManagePhotosPaginationItems(totalPages, managePhotosCurrentPage).forEach((page) => {
        const pageBtnEl = document.createElement("button");
        pageBtnEl.type = "button";
        pageBtnEl.classList.add("page-number");

        if (typeof page !== "number") {
            pageBtnEl.classList.add("page-ellipsis");
            pageBtnEl.disabled = true;
            pageBtnEl.innerHTML = "...";
            pageNumbersEl.appendChild(pageBtnEl);
            return;
        }

        if (page === managePhotosCurrentPage) {
            pageBtnEl.classList.add("active");
        }
        pageBtnEl.innerHTML = String(page);
        pageBtnEl.addEventListener("click", () => {
            managePhotosCurrentPage = page;
            renderManagePhotosPage();
        });
        pageNumbersEl.appendChild(pageBtnEl);
    });
}

/**
 * 初始化照片管理分页相关事件，确保同一组控件只绑定一次监听器。
 */
function initManagePhotosPagination() {
    const paginationEl = document.getElementById("managePhotosPagination");
    // 分页容器不存在或已经初始化时不重复绑定事件。
    if (!paginationEl || paginationEl.dataset.initialized === "true") {
        return;
    }
    paginationEl.dataset.initialized = "true";

    // 上一页：页码减一后重新渲染列表。
    document.getElementById("managePhotosPrevPage")?.addEventListener("click", () => {
        if (managePhotosCurrentPage > 1) {
            managePhotosCurrentPage -= 1;
            renderManagePhotosPage();
        }
    });
    // 下一页：未到末页时页码加一并重新渲染列表。
    document.getElementById("managePhotosNextPage")?.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(currentManagePhotosList.length / managePhotosPageSize));
        if (managePhotosCurrentPage < totalPages) {
            managePhotosCurrentPage += 1;
            renderManagePhotosPage();
        }
    });
    // 每页数量变更：更新分页大小，并从第一页重新渲染。
    document.getElementById("managePhotosPageSize")?.addEventListener("change", (event) => {
        managePhotosPageSize = Number(event.target.value) || 10;
        managePhotosCurrentPage = 1;
        renderManagePhotosPage();
    });
    // 刷新：保留当前作者筛选条件和页码，重新请求照片列表。
    document.getElementById("refreshManagePhotos")?.addEventListener("click", () => {
        loadManagePhotosList(managePhotosCurrentAuthor, managePhotosCurrentPage);
    });
}

/**
 * 按作者筛选条件加载当前项目的照片列表，并渲染指定页。
 * @param {string|null} author 作者筛选条件；null 表示不限制作者。
 * @param {number} page 数据加载成功后需要展示的页码。
 */
async function loadManagePhotosList(author = null, page = 1) {
    // 确保分页交互已初始化，并记录筛选条件供刷新操作复用。
    initManagePhotosPagination();
    managePhotosCurrentAuthor = author;
    // 接口使用空字符串表示不按作者筛选。
    if (author === null) {
        author = "";
    }
    // 请求当前项目中符合作者条件的全部照片。
    const result = await getApi(url + `/api/review/fetch_photo_list_all?projId=${currentManageProjId}&author=${author}&adminUid=${uid}&adminToken=${token}`);
    // 请求失败时展示接口对应的错误信息，并停止更新页面。
    if (!result.result) {
        const msg = parseInt(result.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
        return;
    }

    // 保存最新数据和目标页码，再统一渲染照片表格及分页控件。
    currentManagePhotosList = result.data || [];
    managePhotosCurrentPage = page || 1;
    renderManagePhotosPage();
}

// 删除单个照片
async function delPhoto(photoId, tr, index, isBatch = false) {
    const resultDel = await postApi(url + "/api/proj/delete_photo", {
        id: photoId,
        adminUid: uid,
        adminToken: token
    });
    if (!resultDel.result) {
        const msg = parseInt(resultDel.message, 10);
        showBubble(i18n.lookUp("modal_content_fail")[msg].message, "red", "#fff");
        return false;
    } else {
        if (!isBatch) {
            showBubble(i18n.lookUp("modal_content_success")[0].message, "blue", "#fff");
        }
        // 从数组中删除
        currentManagePhotosList.splice(index, 1);
        // 更新分页表格
        renderManagePhotosPage();
        return true;
    }
}
// 删除选中照片
async function deleteSelectedPhotos() {
    const arr = Array.from(document.querySelectorAll('input[name="input_manage_photo"]:checked'))
        .map(el => Number(el.value));
    const length = arr.length;
    if (length === 0) {
        return;
    }

    const confirm = await openModal(
        i18n.lookUp("modal_content_confirm")[4].title,
        i18n.lookUp("modal_content_confirm")[4].message
    );
    if (!confirm) {
        return;
    }

    const param = {
        ids: arr,
        adminUid: uid,
        adminToken: token
    }
    const result = await postApi(url + "/api/proj/delete_photos", param);
    if (!result.result) {
        const msg = parseInt(result.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        )
        return;
    }
    const affected = result.data;
    showBubble(i18n.lookUp("successful_rows") + affected, "blue", "#fff");
    const authorInputEl = document.querySelector('#manageGallery input[name="input_author_manage_photos"]');
    let author = authorInputEl.value.trim();
    if (!author || author === "") {
        author = null;
    }
    await loadManagePhotosList(author);
}

// 筛选
function filterManagePhotos() {
    const authorInputEl = document.querySelector('#manageGallery input[name="input_author_manage_photos"]');
    let author = authorInputEl.value.trim();
    if (!author || author === "") {
        author = null;
    }
    loadManagePhotosList(author);
}
