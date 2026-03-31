package mysql

import (
	"fmt"

	"community-service/internal/model/entity"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(dsn string) error {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return fmt.Errorf("mysql connect: %w", err)
	}
	if err := db.AutoMigrate(&entity.Post{}, &entity.PostProduct{}, &entity.PostLike{}); err != nil {
		return fmt.Errorf("automigrate: %w", err)
	}
	DB = db
	return nil
}
