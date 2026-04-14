package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.utils.Utilities;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProjMapper {
    private final JdbcTemplate jdbcTemplate;

    public ProjMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 获取工程列表
    public List<EntityReviewProj> getProjList(int page) {
        int[] a = Utilities.calculateOffsetLimit(page, 10);
        int offset = a[0];
        int limit = a[1];
        return jdbcTemplate.query(
                "SELECT * FROM review_proj ORDER BY id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    return new EntityReviewProj(
                        rs.getInt("id"),
                        rs.getString("projid"),
                        rs.getString("name"),
                        rs.getInt("type"),
                        rs.getString("task"),
                        rs.getString("thumbnail"),
                        rs.getInt("status"),
                        rs.getString("time"),
                        rs.getInt("display")
                    );
                },
                limit, offset
        );
    }

    public List<EntityReviewProj> getProjList() {
        return getProjList(1);
    }

    /**
     * 新建工程
     * @param name 工程名称
     * @param type 工程类型
     * @param thumbnail 工程缩略图
     * @return 新建结果
     */
    public Boolean createProj(String projId, String name, int type, String thumbnail) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO review_proj(projid, name, type, task, thumbnail, status, time, display) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    projId,
                    name,
                    type,
                    "{}",
                    thumbnail,
                    0,
                    Utilities.nowTimeString(),
                    1
            );
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // 检查工程是否重名
    public Boolean isProjNameExist(String name) {
        Boolean isExist = jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM review_proj WHERE name = ?)",
                Boolean.class,
                name
        );
        return Boolean.TRUE.equals(isExist);
    }

    // 获取该工程的总量
    public int getProjDataCount(String projId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM review_data WHERE proj = ?",
                Integer.class,
                projId
        );
        return count != null ? count : 0;
    }

    // 删除工程
    public Boolean deleteProj(String projId) {
        try {
            int rowsAffected = jdbcTemplate.update(
                    "DELETE FROM review_proj WHERE projid = ?",
                    projId
            );
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 通过id获取单个工程
     * @param projId 工程ID
     * @return 工程信息
     */
    public Optional<EntityReviewProj> getProjById(String projId) {
        try {
            EntityReviewProj proj = jdbcTemplate.queryForObject(
                    "SELECT * FROM review_proj WHERE projid = ?",
                    (rs, rowNum) -> {
                        return new EntityReviewProj(
                                rs.getInt("id"),
                                rs.getString("projid"),
                                rs.getString("name"),
                                rs.getInt("type"),
                                rs.getString("task"),
                                rs.getString("thumbnail"),
                                rs.getInt("status"),
                                rs.getString("time"),
                                rs.getInt("display")
                        );
                    },
                    projId
            );
            return Optional.ofNullable(proj);
        } catch (Exception e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    /**
     * 通过name获取单个工程
     * @param name
     * @return 工程信息
     */
    public Optional<EntityReviewProj> getProjByName(String name) {
        try {
            EntityReviewProj proj = jdbcTemplate.queryForObject(
                    "SELECT * FROM review_proj WHERE name = ?",
                    (rs, rowNum) -> {
                        return new EntityReviewProj(
                                rs.getInt("id"),
                                rs.getString("projid"),
                                rs.getString("name"),
                                rs.getInt("type"),
                                rs.getString("task"),
                                rs.getString("thumbnail"),
                                rs.getInt("status"),
                                rs.getString("time"),
                                rs.getInt("display")
                        );
                    },
                    name
            );
            return Optional.ofNullable(proj);
        } catch (Exception e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    /**
     * 修改工程
     * @param projId 工程ID
     * @param name 工程名称
     * @param thumbnail 工程缩略图
     * @param status 工程状态
     * @param display 工程是否显示
     * @return 修改结果
     */
    public Boolean updateProj(String projId, String name, String thumbnail, int status, int display) {
        try {
            int rowsAffected = jdbcTemplate.update(
                    "UPDATE review_proj SET name = ?, thumbnail = ?, status = ?, display = ? WHERE projid = ?",
                    name, thumbnail, status, display, projId
            );
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 添加图片
     * @param projId 工程名称
     * @param author 作者
     * @param name 文件名称
     * @param value 值
     */
    public Boolean addPhoto(String projId, String author, String name, String value) {
        try {
            int rowsAffected = jdbcTemplate.update(
                    "INSERT INTO review_data(id, name, proj, author, value) VALUES (null, ?, ?, ?, ?)",
                    name, projId, author, value
            );
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 通过id获取照片
     * @param id 照片id
     * @return 照片信息
     */
    public Optional<EntityReviewPhotos> getPhotoById(int id) {
        try {
            EntityReviewPhotos photo = jdbcTemplate.queryForObject(
                    "SELECT * FROM review_data WHERE id = ?",
                    (rs, rowNum) -> {
                        return new EntityReviewPhotos(
                                rs.getInt("id"),
                                rs.getString("name"),
                                rs.getString("proj"),
                                rs.getString("author"),
                                rs.getString("value")
                        );
                    },
                    id
            );
            return Optional.ofNullable(photo);
        } catch (Exception e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    /**
     * 通过id删除照片
     * @param id 照片id
     * @return 删除结果
     */
    public Boolean deletePhotoById(int id) {
        try {
            int rowsAffected = jdbcTemplate.update(
                    "DELETE FROM review_data WHERE id = ?",
                    id
            );
            return rowsAffected > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
