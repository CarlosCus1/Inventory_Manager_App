/**
 * Sistema de cache local optimizado para minimal interaction
 *
 * ✅ CARACTERÍSTICAS:
 * - Memory cache para acceso instantáneo
 * - Persistencia opcional en localStorage
 * - TTL (Time To Live) configurable
 * - Auto-cleanup de datos expirados
 * - Zero API calls para operaciones básicas
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SessionCache {
  private memoryCache = new Map<string, CacheItem<unknown>>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get data from cache with fallback to localStorage
   */
  get<T>(key: string): T | null {
    try {
      // 1. Try memory cache first (instantáneo)
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && this.isValid(memoryItem)) {
        return memoryItem.data as T;
      }

      // 2. Try localStorage (persistente)
      const stored = localStorage.getItem(`session_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.isValid(parsed)) {
          // Restore to memory cache
          this.memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          // Remove expired data
          localStorage.removeItem(`session_cache_${key}`);
        }
      }

      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Set data in both memory cache and localStorage
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    try {
      // Memory cache (instantáneo)
      this.memoryCache.set(key, item);

      // localStorage (persistente)
      localStorage.setItem(`session_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Remove specific item from cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(`session_cache_${key}`);
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.memoryCache.clear();

    // Remove only session cache items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('session_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Check if cache item is still valid
   */
  private isValid(item: CacheItem<unknown>): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryItems: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): string {
    let totalSize = 0;
    for (const [key, item] of this.memoryCache) {
      totalSize += key.length + JSON.stringify(item).length;
    }
    return `${(totalSize / 1024).toFixed(2)}KB`;
  }

  /**
   * Cleanup expired items
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache) {
      if (now - item.timestamp >= item.ttl) {
        this.memoryCache.delete(key);
        localStorage.removeItem(`session_cache_${key}`);
      }
    }
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();

// Export cleanup function for use in components
export const cleanupSessionCache = () => sessionCache.cleanup();