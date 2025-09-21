# Coding Standards & Guidelines

## Code Style & Formatting

### TypeScript Standards
```typescript
// Use explicit return types for functions
function calculateVideoProgress(currentTime: number, duration: number): number {
  return Math.round((currentTime / duration) * 100);
}

// Use interfaces for object shapes
interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  topicCategory: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Use enums for constants
enum VideoQuality {
  Auto = 'auto',
  HD_1080P = '1080p',
  HD_720P = '720p',
  SD_480P = '480p'
}
```

### React Component Standards
```typescript
// Use React.FC for component types
interface VideoPlayerProps {
  video: Video;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onProgress,
  autoPlay = false
}) => {
  // Component implementation
};

// Use custom hooks for complex logic
function useVideoProgress(videoId: string) {
  const [progress, setProgress] = useState(0);
  // Hook logic
  return { progress, updateProgress };
}
```

### File Naming Conventions
- **Components**: PascalCase (`VideoPlayer.tsx`, `AIAssistant.tsx`)
- **Hooks**: camelCase with `use` prefix (`useVideoProgress.ts`, `useAIChat.ts`)
- **Utils**: camelCase (`videoHelpers.ts`, `formatDuration.ts`)
- **Types**: PascalCase with suffix (`VideoTypes.ts`, `APITypes.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`VIDEO_QUALITY_OPTIONS.ts`)

## Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

// 2. Third-party library imports
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// 3. Internal imports (absolute paths)
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { useVideoStore } from '@/stores/videoStore';
import { VideoService } from '@/lib/services/VideoService';

// 4. Relative imports
import './VideoPlayer.styles.css';
```

## Error Handling Patterns
```typescript
// API route error handling
export async function GET(request: NextRequest) {
  try {
    const videos = await VideoService.getVideos();
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    logger.error('Failed to fetch videos', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// Component error boundaries
class VideoPlayerErrorBoundary extends Component {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Video player error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <VideoPlayerFallback />;
    }
    return this.props.children;
  }
}
```

## Testing Standards
```typescript
// Unit test structure
describe('VideoPlayer Component', () => {
  const mockVideo = {
    id: 'test-video',
    title: 'Test Video',
    duration: 300
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display video title', () => {
    render(<VideoPlayer video={mockVideo} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('should call onProgress when video progresses', async () => {
    const onProgress = vi.fn();
    render(<VideoPlayer video={mockVideo} onProgress={onProgress} />);

    // Simulate video progress
    fireEvent.timeUpdate(screen.getByRole('video'));

    await waitFor(() => {
      expect(onProgress).toHaveBeenCalled();
    });
  });
});
```

## Performance Guidelines

### React Performance
- Use `React.memo` for expensive components
- Implement `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Avoid inline object creation in JSX props

### Bundle Optimization
- Use dynamic imports for code splitting
- Implement lazy loading for components
- Optimize images with Next.js Image component
- Tree-shake unused dependencies

### Database Performance
- Use database indexes for frequent queries
- Implement connection pooling
- Cache frequently accessed data
- Use pagination for large result sets

## Security Guidelines

### Input Validation
```typescript
// Always validate user inputs
const VideoQuerySchema = z.object({
  topic: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = VideoQuerySchema.parse({
    topic: searchParams.get('topic'),
    difficulty: searchParams.get('difficulty')
  });
  // Safe to use validated query
}
```

### Authentication Checks
```typescript
// Protect API routes
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  // Continue with authenticated logic
}
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * VideoPlayer component for displaying educational videos
 *
 * @param video - Video data object containing metadata
 * @param onProgress - Callback fired when video progress changes
 * @param autoPlay - Whether to start playing automatically
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   video={videoData}
 *   onProgress={(progress) => console.log(progress)}
 *   autoPlay={false}
 * />
 * ```
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ ... }) => {
  // Implementation
};
```

### API Documentation
```typescript
/**
 * GET /api/videos
 *
 * Retrieves videos with optional filtering
 *
 * Query Parameters:
 * - topic: Filter by topic category
 * - difficulty: Filter by difficulty level
 * - page: Page number for pagination
 * - limit: Items per page
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "data": Video[],
 *   "pagination": {
 *     "page": number,
 *     "totalPages": number,
 *     "totalItems": number
 *   }
 * }
 * ```
 */
```

## Git Commit Standards

### Commit Message Format
```
type(scope): brief description

More detailed explanation if needed

- Bullet points for multiple changes
- Reference issue numbers: Fixes #123
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Test additions/updates
- `chore`: Build/dependency updates
- `perf`: Performance improvements

### Examples
```
feat(video): add quality selector to video player

- Implement adaptive bitrate streaming
- Add manual quality override option
- Update video player controls UI

Fixes #45
```