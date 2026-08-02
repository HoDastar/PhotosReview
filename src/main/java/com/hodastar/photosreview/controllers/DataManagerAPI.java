package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.service.DataService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/data_manager")
public class DataManagerAPI {
    @Autowired
    private DataService dataService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private ReviewMapper reviewMapper;
    private long lastSaveTime = 0;

    // 保存全部工程数据
    @GetMapping("/save_all_proj_data")
    public ResponseEntity<byte[]> saveAllProjData(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token
    ) {
        if (!userMapper.checkAdmin(uid, token)) {
            return ResponseEntity.status(403).body("Forbidden: Invalid admin credentials.".getBytes(StandardCharsets.UTF_8));
        }

        long now = System.currentTimeMillis();

        if (now - lastSaveTime > 10000) {
            lastSaveTime = now;
        } else {
            return ResponseEntity.status(429).body("Too many requests. Please wait before trying again.".getBytes(StandardCharsets.UTF_8));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm_ss");
        String time = Instant.ofEpochMilli(now)
                .atZone(ZoneId.systemDefault())
                .format(formatter);

        String data = dataService.saveAllProjData();
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"all_proj_data_"
                        + time + ".json\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(data.getBytes(StandardCharsets.UTF_8));
    }

    // 保存特定工程数据
    @GetMapping("/save_proj_data")
    public ResponseEntity<byte[]> saveProjData(
            @RequestParam("adminUid") int uid,
            @RequestParam("adminToken") String token,
            @RequestParam("projId") String projId
    ) {
        if (!userMapper.checkAdmin(uid, token)) {
            return ResponseEntity.status(403).body("Forbidden: Invalid admin credentials.".getBytes(StandardCharsets.UTF_8));
        }

        long now = System.currentTimeMillis();

        if (now - lastSaveTime > 10000) {
            lastSaveTime = now;
        } else {
            return ResponseEntity.status(429).body("Too many requests. Please wait before trying again.".getBytes(StandardCharsets.UTF_8));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy_MM_dd_HH_mm_ss");
        String time = Instant.ofEpochMilli(now)
                .atZone(ZoneId.systemDefault())
                .format(formatter);

        String data = dataService.saveProjData(projId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"proj_data_"
                        + projId + "_" + time + ".json\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(data.getBytes(StandardCharsets.UTF_8));
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

        // 目标目录
        String baseDir = System.getProperty("user.dir");
        String dirStr = baseDir + File.separator +
                "data" + File.separator +
                "proj" + File.separator +
                proj + File.separator +
                "img" + File.separator;
        Path path = Paths.get(dirStr);

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
                Path filePath = path.resolve(file);
                if (!Files.exists(filePath)) {
                    continue;
                }

                // 防止路径穿越
                if (!filePath.normalize().startsWith(path.normalize())) {
                    continue;
                }

                ZipEntry entry = new ZipEntry(filePath.getFileName().toString());
                zos.putNextEntry(entry);
                Files.copy(filePath, zos);
                zos.closeEntry();
            }
        }
    }
}
