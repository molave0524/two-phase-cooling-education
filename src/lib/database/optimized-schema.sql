-- Optimized Database Schema for User Progress Tracking
-- Two-Phase Cooling Education Center
--
-- Designed for high-performance concurrent access and real-time analytics

-- ============================================================================
-- USER PROGRESS TRACKING (Core Table)
-- ============================================================================

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    video_id UUID NOT NULL,

    -- Progress tracking fields
    completion_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    watch_time_seconds INTEGER DEFAULT 0 CHECK (watch_time_seconds >= 0),
    last_position_seconds INTEGER DEFAULT 0 CHECK (last_position_seconds >= 0),

    -- Completion tracking
    completed_at TIMESTAMP WITH TIME ZONE,
    first_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Engagement metrics
    interaction_count INTEGER DEFAULT 0,
    pause_count INTEGER DEFAULT 0,
    seek_count INTEGER DEFAULT 0,
    replay_count INTEGER DEFAULT 0,

    -- Concurrent access control
    version INTEGER DEFAULT 1, -- Optimistic locking
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint to prevent duplicate progress entries
    CONSTRAINT unique_user_video UNIQUE (user_id, video_id)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Primary query patterns: user-specific progress lookups
CREATE INDEX CONCURRENTLY idx_user_progress_user_id_last_watched
ON user_progress (user_id, last_watched_at DESC);

-- Video analytics: completion rates, popular videos
CREATE INDEX CONCURRENTLY idx_user_progress_video_completion
ON user_progress (video_id, completion_percentage, completed_at)
WHERE completion_percentage > 0;

-- Real-time dashboard queries: recent activity
CREATE INDEX CONCURRENTLY idx_user_progress_recent_activity
ON user_progress (last_watched_at DESC, user_id, video_id)
WHERE last_watched_at > NOW() - INTERVAL '24 hours';

-- Analytics: completion funnel analysis
CREATE INDEX CONCURRENTLY idx_user_progress_completion_funnel
ON user_progress (video_id, completion_percentage)
WHERE completion_percentage > 0;

-- User journey analysis: learning path tracking
CREATE INDEX CONCURRENTLY idx_user_progress_learning_path
ON user_progress (user_id, first_watched_at, video_id);

-- ============================================================================
-- LEARNING SESSIONS (Real-time tracking)
-- ============================================================================

CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    video_id UUID NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,

    -- Session metrics
    total_watch_time INTEGER DEFAULT 0,
    max_position_reached INTEGER DEFAULT 0,
    engagement_events JSONB DEFAULT '[]',

    -- Device and context
    device_type VARCHAR(50),
    user_agent TEXT,
    ip_address INET,

    -- Session state
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session tracking indexes
CREATE INDEX CONCURRENTLY idx_learning_sessions_active
ON learning_sessions (user_id, is_active, last_heartbeat DESC)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_learning_sessions_video_analytics
ON learning_sessions (video_id, session_start DESC, total_watch_time);

-- ============================================================================
-- VIDEO METADATA (Referenced by progress)
-- ============================================================================

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),

    -- Educational categorization
    topic_category VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    learning_objectives TEXT[],
    prerequisites UUID[], -- References to other video IDs

    -- Content metadata
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    description TEXT,

    -- Analytics aggregation (updated by triggers)
    view_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    average_completion_percentage DECIMAL(5,2) DEFAULT 0.0,
    average_watch_time INTEGER DEFAULT 0,

    -- Publishing
    published_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video lookup indexes
CREATE INDEX CONCURRENTLY idx_videos_published_featured
ON videos (published_at DESC, is_featured)
WHERE published_at IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_videos_topic_difficulty
ON videos (topic_category, difficulty_level, published_at DESC)
WHERE published_at IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_videos_analytics
ON videos (view_count DESC, completion_count DESC, average_completion_percentage DESC);

-- ============================================================================
-- LEARNING PATHS (Educational progression)
-- ============================================================================

CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    path_name VARCHAR(100) NOT NULL,
    video_sequence UUID[] NOT NULL, -- Ordered array of video IDs

    -- Progress tracking
    current_position INTEGER DEFAULT 0,
    videos_completed INTEGER DEFAULT 0,
    total_videos INTEGER GENERATED ALWAYS AS (array_length(video_sequence, 1)) STORED,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN array_length(video_sequence, 1) > 0
            THEN (videos_completed::decimal / array_length(video_sequence, 1)) * 100
            ELSE 0
        END
    ) STORED,

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning path indexes
CREATE INDEX CONCURRENTLY idx_learning_paths_user_active
ON learning_paths (user_id, last_activity DESC)
WHERE completed_at IS NULL;

CREATE INDEX CONCURRENTLY idx_learning_paths_completion_analytics
ON learning_paths (completion_percentage, videos_completed, total_videos);

-- ============================================================================
-- PROGRESS ANALYTICS (Materialized view for performance)
-- ============================================================================

