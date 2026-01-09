# Testing Checklist for Yearly Collection Feature

## ✅ Issues Fixed During Review

1. **API Error Handling** - Fixed to properly pass duplicate error messages from backend
2. **Public Routes** - Updated to support year filtering for demo mode
3. **useEntries Hook** - Fixed useEffect dependency to properly reload when year changes
4. **entryModel.update** - Made watch_date optional for backward compatibility (pre-2026)
5. **Delete Protection** - Added check to prevent deleting past year entries
6. **Empty Years Handling** - Added empty state for Yearly Movies view when no archives exist
7. **Duplicate Error Display** - Changed from alert() to toast for better UX

## 🧪 Testing Plan

### Before Jan 1, 2026 (Current State - Dec 30, 2025)
- [ ] App works exactly as before (no Yearly Movies tab visible)
- [ ] Can create entries normally (no year column visible)
- [ ] Can edit/delete entries as usual
- [ ] No duplicate prevention active
- [ ] No watch_date field in form

### After Jan 1, 2026 (Feature Activation)

#### Main Collection View
- [ ] Shows only 2026 entries (empty on Jan 1)
- [ ] Watch date field appears in add/edit form
- [ ] Watch date defaults to today
- [ ] Can change watch date to any date
- [ ] Statistics show only 2026 entries

#### Yearly Movies Tab
- [ ] Tab appears in navigation
- [ ] Shows "🔒 Read-Only Archive" badge
- [ ] Dropdown shows 2025 (and other past years)
- [ ] Can select different years
- [ ] Shows entries for selected year
- [ ] Entries sorted by watch_date (newest first)
- [ ] Cannot edit past year entries (shows error toast)
- [ ] Cannot delete past year entries (shows error toast)
- [ ] Can view entry details (read-only)

#### Duplicate Prevention
- [ ] Adding same movie by IMDB ID shows error
- [ ] Adding same title manually shows error
- [ ] Error message shows year where it was added
- [ ] Error shown via toast (not alert)
- [ ] Works across all years (checks globally)

#### Edge Cases
- [ ] Empty state shows when no archives exist
- [ ] Switching years loads correct entries
- [ ] Entries created today show correct watch_date
- [ ] Old entries (pre-2026) have year=2025
- [ ] Filtering and search work in both views
- [ ] Demo mode still works correctly
- [ ] Public routes support year filtering

### Database Tests
- [ ] Run migration successfully adds columns
- [ ] Existing entries get year=2025
- [ ] Existing entries get watch_date=created_at
- [ ] New entries get current year
- [ ] New entries get watch_date from form

## 🔧 Commands to Test

### Start the application
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### Test database migration
```bash
cd backend
# Delete old DB to test fresh
rm movies.db
# Start backend - schema will auto-create with new columns
npm start
```

### Manual SQL testing (if needed)
```bash
sqlite3 backend/movies.db
.schema movies
SELECT * FROM movies LIMIT 5;
.quit
```

## 🎯 Success Criteria

✅ **Before 2026**: No changes to user experience
✅ **On Jan 1, 2026**: Features activate automatically
✅ **After 2026**: Each year archives automatically
✅ **Data Integrity**: No data loss, all entries preserved
✅ **User Experience**: Clear error messages, smooth transitions
✅ **Performance**: No slowdowns with year filtering

## ⚠️ Known Limitations

1. Feature flag is date-based - can't be toggled manually
2. Year transition happens at local midnight (not timezone aware)
3. Past year entries are completely read-only (cannot be moved to another year)
4. Duplicate check is global - same movie can't be added in different years

## 🚀 Deployment Notes

1. Deploy backend changes first (includes migration)
2. Backend will auto-create schema on restart if DB doesn't exist
3. Frontend changes are backward compatible
4. No manual data migration needed
5. Feature activates automatically on Jan 1, 2026
