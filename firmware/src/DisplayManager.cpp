/**
 * OXYSYNC 2.0 — Display Manager Implementation
 * 
 * Implements 5 structured LCD pages with adaptive 16x2 / 20x4 support,
 * custom 5x8 pixel medical glyphs, and auto-cycling.
 */

#include "DisplayManager.h"

// ============================================================================
// CUSTOM 5x8 PIXEL LCD GLYPH DEFINITIONS
// ============================================================================
static const uint8_t GLYPH_CYLINDER[8] = {
    0b01110,
    0b01010,
    0b11111,
    0b10001,
    0b10001,
    0b10001,
    0b11111,
    0b00000
};

static const uint8_t GLYPH_HEART[8] = {
    0b00000,
    0b01010,
    0b11111,
    0b11111,
    0b01110,
    0b00100,
    0b00000,
    0b00000
};

static const uint8_t GLYPH_WIFI[8] = {
    0b00000,
    0b01110,
    0b10001,
    0b00100,
    0b01010,
    0b00000,
    0b00100,
    0b00000
};

static const uint8_t GLYPH_ALERT[8] = {
    0b00100,
    0b01110,
    0b01110,
    0b01110,
    0b11111,
    0b11111,
    0b00100,
    0b00000
};

static const uint8_t GLYPH_ARROW[8] = {
    0b00000,
    0b00100,
    0b00010,
    0b11111,
    0b00010,
    0b00100,
    0b00000,
    0b00000
};

DisplayManager::DisplayManager(SimulationEngine& simEngine)
    : m_lcd(LCD_I2C_ADDR, LCD_COLUMNS, LCD_ROWS),
      m_sim(simEngine),
      m_currentPage(PAGE_HOME),
      m_autoCycleEnabled(true),
      m_lastPageSwitchMs(0),
      m_lastRenderMs(0),
      m_isApMode(false),
      m_ipAddress("Initializing..."),
      m_clientCount(0)
{
}

void DisplayManager::begin() {
    // Initialize I2C bus with configured pins
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    
    m_lcd.init();
    m_lcd.backlight();
    m_lcd.clear();

    registerCustomCharacters();

    // Show initial splash banner
    m_lcd.setCursor(0, 0);
    m_lcd.print("  OXYSYNC  2.0  ");
    m_lcd.setCursor(0, 1);
    m_lcd.print("Smart O2 Monitor");
    if (LCD_ROWS >= 4) {
        m_lcd.setCursor(0, 2);
        m_lcd.print("Connected System");
        m_lcd.setCursor(0, 3);
        m_lcd.print("Booting Core...");
    }

    m_lastPageSwitchMs = millis();
}

void DisplayManager::registerCustomCharacters() {
    m_lcd.createChar(0, const_cast<uint8_t*>(GLYPH_CYLINDER));
    m_lcd.createChar(1, const_cast<uint8_t*>(GLYPH_HEART));
    m_lcd.createChar(2, const_cast<uint8_t*>(GLYPH_WIFI));
    m_lcd.createChar(3, const_cast<uint8_t*>(GLYPH_ALERT));
    m_lcd.createChar(4, const_cast<uint8_t*>(GLYPH_ARROW));
}

void DisplayManager::setNetworkInfo(bool isApMode, const String& ipAddress, int clientCount) {
    m_isApMode = isApMode;
    m_ipAddress = ipAddress;
    m_clientCount = clientCount;
}

void DisplayManager::nextPage() {
    int next = (static_cast<int>(m_currentPage) + 1) % TOTAL_PAGES;
    setPage(static_cast<DisplayPage>(next));
}

void DisplayManager::previousPage() {
    int prev = (static_cast<int>(m_currentPage) - 1 + TOTAL_PAGES) % TOTAL_PAGES;
    setPage(static_cast<DisplayPage>(prev));
}

void DisplayManager::setPage(DisplayPage page) {
    m_currentPage = page;
    m_lastPageSwitchMs = millis();
    m_lcd.clear();
    renderCurrentPage();
}

void DisplayManager::update(unsigned long currentMillis) {
    // Auto-cycle pages if enabled
    if (m_autoCycleEnabled && (currentMillis - m_lastPageSwitchMs >= LCD_PAGE_CYCLE_MS)) {
        nextPage();
    }

    // Refresh display at ~4 Hz (every 250ms) for responsive numbers
    if (currentMillis - m_lastRenderMs >= 250) {
        m_lastRenderMs = currentMillis;
        renderCurrentPage();
    }
}

void DisplayManager::renderCurrentPage() {
    switch (m_currentPage) {
        case PAGE_HOME:
            renderPageHome();
            break;
        case PAGE_SUPPLY:
            renderPageSupply();
            break;
        case PAGE_PREDICTION:
            renderPagePrediction();
            break;
        case PAGE_ALERTS:
            renderPageAlerts();
            break;
        case PAGE_SYSTEM:
            renderPageSystem();
            break;
        default:
            renderPageHome();
            break;
    }
}

void DisplayManager::renderPageHome() {
    // Line 0: [Logo/Name] [Heart icon] [Pulse]
    char line0[21];
    const auto& vitals = m_sim.getVitals();
    snprintf(line0, sizeof(line0), "OXYSYNC \x01%3d bpm", vitals.pulseRate);
    m_lcd.setCursor(0, 0);
    m_lcd.print(line0);

    // Line 1: [SpO2] [Wi-Fi mode]
    char line1[21];
    const char* netMode = m_isApMode ? "AP" : "STA";
    snprintf(line1, sizeof(line1), "SpO2:%.0f%% \x02[%s]", vitals.spo2, netMode);
    m_lcd.setCursor(0, 1);
    m_lcd.print(line1);

    // 20x4 extended lines
    if (LCD_ROWS >= 4) {
        m_lcd.setCursor(0, 2);
        m_lcd.print("Health: Nominal ");
        m_lcd.setCursor(0, 3);
        m_lcd.print("Sim: Boyle's Law");
    }
}

