package com.hodastar.photosreview.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class SqliteInitiate {

    @Bean
    public CommandLineRunner sqliteTableInitiate(JdbcTemplate jdbcTemplate) {
        return args -> {
            // 确保 data 目录存在（否则 sqlite 不能创建文件）
            Files.createDirectories(Path.of("./database"));
            // 初始化表
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS review_users (
                            uid INTEGER PRIMARY KEY,
                            password TEXT NOT NULL,
                            login_time INTEGER NOT NULL,
                            allname TEXT NOT NULL,
                            status INTEGER NOT NULL
                        );
                    
                    
                    """);
            jdbcTemplate.execute("""
                    INSERT INTO review_users(uid, password, login_time, allname, status)
                    SELECT 10000, '$2a$10$lAecc.DqEAYsrnCa7RojTuyd23agS0DqsCTcoPaNuEpkVSE4YweQa', 0, 'root', 0
                    WHERE NOT EXISTS (
                        SELECT 1 FROM review_users WHERE uid = 10000
                    );
                """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS review_proj (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        -- 0 = 审片, 1 = 筛片
                        type INTEGER NOT NULL,
                        task TEXT NOT NULL,
                        thumbnail TEXT NOT NULL,
                        -- 0未开始 1进行中 2收尾中 3已结束
                        status INTEGER NOT NULL,
                        -- 时间：建议用 ISO 字符串
                        time TEXT NOT NULL,
                        -- 0/1 是否展示
                        display INTEGER NOT NULL
                    );
                    CREATE UNIQUE INDEX idx_review_proj_name
                    ON review_proj(name);
                """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS review_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        proj TEXT NOT NULL,
                        author TEXT NOT NULL,
                        -- JSON 数据：SQLite 用 TEXT 存储
                        value TEXT NOT NULL
                    );
                """);
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS review_config (
                        id INTEGER PRIMARY KEY,
                        name TEXT NOT NULL,
                        value TEXT NOT NULL
                    );
                """);
            jdbcTemplate.execute("""
                    -- 初始化设置 --
                    INSERT INTO review_config(id, name, value)
                    SELECT 0, 'website_name', 'A Photo Review System'
                    WHERE NOT EXISTS (
                        SELECT 1 FROM review_config WHERE id = 0
                    );
                """);
        };
        
    }
}
