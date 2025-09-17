import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface DataClassificationProps {
  classifications: any[];
}

export default function DataClassification({ classifications }: DataClassificationProps) {
  const getRiskCounts = () => {
    return classifications.reduce((acc, item) => {
      acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
  };

  const getRecentClassifications = () => {
    return classifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const classTime = new Date(timestamp);
    const diffMs = now.getTime() - classTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const riskCounts = getRiskCounts();
  const recentClassifications = getRecentClassifications();

  return (
    <Card className="border border-gray-200" data-testid="data-classification">
      <div className="p-6 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-white">Data Classification</h2>
      </div>
      <CardContent className="p-6">
        {/* Classification Categories */}
        <div className="space-y-4 mb-6" data-testid="risk-level-summary">
          <div className="flex items-center justify-between p-4 bg-red-900/40 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">High Risk</h3>
                <p className="text-xs text-white/70">SSN, Credit Cards</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-white" data-testid="text-high-risk-count">
              {riskCounts.high}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-900/40 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-700 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Medium Risk</h3>
                <p className="text-xs text-white/70">Email, Phone Numbers</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-white" data-testid="text-medium-risk-count">
              {riskCounts.medium}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-900/40 border border-blue-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Info className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Low Risk</h3>
                <p className="text-xs text-white/70">Names, Addresses</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-white" data-testid="text-low-risk-count">
              {riskCounts.low}
            </span>
          </div>
        </div>

        {/* Recent Classifications */}
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Recent Detections</h3>
          <div className="space-y-2" data-testid="recent-detections">
            {recentClassifications.map((item, index) => (
              <div 
                key={item.id || index} 
                className="flex items-center justify-between text-sm"
                data-testid={`detection-${index}`}
              >
                <span className="text-white/70" data-testid={`text-detection-type-${index}`}>
                  {item.dataType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
                </span>
                <span className="text-xs text-white/70" data-testid={`text-detection-time-${index}`}>
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            ))}
            
            {recentClassifications.length === 0 && (
              <div className="text-center py-4 text-white/70" data-testid="no-recent-detections">
                <p className="text-sm text-white/70">No recent detections</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
