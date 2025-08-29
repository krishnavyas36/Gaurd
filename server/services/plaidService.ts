import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

class PlaidService {
  private plaidClient: PlaidApi;
  private securityMonitorUrl: string;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox, // Using sandbox for development
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Plaid-Version': '2020-09-14',
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
    this.securityMonitorUrl = process.env.SECURITY_AGENT_URL || 'http://localhost:5000';
    
    // Wrap all Plaid methods with security monitoring
    this.wrapPlaidMethods();
  }

  private wrapPlaidMethods() {
    const methodsToWrap = [
      'accountsGet',
      'transactionsGet', 
      'identityGet',
      'incomeGet',
      'authGet',
      'institutionsGet',
      'itemGet',
      'linkTokenCreate',
      'itemPublicTokenExchange',
      'accountsBalanceGet'
    ];

    methodsToWrap.forEach(methodName => {
      if (typeof (this.plaidClient as any)[methodName] === 'function') {
        const originalMethod = (this.plaidClient as any)[methodName].bind(this.plaidClient);
        
        (this.plaidClient as any)[methodName] = async (...args: any[]) => {
          const startTime = Date.now();
          
          try {
            console.log(`🔒 Monitoring Plaid ${methodName} call...`);
            
            // Call original Plaid method
            const response = await originalMethod(...args);
            
            // Add security monitoring
            await this.monitorPlaidCall(methodName, args[0], response, startTime);
            
            // Classify sensitive data if applicable
            if (this.containsSensitiveData(methodName)) {
              await this.classifyResponseData(methodName, response);
            }
            
            console.log(`✅ Plaid ${methodName} completed with security monitoring`);
            return response;
          } catch (error: any) {
            console.error(`❌ Plaid ${methodName} error:`, error.message);
            
            // Report errors as security incidents
            await this.reportPlaidError(methodName, error, args[0]);
            throw error;
          }
        };
      }
    });
  }

  private async monitorPlaidCall(methodName: string, request: any, response: any, startTime: number) {
    try {
      const callData = {
        source: 'plaid-api',
        endpoint: this.formatEndpointName(methodName),
        method: 'POST',
        requestData: this.sanitizeRequest(request),
        responseData: this.sanitizeResponse(methodName, response),
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: {
          plaidMethod: methodName,
          recordCount: this.getRecordCount(methodName, response),
          environment: 'sandbox',
          clientId: process.env.PLAID_CLIENT_ID?.substring(0, 8) + '...'
        }
      };

      const monitorResponse = await fetch(`${this.securityMonitorUrl}/api/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData)
      });

      if (!monitorResponse.ok) {
        console.warn('Security monitoring failed:', await monitorResponse.text());
      } else {
        const result = await monitorResponse.json();
        console.log(`📊 Security monitoring result: Risk Score ${result.result?.riskScore || 0}, Compliance ${result.compliance?.compliant ? 'PASS' : 'VIOLATIONS'}`);
      }
    } catch (error: any) {
      console.error('Security monitoring error:', error.message);
    }
  }

  private async classifyResponseData(methodName: string, response: any) {
    try {
      let dataToClassify: any[] = [];

      switch (methodName) {
        case 'transactionsGet':
          dataToClassify = this.extractTransactionData(response);
          break;
        case 'identityGet':
          dataToClassify = this.extractIdentityData(response);
          break;
        case 'accountsGet':
          dataToClassify = this.extractAccountData(response);
          break;
        case 'incomeGet':
          dataToClassify = this.extractIncomeData(response);
          break;
      }

      // Send data for classification (sample only for performance)
      for (const data of dataToClassify.slice(0, 5)) {
        await fetch(`${this.securityMonitorUrl}/api/data-classifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: `plaid-${methodName}`,
            data: data.content,
            dataType: data.type,
            metadata: {
              plaidMethod: methodName,
              recordId: data.id,
              environment: 'sandbox'
            }
          })
        }).catch(error => console.error('Data classification failed:', error.message));
      }
    } catch (error: any) {
      console.error('Data classification error:', error.message);
    }
  }

  private async reportPlaidError(methodName: string, error: any, request: any) {
    try {
      const severity = this.getErrorSeverity(error);
      
      await fetch(`${this.securityMonitorUrl}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Plaid API Error: ${methodName}`,
          description: `Error in Plaid ${methodName}: ${error.message}`,
          severity: severity,
          source: 'plaid-integration',
          metadata: {
            plaidMethod: methodName,
            errorCode: error.response?.data?.error_code || 'unknown',
            errorType: error.response?.data?.error_type || 'unknown',
            environment: 'sandbox',
            request: this.sanitizeRequest(request)
          }
        })
      }).catch(console.error);
    } catch (reportError: any) {
      console.error('Error reporting failed:', reportError.message);
    }
  }

  // Public methods for your application to use
  async createLinkToken(userId: string, userEmail?: string) {
    return await this.plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
        email_address: userEmail
      },
      client_name: 'WalletGyde Security Agent',
      products: [Products.Transactions, Products.Auth, Products.Identity],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
  }

  async exchangePublicToken(publicToken: string) {
    return await this.plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
  }

  async getAccounts(accessToken: string) {
    return await this.plaidClient.accountsGet({
      access_token: accessToken,
    });
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    return await this.plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getIdentity(accessToken: string) {
    return await this.plaidClient.identityGet({
      access_token: accessToken,
    });
  }

  async getIncome(accessToken: string) {
    // Note: Income endpoint may not be available in all Plaid environments
    try {
      return await (this.plaidClient as any).incomeGet({
        access_token: accessToken,
      });
    } catch (error: any) {
      if (error.message.includes('not supported')) {
        throw new Error('Income endpoint not supported in current Plaid environment');
      }
      throw error;
    }
  }

  async getAuth(accessToken: string) {
    return await this.plaidClient.authGet({
      access_token: accessToken,
    });
  }

  // Helper methods
  private formatEndpointName(methodName: string): string {
    return methodName.replace(/([A-Z])/g, '/$1').toLowerCase().substring(1);
  }

  private containsSensitiveData(methodName: string): boolean {
    return ['transactionsGet', 'identityGet', 'accountsGet', 'incomeGet', 'authGet'].includes(methodName);
  }

  private sanitizeRequest(request: any): any {
    if (!request) return {};
    const sanitized = { ...request };
    // Remove sensitive tokens and secrets
    delete sanitized.access_token;
    delete sanitized.public_token;
    delete sanitized.secret;
    delete sanitized.client_id;
    return sanitized;
  }

  private sanitizeResponse(methodName: string, response: any): any {
    if (!response || !response.data) return { status: 'success' };
    
    return {
      status: 'success',
      recordCount: this.getRecordCount(methodName, response),
      requestId: response.data.request_id
    };
  }

  private getRecordCount(methodName: string, response: any): number {
    if (!response || !response.data) return 0;
    
    switch (methodName) {
      case 'accountsGet':
        return response.data.accounts?.length || 0;
      case 'transactionsGet':
        return response.data.transactions?.length || 0;
      case 'identityGet':
        return response.data.accounts?.length || 0;
      default:
        return 1;
    }
  }

  private getErrorSeverity(error: any): string {
    if (!error.response) return 'medium';
    
    const status = error.response.status;
    if (status >= 500) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  // Data extraction methods for classification
  private extractTransactionData(response: any): any[] {
    if (!response.data.transactions) return [];
    
    return response.data.transactions.map((transaction: any) => ({
      id: transaction.transaction_id,
      type: 'financial_transaction',
      content: `${transaction.name} ${transaction.merchant_name || ''} $${transaction.amount} ${transaction.account_owner || ''}`
    }));
  }

  private extractIdentityData(response: any): any[] {
    if (!response.data.accounts) return [];
    
    const identityData: any[] = [];
    response.data.accounts.forEach((account: any) => {
      if (account.owners) {
        account.owners.forEach((owner: any) => {
          identityData.push({
            id: `${account.account_id}-${owner.names[0]?.data}`,
            type: 'personal_identity',
            content: `${owner.names[0]?.data || ''} ${owner.emails[0]?.data || ''} ${owner.phone_numbers[0]?.data || ''}`
          });
        });
      }
    });
    
    return identityData;
  }

  private extractAccountData(response: any): any[] {
    if (!response.data.accounts) return [];
    
    return response.data.accounts.map((account: any) => ({
      id: account.account_id,
      type: 'financial_account',
      content: `${account.name} ${account.official_name || ''} ${account.type} ${account.subtype}`
    }));
  }

  private extractIncomeData(response: any): any[] {
    if (!response.data.income) return [];
    
    return [{
      id: 'income-data',
      type: 'financial_income',
      content: `Income streams: ${response.data.income.income_streams?.length || 0} sources`
    }];
  }
}

export const plaidService = new PlaidService();