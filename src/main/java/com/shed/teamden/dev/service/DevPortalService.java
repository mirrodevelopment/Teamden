package com.shed.teamden.dev.service;

import com.shed.teamden.dev.dto.ColumnMetadataDto;
import com.shed.teamden.dev.dto.DevOverviewDto;
import com.shed.teamden.dev.dto.DevUserDto;
import com.shed.teamden.dev.dto.TableDataDto;
import com.shed.teamden.dev.dto.TableMetadataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DevPortalService {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public List<String> getPublicTableNames() {
        String sql = "SELECT table_name FROM information_schema.tables " +
                     "WHERE LOWER(table_schema) = 'public' AND table_type = 'BASE TABLE' " +
                     "ORDER BY table_name ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("table_name"));
    }

    public List<TableMetadataDto> getAllTablesWithColumns() {
        List<String> tableNames = getPublicTableNames();
        List<TableMetadataDto> result = new ArrayList<>();

        for (String tableName : tableNames) {
            long rowCount = 0;
            try {
                // Safely query count using verified table name from schema
                Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM \"" + tableName + "\"", Long.class);
                if (count != null) rowCount = count;
            } catch (Exception e) {
                log.warn("Could not count rows for table {}", tableName, e);
            }

            List<ColumnMetadataDto> columns = getColumnsForTable(tableName);
            result.add(TableMetadataDto.builder()
                    .tableName(tableName)
                    .rowCount(rowCount)
                    .columns(columns)
                    .build());
        }

        return result;
    }

    public List<ColumnMetadataDto> getColumnsForTable(String tableName) {
        Set<String> primaryKeys = new HashSet<>();
        Map<String, String> foreignKeys = new HashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData metaData = conn.getMetaData();
            String schema = conn.getSchema();
            if (schema == null) schema = "public";

            // 1. Primary Keys
            try (ResultSet pkRs = metaData.getPrimaryKeys(null, schema, tableName)) {
                while (pkRs.next()) {
                    primaryKeys.add(pkRs.getString("COLUMN_NAME").toLowerCase());
                }
            } catch (Exception e) {
                log.debug("Primary key lookup skipped for table {}", tableName);
            }

            // 2. Foreign Keys
            try (ResultSet fkRs = metaData.getImportedKeys(null, schema, tableName)) {
                while (fkRs.next()) {
                    String fkColumn = fkRs.getString("FKCOLUMN_NAME").toLowerCase();
                    String pkTable = fkRs.getString("PKTABLE_NAME");
                    String pkColumn = fkRs.getString("PKCOLUMN_NAME");
                    foreignKeys.put(fkColumn, pkTable + "(" + pkColumn + ")");
                }
            } catch (Exception e) {
                log.debug("Foreign key lookup skipped for table {}", tableName);
            }
        } catch (Exception e) {
            log.warn("Could not retrieve JDBC metadata for table {}", tableName, e);
        }

        String sql = "SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, ordinal_position " +
                     "FROM information_schema.columns " +
                     "WHERE LOWER(table_schema) = 'public' AND LOWER(table_name) = LOWER(?) " +
                     "ORDER BY ordinal_position ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String colName = rs.getString("column_name");
            String lowerCol = colName.toLowerCase();
            String dataType = rs.getString("data_type").toUpperCase();
            int charLen = rs.getInt("character_maximum_length");
            if (!rs.wasNull() && charLen > 0) {
                dataType = dataType + "(" + charLen + ")";
            }

            boolean isNullable = "YES".equalsIgnoreCase(rs.getString("is_nullable"));
            String defaultValue = rs.getString("column_default");
            int position = rs.getInt("ordinal_position");

            boolean isPk = primaryKeys.contains(lowerCol);
            String fkTarget = foreignKeys.get(lowerCol);

            return ColumnMetadataDto.builder()
                    .columnName(colName)
                    .dataType(dataType)
                    .nullable(isNullable)
                    .defaultValue(defaultValue)
                    .ordinalPosition(position)
                    .primaryKey(isPk)
                    .foreignKeyTarget(fkTarget)
                    .uniqueConstraint(null)
                    .build();
        }, tableName);
    }

    public TableDataDto getTableData(String tableName, int limit) {
        List<String> validTables = getPublicTableNames();
        String matchedTable = validTables.stream()
                .filter(t -> t.equalsIgnoreCase(tableName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Table '" + tableName + "' not found in public database schema"));

        int maxLimit = Math.min(Math.max(limit, 1), 100);

        long totalRows = 0;
        try {
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM \"" + matchedTable + "\"", Long.class);
            if (count != null) totalRows = count;
        } catch (Exception e) {
            log.warn("Could not count table rows", e);
        }

        List<String> columnNames = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();

        jdbcTemplate.query("SELECT * FROM \"" + matchedTable + "\" LIMIT " + maxLimit, rs -> {
            int colCount = rs.getMetaData().getColumnCount();
            if (columnNames.isEmpty()) {
                for (int i = 1; i <= colCount; i++) {
                    columnNames.add(rs.getMetaData().getColumnName(i));
                }
            }

            Map<String, Object> rowMap = new LinkedHashMap<>();
            for (int i = 1; i <= colCount; i++) {
                String col = rs.getMetaData().getColumnName(i);
                Object val = rs.getObject(i);
                rowMap.put(col, val != null ? val.toString() : null);
            }
            rows.add(rowMap);
        });

        return TableDataDto.builder()
                .tableName(matchedTable)
                .totalRows(totalRows)
                .columnNames(columnNames)
                .rows(rows)
                .build();
    }

    public List<DevUserDto> getDevUsers() {
        String sql = "SELECT u.id, u.full_name, u.email, u.status, u.created_at, u.last_login_at, " +
                     "m.role, o.name AS org_name, o.id AS org_id " +
                     "FROM users u " +
                     "LEFT JOIN organization_memberships m ON u.id = m.user_id " +
                     "LEFT JOIN organizations o ON m.organization_id = o.id " +
                     "ORDER BY u.created_at ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            UUID id = (UUID) rs.getObject("id");
            String fullName = rs.getString("full_name");
            String email = rs.getString("email");
            String status = rs.getString("status");
            Timestamp createdAtTs = rs.getTimestamp("created_at");
            Timestamp lastLoginTs = rs.getTimestamp("last_login_at");
            String role = rs.getString("role");
            String orgName = rs.getString("org_name");
            UUID orgId = (UUID) rs.getObject("org_id");

            String passwordNote = "Configured during account registration / provisioning";

            return DevUserDto.builder()
                    .id(id)
                    .fullName(fullName)
                    .email(email)
                    .status(status)
                    .createdAt(createdAtTs != null ? createdAtTs.toInstant() : null)
                    .lastLoginAt(lastLoginTs != null ? lastLoginTs.toInstant() : null)
                    .role(role != null ? role : "UNASSIGNED")
                    .organizationName(orgName != null ? orgName : "None")
                    .organizationId(orgId)
                    .unhashedPasswordNote(passwordNote)
                    .build();
        });
    }

    public DevOverviewDto getDevOverview() {
        String dbProduct = "PostgreSQL";
        String dbVersion = "17";
        String dbName = "teamden";

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            dbProduct = meta.getDatabaseProductName();
            dbVersion = meta.getDatabaseProductVersion();
            dbName = conn.getCatalog();
            if (dbName == null) dbName = conn.getSchema();
        } catch (Exception e) {
            log.warn("Could not read database overview metadata", e);
        }

        List<String> tables = getPublicTableNames();
        long userCount = 0;
        long orgCount = 0;

        try {
            Long uc = jdbcTemplate.queryForObject("SELECT count(*) FROM users", Long.class);
            if (uc != null) userCount = uc;
        } catch (Exception ignored) {}

        try {
            Long oc = jdbcTemplate.queryForObject("SELECT count(*) FROM organizations", Long.class);
            if (oc != null) orgCount = oc;
        } catch (Exception ignored) {}

        return DevOverviewDto.builder()
                .databaseProduct(dbProduct)
                .databaseVersion(dbVersion)
                .databaseName(dbName)
                .tableCount(tables.size())
                .userCount(userCount)
                .organizationCount(orgCount)
                .serverTimestamp(Instant.now())
                .status("CONNECTED")
                .build();
    }
}
