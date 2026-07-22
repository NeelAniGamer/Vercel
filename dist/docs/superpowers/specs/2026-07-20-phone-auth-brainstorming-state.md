# Brainstorming State: Twilio Phone Auth Integration
Date: 2026-07-20
Status: Paused (at Design Phase)

## Agreed-Upon Requirements
- **Unified Input**: A single input field that detects whether the user entered an email or phone number.
- **Smart Delivery**: A hybrid approach (Option 1) that attempts WhatsApp first and automatically falls back to SMS if delivery fails or takes too long.
- **User Choice**: An explicit selection menu (SMS vs WhatsApp) for users with a strong preference.
- **Architecture**: Custom Supabase Edge Functions + Twilio API (Option B) to bypass built-in Supabase limitations and gain full control over the Twilio Message Service.

## Design Decisions Made
### 1. Backend Logic
- **Flow**: `send-otp` $\rightarrow$ Generate 6-digit OTP $\rightarrow$ Store in `auth_otps` $\rightarrow$ Dispatch via Twilio Message Service.
- **Verification**: `verify-otp` $\rightarrow$ Validate hash $\rightarrow$ Create/Update Supabase session $\rightarrow$ Return JWT.
- **Fallback**: If `verify` is not called within 60s or Twilio reports failure, the system allows a forced SMS fallback.

### 2. Database & State
- **`auth_otps` Table**: Stores `phone_number`, `otp_hash`, `channel`, `expires_at`, `attempts`, and `verified`.
- **User Linkage**: `phone_number` linked to user profile to preserve "Civic Score" and certificates.
- **Security**: Rate limiting per IP/Phone, 5-minute OTP expiry, and restricted `search_path` for any DB functions.

### 3. Twilio Setup
- Use a **Twilio Messaging Service SID** to manage Alphanumeric Sender IDs and routing across WhatsApp and SMS.

## Next Steps (When Resuming)
1. Finalize UI/UX laout for the unified input and OTP entry.
2. Design the exact API signatures for the Edge Functions.
3. Write the formal design spec and transition to implementation.
