// fix-images: updates every product's image_url to a stable picsum.photos URL
// derived from the product ID.  Safe to run multiple times (idempotent).
package main

import (
	"fmt"
	"log"

	"trading-service/config"
	dbpkg "trading-service/internal/repository/mysql"
)

// picsum.photos/id/{n}/400/300 returns a fixed, real photo for each numeric id.
// We spread products across the first 500 photo IDs to get visual variety.
const picsumBase = "https://picsum.photos/id/%d/400/300"

// A curated list of picsum IDs that look like product/tech photos.
var photoIDs = []int{
	0, 1, 2, 3, 4, 5, 7, 8, 9, 10,
	11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
	21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
	31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
	52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
	62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
	72, 73, 74, 75, 76, 77, 78, 79, 80, 81,
	82, 83, 84, 85, 86, 87, 88, 89, 90, 91,
	92, 93, 94, 95, 96, 97, 98, 99,
}

func main() {
	config.Load("config/config.yaml")
	if err := dbpkg.Init(&config.Global.DB); err != nil {
		log.Fatalf("db init: %v", err)
	}
	db := dbpkg.DB

	rows, err := db.Raw("SELECT id FROM products ORDER BY id").Rows()
	if err != nil {
		log.Fatalf("query: %v", err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			log.Printf("scan: %v", err)
			continue
		}
		ids = append(ids, id)
	}

	updated := 0
	for i, id := range ids {
		photoID := photoIDs[i%len(photoIDs)]
		url := fmt.Sprintf(picsumBase, photoID)
		if err := db.Exec("UPDATE products SET image_url = ? WHERE id = ?", url, id).Error; err != nil {
			log.Printf("update id=%d: %v", id, err)
			continue
		}
		updated++
	}
	fmt.Printf("Updated %d products with picsum.photos images.\n", updated)
}
