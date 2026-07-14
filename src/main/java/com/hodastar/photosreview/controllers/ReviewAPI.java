package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.mappers.ProjMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.Respond;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.*;

@RestController
@RequestMapping("/api/review")
public class ReviewAPI {
    private final UserMapper userMapper;
    private final ProjMapper projMapper;
    private static final Logger log =
            LoggerFactory.getLogger(ReviewAPI.class);
    private final ReviewMapper reviewMapper;

    public ReviewAPI(ProjMapper projMapper, UserMapper userMapper, ReviewMapper reviewMapper) {
        this.projMapper = projMapper;
        this.userMapper = userMapper;
        this.reviewMapper = reviewMapper;
    }

    // 检查int是否存在多个集合中的其中一个
    private boolean checkIntInCollections(int value, List<List<Integer>> collections) {
        return collections.stream().anyMatch(x -> x.contains(value));
    }

    // 添加图片进入数组
    private HashMap<String, Object> addPhotoToList(int photoid, String name, String type, int score, String note) {
        // 定义数组
        HashMap<String, Object> photoData = new HashMap<>();
        // 判断
        if (type.equals("unread")) {
            photoData.put("photoid", photoid);
            photoData.put("name", name);
            photoData.put("status", false);
        } else if (type.equals("read")) {
            photoData.put("photoid", photoid);
            photoData.put("name", name);
            photoData.put("score", score);
            photoData.put("note", note);
            photoData.put("status", true);
        }
        return photoData;
    }

    // 单次提交
    private Boolean submitSingle(
            int uid,
            Optional<EntityReviewProj> projOpt,
            Optional<EntityReviewPhotos> photoOpt,
            int photoid, int score, String note
    ) {
        ObjectMapper jsonMapper = new ObjectMapper();
        // 判断工程类型
        if (projOpt.get().type == 0) {
            // 评分原数据
            String originalValue = photoOpt.get().value;
            // 解析
            HashMap<String, List<Object>> value =
                    jsonMapper.readValue(
                            originalValue,
                            new TypeReference<HashMap<String, List<Object>>>() {}
                    );

            // 更新评分数据
            List<Object> newScoreData = new ArrayList<>();
            newScoreData.add(score);
            newScoreData.add(note);
            value.put(String.valueOf(uid), newScoreData);
            // 转换为json字符串
            String newValueStr = jsonMapper.writeValueAsString(value);

            // 更新数据库
            Boolean updateResult = reviewMapper.updatePhotoValue(photoid, newValueStr);
            if (!updateResult) {
                return false;
            }
        } else if (projOpt.get().type == 1) {
            // 定义新的value
            List<Object> newValue = new ArrayList<>();
            newValue.add(String.valueOf(uid));
            newValue.add(score);
            newValue.add(note);
            // 转换为json字符串
            String newValueStr = jsonMapper.writeValueAsString(newValue);

            // 更新数据库
            Boolean updateResult = reviewMapper.updatePhotoValue(photoid, newValueStr);
            if (!updateResult) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }

    // 获取照片列表
    @GetMapping("/fetch_photo_list")
    public Respond<HashMap<String, Object>> fetchPhotoList(
            @RequestParam("uid") int uid,
            @RequestParam("token") String token,
            @RequestParam("proj") String projId
    ) {
        // 验证用户
        if (!userMapper.checkToken(uid, token)) {
            return new Respond<>(false, "4", null);
        }

        // 获取项目
        Optional<EntityReviewProj> projOpt = projMapper.getProjById(projId);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }
        // 检查工程状态
        if (projOpt.get().status != 1) {
            return new Respond<>(false, "24", null);
        }

        // 获取任务内容
        ObjectMapper jsonMapper = new ObjectMapper();
        HashMap<String, List<List<Integer>>> taskAll =
                jsonMapper.readValue(
                        projOpt.get().task,
                        new TypeReference<HashMap<String, List<List<Integer>>>>() {}
                );
        List<List<Integer>> taskList = taskAll.get(String.valueOf(uid));

        if (taskList == null || taskList.isEmpty()) {
            return new Respond<>(false, "27", null);
        }

        Set<EntityReviewPhotos> photosSet = new LinkedHashSet<>();
        // 循环每个任务
        for (List<Integer> list : taskList) {
            // 获取照片列表
            List<EntityReviewPhotos> photos = reviewMapper.getPhotos(projId, list.get(0), list.get(1));
            // 添加集合
            photosSet.addAll(photos);
        }
        // 所有图片
        List<EntityReviewPhotos> photosList = new ArrayList<>(photosSet);
        // unread数组集合
        List<HashMap<String, Object>> unreadList = new ArrayList<>();
        // read数组集合
        List<HashMap<String, Object>> readList = new ArrayList<>();

        // 审片模式
        if (projOpt.get().type == 0) {
            // 遍历图片列表
            for (EntityReviewPhotos photo : photosList) {
                String valueStr = photo.value;

                // 如果value字段为空或null
                if (valueStr == null) {
                    unreadList.add(addPhotoToList(photo.id, photo.name, "unread", 0, null));
                    continue;
                }

                // 读取value字段
                HashMap<String, List<Object>> value =
                        jsonMapper.readValue(
                        valueStr,
                        new TypeReference<HashMap<String, List<Object>>>() {}
                    );

                if (!value.containsKey(String.valueOf(uid)) || value.get(String.valueOf(uid)) == null) {
                    // 如果数据中没有该uid的数据
                    unreadList.add(addPhotoToList(photo.id, photo.name, "unread", 0, null));
                } else {
                    // 添加
                    List<Object> reviewData = value.get(String.valueOf(uid));
                    int score = (int) reviewData.get(0);
                    String note = (String) reviewData.get(1);
                    readList.add(addPhotoToList(photo.id, photo.name, "read", score, note));
                }
            }
        }
        // 筛片模式
        if (projOpt.get().type == 1) {
            // 遍历图片列表
            for (EntityReviewPhotos photo : photosList) {
                String valueStr = photo.value;

                // 如果value字段为空或null
                if (valueStr == null) {
                    unreadList.add(addPhotoToList(photo.id, photo.name, "unread", 0, null));
                    continue;
                }

                // 读取value字段
                List<Object> value =
                        jsonMapper.readValue(
                                valueStr,
                                new TypeReference<List<Object>>() {
                                }
                        );

                if (value.isEmpty()) {
                    unreadList.add(addPhotoToList(photo.id, photo.name, "unread", 0, null));
                } else {
                    // 添加
                    int score = (int) value.get(1);
                    String note = (String) value.get(2);
                    readList.add(addPhotoToList(photo.id, photo.name, "read", score, note));
                }
            }
        }

        HashMap<String, Object> data = new HashMap<>();
        // 任务总量
        data.put("all", photosList.size());
        // 剩余任务
        data.put("remaining", unreadList.size());
        // 已完成任务
        data.put("read", readList.size());
        // 任务类型
        data.put("type", projOpt.get().type);
        data.put("max", projOpt.get().max);

        // 图片列表
        HashMap<String, List<Object>> result = new HashMap<>();
        result.put("unread", new ArrayList<>(unreadList));
        result.put("read", new ArrayList<>(readList));
        data.put("list", result);

        return new Respond<>(true, "true", data);
    }

