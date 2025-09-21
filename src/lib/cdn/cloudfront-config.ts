/**
 * CloudFront Configuration Templates
 *
 * Optimized CloudFront distributions for video delivery
 * Multiple configurations for different scenarios and testing
 */

export interface CloudFrontConfig {
  name: string;
  description: string;
  origins: OriginConfig[];
  behaviors: BehaviorConfig[];
  customErrorPages: ErrorPageConfig[];
  priceClass: string;
  geoRestriction: GeoRestrictionConfig;
  logging: LoggingConfig;
  tags: Record<string, string>;
}

export interface OriginConfig {
  id: string;
  domainName: string;
  originPath?: string;
  customHeaders?: Record<string, string>;
  s3OriginConfig?: S3OriginConfig;
  customOriginConfig?: CustomOriginConfig;
}

export interface S3OriginConfig {
  originAccessIdentity: string;
}

export interface CustomOriginConfig {
  httpPort: number;
  httpsPort: number;
  protocol: string;
  timeout: number;
  keepaliveTimeout: number;
  sslProtocols: string[];
}

export interface BehaviorConfig {
  pathPattern: string;
  targetOriginId: string;
  viewerProtocolPolicy: string;
  allowedMethods: string[];
  cachedMethods: string[];
  cachePolicyId?: string;
  originRequestPolicyId?: string;
  responseHeadersPolicyId?: string;
  compress: boolean;
  ttl: {
    default: number;
    min: number;
    max: number;
  };
  queryStringForwarding: boolean;
  cookies: {
    forward: string;
    whitelistedNames?: string[];
  };
}

export interface ErrorPageConfig {
  errorCode: number;
  responseCode: number;
  responsePage: string;
  ttl: number;
}

export interface GeoRestrictionConfig {
  type: 'whitelist' | 'blacklist' | 'none';
  locations: string[];
}

export interface LoggingConfig {
  enabled: boolean;
  bucket?: string;
  prefix?: string;
  includeCookies?: boolean;
}

/**
 * Production-optimized configuration for video delivery
 */
export const PRODUCTION_CLOUDFRONT_CONFIG: CloudFrontConfig = {
  name: 'cooling-education-videos-prod',
  description: 'Production CloudFront distribution for 4K cooling demonstration videos',

  origins: [
    {
      id: 'cooling-videos-s3',
      domainName: 'cooling-education-videos.s3.us-east-1.amazonaws.com',
      originPath: '/videos',
      s3OriginConfig: {
        originAccessIdentity: 'origin-access-identity/cloudfront/ABCDEFG1234567'
      }
    },
    {
      id: 'cooling-images-s3',
      domainName: 'cooling-education-videos.s3.us-east-1.amazonaws.com',
      originPath: '/images',
      s3OriginConfig: {
        originAccessIdentity: 'origin-access-identity/cloudfront/ABCDEFG1234567'
      }
    }
  ],

  behaviors: [
    {
      pathPattern: '/videos/*.mp4',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: false, // Don't compress video files
      ttl: {
        default: 86400,  // 24 hours
        min: 3600,       // 1 hour
        max: 31536000    // 1 year
      },
      queryStringForwarding: true, // For video quality parameters
      cookies: {
        forward: 'none'
      }
    },
    {
      pathPattern: '/videos/*.m3u8',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      ttl: {
        default: 60,     // 1 minute for HLS manifests
        min: 0,
        max: 300        // 5 minutes max
      },
      queryStringForwarding: false,
      cookies: {
        forward: 'none'
      }
    },
    {
      pathPattern: '/videos/*.ts',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD'],
      cachedMethods: ['GET', 'HEAD'],
      compress: false,
      ttl: {
        default: 3600,   // 1 hour for HLS segments
        min: 1800,       // 30 minutes
        max: 86400      // 24 hours
      },
      queryStringForwarding: false,
      cookies: {
        forward: 'none'
      }
    },
    {
      pathPattern: '/thumbnails/*',
      targetOriginId: 'cooling-images-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      ttl: {
        default: 86400,  // 24 hours
        min: 3600,       // 1 hour
        max: 2592000    // 30 days
      },
      queryStringForwarding: false,
      cookies: {
        forward: 'none'
      }
    },
    {
      pathPattern: '*',  // Default behavior
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      ttl: {
        default: 86400,
        min: 0,
        max: 31536000
      },
      queryStringForwarding: true,
      cookies: {
        forward: 'none'
      }
    }
  ],

  customErrorPages: [
    {
      errorCode: 404,
      responseCode: 404,
      responsePage: '/error-pages/404.html',
      ttl: 300 // 5 minutes
    },
    {
      errorCode: 403,
      responseCode: 404, // Hide 403 as 404 for security
      responsePage: '/error-pages/404.html',
      ttl: 300
    },
    {
      errorCode: 500,
      responseCode: 500,
      responsePage: '/error-pages/500.html',
      ttl: 0 // Don't cache server errors
    }
  ],

  priceClass: 'PriceClass_All', // Use all edge locations globally

  geoRestriction: {
    type: 'whitelist',
    locations: ['US', 'CA'] // USA market focus initially
  },

  logging: {
    enabled: true,
    bucket: 'cooling-education-cloudfront-logs',
    prefix: 'video-access-logs/',
    includeCookies: false
  },

  tags: {
    Environment: 'production',
    Project: 'cooling-education',
    Component: 'video-delivery',
    CostCenter: 'engineering'
  }
};

