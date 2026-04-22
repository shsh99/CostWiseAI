package com.costwise.persistence;

import com.costwise.config.AuditPersistenceProperties;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcProjectPersistenceRepository implements ProjectPersistenceRepository {

    private final AuditPersistenceProperties persistenceProperties;

    public JdbcProjectPersistenceRepository(AuditPersistenceProperties persistenceProperties) {
        this.persistenceProperties = persistenceProperties;
    }

    @Override
    public ProjectRecord createProject(NewProject project) {
        String sql = """
                insert into projects (code, name, business_type, status, description)
                values (?, ?, ?, ?, ?)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, project.code());
            statement.setString(2, project.name());
            statement.setString(3, project.businessType());
            statement.setString(4, project.status());
            statement.setString(5, project.description());
            statement.executeUpdate();
            return findProject(readGeneratedUuid(statement)).orElseThrow(
                    () -> new IllegalStateException("Failed to read created project"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create project", exception);
        }
    }

    @Override
    public ProjectRecord updateProject(ProjectUpdate project) {
        String sql = """
                update projects
                   set name = ?,
                       business_type = ?,
                       status = ?,
                       description = ?
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, project.name());
            statement.setString(2, project.businessType());
            statement.setString(3, project.status());
            statement.setString(4, project.description());
            statement.setObject(5, uuid(project.id()));
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown project id: " + project.id());
            }
            return findProject(project.id()).orElseThrow(
                    () -> new IllegalStateException("Failed to read updated project"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update project", exception);
        }
    }

    @Override
    public void deleteProject(String projectId) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("delete from projects where id = ?")) {
            statement.setObject(1, uuid(projectId));
            int deleted = statement.executeUpdate();
            if (deleted == 0) {
                throw new IllegalArgumentException("Unknown project id: " + projectId);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to delete project", exception);
        }
    }

    @Override
    public Optional<ProjectRecord> findProject(String projectId) {
        String sql = """
                select id, code, name, business_type, status, description, created_at
                  from projects
                 where id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toProject(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find project", exception);
        }
    }

    @Override
    public boolean existsProjectCode(String code) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("select 1 from projects where code = ?")) {
            statement.setString(1, code);
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to check project code", exception);
        }
    }

    @Override
    public ScenarioRecord createScenario(String projectId, NewScenario scenario) {
        String sql = """
                insert into scenarios (project_id, name, description, is_baseline, is_active)
                values (?, ?, ?, ?, ?)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            statement.setObject(1, uuid(projectId));
            statement.setString(2, scenario.name());
            statement.setString(3, scenario.description());
            statement.setBoolean(4, scenario.isBaseline());
            statement.setBoolean(5, scenario.isActive());
            statement.executeUpdate();
            return findScenario(projectId, readGeneratedUuid(statement)).orElseThrow(
                    () -> new IllegalStateException("Failed to read created scenario"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create scenario", exception);
        }
    }

    @Override
    public ScenarioRecord updateScenario(String projectId, ScenarioUpdate scenario) {
        String sql = """
                update scenarios
                   set name = ?,
                       description = ?,
                       is_baseline = ?,
                       is_active = ?
                 where project_id = ?
                   and id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, scenario.name());
            statement.setString(2, scenario.description());
            statement.setBoolean(3, scenario.isBaseline());
            statement.setBoolean(4, scenario.isActive());
            statement.setObject(5, uuid(projectId));
            statement.setObject(6, uuid(scenario.id()));
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown scenario id: " + scenario.id());
            }
            return findScenario(projectId, scenario.id()).orElseThrow(
                    () -> new IllegalStateException("Failed to read updated scenario"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update scenario", exception);
        }
    }

    @Override
    public void deleteScenario(String projectId, String scenarioId) {
        String sql = "delete from scenarios where project_id = ? and id = ?";
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            int deleted = statement.executeUpdate();
            if (deleted == 0) {
                throw new IllegalArgumentException("Unknown scenario id: " + scenarioId);
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to delete scenario", exception);
        }
    }

    @Override
    public Optional<ScenarioRecord> findScenario(String projectId, String scenarioId) {
        String sql = """
                select id, name, description, is_baseline, is_active, created_at
                  from scenarios
                 where project_id = ?
                   and id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            statement.setObject(2, uuid(scenarioId));
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toScenario(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find scenario", exception);
        }
    }

    @Override
    public List<ScenarioRecord> listScenarios(String projectId) {
        String sql = """
                select id, name, description, is_baseline, is_active, created_at
                  from scenarios
                 where project_id = ?
                 order by created_at asc, name asc
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, uuid(projectId));
            try (ResultSet resultSet = statement.executeQuery()) {
                List<ScenarioRecord> scenarios = new ArrayList<>();
                while (resultSet.next()) {
                    scenarios.add(toScenario(resultSet));
                }
                return scenarios;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to list scenarios", exception);
        }
    }

    @Override
    public boolean existsScenarioName(String projectId, String normalizedName, String skipScenarioId) {
        StringBuilder sql = new StringBuilder("""
                select 1
                  from scenarios
                 where project_id = ?
                   and lower(name) = ?
                """);
        if (skipScenarioId != null) {
            sql.append(" and id <> ?");
        }
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            statement.setObject(1, uuid(projectId));
            statement.setString(2, normalizedName);
            if (skipScenarioId != null) {
                statement.setObject(3, uuid(skipScenarioId));
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to check scenario name", exception);
        }
    }

    private Connection openConnection() throws SQLException {
        AuditPersistenceProperties.ResolvedConnection connection = persistenceProperties.resolveConnection();
        return DriverManager.getConnection(connection.jdbcUrl(), connection.username(), connection.password());
    }

    private ProjectRecord toProject(ResultSet resultSet) throws SQLException {
        return new ProjectRecord(
                resultSet.getString("id"),
                resultSet.getString("code"),
                resultSet.getString("name"),
                resultSet.getString("business_type"),
                resultSet.getString("status"),
                resultSet.getString("description"),
                resultSet.getTimestamp("created_at").toLocalDateTime());
    }

    private ScenarioRecord toScenario(ResultSet resultSet) throws SQLException {
        return new ScenarioRecord(
                resultSet.getString("id"),
                resultSet.getString("name"),
                resultSet.getString("description"),
                resultSet.getBoolean("is_baseline"),
                resultSet.getBoolean("is_active"),
                resultSet.getTimestamp("created_at").toLocalDateTime());
    }

    private String readGeneratedUuid(PreparedStatement statement) throws SQLException {
        try (ResultSet keys = statement.getGeneratedKeys()) {
            if (!keys.next()) {
                throw new IllegalStateException("Failed to read generated id");
            }
            return keys.getObject(1).toString();
        }
    }

    private UUID uuid(String value) {
        return UUID.fromString(value);
    }
}
