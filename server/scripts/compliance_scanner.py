#!/usr/bin/env python3
"""
Compliance scanning helpers for WalletGyde GuardDog.

Loads regex patterns and thresholds from the existing JSON rules file and
provides utility functions to analyse free-form text/log lines and transaction
records for policy violations.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable, List, Dict, Any

RULES_PATH = Path(__file__).resolve().parents[1] / "config" / "complianceRules.json"


def load_rules() -> Dict[str, Any]:
    """Load the compliance rules JSON file."""
    with RULES_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _redact(text: str, regex: re.Pattern[str], label: str) -> str:
    """Return text with any matching substrings replaced by a label."""
    return regex.sub(f"<{label.upper()}_REDACTED>", text)


def scan_text(text: str, rules: Dict[str, Any] | None = None, source: str = "logs") -> List[Dict[str, Any]]:
    """Scan an arbitrary string for PII patterns (credit cards, SSNs, etc.)."""
    rules = rules or load_rules()
    results: List[Dict[str, Any]] = []

    pii_rules = rules["rules"].get("pii_detection", {})
    if not pii_rules.get("enabled", False):
        return results

    for name, cfg in pii_rules.get("patterns", {}).items():
        regex = re.compile(cfg["regex"], re.IGNORECASE)
        matches = regex.findall(text)
        if not matches:
            continue

        results.append(
            {
                "type": "pii_detection",
                "subtype": name,
                "matches": len(matches),
                "action": cfg.get("action", "alert"),
                "severity": cfg.get("severity", "medium"),
                "source": source,
                "content": _redact(text, regex, name),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )

    return results


def scan_logs(log_lines: Iterable[str], rules: Dict[str, Any] | None = None, source: str = "logs") -> List[Dict[str, Any]]:
    """Convenience wrapper to scan multiple log lines."""
    findings: List[Dict[str, Any]] = []
    for line in log_lines:
        findings.extend(scan_text(line, rules=rules, source=source))
    return findings


def scan_transactions(transactions: Iterable[Dict[str, Any]], rules: Dict[str, Any] | None = None,
                       source: str = "transactions") -> List[Dict[str, Any]]:
    """Check transaction objects for high-value or high-volume anomalies."""
    rules = rules or load_rules()
    findings: List[Dict[str, Any]] = []

    fin_rules = rules["rules"].get("financial_compliance", {})
    if not fin_rules.get("enabled", False):
        return findings
    fin_cfg = fin_rules.get("rules", {})

    high_value_cfg = fin_cfg.get("high_value_transaction", {})
    rapid_cfg = fin_cfg.get("rapid_transactions", {})

    # Prepare rolling window data if rapid transactions rule is enabled.
    timestamps: List[datetime] = []
    window_minutes = 0
    if rapid_cfg and rapid_cfg.get("timeWindow"):
        token = rapid_cfg["timeWindow"].lower()
        if "hour" in token:
            window_minutes = int(token.split("_")[0]) * 60
        elif "minute" in token:
            window_minutes = int(token.split("_")[0])
        else:
            window_minutes = 60

    for tx in transactions:
        amount = float(tx.get("amount", 0))
        timestamp = tx.get("timestamp") or tx.get("date")
        ts = None
        if timestamp:
            try:
                ts = datetime.fromisoformat(str(timestamp).replace("Z", "+00:00"))
            except ValueError:
                pass

        if high_value_cfg and amount > high_value_cfg.get("threshold", float("inf")):
            findings.append(
                {
                    "type": "financial_compliance",
                    "subtype": "high_value_transaction",
                    "amount": amount,
                    "threshold": high_value_cfg.get("threshold"),
                    "action": high_value_cfg.get("action", "alert"),
                    "severity": high_value_cfg.get("severity", "high"),
                    "source": source,
                    "transaction": tx,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
            )

        if rapid_cfg and ts:
            if window_minutes > 0:
                cutoff = ts - timedelta(minutes=window_minutes)
                timestamps[:] = [t for t in timestamps if t >= cutoff]
            timestamps.append(ts)
            if rapid_cfg.get("count") and len(timestamps) > rapid_cfg["count"]:
                findings.append(
                    {
                        "type": "financial_compliance",
                        "subtype": "rapid_transactions",
                        "transaction_count": len(timestamps),
                        "threshold": rapid_cfg.get("count"),
                        "window_minutes": window_minutes,
                        "action": rapid_cfg.get("action", "alert"),
                        "severity": rapid_cfg.get("severity", "critical"),
                        "source": source,
                        "transaction": tx,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                    }
                )

    return findings


def main() -> None:
    rules = load_rules()
    sample_log = "User john@example.com attempted transfer with card 4111-1111-1111-1111 and SSN 123-45-6789"
    print("Text scan findings:")
    for finding in scan_text(sample_log, rules):
        print(f" - {finding['subtype']} ({finding['severity']}): {finding['content']}")

    sample_transactions = [
        {"amount": 5000, "timestamp": datetime.utcnow().isoformat()},
        {"amount": 15000, "timestamp": datetime.utcnow().isoformat()},
    ]
    print("\nTransaction findings:")
    for finding in scan_transactions(sample_transactions, rules):
        print(f" - {finding['subtype']} ({finding['severity']}): amount={finding['amount']}")


if __name__ == "__main__":
    main()
