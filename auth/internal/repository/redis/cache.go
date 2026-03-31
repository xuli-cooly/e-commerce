package redisrepo

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type cacheRepo struct{ client *redis.Client }

func NewCacheRepo(client *redis.Client) *cacheRepo { return &cacheRepo{client} }

func (r *cacheRepo) Get(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

func (r *cacheRepo) Set(ctx context.Context, key string, val any, ttl time.Duration) error {
	b, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	return r.client.Set(ctx, key, b, ttl).Err()
}

func (r *cacheRepo) Del(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

func (r *cacheRepo) Exists(ctx context.Context, key string) (bool, error) {
	n, err := r.client.Exists(ctx, key).Result()
	return n > 0, err
}

func (r *cacheRepo) SetNX(ctx context.Context, key string, val any, ttl time.Duration) (bool, error) {
	b, err := json.Marshal(val)
	if err != nil {
		return false, err
	}
	return r.client.SetNX(ctx, key, b, ttl).Result()
}