CREATE MATERIALIZED VIEW user_progress_analytics AS
SELECT
    up.user_id,
    up.video_id,
    v.topic_category,
    v.difficulty_level,

    -- Progress metrics
    up.completion_percentage,
    up.watch_time_seconds,
    up.completed_at,

    -- Engagement metrics
    up.interaction_count,
    up.pause_count + up.seek_count + up.replay_count as total_interactions,

    -- Time metrics
    EXTRACT(EPOCH FROM (up.last_watched_at - up.first_watched_at))::INTEGER as learning_duration_seconds,

    -- Video context
    v.duration_seconds as video_duration,
    (up.watch_time_seconds::decimal / v.duration_seconds) * 100 as watch_ratio_percentage,

    -- Derived insights
    CASE
        WHEN up.completion_percentage >= 90 THEN 'completed'
        WHEN up.completion_percentage >= 50 THEN 'in_progress'
        WHEN up.completion_percentage > 0 THEN 'started'
        ELSE 'not_started'
    END as progress_status,

    -- Update tracking
    up.updated_at
FROM user_progress up
JOIN videos v ON up.video_id = v.id
WHERE v.published_at IS NOT NULL;

-- Materialized view indexes
CREATE UNIQUE INDEX idx_user_progress_analytics_unique
ON user_progress_analytics (user_id, video_id);

CREATE INDEX idx_user_progress_analytics_topic_progress
ON user_progress_analytics (topic_category, progress_status, completion_percentage DESC);

CREATE INDEX idx_user_progress_analytics_user_dashboard
ON user_progress_analytics (user_id, updated_at DESC, progress_status);

-- ============================================================================
-- PARTITIONING FOR SCALE (Future-proofing)
-- ============================================================================

-- Partition learning_sessions by month for better performance at scale
CREATE TABLE learning_sessions_partitioned (
    LIKE learning_sessions INCLUDING ALL
) PARTITION BY RANGE (session_start);

-- Create monthly partitions (example for 2025)
CREATE TABLE learning_sessions_2025_01 PARTITION OF learning_sessions_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE learning_sessions_2025_02 PARTITION OF learning_sessions_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add similar partitions for each month as needed

-- ============================================================================
-- TRIGGERS FOR REAL-TIME ANALYTICS
-- ============================================================================

-- Function to update video analytics when progress changes
CREATE OR REPLACE FUNCTION update_video_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update video statistics
    UPDATE videos SET
        view_count = (
            SELECT COUNT(*)
            FROM user_progress
            WHERE video_id = NEW.video_id AND watch_time_seconds > 0
        ),
        completion_count = (
            SELECT COUNT(*)
            FROM user_progress
            WHERE video_id = NEW.video_id AND completion_percentage >= 90
        ),
        average_completion_percentage = (
            SELECT COALESCE(AVG(completion_percentage), 0)
            FROM user_progress
            WHERE video_id = NEW.video_id AND completion_percentage > 0
        ),
        average_watch_time = (
            SELECT COALESCE(AVG(watch_time_seconds), 0)
            FROM user_progress
            WHERE video_id = NEW.video_id AND watch_time_seconds > 0
        ),
        updated_at = NOW()
    WHERE id = NEW.video_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for real-time analytics updates
CREATE TRIGGER trigger_update_video_analytics
    AFTER INSERT OR UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_video_analytics();

-- Function to refresh materialized view incrementally
CREATE OR REPLACE FUNCTION refresh_progress_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh only the affected rows in materialized view
    -- (In production, consider using pg_cron for scheduled refreshes)
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress_analytics;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Query to monitor index usage
CREATE VIEW index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to monitor table performance
CREATE VIEW table_performance_stats AS
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE
        WHEN seq_scan > idx_scan THEN 'HIGH_SEQ_SCAN'
        WHEN seq_scan = 0 AND idx_scan > 0 THEN 'OPTIMAL'
        ELSE 'REVIEW_NEEDED'
    END as scan_efficiency
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample videos
INSERT INTO videos (id, title, slug, duration_seconds, topic_category, difficulty_level, file_url, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Introduction to Two-Phase Cooling', 'intro-two-phase', 480, 'cooling-basics', 'beginner', '/videos/intro-two-phase.mp4', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Advanced Thermal Dynamics', 'advanced-thermal', 720, 'thermal-science', 'advanced', '/videos/advanced-thermal.mp4', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Safety in Two-Phase Systems', 'safety-systems', 360, 'safety', 'intermediate', '/videos/safety-systems.mp4', NOW());

-- Sample user progress (for testing indexes)
INSERT INTO user_progress (user_id, video_id, completion_percentage, watch_time_seconds, completed_at) VALUES
('450e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 100.0, 480, NOW()),
('450e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 45.0, 324, NULL),
('450e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 80.0, 384, NULL);

-- ============================================================================
-- INDEX MAINTENANCE COMMANDS
-- ============================================================================

-- Commands for ongoing maintenance (run these periodically)

-- Analyze tables to update statistics
-- ANALYZE user_progress;
-- ANALYZE learning_sessions;
-- ANALYZE videos;

-- Reindex if needed (during maintenance windows)
-- REINDEX INDEX CONCURRENTLY idx_user_progress_user_id_last_watched;

-- Update materialized view
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress_analytics;

-- Monitor index bloat
-- SELECT * FROM index_usage_stats WHERE usage_category = 'UNUSED';

-- Monitor query performance
-- SELECT * FROM table_performance_stats WHERE scan_efficiency = 'HIGH_SEQ_SCAN';