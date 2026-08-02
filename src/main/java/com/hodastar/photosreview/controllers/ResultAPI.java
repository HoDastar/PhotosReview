package com.hodastar.photosreview.controllers;

import com.hodastar.photosreview.entities.EntityReviewPhotos;
import com.hodastar.photosreview.entities.EntityReviewProj;
import com.hodastar.photosreview.mappers.ProjMapper;
import com.hodastar.photosreview.mappers.ReviewMapper;
import com.hodastar.photosreview.mappers.UserMapper;
import com.hodastar.photosreview.utils.Respond;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 管理端结果统计接口。
 *
 * <p>当前负责汇总工程初审结果，并在接口内部完成争议照片判定。统计口径以单张照片的
 * 初审平均分为基础；争议判定只对有效评分人数不少于四人的照片执行。</p>
 */
@RestController
@RequestMapping("/api/result")
public class ResultAPI {
    // 同一管理员对同一工程重新获取初审结果的冷却时间，单位为毫秒。
    private static final long PRELIMINARY_RESULT_COOLDOWN_MS = 60_000L;
    // 参与争议判定所需的最少有效评分人数。
    private static final int MIN_DISPUTE_REVIEWERS = 4;
    // 分歧指数超过该阈值时，将照片判定为争议照片。
    private static final double DISPUTE_THRESHOLD = 0.4;

    private final UserMapper userMapper;
    private final ProjMapper projMapper;
    private final ReviewMapper reviewMapper;
    // 用于解析数据库中以 JSON 字符串保存的评分数据。
    private final ObjectMapper jsonMapper = new ObjectMapper();
    // 冷却键格式为“管理员 UID:工程 ID”，值为最近一次成功开始统计的时间戳。
    private final Map<String, Long> preliminaryResultCooldown = new ConcurrentHashMap<>();

    public ResultAPI(UserMapper userMapper, ProjMapper projMapper, ReviewMapper reviewMapper) {
        this.userMapper = userMapper;
        this.projMapper = projMapper;
        this.reviewMapper = reviewMapper;
    }

    /**
     * 获取指定工程的初审总体数据和争议照片数组。
     *
     * @param projId 工程 ID
     * @param adminUid 管理员 UID
     * @param adminToken 管理员身份令牌
     * @return 初审统计结果；鉴权、工程不存在或冷却未结束时返回对应错误
     */
    @GetMapping("/preliminary")
    public Respond<HashMap<String, Object>> getPreliminaryResult(
            @RequestParam("projId") String projId,
            @RequestParam("adminUid") int adminUid,
            @RequestParam("adminToken") String adminToken
    ) {
        // 结果数据仅允许通过管理员身份读取。
        if (!userMapper.checkAdmin(adminUid, adminToken)) {
            return new Respond<>(false, "5", null);
        }

        // 在统计前确认工程存在，避免继续查询无效工程的照片数据。
        Optional<EntityReviewProj> projOpt = projMapper.getProjById(projId);
        if (projOpt.isEmpty()) {
            return new Respond<>(false, "14", null);
        }

        // 冷却按管理员和工程分别计时，不影响其他管理员或其他工程。
        String cooldownKey = adminUid + ":" + projId;
        long now = System.currentTimeMillis();
        Long lastFetchTime = preliminaryResultCooldown.get(cooldownKey);
        if (lastFetchTime != null && now - lastFetchTime < PRELIMINARY_RESULT_COOLDOWN_MS) {
            return new Respond<>(false, "28", null);
        }
        preliminaryResultCooldown.put(cooldownKey, now);

        EntityReviewProj proj = projOpt.get();
        // preliminaryScores 保存每张已评分照片的初审平均分，用于计算总体统计值。
        List<EntityReviewPhotos> photos = reviewMapper.getAllPhotos(projId, null);
        List<Double> preliminaryScores = new ArrayList<>();
        List<HashMap<String, Object>> disputePhotos = new ArrayList<>();

        for (EntityReviewPhotos photo : photos) {
            // 按工程模式解析评分，同时过滤格式无效或超出 [0, Max] 的分数。
            List<Double> scores = extractValidScores(photo.value, proj.type, proj.max);
            if (scores.isEmpty()) {
                // 没有有效评分的照片不计入“已评分总量”和后续总体统计。
                continue;
            }

            // 单张照片的初审分数取该照片全部有效评分的算术平均值。
            double photoScore = mean(scores);
            preliminaryScores.add(photoScore);

            // 少于四名评分人员时不进行分歧或离群判断。
            if (scores.size() >= MIN_DISPUTE_REVIEWERS) {
                double disagreementIndex = calculateDisagreementIndex(scores, proj.max);
                boolean hasOutlier = hasOutlier(scores, proj.max);
                // 分歧指数超限或存在离群值，任一条件成立即列为争议照片。
                if (disagreementIndex > DISPUTE_THRESHOLD || hasOutlier) {
                    HashMap<String, Object> disputePhoto = new HashMap<>();
                    disputePhoto.put("photoid", photo.id);
                    disputePhoto.put("name", photo.name);
                    disputePhoto.put("author", photo.author);
                    disputePhoto.put("value", roundOne(photoScore));
                    disputePhotos.add(disputePhoto);
                }
            }
        }

        // 以下四项均以单张照片的初审平均分为统计样本。
        double preliminaryAverage = mean(preliminaryScores);
        double preliminaryVariance = populationVariance(preliminaryScores, preliminaryAverage);
        int scoredTotal = preliminaryScores.size();
        int disputeCount = disputePhotos.size();
        // 接口中的争议率使用百分数表达，例如 7.1 表示 7.1%。
        double disputeRate = scoredTotal == 0 ? 0.0 : disputeCount * 100.0 / scoredTotal;

        // 数值展示精度统一为 0.1，及格线固定为 Max 的 60%。
        HashMap<String, Object> data = new HashMap<>();
        data.put("projectId", proj.projId);
        data.put("projectName", proj.name);
        data.put("max", proj.max);
        data.put("passingScore", roundOne(proj.max * 0.6));
        data.put("scorePrecision", 0.1);
        data.put("scoredTotal", scoredTotal);
        data.put("disputeCount", disputeCount);
        data.put("disputeRate", roundOne(disputeRate));
        data.put("preliminaryAverage", roundOne(preliminaryAverage));
        data.put("preliminaryVariance", roundOne(preliminaryVariance));
        data.put("disputePhotos", disputePhotos);
        return new Respond<>(true, "success", data);
    }

