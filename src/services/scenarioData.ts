import { EmergencyScenarioId, ScenarioDefinition } from '../types/telemetry';

export const SCENARIO_DEFINITIONS: Record<EmergencyScenarioId, ScenarioDefinition> = {
  normal: {
    id: 'normal',
    stepNumber: 1,
    title: 'Normal Operation',
    subtitle: 'Primary cylinder active, patient stable, full supply reserves.',
    badge: 'NORMAL STATUS',
    whatHappened: 'Patient is resting with normal physiological parameters. Primary oxygen cylinder is active and supplying 2.5 L/min. Secondary cylinder is full on standby. Reserve buffer is charged at 100%.',
    whyItHappened: 'Nominal operational state. Continuous pressure telemetry confirms primary manifold pressure is well above safety switching thresholds.',
    systemResponse: 'OXYSYNC monitors flow stability at 2.5 L/min. Green normal status indicators displayed across all caregiver and clinical telemetry channels.',
    sequenceSteps: [
      'Continuous SpO₂ & pulse telemetry verified within clinical safety bounds (98%, 72 BPM).',
      'Primary cylinder valve confirmed open; manifold pressure reads 135 bar (90%).',
      'Secondary cylinder isolated on cold standby (150 bar, 100%).',
      '5-minute reserve buffer fully pressurized to 12.5 L.',
      'Telemetry beacon broadcasting 1.0 Hz periodic heartbeat to caregiver network.'
    ]
  },
  primary_empty: {
    id: 'primary_empty',
    stepNumber: 2,
    title: 'Primary Cylinder Depletion',
    subtitle: 'Primary cylinder drops below threshold, initiating warning protocols.',
    badge: 'SUPPLY WARNING',
    whatHappened: 'Primary cylinder pressure rapidly fell from 135 bar down to 18 bar (12% capacity), approaching the 10% auto-switch threshold.',
    whyItHappened: 'Continuous patient consumption over elapsed therapy duration. Simulated accelerated depletion injected to test threshold trigger precision.',
    systemResponse: 'OXYSYNC issues an Advisory Alert on the caregiver dashboard: "Primary Supply Depleting — Auto-Switch Armed". Secondary cylinder manifold pre-checks initiate.',
    sequenceSteps: [
      'Primary cylinder pressure drop detected by differential pressure sensor (18 bar).',
      'Predicted time to depletion calculated at 32 minutes remaining.',
      'Automated pre-switch verification queries Secondary cylinder readiness (confirmed 100% available).',
      'Caregiver notification queued: "Primary Cylinder Low".',
      'Auto-switch interlock state transitioned to ARMED.'
    ]
  },
  auto_switch: {
    id: 'auto_switch',
    stepNumber: 3,
    title: 'Automatic Backup Switching',
    subtitle: 'Primary hits 10% threshold; valve transitions smoothly to secondary cylinder.',
    badge: 'AUTO-SWITCH EXECUTED',
    whatHappened: 'Primary cylinder crossed the configured 10% safety threshold (15 bar). The system executed a seamless automatic valve switchover to the Secondary Cylinder without flow interruption.',
    whyItHappened: 'Automated failover protocol triggered by Boyle\'s physics engine to prevent sudden clinical oxygen starvation.',
    systemResponse: 'Primary solenoid valve closed; Secondary solenoid valve energized. Flow rate maintained continuously at 2.5 L/min. Caregiver alerted to replace depleted Primary Cylinder.',
    sequenceSteps: [
      'Primary supply reached 10% threshold (15 bar). Auto-switch condition verified.',
      'Secondary cylinder solenoid valve energized (opened). Manifold pressure stabilized at 150 bar.',
      'Primary cylinder valve closed and flagged for technician swap.',
      'Switching event logged in system audit trail with timestamp.',
      'Caregiver advisory transmitted: "Switched to Secondary Cylinder. Replace Primary promptly."'
    ]
  },
  low_spo2: {
    id: 'low_spo2',
    stepNumber: 4,
    title: 'Low Simulated SpO₂ Alert',
    subtitle: 'Patient desaturates to 84% SpO₂; triggers clinical alarm and flow alert.',
    badge: 'CLINICAL ALERT',
    whatHappened: 'Simulated patient SpO₂ dropped sharply from 97% to 84%, accompanied by compensatory tachycardia (heart rate elevated to 118 BPM).',
    whyItHappened: 'Simulated acute pulmonary desaturation or partial cannula displacement requiring immediate clinical response.',
    systemResponse: 'High-priority clinical audio alarm sounded (IEC 60601-1-8 compliant). Critical alert banner flashed on dashboard. Recommended flow increase alert surfaced for clinical review.',
    sequenceSteps: [
      'Pulse oximeter telemetry reads SpO₂ 84% (< 90% critical boundary).',
      'Heart rate spikes to 118 BPM in response to simulated hypoxemic stress.',
      'Critical visual banner engaged; Web Audio clinical alert siren sounded.',
      'Bedside and Caregiver notifications triggered with immediate urgency.',
      'Recommended action: Check cannula placement and adjust prescribed flow rate.'
    ]
  },
  backup_empty: {
    id: 'backup_empty',
    stepNumber: 5,
    title: 'Backup Cylinder Depletion',
    subtitle: 'Secondary backup cylinder drops to critical low level (5%).',
    badge: 'URGENT WARNING',
    whatHappened: 'Secondary backup cylinder has now been consumed down to 5% (7.5 bar), leaving both main supply cylinders exhausted or near zero.',
    whyItHappened: 'Caregiver failed to replace depleted Primary cylinder in time, leaving the system running solely on the remaining backup reserve.',
    systemResponse: 'Urgent red alert triggered across all interfaces. Countdown to supply exhaustion displayed. 5-Minute Reserve Buffer primed for immediate failsafe engagement.',
    sequenceSteps: [
      'Secondary supply drops below 5% critical threshold (7.5 bar / 18 min runtime remaining).',
      'Total combined cylinder runtime < 20 minutes.',
      'High-urgency audio chime and persistent visual warning banner activated.',
      'Reserve buffer pressure checked and safety valve solenoid primed.',
      'High-priority caregiver alert: "CRITICAL: Backup Cylinder Depleting. Replacement required immediately!"'
    ]
  },
  both_unavailable: {
    id: 'both_unavailable',
    stepNumber: 6,
    title: 'Both Supplies Unavailable',
    subtitle: 'Primary and secondary cylinders are both disconnected or empty (0%).',
    badge: 'CRITICAL EMERGENCY',
    whatHappened: 'Both Primary and Secondary cylinders have reached 0 bar or were disconnected simultaneously. Main supply line pressure dropped to zero.',
    whyItHappened: 'Exhaustion of all external cylinders or complete line severance / disconnection fault.',
    systemResponse: 'Zero-pressure detector trips emergency interlock. System instantly executes emergency bypass to engage the 5-Minute Reserve Buffer.',
    sequenceSteps: [
      'Main manifold differential pressure sensor registers 0 bar.',
      'External cylinder flow rate collapses to 0.0 L/min.',
      'Emergency interlock opens Reserve Buffer inline check-valve in < 250ms.',
      'Continuous audible emergency siren sounds.',
      'Automated transition to EMERGENCY RESERVE MODE.'
    ]
  },
  reserve_active: {
    id: 'reserve_active',
    stepNumber: 7,
    title: 'Reserve Buffer Activation',
    subtitle: 'Original OXYSYNC 5-minute reserve buffer engages; emergency countdown begins.',
    badge: 'RESERVE BUFFER ACTIVE',
    whatHappened: 'The conceptual 5-Minute Reserve Buffer is actively supplying oxygen to the patient cannula. Dynamic countdown timer activated (starting from 300 seconds).',
    whyItHappened: 'Proprietary OXYSYNC innovation: Bridging the critical supply gap while staff or family locate and connect a fresh oxygen cylinder.',
    systemResponse: 'Reserve micro-valve open. High-visibility countdown timer ticks down on all screens. Audio pulse every 30 seconds. Caregiver notified of remaining bridge seconds.',
    sequenceSteps: [
      'Reserve buffer valve actively discharging 12.5 L stored oxygen at 2.5 L/min.',
      'Precision countdown timer initiates (05:00 → 04:59...).',
      'Caregiver screen displays large emergency countdown and cylinder replacement prompt.',
      'Clinical compliance log records Reserve Activation timestamp.',
      'Engineering disclaimer displayed: "5-minute bridge requires physical cylinder connection before expiration."'
    ]
  },
  restoration: {
    id: 'restoration',
    stepNumber: 8,
    title: 'Supply Restoration & Reserve Refill',
    subtitle: 'Fresh cylinders connected; normal flow restored, reserve buffer refilling.',
    badge: 'SUPPLY RESTORED',
    whatHappened: 'A fresh, full 150-bar Primary Cylinder has been connected. Manifold pressure returned to nominal. The 5-Minute Reserve Buffer automatically begins refilling via the bleed valve.',
    whyItHappened: 'Caregiver or medical attendant safely replaced the depleted cylinder during the reserve buffer protection window.',
    systemResponse: 'Flow seamlessly switches back to the fresh Primary supply. Reserve buffer bleed valve opens to recharge to 100%. All emergency alarms clear and system returns to normal.',
    sequenceSteps: [
      'High-pressure sensor detects connection of fresh 150 bar cylinder.',
      'Manifold auto-regulates to 2.5 L/min patient delivery.',
      'Failsafe reserve buffer switch disengages; inline bleed valve begins recharge to 12.5 L.',
      'Critical alarms automatically de-escalate and clear.',
      'Audit log stamps: "Supply Restored — Reserve Buffer Recharged. System Nominal."'
    ]
  }
};
