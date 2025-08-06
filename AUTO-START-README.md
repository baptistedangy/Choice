# 🚀 Démarrage Automatique de l'Application Choice

## 📋 Scripts Disponibles

### 🚀 `./start-app.sh`
**Démarre l'application manuellement**
- Lance le serveur backend (port 3001)
- Lance le frontend Vite (port 5173)
- Sauvegarde les PIDs pour pouvoir arrêter plus tard
- Logs dans `server.log` et `frontend.log`

### 🛑 `./stop-app.sh`
**Arrête l'application**
- Arrête proprement tous les processus
- Nettoie les fichiers PIDs
- Arrête tous les processus Node.js liés au projet

### ⚙️ `./setup-auto-start.sh`
**Configure le démarrage automatique**
- Crée un service launchd pour macOS
- L'application démarrera automatiquement au démarrage de votre Mac
- Reste active même si vous fermez Cursor ou le terminal

### 🚫 `./disable-auto-start.sh`
**Désactive le démarrage automatique**
- Supprime le service launchd
- L'application ne démarrera plus automatiquement

## 🌐 Accès à l'Application

- **Frontend :** http://localhost:5173/
- **Backend :** http://localhost:3001/
- **Health Check :** http://localhost:3001/health

## 📝 Utilisation

### Option 1 : Démarrage Manuel
```bash
# Démarrer l'application
./start-app.sh

# Arrêter l'application
./stop-app.sh
```

### Option 2 : Démarrage Automatique (Recommandé)
```bash
# Configurer le démarrage automatique
./setup-auto-start.sh

# L'application sera accessible à tout moment !
# Même après redémarrage de votre Mac
# Même si vous fermez Cursor

# Pour désactiver plus tard
./disable-auto-start.sh
```

## 🔍 Vérification du Statut

```bash
# Vérifier si l'application fonctionne
curl http://localhost:5173/
curl http://localhost:3001/health

# Voir les processus actifs
ps aux | grep -E "(vite|node server.js)" | grep -v grep
```

## 📊 Logs

- **Backend :** `server.log`
- **Frontend :** `frontend.log`
- **Launchd :** `launchd.log` et `launchd-error.log`

## 🎯 Avantages du Démarrage Automatique

✅ **Accessible 24/7** - Même quand Cursor est fermé  
✅ **Redémarrage automatique** - Après redémarrage de votre Mac  
✅ **Gestion des erreurs** - Relance automatique en cas de crash  
✅ **Logs complets** - Suivi de tous les événements  
✅ **Contrôle total** - Activation/désactivation facile  

## 🚨 Dépannage

Si l'application ne démarre pas automatiquement :
1. Vérifiez les logs : `cat launchd.log`
2. Redémarrez le service : `launchctl unload ~/Library/LaunchAgents/com.choice.app.plist && launchctl load ~/Library/LaunchAgents/com.choice.app.plist`
3. Ou utilisez le démarrage manuel : `./start-app.sh` 