    /**
     * 从照片评分字段中提取有效分数。
     *
     * <p>普通评审模式的数据结构为“评分人员 UID -> [分数, 评语]”；
     * 筛片模式的数据结构为“[评分人员 UID, 分数, 评语]”。</p>
     *
     * @param value 数据库中的评分 JSON 字符串
     * @param projectType 工程类型，0 为普通评审，1 为筛片模式
     * @param maxScore 工程满分 Max
     * @return 范围在 [0, Max] 内的有效分数
     */
    private List<Double> extractValidScores(String value, int projectType, int maxScore) {
        List<Double> scores = new ArrayList<>();
        if (value == null || value.isBlank() || maxScore <= 0) {
            return scores;
        }

        try {
            if (projectType == 0) {
                // 普通评审可包含多名评分人员，因此遍历映射中的全部评分记录。
                Map<String, List<Object>> reviewValues = jsonMapper.readValue(
                        value,
                        new TypeReference<HashMap<String, List<Object>>>() {}
                );
                for (List<Object> review : reviewValues.values()) {
                    if (review != null && !review.isEmpty()) {
                        addValidScore(scores, review.get(0), maxScore);
                    }
                }
            } else if (projectType == 1) {
                // 筛片模式为单评结构，分数位于数组下标 1。
                List<Object> screeningValue = jsonMapper.readValue(
                        value,
                        new TypeReference<List<Object>>() {}
                );
                if (screeningValue.size() > 1) {
                    addValidScore(scores, screeningValue.get(1), maxScore);
                }
            }
        } catch (Exception ignored) {
            // 单条历史数据格式异常时忽略该条，避免中断整个工程的统计。
        }
        return scores;
    }

    /**
     * 校验并加入单个评分。
     *
     * @param scores 有效评分集合
     * @param scoreValue 待校验的评分值
     * @param maxScore 工程满分 Max
     */
    private void addValidScore(List<Double> scores, Object scoreValue, int maxScore) {
        if (!(scoreValue instanceof Number number)) {
            return;
        }
        double score = number.doubleValue();
        if (Double.isFinite(score) && score >= 0.0 && score <= maxScore) {
            scores.add(score);
        }
    }

    /**
     * 计算分歧指数，返回值限制在 [0, 1]。
     *
     * <p>计算公式：标准差标准化值 × 45% + 极差标准化值 × 35%
     * + 两极化程度 × 20%。标准差以 Max/2 标准化，极差以 Max 标准化。</p>
     */
    private double calculateDisagreementIndex(List<Double> scores, int maxScore) {
        double average = mean(scores);
        double standardDeviation = Math.sqrt(populationVariance(scores, average));
        double min = Collections.min(scores);
        double max = Collections.max(scores);
        // 对 [0, Max] 范围内的分数，理论最大标准差为 Max/2。
        double standardDeviationNormalized = clamp(standardDeviation / (maxScore / 2.0));
        // 极差除以 Max 后自然落在 [0, 1]。
        double rangeNormalized = clamp((max - min) / maxScore);
        double polarization = calculatePolarization(scores, maxScore);
        return clamp(
                standardDeviationNormalized * 0.45
                        + rangeNormalized * 0.35
                        + polarization * 0.20
        );
    }

