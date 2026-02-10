package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.utils.Utilities;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ReviewMapper {
    private final JdbcTemplate jdbcTemplate;

    public  ReviewMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 获取工程列表
    public List<EntityReviewProj> getProjList() {
        return jdbcTemplate.query(
                "SELECT * FROM review_proj ORDER BY id DESC",
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
                }
        );
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

}
