let currentPreliminaryResult = null;
let currentRecheckPhotos = [];
let currentResultPhotos = [];
let disputePhotosCurrentPage = 1;
let disputePhotosPageSize = 10;

async function loadViewResults(index, id, updateHistory = true) {
    if (!projList[index]) {
        await openModal(
            i18n.lookUp("modal_content_fail")[0].title,
            i18n.lookUp("modal_content_fail")[0].message
        );
        return;
    }

    currentManageProjId = id;
    goPage("viewResults", updateHistory);
    resetPreliminaryResultView();

    const cached = readPreliminaryResultCache(id);
    if (!cached) {
        return;
    }

    currentPreliminaryResult = cached;
    renderPreliminaryResult(cached);
    await refreshRecheckList(false);
}

function resultCacheKey(projId) {
    return "preliminaryResult-" + projId;
}

function readPreliminaryResultCache(projId) {
    try {
        const raw = localStorage.getItem(resultCacheKey(projId));
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.projectId !== projId || !Array.isArray(parsed.disputePhotos)) {
            return null;
        }
        return parsed;
    } catch (error) {
        console.error("Failed to read preliminary result cache:", error);
        return null;
    }
}

function resetPreliminaryResultView() {
    currentPreliminaryResult = null;
    currentRecheckPhotos = [];
    currentResultPhotos = [];
    disputePhotosCurrentPage = 1;

    [
        "resultProjectName",
        "resultScoredTotal",
        "resultDisputeCount",
        "resultDisputeRate",
        "resultPreliminaryAverage",
        "resultPreliminaryVariance"
    ].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = "--";
        }
    });

    const timeEl = document.getElementById("preliminaryResultTime");
    if (timeEl) {
        timeEl.dataset.i18n = "not_fetched";
        timeEl.textContent = i18n.lookUp("not_fetched");
    }
    renderDisputePhotosPage();
}

function formatResultDecimal(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(1) : "--";
}

