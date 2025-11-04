interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp: string;
  footer?: {
    text: string;
  };
}

interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

class DiscordService {
  private webhookUrl: string;
  private warnedUnconfigured = false;

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim() || "";
  }

  private isConfigured(): boolean {
    if (!this.webhookUrl) {
      if (!this.warnedUnconfigured) {
        console.warn("Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL to enable notifications.");
        this.warnedUnconfigured = true;
      }
      return false;
    }
    return true;
  }

  private getColorForSeverity(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'critical': return 0xFF0000; // Red
      case 'high': return 0xFF6600; // Orange
      case 'medium': return 0xFFCC00; // Yellow
      case 'low': return 0x0099FF; // Blue
      default: return 0x808080; // Gray
    }
  }

  private getColorForRisk(riskLevel: string): number {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 0xFF0000; // Red
      case 'medium': return 0xFFCC00; // Yellow
      case 'low': return 0x0099FF; // Blue
      default: return 0x808080; // Gray
    }
  }

  async sendSecurityAlert(alert: {
    title: string;
    description: string;
    severity: string;
    source: string;
    timestamp?: Date;
  }): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Discord webhook not configured - alert notification skipped');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `🚨 Security Alert: ${alert.title}`,
        description: alert.description,
        color: this.getColorForSeverity(alert.severity),
        fields: [
          {
            name: 'Severity',
            value: alert.severity.toUpperCase(),
            inline: true
          },
          {
            name: 'Source',
            value: alert.source,
            inline: true
          },
          {
            name: 'Timestamp',
            value: (alert.timestamp || new Date()).toISOString(),
            inline: true
          }
        ],
        timestamp: (alert.timestamp || new Date()).toISOString(),
        footer: {
          text: 'WalletGyde Security Agent'
        }
      };

      const payload: DiscordWebhookPayload = {
        username: 'WalletGyde Security',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
        embeds: [embed]
      };

      await this.sendWebhook(payload);
      console.log('Discord security alert sent successfully');
    } catch (error) {
      console.error('Failed to send Discord security alert:', error);
    }
  }

  async sendDataClassificationAlert(classification: {
    dataType: string;
    riskLevel: string;
    source: string;
    content?: string;
    timestamp?: Date;
  }): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Discord webhook not configured - classification alert skipped');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `🔍 Sensitive Data Detected: ${classification.dataType}`,
        description: `Potential ${classification.dataType} found in system data`,
        color: this.getColorForRisk(classification.riskLevel),
        fields: [
          {
            name: 'Data Type',
            value: classification.dataType,
            inline: true
          },
          {
            name: 'Risk Level',
            value: classification.riskLevel.toUpperCase(),
            inline: true
          },
          {
            name: 'Source',
            value: classification.source,
            inline: true
          },
          {
            name: 'Content Sample',
            value: classification.content || 'Content redacted for security',
            inline: false
          }
        ],
        timestamp: (classification.timestamp || new Date()).toISOString(),
        footer: {
          text: 'WalletGyde Security Agent - Data Classification'
        }
      };

      const payload: DiscordWebhookPayload = {
        username: 'WalletGyde Data Monitor',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png',
        embeds: [embed]
      };

      await this.sendWebhook(payload);
      console.log('Discord data classification alert sent successfully');
    } catch (error) {
      console.error('Failed to send Discord data classification alert:', error);
    }
  }

  async sendLLMViolationAlert(violation: {
    violationType: string;
    content: string;
    action: string;
    timestamp?: Date;
  }): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Discord webhook not configured - LLM violation alert skipped');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `🤖 LLM Response Violation: ${violation.violationType}`,
        description: `AI response ${violation.action} due to security policy violation`,
        color: violation.action === 'blocked' ? 0xFF0000 : 0xFFCC00, // Red for blocked, yellow for rewritten
        fields: [
          {
            name: 'Violation Type',
            value: violation.violationType.replace('_', ' ').toUpperCase(),
            inline: true
          },
          {
            name: 'Action Taken',
            value: violation.action.toUpperCase(),
            inline: true
          },
          {
            name: 'Content Sample',
            value: violation.content.length > 100 
              ? violation.content.substring(0, 100) + '...' 
              : violation.content,
            inline: false
          }
        ],
        timestamp: (violation.timestamp || new Date()).toISOString(),
        footer: {
          text: 'WalletGyde Security Agent - LLM Monitor'
        }
      };

      const payload: DiscordWebhookPayload = {
        username: 'WalletGyde LLM Monitor',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png',
        embeds: [embed]
      };

      await this.sendWebhook(payload);
      console.log('Discord LLM violation alert sent successfully');
    } catch (error) {
      console.error('Failed to send Discord LLM violation alert:', error);
    }
  }

  async sendIncidentAlert(incident: {
    severity: string;
    description: string;
    status: string;
    source: string;
    timestamp?: Date;
  }): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Discord webhook not configured - incident alert skipped');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `⚠️ Security Incident: ${incident.severity.toUpperCase()}`,
        description: incident.description,
        color: this.getColorForSeverity(incident.severity),
        fields: [
          {
            name: 'Severity',
            value: incident.severity.toUpperCase(),
            inline: true
          },
          {
            name: 'Status',
            value: incident.status.toUpperCase(),
            inline: true
          },
          {
            name: 'Source',
            value: incident.source,
            inline: true
          }
        ],
        timestamp: (incident.timestamp || new Date()).toISOString(),
        footer: {
          text: 'WalletGyde Security Agent - Incident Management'
        }
      };

      const payload: DiscordWebhookPayload = {
        username: 'WalletGyde Incident Manager',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/3.png',
        embeds: [embed]
      };

      await this.sendWebhook(payload);
      console.log('Discord incident alert sent successfully');
    } catch (error) {
      console.error('Failed to send Discord incident alert:', error);
    }
  }

  private async sendWebhook(payload: DiscordWebhookPayload): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.sendWebhook({
        username: 'WalletGyde Security',
        content: '✅ Discord webhook connection test successful! Security alerts are now active.',
      });
      return true;
    } catch (error) {
      console.error('Discord webhook test failed:', error);
      return false;
    }
  }
}

export const discordService = new DiscordService();
