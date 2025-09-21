/**
 * Fallback FAQ System for AI Service Resilience
 *
 * Provides intelligent fallback responses when AI service is unavailable
 * Uses semantic search to match user questions with pre-written answers
 */

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: 'cooling-basics' | 'two-phase' | 'comparison' | 'safety' | 'installation' | 'troubleshooting';
  keywords: string[];
  relatedVideos?: string[];
  confidence?: number; // Set during search
}

export interface FallbackResponse {
  content: string;
  source: 'cached' | 'faq' | 'default';
  confidence: number;
  suggestedActions?: string[];
  relatedContent?: {
    videos?: string[];
    faqEntries?: string[];
  };
  fallback: true;
}

/**
 * Comprehensive FAQ database for two-phase cooling education
 */
export const COOLING_FAQ_DATABASE: FAQEntry[] = [
  // Two-Phase Cooling Basics
  {
    id: 'faq-001',
    category: 'two-phase',
    question: 'What is two-phase cooling?',
    answer: 'Two-phase cooling is an advanced thermal management system that uses liquid coolant that can change between liquid and vapor states. Unlike traditional liquid cooling that stays liquid, two-phase cooling leverages the heat absorption that occurs during phase changes (evaporation and condensation) to achieve superior cooling performance. The liquid absorbs heat and evaporates, then condenses back to liquid in cooler areas, creating a highly efficient heat transfer cycle.',
    keywords: ['two-phase', 'cooling', 'definition', 'basics', 'evaporation', 'condensation', 'phase change'],
    relatedVideos: ['intro-to-two-phase', 'phase-change-demonstration']
  },
  {
    id: 'faq-002',
    category: 'comparison',
    question: 'How does two-phase cooling compare to air cooling?',
    answer: 'Two-phase cooling significantly outperforms air cooling in several ways: 1) Heat capacity: Can handle much higher TDP components (300W+ vs 150W typical for air), 2) Temperature control: Maintains lower and more stable temperatures under load, 3) Noise: Operates more quietly as it doesn\'t rely on high-speed fans, 4) Performance: Prevents thermal throttling on high-performance CPUs and GPUs. However, two-phase systems are more complex and expensive than traditional air cooling.',
    keywords: ['comparison', 'air cooling', 'performance', 'TDP', 'temperature', 'throttling', 'noise'],
    relatedVideos: ['air-vs-two-phase', 'thermal-comparison']
  },
  {
    id: 'faq-003',
    category: 'comparison',
    question: 'How does two-phase cooling compare to traditional liquid cooling?',
    answer: 'Two-phase cooling offers several advantages over traditional liquid cooling: 1) Superior heat transfer: Phase changes absorb much more heat than simple liquid circulation, 2) Better temperature stability: More consistent temperatures under varying loads, 3) Efficiency: Requires less pumping power for the same cooling performance, 4) Compact design: Can achieve better cooling in smaller spaces. Traditional liquid cooling is simpler to install and maintain, but two-phase provides significantly better thermal performance for high-end systems.',
    keywords: ['liquid cooling', 'traditional', 'comparison', 'heat transfer', 'efficiency', 'performance'],
    relatedVideos: ['liquid-vs-two-phase', 'performance-benchmarks']
  },
  {
    id: 'faq-004',
    category: 'safety',
    question: 'Is two-phase cooling safe for electronics?',
    answer: 'Yes, two-phase cooling is completely safe for electronics when properly implemented. The cooling fluids used are dielectric (non-conductive), meaning they won\'t cause electrical shorts even if they contact components. Modern two-phase fluids also have minimal Global Warming Potential (GWP equivalent to gasoline at 20) and zero Ozone Depletion Potential (ODP). The systems are designed with proper sealing and safety measures. This technology has been proven safe in data centers and enterprise applications for years.',
    keywords: ['safety', 'dielectric', 'non-conductive', 'GWP', 'ODP', 'environmental', 'safe'],
    relatedVideos: ['safety-demonstration', 'dielectric-fluid-test']
  },
  {
    id: 'faq-005',
    category: 'two-phase',
    question: 'What fluids are used in two-phase cooling?',
    answer: 'Two-phase cooling systems use specialized dielectric fluids that are engineered for electronics cooling. These fluids have specific properties: non-conductive (dielectric), low boiling points for efficient phase changes, chemical stability, and environmental safety. Common types include engineered fluorocarbons and hydrofluoroolefins (HFOs). Modern fluids have minimal environmental impact with low GWP (Global Warming Potential) and zero ODP (Ozone Depletion Potential). These are the same fluids proven in enterprise data center applications.',
    keywords: ['fluids', 'dielectric', 'fluorocarbons', 'HFO', 'boiling point', 'chemical stability'],
    relatedVideos: ['fluid-properties', 'fluid-demonstration']
  },

  // Installation and Setup
  {
    id: 'faq-006',
    category: 'installation',
    question: 'How difficult is it to install two-phase cooling?',
    answer: 'Two-phase cooling installation is moderately complex, similar to a custom liquid cooling loop but with additional considerations. Key steps include: 1) Proper mounting of the cooling chamber, 2) Filling with the correct amount of dielectric fluid, 3) Ensuring proper sealing, 4) Testing for leaks and proper operation. While more involved than air cooling, it\'s designed to be achievable by experienced PC builders. Detailed instructions and video guides are provided to ensure successful installation.',
    keywords: ['installation', 'difficulty', 'mounting', 'filling', 'sealing', 'testing', 'instructions'],
    relatedVideos: ['installation-guide', 'step-by-step-install']
  },
  {
    id: 'faq-007',
    category: 'installation',
    question: 'What tools do I need for installation?',
    answer: 'Installation requires standard PC building tools plus a few specialized items: 1) Standard screwdrivers (Phillips head), 2) Thermal paste applicator, 3) Measuring device for fluid volume, 4) Lint-free cloths for cleaning, 5) Safety equipment (gloves, eye protection), 6) Leak detection materials. All specialized tools needed are included with the cooling system. The installation process is designed to use commonly available tools whenever possible.',
    keywords: ['tools', 'installation', 'screwdrivers', 'thermal paste', 'safety', 'equipment'],
    relatedVideos: ['tools-needed', 'installation-prep']
  },

  // Troubleshooting
  {
    id: 'faq-008',
    category: 'troubleshooting',
    question: 'What if my temperatures are higher than expected?',
    answer: 'Higher than expected temperatures can have several causes: 1) Insufficient fluid level - check if more dielectric fluid is needed, 2) Air bubbles in the system - may require bleeding, 3) Improper mounting - ensure good contact with heat sources, 4) Ambient temperature - very hot room conditions affect performance, 5) Extreme workloads - verify the load is within system specifications. Most issues are resolved by checking fluid levels and ensuring proper contact. Detailed troubleshooting guides are available.',
    keywords: ['troubleshooting', 'high temperatures', 'fluid level', 'air bubbles', 'mounting', 'ambient'],
    relatedVideos: ['troubleshooting-guide', 'temperature-diagnostics']
  },
  {
    id: 'faq-009',
    category: 'troubleshooting',
    question: 'How do I know if the system is working properly?',
    answer: 'A properly functioning two-phase cooling system shows several indicators: 1) Temperatures significantly lower than air cooling under load, 2) Stable temperatures during stress testing, 3) No thermal throttling during demanding workloads, 4) Visible phase change activity (if using transparent chamber), 5) Quiet operation, 6) No fluid leaks. Temperature monitoring software will show consistent, low temperatures even under maximum load. The system should maintain performance that was impossible with previous cooling methods.',
    keywords: ['working properly', 'indicators', 'temperatures', 'stable', 'throttling', 'phase change', 'monitoring'],
    relatedVideos: ['system-monitoring', 'performance-verification']
  },

  // General Information
  {
    id: 'faq-010',
    category: 'cooling-basics',
    question: 'Why do modern CPUs and GPUs need better cooling?',
    answer: 'Modern high-performance components generate unprecedented amounts of heat: 1) CPUs like the i9-14900KS can draw 250W+ under load, 2) GPUs like RTX 4090 can exceed 450W, 3) Higher transistor densities create heat concentration, 4) Boost algorithms push components harder when thermals allow, 5) Performance gains depend on sustained operation without throttling. Traditional cooling solutions increasingly struggle to handle these thermal loads, making advanced cooling essential for maximum performance.',
    keywords: ['modern CPUs', 'GPUs', 'heat generation', 'TDP', 'i9-14900KS', 'RTX 4090', 'thermal throttling'],
    relatedVideos: ['modern-thermal-challenges', 'cpu-gpu-heat-generation']
  }
];

