interface UserRateLimit {
  timestamps: number[];
}

class RateLimiter {
  static canSend(arg0: string) {
      throw new Error("Method not implemented.");
  }
  private user = new Map<string, UserRateLimit>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  canSend(userId: string): boolean {
    const now = Date.now();

    if (!this.user.has(userId)) {
      this.user.set(userId, { timestamps: [] });
    }
    const user = this.user.get(userId)!;

    // Remove expired timestamps
    user.timestamps = user.timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (user.timestamps.length >= this.limit) {
      return false;
    }
    user.timestamps.push(now);
    return true;
  }
  removeUser(userId: string): void {
    this.user.delete(userId);
  }
}

export default RateLimiter;
