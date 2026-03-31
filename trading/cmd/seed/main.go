package main

import (
	"context"
	"fmt"
	"log"

	"trading-service/config"
	"trading-service/internal/model/entity"
	esrepo "trading-service/internal/repository/es"
	dbpkg "trading-service/internal/repository/mysql"
)

func main() {
	config.Load("config/config.yaml")

	if err := dbpkg.Init(&config.Global.DB); err != nil {
		log.Fatalf("init db: %v", err)
	}
	db := dbpkg.DB

	if err := esrepo.Init(&config.Global.Elasticsearch); err != nil {
		log.Printf("[warn] ES unavailable, skipping ES indexing: %v", err)
	}

	// ── Products ─────────────────────────────────────────────────────────────
	products := []entity.Product{
		// 手机
		{Name: "iPhone 15 Pro", Description: "Apple 最新旗舰手机，A17 Pro 芯片，钛金属机身，支持 USB-C 接口，6.1 英寸超视网膜 XDR 显示屏。", Price: 8999, Stock: 100, IsActive: true},
		{Name: "iPhone 15", Description: "A16 仿生芯片，6.1 英寸超视网膜 XDR 显示屏，支持动态岛，4800 万像素主摄。", Price: 5999, Stock: 150, IsActive: true},
		{Name: "iPhone 14", Description: "A15 仿生芯片，6.1 英寸超视网膜 XDR 屏，支持碰撞检测和卫星紧急求救。", Price: 4999, Stock: 80, IsActive: true},
		{Name: "Samsung Galaxy S24 Ultra", Description: "高通骁龙 8 Gen 3，6.8 英寸动态 AMOLED 屏，内置 S Pen，2 亿像素主摄。", Price: 9999, Stock: 60, IsActive: true},
		{Name: "Samsung Galaxy S24", Description: "骁龙 8 Gen 3，6.2 英寸 Dynamic AMOLED 2X，IP68 防水，50MP 主摄。", Price: 6499, Stock: 90, IsActive: true},
		{Name: "小米 14 Pro", Description: "骁龙 8 Gen 3，徕卡光学镜头，6.73 英寸 LTPO AMOLED，5000mAh 电池。", Price: 4999, Stock: 120, IsActive: true},
		{Name: "小米 14", Description: "骁龙 8 Gen 3，徕卡镜头，6.36 英寸直屏，轻薄旗舰设计，支持 90W 快充。", Price: 3999, Stock: 200, IsActive: true},
		{Name: "OPPO Find X7 Ultra", Description: "天玑 9300，哈苏相机系统，双潜望长焦，6.82 英寸 AMOLED 屏，100W 超级闪充。", Price: 6999, Stock: 70, IsActive: true},
		{Name: "华为 Mate 60 Pro", Description: "麒麟 9000S，6.82 英寸 LTPO OLED，卫星通话，超长续航，50MP 超感知摄像头。", Price: 6999, Stock: 50, IsActive: true},
		{Name: "vivo X100 Pro", Description: "天玑 9300，蔡司摄影系统，6.78 英寸 AMOLED，5400mAh 电池，100W 快充。", Price: 4999, Stock: 110, IsActive: true},
		{Name: "一加 12", Description: "骁龙 8 Gen 3，哈苏相机，6.82 英寸 2K LTPO 屏，100W 超级闪充，5000mAh。", Price: 4299, Stock: 130, IsActive: true},
		{Name: "荣耀 Magic6 Pro", Description: "骁龙 8 Gen 3，超动眼神识别，6.8 英寸 LTPO 四曲屏，5600mAh 超大电池。", Price: 5999, Stock: 75, IsActive: true},

		// 平板
		{Name: "iPad Pro 13 M4", Description: "M4 芯片，13 英寸超视网膜 XDR 显示屏，超薄机身，支持 Apple Pencil Pro。", Price: 12999, Stock: 40, IsActive: true},
		{Name: "iPad Air 5", Description: "M1 芯片，10.9 英寸全面屏，支持 Apple Pencil 第二代，USB-C 接口。", Price: 4799, Stock: 80, IsActive: true},
		{Name: "iPad mini 6", Description: "A15 仿生芯片，8.3 英寸液态视网膜屏，支持 Apple Pencil 第二代，5G 可选。", Price: 3799, Stock: 60, IsActive: true},
		{Name: "Samsung Galaxy Tab S9 Ultra", Description: "骁龙 8 Gen 2，14.6 英寸 Dynamic AMOLED 2X，附赠 S Pen，IP68 防水。", Price: 9999, Stock: 30, IsActive: true},
		{Name: "小米平板 6 Pro", Description: "骁龙 8 Gen 2，11 英寸 2.8K LCD，144Hz 刷新率，67W 快充，8600mAh。", Price: 2499, Stock: 100, IsActive: true},
		{Name: "华为 MatePad Pro 13.2", Description: "麒麟 9000S，13.2 英寸 OLED 全面屏，支持华为 M-Pencil，卫星消息。", Price: 5999, Stock: 45, IsActive: true},
		{Name: "联想小新 Pad Pro 12.7", Description: "天玑 9000，12.7 英寸 3K LCD，144Hz，10200mAh 大电池，67W 快充。", Price: 2199, Stock: 120, IsActive: true},

		// 笔记本
		{Name: "MacBook Pro 16 M3 Max", Description: "M3 Max 芯片，16 英寸 Liquid Retina XDR，120Hz ProMotion，最长 22 小时续航。", Price: 24999, Stock: 20, IsActive: true},
		{Name: "MacBook Pro 14 M3 Pro", Description: "M3 Pro 芯片，14 英寸 Liquid Retina XDR，专业级性能，18 小时续航。", Price: 14999, Stock: 35, IsActive: true},
		{Name: "MacBook Air 15 M3", Description: "M3 芯片，15.3 英寸液态视网膜屏，无风扇设计，轻薄便携，18 小时续航。", Price: 10999, Stock: 50, IsActive: true},
		{Name: "MacBook Air 13 M3", Description: "M3 芯片，13.6 英寸液态视网膜屏，重量仅 1.24kg，18 小时续航。", Price: 8999, Stock: 60, IsActive: true},
		{Name: "联想 ThinkPad X1 Carbon", Description: "英特尔 Core Ultra 7，14 英寸 2.8K OLED，重量仅 1.12kg，商务旗舰。", Price: 11999, Stock: 25, IsActive: true},
		{Name: "华为 MateBook X Pro 2024", Description: "英特尔 Core Ultra 9，14.2 英寸 3.1K OLED，超轻薄设计，触控屏。", Price: 9999, Stock: 40, IsActive: true},
		{Name: "小米笔记本 Pro X 14", Description: "英特尔 Core Ultra 9，14 英寸 3K OLED 120Hz，NVIDIA RTX 4060，独立显卡。", Price: 7999, Stock: 55, IsActive: true},
		{Name: "戴尔 XPS 15", Description: "Intel Core i9-13900H，15.6 英寸 3.5K OLED，NVIDIA RTX 4070，创意工作首选。", Price: 13999, Stock: 18, IsActive: true},
		{Name: "华硕 ROG 幻 16", Description: "AMD Ryzen 9 8945HS，16 英寸 2560×1600 240Hz，NVIDIA RTX 4080，游戏旗舰。", Price: 16999, Stock: 22, IsActive: true},
		{Name: "惠普 EliteBook 840 G11", Description: "Intel Core Ultra 7，14 英寸 1400p Sure View 隐私屏，企业安全认证。", Price: 8999, Stock: 30, IsActive: true},

		// 耳机
		{Name: "AirPods Pro 2", Description: "H2 芯片，主动降噪，支持空间音频，USB-C 充电盒，IP54 防水。", Price: 1899, Stock: 200, IsActive: true},
		{Name: "AirPods 4", Description: "H2 芯片，开放式设计，主动降噪版，支持个性化空间音频。", Price: 1299, Stock: 180, IsActive: true},
		{Name: "AirPods Max", Description: "H1 芯片，头戴式设计，主动降噪，高保真音频，计算音频技术。", Price: 4399, Stock: 50, IsActive: true},
		{Name: "Sony WH-1000XM5", Description: "行业领先降噪，30 小时续航，LDAC 高解析度音频，多设备连接。", Price: 2799, Stock: 90, IsActive: true},
		{Name: "Sony WF-1000XM5", Description: "真无线降噪旗舰，8.4mm 驱动单元，12 小时续航+24 小时充电盒。", Price: 1999, Stock: 110, IsActive: true},
		{Name: "Bose QuietComfort 45", Description: "世界级降噪，22 小时续航，轻量舒适，支持多点连接。", Price: 2499, Stock: 70, IsActive: true},
		{Name: "Bose QuietComfort Ultra Earbuds", Description: "沉浸式音频，主动降噪，6 小时续航+充电盒，CustomTune 技术。", Price: 2399, Stock: 80, IsActive: true},
		{Name: "三星 Galaxy Buds3 Pro", Description: "主动降噪，双向发声，10 小时续航，IPX7 防水，AI 通话降噪。", Price: 1499, Stock: 120, IsActive: true},
		{Name: "小米降噪耳机 4 Pro", Description: "主动降噪 50dB，骨声纹识别，LDAC 高解析度，6 小时续航。", Price: 399, Stock: 300, IsActive: true},
		{Name: "华为 FreeBuds Pro 3", Description: "三麦主动降噪，Hi-Res 高解析度认证，6.5 小时续航，L2HC 3.0。", Price: 1199, Stock: 150, IsActive: true},

		// 智能手表
		{Name: "Apple Watch Ultra 2", Description: "精密双频 GPS，海拔仪，最长 60 小时续航，钛金属表壳，运动旗舰。", Price: 6499, Stock: 30, IsActive: true},
		{Name: "Apple Watch Series 9", Description: "S9 芯片，双击手势，全天候视网膜屏，血氧检测，18 小时续航。", Price: 2999, Stock: 150, IsActive: true},
		{Name: "Apple Watch SE 2", Description: "S8 芯片，碰撞检测，游泳防水，家庭设置支持，经济实惠入门款。", Price: 1999, Stock: 120, IsActive: true},
		{Name: "Samsung Galaxy Watch7", Description: "Exynos W1000，1.3 英寸 Super AMOLED，40 小时续航，高级健康监测。", Price: 2199, Stock: 80, IsActive: true},
		{Name: "华为 Watch GT 4", Description: "时尚外观，14 天续航，血氧心率监测，GPS，运动健康管理。", Price: 1488, Stock: 200, IsActive: true},
		{Name: "小米手表 S3", Description: "1.43 英寸 AMOLED，15 天长续航，蓝牙通话，血氧睡眠监测。", Price: 699, Stock: 250, IsActive: true},
		{Name: "Garmin Fenix 7X Pro", Description: "专业运动 GPS 手表，太阳能充电，28 天续航，地形图导航，钛合金。", Price: 6988, Stock: 20, IsActive: true},
		{Name: "OPPO Watch 4 Pro", Description: "骁龙 W5+ 平台，1.91 英寸 AMOLED，独立 eSIM，ECG 心电图检测。", Price: 1799, Stock: 90, IsActive: true},

		// 智能家居
		{Name: "小米智能门锁 Pro", Description: "指纹+密码+NFC+App 多种解锁，C 级锁芯，低电量预警，远程开锁。", Price: 1599, Stock: 80, IsActive: true},
		{Name: "苹果 HomePod 2", Description: "S7 芯片，空间音频，Matter 智能家居中枢，温湿度传感器，免提 Siri。", Price: 2299, Stock: 45, IsActive: true},
		{Name: "苹果 HomePod mini", Description: "S5 芯片，360° 音频，智能家居中枢，超宽带芯片，温湿度感应。", Price: 749, Stock: 100, IsActive: true},
		{Name: "小米空气净化器 4 Pro", Description: "HEPA H13 滤芯，CADR 500m³/h，App 远程控制，激光粒子传感器。", Price: 1299, Stock: 60, IsActive: true},
		{Name: "戴森 V15 Detect 吸尘器", Description: "激光探测微尘，HEPA 过滤，60 分钟续航，自动感应地面调节吸力。", Price: 4990, Stock: 35, IsActive: true},
		{Name: "飞利浦 Hue 智能灯泡套装", Description: "1600 流明，1600 万色，Matter 协议，兼容 HomeKit/Google Home/Alexa。", Price: 599, Stock: 150, IsActive: true},
		{Name: "小米扫地机器人 S20+", Description: "激光导航，12000Pa 强吸力，自动集尘，热水洗拖布，AI 障碍识别。", Price: 3299, Stock: 40, IsActive: true},
		{Name: "科沃斯 T20 Pro 扫地机", Description: "AIVI 3D 视觉识别，自动集尘洗拖，11000Pa 吸力，多楼层地图。", Price: 3999, Stock: 35, IsActive: true},
		{Name: "米家投影仪 2 Pro", Description: "1080P 全高清，1300ANSI 流明，自动对焦梯形校正，MIUI TV 系统。", Price: 2799, Stock: 50, IsActive: true},

		// 游戏外设
		{Name: "PlayStation 5 Slim", Description: "AMD RDNA 2 GPU，SSD 超速加载，光线追踪，4K 120fps，DualSense 手柄。", Price: 3699, Stock: 30, IsActive: true},
		{Name: "Xbox Series X", Description: "12 TFLOPS GPU，1TB NVMe SSD，4K 120fps，光线追踪，向下兼容三代游戏。", Price: 3799, Stock: 25, IsActive: true},
		{Name: "Nintendo Switch OLED", Description: "7 英寸 OLED 屏，增强音频，有线网口，64GB 内置存储，Joy-Con 手柄。", Price: 2299, Stock: 80, IsActive: true},
		{Name: "雷蛇 Viper V3 Pro 鼠标", Description: "Focus Pro 35K 光学传感器，95g 超轻，HyperSpeed 无线，90 小时续航。", Price: 999, Stock: 100, IsActive: true},
		{Name: "罗技 G Pro X Superlight 2", Description: "HERO 25K 传感器，60g 超轻，无线，70 小时续航，PTFE 鼠标脚贴。", Price: 999, Stock: 90, IsActive: true},
		{Name: "SteelSeries Apex Pro TKL", Description: "OmniPoint 2.0 磁轴，可调节触发距离，OLED 显示屏，铝合金结构。", Price: 1299, Stock: 60, IsActive: true},
		{Name: "海盗船 HS80 RGB 无线耳机", Description: "50mm 音频驱动，Dolby Atmos，Slipstream 无线，20 小时续航。", Price: 999, Stock: 70, IsActive: true},

		// 摄影
		{Name: "Sony A7 IV", Description: "3300 万有效像素，BIONZ XR 处理器，10fps 连拍，4K 60p 视频，实时眼部 AF。", Price: 17999, Stock: 15, IsActive: true},
		{Name: "Sony A7C II", Description: "3300 万有效像素，小巧机身，侧翻屏，AI 自动对焦，4K 60p 视频。", Price: 14999, Stock: 20, IsActive: true},
		{Name: "佳能 EOS R6 Mark II", Description: "2420 万像素，40fps 连拍，全像素双核 CMOS AF，6K RAW 视频输出。", Price: 15999, Stock: 12, IsActive: true},
		{Name: "尼康 Z6 III", Description: "2450 万有效像素，部分堆栈式传感器，20fps，6K RAW 视频，-10EV 低光对焦。", Price: 16999, Stock: 10, IsActive: true},
		{Name: "富士 X-T5", Description: "4020 万像素 X-Trans CMOS 5 HR，7 档机身防抖，胶片模拟，6.2K 视频。", Price: 12999, Stock: 18, IsActive: true},
		{Name: "大疆 Osmo Pocket 3", Description: "1 英寸 CMOS，旋转云台，4K 120fps 慢动作，OLED 屏幕，内容创作神器。", Price: 2499, Stock: 60, IsActive: true},
		{Name: "大疆 Mini 4 Pro 无人机", Description: "4K 60fps HDR，全向避障，34 分钟续航，竖拍模式，249g 免注册。", Price: 4799, Stock: 40, IsActive: true},
		{Name: "Insta360 X4", Description: "8K 360° 全景拍摄，AI 剪辑，防抖技术，IPX8 防水，一体式设计。", Price: 3499, Stock: 45, IsActive: true},

		// 显示器
		{Name: "Apple Studio Display", Description: "27 英寸 5K Retina，A13 仿生芯片，12MP 超广角摄像头，1000 尼特峰值亮度。", Price: 11499, Stock: 15, IsActive: true},
		{Name: "LG UltraFine 4K 27", Description: "27 英寸 4K IPS，USB-C 96W 供电，Thunderbolt 接口，色准 ΔE<2。", Price: 3999, Stock: 30, IsActive: true},
		{Name: "三星 Odyssey G9 OLED", Description: "49 英寸超宽 5120×1440，240Hz，0.03ms，G-Sync+FreeSync，HDR2000。", Price: 12999, Stock: 10, IsActive: true},
		{Name: "戴尔 U2723D UltraSharp", Description: "27 英寸 4K IPS Black，USB-C 90W，KVM 切换，色准 ΔE<0.5，内置 KVM。", Price: 4499, Stock: 25, IsActive: true},
		{Name: "小米 27 英寸 4K 显示器", Description: "27 英寸 4K IPS，160Hz，HDR400，USB-C 65W 供电，色准 ΔE<1。", Price: 1999, Stock: 80, IsActive: true},
		{Name: "华硕 ROG Swift PG32UCDM", Description: "32 英寸 4K OLED，240Hz，0.03ms GTG，G-Sync Ultimate，HDR1000。", Price: 9999, Stock: 12, IsActive: true},

		// 键盘
		{Name: "Apple Magic Keyboard Touch ID", Description: "剪刀式机构，Touch ID 指纹识别，无线蓝牙，超薄设计，USB-C 充电。", Price: 949, Stock: 100, IsActive: true},
		{Name: "罗技 MX Keys S", Description: "智能背光，多设备切换，Flow 跨计算机工作流，USB-C 充电，10 天续航。", Price: 799, Stock: 120, IsActive: true},
		{Name: "HHKB Professional Hybrid Type-S", Description: "静电容轴，无线蓝牙+USB，超静音，程序员最爱，独特 HHKB 布局。", Price: 2299, Stock: 30, IsActive: true},
		{Name: "Keychron Q3 Max", Description: "铝合金机身，无线蓝牙，TKL 布局，Gateron Jupiter 轴，全键热插拔。", Price: 899, Stock: 60, IsActive: true},
		{Name: "海盗船 K100 Air", Description: "光轴，超薄无线设计，8000Hz 轮询率，200 小时续航，铝合金外壳。", Price: 1599, Stock: 40, IsActive: true},

		// 充电配件
		{Name: "Apple MagSafe 充电器 15W", Description: "磁吸无线充电，15W 最大功率，精准对准，兼容 iPhone 12 及以上机型。", Price: 329, Stock: 300, IsActive: true},
		{Name: "Anker 140W GaN 充电器", Description: "氮化镓技术，单口 140W，兼容 USB PD 3.1，可为 MacBook Pro 16 快充。", Price: 399, Stock: 200, IsActive: true},
		{Name: "Belkin 15W 三合一无线充电", Description: "同时为 iPhone+AirPods+Apple Watch 充电，MagSafe 兼容，Qi2 认证。", Price: 699, Stock: 150, IsActive: true},
		{Name: "小米 67W 快充套装", Description: "67W USB-C 充电头+6A 数据线，兼容小米/华为/三星等主流快充协议。", Price: 99, Stock: 500, IsActive: true},
		{Name: "罗马仕 20000mAh 磁吸充电宝", Description: "MagSafe 兼容，20000mAh，22.5W 快充，支持同时给两台设备充电。", Price: 299, Stock: 250, IsActive: true},

		// 存储
		{Name: "Samsung T9 移动固态硬盘 2TB", Description: "USB 3.2 Gen 2×2，读写 2000MB/s，IP65 防尘防水，抗跌落设计。", Price: 1299, Stock: 60, IsActive: true},
		{Name: "西部数据 My Passport 4TB", Description: "USB 3.0，硬件 AES 256 位加密，自动备份软件，小巧便携。", Price: 699, Stock: 80, IsActive: true},
		{Name: "SanDisk Extreme Pro SD 256GB", Description: "V30/U3 Class 10，200MB/s 读速，90MB/s 写速，4K UHD，IP55 防水。", Price: 299, Stock: 200, IsActive: true},
		{Name: "苹果 USB-C 转 USB-A 转换器", Description: "铝合金外壳，支持 USB 3.0 传输速率，即插即用，兼容 Mac 和 iPad。", Price: 189, Stock: 300, IsActive: true},

		// 下架商品（用于验证 ES is_active 过滤）
		{Name: "iPhone 12 停产款", Description: "A14 仿生芯片，5G 网络，MagSafe 磁吸充电，现已停产下架。", Price: 3999, Stock: 0, IsActive: false},
		{Name: "老款 MacBook Air 2019 停产", Description: "Intel Core i5，True Tone 视网膜屏，Touch ID，已停产不再销售。", Price: 6999, Stock: 0, IsActive: false},
	}

	// ── MySQL insert ─────────────────────────────────────────────────────────
	var created, skipped int
	for i := range products {
		var existing entity.Product
		if err := db.Where("name = ?", products[i].Name).First(&existing).Error; err != nil {
			if err := db.Create(&products[i]).Error; err != nil {
				log.Printf("[error] create product %q: %v", products[i].Name, err)
				continue
			}
			created++
		} else {
			skipped++
		}
	}
	fmt.Printf("MySQL: %d created, %d already existed\n", created, skipped)

	// ── ES bulk index ─────────────────────────────────────────────────────────
	if esrepo.Client == nil {
		fmt.Println("ES: skipped (client not available)")
		fmt.Println("Seed completed.")
		return
	}

	sr := esrepo.NewSearchRepo(esrepo.Client, &config.Global.Elasticsearch)
	ctx := context.Background()

	if err := sr.EnsureIndex(ctx); err != nil {
		log.Printf("[warn] ES ensure index: %v", err)
	}

	// Reload all products from DB (to get their auto-assigned IDs).
	var allProducts []entity.Product
	db.Find(&allProducts)

	ptrs := make([]*entity.Product, len(allProducts))
	for i := range allProducts {
		ptrs[i] = &allProducts[i]
	}

	if err := sr.BulkIndex(ctx, ptrs); err != nil {
		log.Printf("[error] ES bulk index: %v", err)
	} else {
		fmt.Printf("ES: bulk indexed %d products\n", len(ptrs))
	}

	fmt.Println("Seed completed.")
}