/**
 * Development configuration with more lenient settings
 */
export const DEVELOPMENT_CLOUDFRONT_CONFIG: CloudFrontConfig = {
  ...PRODUCTION_CLOUDFRONT_CONFIG,
  name: 'cooling-education-videos-dev',
  description: 'Development CloudFront distribution for testing video delivery',

  behaviors: PRODUCTION_CLOUDFRONT_CONFIG.behaviors.map(behavior => ({
    ...behavior,
    ttl: {
      default: 60,     // 1 minute for faster testing
      min: 0,
      max: 300        // 5 minutes max
    }
  })),

  priceClass: 'PriceClass_100', // Use only US/Europe edge locations for cost savings

  geoRestriction: {
    type: 'none',
    locations: []
  },

  tags: {
    Environment: 'development',
    Project: 'cooling-education',
    Component: 'video-delivery',
    CostCenter: 'engineering'
  }
};

/**
 * Load testing configuration optimized for performance validation
 */
export const LOAD_TEST_CLOUDFRONT_CONFIG: CloudFrontConfig = {
  ...PRODUCTION_CLOUDFRONT_CONFIG,
  name: 'cooling-education-videos-loadtest',
  description: 'Load testing CloudFront distribution for performance validation',

  behaviors: PRODUCTION_CLOUDFRONT_CONFIG.behaviors.map(behavior => ({
    ...behavior,
    ttl: {
      default: 300,    // 5 minutes for load testing
      min: 60,         // 1 minute
      max: 3600       // 1 hour
    }
  })),

  priceClass: 'PriceClass_200', // US/Europe/Asia for global testing

  geoRestriction: {
    type: 'none',
    locations: []
  },

  logging: {
    enabled: true,
    bucket: 'cooling-education-loadtest-logs',
    prefix: 'loadtest-logs/',
    includeCookies: false
  },

  tags: {
    Environment: 'loadtest',
    Project: 'cooling-education',
    Component: 'video-delivery',
    CostCenter: 'qa'
  }
};

/**
 * Configuration for testing adaptive bitrate streaming
 */
export const ADAPTIVE_STREAMING_CONFIG: CloudFrontConfig = {
  ...PRODUCTION_CLOUDFRONT_CONFIG,
  name: 'cooling-education-adaptive-streaming',
  description: 'Adaptive bitrate streaming configuration with HLS support',

  behaviors: [
    // HLS manifest files - short TTL for dynamic quality switching
    {
      pathPattern: '*.m3u8',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      ttl: {
        default: 10,     // 10 seconds for master playlists
        min: 0,
        max: 60         // 1 minute max
      },
      queryStringForwarding: true, // For quality parameters
      cookies: {
        forward: 'none'
      }
    },
    // HLS segment files - longer TTL for video chunks
    {
      pathPattern: '*.ts',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD'],
      cachedMethods: ['GET', 'HEAD'],
      compress: false,
      ttl: {
        default: 3600,   // 1 hour for segments
        min: 1800,       // 30 minutes
        max: 86400      // 24 hours
      },
      queryStringForwarding: false,
      cookies: {
        forward: 'none'
      }
    },
    // Video quality variants with query string support
    {
      pathPattern: '/videos/*',
      targetOriginId: 'cooling-videos-s3',
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: false,
      ttl: {
        default: 86400,
        min: 3600,
        max: 31536000
      },
      queryStringForwarding: true, // Important for quality parameters
      cookies: {
        forward: 'none'
      }
    },
    ...PRODUCTION_CLOUDFRONT_CONFIG.behaviors.slice(3) // Keep other behaviors
  ]
};

