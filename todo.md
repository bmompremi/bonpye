# TCsocial TODO

## Authentication & User System
- [x] Implement Manus OAuth sign-in (Google supported)
- [ ] Implement email/password registration
- [x] User profile creation on signup
- [x] CDL verification system (badge display)

## Posts System (Transmissions)
- [x] Create post (transmission) functionality
- [x] Like/10-4 posts
- [x] Repost/Echo posts
- [x] Bookmark posts
- [x] Delete own posts
- [x] Reply to posts

## Messaging System
- [x] Direct message conversations
- [x] Send/receive messages
- [x] Message notifications
- [x] Conversation list

## Profile System
- [x] View user profiles
- [x] Edit own profile
- [x] Follow/unfollow users
- [x] Follower/following lists
- [x] Profile stats (posts, followers, following)

## Notifications
- [x] Like notifications
- [x] Follow notifications
- [ ] Mention notifications
- [x] Repost notifications
- [x] Message notifications

## Explore/Search
- [x] Search users
- [ ] Search posts
- [x] Trending topics (mock data)
- [x] Suggested users to follow (mock data)

## Settings
- [x] Account settings page
- [x] Privacy settings page
- [x] Theme toggle (light/dark)
- [x] Notification preferences page

## Convoys (Groups)
- [x] View convoy list
- [x] Join/leave convoys
- [ ] Convoy posts feed

## Black Book (Reviews)
- [x] View truck stop listings (mock data)
- [ ] Add reviews
- [ ] Rate locations

## UI/UX
- [x] Dark mode (default)
- [x] Light mode
- [x] Theme toggle
- [x] Responsive design
- [x] Mobile navigation
- [x] Desktop sidebar navigation


## Bug Fixes
- [x] Fix account creation not working (OAuth works)
- [x] Test login flow end-to-end (Google OAuth working)
- [x] Test post creation (working with database)
- [x] Test like/repost/bookmark functions (like working)
- [x] Test messaging system (working - messages send/receive)
- [x] Test follow/unfollow
- [x] Test all navigation links
- [x] Update mock posts with realistic trucker content
- [x] Fix post author display to show user info from database
- [x] Test profile editing (handle, bio, location, truck type)

## CDL/ID Verification System (New Feature)
- [x] Update database schema for verification (status, deadline, document URL)
- [x] Create CDL/ID upload form for users
- [x] Store uploaded documents in S3
- [x] Send owner notification when user submits verification
- [x] Implement 24-hour verification deadline from signup
- [x] Auto-suspend accounts that don't verify within 24 hours
- [x] Create admin panel for owner to approve/reject verifications
- [x] Show verification status on user profiles
- [x] Block suspended users from posting/messaging

## Bug Fixes - Jan 18
- [x] Fix DM messaging - can't send/receive messages
- [x] Fix search - can't find members by email or name
- [x] Make links clickable in posts
- [x] Add link preview with images before opening
- [x] Fix video upload for posts

## Video Upload Fix - Jan 18
- [x] Implement direct file upload endpoint for videos (not base64)
- [x] Update frontend to use FormData for video uploads
- [x] Test video upload with real video file

## UI Fixes - Jan 18
- [x] Fix user name click - navigate to profile or DM
- [x] Fix 3-dot menu dropdown - show options when clicked
- [x] Enhance link previews with actual thumbnails
- [x] Add video embed preview for video links

## Final Fixes Before Deployment
- [x] Fix video upload - debug and fix the multer endpoint
- [x] Fix emoji button - should open emoji picker
- [x] Fix location button - should open location selector
- [ ] Deploy to permanent URL with custom domain

## PWA Conversion - Jan 19
- [x] Create manifest.json with app metadata
- [x] Create service worker for offline support
- [x] Add service worker registration to app
- [x] Test PWA on desktop (service worker working)
- [ ] Deploy PWA to production with custom domain

## Video Upload Bug - Jan 19
- [x] Debug video upload endpoint - fixed session verification
- [x] Fix FormData handling in server
- [x] Fix video button click handler - added preventDefault and stopPropagation

## App Loading Issue - Jan 19
- [x] Fix blank page on phone - server restart fixed it

## Video Upload Still Failing - Jan 19
- [x] Debug video upload endpoint - fixed auth using createContext
- [x] Check file size limits - 100MB limit set
- [x] Test with actual video file - endpoint working

## Profile Changes Not Persisting - Jan 19
- [x] Debug profile update endpoint - added cache invalidation
- [x] Check database schema for profile fields - working correctly
- [x] Test profile changes save and persist after logout/login

## Edit Button & Image Sizing - Jan 19
- [x] Add back edit button to profile page (already present)
- [x] Implement image resizing for consistent sizes (600x600 for posts, 128x128 for avatars)
- [x] Optimize images for app viewing (auto-crop and compress)

## Layout Redesign - Jan 19
- [ ] Improve post card layout and spacing
- [ ] Enhance sidebar navigation
- [ ] Redesign compose area
- [ ] Improve profile page layout
- [ ] Enhance messaging interface

## Final Testing & Fixes - Jan 19
- [x] Test all settings options (Dark mode toggle working)
- [x] Add edit button back to profile page (already present)
- [x] Fix message layout - old messages on top, new at bottom (reversed order)
- [x] Restore edit button next to username in profile header
- [x] Restore Save button functionality for profile edits

## Messaging Improvements - Jan 19
- [x] Keep conversation history on Messages page
- [x] Show list of all conversations with users
- [x] Display last message preview for each conversation
- [x] Allow clicking on user name to continue conversation
- [x] Persist messages across page refreshes

## Bug Fixes - Jan 19
- [x] Fix conversation list not displaying in left sidebar
- [x] Ensure existing conversations load and display properly
- [x] Make conversation list searchable like WhatsApp/Telegram/Facebook Messenger

## Push Notifications - Jan 19
- [x] Set up browser push notification API integration
- [x] Create notification subscription storage in database
- [x] Implement push notification triggers on new messages
- [x] Add frontend notification permission request
- [x] Test push notifications with real messages

## Profile Page Improvements - Jan 19
- [x] Add Save button next to Edit button on profile header

## CDL Verification Display - Jan 19
- [x] Add verification badge to profile header
- [x] Display verification status (verified, pending, suspended)
- [x] Show verification date on profile

## CDL Verification Upload - Jan 19
- [x] Create CDL verification documents table in database
- [x] Build CDL upload page with document validation
- [x] Add file upload to S3 storage
- [x] Create verification submission tracking
- [x] Display verification status and history

## Bug Fixes - Jan 20
- [x] Fix CORS origin mismatch error on /feed page (https://manus.im vs https://3000-ivfg6ogz00ogmkvtngu5x-92eb0342.us1.manus.computer)

## Profile Persistence Fix - Jan 20
- [x] Fix profile changes to persist permanently in database
- [x] Ensure profile data loads correctly after page reload
- [x] Verify all profile fields are saved (name, handle, bio, location, truck type, etc.)

## Follow & User Profile Features - Jan 20
- [x] Activate follow functionality for all users
- [x] Make user names clickable to navigate to user profiles
- [x] Add DM button under posts for direct messaging
- [x] Test follow, profile navigation, and DM from posts
