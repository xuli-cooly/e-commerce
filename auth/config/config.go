package config

import (
	"bytes"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	App           AppConfig           `mapstructure:"app"`
	DB            DBConfig            `mapstructure:"db"`
	Redis         RedisConfig         `mapstructure:"redis"`
	Elasticsearch ElasticsearchConfig `mapstructure:"elasticsearch"`
	RabbitMQ      RabbitMQConfig      `mapstructure:"rabbitmq"`
	JWT           JWTConfig           `mapstructure:"jwt"`
	Admin         AdminConfig         `mapstructure:"admin"`
	Email         EmailConfig         `mapstructure:"email"`
	Nacos         NacosConfig         `mapstructure:"nacos"`
	Tracing       TracingConfig       `mapstructure:"tracing"`
	Log           LogConfig           `mapstructure:"log"`
}

type AppConfig struct {
	Port int    `mapstructure:"port"`
	Env  string `mapstructure:"env"`
}

type DBConfig struct {
	DSN          string `mapstructure:"dsn"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
}

type RedisConfig struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type ElasticsearchConfig struct {
	Addr      string `mapstructure:"addr"`
	TimeoutMs int    `mapstructure:"timeout_ms"`
}

type RabbitMQConfig struct {
	URL string `mapstructure:"url"`
}

type JWTConfig struct {
	Secret     string `mapstructure:"secret"`
	ExpireDays int    `mapstructure:"expire_days"`
}

type AdminConfig struct {
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

type EmailConfig struct {
	SMTPHost string `mapstructure:"smtp_host"`
	SMTPPort int    `mapstructure:"smtp_port"`
	Sender   string `mapstructure:"sender"`
	AuthCode string `mapstructure:"auth_code"`
}

type NacosConfig struct {
	Enabled     bool   `mapstructure:"enabled"`
	Addr        string `mapstructure:"addr"`
	Port        uint64 `mapstructure:"port"`
	Namespace   string `mapstructure:"namespace"`
	Group       string `mapstructure:"group"`
	DataID      string `mapstructure:"data_id"`
	ServiceName string `mapstructure:"service_name"`
	ServicePort int    `mapstructure:"service_port"`
}

type TracingConfig struct {
	Enabled         bool   `mapstructure:"enabled"`
	JaegerEndpoint  string `mapstructure:"jaeger_endpoint"`
	ServiceName     string `mapstructure:"service_name"`
}

type LogConfig struct {
	Level      string `mapstructure:"level"`
	FilePath   string `mapstructure:"file_path"`
	MaxSizeMB  int    `mapstructure:"max_size_mb"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAgeDays int    `mapstructure:"max_age_days"`
	Compress   bool   `mapstructure:"compress"`
}

var Global *Config

func Load(cfgFile string) {
	viper.SetConfigFile(cfgFile)
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("failed to read config: %v", err)
	}

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		log.Fatalf("failed to unmarshal config: %v", err)
	}

	// If Nacos is enabled, pull remote config and overlay on top of local yaml.
	if cfg.Nacos.Enabled {
		configClient, _, err := InitNacosClient(&cfg.Nacos)
		if err != nil {
			log.Printf("[config] nacos client init failed, using local yaml: %v", err)
		} else {
			content, err := PullConfig(configClient, cfg.Nacos.DataID, cfg.Nacos.Group)
			if err != nil {
				log.Printf("[config] nacos pull failed, using local yaml: %v", err)
			} else {
				v2 := viper.New()
				v2.SetConfigType("yaml")
				if err := v2.ReadConfig(bytes.NewBufferString(content)); err != nil {
					log.Printf("[config] nacos config parse failed, using local yaml: %v", err)
				} else {
					// Merge remote config into viper and re-unmarshal.
					for _, k := range v2.AllKeys() {
						viper.Set(k, v2.Get(k))
					}
					if err := viper.Unmarshal(cfg); err != nil {
						log.Printf("[config] nacos unmarshal failed, using local yaml: %v", err)
					}
				}
			}
		}
	}

	Global = cfg
}
