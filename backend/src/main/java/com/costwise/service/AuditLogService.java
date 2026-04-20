package com.costwise.service;

import com.costwise.api.dto.ApprovalWorkflowResponse.AuditEvent;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final List<AuditEntry> entries = new CopyOnWriteArrayList<>(List.of(
            new AuditEntry(
                    LocalDateTime.parse("2026-04-18T10:18:00"),
                    "전략기획실",
                    "PLANNER",
                    "CREATE",
                    "포트폴리오 초안을 등록했습니다.",
                    "PORTFOLIO"),
            new AuditEntry(
                    LocalDateTime.parse("2026-04-19T14:07:00"),
                    "재무검토팀",
                    "FINANCE_REVIEWER",
                    "REVIEW",
                    "ABC 배부 기준을 검토했습니다.",
                    "ABC"),
            new AuditEntry(
                    LocalDateTime.parse("2026-04-20T09:12:00"),
                    "임원",
                    "EXECUTIVE",
                    "APPROVE",
                    "상위 5개 프로젝트를 조건부 진행으로 전환했습니다.",
                    "DCF"),
            new AuditEntry(
                    LocalDateTime.parse("2026-04-20T11:42:00"),
                    "보안운영팀",
                    "SECURITY",
                    "APPROVE",
                    "권한 및 감사 로그 정책을 승인했습니다.",
                    "ACCESS")));

    public void record(String projectId, String actor, String role, String action, String detail) {
        entries.add(new AuditEntry(LocalDateTime.now(), actor, role, action, detail, projectId));
    }

    public List<AuditEvent> recentEvents() {
        return entries.stream()
                .sorted(Comparator.comparing(AuditEntry::at).reversed())
                .map(entry -> new AuditEvent(entry.at(), entry.actor(), entry.role(), entry.action(), entry.detail()))
                .toList();
    }

    public List<AuditEvent> eventsForProject(String projectId) {
        return entries.stream()
                .filter(entry -> projectId.equals(entry.projectId()))
                .sorted(Comparator.comparing(AuditEntry::at).reversed())
                .map(entry -> new AuditEvent(entry.at(), entry.actor(), entry.role(), entry.action(), entry.detail()))
                .toList();
    }

    private record AuditEntry(
            LocalDateTime at,
            String actor,
            String role,
            String action,
            String detail,
            String projectId) {}
}
