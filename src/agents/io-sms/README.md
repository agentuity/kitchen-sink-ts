# SMS Configuration with Twilio

Agents in Agentuity can receive and send SMS messages. This example demonstrates inbound SMS functionality.

## Setup Instructions

1. **Create a Twilio Account**
   
   Sign up for a free trial account at [twilio.com](https://www.twilio.com). Trial accounts include free credits for testing SMS functionality.

2. **Get Your Twilio Credentials**
   
   From your [Twilio Console Dashboard](https://console.twilio.com), locate your Account Info:
   
   ![Twilio Console showing Account SID and Auth Token](/.github/io-sms/sms-setup-1-twilio-dashboard.png)
   
   You'll need:
   - **Account SID**: Your unique account identifier
   - **Account Auth Token**: Your Twilio account secret
   - **API SID**: Your Twilio API SID (create one in the API Keys section)
   - **API Secret**: Your Twilio API Secret (shown only when creating the API key)
   
   > **Important:** When creating an API key in Twilio, the secret is only shown once. Save it immediately - you won't be able to view it again in the API Keys section.

3. **Configure SMS IO in Agentuity**
   
   In the Agentuity web console, navigate to your agent's IO settings (inbound side) and click on SMS:
   
   ![Agentuity SMS configuration dialog](/.github/io-sms/sms-setup-2-agentuity-config.png)
   
   Enter your Twilio credentials:
   - Account SID
   - Account Auth Token
   - API SID
   - API Secret
   
   Click **Validate** to verify your credentials, then **Save**.

4. **Deploy The Project**

   Deploy the Kitchen Sink project to enable SMS functionality:

   ```bash
   agentuity deploy
   ```

5. **Test the Integration**

   Send a text message to your Twilio phone number. The agent will receive it and send a reply back.
