package com.gullycric.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "balls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BallEntity {
    @Id
    private String id;
    
    private String matchId;
    private Integer innings = 1;
    private Integer overNumber = 0;
    private Integer ballNumber = 0;
    
    private String batterId;
    private String bowlerId;
    private String nonStrikerId;
    
    private Integer runsScored = 0;
    private Integer isWide = 0;
    private Integer isNoBall = 0;
    private Integer isBye = 0;
    private Integer isLegBye = 0;
    
    private Integer isWicket = 0;
    private String wicketType;
    private String dismissedPlayerId;
    private String fielderId;
    
    private Integer isEdited = 0;
    private String editReason;
    
    @Column(columnDefinition = "TEXT")
    private String shotTrajectoryJson;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime syncedAt = LocalDateTime.now();
}
