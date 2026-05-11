async function loadManageUserList() {
    const result = await getApi(url + `/api/user/get_user_list_admin?adminUid=${uid}&adminToken=${token}`);
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
        emptyTr.innerHTML = `<td colspan="4">${i18n.lookUp("no_user")}</td>`;
        tbody.appendChild(emptyTr);
        return;
    }

    result.data.forEach((user) => {
        const tr = document.createElement("tr");
        const operationTd = document.createElement("td");
        operationTd.classList.add("manage-user-actions");
        operationTd.innerHTML = `
            <button class="button-common user-op-btn" data-op="reset" data-uid="${user.uid}">${i18n.lookUp("reset_password_default")}</button>
            ${user.status === 2
            ? `<button class="button-common user-op-btn" data-op="unban" data-uid="${user.uid}">${i18n.lookUp("unban_user")}</button>`
            : `<button class="button-common user-op-btn" data-op="ban" data-uid="${user.uid}">${i18n.lookUp("ban_user")}</button>`
        }
            <button class="button-common user-op-btn del" data-op="delete" data-uid="${user.uid}">${i18n.lookUp("delete")}</button>
        `;
        tr.innerHTML = `
            <td>${user.uid}</td>
            <td>${user.allname}</td>
            <td>${getUserStatusText(user.status)}</td>
        `;
        tr.appendChild(operationTd);
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".user-op-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const targetUid = parseInt(btn.getAttribute("data-uid"), 10);
            const op = btn.getAttribute("data-op");
            if (op === "reset") {
                await resetUserPassword(targetUid);
                return;
            }
            if (op === "ban") {
                await banUser(targetUid);
                return;
            }
            if (op === "unban") {
                await unbanUser(targetUid);
                return;
            }
            if (op === "delete") {
                await deleteUser(targetUid);
            }
        });
    });
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
    const result = await postApi(url + "/api/user/register", {
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
async function resetUserPassword(targetUid = getManageUserUid()) {
    if (!targetUid) {
        return;
    }
    const result = await postApi(url + "/api/user/reset_password", {
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
async function banUser(targetUid = getManageUserUid()) {
    if (!targetUid) {
        return;
    }
    const result = await postApi(url + "/api/user/ban_user", {
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
async function unbanUser(targetUid = getManageUserUid()) {
    if (!targetUid) {
        return;
    }
    const result = await postApi(url + "/api/user/unban_user", {
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
async function deleteUser(targetUid = getManageUserUid()) {
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

    const result = await postApi(url + "/api/user/delete_user", {
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