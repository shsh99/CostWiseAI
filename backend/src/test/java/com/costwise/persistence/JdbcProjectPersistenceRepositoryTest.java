package com.costwise.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.costwise.api.dto.persistence.CreateProjectRequest;
import com.costwise.api.dto.persistence.CreateScenarioRequest;
import com.costwise.api.dto.persistence.UpdateProjectRequest;
import com.costwise.api.dto.persistence.UpdateScenarioRequest;
import com.costwise.config.AuditPersistenceProperties;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
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
        }
    }
}
