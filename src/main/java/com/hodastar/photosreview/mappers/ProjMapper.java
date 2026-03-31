package com.hodastar.photosreview.mappers;

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
    public Boolean createProj(String name, int type, String thumbnail) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO review_proj(name, type, task, thumbnail, status, time, display) VALUES (?, ?, ?, ?, ?, ?, ?)",
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
    public int getProjDataCount(String projName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM review_data WHERE proj = ?",
                Integer.class,
                projName
        );
        return count != null ? count : 0;
    }

    // 删除工程
    public Boolean deleteProj(String name) {
        try {
            jdbcTemplate.update(
                    "DELETE FROM review_proj WHERE name = ?",
                    name
            );
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 通过id获取单个工程
     * @param id 工程ID
     * @return 工程信息
     */
    public Optional<EntityReviewProj> getProjById(int id) {
        try {
            EntityReviewProj proj = jdbcTemplate.queryForObject(
                    "SELECT * FROM review_proj WHERE id = ?",
                    (rs, rowNum) -> {
                        return new EntityReviewProj(
                                rs.getInt("id"),
                                rs.getString("name"),
                                rs.getInt("type"),
                                rs.getString("task"),
                                rs.getString("thumbnail"),
                                rs.getInt("status"),
                                rs.getString("time"),
                                rs.getInt("display")
                        );
                    },
                    id
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
     * @param id 工程ID
     * @param name 工程名称
     * @param thumbnail 工程缩略图
     * @param status 工程状态
     * @param display 工程是否显示
     * @return 修改结果
     */
    public Boolean updateProj(int id, String name, String thumbnail, int status, int display) {
        try {
            jdbcTemplate.update(
                    "UPDATE review_proj SET name = ?, thumbnail = ?, status = ?, display = ? WHERE id = ?",
                    name, thumbnail, status, display, id
            );
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 添加图片
     * @param proj 工程名称
     * @param author 作者
     * @param name 文件名称
     * @param value 值
     */
    public Boolean addPhoto(String proj, String author, String name, String value) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO review_data(id, name, proj, author, value) VALUES (null, ?, ?, ?, ?)",
                    name, proj, author, value
            );
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