void DisplayManager::renderPageSupply() {
    const auto& primary = m_sim.getPrimary();
    const auto& backup = m_sim.getBackup();
    SupplySource active = m_sim.getActiveSource();

    // Line 0: Primary Supply Status
    char line0[21];
    char pTag = (active == SOURCE_PRIMARY) ? '*' : ' ';
    snprintf(line0, sizeof(line0), "\x00 Pri%c:%3.0f%% %3.0fB", pTag, primary.percentage, primary.pressureBar);
    m_lcd.setCursor(0, 0);
    m_lcd.print(line0);

    // Line 1: Backup Supply Status
    char line1[21];
    char bTag = (active == SOURCE_BACKUP) ? '*' : ' ';
    snprintf(line1, sizeof(line1), "\x00 Bck%c:%3.0f%% %3.0fB", bTag, backup.percentage, backup.pressureBar);
    m_lcd.setCursor(0, 1);
    m_lcd.print(line1);

    if (LCD_ROWS >= 4) {
        // Line 2: Reserve Buffer status
        const auto& reserve = m_sim.getReserve();
        char line2[21];
        char rTag = (active == SOURCE_RESERVE) ? '*' : ' ';
        snprintf(line2, sizeof(line2), "Res%c:%3.0f%% %3.0fs", rTag, reserve.percentage, reserve.remainingSeconds);
        m_lcd.setCursor(0, 2);
        m_lcd.print(line2);

        // Line 3: Active Line status
        const char* srcStr = (active == SOURCE_PRIMARY) ? "Active: PRIMARY" :
                             (active == SOURCE_BACKUP) ? "Active: BACKUP" :
                             (active == SOURCE_RESERVE) ? "Active: 5m-RES" : "Active: NONE!";
        m_lcd.setCursor(0, 3);
        m_lcd.print(srcStr);
    }
}

void DisplayManager::renderPagePrediction() {
    float estMin = m_sim.getEstimatedRemainingMinutes();
    int hours = static_cast<int>(estMin) / 60;
    int mins = static_cast<int>(estMin) % 60;
    float flow = m_sim.getFlowRate();

    // Line 0: Remaining Time
    char line0[21];
    snprintf(line0, sizeof(line0), "Rem:%02dh %02dm   ", hours, mins);
    m_lcd.setCursor(0, 0);
    m_lcd.print(line0);

    // Line 1: Flow rate & status
    char line1[21];
    const char* status = (estMin < 30.0f) ? "LOW!" : "OK ";
    snprintf(line1, sizeof(line1), "Flow:%.1fL %s   ", flow, status);
    m_lcd.setCursor(0, 1);
    m_lcd.print(line1);

    if (LCD_ROWS >= 4) {
        m_lcd.setCursor(0, 2);
        m_lcd.print("Est. Depletion:");
        char line3[21];
        snprintf(line3, sizeof(line3), "dV/dt = -%.1f L/m", flow);
        m_lcd.setCursor(0, 3);
        m_lcd.print(line3);
    }
}

void DisplayManager::renderPageAlerts() {
    AlertSeverity sev = m_sim.getAlertSeverity();
    const char* alertMsg = m_sim.getActiveAlertMessage();

    // Line 0: Alert indicator
    char line0[21];
    const char* sevStr = (sev == SEV_CRITICAL) ? "\x03 CRITICAL \x03" :
                         (sev == SEV_WARNING) ? "\x03 WARNING  " : "Status: NORMAL";
    snprintf(line0, sizeof(line0), "%-16s", sevStr);
    m_lcd.setCursor(0, 0);
    m_lcd.print(line0);

    // Line 1: Alert message truncated to 16 chars
    char line1[21];
    snprintf(line1, sizeof(line1), "%-16.16s", alertMsg);
    m_lcd.setCursor(0, 1);
    m_lcd.print(line1);

    if (LCD_ROWS >= 4) {
        m_lcd.setCursor(0, 2);
        m_lcd.print("Sensors: Online ");
        m_lcd.setCursor(0, 3);
        m_lcd.print("Auto-Switch: ON ");
    }
}

void DisplayManager::renderPageSystem() {
    // Line 0: Wi-Fi mode & Clients
    char line0[21];
    const char* mode = m_isApMode ? "SoftAP" : "STA-Net";
    snprintf(line0, sizeof(line0), "%s Cl:%d   ", mode, m_clientCount);
    m_lcd.setCursor(0, 0);
    m_lcd.print(line0);

    // Line 1: IP address truncated to 16 chars
    char line1[21];
    snprintf(line1, sizeof(line1), "%-16.16s", m_ipAddress.c_str());
    m_lcd.setCursor(0, 1);
    m_lcd.print(line1);

    if (LCD_ROWS >= 4) {
        char line2[21];
        snprintf(line2, sizeof(line2), "Up:%lus Heap:%uk", millis() / 1000, ESP.getFreeHeap() / 1024);
        m_lcd.setCursor(0, 2);
        m_lcd.print(line2);

        m_lcd.setCursor(0, 3);
        m_lcd.print("REST:80  WS:81  ");
    }
}