/**
 * Fallback FAQ service for intelligent response matching
 */
export class FallbackFAQService {
  private faqDatabase: FAQEntry[];
  private responseCache = new Map<string, FallbackResponse>();

  constructor(faqDatabase: FAQEntry[] = COOLING_FAQ_DATABASE) {
    this.faqDatabase = faqDatabase;
  }

  /**
   * Search for the best FAQ match for a user question
   */
  async searchFAQ(question: string): Promise<FallbackResponse> {
    // Check cache first
    const cacheKey = this.normalizeQuestion(question);
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      return { ...cached, source: 'cached' };
    }

    // Find best matching FAQ entry
    const matches = this.findBestMatches(question);

    if (matches.length > 0 && matches[0].confidence! > 0.3) {
      const bestMatch = matches[0];
      const response: FallbackResponse = {
        content: bestMatch.answer,
        source: 'faq',
        confidence: bestMatch.confidence!,
        suggestedActions: [
          'Watch related videos',
          'Browse more FAQs',
          'Try asking again later'
        ],
        relatedContent: {
          videos: bestMatch.relatedVideos,
          faqEntries: matches.slice(1, 3).map(m => m.id)
        },
        fallback: true
      };

      // Cache the response
      this.responseCache.set(cacheKey, response);
      return response;
    }

