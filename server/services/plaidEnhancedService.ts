import { PlaidApi, Configuration, PlaidEnvironments, TransactionsGetRequest, AccountsGetRequest, IdentityGetRequest } from 'plaid';
import { storage } from '../storage';
import { monitoringService } from './monitoring';
import { discordService } from './discordService';

interface PlaidTransactionData {
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category: string[];
  transaction_type: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  payment_meta?: {
    reference_number?: string;
    ppd_id?: string;
    payee?: string;
    by_order_of?: string;
    payer?: string;
    payment_method?: string;
    payment_processor?: string;
    reason?: string;
  };
}

interface PlaidAccountData {
  account_id: string;
  balances: {
    available?: number;
    current?: number;
    iso_currency_code?: string;
    limit?: number;
    unofficial_currency_code?: string;
  };
  mask?: string;
  name: string;
  official_name?: string;
  subtype?: string;
  type: string;
}

class PlaidEnhancedService {
  private client: PlaidApi;
  
  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    
    this.client = new PlaidApi(configuration);
  }

  async pullTransactionsAndMetadata(accessToken: string, startDate: string, endDate: string): Promise<PlaidTransactionData[]> {
    try {
      console.log(`Pulling Plaid transactions from ${startDate} to ${endDate}`);
      
      const request: TransactionsGetRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await this.client.transactionsGet(request);
      const transactions = response.data.transactions;

      console.log(`Retrieved ${transactions.length} transactions from Plaid`);

      // Process each transaction through security monitoring
      for (const transaction of transactions) {
        await this.processTransactionSecurity(transaction);
      }

      // Log the API call for monitoring
      await monitoringService.processApiCall(
        'Plaid Transactions API',
        '/transactions/get',
        { transactionCount: transactions.length, dateRange: `${startDate} to ${endDate}` }
      );

      // Transform to our format
      const transformedTransactions: PlaidTransactionData[] = transactions.map(transaction => ({
        account_id: transaction.account_id,
        amount: transaction.amount,
        date: transaction.date,
        name: transaction.name,
        merchant_name: transaction.merchant_name || undefined,
        category: transaction.category || [],
        transaction_type: transaction.transaction_type || 'unknown',
        location: transaction.location ? {
          address: transaction.location.address || undefined,
          city: transaction.location.city || undefined,
          region: transaction.location.region || undefined,
          postal_code: transaction.location.postal_code || undefined,
          country: transaction.location.country || undefined,
        } : undefined,
        payment_meta: transaction.payment_meta ? {
          reference_number: transaction.payment_meta.reference_number || undefined,
          ppd_id: transaction.payment_meta.ppd_id || undefined,
          payee: transaction.payment_meta.payee || undefined,
          by_order_of: transaction.payment_meta.by_order_of || undefined,
          payer: transaction.payment_meta.payer || undefined,
          payment_method: transaction.payment_meta.payment_method || undefined,
          payment_processor: transaction.payment_meta.payment_processor || undefined,
          reason: transaction.payment_meta.reason || undefined,
        } : undefined,
      }));

      return transformedTransactions;
    } catch (error) {
      console.error('Error pulling Plaid transactions:', error);
      
      // Create security incident for API failure
      await storage.createIncident({
        severity: 'high',
        description: `Plaid transactions API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'investigating',
        source: 'Plaid Enhanced Service'
      });

      throw error;
    }
  }

  async pullAccountsAndMetadata(accessToken: string): Promise<PlaidAccountData[]> {
    try {
      console.log('Pulling Plaid accounts and metadata');
      
      const request: AccountsGetRequest = {
        access_token: accessToken,
      };

      const response = await this.client.accountsGet(request);
      const accounts = response.data.accounts;

      console.log(`Retrieved ${accounts.length} accounts from Plaid`);

      // Process each account through security monitoring
      for (const account of accounts) {
        await this.processAccountSecurity(account);
      }

      // Log the API call for monitoring
      await monitoringService.processApiCall(
        'Plaid Accounts API',
        '/accounts/get',
        { accountCount: accounts.length }
      );

      // Transform to our format
      const transformedAccounts: PlaidAccountData[] = accounts.map(account => ({
        account_id: account.account_id,
        balances: {
          available: account.balances.available || undefined,
          current: account.balances.current || undefined,
          iso_currency_code: account.balances.iso_currency_code || undefined,
          limit: account.balances.limit || undefined,
          unofficial_currency_code: account.balances.unofficial_currency_code || undefined,
        },
        mask: account.mask || undefined,
        name: account.name,
        official_name: account.official_name || undefined,
        subtype: account.subtype || undefined,
        type: account.type,
      }));

      return transformedAccounts;
    } catch (error) {
      console.error('Error pulling Plaid accounts:', error);
      
      // Create security incident for API failure
      await storage.createIncident({
        severity: 'high',
        description: `Plaid accounts API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'investigating',
        source: 'Plaid Enhanced Service'
      });

      throw error;
    }
  }

  private async processTransactionSecurity(transaction: any) {
    try {
      // Check for high-volume transactions
      if (transaction.amount > 10000) {
        await storage.createAlert({
          title: 'High-Value Transaction Detected',
          description: `Transaction of $${transaction.amount} detected for account ${transaction.account_id}`,
          severity: 'high',
          source: 'Plaid Transaction Monitor',
          status: 'active'
        });

        // Send Discord notification
        await discordService.sendSecurityAlert({
          title: 'High-Value Transaction Alert',
          description: `High-value transaction detected: $${transaction.amount} from ${transaction.merchant_name || transaction.name}`,
          severity: 'high',
          source: 'Plaid Transaction Monitor',
          timestamp: new Date()
        });
      }

      // Check transaction metadata for suspicious patterns
      const transactionData = JSON.stringify(transaction);
      await this.scanTransactionForCompliance(transactionData, transaction.account_id);

    } catch (error) {
      console.error('Error processing transaction security:', error);
    }
  }

  private async processAccountSecurity(account: any) {
    try {
      // Check for unusual account balances
      if (account.balances.current && account.balances.current > 100000) {
        await storage.createAlert({
          title: 'High Balance Account Detected',
          description: `Account ${account.account_id} has balance of $${account.balances.current}`,
          severity: 'medium',
          source: 'Plaid Account Monitor',
          status: 'active'
        });
      }

      // Scan account data for PII and compliance issues
      const accountData = JSON.stringify(account);
      await this.scanAccountForCompliance(accountData, account.account_id);

    } catch (error) {
      console.error('Error processing account security:', error);
    }
  }

  private async scanTransactionForCompliance(transactionData: string, accountId: string) {
    // Check for credit card patterns in transaction data
    const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    const creditCardMatches = transactionData.match(creditCardPattern);
    
    if (creditCardMatches) {
      await storage.createDataClassification({
        dataType: 'Credit Card',
        riskLevel: 'high',
        source: `Plaid Transaction - Account ${accountId}`,
        content: `Credit card pattern detected: ${creditCardMatches[0].replace(/\d(?=\d{4})/g, '*')}`,
        isResolved: false
      });

      await discordService.sendDataClassificationAlert({
        dataType: 'Credit Card',
        riskLevel: 'high',
        source: `Plaid Transaction - Account ${accountId}`,
        content: 'Credit card information detected in transaction data',
        timestamp: new Date()
      });
    }

    // Check for SSN patterns
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
    const ssnMatches = transactionData.match(ssnPattern);
    
    if (ssnMatches) {
      await storage.createDataClassification({
        dataType: 'SSN',
        riskLevel: 'high',
        source: `Plaid Transaction - Account ${accountId}`,
        content: `SSN pattern detected: ***-**-${ssnMatches[0].slice(-4)}`,
        isResolved: false
      });

      await discordService.sendDataClassificationAlert({
        dataType: 'SSN',
        riskLevel: 'high',
        source: `Plaid Transaction - Account ${accountId}`,
        content: 'SSN detected in transaction data',
        timestamp: new Date()
      });
    }
  }

  private async scanAccountForCompliance(accountData: string, accountId: string) {
    // Check for email patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = accountData.match(emailPattern);
    
    if (emailMatches) {
      await storage.createDataClassification({
        dataType: 'Email Address',
        riskLevel: 'medium',
        source: `Plaid Account - ${accountId}`,
        content: `Email detected: ${emailMatches[0]}`,
        isResolved: false
      });
    }

    // Check for phone number patterns
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const phoneMatches = accountData.match(phonePattern);
    
    if (phoneMatches) {
      await storage.createDataClassification({
        dataType: 'Phone Number',
        riskLevel: 'medium',
        source: `Plaid Account - ${accountId}`,
        content: `Phone number detected: ***-***-${phoneMatches[0].slice(-4)}`,
        isResolved: false
      });
    }
  }

  async checkHighVolumeTransactions(accessToken: string, accountId: string, timeWindow: number = 24): Promise<boolean> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (timeWindow * 60 * 60 * 1000));
      
      const transactions = await this.pullTransactionsAndMetadata(
        accessToken,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const accountTransactions = transactions.filter(t => t.account_id === accountId);
      const transactionCount = accountTransactions.length;
      const totalAmount = accountTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Check for high volume (more than 50 transactions in time window)
      if (transactionCount > 50) {
        await storage.createAlert({
          title: 'High Volume Transaction Alert',
          description: `Account ${accountId} has ${transactionCount} transactions in ${timeWindow} hours`,
          severity: 'critical',
          source: 'Plaid Volume Monitor',
          status: 'active'
        });

        await discordService.sendSecurityAlert({
          title: 'High Volume Transaction Detection',
          description: `Unusual transaction volume detected: ${transactionCount} transactions totaling $${totalAmount.toFixed(2)} in ${timeWindow} hours`,
          severity: 'critical',
          source: 'Plaid Volume Monitor',
          timestamp: new Date()
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking high volume transactions:', error);
      return false;
    }
  }
}

export const plaidEnhancedService = new PlaidEnhancedService();