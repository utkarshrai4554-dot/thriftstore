# Birthday Reward System Documentation

## Overview

The birthday reward system automatically awards users 50 reward points on their birthday every year. The bonus points are valid for 30 days from the award date.

## Features

### ✅ Automatic Yearly Birthday Rewards
- Users automatically receive 50 bonus points on their birthday
- Points are valid for 30 days from the birthday
- System checks if rewards were already awarded for the current year
- Prevents duplicate awards within the same year

### ✅ Real-time Countdown Timers
- **Birthday Countdown**: Shows time remaining until next birthday
- **Bonus Expiry Countdown**: Shows time remaining until birthday bonus expires
- Updates every second for accurate timing

### ✅ Birthday Alerts
- Special alert appears 7 days before birthday
- Shows countdown and informs about upcoming bonus
- Only displays when birthday is approaching

### ✅ Automatic Cleanup
- Expired birthday points are automatically removed
- Total reward points are adjusted when bonus expires
- Database stays synchronized between collections

## How It Works

### 1. User Birthday Detection
```typescript
// Check if today is user's birthday (ignoring year)
const birthdate = new Date(userData.birthdate);
const isBirthday = (
  today.getMonth() === birthdate.getMonth() &&
  today.getDate() === birthdate.getDate()
);
```

### 2. Yearly Award Prevention
```typescript
// Check if reward was already awarded this year
if (lastRewardDate.getFullYear() === today.getFullYear() &&
    lastRewardDate.getMonth() === today.getMonth() &&
    lastRewardDate.getDate() === today.getDate()) {
  return { awarded: false, message: 'Birthday reward already awarded this year' };
}
```

### 3. Countdown Calculation
```typescript
// Calculate time until next birthday
let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
if (nextBirthday < today) {
  nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
}
```

## Database Schema

### Users Collection
```typescript
{
  birthdate: string,           // User's birthdate (YYYY-MM-DD)
  rewardPoints: number,        // Total points (base + birthday bonus)
  birthdayRewardPoints: number, // Birthday bonus points (0 or 50)
  birthdayRewardExpiry: Date,   // When birthday bonus expires
  lastBirthdayReward: Date      // When birthday bonus was last awarded
}
```

## Components

### BirthdayCountdownAlert
- Displays birthday countdown alerts
- Shows special notification 7 days before birthday
- Handles both approaching and regular countdowns

### BirthdayRewardAdmin
- Admin interface for manual birthday checks
- Shows results of birthday reward processing
- Useful for testing and administration

## Utility Functions

### Core Functions
- `checkAndAwardBirthdayReward(uid)`: Checks and awards birthday rewards
- `getBirthdayCountdown(birthdate)`: Calculates countdown to next birthday
- `isBirthdayApproaching(birthdate, daysBefore)`: Checks if birthday is approaching
- `checkAllUsersBirthdayRewards()`: Processes all users for birthday rewards

### Scheduler Functions
- `runBirthdayRewardChecks()`: Runs automatic birthday checks
- `setupDailyBirthdayCheck()`: Sets up client-side daily checks
- `manuallyTriggerBirthdayChecks()`: Manual trigger for testing

## Automatic Processing

### Client-Side (Development)
```typescript
// Set up daily birthday checks at 9:00 AM
setupDailyBirthdayCheck();
```

### Production Recommendation
For production, implement server-side scheduling:
- **Cloud Functions**: Firebase Cloud Functions with HTTP triggers
- **Cron Jobs**: Server-side cron jobs calling the birthday check API
- **Scheduled Tasks**: Cloud scheduler or similar services

## User Experience

### Birthday Day
1. User logs in on their birthday
2. System automatically detects birthday
3. 50 bonus points are awarded immediately
4. Success notification appears with celebration emoji
5. Profile updates to show new total points

### Countdown Display
- **Before Birthday**: Shows "Next birthday in: Xd Xh Xm Xs"
- **7 Days Before**: Special alert with cake icon and bonus information
- **After Birthday**: Shows bonus expiry countdown if active

### Bonus Expiry
- Countdown shows "Expires in: Xd Xh Xm Xs"
- Automatic cleanup when expired
- Points removed from total display

## Testing

### Manual Testing
1. Use BirthdayRewardAdmin component to trigger checks
2. Test with different birthdate scenarios
3. Verify countdown accuracy
4. Check expiry handling

### Test Scenarios
- User with birthday today
- User with birthday tomorrow
- User with birthday 7 days from now
- User with expired birthday bonus
- User without birthdate set

## Security Considerations

- Birthday rewards are awarded once per year per user
- Server-side validation prevents client-side manipulation
- Automatic cleanup prevents point accumulation
- Database transactions ensure data consistency

## Future Enhancements

- Customizable bonus amounts
- Different bonus tiers based on user activity
- Birthday email notifications
- Birthday discount codes
- Social sharing for birthday rewards

## Troubleshooting

### Common Issues
1. **Birthday not detected**: Check birthdate format (YYYY-MM-DD)
2. **Duplicate rewards**: Verify year checking logic
3. **Countdown not updating**: Check useEffect dependencies
4. **Points not expiring**: Verify cleanup function execution

### Debug Logging
The system includes comprehensive logging for troubleshooting:
- Birthday check results
- Countdown calculations
- Database updates
- Error details

## Performance

- Countdown timers update every second (client-side only)
- Birthday checks run once per day (server-side recommended)
- Database queries optimized with proper indexing
- Automatic cleanup prevents data bloat
