import { formatPercentage, formatDuration, formatFileSize, formatDate } from '@/utils/format'

describe('Format utilities', () => {
  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(85.6789)).toBe('85.7%')
    })

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(85.6789, 2)).toBe('85.68%')
    })

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('should handle 100%', () => {
      expect(formatPercentage(100)).toBe('100.0%')
    })
  })

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('0:45')
    })

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2:05')
    })

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3665)).toBe('1:01:05')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(2097152)).toBe('2.0 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(3221225472)).toBe('3.0 GB')
    })

    it('should handle zero size', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })
  })

  describe('formatDate', () => {
    it('should format date in default format', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      expect(formatDate(date)).toBe('Dec 25, 2023')
    })

    it('should format date with custom format', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      expect(formatDate(date, { year: 'numeric', month: 'numeric', day: 'numeric' })).toMatch(
        /12\/25\/2023|25\/12\/2023/
      )
    })

    it('should format date with time', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      const result = formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      expect(result).toContain('2023')
      expect(result).toContain('10:30')
    })
  })
})
