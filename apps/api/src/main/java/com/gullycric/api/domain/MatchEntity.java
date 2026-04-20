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
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchEntity {
    @Id
    private String id;
    
    private String hostId;
    private String teamAName = "Team A";
    private String teamBName = "Team B";
    
    private Double locationLat;
    private Double locationLong;
    
    private String status = "scheduled";
    private Integer isPublic = 1;
    
    @Column(columnDefinition = "TEXT")
    private String rulesJson;
    
    private String tossWinner;
    private String tossDecision;
    private Integer currentInnings = 1;
    private String currentBattingTeam = "A";
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime syncedAt = LocalDateTime.now();
}
