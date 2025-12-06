# WebGIS Sistem Informasi Geografis - Kantor Pos Bandar Lampung

Aplikasi WebGIS interaktif untuk menampilkan dan mengelola data lokasi kantor pos di Bandar Lampung. Dibangun dengan PHP, Leaflet.js, dan GeoJSON sebagai bagian dari Tugas 2: Implementasi GIS dengan PHP, MySQL, Leaflet.js, GeoJSON.

## 📋 Deskripsi Proyek

Aplikasi ini menampilkan peta interaktif yang menampilkan:
- **Layer Kecamatan**: Batas administrasi kecamatan di Bandar Lampung (polygon)
- **Layer Kantor Pos**: Titik lokasi kantor pos di Bandar Lampung (point)

Setiap lokasi kantor pos dapat dilihat detailnya, diberi rating, dan dikomentari oleh pengguna.

## 🚀 Fitur Utama

### 1. Peta Interaktif
- Peta interaktif menggunakan Leaflet.js
- Dua base layer: OpenStreetMap dan Dark Mode Map
- Layer control untuk toggle visibility
- Geocoder untuk pencarian lokasi
- Fullscreen mode

### 2. CRUD Data Kantor Pos
- **Create**: Tambah marker baru dengan klik di peta
- **Read**: Lihat daftar kantor pos di sidebar dan popup di peta
- **Update**: Edit informasi kantor pos (nama, lokasi, koordinat)
- **Delete**: Hapus marker kantor pos

### 3. Rating System
- Rating 1-5 bintang untuk setiap lokasi
- Batasan: 1 rating per lokasi per 24 jam per browser session
- Menampilkan rata-rata rating dan jumlah rating
- Rating tersimpan global (sinkron antar device)

### 4. Comment System
- Komentar untuk setiap lokasi kantor pos
- Opsional rating dalam komentar
- Menampilkan nama, tanggal, dan isi komentar
- Komentar tersimpan global (sinkron antar device)

### 5. Search & Filter
- Pencarian kantor pos berdasarkan nama atau lokasi
- Filter layer (toggle kecamatan dan kantor pos)
- Geocoder untuk mencari alamat
 - Fitur "Near Me" untuk menemukan kantor pos terdekat dari posisi pengguna (menggunakan geolokasi browser)

## 🛠️ Teknologi yang Digunakan

### Frontend
- **HTML5**: Struktur halaman
- **JavaScript (Vanilla)**: Logika aplikasi
- **Leaflet.js**: Library peta interaktif
- **Tailwind CSS**: Styling (via CDN)
- **Leaflet Fullscreen**: Kontrol fullscreen
- **Leaflet Geocoder**: Pencarian lokasi

### Backend
- **PHP 7.4+**: Server-side logic
- **File-based Storage**: Data disimpan sebagai file JSON/GeoJSON (bukan database)

### Data Format
- **GeoJSON**: Format data spasial
- **JSON**: Format data rating dan komentar

## 📁 Struktur Proyek

```
siguap/
├── index.php                 # Halaman utama WebGIS
├── api/                      # Endpoint PHP
│   ├── kecamatan.php         # Endpoint data kecamatan (GET)
│   ├── kantorpos.php         # Endpoint CRUD kantor pos (GET, POST, PUT, DELETE)
│   ├── rating.php            # Endpoint rating (GET, POST)
│   └── comments.php          # Endpoint komentar (GET, POST, PUT, DELETE)
├── assets/
│   └── js/
│       ├── script.js         # JavaScript utama (map, CRUD)
│       └── features.js       # JavaScript fitur (rating, komentar)
├── data/                     # Data GeoJSON dan JSON
│   ├── kecamatanbalam.geojson    # Data polygon kecamatan
│   ├── poinkantorpos.geojson     # Data point kantor pos
│   ├── comments/            # File komentar per lokasi
│   │   └── {fid}.json
│   └── rating/              # File rating per lokasi
│       └── {fid}.json
└── README.md                # Dokumentasi proyek
```

## 🔧 Instalasi & Setup

### Persyaratan
- PHP 7.4 atau lebih tinggi
- Web server (Apache/Nginx) atau PHP built-in server
- Browser modern dengan dukungan JavaScript ES6+

### Langkah Instalasi

1. **Clone atau download proyek**
   ```bash
   git clone <repository-url>
   cd siguap
   ```

2. **Pastikan folder `data/` memiliki permission write**
   ```bash
   chmod 755 data/
   chmod 755 data/comments/
   chmod 755 data/rating/
   ```

3. **Jalankan server PHP**
   ```bash
   # Menggunakan PHP built-in server
   php -S localhost:8000
   ```

4. **Buka browser**
   ```
   http://localhost:8000
   ```

## 📡 API Endpoints

### 1. Kecamatan
- **GET** `/api/kecamatan.php`
  - Mengembalikan data GeoJSON kecamatan
  - Response: `application/geo+json`

### 2. Kantor Pos
- **GET** `/api/kantorpos.php`
  - Mengembalikan semua data kantor pos (GeoJSON)
  
- **POST** `/api/kantorpos.php`
  - Menambah kantor pos baru
  - Body: `{ "nama": "...", "lokasi": "...", "coordinates": [lng, lat] }`
  
