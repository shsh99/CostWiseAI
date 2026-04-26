package com.costwise.user;

import com.costwise.audit.AuditLogService;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final String USER_MGMT_PROJECT_ID = "USER-MGMT";
    private static final String USER_MGMT_EVENT_TYPE = "user_management";
    private static final String AUDIT_RESULT = "success";
    private static final String SYSTEM_ACTOR = "SYSTEM";
    private static final String SYSTEM_ACTOR_ID = "system";
    private static final String DEFAULT_TEMPORARY_PASSWORD = "ChangeMe123!";
    private static final Set<String> SUPPORTED_ROLES =
            Set.of("ADMIN", "EXECUTIVE", "PM", "ACCOUNTANT", "AUDITOR", "PLANNER", "FINANCE_REVIEWER");
    private static final Map<String, String> ROLE_ALIASES = Map.ofEntries(
            Map.entry("MANAGER", "EXECUTIVE"));

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            AuditLogService auditLogService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserRepository.UserRecord> listUsers() {
        return userRepository.listUsers();
    }

    public UserRepository.UserRecord createUser(CreateUserCommand command, Authentication authentication) {
        NormalizedUser normalized = normalize(command);
        if (userRepository.existsByEmail(normalized.email(), null)) {
            throw new IllegalArgumentException("User email already exists: " + normalized.email());
        }
        UserRepository.UserRecord created = userRepository.createUser(new UserRepository.NewUser(
                normalized.username(),
                normalized.email(),
                normalized.displayName(),
                normalized.role(),
                normalized.division(),
                normalized.status(),
                normalized.mfaEnabled(),
                passwordEncoder.encode(DEFAULT_TEMPORARY_PASSWORD)));

        ObjectNode metadata = JsonNodeFactory.instance.objectNode();
        metadata.set("user", toUserMetadata(created));
        appendAudit(authentication, "create", created.id(), metadata);

        return created;
    }

    public UserRepository.UserRecord updateUser(
            String userId, UpdateUserCommand command, Authentication authentication) {
        String resolvedUserId = requireTrimmed(userId, "userId");
        UserRepository.UserRecord existing = userRepository.findUser(resolvedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + resolvedUserId));

        NormalizedUser normalized = normalize(command);
        if (userRepository.existsByEmail(normalized.email(), resolvedUserId)) {
            throw new IllegalArgumentException("User email already exists: " + normalized.email());
        }

        UserRepository.UserRecord updated = userRepository.updateUser(new UserRepository.UserUpdate(
                resolvedUserId,
                normalized.username(),
                normalized.email(),
                normalized.displayName(),
                normalized.role(),
                normalized.division(),
                normalized.status(),
                normalized.mfaEnabled()));

        ObjectNode metadata = JsonNodeFactory.instance.objectNode();
        metadata.set("before", toUserMetadata(existing));
        metadata.set("after", toUserMetadata(updated));
        appendAudit(authentication, "update", updated.id(), metadata);

        return updated;
    }

    public void deleteUser(String userId, Authentication authentication) {
        String resolvedUserId = requireTrimmed(userId, "userId");
        UserRepository.UserRecord existing = userRepository.findUser(resolvedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + resolvedUserId));

        userRepository.deleteUser(resolvedUserId);

        ObjectNode metadata = JsonNodeFactory.instance.objectNode();
        metadata.set("deleted", toUserMetadata(existing));
        appendAudit(authentication, "delete", resolvedUserId, metadata);
    }

    public void updateUserPassword(String userId, String rawPassword, Authentication authentication) {
        String resolvedUserId = requireTrimmed(userId, "userId");
        UserRepository.UserRecord existing = userRepository.findUser(resolvedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown user id: " + resolvedUserId));

        String resolvedPassword = requireTrimmed(rawPassword, "password");
        if (resolvedPassword.length() < 8) {
            throw new IllegalArgumentException("password must be at least 8 characters");
        }

        userRepository.updatePasswordHash(resolvedUserId, passwordEncoder.encode(resolvedPassword));

        ObjectNode metadata = JsonNodeFactory.instance.objectNode();
        metadata.put("userId", existing.id());
        metadata.put("email", existing.email());
        metadata.put("passwordReset", true);
        appendAudit(authentication, "password_reset", existing.id(), metadata);
    }

    private void appendAudit(Authentication authentication, String action, String target, ObjectNode metadata) {
        auditLogService.append(new AuditLogService.AppendCommand(
                USER_MGMT_PROJECT_ID,
                USER_MGMT_EVENT_TYPE,
                resolveActorRole(authentication),
                resolveActorId(authentication),
                action,
                target,
                AUDIT_RESULT,
                metadata,
                JsonNodeFactory.instance.objectNode(),
                Instant.now()));
    }

    private String resolveActorRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return SYSTEM_ACTOR;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .map(value -> value.replaceFirst("^ROLE_", ""))
                .map(String::trim)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .sorted()
                .findFirst()
                .orElse(SYSTEM_ACTOR);
    }

    private String resolveActorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return SYSTEM_ACTOR_ID;
        }
        return authentication.getName().trim();
    }

    private ObjectNode toUserMetadata(UserRepository.UserRecord user) {
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        node.put("id", user.id());
        node.put("email", user.email());
        node.put("displayName", user.displayName());
        node.put("role", user.role());
        node.put("division", user.division());
        node.put("status", user.status());
        node.put("mfaEnabled", user.mfaEnabled());
        node.put("createdAt", user.createdAt().toString());
        node.put("updatedAt", user.updatedAt().toString());
        return node;
    }

    private NormalizedUser normalize(CreateUserCommand command) {
        return normalizeFields(
                command.email(),
                command.displayName(),
                command.role(),
                command.division(),
                command.status(),
                command.mfaEnabled());
    }

    private NormalizedUser normalize(UpdateUserCommand command) {
        return normalizeFields(
                command.email(),
                command.displayName(),
                command.role(),
                command.division(),
                command.status(),
                command.mfaEnabled());
    }

    private NormalizedUser normalizeFields(
            String email,
            String displayName,
            String role,
            String division,
            String status,
            Boolean mfaEnabled) {
        String normalizedEmail = requireTrimmed(email, "email").toLowerCase(Locale.ROOT);
        String normalizedRole = normalizeRole(role);
        if (!SUPPORTED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Invalid user role: " + role);
        }
        return new NormalizedUser(
                usernameFromEmail(normalizedEmail),
                normalizedEmail,
                requireTrimmed(displayName, "displayName"),
                normalizedRole,
                requireTrimmed(division, "division"),
                requireTrimmed(status, "status"),
                Boolean.TRUE.equals(mfaEnabled));
    }

    private String usernameFromEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        int atIndex = normalizedEmail.indexOf('@');
        String username = atIndex > 0 ? normalizedEmail.substring(0, atIndex) : normalizedEmail;
        if (username.isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        return username;
    }

    private String normalizeRole(String role) {
        String normalized = requireTrimmed(role, "role").toUpperCase(Locale.ROOT);
        return ROLE_ALIASES.getOrDefault(normalized, normalized);
    }

    private String requireTrimmed(String value, String field) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private record NormalizedUser(
            String username,
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled) {}

    public record CreateUserCommand(
            String email,
            String displayName,
            String role,
            String division,
            String status,
            Boolean mfaEnabled) {}

    public record UpdateUserCommand(
            String email,
            String displayName,
            String role,
            String division,
            String status,
            Boolean mfaEnabled) {}
}
