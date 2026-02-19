package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewUsers;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.CryptUtil;
import com.hodastar.photosreview.utils.Respond;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserAPI {

    private final UserMapper userMapper;

    public UserAPI(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 注册接口
     * param uid uid
     * param allname 用户名
     * param password 密码
     * @return 注册结果      */
    @PostMapping("/register")
    public Respond<String> register(@RequestBody HashMap<String, Object> body) {
        // 检查类型
        if (!body.containsKey("uid") || !body.containsKey("allname") || !body.containsKey("password") || !body.containsKey("adminUid") || !body.containsKey("adminToken")) {
            return new Respond<>(false, "1", null);
        }
        if (!(body.get("uid") instanceof Integer) || !(body.get("allname") instanceof String) || !(body.get("password") instanceof String) || !(body.get("adminUid") instanceof Integer) || !(body.get("adminToken") instanceof String)) {
            return new Respond<>(false, "1", null);
        }
        int uid = (Integer) body.get("uid");
        String allname = (String) body.get("allname");
        String password = (String) body.get("password");
        int adminUid = (Integer) body.get("adminUid");
        String adminToken = (String) body.get("adminToken");

        // 检查长度
        if (allname.length() > 255 || password.length() > 255) {
            return new Respond<>(false, "6", null);
        }
        if (uid > 999999999 || uid < 10000) {
            return new Respond<>(false, "7", null);
        }

        // 检查token
        if (!userMapper.checkToken(adminUid, adminToken)) {
            return new Respond<>(false, "4", null);
        }

        // 获取信息
        Optional<EntityReviewUsers> user = userMapper.getUserByUid(adminUid);
        // 检查管理员权限
        if (user.isEmpty()) {
            return new Respond<>(false, "5", null);
        }
        if (user.get().status != 0) {
            return new Respond<>(false, "5", null);
        }

        // 检查uid是否占用
        Boolean isExist = userMapper.isUidExist(uid);
        if (Boolean.TRUE.equals(isExist)) {
            return new Respond<>(false, "2", null);
        }

        // 注册
        Boolean result = userMapper.register(uid, password, allname);
        if (result) {
            return new Respond<>(true, "success", null);
        } else {
            return new Respond<>(false, "0", null);
        }
    }

    /**
     * 登录接口
     * param uid uid
     * param password 密码
     * @return 登录结果
     */
    @PostMapping("/login")
    public Respond<String> login(@RequestBody HashMap<String, Object> body) {
        // 检查类型
        if (!body.containsKey("uid") || !body.containsKey("password")) {
            return new Respond<>(false, "1", null);
        }
        if (!(body.get("uid") instanceof Integer) || !(body.get("password") instanceof String)) {
            return new Respond<>(false, "1", null);
        }
        int uid = (Integer) body.get("uid");
        String password = (String) body.get("password");

        // 获取用户
        Optional<EntityReviewUsers> user = userMapper.getUserByUid(uid);
        if (user.isEmpty()) {
            return new Respond<>(false, "2", null);
        }
        // 验证密码
        if (!CryptUtil.checkBCEcrypt(password, user.get().password)) {
            return new Respond<>(false, "2", null);
        }
        // 更新登录时间
        Boolean result = userMapper.updateLoginTime(uid);
        if (!result) {
            return new Respond<>(false, "0", null);
        }

        // 合成token
        String originalToken = String.valueOf(uid) + String.valueOf(user.get().login_time);
        String token = CryptUtil.nBCrypt(originalToken);
        return new Respond<>(true, "success", token);
    }

    // 查询token接口
    @GetMapping("/check_token")
    public Respond<Boolean> checkToken(@RequestParam int uid, @RequestParam String token) {
        boolean isValid = userMapper.checkToken(uid, token);
        return new Respond<>(isValid, "success", null);
    }
}
