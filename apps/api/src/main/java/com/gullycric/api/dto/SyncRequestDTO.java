package com.gullycric.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class SyncRequestDTO {
    private List<SyncPayloadDTO> outbox;
}