    // 获取照片列表（管理员）
    @GetMapping("fetch_photo_list_all")
    public Respond<List<EntityReviewPhotos>> fetchPhotoListAll(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            @RequestParam("projId") String projId,
            @RequestParam(value = "author", required = false) String author
    ){
        // 验证用户
        if (!userMapper.checkAdmin(uid, token)) {
            return new Respond<>(false, "5", null);
        }
        if (author == null || author.isBlank()) {
            author = null;
        }
        List<EntityReviewPhotos> data = reviewMapper.getAllPhotos(projId, author);
        return new Respond<>(true, "true", data);
    }

    // 获取单张照片的数据
    @GetMapping("/fetch_photo_data")
    public Respond<HashMap<String, Object>> fetchPhotoData(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            @RequestParam("photoid") int photoid
    ) {
        // 验证用户
        if (!userMapper.checkAdmin(uid, token)) {
            return new Respond<>(false, "5", null);
        }

        // 获取photo信息
        Optional<EntityReviewPhotos> photoOpt = reviewMapper.getPhotoById(photoid);
        if (photoOpt.isEmpty()) {
            return new Respond<>(false, "25", null);
        }

        // 获取photo的value字段
        String valueStr = photoOpt.get().value;
        JsonMapper jsonMapper = new JsonMapper();
        JsonNode root = jsonMapper.readTree(valueStr);

        // 判断value的json类型
        if (root.isObject()) {
            // 审片模式
            HashMap<String, List<Object>> value =
                    jsonMapper.readValue(
                            valueStr,
                            new TypeReference<HashMap<String, List<Object>>>() {}
                    );
            HashMap<String, Object> data = new HashMap<>();
            data.put("photoid", photoOpt.get().id);
            data.put("name", photoOpt.get().name);
            data.put("proj", projMapper.getProjNameById(photoOpt.get().proj));
            data.put("project_type", 0);
            data.put("author", photoOpt.get().author);
            data.put("value", value);
            return new Respond<>(true, "true", data);
        } else if (root.isArray()) {
            // 筛片模式
            List<Object> value =
                    jsonMapper.readValue(
                            valueStr,
                            new TypeReference<List<Object>>() {}
                    );
            HashMap<String, Object> data = new HashMap<>();
            data.put("photoid", photoOpt.get().id);
            data.put("name", photoOpt.get().name);
            data.put("proj", projMapper.getProjNameById(photoOpt.get().proj));
            data.put("project_type", 1);
            data.put("author", photoOpt.get().author);
            data.put("value", value);
            return new Respond<>(true, "true", data);
        } else {
            return new Respond<>(false, "0", null);
        }
    }

