package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ReviewMapper {
    private final JdbcTemplate jdbcTemplate;

    public ReviewMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    // 获取全部照片列表
    public List<EntityReviewPhotos> getAllPhotos(
            String projId,
            String author
    ) {
        StringBuilder sql = new StringBuilder("SELECT * FROM review_data WHERE 1=1");
        List<Object> params = new ArrayList<>();

        sql.append(" AND proj = ?");
        params.add(projId);

        if (author != null) {
            sql.append(" AND author LIKE ?");
            params.add("%" + author + "%");
        }

        sql.append(" ORDER BY id ASC");

        return jdbcTemplate.query(
                 sql.toString(),
                (rs, rowNum) -> {
                    return new EntityReviewPhotos(
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getString("proj"),
                            rs.getString("author"),
                            rs.getString("value")
                    );
                },
                params.toArray()
        );
    }

    // 根据工程id、闭区间获取照片列表
    public List<EntityReviewPhotos> getPhotos(
            String projId,
            int start,
            int end
    ) {
        StringBuilder sql = new StringBuilder("SELECT * FROM review_data WHERE 1=1");
        List<Object> params = new ArrayList<>();
        int num = end - start + 1;

        sql.append(" AND proj = ?");
        params.add(projId);

        sql.append(" ORDER BY id ASC");

        sql.append(" LIMIT ?");
        params.add(num);

        sql.append(" OFFSET ?");
        params.add(start);

        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> {
                    return new EntityReviewPhotos(
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getString("proj"),
                            rs.getString("author"),
                            rs.getString("value")
                    );
                },
                params.toArray()
        );
    }

    // 通过photoid查询图片
    public Optional<EntityReviewPhotos> getPhotoById(int photoId) {
        List<EntityReviewPhotos> list = jdbcTemplate.query(
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
                photoId);
        return list.stream().findFirst();
    }

    // 写入评分
    public Boolean updatePhotoValue(int photoId, String value) {
        try {
            int rowsAffected = jdbcTemplate.update(
                    "UPDATE review_data SET value = ? WHERE id = ?",
                    value, photoId
            );
            return rowsAffected > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
