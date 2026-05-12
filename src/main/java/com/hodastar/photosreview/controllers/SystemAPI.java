package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.config.Config;
import com.hodastar.photosreview.mappers.SystemMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.Respond;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemAPI {

    private final SystemMapper systemMapper;
    private final Config config;
    private final UserMapper userMapper;

    public SystemAPI(SystemMapper systemMapper, Config config, UserMapper userMapper) {
        this.systemMapper = systemMapper;
        this.config = config;
        this.userMapper = userMapper;
    }

    @RequestMapping("/get_website_info")
    public Respond<Map<String, Object>> getWebsiteInfo() {
        Map<String, Object> data = new HashMap<>();
        data.put("website_name", systemMapper.getWebsiteName());
        data.put("website_icon", systemMapper.getWebsiteIcon());
        return new Respond<>(true, "true", data);
    }

    @PostMapping("/update_website_info")
    public Respond<String> updateWebsiteInfo(@RequestBody HashMap<String, Object> body) {
        if (!body.containsKey("adminUid") || !body.containsKey("adminToken") ||
                !body.containsKey("websiteName") || !body.containsKey("websiteIcon")) {
            return new Respond<>(false, "1", null);
        }
        if (!(body.get("adminUid") instanceof Integer) ||
                !(body.get("adminToken") instanceof String) ||
                !(body.get("websiteName") instanceof String) ||
                !(body.get("websiteIcon") instanceof String)) {
            return new Respond<>(false, "1", null);
        }

        int adminUid = (Integer) body.get("adminUid");
        String adminToken = (String) body.get("adminToken");
        String websiteName = ((String) body.get("websiteName")).trim();
        String websiteIcon = ((String) body.get("websiteIcon")).trim();

        if (!userMapper.checkAdmin(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }
        if (websiteName.isBlank() || websiteIcon.isBlank()) {
            return new Respond<>(false, "1", null);
        }

        boolean resultName = systemMapper.updateWebsiteName(websiteName);
        boolean resultIcon = systemMapper.updateWebsiteIcon(websiteIcon);
        if (!resultName || !resultIcon) {
            return new Respond<>(false, "0", null);
        }
        return new Respond<>(true, "success", null);
    }
}