/**
 * Generate CloudFormation template for CloudFront distribution
 */
export function generateCloudFormationTemplate(config: CloudFrontConfig): object {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: config.description,

    Resources: {
      CloudFrontDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Comment: config.description,
            PriceClass: config.priceClass,
            Enabled: true,
            HttpVersion: 'http2',
            IPV6Enabled: true,

            Origins: config.origins.map(origin => ({
              Id: origin.id,
              DomainName: origin.domainName,
              OriginPath: origin.originPath || '',
              S3OriginConfig: origin.s3OriginConfig ? {
                OriginAccessIdentity: `origin-access-identity/cloudfront/${origin.s3OriginConfig.originAccessIdentity}`
              } : undefined,
              CustomOriginConfig: origin.customOriginConfig
            })),

            DefaultCacheBehavior: {
              TargetOriginId: config.behaviors[config.behaviors.length - 1].targetOriginId,
              ViewerProtocolPolicy: config.behaviors[config.behaviors.length - 1].viewerProtocolPolicy,
              AllowedMethods: config.behaviors[config.behaviors.length - 1].allowedMethods,
              CachedMethods: config.behaviors[config.behaviors.length - 1].cachedMethods,
              Compress: config.behaviors[config.behaviors.length - 1].compress,
              DefaultTTL: config.behaviors[config.behaviors.length - 1].ttl.default,
              MinTTL: config.behaviors[config.behaviors.length - 1].ttl.min,
              MaxTTL: config.behaviors[config.behaviors.length - 1].ttl.max,
              ForwardedValues: {
                QueryString: config.behaviors[config.behaviors.length - 1].queryStringForwarding,
                Cookies: config.behaviors[config.behaviors.length - 1].cookies
              }
            },

            CacheBehaviors: config.behaviors.slice(0, -1).map(behavior => ({
              PathPattern: behavior.pathPattern,
              TargetOriginId: behavior.targetOriginId,
              ViewerProtocolPolicy: behavior.viewerProtocolPolicy,
              AllowedMethods: behavior.allowedMethods,
              CachedMethods: behavior.cachedMethods,
              Compress: behavior.compress,
              DefaultTTL: behavior.ttl.default,
              MinTTL: behavior.ttl.min,
              MaxTTL: behavior.ttl.max,
              ForwardedValues: {
                QueryString: behavior.queryStringForwarding,
                Cookies: behavior.cookies
              }
            })),

            CustomErrorResponses: config.customErrorPages.map(errorPage => ({
              ErrorCode: errorPage.errorCode,
              ResponseCode: errorPage.responseCode,
              ResponsePagePath: errorPage.responsePage,
              ErrorCachingMinTTL: errorPage.ttl
            })),

            Restrictions: {
              GeoRestriction: {
                RestrictionType: config.geoRestriction.type,
                Locations: config.geoRestriction.locations
              }
            },

            Logging: config.logging.enabled ? {
              Bucket: config.logging.bucket,
              Prefix: config.logging.prefix,
              IncludeCookies: config.logging.includeCookies || false
            } : undefined
          },
          Tags: Object.entries(config.tags).map(([key, value]) => ({
            Key: key,
            Value: value
          }))
        }
      }
    },

    Outputs: {
      DistributionId: {
        Description: 'CloudFront Distribution ID',
        Value: { Ref: 'CloudFrontDistribution' }
      },
      DistributionDomainName: {
        Description: 'CloudFront Distribution Domain Name',
        Value: { 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] }
      }
    }
  };
}

/**
 * Get configuration by environment
 */
export function getCloudFrontConfig(environment: 'production' | 'development' | 'loadtest' | 'adaptive'): CloudFrontConfig {
  switch (environment) {
    case 'production':
      return PRODUCTION_CLOUDFRONT_CONFIG;
    case 'development':
      return DEVELOPMENT_CLOUDFRONT_CONFIG;
    case 'loadtest':
      return LOAD_TEST_CLOUDFRONT_CONFIG;
    case 'adaptive':
      return ADAPTIVE_STREAMING_CONFIG;
    default:
      return DEVELOPMENT_CLOUDFRONT_CONFIG;
  }
}