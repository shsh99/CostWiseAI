package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import org.junit.jupiter.api.Test;

class ApprovalWorkflowServiceTest {

    private final PortfolioSummaryService portfolioSummaryService = new PortfolioSummaryService();
    private final AuditLogService auditLogService = new AuditLogService();
    private final ApprovalWorkflowService service =
            new ApprovalWorkflowService(portfolioSummaryService, auditLogService);

    @Test
    void submitTransitionsDraftToReviewAndWritesAuditEvent() {
        ApprovalWorkflowResponse response =
                service.transition("13", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        assertThat(response.status()).isEqualTo("REVIEW");
        assertThat(response.lastAction()).isEqualTo("SUBMIT");
        assertThat(response.auditEvents())
                .anySatisfy(
                        event -> {
                            assertThat(event.actor()).isEqualTo("기획 담당자");
                            assertThat(event.role()).isEqualTo("PLANNER");
                            assertThat(event.action()).isEqualTo("SUBMIT");
                            assertThat(event.detail()).isEqualTo("검토 요청");
                        });
    }

    @Test
    void commentKeepsCurrentStatusAndStillWritesAuditEvent() {
        service.transition("13", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        ApprovalWorkflowResponse response =
                service.transition("13", "DIVISION_HEAD", "COMMENT", "본부장", "원가 기준 재검토");

        assertThat(response.status()).isEqualTo("REVIEW");
        assertThat(response.lastAction()).isEqualTo("COMMENT");
        assertThat(response.auditEvents())
                .anySatisfy(
                        event -> {
                            assertThat(event.actor()).isEqualTo("본부장");
                            assertThat(event.role()).isEqualTo("DIVISION_HEAD");
                            assertThat(event.action()).isEqualTo("COMMENT");
                            assertThat(event.detail()).isEqualTo("원가 기준 재검토");
                        });
    }

    @Test
    void plannerCannotApproveProject() {
        service.transition("13", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        assertThatThrownBy(
                        () ->
                                service.transition(
                                        "13", "PLANNER", "APPROVE", "기획 담당자", "승인 시도"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot perform action");
    }

    @Test
    void approveRequiresReviewState() {
        assertThatThrownBy(
                        () ->
                                service.transition(
                                        "13",
                                        "FINANCE_REVIEWER",
                                        "APPROVE",
                                        "재무검토자",
                                        "검토 없이 승인"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only review projects");
    }
}
