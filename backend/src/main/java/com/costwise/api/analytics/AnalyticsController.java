package com.costwise.api.analytics;

import com.costwise.api.dto.CostAccountingSummaryResponse;
import com.costwise.api.dto.ValuationRiskResponse;
import com.costwise.service.CostAccountingService;
import com.costwise.service.ValuationRiskService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalyticsController {

    private final CostAccountingService costAccountingService;
    private final ValuationRiskService valuationRiskService;

    public AnalyticsController(
            CostAccountingService costAccountingService, ValuationRiskService valuationRiskService) {
        this.costAccountingService = costAccountingService;
        this.valuationRiskService = valuationRiskService;
    }

    @GetMapping({"/cost-accounting", "/cost-accounting/summary"})
    public CostAccountingSummaryResponse costAccountingSummary() {
        return costAccountingService.loadSummary();
    }

    @GetMapping("/valuation-risk")
    public ValuationRiskResponse valuationRisk(@RequestParam String projectId) {
        return valuationRiskService.loadProjectDetail(projectId);
    }

    @GetMapping("/valuation-risk/projects/{projectId}")
    public ValuationRiskResponse projectDetail(@PathVariable String projectId) {
        return valuationRiskService.loadProjectDetail(projectId);
    }
}
