# Technical Assumptions

## Repository Structure: Monorepo

**Decision**: Monorepo structure to manage frontend, backend, AI assistant service, and content management in a single repository with shared dependencies and coordinated deployment.

**Rationale**: Educational platform requires tight coordination between video content delivery, AI assistant responses, and e-commerce functionality. Monorepo enables atomic changes across all services and simplifies development workflow for small team.

## Service Architecture

**Decision**: Serverless-first architecture with microservices pattern within monorepo structure using AWS Lambda functions for scalable, cost-effective operation.

**Components**:

- Frontend application (React.js)
- Video content delivery service
- AI assistant service (integration with OpenAI/Claude APIs)
- E-commerce service (payment processing, order management)
- Analytics service (engagement tracking, conversion metrics)
- Content management service (video metadata, educational content)

**Rationale**: Serverless approach provides automatic scaling for traffic spikes (YouTube reviews, viral content) while maintaining cost efficiency during low-traffic periods. Microservices enable independent scaling of AI assistant vs. video delivery vs. e-commerce components.

## Testing Requirements

**Decision**: Full testing pyramid - Unit tests, integration tests, end-to-end tests, plus manual testing convenience methods for video content validation.

**Critical Areas**:

- AI assistant response accuracy and latency testing
- Video streaming performance across devices and connections
- E-commerce transaction flow testing
- Educational content progression tracking
- Mobile responsiveness validation

**Rationale**: Educational platform requires high reliability and performance. Video delivery and AI assistant functionality must work consistently across all user scenarios. E-commerce integration demands thorough testing for payment security and order fulfillment.

## Additional Technical Assumptions and Requests

- **Video hosting and CDN**: AWS CloudFront with S3 for optimized global video delivery and adaptive streaming
- **AI/ML platform**: Integration with OpenAI GPT-4 or Claude for technical assistant, with custom knowledge base for two-phase cooling science
- **Database**: PostgreSQL for user data and order management, Redis for session caching and AI assistant context
- **Payment processing**: Stripe integration for PCI-compliant payment handling
- **Analytics platform**: Custom analytics service integrated with Google Analytics for comprehensive engagement tracking
- **Content management**: Headless CMS approach for educational content management and video metadata
- **Security**: JWT-based authentication, SSL/TLS encryption, OWASP security practices
- **Development framework**: React.js with TypeScript for type safety, Node.js backend with Express
- **CI/CD pipeline**: AWS CodePipeline with automated testing and deployment to staging/production environments
- **Monitoring**: AWS CloudWatch with custom dashboards for video delivery performance and AI assistant response times
