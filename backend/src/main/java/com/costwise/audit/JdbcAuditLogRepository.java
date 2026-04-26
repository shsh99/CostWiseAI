package com.costwise.audit;

import com.costwise.config.AuditPersistenceProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAuditLogRepository implements AuditLogRepository {

    private static final String INSERT_SQL = """
            insert into audit_logs (
                project_id,
                event_type,
                actor_role,
                actor_id,
                action,
                target,
                result,
                metadata,
                request_context,
                occurred_at,
                created_at
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final AuditPersistenceProperties persistenceProperties;
    private final ObjectMapper objectMapper;

    public JdbcAuditLogRepository(
            AuditPersistenceProperties persistenceProperties,
            ObjectMapper objectMapper) {
        this.persistenceProperties = persistenceProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public StoredAuditEntry append(NewAuditEntry entry) {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(INSERT_SQL, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, entry.projectId());
            statement.setString(2, entry.eventType());
            statement.setString(3, entry.actorRole());
            statement.setString(4, entry.actorId());
            statement.setString(5, entry.action());
            statement.setString(6, entry.target());
            statement.setString(7, entry.result());
            statement.setString(8, toJson(entry.metadata()));
            statement.setString(9, toJson(entry.requestContext()));
            statement.setTimestamp(10, Timestamp.from(entry.occurredAt()));
            statement.setTimestamp(11, Timestamp.from(entry.createdAt()));
            statement.executeUpdate();
            long id = generatedId(statement);
            return new StoredAuditEntry(
                    id,
                    entry.projectId(),
                    entry.eventType(),
                    entry.actorRole(),
                    entry.actorId(),
                    entry.action(),
                    entry.target(),
                    entry.result(),
                    entry.metadata(),
                    entry.requestContext(),
                    entry.occurredAt(),
                    entry.createdAt());
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to append audit log", exception);
        }
    }

    @Override
    public List<StoredAuditEntry> query(QueryFilter filter, int fetchSize) {
        StringBuilder sql = new StringBuilder("""
                select id,
                       project_id,
                       event_type,
                       actor_role,
                       actor_id,
                       action,
                       target,
                       result,
                       metadata,
                       request_context,
                       occurred_at,
                       created_at
                  from audit_logs
                 where project_id = ?
                """);
        List<Object> params = new ArrayList<>();
        params.add(filter.projectId());

        if (filter.eventType() != null) {
            sql.append(" and lower(event_type) = lower(?)");
            params.add(filter.eventType());
        }
        if (filter.from() != null) {
            sql.append(" and occurred_at >= ?");
            params.add(Timestamp.from(filter.from()));
        }
        if (filter.to() != null) {
            sql.append(" and occurred_at <= ?");
            params.add(Timestamp.from(filter.to()));
        }
        if (filter.cursor() != null) {
            sql.append(" and id < ?");
            params.add(filter.cursor());
        }

        sql.append(" order by id desc limit ?");
        params.add(fetchSize);

        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                statement.setObject(i + 1, params.get(i));
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                List<StoredAuditEntry> entries = new ArrayList<>();
                while (resultSet.next()) {
                    entries.add(new StoredAuditEntry(
                            resultSet.getLong("id"),
                            resultSet.getString("project_id"),
                            resultSet.getString("event_type"),
                            resultSet.getString("actor_role"),
                            resultSet.getString("actor_id"),
                            resultSet.getString("action"),
                            resultSet.getString("target"),
                            resultSet.getString("result"),
                            fromJson(resultSet.getString("metadata")),
                            fromJson(resultSet.getString("request_context")),
                            resultSet.getTimestamp("occurred_at").toInstant(),
                            resultSet.getTimestamp("created_at").toInstant()));
                }
                return entries;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Failed to query audit logs", exception);
        }
    }

    private Connection openConnection() throws SQLException {
        AuditPersistenceProperties.ResolvedConnection connection = persistenceProperties.resolveConnection();
        return DriverManager.getConnection(connection.jdbcUrl(), connection.username(), connection.password());
    }

    private long generatedId(PreparedStatement statement) throws SQLException {
        try (ResultSet keys = statement.getGeneratedKeys()) {
            if (!keys.next()) {
                throw new IllegalStateException("Failed to read generated audit log id");
            }
            return keys.getLong(1);
        }
    }

    private String toJson(JsonNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize JSON payload", exception);
        }
    }

    private JsonNode fromJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize JSON payload", exception);
        }
    }
}
