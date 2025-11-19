# 🔔 Push Notifications - SDK 53 Değişikliği

## ⚠️ Önemli Bilgi

Expo SDK 53'ten itibaren **Expo Go artık push notification'ları desteklemiyor**.

## 🎯 Çözümler

### Şu Anda (Development - Expo Go):
- ✅ Randevu listesi çalışıyor
- ✅ Otomatik güncelleme çalışıyor
- ✅ Pull-to-refresh çalışıyor
- ❌ Push notifications çalışmıyor (Expo Go limitasyonu)

### Production Build İçin:

#### 1️⃣ EAS Build (Önerilen):

```bash
# EAS CLI kur
npm install -g eas-cli

# EAS'a login
eas login

# Build config oluştur
eas build:configure

# Android APK
eas build --platform android --profile preview

# iOS IPA
eas build --platform ios --profile preview
```

#### 2️⃣ Development Build:

```bash
cd mobile-app

# Dev client kur
npx expo install expo-dev-client

# Build
eas build --profile development --platform android
# veya
eas build --profile development --platform ios

# Install et ve çalıştır
npx expo start --dev-client
```

---

## 📱 Test Senaryoları

### Expo Go (Şu Anda):
1. ✅ Randevuları görebilirsin
2. ✅ Aşağı çekerek yenileyebilirsin
3. ✅ Otomatik güncelleme çalışıyor
4. ❌ Push notification gelmez

### Production Build:
1. ✅ Randevuları görebilirsin
2. ✅ Aşağı çekerek yenileyebilirsin
3. ✅ Otomatik güncelleme çalışıyor
4. ✅ Push notification gelir! 🎉

---

## 🚀 Production Build Yapmak İçin:

### Android APK:

```bash
cd mobile-app

# eas.json oluştur
cat > eas.json << 'EOF'
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
EOF

# Build
eas build --platform android --profile preview

# İndir ve test et
```

### iOS IPA:

```bash
# Apple Developer hesabı gerekli
eas build --platform ios --profile preview
```

---

## 💡 Alternatif: Local Notification

Expo Go'da çalışan alternatif:

```javascript
// Backend'den polling yap, local notification göster
setInterval(async () => {
  const response = await fetch(`${API_URL}/api/appointments/new`);
  const data = await response.json();
  
  if (data.count > 0) {
    // Local notification (Expo Go'da çalışır)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Yeni Randevu!',
        body: `${data.count} yeni randevu bulundu!`,
      },
      trigger: null, // Hemen göster
    });
  }
}, 30000);
```

---

## 📊 Özet

| Özellik | Expo Go | Development Build | Production Build |
|---------|---------|-------------------|------------------|
| Randevu Listesi | ✅ | ✅ | ✅ |
| Auto Refresh | ✅ | ✅ | ✅ |
| Pull to Refresh | ✅ | ✅ | ✅ |
| Push Notifications | ❌ | ✅ | ✅ |
| Local Notifications | ✅ | ✅ | ✅ |

---

## 🎯 Önerim

**Şimdilik:** Expo Go ile test et (push notification hariç her şey çalışıyor)

**Production için:** EAS Build yap ve gerçek cihazda test et

**Hızlı test:** Local notification kullan (yukarıdaki kod)

---

## 📚 Daha Fazla Bilgi

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Push Notifications](https://docs.expo.dev/push-notifications/overview/)

