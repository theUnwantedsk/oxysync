/**
 * OXYSYNC 2.0 — Display Manager Header
 * 
 * Manages 16x2 and 20x4 I2C Character LCD screens (PCF8574 backpack).
 * Provides custom 5x8 pixel glyphs, multi-page layout engine,
 * auto-cycling timer, and smooth text rendering.
 */

#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#if __has_include("hardware_config.h")
#include "hardware_config.h"
#include "SimulationEngine.h"
#else
#include "../include/hardware_config.h"
#include "../include/SimulationEngine.h"
#endif

enum DisplayPage {
    PAGE_HOME       = 0,
    PAGE_SUPPLY     = 1,
    PAGE_PREDICTION = 2,
    PAGE_ALERTS     = 3,
    PAGE_SYSTEM     = 4,
    TOTAL_PAGES     = 5
};

class DisplayManager {
public:
    DisplayManager(SimulationEngine& simEngine);
    ~DisplayManager();
    void begin();
    void update(unsigned long currentMillis);
    
    // Page navigation
    void nextPage();
    void previousPage();
    void setPage(DisplayPage page);
    DisplayPage getCurrentPage() const { return m_currentPage; }
    void setAutoCycle(bool enabled) { m_autoCycleEnabled = enabled; }
    bool isAutoCycleEnabled() const { return m_autoCycleEnabled; }

    // External status updates
    void setNetworkInfo(bool isApMode, const String& ipAddress, int clientCount);
    void showStatusBanner(const char* line0, const char* line1);
    bool isLcdReady() const { return m_lcdReady; }
    uint8_t getDetectedAddress() const { return m_lcdAddr; }

private:
    uint8_t scanI2CAddress();
    void printPaddedLine(uint8_t row, const char* text);
    void renderCurrentPage();
    void renderPageHome();
    void renderPageSupply();
    void renderPagePrediction();
    void renderPageAlerts();
    void renderPageSystem();
    void registerCustomCharacters();

    LiquidCrystal_I2C* m_lcd;
    SimulationEngine& m_sim;

    uint8_t m_lcdAddr;
    bool m_lcdReady;
    DisplayPage m_currentPage;
    bool m_autoCycleEnabled;
    unsigned long m_lastPageSwitchMs;
    unsigned long m_lastRenderMs;

    bool m_isApMode;
    String m_ipAddress;
    int m_clientCount;
};

#endif // DISPLAY_MANAGER_H
