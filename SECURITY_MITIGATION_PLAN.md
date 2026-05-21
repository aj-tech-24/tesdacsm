# Security Mitigation Plan — DDoS & Malicious Attack Readiness

Date: 2026-05-20

Purpose: Prioritized, actionable mitigation plan to protect the CSM system from DDoS and other malicious attacks, and to enable detection, response, and recovery.

Summary: This plan covers assessment, perimeter protections (CDN/Anycast/WAF), rate-limiting and throttling, network filtering, host hardening, secure application practices, observability (logging/SIEM), backup/recovery, incident response, testing, and governance.

---

## Priority Actions (tracked TODOs)

1. Conduct threat assessment
   - Goal: Identify likely attackers, motives, recent incidents, and high-value assets.
   - Deliverables: attack scenarios, risk ranking, evidence collection checklist.

2. Inventory assets & dependencies
   - Goal: Catalogue servers, apps, APIs, DNS, CDNs, external services, credentials, secrets.
   - Deliverables: asset registry, dependency graph, contact list for providers.

3. Map attack surface
   - Goal: Exposed endpoints, open ports, admin consoles, public buckets, CI/CD endpoints.
   - Deliverables: interactive map, prioritized exposure list.

4. Deploy CDN and Anycast
   - Goal: Absorb volumetric traffic and reduce origin load.
   - Notes: Use Cloudflare, Akamai, Fastly, or provider-managed CDN depending on cost/requirements.

5. Configure DDoS protection service
   - Goal: Enable network & application layer mitigation (Syn/UDP/HTTP flood protection).
   - Deliverables: emergency rules, escalation contacts, playbook to route traffic.

6. Implement rate limiting & throttling
   - Goal: Per-IP/request-key limits at CDN, edge, API gateway, and app.
   - Deliverables: rules, burst allowances, client exemptions for trusted partners.

7. Deploy WAF and tuned rules
   - Goal: Block malicious payloads, bot signatures, and OWASP Top 10 vectors.
   - Deliverables: rule set, false-positive review plan.

8. Network filtering & geo-blocking
   - Goal: Block known-bad networks and optionally limit traffic geographies.
   - Deliverables: ACLs, BGP blackhole options, provider support contacts.

9. Autoscaling & circuit breakers
   - Goal: Protect availability by scaling safely and tripping non-essential services.
   - Deliverables: autoscale policies, health checks, circuit-breaker rules.

10. Hardening hosts and patching
    - Goal: Ensure OS/app patches, reduce exposed services, enable host-based protections.
    - Deliverables: baseline images, patch schedule, SELinux/AppArmor config where applicable.

11. Secure authentication & MFA
    - Goal: Enforce MFA for admin portals, VPNs, cloud consoles; rotate keys.
    - Deliverables: MFA policy, privileged account inventory.

12. Input validation & parameterization
    - Goal: Prevent injection and RCE by validating and parameterizing inputs.
    - Deliverables: code checklist, secure-coding guidelines.

13. Logging, SIEM and alerts
    - Goal: Centralize logs (app, web, network), enable real-time alerts and retention.
    - Deliverables: SIEM onboarding, playbooks for alert triage.

14. Backups and recovery planning
    - Goal: Offline and immutable backups, tested restore procedures.
    - Deliverables: backup schedule, recovery RTO/RPO targets, restore runbooks.

15. Incident response playbooks
    - Goal: Clear runbooks for DDoS, breach, ransomware, supply-chain events.
    - Deliverables: roles, communications templates, escalation matrix.

16. Red-team and DDoS testing
    - Goal: Validate mitigations via controlled tests and tabletop exercises.
    - Deliverables: test plans, frequency schedule, remediation list.

17. Secure CI/CD and signing
    - Goal: Harden build pipeline, sign artifacts, and block unsigned releases.
    - Deliverables: pipeline hardening checklist, artifact signing process.

18. Access reviews & least privilege
    - Goal: Periodic review of IAM, service accounts, and scope minimization.
    - Deliverables: review cadence, revocation process.

19. Threat intelligence subscription
    - Goal: Receive indicators of compromise (IoCs) and blacklists for rapid action.
    - Deliverables: vendor selection, integration plan.

20. Communications & legal readiness
    - Goal: Prepare external/internal communication templates, legal and PR contacts.
    - Deliverables: templates, SLA disclosures, regulator reporting checklist.

21. Post-incident review & improvements
    - Goal: Capture root cause, update playbooks, and close remediation items.
    - Deliverables: after-action report and prioritized improvement backlog.

---

## Implementation Notes
- Short-term (0–7 days): enable CDN/edge protection, basic rate-limits, temporary geo-blocking, and emergency contacts with provider.
- Medium-term (1–4 weeks): WAF tuning, autoscaling + circuit breakers, SIEM ingestion, backup verification.
- Long-term (1–3 months): full host/app hardening, incident response exercises, CI/CD signing, threat intel integration.
- Current app implementation: public POST routes now have request-size checks and burst/sustained request limiting on feedback submission, admin login, and print generation. This is a local app-layer control; CDN/WAF protection is still the primary defense against volumetric floods.
- Edge/CDN rule set: mirror the same route groups at the perimeter with path-based rate limits, challenge or block on burst exhaustion, and apply stricter thresholds to write routes than read routes.

### Edge/CDN Rule Set
| Route group | Method | Burst window | Burst limit | Sustained window | Sustained limit | Action when exceeded |
| --- | --- | ---:| ---:| ---:| ---:| --- |
| `/api/submit-feedback` | `POST` | 30s | 12 | 15m | 48 | Return challenge or 429, then block repeat bursts |
| `/api/print-feedback` | `POST` | 60s | 18 | 15m | 72 | Return challenge or 429 |
| `/api/admin/login` | `POST` | 60s | 8 | 15m | 24 | Return challenge or 429 |
| `/api/achievements` | `GET` | 60s | 60 | 15m | 600 | Allow normal reads, challenge spikes |
| `/api/report-metadata` | `GET` | 60s | 30 | 15m | 240 | Allow normal reads, challenge spikes |
| `/api/report-metadata` | `PUT` | 60s | 20 | 15m | 120 | Challenge or block abusive admin update bursts |

Provider guidance:
- Cloudflare: implement as WAF/Rate Limiting rules using URI path and method, with managed challenge on burst thresholds.
- Vercel or other CDN: mirror the same path-and-method thresholds in the provider's firewall/rate-limit controls, and keep the app-layer limits as the final backstop.

## Quick Checklists
- Emergency: enable "I'm under attack" / challenge mode at CDN; announce status internally.
- Forensics: preserve network logs, packet captures (pcap), and timestamps.
- Recovery: failover origin, enable read-only mode if necessary.

## Next steps (recommended)
1. Start Step 1: Conduct threat assessment — collect network topology, current providers (DNS, CDN, WAF), recent traffic/log samples, AWS/GCP/Azure/host provider contacts, and past incident timeline.
2. Assign owners and deadlines for top 5 high-priority tasks.

---

File generated by the team's security planning assistant.
