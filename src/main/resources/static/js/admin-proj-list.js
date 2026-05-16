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
        getProj();
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
        getProj();
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

    const limit = 3; // 限制同时上传的数量
    const uuids = Object.keys(photosPool);
    const queue = Object.values(photosPool);
    let index = 0;
    let successCount = 0;

    const f = async (fileX, uuid) => {
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

    }

    const runNext = () => {
        if (index < queue.length) {
            const fileX = queue[index];
            const uuid = uuids[index];
            index++;
            f(fileX, uuid)
                .then(runNext);
        } else {
            loadManagePhotosList();
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

async function loadManagePhotosList(author = null, loading = 1) {
    if (author === null) {
        author = "";
    }
    const result = await getApi(url + `/api/review/fetch_photo_list_all?projId=${currentManageProjId}&author=${author}&adminUid=${uid}&adminToken=${token}`);
    if (!result.result) {
        const msg = parseInt(result.message, 10);
        await openModal(
            i18n.lookUp("modal_content_fail")[msg].title,
            i18n.lookUp("modal_content_fail")[msg].message
        );
        return;
    }

    const managePhotosTableBodyEl = document.getElementById("managePhotosTableBody");
    const photosTotalEl = document.getElementById("photosTotal");
    managePhotosTableBodyEl.innerHTML = "";
    if (!result.data || result.data.length === 0) {
        const trEl = document.createElement("tr");
        const tdEl = document.createElement("td");
        tdEl.colSpan = 4;
        tdEl.innerHTML = i18n.lookUp("no_photo");
        trEl.appendChild(tdEl);
        managePhotosTableBodyEl.appendChild(trEl);
        photosTotalEl.innerHTML = "0";
        return;
    }

    currentManagePhotosList = [];
    currentManagePhotosList = result.data;
    let page = 0;
    const pageSize = 10;

    // 加载按钮
    const addLoadBtn = () => {
        const loadMoreTrEl = document.createElement("tr");
        const loadMoreTdEl = document.createElement("td");
        loadMoreTdEl.colSpan = 4;
        const loadMoreBtnEl = document.createElement("button");
        loadMoreBtnEl.id = "loadMorePhotos";
        loadMoreBtnEl.classList.add("button-common");
        loadMoreBtnEl.innerHTML = i18n.lookUp("load_more");
        loadMoreBtnEl.addEventListener("click", () => {
            load(loadMoreTrEl);
        });
        loadMoreTdEl.appendChild(loadMoreBtnEl);
        loadMoreTrEl.appendChild(loadMoreTdEl);
        managePhotosTableBodyEl.appendChild(loadMoreTrEl);
    }

    // 加载更多
    const load = (btn) => {
        const newPage = page + 1;
        const length = currentManagePhotosList.length;
        photosTotalEl.innerHTML = String(length);
        const start = (newPage - 1) * pageSize;
        const end = Math.min(start + pageSize, length);
        // 新一页超过总长度
        if (start >= length) {
            showBubble(i18n.lookUp("no_more"), "red", "#fff");
            return;
        }
        page = newPage;
        if (btn != null) {
            btn.remove();
        }
        currentManagePhotosList.forEach((photo, index) => {
            if (start <= index && index < end) {
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
                actionTdEl.appendChild(delBtnEl);
                trEl.appendChild(actionTdEl);

                managePhotosTableBodyEl.appendChild(trEl);
            }
        });

        addLoadBtn();
    }

    for (let i = 0; i < loading; i++) {
        load(null);
    }
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
        tr.remove();
        // 从数组中删除
        currentManagePhotosList.splice(index, 1);
        // 更新页面
        const photosTotalEl = document.getElementById("photosTotal");
        photosTotalEl.innerHTML = String(currentManagePhotosList.length);
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

    let affected = 0;
    for (let i = 0; i < length; i++) {
        const id = arr[i];
        const el = document.querySelector(`tr[data-photo-id="${id}"]`);
        const index = Number(el.getAttribute("data-photo-index"));
        const result = await delPhoto(id, el, index, true);
        if (result) {
            affected += 1;
        }
    }
    showBubble(i18n.lookUp("successful_rows") + affected, "blue", "#fff");
}

function filterManagePhotos() {
    const authorInputEl = document.querySelector('#manageGallery input[name="input_author_manage_photos"]');
    let author = authorInputEl.value.trim();
    if (!author || author === "") {
        author = null;
    }
    loadManagePhotosList(author);
}
