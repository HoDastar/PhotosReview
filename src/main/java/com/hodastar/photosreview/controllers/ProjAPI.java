package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.ProjMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.Respond;
import com.hodastar.photosreview.utils.Utilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/proj")
public class ProjAPI {
    private final UserMapper userMapper;
    private final ProjMapper projMapper;
    private static final Logger log =
            LoggerFactory.getLogger(ProjAPI.class);

    public ProjAPI(ProjMapper projMapper, UserMapper userMapper) {
        this.projMapper = projMapper;
        this.userMapper = userMapper;
    }

    // 获取工程列表
    @GetMapping("/get_proj_list")
    public Respond<List<HashMap<String, Object>>> get_proj_list() {
        List<EntityReviewProj> projListOrigin = projMapper.getProjList();
        List<HashMap<String, Object>> projList = projListOrigin.stream()
                .filter(proj -> proj.display == 1)
                .map(proj -> {
                    HashMap<String, Object> map = new HashMap<>();
                    map.put("proj_name", proj.name);
                    map.put("proj_type", proj.type);
                    map.put("proj_status", proj.status);
                    map.put("proj_thumbnail", proj.thumbnail);
                    map.put("proj_time", proj.time);
                    return map;
                }).toList();
        return new Respond<>(true, "success", projList);
    }

    // 获取工程列表Admin
    @GetMapping("/get_proj_list_admin")
    public Respond<List<EntityReviewProj>> get_proj_list_admin(
            @RequestParam("adminUid") int adminUid,
            @RequestParam("adminToken") String adminToken
    ) {
        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }

