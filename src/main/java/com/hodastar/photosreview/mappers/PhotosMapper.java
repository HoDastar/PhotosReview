package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.utils.Utilities;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PhotosMapper {
    private final JdbcTemplate jdbcTemplate;

    public PhotosMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    // 获取全部照片列表
    public List<EntityReviewPhotos> getPhotos(
            String projName,
            String author,
            int page
    ) {
        int[] a = Utilities.calculateOffsetLimit(page, 10);
        int offset = a[0];
        int limit = a[1];
        return jdbcTemplate.query(
                 """
                 SELECT * FROM review_data
                 WHERE (? IS NULL OR proj = ?)
                 AND (? IS NULL OR author = ?)
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?
                 """,
                (rs, rowNum) -> {
                    return new EntityReviewPhotos(
                            rs.getInt("id"),
                            rs.getString("name"),
                            rs.getString("proj"),
                            rs.getString("author"),
                            rs.getString("value")
                    );
                },
                projName, projName, author, author,
                limit, offset
        );
    }

    //
}