function renderPreliminaryResult(data) {
    const values = {
        resultProjectName: data.projectName ?? "--",
        resultScoredTotal: Number.isFinite(Number(data.scoredTotal)) ? String(data.scoredTotal) : "--",
        resultDisputeCount: Number.isFinite(Number(data.disputeCount)) ? String(data.disputeCount) : "--",
        resultDisputeRate: formatResultDecimal(data.disputeRate) + "%",
        resultPreliminaryAverage: formatResultDecimal(data.preliminaryAverage),
        resultPreliminaryVariance: formatResultDecimal(data.preliminaryVariance)
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    const timeEl = document.getElementById("preliminaryResultTime");
    if (timeEl) {
        const date = new Date(data.time);
        if (data.time && !Number.isNaN(date.getTime())) {
            delete timeEl.dataset.i18n;
            timeEl.textContent = date.toLocaleString();
        } else {
            timeEl.dataset.i18n = "not_fetched";
            timeEl.textContent = i18n.lookUp("not_fetched");
        }
    }

    mergeResultPhotos();
}

function getResultApiError(result) {
    const code = parseInt(result.message, 10);
    const failures = i18n.lookUp("modal_content_fail");
    const fallback = {
        title: i18n.lookUp("error"),
        message: result.message || i18n.lookUp("load_failed_retry")
    };
    return Array.isArray(failures) && failures[code] ? failures[code] : fallback;
}

async function fetchPreliminaryResult() {
    if (!currentManageProjId) {
        return;
    }

    const result = await getApi(
        url + "/api/result/preliminary?projId=" + encodeURIComponent(currentManageProjId)
        + "&adminUid=" + uid + "&adminToken=" + encodeURIComponent(token)
    );
    if (!result.result) {
        const error = getResultApiError(result);
        await openModal(error.title, error.message);
        return;
    }

    const data = {
        ...(result.data || {}),
        time: new Date().toISOString()
    };
    try {
        localStorage.setItem(resultCacheKey(currentManageProjId), JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save preliminary result cache:", error);
    }

    currentPreliminaryResult = data;
    renderPreliminaryResult(data);
    await refreshRecheckList(false);
    showBubble(i18n.lookUp("results_fetched"), "blue", "#fff");
}

async function refreshRecheckList(showError = true) {
    if (!currentManageProjId) {
        return;
    }

    const result = await getApi(
        url + "/api/proj/get_recheck_list?projId=" + encodeURIComponent(currentManageProjId)
        + "&adminUid=" + uid + "&adminToken=" + encodeURIComponent(token)
    );
    if (!result.result) {
        if (showError) {
            const error = getResultApiError(result);
            await openModal(error.title, error.message);
        }
        return;
    }
    currentRecheckPhotos = Array.isArray(result.data) ? result.data : [];
    mergeResultPhotos();
}

function mergeResultPhotos() {
    const merged = new Map();
    const disputePhotos = currentPreliminaryResult?.disputePhotos || [];

    disputePhotos.forEach((photo) => {
        const photoId = Number(photo.photoid);
        if (Number.isInteger(photoId)) {
            merged.set(photoId, {...photo, photoid: photoId, recheck: false});
        }
    });

    currentRecheckPhotos.forEach((photo) => {
        const photoId = Number(photo.photoid);
        if (!Number.isInteger(photoId)) {
            return;
        }
        merged.set(photoId, {
            ...(merged.get(photoId) || {}),
            ...photo,
            photoid: photoId,
            recheck: true
        });
    });

    currentResultPhotos = Array.from(merged.values()).sort((left, right) => {
        if (left.recheck !== right.recheck) {
            return left.recheck ? -1 : 1;
        }
        return left.photoid - right.photoid;
    });
    renderDisputePhotosPage();
}

function createDisputePhotoRow(photo) {
    const row = document.createElement("tr");
    row.dataset.photoId = String(photo.photoid);

    const idCell = document.createElement("td");
    idCell.textContent = String(photo.photoid);
    row.appendChild(idCell);

    const thumbnailCell = document.createElement("td");
    if (photo.name) {
        const image = document.createElement("img");
        image.src = "/data/proj/" + currentManageProjId + "/thumbnail/" + encodeURIComponent(photo.name);
        image.alt = i18n.lookUp("thumbnail");
        image.style.cursor = "pointer";
        image.addEventListener("click", () => {
            go_url("/data/proj/" + currentManageProjId + "/img/" + encodeURIComponent(photo.name), 1);
        });
        thumbnailCell.appendChild(image);
    } else {
        thumbnailCell.textContent = "--";
    }
    row.appendChild(thumbnailCell);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    const statusKey = photo.recheck ? "rechecking" : "disputed";
    status.classList.add("tag", photo.recheck ? "color_purple" : "color_orange");
    status.dataset.i18n = statusKey;
    status.textContent = i18n.lookUp(statusKey);
    statusCell.appendChild(status);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    actionGroup.classList.add("photo-actions");

    const toggleButton = document.createElement("span");
    const toggleKey = photo.recheck ? "remove_from_recheck" : "include_in_recheck";
    toggleButton.classList.add("btn", photo.recheck ? "del" : "edit");
    toggleButton.dataset.i18nTitle = toggleKey;
    toggleButton.title = i18n.lookUp(toggleKey);
    toggleButton.innerHTML = photo.recheck
        ? '<i class="fa-solid fa-circle-minus"></i>'
        : '<i class="fa-solid fa-circle-plus"></i>';
    toggleButton.addEventListener("click", async () => {
        toggleButton.style.pointerEvents = "none";
        try {
            await setPhotoRecheck(photo, !photo.recheck);
        } finally {
            toggleButton.style.pointerEvents = "";
        }
    });
    actionGroup.appendChild(toggleButton);

    const previewButton = document.createElement("span");
    previewButton.classList.add("btn", "edit");
    previewButton.dataset.i18nTitle = "preview";
    previewButton.title = i18n.lookUp("preview");
    previewButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    previewButton.addEventListener("click", () => previewPhotoReviewData(photo.photoid));
    actionGroup.appendChild(previewButton);

    actionCell.appendChild(actionGroup);
    row.appendChild(actionCell);
    return row;
}

async function setPhotoRecheck(photo, recheck) {
    const result = await postApi(url + "/api/proj/set_recheck", {
        photoid: photo.photoid,
        projId: currentManageProjId,
        recheck,
        adminUid: uid,
        adminToken: token
    });
    if (!result.result) {
        const error = getResultApiError(result);
        await openModal(error.title, error.message);
        return;
    }
    await refreshRecheckList(false);
    showBubble(i18n.lookUp("recheck_updated"), "blue", "#fff");
}

function renderDisputePhotosPage() {
    const body = document.getElementById("disputePhotosTableBody");
    const pagination = document.getElementById("disputePhotosPagination");
    const pageNumbers = document.getElementById("disputePhotosPageNumbers");
    const prevButton = document.getElementById("disputePhotosPrevPage");
    const nextButton = document.getElementById("disputePhotosNextPage");
    const pageSizeSelect = document.getElementById("disputePhotosPageSize");
    if (!body) {
        return;
    }

    body.innerHTML = "";
    if (currentResultPhotos.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.dataset.i18n = currentPreliminaryResult ? "no_dispute_photos" : "no_result_data";
        cell.textContent = i18n.lookUp(cell.dataset.i18n);
        row.appendChild(cell);
        body.appendChild(row);
        if (pagination) {
            pagination.style.display = "none";
        }
        return;
    }

    const totalPages = Math.max(1, Math.ceil(currentResultPhotos.length / disputePhotosPageSize));
    disputePhotosCurrentPage = Math.min(Math.max(1, disputePhotosCurrentPage), totalPages);
    const start = (disputePhotosCurrentPage - 1) * disputePhotosPageSize;
    currentResultPhotos
        .slice(start, start + disputePhotosPageSize)
        .forEach((photo) => body.appendChild(createDisputePhotoRow(photo)));

    if (!pagination || !pageNumbers || !prevButton || !nextButton) {
        return;
    }
    pagination.style.display = "flex";
    prevButton.disabled = disputePhotosCurrentPage === 1;
    nextButton.disabled = disputePhotosCurrentPage === totalPages;
    pageNumbers.innerHTML = "";
    if (pageSizeSelect) {
        pageSizeSelect.value = String(disputePhotosPageSize);
    }

    getManagePhotosPaginationItems(totalPages, disputePhotosCurrentPage).forEach((page) => {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("page-number");
        if (typeof page !== "number") {
            button.classList.add("page-ellipsis");
            button.disabled = true;
            button.textContent = "...";
        } else {
            button.textContent = String(page);
            if (page === disputePhotosCurrentPage) {
                button.classList.add("active");
            }
            button.addEventListener("click", () => {
                disputePhotosCurrentPage = page;
                renderDisputePhotosPage();
            });
        }
        pageNumbers.appendChild(button);
    });
}

function initDisputePhotosPagination() {
    const pagination = document.getElementById("disputePhotosPagination");
    if (!pagination || pagination.dataset.initialized === "true") {
        return;
    }
    pagination.dataset.initialized = "true";
    document.getElementById("disputePhotosPrevPage")?.addEventListener("click", () => {
        if (disputePhotosCurrentPage > 1) {
            disputePhotosCurrentPage -= 1;
            renderDisputePhotosPage();
        }
    });
    document.getElementById("disputePhotosNextPage")?.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(currentResultPhotos.length / disputePhotosPageSize));
        if (disputePhotosCurrentPage < totalPages) {
            disputePhotosCurrentPage += 1;
            renderDisputePhotosPage();
        }
    });
    document.getElementById("disputePhotosPageSize")?.addEventListener("change", (event) => {
        disputePhotosPageSize = Number(event.target.value) || 10;
        disputePhotosCurrentPage = 1;
        renderDisputePhotosPage();
    });

}