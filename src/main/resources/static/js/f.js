(async () => {
    // 获取origin
    const baseUrl = window.location.origin;
    // 获取网页config
    const config = await getApi(baseUrl + "/api/system/get_website_info");
    // 添加进local
    localStorage.setItem("website_info", JSON.stringify(config.data));
})()