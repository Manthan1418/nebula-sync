# Session Persistence Feature

## Overview
Users can now stay in their music room even after refreshing the page. The session persists as long as the browser tab/window remains open, but is automatically cleared when the tab is closed.

## How It Works

### SessionStorage
- Uses browser's `sessionStorage` API (not `localStorage`)
- Data persists across page refreshes
- Data is automatically cleared when browser tab/window closes
- Each tab has its own independent session

### What's Stored
```typescript
{
  roomId: string;      // The room code (e.g., "ABC123")
  deviceName: string;  // User's device name
  isHost: boolean;     // Whether user is the room host
  roomName: string;    // Display name for the room
}
```

## User Experience

### Creating a Room
1. User creates a room with device name
2. Session is saved to sessionStorage
3. User can refresh the page and will be automatically rejoined
4. Closing the tab clears the session

### Joining a Room
1. User joins a room with room code and device name
2. Session is saved to sessionStorage
3. User can refresh the page and will be automatically rejoined
4. Closing the tab clears the session

### Leaving a Room
1. User clicks "Leave Room"
2. Session is cleared from sessionStorage
3. User is redirected to home page

### Auto-Rejoin Behavior
- **On page refresh**: Automatically rejoins the same room
- **On reconnect**: If connection drops, auto-rejoins when reconnected
- **On tab close**: Session is cleared (browser behavior)
- **On explicit leave**: Session is cleared

## Implementation Details

### Files Modified

#### `FE/src/lib/sessionStorage.ts` (New)
- Centralized session management utilities
- `saveRoomSession()` - Save session data
- `getRoomSession()` - Retrieve session data
- `clearRoomSession()` - Clear session data
- `hasActiveSession()` - Check if session exists

#### `FE/src/hooks/useRoom.ts`
- Auto-rejoin logic on socket connect
- Save session on create/join
- Clear session on leave
- Handle failed rejoin attempts

#### `FE/src/pages/Index.tsx`
- Auto-navigate to room if active session exists

#### `FE/src/pages/CreateRoom.tsx`
- Prevent creating new room if already in one
- Auto-navigate to existing room

#### `FE/src/pages/JoinRoom.tsx`
- Prevent joining new room if already in one
- Auto-navigate to existing room

#### `FE/src/pages/Room.tsx`
- Load room info from sessionStorage on refresh
- Display correct room name and host status

## Benefits

1. **Better UX**: No need to manually rejoin after accidental refresh
2. **Network resilience**: Reconnects automatically if connection drops
3. **Privacy**: Sessions are tab-specific and cleared on tab close
4. **No database needed**: Uses browser's built-in storage

## Testing

### Test Scenarios

1. **Create & Refresh**
   - Create a room
   - Refresh the page
   - Should still be in the room

2. **Join & Refresh**
   - Join a room
   - Refresh the page
   - Should still be in the room

3. **Leave & Refresh**
   - Leave the room
   - Refresh the page
   - Should be on home page (not rejoined)

4. **Close Tab**
   - Join/create a room
   - Close the tab
   - Open new tab to the site
   - Should NOT be in the room

5. **Multiple Tabs**
   - Open two tabs
   - Create room in tab 1
   - Join different room in tab 2
   - Each tab maintains its own session

## Browser Compatibility

Works in all modern browsers that support:
- sessionStorage API (all modern browsers)
- WebSocket (for the main app functionality)

## Security Notes

- No sensitive data is stored
- Sessions are scoped to origin (same-origin policy)
- Sessions cannot be accessed by other websites
- Sessions are cleared on tab close
- Room codes are already public (shared for joining)
