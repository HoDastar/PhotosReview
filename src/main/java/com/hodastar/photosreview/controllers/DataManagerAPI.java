package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.service.DataService;
import com.hodastar.photosreview.utils.FileUtil;
import com.hodastar.photosreview.utils.OutputPhotosPath;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/data_manager")
public class DataManagerAPI {
    // 冷却时间，单位为毫秒。
    private static final long PRELIMINARY_RESULT_COOLDOWN_MS = 60_000L;

    @Autowired
    private DataService dataService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private ReviewMapper reviewMapper;
    private long lastSaveTime = 0;
    // 冷却键格式为“管理员 UID:工程 ID”，值为最近一次成功开始统计的时间戳。
    private final Map<String, Long> saveAllDataCooldown = new ConcurrentHashMap<>();
    private ObjectMapper jsonMapper = new ObjectMapper();

    // 保存全部数据
    @GetMapping("/save_all_proj_data")
    public void saveAllProjData(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            HttpServletResponse response
    ) throws IOException {
        if (!userMapper.checkAdmin(uid, token)) {
            response.setStatus(403);
            return;
        }

        long now = System.currentTimeMillis();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm_ss");
        String time = Instant.ofEpochMilli(now)
                .atZone(ZoneId.systemDefault())
                .format(formatter);

        response.setContentType("application/zip");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=output_all_project_" + time + ".zip"
        );

        HashMap<String, Object> data = dataService.saveAllProjData();
        String mainFile = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);

        if (!data.containsKey("proj") || !(data.get("proj") instanceof List)) {
            response.setStatus(403);
            return;
        }
        List<EntityReviewProj> projList = (List<EntityReviewProj>) data.get("proj");
        List<String> projIds = projList.stream()
                .map(proj -> proj.projId)
                .toList();

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            zos.putNextEntry(
                    new ZipEntry("main.json")
            );
            zos.write(mainFile.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            for (String projId : projIds) {
                FileUtil.zipDirectory(
                        OutputPhotosPath.projPath(projId),
                        zos
                );
            }
        }
    }

    // 保存工程数据
    @GetMapping("/save_proj_data")
    public void saveProjData(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            @RequestParam("projId") String projId,
            HttpServletResponse response
    ) throws IOException {
        if (!userMapper.checkAdmin(uid, token)) {
            response.setStatus(403);
            return;
        }

        long now = System.currentTimeMillis();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm_ss");
        String time = Instant.ofEpochMilli(now)
                .atZone(ZoneId.systemDefault())
                .format(formatter);

        response.setContentType("application/zip");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=output_project_" + projId + "_" + time + ".zip"
        );

        // 所有数据
        HashMap<String, Object> data = dataService.saveProjData(projId);
        if (data == null) {
            response.setStatus(403);
            return;
        }
        String mainFile = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            // 添加主文件
            zos.putNextEntry(
                    new ZipEntry("main.json")
            );
            zos.write(mainFile.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // 添加工程目录
            FileUtil.zipDirectory(
                    OutputPhotosPath.projPath(projId),
                    zos
            );
        }
    }

    // 导出选中图片的zip
    @GetMapping("/download_images")
    public void downloadImages(
            @RequestParam("adminUid") int adminUid,
            @RequestParam("adminToken") String adminToken,
            @RequestParam("proj") String proj,
            @RequestParam("list") List<Integer> ids,
            HttpServletResponse response
    ) throws IOException {
        // 检测权限
        if (!userMapper.checkAdmin(adminUid, adminToken)) {
            response.setStatus(403);
            return;
        }
        // 获取文件列表
        List<String> list = reviewMapper.getPhotoNamesByIds(ids, proj);
        if (list.isEmpty()) {
            response.setStatus(404);
            return;
        }

        long now = System.currentTimeMillis();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm_ss");
        String time = Instant.ofEpochMilli(now)
                .atZone(ZoneId.systemDefault())
                .format(formatter);

        response.setContentType("application/zip");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=output_photos_" + time + ".zip"
        );

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            for (String file : list) {
                Path filePath = OutputPhotosPath.imgPath(proj, file);

                if (!Files.exists(filePath)) {
                    continue;
                }

                FileUtil.zipFileList(filePath, zos);
            }
        }
    }
}
