package com.gullycric.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gullycric.api.domain.BallEntity;
import com.gullycric.api.domain.MatchEntity;
import com.gullycric.api.domain.MatchPlayerEntity;
import com.gullycric.api.domain.UserEntity;
import com.gullycric.api.dto.SyncPayloadDTO;
import com.gullycric.api.dto.SyncRequestDTO;
import com.gullycric.api.repository.BallRepository;
import com.gullycric.api.repository.MatchPlayerRepository;
import com.gullycric.api.repository.MatchRepository;
import com.gullycric.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;
    private final BallRepository ballRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void processSyncPayload(SyncRequestDTO request) {
        if (request.getOutbox() == null || request.getOutbox().isEmpty()) {
            return;
        }

        log.info("Processing {} sync operations", request.getOutbox().size());

        for (SyncPayloadDTO operation : request.getOutbox()) {
            try {
                processSingleOperation(operation);
            } catch (Exception e) {
                log.error("Failed to process operation: {}", operation.getId(), e);
                // Depending on strictness, we could throw exception to rollback all, 
                // but for MVP, logging and continuing ensures partial sync succeeds.
            }
        }
    }

    private void processSingleOperation(SyncPayloadDTO operation) throws Exception {
        String tableName = operation.getTableName();
        String payloadJson = operation.getPayload();
        
        // We handle INSERT and UPDATE similarly since Spring Data JPA's save() does upsert based on ID
        switch (tableName) {
            case "users":
                UserEntity user = objectMapper.readValue(payloadJson, UserEntity.class);
                userRepository.save(user);
                break;
            case "matches":
                MatchEntity match = objectMapper.readValue(payloadJson, MatchEntity.class);
                matchRepository.save(match);
                // Broadcast match update
                broadcastUpdate(match.getId(), "match_update", match);
                break;
            case "match_players":
                MatchPlayerEntity player = objectMapper.readValue(payloadJson, MatchPlayerEntity.class);
                matchPlayerRepository.save(player);
                broadcastUpdate(player.getMatchId(), "player_update", player);
                break;
            case "balls":
                BallEntity ball = objectMapper.readValue(payloadJson, BallEntity.class);
                ballRepository.save(ball);
                broadcastUpdate(ball.getMatchId(), "ball_update", ball);
                break;
            default:
                log.warn("Unknown table name for sync: {}", tableName);
        }
    }

    private void broadcastUpdate(String matchId, String eventType, Object payload) {
        if (matchId == null) return;
        String topic = "/topic/match/" + matchId;
        log.debug("Broadcasting {} to {}", eventType, topic);
        // We can wrap the payload in an event structure if needed
        messagingTemplate.convertAndSend(topic, payload);
    }
}
