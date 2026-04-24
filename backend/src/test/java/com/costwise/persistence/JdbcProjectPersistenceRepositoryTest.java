package com.costwise.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.costwise.api.dto.persistence.AnalysisUpsertRequest;
import com.costwise.api.dto.persistence.CreateProjectRequest;
import com.costwise.api.dto.persistence.CreateScenarioRequest;
import com.costwise.api.dto.persistence.UpdateProjectRequest;
import com.costwise.api.dto.persistence.UpdateScenarioRequest;
import com.costwise.config.AuditPersistenceProperties;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.List;
import org.junit.jupiter.api.Test;

class JdbcProjectPersistenceRepositoryTest {

    @Test
    void projectsAndScenariosAreReadableAcrossServiceRecreation() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:persistence-restart;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        createSchema(jdbcUrl);
        AuditPersistenceProperties properties = new AuditPersistenceProperties(null, jdbcUrl, "sa", "", "disable");

        PersistenceService writer = new PersistenceService(new JdbcProjectPersistenceRepository(properties));
        var project = writer.createProject(new CreateProjectRequest(
                "PJT-DB-001",
                "DB 저장 프로젝트",
                "new_business",
                "restart test"));
        var scenario = writer.createScenario(project.id(), new CreateScenarioRequest(
                "Base",
                "기준 시나리오",
                true,
                true));

        PersistenceService reader = new PersistenceService(new JdbcProjectPersistenceRepository(properties));
        var detail = reader.getProjectDetail(project.id());

