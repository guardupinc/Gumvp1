# Resend Email Integration - Setup Checklist

## ✅ **Pre-Deployment Checklist**

### 1. **Resend Account Setup**
- [ ] Create Resend account at https://resend.com
- [ ] Verify email domain (or use default resend.dev for testing)
- [ ] Generate API key from Resend dashboard
- [ ] **IMPORTANT:** The API key has already been added to Supabase via the `create_supabase_secret` tool

### 2. **Email Configuration**

#### Update Sender Email Address
**File:** `/supabase/functions/server/email.tsx` - Line 20
```typescript
from: from || 'Guard Up Security <noreply@guardup.com>',
```
Options:
- Use your verified domain: `Guard Up Security <noreply@yourdomain.com>`
- Or use Resend testing domain: `Guard Up Security <onboarding@resend.dev>`

#### Update Supervisor Emails (Incident Alerts)
**File:** `/contexts/AppStateContext.tsx` - Line ~1125
```typescript
const supervisorEmails = ['supervisor@guardupinc.com', 'operations@guardupinc.com'];
```
Replace with:
- [ ] Your actual supervisor email addresses
- [ ] Operations team email addresses

#### Update Client Emails (Report Delivery)
**File:** `/components/pages/Reports.tsx` - Line ~494
```typescript
const clientEmail = 'client@example.com';
```
Replace with:
- [ ] Actual client email addresses (ideally from database/config)
- [ ] Consider creating a client contacts table

### 3. **Test Email Delivery**

#### Test Each Feature:
- [ ] **Client Report Email**
  1. Go to Reports module
  2. Approve 2-3 reports
  3. Send packet from Client Outbox
  4. Verify email received

- [ ] **Shift Notification Email**
  1. Go to Scheduling
  2. Create new shift for a guard
  3. Check guard's email inbox

- [ ] **Incident Alert Email**
  1. Create high-priority incident report
  2. Check supervisor email inbox

- [ ] **License Warning Email**
  1. Check console logs for license checker
  2. Optionally test with guard license expiring soon

### 4. **Domain Verification (Production)**

For production use with custom domain:

- [ ] Add SPF record to DNS:
  ```
  Type: TXT
  Name: @
  Value: v=spf1 include:_spf.resend.com ~all
  ```

- [ ] Add DKIM records (provided by Resend)
  ```
  Type: TXT
  Name: resend._domainkey
  Value: [Provided by Resend]
  ```

- [ ] Verify domain in Resend dashboard

### 5. **Production Considerations**

- [ ] **Email Rate Limiting**
  - Monitor usage in Resend dashboard
  - Current estimate: 680-1,280 emails/month
  - Free tier: 3,000/month (100/day)
  - Consider upgrading if needed

- [ ] **Error Monitoring**
  - Set up error tracking (Sentry, LogRocket, etc.)
  - Monitor console logs for email failures
  - Set up alerts for critical email failures

- [ ] **Email Templates**
  - Test all templates in different email clients
  - Verify responsive design on mobile
  - Check spam score with Mail Tester

- [ ] **Unsubscribe Links** (if needed for marketing emails)
  - Add unsubscribe links for non-transactional emails
  - Maintain unsubscribe list in database

### 6. **Security Checklist**

- [x] API keys stored in environment variables (✅ Done)
- [x] API calls use Bearer token authentication (✅ Done)
- [ ] Review email content for sensitive information
- [ ] Implement rate limiting on email endpoints (optional)
- [ ] Add email delivery confirmation tracking (optional)

### 7. **Compliance Checklist**

- [ ] **GDPR Compliance** (if applicable)
  - Guard email addresses stored with consent
  - Unsubscribe option for non-essential emails
  - Data retention policy

- [ ] **CAN-SPAM Compliance** (US)
  - Physical address in email footer
  - Clear "From" name and email
  - Honest subject lines
  - Unsubscribe option for marketing emails

---

## 🎯 **Quick Start Guide**

### For Testing (Development)
1. ✅ Resend API key already configured
2. ✅ Email templates already created
3. Test with Resend's default domain (`onboarding@resend.dev`)
4. Update recipient emails to your own for testing
5. Deploy and test each feature

### For Production
1. Verify custom domain in Resend
2. Update sender email address
3. Update all recipient email addresses
4. Add DNS records (SPF, DKIM)
5. Test thoroughly
6. Monitor email delivery rates

---

## 📊 **Monitoring Dashboard**

Track these metrics in Resend dashboard:
- **Delivery Rate:** Should be >95%
- **Bounce Rate:** Should be <5%
- **Open Rate:** (optional tracking)
- **Monthly Usage:** Stay within tier limits

---

## 🔥 **Common Issues & Fixes**

### Issue: "API key invalid"
**Fix:** Regenerate API key in Resend and update in Supabase secrets

### Issue: Emails going to spam
**Fix:** 
1. Verify domain in Resend
2. Add SPF/DKIM records
3. Test with Mail Tester (mail-tester.com)
4. Warm up sending IP with gradual volume increase

### Issue: "Rate limit exceeded"
**Fix:** Upgrade Resend plan or reduce email frequency

### Issue: Emails not sending
**Check:**
1. API key is correct
2. Recipient email is valid
3. Sender domain is verified
4. Check Resend dashboard for errors
5. Review console logs

---

## 📞 **Support Resources**

- **Resend Documentation:** https://resend.com/docs
- **Resend Status Page:** https://status.resend.com
- **Guard Up Email Code:** `/supabase/functions/server/email.tsx`
- **Email Routes:** `/supabase/functions/server/routes.tsx`

---

## ✨ **You're All Set!**

Once you complete this checklist, your email system will be fully operational and ready for production use.

**Estimated Setup Time:** 30-60 minutes
**Required Action Items:** 5-8 (depending on production vs. testing)
**Support Level:** Production-ready with monitoring

🎉 **Happy emailing!**