        // 获取工程
        List<EntityReviewProj> projList = projMapper.getProjList();
        return new Respond<>(true, "success", projList);
    }

    // 获取工程总量
    @GetMapping("/get_proj_count")
    public Respond<Integer> get_proj_count(
            @RequestParam("proj_name") String projName,
            @RequestParam("adminUid") int adminUid,
            @RequestParam("adminToken") String adminToken
    ) {
        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }
        Integer count = projMapper.getProjDataCount(projName);
        return new Respond<>(true, "success", count);
    }

    /**
     * 新建工程
     * param name 工程名称
     * param type 工程类型
     * param thumbnails 工程缩略图
     * return 新建结果
     */
    @PostMapping("create_proj")
    public Respond<String> create_proj(
            @RequestParam("file") MultipartFile iconFile,
            @RequestParam("json") String json
    ) throws Exception {
        // json转换
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.readValue(json, Map.class);

        // 检查参数
        if (
                !map.containsKey("name") ||
                        !map.containsKey("type") ||
                        !map.containsKey("adminUid") ||
                        !map.containsKey("adminToken")
        ) {
            return new Respond<>(false, "1", null);
        }
        if (
                !(map.get("name") instanceof String) ||
                        !(map.get("type") instanceof Integer) ||
                        !(map.get("adminUid") instanceof Integer) ||
                        !(map.get("adminToken") instanceof String)
        ) {
            return new Respond<>(false, "1", null);
        }
        if (iconFile == null || iconFile.isEmpty()) {
            return new Respond<>(false, "1", null);
        }

        String name = (String) map.get("name");
        int type = (Integer) map.get("type");
        int adminUid = (Integer) map.get("adminUid");
        String adminToken = (String) map.get("adminToken");

        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }

        // check name length
        if (name.length() > 255 || name.isEmpty()) {
            return new Respond<>(false, "6", null);
        }
        // check type
        if (type < 0 || type > 1) {
            return new Respond<>(false, "1", null);
        }
        // check name duplicate
        if (projMapper.isProjNameExist(name)) {
            return new Respond<>(false, "13", null);
        }

        // Generous a uuid
        String uuid = Utilities.generateUUID();

        // dir
        //String dirStr = "data/proj/" + name + "/icon/";
        String baseDir = System.getProperty("user.dir");
        String dirStr = baseDir + File.separator +
                "data" + File.separator +
                "proj" + File.separator +
                name + File.separator +
                "icon" + File.separator;

        // gain file name extension
        String extension = Utilities.getFileExtension(iconFile.getOriginalFilename());
        // check file extension
        if (extension.isEmpty() || Utilities.isValidImg(extension)) {
            return new Respond<>(false, "8", null);
        }

        // check file size (max 10MB)
        if (iconFile.getSize() > 10 * 1024 * 1024) {
            return new Respond<>(false, "9", null);
        }

        // Save
        String fileName = uuid + "." + extension;
        Utilities.saveMultipartFile(iconFile, dirStr, fileName);

        // 数据库
        Boolean result = projMapper.createProj(name, type, fileName);
        if (!result) {
            return new Respond<>(false, "0", null);
        }

        return new Respond<>(true, "success", null);
    }

    // 删除工程
    @PostMapping("/delete_proj")
    public Respond<String> delete_proj(@RequestBody HashMap<String, Object> body) {
        // 检查参数
        if (!body.containsKey("projName") || !body.containsKey("adminUid") || !body.containsKey("adminToken")) {
            return new Respond<>(false, "1", null);
        }
        if (!(body.get("projName") instanceof String) || !(body.get("adminUid") instanceof Integer) || !(body.get("adminToken") instanceof String)) {
            return new Respond<>(false, "1", null);
        }

        String projName = (String) body.get("projName");
        int adminUid = (Integer) body.get("adminUid");
        String adminToken = (String) body.get("adminToken");

        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }

        // 删除工程
        Boolean result = projMapper.deleteProj(projName);
        if (!result) {
            return new Respond<>(false, "0", null);
        }

        return new Respond<>(true, "success", null);
    }

    /**
     * 修改工程
     * param id 工程ID
     * param name 工程名称
     * param thumbnail 工程缩略图
     * param status 工程状态
     * param display 工程是否显示
     * return 修改结果
     */
    @PostMapping("/update_proj")
    public Respond<String> update_proj(
            @RequestParam(value = "file", required = false) MultipartFile iconFile,
            @RequestParam("json") String json
    ) {
        // json转换
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.readValue(json, Map.class);

        // 检查参数
        if (
                !map.containsKey("id") ||
                        !map.containsKey("adminUid") ||
                        !map.containsKey("adminToken")
        ) {
            return new Respond<>(false, "1", null);
        }
        if (
                !(map.get("id") instanceof Integer) ||
                        !(map.get("adminUid") instanceof Integer) ||
                        !(map.get("adminToken") instanceof String)
        ) {
            return new Respond<>(false, "1", null);
        }

        int id = (Integer) map.get("id");
        int adminUid = (Integer) map.get("adminUid");
        String adminToken = (String) map.get("adminToken");

        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }

        String name = null;
        String thumbnail = null;
        int display = 0;
        int status = 0;
        Boolean isChangeImg = false;
        Boolean isChangeName = false;
        String baseDir = System.getProperty("user.dir");

        // 获取原工程信息
        Optional<EntityReviewProj> projOpt = projMapper.getProjById(id);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }

        name = projOpt.get().name;
        String oldName = projOpt.get().name;
        thumbnail = projOpt.get().thumbnail;
        display = projOpt.get().display;
        status = projOpt.get().status;

        if (map.containsKey("name")) {
            String mName = (String) map.get("name");
            if (mName.length() > 255 || mName.isEmpty()) {
                return new Respond<>(false, "6", null);
            }
            if (!mName.equals(name)) {
                if (projMapper.isProjNameExist(mName)) {
                    return new Respond<>(false, "13", null);
                }
                isChangeName = true;
            }
            name = mName;
        }
        if (iconFile != null && !iconFile.isEmpty()) {
            isChangeImg = true;

            // gain file name extension
            String extension = Utilities.getFileExtension(iconFile.getOriginalFilename());
            // check file extension
            if (extension == null || extension.isEmpty()) {
                return new Respond<>(false, "8", null);
            }
            // check file extension (only allow jpg/jpeg/png/webp)
            if (!extension.equalsIgnoreCase("jpg") && !extension.equalsIgnoreCase("jpeg") && !extension.equalsIgnoreCase("png") && !extension.equalsIgnoreCase("webp")) {
                return new Respond<>(false, "8", null);
            }
            // check file size (max 10MB)
            if (iconFile.getSize() > 10 * 1024 * 1024) {
                return new Respond<>(false, "9", null);
            }

            // new file name
            String uuid = Utilities.generateUUID();
            thumbnail = uuid + "." + extension;
        }
        if (map.containsKey("display")) {
            if (!(map.get("display") instanceof Integer)) {
                return new Respond<>(false, "1", null);
            }
            int mDisplay = (Integer) map.get("display");
            if (mDisplay != 0 && mDisplay != 1) {
                return new Respond<>(false, "1", null);
            }
            display = mDisplay;
        }
        if (map.containsKey("status")) {
            if (!(map.get("status") instanceof Integer)) {
                return new Respond<>(false, "1", null);
            }
            int mStatus = (Integer) map.get("status");
            if (mStatus < 0 || mStatus > 3) {
                return new Respond<>(false, "1", null);
            }
            status = mStatus;
        }

        // 数据库
        Boolean result = projMapper.updateProj(id, name, thumbnail, status, display);
        if (!result) {
            return new Respond<>(false, "0", null);
        }

        if (isChangeImg) {
            // dir
            String dirStr = baseDir + File.separator +
                    "data" + File.separator +
                    "proj" + File.separator +
                    name + File.separator +
                    "icon" + File.separator;
            // Save
            Utilities.saveMultipartFile(iconFile, dirStr, thumbnail);
        }
        if (isChangeName) {
            String dirStr = baseDir + File.separator +
                    "data" + File.separator +
                    "proj" + File.separator +
                    oldName;
            String newDir = baseDir + File.separator +
                    "data" + File.separator +
                    "proj" + File.separator +
                    name;
            try {
                Utilities.renameDir(dirStr, newDir);
            } catch (Exception e) {
                log.error("Failed to rename directory: " + dirStr + " to " + newDir, e);
            }
        }
        return new Respond<>(true, "success", null);
    }

    /**
     * 图片集上传
     * param name 工程名称
     * param files 图片集
    @PostMapping("/upload_images")
    public Respond<String> upload_images(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("json") String json
    ) {
    }
     */

    /**
     * 图片上传
     * param file
     * param proj
     * param author
     */
    @PostMapping("upload_image")
    public Respond<String> uploadImage(
            @RequestParam("file") MultipartFile img,
            @RequestParam("json") String json
    ) throws IOException {
        // json转换
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.readValue(json, Map.class);

        // 检查参数
        if (
                !map.containsKey("proj") ||
                        !map.containsKey("author") ||
                        !map.containsKey("adminUid") ||
                        !map.containsKey("adminToken")
        ) {
            return new Respond<>(false, "1", null);
        }
        if (
                !(map.get("proj") instanceof String) ||
                        !(map.get("author") instanceof String) ||
                        !(map.get("adminUid") instanceof Integer) ||
                        !(map.get("adminToken") instanceof String)
        ) {
            return new Respond<>(false, "1", null);
        }

        if (img == null || img.isEmpty()) {
            return new Respond<>(false, "1", null);
        }

        String proj = (String) map.get("proj");
        String author = (String) map.get("author");
        int adminUid = (Integer) map.get("adminUid");
        String adminToken = (String) map.get("adminToken");

        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }
        if (proj.length() > 255 || proj.isEmpty()) {
            return new Respond<>(false, "1", null);
        }

        // 获取原工程信息
        Optional<EntityReviewProj> projOpt = projMapper.getProjByName(proj);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }

        // gain file name extension
        String extension = Utilities.getFileExtension(img.getOriginalFilename());
        // check file extension
        if (extension.isEmpty() || !Utilities.isValidImg(extension)) {
            return new Respond<>(false, "8", null);
        }
        // check file size (max 50MB)
        if (img.getSize() > 50 * 1024 * 1024) {
            return new Respond<>(false, "9", null);
        }

        String uuid = Utilities.generateUUID();
        String baseDir = System.getProperty("user.dir");
        String dirStr = baseDir + File.separator +
                "data" + File.separator +
                "proj" + File.separator +
                proj + File.separator +
                "img" + File.separator;

        String fileName = uuid + "." + extension;
        Utilities.saveMultipartFile(img, dirStr, fileName);

        String value;
        // 获取工程类型
        if (projOpt.get().type == 1) {
            value = "[]";
        } else {
            // 审片
            value = "{}";
        }

        // 添加数据库
        Boolean r = projMapper.addPhoto(proj, author, fileName, value);
        if (!r) {
            Utilities.deleteFile(dirStr, fileName);
            return new Respond<>(false, "0", null);
        }

        return new Respond<>(true, "success", null);
    }
}
