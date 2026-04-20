package com.gullycric.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "match_players")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchPlayerEntity {
    @Id
    private String id;
    
    private String matchId;
    private String userId;
    private String name;
    private String team;
    
    private Integer isGuest = 0;
    private Integer battingOrder;
}
