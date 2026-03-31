package config

import (
	"fmt"
	"log"
	"net"

	"github.com/nacos-group/nacos-sdk-go/v2/clients"
	"github.com/nacos-group/nacos-sdk-go/v2/clients/config_client"
	"github.com/nacos-group/nacos-sdk-go/v2/clients/naming_client"
	"github.com/nacos-group/nacos-sdk-go/v2/common/constant"
	"github.com/nacos-group/nacos-sdk-go/v2/vo"
)

// InitNacosClient creates Nacos config and naming clients.
func InitNacosClient(cfg *NacosConfig) (config_client.IConfigClient, naming_client.INamingClient, error) {
	sc := []constant.ServerConfig{
		*constant.NewServerConfig(cfg.Addr, cfg.Port),
	}
	cc := *constant.NewClientConfig(
		constant.WithNamespaceId(cfg.Namespace),
		constant.WithTimeoutMs(5000),
		constant.WithNotLoadCacheAtStart(true),
		constant.WithLogLevel("warn"),
	)

	configCli, err := clients.NewConfigClient(vo.NacosClientParam{
		ClientConfig:  &cc,
		ServerConfigs: sc,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("nacos config client: %w", err)
	}

	namingCli, err := clients.NewNamingClient(vo.NacosClientParam{
		ClientConfig:  &cc,
		ServerConfigs: sc,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("nacos naming client: %w", err)
	}

	return configCli, namingCli, nil
}

// PullConfig fetches a config item from Nacos and returns its content as a string.
func PullConfig(client config_client.IConfigClient, dataID, group string) (string, error) {
	content, err := client.GetConfig(vo.ConfigParam{
		DataId: dataID,
		Group:  group,
	})
	if err != nil {
		return "", fmt.Errorf("nacos get config %s/%s: %w", group, dataID, err)
	}
	return content, nil
}

// WatchConfig registers a listener for config changes. onChange receives the new content.
func WatchConfig(client config_client.IConfigClient, dataID, group string, onChange func(string)) error {
	return client.ListenConfig(vo.ConfigParam{
		DataId: dataID,
		Group:  group,
		OnChange: func(_, _, _, data string) {
			onChange(data)
		},
	})
}

// localIP returns the first non-loopback IPv4 address of the machine.
func localIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "127.0.0.1"
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if v4 := ipnet.IP.To4(); v4 != nil {
				return v4.String()
			}
		}
	}
	return "127.0.0.1"
}

// RegisterService registers the current instance with Nacos naming service.
func RegisterService(client naming_client.INamingClient, cfg *NacosConfig) {
	ip := localIP()
	ok, err := client.RegisterInstance(vo.RegisterInstanceParam{
		Ip:          ip,
		Port:        uint64(cfg.ServicePort),
		ServiceName: cfg.ServiceName,
		GroupName:   cfg.Group,
		Healthy:     true,
		Enable:      true,
		Weight:      1,
		Ephemeral:   true,
	})
	if err != nil || !ok {
		log.Printf("[nacos] register service failed: %v", err)
		return
	}
	log.Printf("[nacos] registered %s at %s:%d", cfg.ServiceName, ip, cfg.ServicePort)
}

// DeregisterService removes the current instance from Nacos naming service.
func DeregisterService(client naming_client.INamingClient, cfg *NacosConfig) {
	ip := localIP()
	ok, err := client.DeregisterInstance(vo.DeregisterInstanceParam{
		Ip:          ip,
		Port:        uint64(cfg.ServicePort),
		ServiceName: cfg.ServiceName,
		GroupName:   cfg.Group,
		Ephemeral:   true,
	})
	if err != nil || !ok {
		log.Printf("[nacos] deregister service failed: %v", err)
		return
	}
	log.Printf("[nacos] deregistered %s", cfg.ServiceName)
}

// NamingClientFromCfg is a convenience wrapper used by main.go.
// It holds both clients so main only needs to carry one value.
type NacosClients struct {
	Config naming_client.INamingClient
	Naming naming_client.INamingClient
	cfg    *NacosConfig
}

// NewNacosClients initialises Nacos and returns a ready-to-use NacosClients.
// Returns nil (not an error) when Nacos is disabled so callers can always check != nil.
func NewNacosClients(cfg *NacosConfig) (*NacosClients, error) {
	if !cfg.Enabled {
		return nil, nil
	}
	_, namingCli, err := InitNacosClient(cfg)
	if err != nil {
		return nil, err
	}
	return &NacosClients{Naming: namingCli, cfg: cfg}, nil
}

func (n *NacosClients) Register()   { RegisterService(n.Naming, n.cfg) }
func (n *NacosClients) Deregister() { DeregisterService(n.Naming, n.cfg) }

