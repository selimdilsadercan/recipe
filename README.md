# 🍳 Recipe Monorepo

Bu proje, **Bun workspaces** ve **Turborepo** kullanılarak yapılandırılmış bir monorepo'dur.

## 📁 Proje Yapısı

```
recipe/
├── frontend/          # Next.js + Capacitor frontend uygulaması
│   ├── app/           # Next.js App Router
│   ├── components/    # React bileşenleri
│   ├── lib/           # Yardımcı fonksiyonlar
│   ├── android/       # Android (Capacitor) projesi
│   └── public/        # Statik dosyalar
├── backend/           # Encore backend servisleri
│   ├── recipe/        # Tarif servisi
│   ├── identity/      # Kimlik servisi
│   └── sql/           # SQL dosyaları
├── package.json       # Root package.json (workspace tanımları)
├── turbo.json         # Turborepo pipeline konfigürasyonu
└── .gitignore         # Git ignore kuralları
```

## 🚀 Başlarken

### Gereksinimler

- **Bun** >= 1.0.0
- **Encore CLI** (backend için)

### Bun Kurulumu

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

### Proje Kurulumu

```bash
# Tüm bağımlılıkları kurun
bun install
```

## 📜 Komutlar

### Root Komutlar (Tüm Projeler)

```bash
# Tüm projeleri development modunda çalıştır
bun run dev

# Tüm projeleri build et
bun run build

# Lint çalıştır
bun run lint

# Cache ve node_modules temizle
bun run clean
```

### Frontend Komutları

```bash
# Sadece frontend'i çalıştır
bun run dev:frontend

# Sadece frontend'i build et
bun run build:frontend

# Mobil uygulama oluştur (debug APK)
bun run mobile

# Store APK oluştur (release)
bun run store

# Frontend klasörüne gidip çalıştır
cd frontend && bun run dev
```

### Backend Komutları

```bash
# Sadece backend'i çalıştır
bun run dev:backend

# Backend klasörüne gidip çalıştır
cd backend && encore run

# Backend testlerini çalıştır
cd backend && bun run test

# API client oluştur
cd backend && bun run generate
```

## 🔧 Geliştirme

### Her İki Servisi Aynı Anda Çalıştırma

```bash
# Root klasörde
bun run dev
```

Bu komut Turborepo kullanarak hem frontend hem de backend'i paralel olarak başlatır.

### Tek Bir Servisi Çalıştırma

```bash
# Sadece frontend
bun run dev:frontend

# Sadece backend  
bun run dev:backend
```

## 📦 Paket Ekleme

### Frontend'e Paket Ekleme

```bash
bun add <paket-adı> --filter @recipe/frontend
```

### Backend'e Paket Ekleme

```bash
bun add <paket-adı> --filter @recipe/backend
```

### DevDependency Olarak Ekleme

```bash
bun add -d <paket-adı> --filter @recipe/frontend
```

### Alternatif: Klasör İçinde Ekleme

```bash
cd frontend && bun add <paket-adı>
cd backend && bun add <paket-adı>
```

## 🏗️ Monorepo Avantajları

1. **Paylaşımlı Bağımlılıklar**: Ortak paketler tek bir yerde tutulur
2. **Atomic Commits**: Frontend ve backend değişiklikleri tek commit'te
3. **Turborepo Cache**: Akıllı build caching ile hızlı build süreleri
4. **Tutarlı Tooling**: Tüm projeler aynı araçları kullanır
5. **Kolay Cross-Project Refactoring**: Projeler arası değişiklikler kolaylaştı
6. **Bun Hızı**: npm'den ~25x daha hızlı paket kurulumu

## 🔗 Bağlantılar

- [Bun Docs](https://bun.sh/docs)
- [Bun Workspaces](https://bun.sh/docs/install/workspaces)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Encore Docs](https://encore.dev/docs)
