# Gmail Approval Email Setup

This project now includes a Firebase Cloud Function that sends an approval email when a new approved booking is created under `bookings/{roomId}/{date}/{bookingId}`.

## 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use booking-rooms-54f34
```

## 2. Install Function Dependencies

Run inside the `functions` folder:

```bash
cd functions
npm install
```

## 3. Create a Gmail App Password

Use the Gmail account that should send the approval emails:

1. Turn on Google 2-Step Verification
2. Open Google Account > Security > App Passwords
3. Create an app password for Mail

## 4. Store Gmail Secrets in Firebase

Run from the project root:

```bash
firebase functions:secrets:set GMAIL_EMAIL
firebase functions:secrets:set GMAIL_APP_PASSWORD
```

Use:
- `GMAIL_EMAIL`: your Gmail address
- `GMAIL_APP_PASSWORD`: the 16-character Gmail app password

## 5. Deploy the Function

```bash
firebase deploy --only functions
```

## 6. How It Works

- Admin approves a request in the dashboard
- The app moves that request to `bookings/...` with `status: "approved"`
- Firebase Cloud Function `sendApprovalEmail` runs automatically
- Gmail sends the approval email to `booking.email`

## Important

- Never put Gmail credentials in the React `.env`
- Secrets must stay in Firebase Functions only
- If emails are not arriving, check Firebase function logs:

```bash
firebase functions:log
```
