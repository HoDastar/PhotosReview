package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.utils.Respond;
import com.hodastar.photosreview.utils.Utilities;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/review")
public class ReviewAPI {
    private final ReviewMapper reviewMapper;

    public ReviewAPI(ReviewMapper reviewMapper) {
        this.reviewMapper = reviewMapper;
    }

    // 获取工程列表
    @GetMapping("/get_proj_list")
    public Respond<List<EntityReviewProj>> get_proj_list(){
        List<EntityReviewProj> projList = reviewMapper.getProjList();
        return new Respond<>(true, "success", projList);
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
            @RequestParam("file")MultipartFile iconFile,
            @RequestParam("json") String json
    ) throws Exception {
        // json转换
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.readValue(json, Map.class);

        // 检查参数
        if (!map.containsKey("name") || !map.containsKey("type")) {
            return new Respond<>(false, "1", null);
        }
        if (!(map.get("name") instanceof String) || !(map.get("type") instanceof Integer)) {
            return new Respond<>(false, "1", null);
        }
        if (iconFile == null || iconFile.isEmpty()) {
            return new Respond<>(false, "1", null);
        }
        String name = (String) map.get("name");
        int type = (Integer) map.get("type");

        // check name length
        if (name.length() > 255) {
            return new Respond<>(false, "6", null);
        }
        // check type
        if (type < 0 || type > 1) {
            return new Respond<>(false, "1", null);
        }

        // Generous a uuid
        String uuid = Utilities.generateUUID();

        // dir
        String dirStr = "data/proj/" + name + "/icon/";
        File dir = new File(dirStr);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // gain file name extension
        String extension = Utilities.getFileExtension(iconFile.getOriginalFilename());
        // check file extension
        if (extension == null || extension.isEmpty()) {
            return new Respond<>(false, "8", null);
        }
        if (!extension.equalsIgnoreCase("jpg") && !extension.equalsIgnoreCase("jpeg") && !extension.equalsIgnoreCase("png") && !extension.equalsIgnoreCase("webp")) {
            return new Respond<>(false, "8", null);
        }

        // 保存原图
        String fileName = uuid + "." + extension;
        File dest = new File(dir + fileName);
        iconFile.transferTo(dest);

        // 数据库
        Boolean result = reviewMapper.createProj(name, type, fileName);
        if (!result) {
            return new Respond<>(false, "-1", null);
        }

        return new Respond<>(true, "success", null);
    }


}
