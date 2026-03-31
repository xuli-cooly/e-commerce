package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"community-service/internal/model/entity"
	mysqlrepo "community-service/internal/repository/mysql"
)

var samplePosts = []struct {
	Title      string
	Content    string
	ImageURLs  []string
}{
	{
		Title:   "入手这款运动鞋真的绝了 🔥",
		Content: "穿了一个月了，回弹很好，跑步不累脚。颜值在线，上脚超好看，强烈推荐！",
		ImageURLs: []string{
			"https://picsum.photos/seed/shoes1/600/800",
			"https://picsum.photos/seed/shoes2/600/800",
		},
	},
	{
		Title:   "办公桌显示器支架开箱 ✨",
		Content: "终于告别了原装底座！双屏支架安装超简单，颈椎舒服多了。做工扎实，推荐给久坐党。",
		ImageURLs: []string{
			"https://picsum.photos/seed/desk1/600/800",
		},
	},
	{
		Title:   "平价好物分享：这款保温杯真的很能装",
		Content: "容量800ml，保温12小时亲测有效。杯盖密封好，包包里放着不会漏。颜色也很好看，买了两个！",
		ImageURLs: []string{
			"https://picsum.photos/seed/cup1/600/800",
			"https://picsum.photos/seed/cup2/600/800",
			"https://picsum.photos/seed/cup3/600/800",
		},
	},
	{
		Title:   "无线蓝牙耳机测评 | 百元价位天花板",
		Content: "低音下潜很好，主动降噪效果比预期强。通勤路上地铁声音基本听不见。续航20h，连续开会一天完全够用。",
		ImageURLs: []string{
			"https://picsum.photos/seed/earphone1/600/800",
		},
	},
	{
		Title:   "种草这款机械键盘，手感超好！",
		Content: "红轴手感顺滑，打字声音不扰人。RGB灯效很好看，可以自定义颜色。全铝外壳，放桌上超有质感。",
		ImageURLs: []string{
			"https://picsum.photos/seed/keyboard1/600/800",
			"https://picsum.photos/seed/keyboard2/600/800",
		},
	},
	{
		Title:   "懒人必备：这款扫地机器人解放双手",
		Content: "自动规划路线，边边角角都能扫到。连接APP可以定时清扫，每天回家都是干净的地板。",
		ImageURLs: []string{
			"https://picsum.photos/seed/robot1/600/800",
		},
	},
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	dsn := getenv("COMMUNITY_DB_DSN", "root:Trading@2026#Secure@tcp(localhost:3306)/community?charset=utf8mb4&parseTime=True&loc=Local")

	if err := mysqlrepo.Init(dsn); err != nil {
		log.Fatalf("db init: %v", err)
	}

	postRepo := mysqlrepo.NewPostRepo(mysqlrepo.DB)
	ctx := context.Background()

	// Idempotency: skip if posts already exist.
	existing, total, _ := postRepo.List(ctx, mysqlrepo.ListPostsParams{
		Sort: "latest", Status: "all", Page: 1, Size: 1,
	})
	_ = existing
	if total > 0 {
		fmt.Println("community seed: posts already exist, skipping")
		return
	}

	// Try to get some product IDs from trading-service via DSN or fallback.
	// Use static IDs 1-6 as fallback; the foreign key constraint doesn't exist (separate DB).
	productIDs := []int64{1, 2, 3, 4, 5, 6}

	for i, sample := range samplePosts {
		post := &entity.Post{
			UserID:    1, // admin user
			Title:     sample.Title,
			Content:   sample.Content,
			ImageURLs: sample.ImageURLs,
			Status:    "active",
		}
		if err := postRepo.Create(ctx, post); err != nil {
			log.Printf("seed post %d error: %v", i, err)
			continue
		}
		// Associate with 1-2 products per post.
		pids := productIDs[:min(2, len(productIDs)-i)]
		_ = postRepo.SaveProductLinks(ctx, post.ID, pids)
		fmt.Printf("seeded post #%d: %s\n", post.ID, post.Title)
	}

	fmt.Println("community seed: done")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
