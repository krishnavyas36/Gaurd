#!/usr/bin/env python3
import sys
import json
import statistics
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AnomalyDetector:
    def __init__(self):
        self.thresholds = {
            'call_volume_multiplier': 3.0,  # Alert if calls > 3x average
            'unusual_hour_threshold': 0.1,  # Alert if >10% calls outside business hours
            'error_rate_threshold': 0.05,   # Alert if >5% error rate
            'response_time_multiplier': 5.0  # Alert if response time > 5x average
        }

    def detect_api_anomalies(self, api_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalies in API usage patterns."""
        anomalies = []
        
        # Calculate baseline statistics
        call_volumes = [source.get('callsToday', 0) for source in api_sources]
        avg_calls = statistics.mean(call_volumes) if call_volumes else 0
        
        for source in api_sources:
            source_anomalies = self._analyze_source(source, avg_calls)
            anomalies.extend(source_anomalies)
        
        return anomalies

    def _analyze_source(self, source: Dict[str, Any], avg_calls: float) -> List[Dict[str, Any]]:
        """Analyze a single API source for anomalies."""
        anomalies = []
        source_name = source.get('name', 'Unknown')
        calls_today = source.get('callsToday', 0)
        
        # Check for volume anomalies
        if avg_calls > 0 and calls_today > avg_calls * self.thresholds['call_volume_multiplier']:
            anomalies.append({
                'source': source_name,
                'type': 'volume_spike',
                'severity': 'warning' if calls_today < avg_calls * 5 else 'critical',
                'description': f'{source_name} has {calls_today} calls today, {calls_today/avg_calls:.1f}x the average',
                'metadata': {
                    'current_calls': calls_today,
                    'average_calls': avg_calls,
                    'multiplier': calls_today / avg_calls if avg_calls > 0 else 0
                }
            })

        # Check for status anomalies
        status = source.get('status', 'unknown')
        if status != 'active':
            anomalies.append({
                'source': source_name,
                'type': 'service_status',
                'severity': 'critical' if status == 'down' else 'warning',
                'description': f'{source_name} status is {status}',
                'metadata': {
                    'status': status
                }
            })

        # Check for alert status escalation
        alert_status = source.get('alertStatus', 'normal')
        if alert_status != 'normal':
            severity_map = {
                'elevated': 'warning',
                'high': 'warning',
                'critical': 'critical'
            }
            
            anomalies.append({
                'source': source_name,
                'type': 'alert_escalation',
                'severity': severity_map.get(alert_status, 'warning'),
                'description': f'{source_name} alert status escalated to {alert_status}',
                'metadata': {
                    'alert_status': alert_status
                }
            })

        # Check for stale data (no recent activity)
        last_activity = source.get('lastActivity')
        if last_activity:
            try:
                last_time = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                time_since_activity = datetime.now() - last_time.replace(tzinfo=None)
                
                if time_since_activity > timedelta(hours=2):
                    anomalies.append({
                        'source': source_name,
                        'type': 'stale_data',
                        'severity': 'warning',
                        'description': f'{source_name} has not reported activity for {time_since_activity.total_seconds()/3600:.1f} hours',
                        'metadata': {
                            'last_activity': last_activity,
                            'hours_since_activity': time_since_activity.total_seconds() / 3600
                        }
                    })
            except (ValueError, TypeError):
                # Handle invalid date formats
                pass

        return anomalies

    def detect_temporal_anomalies(self, api_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect temporal patterns that might indicate anomalies."""
        anomalies = []
        
        if not api_calls:
            return anomalies

        # Analyze time distribution
        business_hours_calls = 0
        total_calls = len(api_calls)
        
        for call in api_calls:
            timestamp = call.get('timestamp')
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    hour = dt.hour
                    
                    # Consider 9 AM to 6 PM as business hours
                    if 9 <= hour <= 18:
                        business_hours_calls += 1
                except (ValueError, TypeError):
                    continue

        if total_calls > 0:
            business_hours_ratio = business_hours_calls / total_calls
            
            if business_hours_ratio < (1 - self.thresholds['unusual_hour_threshold']):
                anomalies.append({
                    'source': 'Temporal Analysis',
                    'type': 'unusual_timing',
                    'severity': 'warning',
                    'description': f'{(1-business_hours_ratio)*100:.1f}% of API calls occurred outside business hours',
                    'metadata': {
                        'business_hours_ratio': business_hours_ratio,
                        'total_calls': total_calls,
                        'non_business_calls': total_calls - business_hours_calls
                    }
                })

        return anomalies

    def detect_geographic_anomalies(self, api_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect geographic anomalies in API access patterns."""
        anomalies = []
        
        # Count unique IP addresses and countries
        ip_counts = {}
        country_counts = {}
        
        for call in api_calls:
            ip = call.get('clientIP', 'unknown')
            country = call.get('country', 'unknown')
            
            ip_counts[ip] = ip_counts.get(ip, 0) + 1
            country_counts[country] = country_counts.get(country, 0) + 1

        # Check for suspicious IP activity
        total_calls = len(api_calls)
        for ip, count in ip_counts.items():
            if count > total_calls * 0.3:  # Single IP making >30% of calls
                anomalies.append({
                    'source': 'Geographic Analysis',
                    'type': 'ip_concentration',
                    'severity': 'warning',
                    'description': f'Single IP {ip} made {count} calls ({count/total_calls*100:.1f}% of total)',
                    'metadata': {
                        'ip_address': ip,
                        'call_count': count,
                        'percentage': count / total_calls * 100
                    }
                })

        # Check for unusual geographic distribution
        if len(country_counts) > 10:  # Calls from many countries
            anomalies.append({
                'source': 'Geographic Analysis',
                'type': 'geographic_spread',
                'severity': 'info',
                'description': f'API calls received from {len(country_counts)} different countries',
                'metadata': {
                    'country_count': len(country_counts),
                    'countries': list(country_counts.keys())
                }
            })

        return anomalies

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 anomaly_detector.py '<api_sources_json>'", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse input data
        api_sources = json.loads(sys.argv[1])
        
        # Initialize detector
        detector = AnomalyDetector()
        
        # Detect anomalies
        anomalies = detector.detect_api_anomalies(api_sources)
        
        # Output results as JSON
        print(json.dumps(anomalies, indent=2))
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error detecting anomalies: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
