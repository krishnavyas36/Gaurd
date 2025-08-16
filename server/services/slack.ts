import { WebClient, type ChatPostMessageArguments } from "@slack/web-api";

if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable not set - Slack notifications disabled");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable not set - Slack notifications disabled");
}

const slack = process.env.SLACK_BOT_TOKEN ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

export async function sendSlackMessage(message: ChatPostMessageArguments): Promise<string | undefined> {
  if (!slack || !process.env.SLACK_CHANNEL_ID) {
    console.log("Slack not configured, would have sent:", message);
    return undefined;
  }

  try {
    const response = await slack.chat.postMessage({
      ...message,
      channel: process.env.SLACK_CHANNEL_ID,
    });
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

export async function sendSecurityAlert(title: string, description: string, severity: string) {
  const emoji = severity === "critical" ? "🚨" : severity === "warning" ? "⚠️" : "ℹ️";
  const color = severity === "critical" ? "#D32F2F" : severity === "warning" ? "#F57C00" : "#1976D2";

  await sendSlackMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *WalletGyde Security Alert*`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Severity:*\n${severity.toUpperCase()}`
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date().toLocaleString()}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${title}*\n${description}`
        }
      }
    ],
    attachments: [
      {
        color: color,
        fallback: `Security Alert: ${title}`
      }
    ]
  });
}
