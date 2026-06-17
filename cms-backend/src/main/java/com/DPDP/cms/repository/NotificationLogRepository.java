package com.DPDP.cms.repository;

import com.DPDP.cms.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    // Spring Boot will automatically write the SQL to fetch logs ordered by newest first!
    java.util.List<NotificationLog> findAllByOrderByTimestampDesc();
    void deleteByRecipient(String recipient);
}