    /**
     * 计算评分的两极化程度。
     *
     * <p>低分组定义为不高于 Max × 40%，高分组定义为不低于 Max × 60%。
     * 最终值由两端评分覆盖率、两组人数均衡度和两组均值间距相乘得到；
     * 任一端没有评分时视为未形成两极化。</p>
     *
     * @return 范围在 [0, 1] 内的两极化程度
     */
    private double calculatePolarization(List<Double> scores, int maxScore) {
        List<Double> lowScores = scores.stream()
                .filter(score -> score <= maxScore * 0.4)
                .toList();
        List<Double> highScores = scores.stream()
                .filter(score -> score >= maxScore * 0.6)
                .toList();
        int extremeCount = lowScores.size() + highScores.size();
        if (lowScores.isEmpty() || highScores.isEmpty() || extremeCount == 0) {
            return 0.0;
        }

        // 覆盖率表示落在低分端或高分端的评分占比。
        double coverage = extremeCount / (double) scores.size();
        // 均衡度在两端人数相等时为 1，人数越失衡则越接近 0。
        double balance = 2.0 * Math.min(lowScores.size(), highScores.size()) / extremeCount;
        // 间距以 Max 标准化，表示高低两组平均分相距多远。
        double separation = (mean(highScores) - mean(lowScores)) / maxScore;
        return clamp(coverage * balance * separation);
    }

    /**
     * 判断评分集合中是否存在离群值。
     *
     * <p>先使用四分位距法检查 1.5 × IQR 围栏；若未检出，再使用基于中位数
     * 绝对偏差的修正 Z 分数检查。MAD 为零时，以偏离中位数超过 Max × 35%
     * 作为兜底规则。</p>
     *
     * @return 存在任一离群评分时返回 true
     */
    private boolean hasOutlier(List<Double> scores, int maxScore) {
        // 四分位数和中位数的计算都要求数据按升序排列。
        List<Double> sorted = new ArrayList<>(scores);
        Collections.sort(sorted);
        int middle = sorted.size() / 2;
        List<Double> lowerHalf = sorted.subList(0, middle);
        List<Double> upperHalf = sorted.subList((sorted.size() + 1) / 2, sorted.size());
        double q1 = median(lowerHalf);
        double q3 = median(upperHalf);
        double iqr = q3 - q1;
        // Tukey 围栏：低于 Q1 - 1.5×IQR 或高于 Q3 + 1.5×IQR 即为离群。
        double lowerFence = q1 - 1.5 * iqr;
        double upperFence = q3 + 1.5 * iqr;
        if (sorted.stream().anyMatch(score -> score < lowerFence || score > upperFence)) {
            return true;
        }

        // MAD 对少量极端值不敏感，适合作为第二层稳健离群检测。
        double median = median(sorted);
        List<Double> deviations = sorted.stream()
                .map(score -> Math.abs(score - median))
                .sorted()
                .toList();
        double mad = median(deviations);
        if (mad > 0.0) {
            // 0.6745 为正态分布下的尺度修正常数，3.5 为常用离群阈值。
            return sorted.stream()
                    .anyMatch(score -> 0.6745 * Math.abs(score - median) / mad > 3.5);
        }
        // 所有绝对偏差的中位数为零时，改用相对于 Max 的固定距离兜底。
        return sorted.stream().anyMatch(score -> Math.abs(score - median) > maxScore * 0.35);
    }

    /**
     * 计算算术平均值；空集合返回 0。
     */
    private double mean(List<Double> values) {
        if (values.isEmpty()) {
            return 0.0;
        }
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    /**
     * 计算总体方差；空集合返回 0。
     */
    private double populationVariance(List<Double> values, double average) {
        if (values.isEmpty()) {
            return 0.0;
        }
        return values.stream()
                .mapToDouble(value -> Math.pow(value - average, 2))
                .average()
                .orElse(0.0);
    }

    /**
     * 计算已按升序排列集合的中位数；空集合返回 0。
     */
    private double median(List<Double> sortedValues) {
        if (sortedValues.isEmpty()) {
            return 0.0;
        }
        int middle = sortedValues.size() / 2;
        if (sortedValues.size() % 2 == 0) {
            return (sortedValues.get(middle - 1) + sortedValues.get(middle)) / 2.0;
        }
        return sortedValues.get(middle);
    }

    /**
     * 将数值四舍五入到一位小数。
     */
    private double roundOne(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    /**
     * 将数值限制在 [0, 1] 区间。
     */
    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

}
