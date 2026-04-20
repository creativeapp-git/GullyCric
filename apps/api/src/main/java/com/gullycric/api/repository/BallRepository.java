package com.gullycric.api.repository;

import com.gullycric.api.domain.BallEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BallRepository extends JpaRepository<BallEntity, String> {
    List<BallEntity> findByMatchIdOrderByCreatedAtAsc(String matchId);
}
