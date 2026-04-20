package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class ApprovalWorkflowServiceTest {

    private final PortfolioSummaryService portfolioSummaryService = new PortfolioSummaryService();
    private final AuditLogService auditLogService = new AuditLogService();
    private final ApprovalWorkflowService service =
            new ApprovalWorkflowService(portfolioSummaryService, auditLogService);

    @Test
    void submitTransitionsDraftToReviewAndWritesAuditEvent() {
        ApprovalWorkflowResponse response =
                service.transition("3", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

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
        service.transition("3", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        ApprovalWorkflowResponse response =
                service.transition("3", "FINANCE_REVIEWER", "COMMENT", "재무검토자", "원가 기준 재검토");

        assertThat(response.status()).isEqualTo("REVIEW");
        assertThat(response.lastAction()).isEqualTo("COMMENT");
        assertThat(response.auditEvents())
                .anySatisfy(
                        event -> {
                            assertThat(event.actor()).isEqualTo("재무검토자");
                            assertThat(event.role()).isEqualTo("FINANCE_REVIEWER");
                            assertThat(event.action()).isEqualTo("COMMENT");
                            assertThat(event.detail()).isEqualTo("원가 기준 재검토");
                        });
    }

    @Test
    void plannerCannotApproveProject() {
        service.transition("3", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        assertThatThrownBy(
                        () ->
                                service.transition(
                                        "3", "PLANNER", "APPROVE", "기획 담당자", "승인 시도"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("cannot perform action");
    }

    @Test
    void approveRequiresReviewState() {
        assertThatThrownBy(
                        () ->
                                service.transition(
                                        "3",
                                        "FINANCE_REVIEWER",
                                        "APPROVE",
                                        "재무검토자",
                                        "검토 없이 승인"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only review projects");
    }

    @Test
    void loadWorkflowDoesNotMutateStateAcrossRepeatedReads() {
        ApprovalWorkflowResponse first = service.loadWorkflow("3");
        ApprovalWorkflowResponse second = service.loadWorkflow("3");

        assertThat(second).isEqualTo(first);
    }

    @Test
    void duplicateSubmitIsRejectedAfterTheFirstTransition() {
        ApprovalWorkflowResponse first = service.transition("3", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청");

        assertThat(first.status()).isEqualTo("REVIEW");
        assertThatThrownBy(
                        () ->
                                service.transition(
                                        "3", "PLANNER", "SUBMIT", "기획 담당자", "검토 요청"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only draft projects");
    }
}
