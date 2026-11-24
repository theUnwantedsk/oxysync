/**
 * OXYSYNC 2.0 — ESP32 Main Firmware
 * 
 * Embedded Controller for Intelligent Oxygen Supply Management & Failover.
 * Bridges deterministic simulation engine, I2C LCD (16x2 / 20x4),
 * dual-mode Wi-Fi (Station + SoftAP Fallback), REST API, and WebSockets.
 */

#include <Arduino.h>
#include "hardware_config.h"
#include "SimulationEngine.h"
#include "DisplayManager.h"
#include "NetworkServer.h"

// Core Subsystems
SimulationEngine simEngine;
DisplayManager   displayManager(simEngine);
NetworkServer    networkServer(simEngine, displayManager);

// Button debounce for manual LCD cycling (using ESP32 BOOT button GPIO 0)
static unsigned long lastButtonPressMs = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F("        OXYSYNC 2.0 — CONNECTED SYSTEM            "));
    Serial.println(F("   Intelligent Oxygen Supply & Failover Controller "));
    Serial.println(F("=================================================="));
    Serial.println(F("DISCLAIMER: SOFTWARE & PROTOTYPE DEMONSTRATION"));
    Serial.println(F("NOT A CERTIFIED MEDICAL DEVICE FOR CLINICAL USE"));
    Serial.println(F("=================================================="));

    // Setup optional button input
    #if defined(PIN_BUTTON_CYCLE) && (PIN_BUTTON_CYCLE >= 0)
    pinMode(PIN_BUTTON_CYCLE, INPUT_PULLUP);
    #endif

    // 1. Initialize Simulation Engine
    simEngine.begin();
    Serial.println(F("[CORE] Simulation Engine initialized."));

    // 2. Initialize LCD Display
    displayManager.begin();
    Serial.println(F("[CORE] I2C LCD Display initialized."));

    // 3. Initialize Networking (Wi-Fi, HTTP, WebSockets)
    networkServer.begin();
    Serial.println(F("[CORE] Network Server initialized."));

    Serial.println(F("[SYS] Ready for connections. Telemetry streaming at 2 Hz."));
}

void loop() {
    unsigned long now = millis();

    // 1. Update deterministic Boyle's law physics & vitals
    simEngine.update(now);

    // 2. Refresh LCD multi-page views
    displayManager.update(now);

    // 3. Process HTTP REST requests and broadcast WebSocket packets
    networkServer.update(now);

    // 4. Handle optional physical button for manual page cycling
    #if defined(PIN_BUTTON_CYCLE) && (PIN_BUTTON_CYCLE >= 0)
    if (digitalRead(PIN_BUTTON_CYCLE) == LOW) {
        if (now - lastButtonPressMs > 350) { // 350ms debounce
            lastButtonPressMs = now;
            displayManager.nextPage();
            Serial.printf("[UI] Button pressed -> Switched to Page %d\n", displayManager.getCurrentPage());
        }
    }
    #endif

    // Small yield for FreeRTOS background tasks (Wi-Fi stack, TCP/IP)
    yield();
}
