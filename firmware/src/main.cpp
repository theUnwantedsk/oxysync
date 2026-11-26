/**
 * OXYSYNC 2.0 — ESP32 Main Firmware
 * 
 * Embedded Controller for Intelligent Oxygen Supply Management & Failover.
 * Bridges deterministic simulation engine, I2C LCD (16x2 / 20x4),
 * dual-mode Wi-Fi (Station + SoftAP Fallback), REST API, and WebSockets.
 */

#include <Arduino.h>
#if __has_include("hardware_config.h")
#include "hardware_config.h"
#include "SimulationEngine.h"
#include "DisplayManager.h"
#include "NetworkServer.h"
#include "SerialBridge.h"
#else
#include "../include/hardware_config.h"
#include "../include/SimulationEngine.h"
#include "../include/DisplayManager.h"
#include "../include/NetworkServer.h"
#include "../include/SerialBridge.h"
#endif

// Core Subsystems
SimulationEngine simEngine;
DisplayManager   displayManager(simEngine);
NetworkServer    networkServer(simEngine, displayManager);
SerialBridge     serialBridge(simEngine, displayManager);

// Button debounce & edge detection for manual LCD cycling (GPIO 0 BOOT button)
static unsigned long lastButtonPressMs = 0;
static int prevButtonState = HIGH;

void setup() {
    Serial.begin(USB_SERIAL_BAUD);
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
    displayManager.showStatusBanner("  OXYSYNC  2.0  ", "Starting WiFi...");
    networkServer.begin();
    Serial.println(F("[CORE] Network Server initialized."));

    // Immediately switch LCD to live Home page after Wi-Fi is up
    displayManager.setPage(PAGE_HOME);

    // 4. Initialize Real-Time USB Serial Data Bridge
    serialBridge.begin();
    Serial.println(F("[CORE] USB Serial Bridge initialized (4 Hz JSON telemetry)."));

    Serial.println(F("[SYS] Ready for connections. Wi-Fi WS @ 2 Hz, USB Serial @ 4 Hz."));
}

void loop() {
    unsigned long now = millis();

    // 1. Update deterministic Boyle's law physics & vitals
    simEngine.update(now);

    // 2. Refresh LCD multi-page views
    displayManager.update(now);

    // 3. Process HTTP REST requests and broadcast WebSocket packets
    networkServer.update(now);

    // 4. Stream real-time USB Serial JSON telemetry & handle incoming USB commands
    serialBridge.update(now);

    // 5. Handle optional physical button (falling edge + debounce) for manual page cycling
    #if defined(PIN_BUTTON_CYCLE) && (PIN_BUTTON_CYCLE >= 0)
    int btnState = digitalRead(PIN_BUTTON_CYCLE);
    if (prevButtonState == HIGH && btnState == LOW) {
        if (now - lastButtonPressMs > 250) {
            lastButtonPressMs = now;
            displayManager.nextPage();
            Serial.printf("[UI] Button pressed -> Switched to Page %d\n", displayManager.getCurrentPage());
        }
    }
    prevButtonState = btnState;
    #endif

    // Small yield for FreeRTOS background tasks (Wi-Fi stack, TCP/IP)
    yield();
}
