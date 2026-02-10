# PhotoReview Server

Overview
- Provides auth (JWT), email verification.

Quick start
```bash
git clone https://github.com/yourname/ReclightServer.git
cd ReclightServer

# Set minimal env vars
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/reclight
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=pass
export JWT_SECRET=change_this_secret

# Run (Unix)
./mvnw spring-boot:run

# Windows (PowerShell)
.\mvnw spring-boot:run
```

Modal error code
```aiignore
 * 1: 参数错误
 * 2: 密码错误
 * 3: uid已占用
 * 4: Token无效
 * 5: 注册权限不足
 * 6: 字符过长
 * 7: uid无效
 * 8: 不支持的文件类型
 * 9: 文件过大
 * 10: 文件不存在
 * -1: 数据库操作失败
```


Build
```bash
./mvnw clean package -DskipTests
java -jar target/*.jar
```

Notes
- Redis is optional. Use secrets for production credentials.
- Open an issue or PR on GitHub for contributions.
