package com.costwise.build;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class GradleBootstrap {

    private GradleBootstrap() {
    }

    public static void main(String[] args) throws Exception {
        Path projectDir = Path.of(System.getProperty("user.dir"));
        Path propertiesFile = projectDir.resolve("gradle/wrapper/gradle-wrapper.properties");
        if (!Files.exists(propertiesFile)) {
            throw new IllegalStateException("Missing gradle-wrapper.properties at " + propertiesFile);
        }

        Properties properties = new Properties();
        try (InputStream input = Files.newInputStream(propertiesFile)) {
            properties.load(input);
        }

        String distributionUrl = properties.getProperty("distributionUrl");
        if (distributionUrl == null || distributionUrl.isBlank()) {
            throw new IllegalStateException("distributionUrl is missing in gradle-wrapper.properties");
        }

        Path installRoot = getInstallRoot(distributionUrl);
        Path wrapperInstallRoot = getWrapperInstallRoot(distributionUrl);
        Path gradleHome = findGradleHome(installRoot);
        if (gradleHome == null) {
            gradleHome = findGradleHome(wrapperInstallRoot);
        }
        if (gradleHome == null) {
            downloadAndExtract(distributionUrl, installRoot);
            gradleHome = findGradleHome(installRoot);
        }

        if (gradleHome == null) {
            throw new IllegalStateException("Unable to locate a Gradle distribution in " + installRoot);
        }

        Path executable = isWindows() ? gradleHome.resolve("bin/gradle.bat") : gradleHome.resolve("bin/gradle");
        if (!Files.exists(executable)) {
            throw new IllegalStateException("Gradle executable not found at " + executable);
        }

        List<String> command = new java.util.ArrayList<>();
        command.add(executable.toString());
        command.addAll(Arrays.asList(args));

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.directory(projectDir.toFile());
        processBuilder.inheritIO();
        int exitCode = processBuilder.start().waitFor();
        if (exitCode != 0) {
            System.exit(exitCode);
        }
    }

    private static void downloadAndExtract(String distributionUrl, Path installRoot) throws IOException, InterruptedException {
        Files.createDirectories(installRoot);
        Path archive = Files.createTempFile("gradle-wrapper", ".zip");
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(distributionUrl)).GET().build();
        HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(archive));
        if (response.statusCode() >= 400) {
            throw new IOException("Failed to download Gradle distribution: HTTP " + response.statusCode());
        }

        unzip(archive, installRoot);
        Files.deleteIfExists(archive);
    }

    private static void unzip(Path archive, Path destination) throws IOException {
        try (ZipInputStream input = new ZipInputStream(Files.newInputStream(archive))) {
            ZipEntry entry;
            while ((entry = input.getNextEntry()) != null) {
                Path target = destination.resolve(entry.getName()).normalize();
                if (!target.startsWith(destination)) {
                    throw new IOException("Blocked zip slip entry: " + entry.getName());
                }

                if (entry.isDirectory()) {
                    Files.createDirectories(target);
                } else {
                    Files.createDirectories(target.getParent());
                    Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }

    private static Path findGradleHome(Path installRoot) throws IOException {
        if (!Files.exists(installRoot)) {
            return null;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(installRoot)) {
            for (Path candidate : stream) {
                if (Files.isDirectory(candidate)) {
                    Path directMatch = gradleHomeIfPresent(candidate);
                    if (directMatch != null) {
                        return directMatch;
                    }

                    try (DirectoryStream<Path> nested = Files.newDirectoryStream(candidate)) {
                        for (Path nestedCandidate : nested) {
                            if (Files.isDirectory(nestedCandidate)) {
                                Path nestedMatch = gradleHomeIfPresent(nestedCandidate);
                                if (nestedMatch != null) {
                                    return nestedMatch;
                                }
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    private static Path gradleHomeIfPresent(Path candidate) {
        Path windowsBinary = candidate.resolve("bin/gradle.bat");
        Path unixBinary = candidate.resolve("bin/gradle");
        return Files.exists(windowsBinary) || Files.exists(unixBinary) ? candidate : null;
    }

    private static Path getInstallRoot(String distributionUrl) {
        String normalized = distributionUrl.substring(distributionUrl.lastIndexOf('/') + 1).replace(".zip", "");
        Path baseHome = resolveGradleUserHome();
        return baseHome.resolve("costwise").resolve(normalized);
    }

    private static Path getWrapperInstallRoot(String distributionUrl) {
        String normalized = distributionUrl.substring(distributionUrl.lastIndexOf('/') + 1).replace(".zip", "");
        Path baseHome = resolveGradleUserHome();
        return baseHome.resolve("wrapper").resolve("dists").resolve(normalized);
    }

    private static Path resolveGradleUserHome() {
        String explicit = System.getenv("GRADLE_USER_HOME");
        if (explicit != null && !explicit.isBlank()) {
            return Path.of(explicit);
        }

        String userProfile = System.getenv("USERPROFILE");
        if (userProfile != null && !userProfile.isBlank()) {
            return Path.of(userProfile, ".gradle");
        }

        String localAppData = System.getenv("LOCALAPPDATA");
        if (localAppData != null && !localAppData.isBlank()) {
            return Path.of(localAppData, "..", "..", ".gradle").normalize();
        }

        String userHome = System.getProperty("user.home");
        if (userHome != null && !userHome.isBlank()) {
            return Path.of(userHome, ".gradle");
        }

        return Path.of(System.getProperty("java.io.tmpdir"), "costwise-gradle-home");
    }

    private static boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }
}