        assertThat(detail.code()).isEqualTo("PJT-DB-001");
        assertThat(detail.name()).isEqualTo("DB 저장 프로젝트");
        assertThat(detail.approval().status()).isEqualTo("draft");
        assertThat(detail.approval().lastAction()).isEqualTo("created");
        assertThat(detail.scenarios()).hasSize(1);
        assertThat(detail.scenarios().getFirst().id()).isEqualTo(scenario.id());
        assertThat(detail.scenarios().getFirst().name()).isEqualTo("Base");
    }

    @Test
    void analysisResultsAndApprovalHistoryAreReadableAcrossServiceRecreation() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:persistence-analysis;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        createSchema(jdbcUrl);
        AuditPersistenceProperties properties = new AuditPersistenceProperties(null, jdbcUrl, "sa", "", "disable");

        PersistenceService writer = new PersistenceService(new JdbcProjectPersistenceRepository(properties));
        var project = writer.createProject(new CreateProjectRequest(
                "PJT-DB-ANALYSIS",
                "분석 저장 프로젝트",
                "new_business",
                "analysis restart test"));
        var scenario = writer.createScenario(project.id(), new CreateScenarioRequest(
                "Base",
                "기준 시나리오",
                true,
                true));

        writer.upsertAnalysis(
                project.id(),
                scenario.id(),
                new AnalysisUpsertRequest(
                        List.of(new AnalysisUpsertRequest.AllocationRuleInput(
                                "D-001",
                                "manual",
                                new BigDecimal("1.000000"),
                                new BigDecimal("1000000.00"),
                                "공통비",
                                "shared",
                                new BigDecimal("1000000.00"))),
                        List.of(new AnalysisUpsertRequest.CashFlowInput(
                                0,
                                "현재",
                                "2026",
                                new BigDecimal("500000.00"),
                                new BigDecimal("-200000.00"),
                                BigDecimal.ZERO,
                                new BigDecimal("0.080000"))),
                        new AnalysisUpsertRequest.ValuationInput(
                                new BigDecimal("0.080000"),
                                new BigDecimal("300000.00"),
                                new BigDecimal("0.120000"),
                                new BigDecimal("2.50"),
                                "recommend",
                                JsonNodeFactory.instance.objectNode().put("growthRate", 0.03)),
                        new AnalysisUpsertRequest.ApprovalInput(
                                "planner",
                                "plan-user",
                                "allocated",
                                "분석 반영",
                                "in_review")));

        PersistenceService reader = new PersistenceService(new JdbcProjectPersistenceRepository(properties));
        var detail = reader.getProjectDetail(project.id());
        var scenarioDetail = detail.scenarios().getFirst();

        assertThat(detail.status()).isEqualTo("in_review");
        assertThat(detail.approval().status()).isEqualTo("in_review");
        assertThat(detail.approval().lastAction()).isEqualTo("allocated");
        assertThat(detail.approval().lastActor()).isEqualTo("plan-user");
        assertThat(detail.approval().logs()).hasSize(1);
        assertThat(scenarioDetail.allocationRules()).hasSize(1);
        assertThat(scenarioDetail.allocationRules().getFirst().departmentCode()).isEqualTo("D-001");
        assertThat(scenarioDetail.cashFlows()).hasSize(1);
        assertThat(scenarioDetail.cashFlows().getFirst().netCashFlow()).isEqualByComparingTo("300000.00");
        assertThat(scenarioDetail.valuation()).isNotNull();
        assertThat(scenarioDetail.valuation().decision()).isEqualTo("recommend");
        assertThat(scenarioDetail.valuation().assumptions().path("growthRate").asDouble()).isEqualTo(0.03);
    }

    @Test
    void multipleScenarioAnalysesRemainReadableFromSingleProjectDetailLookup() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:persistence-multi-scenario;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        createSchema(jdbcUrl);
        AuditPersistenceProperties properties = new AuditPersistenceProperties(null, jdbcUrl, "sa", "", "disable");

        PersistenceService service = new PersistenceService(new JdbcProjectPersistenceRepository(properties));
        var project = service.createProject(new CreateProjectRequest(
                "PJT-DB-MULTI",
                "복수 시나리오 프로젝트",
                "new_business",
                "multi scenario analysis"));
        var base = service.createScenario(project.id(), new CreateScenarioRequest("Base", "기준", true, true));
        var stress = service.createScenario(project.id(), new CreateScenarioRequest("Stress", "스트레스", false, true));

        service.upsertAnalysis(project.id(), base.id(), new AnalysisUpsertRequest(
                List.of(new AnalysisUpsertRequest.AllocationRuleInput(
                        "D-BASE",
                        "manual",
                        new BigDecimal("1.000000"),
                        new BigDecimal("900000.00"),
                        "기준 공통비",
                        "shared",
                        new BigDecimal("900000.00"))),
                List.of(new AnalysisUpsertRequest.CashFlowInput(
                        0,
                        "현재",
                        "2026",
                        new BigDecimal("450000.00"),
                        new BigDecimal("-200000.00"),
                        BigDecimal.ZERO,
                        new BigDecimal("0.080000"))),
                new AnalysisUpsertRequest.ValuationInput(
                        new BigDecimal("0.080000"),
                        new BigDecimal("250000.00"),
                        new BigDecimal("0.110000"),
                        new BigDecimal("2.20"),
                        "recommend",
                        JsonNodeFactory.instance.objectNode().put("tag", "base")),
                new AnalysisUpsertRequest.ApprovalInput(
                        "planner",
                        "base-user",
                        "allocated",
                        "base 반영",
                        "in_review")));

        service.upsertAnalysis(project.id(), stress.id(), new AnalysisUpsertRequest(
                List.of(new AnalysisUpsertRequest.AllocationRuleInput(
                        "D-STRESS",
                        "manual",
                        new BigDecimal("1.000000"),
                        new BigDecimal("1200000.00"),
                        "스트레스 공통비",
                        "shared",
                        new BigDecimal("1200000.00"))),
                List.of(new AnalysisUpsertRequest.CashFlowInput(
                        0,
                        "현재",
                        "2026",
                        new BigDecimal("300000.00"),
                        new BigDecimal("-250000.00"),
                        BigDecimal.ZERO,
                        new BigDecimal("0.090000"))),
                new AnalysisUpsertRequest.ValuationInput(
                        new BigDecimal("0.090000"),
                        new BigDecimal("50000.00"),
                        new BigDecimal("0.070000"),
                        new BigDecimal("3.80"),
                        "review",
                        JsonNodeFactory.instance.objectNode().put("tag", "stress")),
                new AnalysisUpsertRequest.ApprovalInput(
                        "planner",
                        "stress-user",
                        "evaluated",
                        "stress 반영",
                        "in_review")));

        var detail = service.getProjectDetail(project.id());

        assertThat(detail.scenarios()).hasSize(2);
        var baseDetail = detail.scenarios().stream()
                .filter(scenario -> scenario.id().equals(base.id()))
                .findFirst()
                .orElseThrow();
        var stressDetail = detail.scenarios().stream()
                .filter(scenario -> scenario.id().equals(stress.id()))
                .findFirst()
                .orElseThrow();
        assertThat(baseDetail.allocationRules()).hasSize(1);
        assertThat(baseDetail.allocationRules().getFirst().departmentCode()).isEqualTo("D-BASE");
        assertThat(baseDetail.valuation()).isNotNull();
        assertThat(baseDetail.valuation().assumptions().path("tag").asText()).isEqualTo("base");
        assertThat(stressDetail.cashFlows()).hasSize(1);
        assertThat(stressDetail.cashFlows().getFirst().netCashFlow()).isEqualByComparingTo("50000.00");
        assertThat(stressDetail.valuation()).isNotNull();
        assertThat(stressDetail.valuation().assumptions().path("tag").asText()).isEqualTo("stress");
    }

    @Test
    void projectAndScenarioCrudUseDatabaseState() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:persistence-crud;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        createSchema(jdbcUrl);
        AuditPersistenceProperties properties = new AuditPersistenceProperties(null, jdbcUrl, "sa", "", "disable");
        PersistenceService service = new PersistenceService(new JdbcProjectPersistenceRepository(properties));

        var project = service.createProject(new CreateProjectRequest(
                "PJT-DB-002",
                "초기 프로젝트",
                "new_business",
                "before update"));
        var updatedProject = service.updateProject(project.id(), new UpdateProjectRequest(
                "수정 프로젝트",
                "renewal",
                "after update",
                "in_review"));

        assertThat(updatedProject.name()).isEqualTo("수정 프로젝트");
        assertThat(service.getProjectDetail(project.id()).approval().status()).isEqualTo("in_review");

        var scenario = service.createScenario(project.id(), new CreateScenarioRequest(
                "Base",
                "before update",
                true,
                true));
        var updatedScenario = service.updateScenario(project.id(), scenario.id(), new UpdateScenarioRequest(
                "Stress",
                "after update",
                false,
                false));

        assertThat(updatedScenario.name()).isEqualTo("Stress");
        assertThat(service.getProjectDetail(project.id()).scenarios().getFirst().isActive()).isFalse();

        service.deleteScenario(project.id(), scenario.id());
        assertThat(service.getProjectDetail(project.id()).scenarios()).isEmpty();

        service.deleteProject(project.id());
        assertThatThrownBy(() -> service.getProjectDetail(project.id()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown project id");
    }

    @Test
    void duplicateProjectCodeAndScenarioNameAreRejectedByDatabaseBackedService() throws Exception {
        String jdbcUrl = "jdbc:h2:mem:persistence-duplicates;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE";
        createSchema(jdbcUrl);
        AuditPersistenceProperties properties = new AuditPersistenceProperties(null, jdbcUrl, "sa", "", "disable");
        PersistenceService service = new PersistenceService(new JdbcProjectPersistenceRepository(properties));

        var project = service.createProject(new CreateProjectRequest(
                "PJT-DB-003",
                "중복 테스트",
                "new_business",
                null));
        service.createScenario(project.id(), new CreateScenarioRequest("Base", null, true, true));

        assertThatThrownBy(() -> service.createProject(new CreateProjectRequest(
                        "PJT-DB-003",
                        "중복 프로젝트",
                        "new_business",
                        null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Project code already exists");
        assertThatThrownBy(() -> service.createScenario(
                        project.id(),
                        new CreateScenarioRequest("base", null, false, true)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Scenario name already exists");
    }

    private void createSchema(String jdbcUrl) throws Exception {
        try (Connection connection = DriverManager.getConnection(jdbcUrl, "sa", "");
                Statement statement = connection.createStatement()) {
            statement.execute("""
                    create table projects (
                      id uuid default random_uuid() primary key,
                      code text not null unique,
                      name text not null,
                      business_type text not null default 'new_business',
                      status text not null default 'draft',
                      description text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    create table departments (
                      id uuid default random_uuid() primary key,
                      code text not null unique,
                      name text not null,
                      sort_order integer not null default 0
                    )
                    """);
            statement.execute("""
                    create table scenarios (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      name text not null,
                      description text,
                      is_baseline boolean not null default false,
                      is_active boolean not null default true,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, name)
                    )
                    """);
            statement.execute("""
                    create table cost_pools (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      name text not null,
                      category text not null,
                      amount numeric(14, 2) not null,
                      currency char(3) not null default 'KRW',
                      description text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    create table allocation_rules (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      cost_pool_id uuid not null references cost_pools (id) on delete cascade,
                      department_id uuid not null references departments (id),
                      basis text not null,
                      allocation_rate numeric(7, 6) not null,
                      allocated_amount numeric(14, 2) not null,
                      created_at timestamp not null default current_timestamp,
                      unique (scenario_id, cost_pool_id, department_id)
                    )
                    """);
            statement.execute("""
                    create table cash_flows (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      period_no integer not null,
                      period_label text not null,
                      year_label text not null,
                      operating_cash_flow numeric(14, 2) not null default 0,
                      investment_cash_flow numeric(14, 2) not null default 0,
                      financing_cash_flow numeric(14, 2) not null default 0,
                      net_cash_flow numeric(14, 2) not null,
                      discount_rate numeric(8, 6) not null,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, scenario_id, period_no)
                    )
                    """);
            statement.execute("""
                    create table valuation_results (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      discount_rate numeric(8, 6) not null,
                      npv numeric(14, 2) not null,
                      irr numeric(8, 6) not null,
                      payback_period numeric(8, 2) not null,
                      decision text not null,
                      assumptions clob not null,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, scenario_id)
                    )
                    """);
            statement.execute("""
                    create table approval_logs (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      actor_role text not null,
                      actor_name text not null,
                      action text not null,
                      comment text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
        }
    }
}
