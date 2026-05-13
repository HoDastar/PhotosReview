let allProgressInited = false;

function renderProgressList(containerId, rows) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (!rows || rows.length === 0) {
        container.innerHTML = `<div class="progress-failed">${i18n.lookUp('no_user')}</div>`;
        return;
    }
    rows.forEach(item => {
        const all = Number(item.all || 0);
        const read = Number(item.read || 0);
        const remaining = Number(item.remaining || (all - read));
        const percent = all > 0 ? Math.max(0, Math.min(100, Math.round((read / all) * 100))) : 0;
        const done = remaining <= 0 && all > 0;

        const row = document.createElement('div');
        row.className = 'progress-row';
        row.innerHTML = `
            <div>
                <div class="progress-user-name">${item.allname || item.uid}</div>
                <div class="progress-user-uid">UID: ${item.uid}</div>
            </div>
            <div class="progress-right">
                ${done ? `<div class="progress-done"><i class="fa-solid fa-check"></i> ${i18n.lookUp('completed')}</div>` : `
                    <div class="progress-bar"><div class="progress-bar-inner" style="width:${percent}%"></div></div>
                    <div>${remaining}/${all}</div>
                `}
            </div>
        `;
        container.appendChild(row);
    });
}

async function loadAllProgress(silentFail = false) {
    const res = await getApi(url + `/api/proj/get_proj_progress_all?adminUid=${uid}&adminToken=${token}`);
    if (!res || !res.result) {
        document.getElementById('allUserProgressList').innerHTML = `<div class="progress-failed">${i18n.lookUp('load_failed_retry')}</div>`;
        if (!silentFail && res && res.message !== '28') {
            // no modal per requirement
        }
        return;
    }
    renderProgressList('allUserProgressList', res.data || []);
}

async function queryProjProgress() {
    const projName = document.getElementById('progressProjName').value.trim();
    if (!projName) {
        document.getElementById('singleProjProgressList').innerHTML = `<div class="progress-failed">${i18n.lookUp('load_failed_retry')}</div>`;
        return;
    }
    const projRes = await getApi(url + `/api/proj/get_proj_by_name?name=${encodeURIComponent(projName)}&adminUid=${uid}&adminToken=${token}`);
    if (!projRes || !projRes.result || !projRes.data || !projRes.data.projId) {
        document.getElementById('singleProjProgressList').innerHTML = `<div class="progress-failed">${i18n.lookUp('load_failed_retry')}</div>`;
        return;
    }
    const res = await getApi(url + `/api/proj/get_proj_progress?proj=${projRes.data.projId}&adminUid=${uid}&adminToken=${token}`);
    if (!res || !res.result) {
        document.getElementById('singleProjProgressList').innerHTML = `<div class="progress-failed">${i18n.lookUp('load_failed_retry')}</div>`;
        return;
    }

    const users = await getApi(url + `/api/user/get_user_list_admin?adminUid=${uid}&adminToken=${token}`);
    const nameMap = {};
    if (users && users.result) {
        (users.data || []).forEach(u => nameMap[String(u.uid)] = u.allname);
    }
    const data = (res.data || []).map(x => ({...x, allname: nameMap[String(x.uid)] || x.uid}));
    renderProgressList('singleProjProgressList', data);
}

function initProgressPage() {
    document.getElementById('refreshAllProgress').addEventListener('click', () => loadAllProgress(false));
    document.getElementById('queryProjProgress').addEventListener('click', queryProjProgress);
    document.getElementById('clearProjProgress').addEventListener('click', () => {
        document.getElementById('progressProjName').value = '';
        document.getElementById('singleProjProgressList').innerHTML = '';
    });

    if (!allProgressInited) {
        allProgressInited = true;
        loadAllProgress(true);
    }
}
