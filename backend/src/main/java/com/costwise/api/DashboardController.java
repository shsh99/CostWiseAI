package com.costwise.api;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "finance-platform-backend",
                "timestamp", LocalDateTime.now().toString());
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "projectName", "보험사 신규 사업 의사결정 지원 플랫폼",
                "status", "검토중",
                "roles", List.of("기획자", "재무팀", "임원"),
                "npv", "₩3.4억",
                "irr", "16.8%",
                "paybackPeriod", "3.1년");
    }
}
