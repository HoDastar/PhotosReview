package com.hodastar.photosreview.controllers;

import com.google.gson.JsonObject;
import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.PhotosMapper;
import com.hodastar.photosreview.mappers.ProjMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.JsonObjGet;
import com.hodastar.photosreview.utils.Respond;
import com.hodastar.photosreview.utils.Utilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/photos")
public class PhotosAPI {
    private final UserMapper userMapper;
    private final ProjMapper projMapper;
    private static final Logger log =
            LoggerFactory.getLogger(PhotosAPI.class);
    private final PhotosMapper photosMapper;

    public PhotosAPI(ProjMapper projMapper, UserMapper userMapper, PhotosMapper photosMapper) {
        this.projMapper = projMapper;
        this.userMapper = userMapper;
        this.photosMapper = photosMapper;
    }

    // 获取照片列表
    @GetMapping("/fetch_photo_list")
    public Respond<HashMap<String, Object>> fetchPhotoList(
            @RequestParam("uid") int uid,
            @RequestParam("token") String token,
            @RequestParam("proj_name") String projName
    ) {
        // 验证用户
        if (!userMapper.checkToken(uid, token)) {
            return new Respond<>(false, "4", null);
        }

        // 获取项目
        Optional<EntityReviewProj> projOpt = projMapper.getProjByName(projName);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }

        // 获取任务内容
        String taskStr = projOpt.get().task;
        JsonObject task = JsonObjGet.parse(taskStr);

        HashMap<String, Object> data = new HashMap<>();
        return new Respond<>(true, "true", data);
    }

    // 获取照片列表（管理员）
    @GetMapping("fetch_photo_list_all")
    public Respond<List<EntityReviewPhotos>> fetchPhotoListAll(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            @RequestParam(value = "proj_name", required = false) String projName,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page
    ){
        // 验证用户
        if (!userMapper.checkAdmin(uid, token)) {
            return new Respond<>(false, "5", null);
        }
        if (projName == null || projName.isBlank()) {
            projName = null;
        }
        if (author == null || author.isBlank()) {
            author = null;
        }
        List<EntityReviewPhotos> data = photosMapper.getPhotos(projName, author, page);
        return new Respond<>(true, "true", data);
    }

}