    // No good match found - return default response
    return this.getDefaultResponse(question);
  }

  /**
   * Find FAQ entries that best match the question
   */
  private findBestMatches(question: string): FAQEntry[] {
    const normalizedQuestion = this.normalizeQuestion(question);
    const questionWords = normalizedQuestion.split(' ').filter(word => word.length > 2);

    const scoredEntries = this.faqDatabase.map(entry => {
      let score = 0;

      // Score based on keyword matches
      for (const keyword of entry.keywords) {
        if (normalizedQuestion.includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for exact keyword matches
        }
      }

      // Score based on question similarity
      const entryQuestionWords = this.normalizeQuestion(entry.question).split(' ');
      for (const word of questionWords) {
        if (entryQuestionWords.includes(word)) {
          score += 1;
        }
      }

      // Score based on answer content relevance
      const normalizedAnswer = entry.answer.toLowerCase();
      for (const word of questionWords) {
        if (normalizedAnswer.includes(word)) {
          score += 0.5;
        }
      }

      return {
        ...entry,
        confidence: Math.min(score / (questionWords.length + entry.keywords.length), 1)
      };
    });

    return scoredEntries
      .filter(entry => entry.confidence! > 0)
      .sort((a, b) => b.confidence! - a.confidence!)
      .slice(0, 5);
  }

  /**
   * Normalize question for better matching
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Get default response when no FAQ matches
   */
  private getDefaultResponse(question: string): FallbackResponse {
    return {
      content: "I'm temporarily unable to process your question, but I can still help! Our video library contains comprehensive information about two-phase cooling technology, and you can browse our FAQ section for common questions. You can also try asking your question again in a few minutes.",
      source: 'default',
      confidence: 0,
      suggestedActions: [
        'Browse Video Library',
        'View FAQ Section',
        'Try Again in 1 Minute',
        'Contact Support'
      ],
      relatedContent: {
        videos: ['intro-to-two-phase', 'cooling-comparison', 'safety-demonstration']
      },
      fallback: true
    };
  }

  /**
   * Get FAQ entries by category
   */
  getFAQByCategory(category: FAQEntry['category']): FAQEntry[] {
    return this.faqDatabase.filter(entry => entry.category === category);
  }

  /**
   * Get all available FAQ categories
   */
  getCategories(): FAQEntry['category'][] {
    const categories = new Set(this.faqDatabase.map(entry => entry.category));
    return Array.from(categories);
  }

  /**
   * Add cached AI response for future fallback use
   */
  cacheAIResponse(question: string, response: string): void {
    const cacheKey = this.normalizeQuestion(question);
    const fallbackResponse: FallbackResponse = {
      content: response,
      source: 'cached',
      confidence: 1,
      fallback: true
    };
    this.responseCache.set(cacheKey, fallbackResponse);
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }
}