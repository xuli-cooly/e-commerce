package redisrepo

import (
	"context"
	"fmt"
	"time"

	"auth-service/config"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Init(cfg *config.RedisConfig) error {
	c := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := c.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("connect redis: %w", err)
	}
	Client = c
	return nil
}
