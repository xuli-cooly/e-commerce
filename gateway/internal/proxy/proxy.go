package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

// Upstream represents a backend service.
type Upstream struct {
	URL *url.URL
}

func NewUpstream(rawURL string) *Upstream {
	u, err := url.Parse(rawURL)
	if err != nil {
		panic("invalid upstream URL: " + rawURL)
	}
	return &Upstream{URL: u}
}

// Handler returns a gin.HandlerFunc that reverse-proxies to the upstream.
func (u *Upstream) Handler() gin.HandlerFunc {
	proxy := httputil.NewSingleHostReverseProxy(u.URL)
	proxy.Transport = &http.Transport{
		ResponseHeaderTimeout: 30 * time.Second,
	}
	return func(c *gin.Context) {
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
