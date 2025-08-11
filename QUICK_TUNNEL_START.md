# 🚀 Démarrage Ultra-Rapide : Tunnel Cloudflare

## ⚡ En 3 étapes simples

### 1️⃣ Démarrer l'application + tunnel
```bash
npm run dev:tunnel
```

### 2️⃣ Copier l'URL HTTPS
```
🔗 URL: https://abc123-def456-ghi789.trycloudflare.com
```

### 3️⃣ Tester sur mobile
- Ouvrir le navigateur du téléphone
- Coller l'URL HTTPS
- ✅ Caméra accessible !

---

## 🔧 Commandes principales

| Commande | Description |
|----------|-------------|
| `npm run dev:tunnel` | 🚀 **Démarrage complet** (app + tunnel) |
| `npm run tunnel` | 🔗 Tunnel seul |
| `npm run dev` | 💻 App locale seulement |

---

## 🚨 Dépannage rapide

**Tunnel ne démarre pas ?**
```bash
npx cloudflared --version
npm install --save-dev cloudflared
```

**Port occupé ?**
```bash
lsof -i :5173
kill -9 <PID>
```

---

## 💡 Conseils

- **URL change** à chaque redémarrage
- **Tunnel se reconecte** automatiquement
- **Gardez ouvert** pendant les tests
- **HTTPS requis** pour la caméra mobile

---

**🎯 Prêt à tester ? Lancez `npm run dev:tunnel` !**
