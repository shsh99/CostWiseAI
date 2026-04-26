package com.costwise.api.dashboard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.service.PortfolioSummaryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final PortfolioSummaryService portfolioSummaryService;

    public DashboardController(PortfolioSummaryService portfolioSummaryService) {
        this.portfolioSummaryService = portfolioSummaryService;
    }

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
                "portfolio", portfolioSummaryService.loadPortfolioSummary());
    }

    @GetMapping({"/portfolio", "/portfolio/summary"})
    public PortfolioSummaryResponse portfolioSummary() {
        return portfolioSummaryService.loadPortfolioSummary();
    }
}
