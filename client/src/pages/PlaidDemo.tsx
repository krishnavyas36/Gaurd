import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, AlertTriangle, CheckCircle, CreditCard, User, DollarSign, Building } from 'lucide-react';

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype: string;
  balances: {
    current: number;
    available?: number;
  };
}

interface PlaidTransaction {
  transaction_id: string;
  name: string;
  amount: number;
  date: string;
  merchant_name?: string;
  category: string[];
}

export default function PlaidDemo() {
  const [step, setStep] = useState<'token' | 'exchange' | 'dashboard'>('token');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('demo-user-123');
  const [userEmail, setUserEmail] = useState('demo@example.com');
  const [linkToken, setLinkToken] = useState('');
  const [publicToken, setPublicToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  
  const { toast } = useToast();

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
      
      toast({
        title: "Link Token Created",
        description: "Ready to connect your bank account with security monitoring",
      });
      
      setStep('exchange');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exchangeToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      
      toast({
        title: "Token Exchanged",
        description: "Successfully connected with security monitoring enabled",
      });
      
      await loadAccountData(data.access_token);
      setStep('dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccountData = async (token: string) => {
    try {
      // Load accounts
      const accountsResponse = await fetch('/api/plaid/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token })
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData.accounts);
      }

      // Load recent transactions
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const transactionsResponse = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: token,
          start_date: startDate,
          end_date: endDate,
          count: 10
        })
      });

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions);
      }

      // Load security alerts
      const alertsResponse = await fetch('/api/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setSecurityAlerts(alertsData.alerts?.filter((alert: any) => 
          alert.source === 'compliance-monitor' || alert.source === 'plaid-integration'
        ) || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const testIdentityData = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });

      if (response.ok) {
        toast({
          title: "Identity Data Retrieved",
          description: "Check security dashboard for PII detection results",
        });
        
        // Refresh security alerts
        setTimeout(() => loadAccountData(accessToken), 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold">Plaid Security Integration Demo</h1>
          <p className="text-gray-600">Connect your bank account with real-time security monitoring</p>
        </div>
      </div>

      {step === 'token' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Step 1: Create Link Token</span>
            </CardTitle>
            <CardDescription>
              Start the secure bank connection process with automatic security monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="demo-user-123"
                  data-testid="input-user-id"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="demo@example.com"
                  data-testid="input-user-email"
                />
              </div>
            </div>
            
            <Button 
              onClick={createLinkToken} 
              disabled={loading || !userId}
              className="w-full"
              data-testid="button-create-link-token"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Secure Link Token
            </Button>
            
            {linkToken && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Link Token Created Successfully!</p>
                <p className="text-xs text-green-600 mt-1">Token: {linkToken.substring(0, 20)}...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'exchange' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Step 2: Bank Connection</span>
            </CardTitle>
            <CardDescription>
              In a real app, users would use Plaid Link here. For demo, paste a public token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="publicToken">Public Token (from Plaid Link)</Label>
              <Textarea
                id="publicToken"
                value={publicToken}
                onChange={(e) => setPublicToken(e.target.value)}
                placeholder="public-sandbox-xxx..."
                className="min-h-[100px]"
                data-testid="input-public-token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use Plaid's sandbox public token or test with: public-sandbox-test-token
              </p>
            </div>
            
            <Button 
              onClick={exchangeToken} 
              disabled={loading || !publicToken}
              className="w-full"
              data-testid="button-exchange-token"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Connect Bank Account Securely
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setStep('token')}
              className="w-full"
              data-testid="button-back-to-token"
            >
              Back to Link Token
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'dashboard' && (
        <div className="space-y-6">
          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>Security Monitoring Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">Active Monitoring</p>
                  <p className="text-sm text-gray-600">All Plaid calls secured</p>
                </div>
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-medium">{securityAlerts.length} Alerts</p>
                  <p className="text-sm text-gray-600">Security incidents detected</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium">PII Protection</p>
                  <p className="text-sm text-gray-600">Sensitive data classified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          {securityAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Recent Security Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityAlerts.slice(0, 3).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">{alert.title}</p>
                        <p className="text-sm text-red-600">{alert.description}</p>
                      </div>
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Connected Accounts ({accounts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.account_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-gray-600">{account.type} - {account.subtype}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${account.balances.current.toFixed(2)}</p>
                      {account.balances.available && (
                        <p className="text-sm text-gray-600">Available: ${account.balances.available.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Recent Transactions ({transactions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.transaction_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.name}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.date} • {transaction.category.join(', ')}
                      </p>
                    </div>
                    <p className="font-bold text-right">
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Security Features */}
          <Card>
            <CardHeader>
              <CardTitle>Test Security Features</CardTitle>
              <CardDescription>
                Test different Plaid endpoints to see security monitoring in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={testIdentityData}
                disabled={loading}
                variant="outline"
                className="w-full"
                data-testid="button-test-identity"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Test Identity Data (PII Detection)
              </Button>
              
              <Button 
                onClick={() => window.open('/dashboard', '_blank')}
                variant="outline"
                className="w-full"
                data-testid="button-open-dashboard"
              >
                Open Security Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}