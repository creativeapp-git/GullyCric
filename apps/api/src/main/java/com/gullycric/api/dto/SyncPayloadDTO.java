package com.gullycric.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class SyncPayloadDTO {
    private String id;
    private String tableName;
    private String recordId;
    private String operation; // INSERT, UPDATE, DELETE
    private String payload; // JSON string of the record
    private String createdAt;
}