- **PUT** `/api/kantorpos.php`
  - Update kantor pos
  - Body: `{ "fid": 1, "nama": "...", "lokasi": "...", "coordinates": [lng, lat] }`
  
- **DELETE** `/api/kantorpos.php`
  - Hapus kantor pos
  - Body: `{ "fid": 1 }`

### 3. Rating
- **GET** `/api/rating.php?fid={fid}`
  - Mengembalikan statistik rating untuk lokasi
  - Response: `{ "success": true, "data": { "average": 4.5, "count": 10, ... } }`
  
- **POST** `/api/rating.php`
  - Submit rating baru
  - Body: `{ "fid": 1, "rating": 5 }`

### 4. Komentar
- **GET** `/api/comments.php?fid={fid}`
  - Mengembalikan semua komentar untuk lokasi
  
- **POST** `/api/comments.php`
  - Tambah komentar baru
  - Body (FormData): `fid`, `nama`, `komentar`, `rating` (opsional)
  
- **PUT** `/api/comments.php`
  - Update komentar
  - Body: `{ "fid": 1, "commentId": 1, "komentar": "...", "rating": 5 }`
  
- **DELETE** `/api/comments.php`
  - Hapus komentar
  - Body: `{ "fid": 1, "commentId": 1 }`

## 💾 Penyimpanan Data

Proyek ini menggunakan **file-based storage** (bukan database MySQL):

- **GeoJSON**: Data spasial disimpan di `data/*.geojson`
- **Rating**: Disimpan di `data/rating/{fid}.json`
- **Komentar**: Disimpan di `data/comments/{fid}.json`

### Sinkronisasi Data
- Semua data disimpan di server (bukan di browser)
- Data akan ter-update secara global untuk semua pengguna
- Setiap device mengakses file yang sama di server
- Untuk melihat update terbaru, refresh halaman atau reload modal detail

## 🎨 Fitur UI/UX

- **Dark Theme**: Desain gelap dengan accent color orange dan kuning
- **Responsive**: Sidebar scrollable, map fixed
- **Custom Modals**: Modal custom untuk CRUD (bukan browser prompt)
- **Notifications**: Notifikasi untuk feedback user
- **Loading Indicators**: Indikator loading saat fetch data
- **Custom Icons**: Icon marker custom untuk kantor pos
- **Hover Effects**: Efek hover pada marker dan sidebar items

## 🔒 Keamanan

- **XSS Prevention**: Escape HTML pada user input
- **Input Validation**: Validasi input di frontend dan backend
- **CORS Headers**: CORS diatur untuk API endpoints
- **Rate Limiting**: Rating dibatasi 1 per 24 jam per lokasi (client-side)

## 📝 Catatan Penting

1. **Data GeoJSON**: Data berasal dari hasil ekspor QGIS (Tugas 1)
2. **Hosting**: Proyek ini **WAJIB** di-hosting sesuai ketentuan tugas
3. **File Permissions**: Pastikan folder `data/` memiliki write permission
4. **CDN**: Menggunakan CDN untuk library (Tailwind CSS, Leaflet.js) sesuai ketentuan
5. **Browser Support**: Browser modern dengan dukungan ES6+

## 🌐 Hosting

Proyek ini siap untuk di-hosting. Rekomendasi hosting gratis:
- **InfinityFree**: Free PHP hosting dengan MySQL (opsional)
- **000webhost**: Free hosting dengan PHP support

### Checklist Hosting:
- [ ] Upload semua file ke hosting
- [ ] Pastikan PHP version sesuai (7.4+)
- [ ] Set permission folder `data/` ke 755 atau 777
- [ ] Test semua endpoint API
- [ ] Test CRUD operations
- [ ] Test rating dan komentar
- [ ] Verifikasi CORS headers

## 📊 Data GeoJSON

### Format Data Kecamatan
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "NAMOBJ": "Nama Kecamatan"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### Format Data Kantor Pos
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "fid": 1,
        "nama": "Kantor Pos Unila",
        "lokasi": "Universitas Lampung",
        "rating": {
          "average": 4.5,
          "count": 10
        },
        "stats": {
          "totalComments": 5
        }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [105.243, -5.367]
      }
    }
  ]
}
```

## 🐛 Troubleshooting

### Map tidak muncul
- Pastikan Leaflet.js ter-load (cek console browser)
- Pastikan container `#map` ada di HTML
- Cek error di browser console

### Data tidak ter-load
- Pastikan endpoint PHP dapat diakses
- Cek permission folder `data/`
- Cek format GeoJSON valid

### Rating/Komentar tidak tersimpan
- Pastikan folder `data/rating/` dan `data/comments/` ada
- Pastikan permission folder write (755 atau 777)
- Cek error di browser console dan server logs

### CORS Error
- Pastikan header CORS sudah di-set di semua endpoint PHP
- Cek `Access-Control-Allow-Origin` header

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik (Tugas 2: Implementasi GIS dengan PHP, MySQL, Leaflet.js, GeoJSON).

## 👤 Author

Dibuat sebagai bagian dari Ujian Akhir Praktikum Mata Kuliah Sistem Informasi Geografis Tahun 2025.

---

**Catatan**: Proyek ini menggunakan file-based storage untuk kemudahan deployment. Untuk production dengan traffic tinggi, disarankan menggunakan database MySQL untuk performa yang lebih baik.

