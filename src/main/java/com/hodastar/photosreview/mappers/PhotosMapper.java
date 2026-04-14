package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.utils.Utilities;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class PhotosMapper {
    private final JdbcTemplate jdbcTemplate;

    public PhotosMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    // 获取全部照片列表
    public List<EntityReviewPhotos> getPhotos(
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

    // 根据
}
