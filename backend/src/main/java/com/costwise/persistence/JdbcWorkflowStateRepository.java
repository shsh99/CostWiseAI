package com.costwise.persistence;

import com.costwise.config.AuditPersistenceProperties;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcWorkflowStateRepository implements WorkflowStateRepository {

    private final AuditPersistenceProperties persistenceProperties;

    public JdbcWorkflowStateRepository(AuditPersistenceProperties persistenceProperties) {
        this.persistenceProperties = persistenceProperties;
    }

    @Override
    public Optional<WorkflowStateRecord> findState(String projectId) {
        String sql = """
                select project_id, status, last_action, updated_at
                  from workflow_states
                 where project_id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, projectId);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return Optional.empty();
                }
                return Optional.of(toState(resultSet));
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to find workflow state", exception);
        }
    }

    @Override
    public WorkflowStateRecord createState(String projectId, String status) {
        String sql = """
                insert into workflow_states (project_id, status, last_action, updated_at)
                values (?, ?, 'INIT', ?)
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            LocalDateTime now = LocalDateTime.now();
            statement.setString(1, projectId);
            statement.setString(2, status);
            statement.setTimestamp(3, Timestamp.valueOf(now));
            statement.executeUpdate();
            return findState(projectId).orElseThrow(
                    () -> new IllegalStateException("Failed to read created workflow state"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to create workflow state", exception);
        }
    }

    @Override
    public WorkflowStateRecord updateState(
            String projectId, String status, String lastAction, LocalDateTime updatedAt) {
        String sql = """
                update workflow_states
                   set status = ?,
                       last_action = ?,
                       updated_at = ?
                 where project_id = ?
                """;
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, status);
            statement.setString(2, lastAction);
            statement.setTimestamp(3, Timestamp.valueOf(updatedAt));
            statement.setString(4, projectId);
            int updated = statement.executeUpdate();
            if (updated == 0) {
                throw new IllegalArgumentException("Unknown workflow project id: " + projectId);
            }
            return findState(projectId).orElseThrow(
                    () -> new IllegalStateException("Failed to read updated workflow state"));
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to update workflow state", exception);
        }
    }

    private Connection openConnection() throws SQLException {
        AuditPersistenceProperties.ResolvedConnection connection = persistenceProperties.resolveConnection();
        return DriverManager.getConnection(connection.jdbcUrl(), connection.username(), connection.password());
    }

    private WorkflowStateRecord toState(ResultSet resultSet) throws SQLException {
        return new WorkflowStateRecord(
                resultSet.getString("project_id"),
                resultSet.getString("status"),
                resultSet.getString("last_action"),
                resultSet.getTimestamp("updated_at").toLocalDateTime());
    }
}
