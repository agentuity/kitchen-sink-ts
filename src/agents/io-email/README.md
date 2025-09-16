# Email Configuration

Agents in Agentuity can receive and send emails. This example demonstrates inbound email functionality.

## Setup Instructions

1. **Configure Email IO in Agentuity**

   In the Agentuity web console, navigate to your agent's IO settings (inbound side) and click on Email:

   ![Agentuity Email configuration dialog](/.github/io-email/email-setup-1-config.png)

   Once enabled, your agent receives a unique email address (based on its agent ID) that you can use to test this example.

2. **Deploy The Project**

   Deploy the Kitchen Sink project to enable email functionality:

   ```bash
   agentuity deploy
   ```

3. **Test the Integration**

   Send an email to your agent's email address. The agent will receive it and send a reply back.
