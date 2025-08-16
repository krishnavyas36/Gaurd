#!/usr/bin/env python3
import sys
import json
import re
from typing import List, Dict, Any

class DataClassifier:
    def __init__(self):
        self.patterns = {
            'ssn': {
                'pattern': r'\b\d{3}-?\d{2}-?\d{4}\b',
                'risk': 'high',
                'description': 'Social Security Number'
            },
            'credit_card': {
                'pattern': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
                'risk': 'high',
                'description': 'Credit Card Number'
            },
            'email': {
                'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                'risk': 'medium',
                'description': 'Email Address'
            },
            'phone': {
                'pattern': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                'risk': 'medium',
                'description': 'Phone Number'
            },
            'address': {
                'pattern': r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b',
                'risk': 'low',
                'description': 'Street Address'
            },
            'name': {
                'pattern': r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b',
                'risk': 'low',
                'description': 'Personal Name'
            }
        }

    def classify_text(self, text: str) -> List[Dict[str, Any]]:
        """Classify text data and return detected patterns with risk levels."""
        classifications = []
        
        for data_type, config in self.patterns.items():
            pattern = re.compile(config['pattern'], re.IGNORECASE)
            matches = pattern.findall(text)
            
            for match in matches:
                # Redact the content for logging
                redacted = self._redact_content(match, data_type)
                
                classifications.append({
                    'type': data_type,
                    'risk': config['risk'],
                    'description': config['description'],
                    'originalContent': match,
                    'redactedContent': redacted,
                    'position': text.find(match)
                })
        
        return classifications

    def classify_json_data(self, data: Any) -> List[Dict[str, Any]]:
        """Recursively classify JSON data structures."""
        classifications = []
        
        def scan_value(value, path=""):
            if isinstance(value, str):
                found = self.classify_text(value)
                for item in found:
                    item['jsonPath'] = path
                    classifications.extend([item])
            elif isinstance(value, dict):
                for key, val in value.items():
                    scan_value(val, f"{path}.{key}" if path else key)
            elif isinstance(value, list):
                for i, val in enumerate(value):
                    scan_value(val, f"{path}[{i}]" if path else f"[{i}]")
        
        scan_value(data)
        return classifications

    def _redact_content(self, content: str, data_type: str) -> str:
        """Redact sensitive content based on type."""
        redaction_map = {
            'ssn': 'XXX-XX-XXXX',
            'credit_card': 'XXXX-XXXX-XXXX-XXXX',
            'email': '[EMAIL_REDACTED]',
            'phone': 'XXX-XXX-XXXX',
            'address': '[ADDRESS_REDACTED]',
            'name': '[NAME_REDACTED]'
        }
        return redaction_map.get(data_type, '[REDACTED]')

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 data_classifier.py '<json_data>'", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse input data
        input_data = json.loads(sys.argv[1])
        
        # Initialize classifier
        classifier = DataClassifier()
        
        # Classify the data
        if isinstance(input_data, str):
            classifications = classifier.classify_text(input_data)
        else:
            classifications = classifier.classify_json_data(input_data)
        
        # Output results as JSON
        print(json.dumps(classifications, indent=2))
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error classifying data: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
