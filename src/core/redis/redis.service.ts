import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6380;
    const password = process.env.REDIS_PASSWORD || '';

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(
          `Redis connection lost. Attempting to reconnect in ${delay}ms...`,
        );
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Redis connected at ${host}:${port}`);
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  async seedInventory(productId: string, quantity: number) {
    const key = this.inventoryKey(productId);
    await this.hset(key, {
      available: String(quantity),
      reserved: '0',
    });
    return true;
  }

  async reserveStock(
    productId: string,
    qty: number,
    reservationId: string,
    ttlSeconds = 900,
  ): Promise<{ ok: boolean; code: string; available?: number }> {
    const inventoryKey = this.inventoryKey(productId);
    const reservationKey = this.reservationKey(reservationId);

    // Lua script
    const script = `
    local invKey = KEYS[1]
    local resKey = KEYS[2]

    local qty = tonumber(ARGV[1])
    local ttl = tonumber(ARGV[2])
    local productId = ARGV[3]
    local reservationId = ARGV[4]

    -- 1. Duplicate / retry check
    if redis.call('EXISTS', resKey) == 1 then
      local existingQty = tonumber(redis.call('HGET', resKey, 'qty') or '0')
      local existingProductId = redis.call('HGET', resKey, 'productId')
      local existingStatus = redis.call('HGET', resKey, 'status')
      local available = tonumber(redis.call('HGET', invKey, 'available') or '0')

      -- mismatch protection
      if existingQty ~= qty or existingProductId ~= productId then
        return {3, 'RESERVATION_MISMATCH', available}
      end

      if existingStatus == 'confirmed' then
        return {4, 'ALREADY_CONFIRMED', available}
      end

      if existingStatus == 'reserved' then
        return {2, 'ALREADY_RESERVED', available}
      end

      -- existingStatus == 'released' can be reserved again
    end

    -- 2. Read inventory
    local available = tonumber(redis.call('HGET', invKey, 'available') or '0')
    local reserved = tonumber(redis.call('HGET', invKey, 'reserved') or '0')

    -- 3. Validate stock
    if available < qty then
      return {0, 'INSUFFICIENT_STOCK', available}
    end

    -- 4. Move stock
    available = available - qty
    reserved = reserved + qty

    redis.call('HSET', invKey, 'available', available, 'reserved', reserved)

    -- 5. Create reservation
    redis.call(
      'HSET',
      resKey,
      'productId', productId,
      'qty', qty,
      'status', 'reserved',
      'reservationId', reservationId
    )

    redis.call('EXPIRE', resKey, ttl)

    -- 6. Success
    return {1, 'RESERVED', available}
    `;

    const result = (await this.eval(
      script,
      [inventoryKey, reservationKey],
      [qty, ttlSeconds, productId, reservationId],
    )) as [number, string, number];

    return {
      ok: result[0] === 1 || result[0] === 2,
      code: result[1],
      available: Number(result[2]),
    };
  }

  async confirmReservation(
    productId: string,
    quantity: number,
    reservationId: string,
  ): Promise<{ ok: boolean; code: string; reserved?: number }> {
    const inventoryKey = this.inventoryKey(productId);
    const reservationKey = this.reservationKey(reservationId);

    const script = `
    local invKey = KEYS[1]
    local resKey = KEYS[2]

    local qty = tonumber(ARGV[1])
    local productId = ARGV[2]

    -- 1. existence
    if redis.call('EXISTS', resKey) == 0 then
      return {0, 'NOT_FOUND'}
    end

    local status = redis.call('HGET', resKey, 'status')
    local existingQty = tonumber(redis.call('HGET', resKey, 'qty') or '0')
    local existingProductId = redis.call('HGET', resKey, 'productId')

    -- 2. state guards
    if status == 'confirmed' then
      return {2, 'ALREADY_CONFIRMED'}
    end

    if existingQty ~= qty or existingProductId ~= productId then
      return {3, 'RESERVATION_MISMATCH'}
    end

    -- 3. update inventory
    local reserved = tonumber(redis.call('HGET', invKey, 'reserved') or '0')
    if reserved < qty then
      return {4, 'INCONSISTENT_RESERVED', reserved}
    end
    reserved = reserved - qty

    redis.call('HSET', invKey, 'reserved', reserved)

    -- 4. mark confirmed
    redis.call('HSET', resKey, 'status', 'confirmed')

    -- optional: persist metadata (remove expiry)
    redis.call('PERSIST', resKey)

    return {1, 'CONFIRMED', reserved}
    `;

    const result = (await this.eval(
      script,
      [inventoryKey, reservationKey],
      [quantity, productId],
    )) as [number, string, number?];

    return {
      ok: result[0] === 1 || result[0] === 2,
      code: result[1],
      reserved: result[2] !== undefined ? Number(result[2]) : undefined,
    };
  }

  async releaseReservation(
    productId: string,
    qty: number,
    reservationId: string,
  ): Promise<{
    ok: boolean;
    code: string;
    available?: number;
    reserved?: number;
  }> {
    const invKey = this.inventoryKey(productId);
    const resKey = this.reservationKey(reservationId);

    const script = `
    local invKey = KEYS[1]
    local resKey = KEYS[2]

    local qty = tonumber(ARGV[1])
    local productId = ARGV[2]

    -- 1. existence
    if redis.call('EXISTS', resKey) == 0 then
      return {0, 'NOT_FOUND'}
    end

    local status = redis.call('HGET', resKey, 'status')
    local existingQty = tonumber(redis.call('HGET', resKey, 'qty') or '0')
    local existingProductId = redis.call('HGET', resKey, 'productId')

    -- 2. guards
    if status == 'released' then
      return {2, 'ALREADY_RELEASED'}
    end

    if status == 'confirmed' then
      return {3, 'ALREADY_CONFIRMED'}
    end

    if existingQty ~= qty or existingProductId ~= productId then
      return {4, 'RESERVATION_MISMATCH'}
    end

    -- 3. update inventory
    local available = tonumber(redis.call('HGET', invKey, 'available') or '0')
    local reserved = tonumber(redis.call('HGET', invKey, 'reserved') or '0')
    if reserved < qty then
      return {5, 'INCONSISTENT_RESERVED', available, reserved}
    end

    available = available + qty
    reserved = reserved - qty

    redis.call('HSET', invKey, 'available', available, 'reserved', reserved)

    -- 4. mark released
    redis.call('HSET', resKey, 'status', 'released')

    -- optional: cleanup (short ttl)
    redis.call('EXPIRE', resKey, 300)

    return {1, 'RELEASED', available, reserved}
    `;

    const result = (await this.eval(
      script,
      [invKey, resKey],
      [qty, productId],
    )) as [number, string, number?, number?];

    return {
      ok: result[0] === 1 || result[0] === 2,
      code: result[1],
      available: result[2] !== undefined ? Number(result[2]) : undefined,
      reserved: result[3] !== undefined ? Number(result[3]) : undefined,
    };
  }

  async seedIfAbsent(productId: string, quantity: number) {
    const script = `
      local key = KEYS[1]
      if redis.call('EXISTS', key) == 0 then
        redis.call('HSET', key, 'available', ARGV[1], 'reserved', '0')
        return 1
      end
      return 0
    `;
    const key = this.inventoryKey(productId);
    return (await this.eval(script, [key], [String(quantity)])) === 1;
  }

  // ---- Helpers ----

  async hset(key: string, data: Record<string, any>) {
    return this.client.hset(key, data);
  }

  async hgetall(key: string) {
    return this.client.hgetall(key);
  }

  async eval(script: string, keys: string[], args: (string | number)[]) {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  private inventoryKey(productId: string) {
    return `inv:product:${productId}`;
  }

  private reservationKey(reservationId: string) {
    return `inv:reservation:${reservationId}`;
  }
}
