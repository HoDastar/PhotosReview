package com.hodastar.photosreview.mappers;

import com.hodastar.photosreview.entities.EntityReviewUsers;
import com.hodastar.photosreview.utils.CryptUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class UserMapper {
    private final JdbcTemplate jdbcTemplate;

    public UserMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 通过用户 ID 获取用户信息
     * @param uid 用户 ID
     * @return 用户信息
     */
    public Optional<EntityReviewUsers> getUserByUid(int uid) {
        List<EntityReviewUsers> list = jdbcTemplate.query(
                "SELECT * FROM review_users WHERE uid = ?",
                (rs, rowNum) -> {
                    return new EntityReviewUsers(
                            rs.getInt("uid"),
                            rs.getString("password"),
                            rs.getLong("login_time"),
                            rs.getString("allname"),
                            rs.getInt("status")
                    );
                },
                uid);
        return list.stream().findFirst();
    }

    /**
     * 判断uid是否被占用
     * @param uid 用户 ID
     * @return 是否被占用
     */
    public Boolean isUidExist(int uid) {
        Boolean isExist = jdbcTemplate.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM review_users WHERE uid = ?)",
                Boolean.class,
                uid
        );
        return Boolean.TRUE.equals(isExist);
    }

    /**
     * 更新登录时间
     * @param uid 用户 ID
     * @return 登录结果map
     */
    public Boolean updateLoginTime(int uid, long currentTime) {

        // 更新登录时间
        int rowsAffected = jdbcTemplate.update(
                "UPDATE review_users SET login_time = ? WHERE uid = ?",
                currentTime, uid
        );
        return rowsAffected != 0;
    }

    /**
     * 更新密码
     * @param uid 用户 ID
     * @param newPassword 新加密后的密码
     * @return 更新结果     */
    public Boolean updatePassword(int uid, String newPassword) {
        int rowsAffected = jdbcTemplate.update(
                "UPDATE review_users SET password = ? WHERE uid = ?",
                newPassword, uid
        );
        return rowsAffected != 0;
    }

    /**
     * 检查token
     * @param uid 用户 ID
     * @param token token
     * @return 是否有效
     */
    public Boolean checkToken(int uid, String token) {
        Optional<EntityReviewUsers> user = getUserByUid(uid);
        if (user.isEmpty()) {
            return false;
        }
        String originalToken = String.valueOf(uid) + String.valueOf(user.get().login_time);
        String dbToken = CryptUtil.nBCrypt(originalToken);
        return dbToken.equals(token);
    }

    /**
     * 注册
     * @param uid 用户 ID
     * @param password 原始密码
     * @param allname 用户全名
     * @return 注册结果map
     */
    public Boolean register(int uid, String password, String allname) {
        // 获取当前秒级时间戳
        long currentTime = System.currentTimeMillis() / 1000;
        // 加密密码
        String ppassword = CryptUtil.BCEcrypt(password);

        // 插入新用户
        int rowsAffected = jdbcTemplate.update(
                "INSERT INTO review_users (uid, password, login_time, allname, status) VALUES (?, ?, ?, ?, ?)",
                uid, ppassword, currentTime, allname, 1
        );
        if (rowsAffected == 0) {
            return false;
        } else {
            return true;
        }
    }
}