    // 提交评分
    @PostMapping("/submit")
    public Respond<Integer> submitPhotos(
            @RequestParam("submit_type") String submitType,
            @RequestParam("proj") String projId,
            @RequestBody HashMap<String, Object> body
    ) {
        if (!body.containsKey("photoid")||
                !body.containsKey("uid") ||
                !body.containsKey("token") ||
                !body.containsKey("score") ||
                !body.containsKey("note")
        ) {
            return new Respond<>(false, "1", null);
        }
        if (!(body.get("uid") instanceof Integer) ||
                !(body.get("token") instanceof String) ||
                !(body.get("score") instanceof Integer) ||
                !(body.get("note") instanceof String)
        ) {
            return new Respond<>(false, "1", null);
        }

        int uid = (int) body.get("uid");
        String token = (String) body.get("token");
        // 验证用户
        if (!userMapper.checkToken(uid, token)) {
            return new Respond<>(false, "4", null);
        }

        // 获取项目
        Optional<EntityReviewProj> projOpt = projMapper.getProjById(projId);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }
        // 检查工程状态
        if (projOpt.get().status != 1) {
            return new Respond<>(false, "24", null);
        }

        int score = (int) body.get("score");
        String note = (String) body.get("note");

        // 检查评分范围
        if (score < 1 || score > projOpt.get().max) {
            return new Respond<>(false, "1", null);
        }
        // 检查批注长度
        if (note.length() > 500) {
            return new Respond<>(false, "6", null);
        }

        // 提交类型
        switch (submitType) {
            case "single":
                // 判断photoid
                if (!(body.get("photoid") instanceof Integer)) {
                    return new Respond<>(false, "1", null);
                }
                // 获取photoid
                int photoid = (int) body.get("photoid");
                // 获取photo信息
                Optional<EntityReviewPhotos> photoOpt = reviewMapper.getPhotoById(photoid);

                if (photoOpt.isEmpty()) {
                    return new Respond<>(false, "25", null);
                }
                // 比对项目
                if (!Objects.equals(photoOpt.get().proj, projId)) {
                    return new Respond<>(false, "26", null);
                }

                Boolean result = submitSingle(uid, projOpt, photoOpt, photoid, score, note);
                if (result) {
                    return new Respond<>(true, "true", 1);
                } else {
                    return new Respond<>(false, "0", 0);
                }

            case "batch":
                // 判断photoid
                if (!(body.get("photoid") instanceof List)) {
                    return new Respond<>(false, "1", 0);
                }
                List<Object> photoidList = (List<Object>) body.get("photoid");
                // 成功个数
                int successCount = 0;

                for (Object obj : photoidList) {
                    if (!(obj instanceof Integer)) {
                        continue;
                    }

                    int id = (int) obj;
                    // 获取photo信息
                    Optional<EntityReviewPhotos> photoOptBatch = reviewMapper.getPhotoById(id);
                    if (photoOptBatch.isEmpty()) {
                        continue;
                    }
                    // 比对项目
                    if (!Objects.equals(photoOptBatch.get().proj, projId)) {
                        continue;
                    }
                    Boolean batchResult = submitSingle(uid, projOpt, photoOptBatch, id, score, note);
                    if (!batchResult) {
                        continue;
                    }
                    successCount++;
                }
                return new Respond<>(true, "true", successCount);

            default:
                return new Respond<>(false, "1", 0);
        }
    }

}
