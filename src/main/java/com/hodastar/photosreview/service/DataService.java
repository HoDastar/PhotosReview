package com.hodastar.photosreview.service;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.entities.EntityReviewRecheck;
import com.hodastar.photosreview.entities.EntityReviewUsers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;

@Component
public class DataService {
    private final JdbcTemplate jdbcTemplate;

    public DataService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    private ObjectMapper jsonMapper = new ObjectMapper();

    // 遍历所有工程数据表
    private List<EntityReviewProj> getProjList() {
        return jdbcTemplate.query(
                "SELECT * FROM review_proj ORDER BY id ASC",
                (rs, rowNum) -> new EntityReviewProj(
                        rs.getInt("id"),
                        rs.getString("projid"),
                        rs.getString("name"),
                        rs.getInt("type"),
                        rs.getInt("max"),
                        rs.getString("task"),
                        rs.getString("recheck"),
                        rs.getString("thumbnail"),
                        rs.getInt("status"),
                        rs.getString("time"),
                        rs.getInt("display")
                )
        );
    }

    // 遍历所有初始数据表
    private List<EntityReviewPhotos> getDataList() {
        return jdbcTemplate.query(
                "SELECT * FROM review_data ORDER BY id ASC",
                (rs, rowNum) -> new EntityReviewPhotos(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("proj"),
                        rs.getString("author"),
                        rs.getString("value")
                )
        );
    }

    private List<EntityReviewPhotos> getDataListByProj(String proj) {
        return jdbcTemplate.query(
                "SELECT * FROM review_data WHERE proj = ? ORDER BY id ASC",
                (rs, rowNum) -> new EntityReviewPhotos(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("proj"),
                        rs.getString("author"),
                        rs.getString("value")
                ), proj
        );
    }

    // 遍历所有复审数据表
    private List<EntityReviewRecheck> getRecheckList() {
        return jdbcTemplate.query(
                "SELECT * FROM review_recheck ORDER BY photoid ASC",
                (rs, rowNum) -> new EntityReviewRecheck(
                        rs.getInt("photoid"),
                        rs.getString("proj"),
                        rs.getString("value"),
                        rs.getDouble("final_score")
                )
        );
    }

    private List<EntityReviewRecheck> getRecheckListByProj(String proj) {
        return jdbcTemplate.query(
                "SELECT * FROM review_recheck WHERE proj = ? ORDER BY photoid ASC",
                (rs, rowNum) -> new EntityReviewRecheck(
                        rs.getInt("photoid"),
                        rs.getString("proj"),
                        rs.getString("value"),
                        rs.getDouble("final_score")
                ), proj
        );
    }

    // 遍历所有用户表
    private List<EntityReviewUsers> getUserList() {
        return jdbcTemplate.query(
                "SELECT * FROM review_users ORDER BY uid ASC",
                (rs, rowNum) -> new EntityReviewUsers(
                        rs.getInt("uid"),
                        rs.getString("password"),
                        rs.getLong("login_time"),
                        rs.getString("allname"),
                        rs.getInt("status")
                )
        );
    }

    public String saveAllProjData() {
        // 获取数据
        List<EntityReviewProj> projList = getProjList();
        List<EntityReviewPhotos> dataList = getDataList();
        List<EntityReviewRecheck> recheckList = getRecheckList();

        HashMap<String, Object> map = new HashMap<>();
        map.put("proj", projList);
        map.put("data", dataList);
        map.put("recheck", recheckList);
        return jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(map);
    }

    public String saveProjData(String projId) {
        // 获取数据
        List<EntityReviewPhotos> dataList = getDataListByProj(projId);
        List<EntityReviewRecheck> recheckList = getRecheckListByProj(projId);

        // 第一个数据
        EntityReviewPhotos firstData = dataList.isEmpty() ? null : dataList.get(0);
        if (firstData == null) {

        }

        HashMap<String, Object> map = new HashMap<>();
        map.put("proj", projId);
        map.put("data", dataList);
        map.put("recheck", recheckList);
        return jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(map);
    }
}
