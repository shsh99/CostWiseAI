package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

class ApprovalWorkflowServiceTest {

    private final PortfolioSummaryService portfolioSummaryService = new PortfolioSummaryService();
    private final AuditLogService auditLogService = new AuditLogService(new InMemoryAuditLogRepository());
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

    private static final class InMemoryAuditLogRepository implements AuditLogRepository {

        private long sequence = 0L;
        private final List<StoredAuditEntry> entries = new ArrayList<>();

        @Override
        public StoredAuditEntry append(NewAuditEntry entry) {
            long id = ++sequence;
            StoredAuditEntry stored = new StoredAuditEntry(
                    id,
                    entry.projectId(),
                    entry.eventType(),
                    entry.actorRole(),
                    entry.actorId(),
                    entry.action(),
                    entry.target(),
                    entry.result(),
                    entry.metadata() == null ? JsonNodeFactory.instance.objectNode() : entry.metadata(),
                    entry.requestContext() == null ? JsonNodeFactory.instance.objectNode() : entry.requestContext(),
                    entry.occurredAt(),
                    entry.createdAt());
            entries.add(stored);
            return stored;
        }

        @Override
        public List<StoredAuditEntry> query(QueryFilter filter, int fetchSize) {
            return entries.stream()
                    .filter(entry -> entry.projectId().equals(filter.projectId()))
                    .filter(entry -> filter.eventType() == null || entry.eventType().equalsIgnoreCase(filter.eventType()))
                    .filter(entry -> filter.from() == null || !entry.occurredAt().isBefore(filter.from()))
                    .filter(entry -> filter.to() == null || !entry.occurredAt().isAfter(filter.to()))
                    .filter(entry -> filter.cursor() == null || entry.id() < filter.cursor())
                    .sorted(Comparator.comparingLong(StoredAuditEntry::id).reversed())
                    .limit(fetchSize)
                    .toList();
        }
    }
}
