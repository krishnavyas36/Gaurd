/**
 * Plaid Security Wrapper - Adds security monitoring to existing Plaid integration
 * This wrapper maintains all existing Plaid functionality while adding security features
 */

class PlaidSecurityWrapper {
  constructor(plaidClient, securityAgentUrl = 'http://localhost:5000') {
    this.plaidClient = plaidClient;
    this.securityAgent = securityAgentUrl;
    this.wrapPlaidMethods();
  }

  /**
   * Automatically wraps all Plaid client methods with security monitoring
   */
  wrapPlaidMethods() {
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
      if (typeof this.plaidClient[methodName] === 'function') {
        const originalMethod = this.plaidClient[methodName].bind(this.plaidClient);
        
        this.plaidClient[methodName] = async (...args) => {
          const startTime = Date.now();
          
          try {
            // Call original Plaid method
            const response = await originalMethod(...args);
            
            // Add security monitoring
            await this.monitorPlaidCall(methodName, args[0], response, startTime);
            
            // Classify sensitive data if applicable
            if (this.containsSensitiveData(methodName)) {
              await this.classifyResponseData(methodName, response);
            }
            
            return response;
          } catch (error) {
            // Report errors as security incidents
            await this.reportPlaidError(methodName, error, args[0]);
            throw error;
          }
        };
      }
    });
  }

  /**
   * Monitor Plaid API calls for security analysis
   */
  async monitorPlaidCall(methodName, request, response, startTime) {
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
          recordCount: this.getRecordCount(methodName, response)
        }
      };

      await fetch(`${this.securityAgent}/api/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData)
      }).catch(console.error);
    } catch (error) {
      console.error('Security monitoring failed:', error.message);
    }
  }

  /**
   * Classify sensitive data in Plaid responses
   */
  async classifyResponseData(methodName, response) {
    try {
      let dataToClassify = [];

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
        await fetch(`${this.securityAgent}/api/data-classifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: `plaid-${methodName}`,
            data: data.content,
            dataType: data.type,
            metadata: {
              plaidMethod: methodName,
              recordId: data.id
            }
          })
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Data classification failed:', error.message);
    }
  }

  /**
   * Report Plaid API errors as security incidents
   */
  async reportPlaidError(methodName, error, request) {
    try {
      const severity = this.getErrorSeverity(error);
      
      await fetch(`${this.securityAgent}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Plaid API Error: ${methodName}`,
          description: `Error in Plaid ${methodName}: ${error.message}`,
          severity: severity,
          source: 'plaid-integration',
          metadata: {
            plaidMethod: methodName,
            errorCode: error.status || 'unknown',
            errorType: error.error_type || 'unknown',
            request: this.sanitizeRequest(request)
          }
        })
      }).catch(console.error);
    } catch (reportError) {
      console.error('Error reporting failed:', reportError.message);
    }
  }

  // Helper methods
  formatEndpointName(methodName) {
    return methodName.replace(/([A-Z])/g, '/$1').toLowerCase().substring(1);
  }

  containsSensitiveData(methodName) {
    return ['transactionsGet', 'identityGet', 'accountsGet', 'incomeGet', 'authGet'].includes(methodName);
  }

  sanitizeRequest(request) {
    if (!request) return {};
    const sanitized = { ...request };
    // Remove sensitive tokens and secrets
    delete sanitized.access_token;
    delete sanitized.public_token;
    delete sanitized.secret;
    delete sanitized.client_id;
    return sanitized;
  }

  sanitizeResponse(methodName, response) {
    if (!response || !response.data) return { status: 'success' };
    
    return {
      status: 'success',
      recordCount: this.getRecordCount(methodName, response),
      requestId: response.data.request_id
    };
  }

  getRecordCount(methodName, response) {
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

  getErrorSeverity(error) {
    if (!error.status) return 'medium';
    
    if (error.status >= 500) return 'high';
    if (error.status >= 400) return 'medium';
    return 'low';
  }

  // Data extraction methods for classification
  extractTransactionData(response) {
    if (!response.data.transactions) return [];
    
    return response.data.transactions.map(transaction => ({
      id: transaction.transaction_id,
      type: 'financial_transaction',
      content: `${transaction.name} ${transaction.merchant_name || ''} $${transaction.amount} ${transaction.account_owner || ''}`
    }));
  }

  extractIdentityData(response) {
    if (!response.data.accounts) return [];
    
    const identityData = [];
    response.data.accounts.forEach(account => {
      if (account.owners) {
        account.owners.forEach(owner => {
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

  extractAccountData(response) {
    if (!response.data.accounts) return [];
    
    return response.data.accounts.map(account => ({
      id: account.account_id,
      type: 'financial_account',
      content: `${account.name} ${account.official_name || ''} ${account.type} ${account.subtype}`
    }));
  }

  extractIncomeData(response) {
    if (!response.data.income) return [];
    
    return [{
      id: 'income-data',
      type: 'financial_income',
      content: `Income streams: ${response.data.income.income_streams?.length || 0} sources`
    }];
  }
}

module.exports = PlaidSecurityWrapper;