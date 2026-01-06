# Ultimate Sports AI - Configuration

## Backend Configuration

### Production Backend (Railway)
- **URL**: `https://ultimate-sports-ai-backend-production.up.railway.app`
- **WebSocket**: Available at `/chat` namespace
- **Status**: Active

### Local Development
- **URL**: `http://localhost:3000`
- **WebSocket**: Available at `/chat` namespace

## Features

### Real-Time Chat (WebSocket)
- Multi-channel support (#general, #nfl, #nba, #live, #strategy)
- User presence tracking
- Typing indicators
- Gift system
- Message reactions

### Fallback Mode
If WebSocket connection fails, the app automatically switches to **Local Mode**:
- Messages stored in localStorage
- Channel switching still works
- User simulation for testing
- No server required

## Testing Backend Connectivity

To test if the backend is reachable:

1. Open browser console on Sports Lounge page
2. Look for connection logs:
   - ✅ `Connected to chat server` = WebSocket active
   - ⚠️ `Using local fallback chat mode` = Local mode (no backend)

3. Check connection status badge in chat header:
   - **Green "Connected"** = Live WebSocket
   - **Yellow "Local Mode"** = Fallback mode
   - **Red "Disconnected"** = Connection lost

## Backend Status Endpoints

- Health Check: `https://ultimate-sports-ai-backend-production.up.railway.app/health`
- API Status: `https://ultimate-sports-ai-backend-production.up.railway.app/api/status`

## Troubleshooting

### Chat Not Working?
1. Check browser console for errors
2. Verify Socket.IO library loaded: Check for `<script src="https://cdn.socket.io/4.5.4/socket.io.min.js">`
3. Test backend: Visit health check URL above
4. Local mode is normal if backend is down - features still work offline

### Buttons Not Working?
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check console for JavaScript errors
4. Version numbers should be `?v=20250120006` or higher

## Environment Variables

Set these in Railway dashboard for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=(auto-provided by Railway PostgreSQL)
CORS_ORIGIN=https://play.rosebud.ai
```
