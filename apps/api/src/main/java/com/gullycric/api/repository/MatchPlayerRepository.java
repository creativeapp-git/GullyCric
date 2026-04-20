package com.gullycric.api.repository;

import com.gullycric.api.domain.MatchPlayerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchPlayerRepository extends JpaRepository<MatchPlayerEntity, String> {
    List<MatchPlayerEntity> findByMatchId(String matchId);
}
