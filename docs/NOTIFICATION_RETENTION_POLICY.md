# Notification Retention Policy

## Overview
The Toyota Enterprise Portal implements a comprehensive notification management system with automatic cleanup to maintain optimal performance and prevent database bloat.

## Retention Policies

### 1. **Read Notifications**
- **Retention Period**: 7 days
- **Cleanup Rule**: Any notification marked as "read" is automatically deleted after 7 days
- **Reasoning**: Once read, notifications lose their primary purpose and can be safely removed

### 2. **System Announcements**
- **Retention Period**: 30 days (if read)
- **Cleanup Rule**: System announcements are deleted 30 days after being marked as read
- **Reasoning**: Important announcements may need to be referenced for a longer period

### 3. **Reminders**
- **Auto-Mark Period**: 3 days
- **Cleanup Rule**: Reminders are automatically marked as "read" after 3 days, then follow the 7-day cleanup rule
- **Reasoning**: Reminders lose relevance quickly and should be cleaned up proactively

### 4. **All Notifications (Maximum Retention)**
- **Retention Period**: 90 days (absolute maximum)
- **Cleanup Rule**: ALL notifications, regardless of read status, are deleted after 90 days
- **Reasoning**: Ensures no notification persists indefinitely, preventing database bloat

## Automatic Cleanup Schedule

### Daily Cleanup Job
- **Time**: 2:00 AM daily
- **Process**:
  1. Auto-mark old reminders as read (3+ days old)
  2. Delete read notifications older than 7 days
  3. Delete read system announcements older than 30 days
  4. Delete ALL notifications older than 90 days
  5. Log cleanup results

### Other Scheduled Tasks
- **Event Reminders**: Daily at 9:00 AM
- **Approval Reminders**: Every 6 hours (9 AM, 1 PM, 5 PM)

## Manual Cleanup

### Admin Controls
Administrators can trigger manual cleanup through the **Notification Manager** page:
- Access: `/admin/notifications` → "Cleanup & Stats" tab
- Features:
  - Manual cleanup trigger
  - Real-time statistics
  - Cleanup results tracking
  - Retention policy overview

### API Endpoints
- `POST /api/notifications/admin/cleanup` - Trigger manual cleanup
- `GET /api/notifications/admin/stats` - Get notification statistics

## Expected Growth Patterns

### Before Cleanup Implementation
- **Growth Rate**: ~50-200 notifications per day (depending on activity)
- **Storage Impact**: Unlimited growth leading to performance degradation
- **Query Performance**: Degraded over time due to large table size

### After Cleanup Implementation
- **Steady State**: ~100-500 active notifications (varies by organization size)
- **Storage Impact**: Controlled growth with automatic pruning
- **Query Performance**: Maintained through regular cleanup

## Performance Benefits

### Database Performance
- **Smaller Table Size**: Regular cleanup keeps notification table manageable
- **Faster Queries**: Fewer records to scan during notification fetches
- **Reduced Index Size**: Smaller indexes improve query performance

### User Experience
- **Relevant Notifications**: Only recent, relevant notifications shown
- **Faster Loading**: Notification panels load quickly
- **Reduced Clutter**: Automatic cleanup prevents notification overload

## Monitoring & Statistics

### Available Metrics
- Total notification count
- Unread vs. read breakdown
- Notifications by type
- Age distribution (recent, medium, old)
- Cleanup history and results

### Alerts & Notifications
- Cleanup job completion logs
- Failed cleanup alerts
- Statistics tracking for performance monitoring

## Best Practices

### For Users
1. **Mark notifications as read** when no longer needed
2. **Use action URLs** to navigate directly to relevant pages
3. **Check notifications regularly** to avoid accumulation

### For Administrators
1. **Monitor cleanup logs** daily
2. **Review statistics weekly** to identify trends
3. **Adjust retention periods** if needed based on organization requirements
4. **Trigger manual cleanup** during maintenance windows if needed

## Customization Options

### Adjustable Parameters
The following retention periods can be modified in the `NotificationService`:

```typescript
// Current settings
const READ_NOTIFICATION_RETENTION = 7; // days
const SYSTEM_ANNOUNCEMENT_RETENTION = 30; // days
const AUTO_MARK_REMINDERS_AFTER = 3; // days
const MAXIMUM_RETENTION = 90; // days
```

### Environment-Specific Settings
Consider different retention policies for:
- **Development**: Shorter retention (1-7 days)
- **Staging**: Medium retention (7-30 days)  
- **Production**: Full retention policy (as documented)

## Troubleshooting

### Common Issues
1. **High notification count**: Check if cleanup job is running properly
2. **Old notifications persisting**: Verify retention logic and database queries
3. **Performance issues**: Monitor table size and consider manual cleanup

### Recovery Procedures
1. **Manual cleanup**: Use admin interface or API endpoints
2. **Database maintenance**: Run VACUUM or OPTIMIZE on notification table
3. **Statistics refresh**: Clear cached statistics and regenerate

## Compliance & Data Protection

### Data Retention Compliance
- Automatic cleanup ensures compliance with data retention policies
- No personal data retained beyond necessary periods
- Audit trail maintained for cleanup operations

### Privacy Considerations
- Notifications may contain personal information (usernames, event details)
- Cleanup ensures personal data is not retained indefinitely
- Admin access controls protect sensitive notification data

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: Development Team 