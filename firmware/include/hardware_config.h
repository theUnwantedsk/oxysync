/**
 * OXYSYNC 2.0 — ESP32 Hardware & System Configuration
 * 
 * IMPORTANT: This header encapsulates all pin assignments, I2C addresses,
 * network credentials, and simulation thresholds.
 * 
 * Do NOT hardcode pin numbers across the codebase; modify them here.
 */

#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <Arduino.h>

// ============================================================================
// 1. I2C & DISPLAY CONFIGURATION (16x2 / 20x4 Character LCD)
// ============================================================================
// Standard ESP32 hardware I2C pins
#define I2C_SDA_PIN               21
#define I2C_SCL_PIN               22

// Common PCF8574 I2C backpack addresses (0x27 is standard, 0x3F is alternate)
#define LCD_I2C_ADDR              0x27
#define LCD_COLUMNS               16    // Change to 20 for 20x4 LCD
#define LCD_ROWS                  2     // Change to 4 for 20x4 LCD

// Page auto-cycle interval in milliseconds
#define LCD_PAGE_CYCLE_MS         3500

// ============================================================================
// 2. SOLENOID VALVE RELAYS & BUZZER HARDWARE (SIMULATED / OPTIONAL PINS)
// ============================================================================
// Digital GPIO pins driving transistor/MOSFET/Relay modules for oxygen supply lines
#define PIN_SOLENOID_PRIMARY      18    // Controls Primary Cylinder Line Valve
#define PIN_SOLENOID_BACKUP       19    // Controls Secondary/Backup Line Valve
#define PIN_SOLENOID_RESERVE      23    // Controls 5-Min Reserve Buffer Line Valve
#define PIN_ALARM_BUZZER          25    // Active/Passive Piezo Buzzer for Critical Alerts

// Optional Physical Pushbutton for manual LCD page cycling or emergency mute
#define PIN_BUTTON_CYCLE          0     // ESP32 BOOT button (GPIO 0) can be used for cycling!

// ============================================================================
// 3. WI-FI & LOCAL NETWORK CONFIGURATION
// ============================================================================
// Primary Wi-Fi network (Station Mode - router)
#define WIFI_STA_SSID             "Your_WiFi_SSID"
#define WIFI_STA_PASS             "Your_WiFi_Password"
#define WIFI_STA_TIMEOUT_MS       10000 // 10 seconds timeout before AP fallback

// Fallback SoftAP (Access Point Mode - when no router is available for exhibition)
#define WIFI_AP_SSID              "OXYSYNC-AP"
#define WIFI_AP_PASS              "oxysync2026"
#define WIFI_AP_CHANNEL           1
#define WIFI_AP_MAX_CONN          4

// Network Ports
#define HTTP_SERVER_PORT          80
#define WEBSOCKET_SERVER_PORT     81

// Telemetry broadcast frequency (in milliseconds, e.g. 500ms = 2 Hz)
#define TELEMETRY_BROADCAST_MS    500

// ============================================================================
// 4. DETERMINISTIC OXYGEN SUPPLY SIMULATION PARAMETERS
// ============================================================================
// Standard medical E-Cylinder parameters (or 10L water-capacity clinical cylinder)
// Boyle's Law: Usable Volume (L) = Cylinder Water Volume (L) * Pressure (Bar)
#define CYLINDER_MAX_PRESSURE_BAR 150.0f  // Standard full cylinder pressure (Bar)
#define CYLINDER_WATER_VOL_L      10.0f   // Water capacity (Liters)
#define CYLINDER_MAX_CAPACITY_L   (CYLINDER_MAX_PRESSURE_BAR * CYLINDER_WATER_VOL_L) // 1500 Liters

// Automatic switching threshold (percentage remaining)
#define AUTO_SWITCH_THRESHOLD_PCT 15.0f

// 5-Minute Reserve Buffer parameters
// Conceptually holds 5 minutes of oxygen at default standard flow rate (5.0 L/min)
#define RESERVE_BUFFER_CAPACITY_L 25.0f   // 25 Liters @ 5 L/min = 5.0 minutes runtime
#define DEFAULT_OXYGEN_FLOW_LPM   5.0f    // Default patient delivery rate (L/min)

// Simulation time acceleration factor (1.0 = real-time, 10.0 = 10x faster for demo)
#define DEFAULT_SIM_SPEED         1.0f

#endif // HARDWARE_CONFIG_H
