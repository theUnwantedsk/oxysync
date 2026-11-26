/**
 * OXYSYNC 2.0 — Display Manager Implementation
 * 
 * Implements 5 structured LCD pages with adaptive 16x2 / 20x4 support,
 * automatic I2C address detection (0x27 / 0x3F / bus scan),
 * custom 5x8 pixel medical glyphs (slots 1-5 to avoid C-string NUL),
 * flicker-free padded line rendering, and auto-cycling.
 */

#include "DisplayManager.h"

// ============================================================================
// CUSTOM 5x8 PIXEL LCD GLYPH DEFINITIONS (Stored in CGRAM slots 1..5)
// Note: Slot 0 is intentionally unused in C-strings because '\x00' is NUL!
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

#define CHAR_CYLINDER "\x01"
#define CHAR_HEART    "\x02"
#define CHAR_WIFI     "\x03"
#define CHAR_ALERT    "\x04"
#define CHAR_ARROW    "\x05"

DisplayManager::DisplayManager(SimulationEngine& simEngine)
    : m_lcd(nullptr),
      m_sim(simEngine),
      m_lcdAddr(LCD_I2C_ADDR),
      m_lcdReady(false),
      m_currentPage(PAGE_HOME),
      m_autoCycleEnabled(true),
      m_lastPageSwitchMs(0),
      m_lastRenderMs(0),
      m_isApMode(false),
      m_ipAddress("Initializing..."),
      m_clientCount(0)
{
}

DisplayManager::~DisplayManager() {
    if (m_lcd != nullptr) {
        delete m_lcd;
        m_lcd = nullptr;
    }
}

uint8_t DisplayManager::scanI2CAddress() {
    // Check common PCF8574 / PCF8574A backpack addresses first
    const uint8_t preferred[] = {
        LCD_I2C_ADDR, 0x27, 0x3F, 0x26, 0x25, 0x24, 0x23, 0x22, 0x21, 0x20,
        0x3E, 0x3D, 0x3C, 0x3B, 0x3A, 0x39, 0x38
    };

    for (size_t i = 0; i < sizeof(preferred); i++) {
        uint8_t addr = preferred[i];
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            return addr;
        }
    }

    // Full 7-bit I2C bus scan fallback
    for (uint8_t addr = 0x08; addr <= 0x77; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            return addr;
        }
    }

    return 0;
}

void DisplayManager::begin() {
    // Initialize I2C bus with configured pins at reliable 100 kHz standard speed
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Wire.setClock(100000);
    // Allow HD44780 power-on stabilization (>40ms after Vcc stabilizes)
    delay(60);

    uint8_t foundAddr = scanI2CAddress();
    if (foundAddr != 0) {
        m_lcdAddr = foundAddr;
        m_lcdReady = true;
        Serial.printf("[LCD] I2C LCD detected at address 0x%02X (SDA=%d, SCL=%d)\n",
                      m_lcdAddr, I2C_SDA_PIN, I2C_SCL_PIN);
    } else {
        m_lcdAddr = LCD_I2C_ADDR;
        m_lcdReady = false;
        Serial.printf("[LCD] WARNING: No I2C device found on SDA=%d, SCL=%d! Falling back to 0x%02X.\n",
                      I2C_SDA_PIN, I2C_SCL_PIN, m_lcdAddr);
        Serial.println(F("[LCD] Check: 1) VCC->5V/VIN, 2) GND->GND, 3) SDA->GPIO21, SCL->GPIO22, 4) Contrast pot on backpack."));
    }

    if (m_lcd != nullptr) {
        delete m_lcd;
    }
    m_lcd = new LiquidCrystal_I2C(m_lcdAddr, LCD_COLUMNS, LCD_ROWS);
    m_lcd->init();
    // Re-assert custom I2C pins & clock in case LiquidCrystal_I2C::init() invoked Wire.begin()
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Wire.setClock(100000);
    delay(50);

    m_lcd->backlight();
    m_lcd->clear();
    delay(5);

    registerCustomCharacters();
    // Return from CGRAM write mode back to DDRAM before printing
    m_lcd->home();
    delay(5);

    // Show initial splash banner
    printPaddedLine(0, "  OXYSYNC  2.0  ");
    printPaddedLine(1, "Smart O2 Monitor");
    if (LCD_ROWS >= 4) {
        printPaddedLine(2, "Connected System");
        printPaddedLine(3, "Booting Core...");
    }

    m_lastPageSwitchMs = millis();
    m_lastRenderMs = millis();
}

void DisplayManager::registerCustomCharacters() {
    if (m_lcd == nullptr) return;
    // Use slots 1..5 so '\x00' is never embedded inside C-strings
    m_lcd->createChar(1, const_cast<uint8_t*>(GLYPH_CYLINDER));
    m_lcd->createChar(2, const_cast<uint8_t*>(GLYPH_HEART));
    m_lcd->createChar(3, const_cast<uint8_t*>(GLYPH_WIFI));
    m_lcd->createChar(4, const_cast<uint8_t*>(GLYPH_ALERT));
    m_lcd->createChar(5, const_cast<uint8_t*>(GLYPH_ARROW));
}

void DisplayManager::printPaddedLine(uint8_t row, const char* text) {
    if (m_lcd == nullptr || row >= LCD_ROWS) return;

    char padded[21];
    const int cols = (LCD_COLUMNS > 20) ? 20 : LCD_COLUMNS;
    int len = 0;
    if (text != nullptr) {
        while (len < cols && text[len] != '\0') {
            padded[len] = text[len];
            len++;
        }
    }
    while (len < cols) {
        padded[len++] = ' ';
    }
    padded[cols] = '\0';

    m_lcd->setCursor(0, row);
    m_lcd->print(padded);
}

void DisplayManager::showStatusBanner(const char* line0, const char* line1) {
    if (m_lcd == nullptr) return;
    printPaddedLine(0, line0);
    printPaddedLine(1, line1);
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
    if (m_lcd != nullptr) {
        m_lcd->clear();
        delay(3);
    }
    renderCurrentPage();
}

void DisplayManager::update(unsigned long currentMillis) {
    if (m_lcd == nullptr) return;

    // Auto-cycle pages if enabled
    if (m_autoCycleEnabled && (currentMillis - m_lastPageSwitchMs >= LCD_PAGE_CYCLE_MS)) {
        nextPage();
        return;
    }

    // Refresh display at ~4 Hz (every 250ms) without clearing to eliminate flicker
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
    char line0[21];
    const auto& vitals = m_sim.getVitals();
    snprintf(line0, sizeof(line0), "OXYSYNC " CHAR_HEART "%3d bpm", vitals.pulseRate);
    printPaddedLine(0, line0);

    char line1[21];
    const char* netMode = m_isApMode ? "AP " : "STA";
    snprintf(line1, sizeof(line1), "SpO2:%3.0f%% " CHAR_WIFI "[%s]", vitals.spo2, netMode);
    printPaddedLine(1, line1);

    if (LCD_ROWS >= 4) {
        AlertSeverity sev = m_sim.getAlertSeverity();
        const char* statusTxt = (sev == SEV_CRITICAL) ? "State: CRITICAL!" :
                                (sev == SEV_WARNING)  ? "State: WARNING" : "State: Nominal";
        printPaddedLine(2, statusTxt);

        SupplySource active = m_sim.getActiveSource();
        const char* srcTxt = (active == SOURCE_PRIMARY) ? "Line: PRIMARY" :
                             (active == SOURCE_BACKUP)  ? "Line: BACKUP" :
                             (active == SOURCE_RESERVE) ? "Line: 5m RESERVE" : "Line: DEPLETED";
        printPaddedLine(3, srcTxt);
    }
}

void DisplayManager::renderPageSupply() {
    const auto& primary = m_sim.getPrimary();
    const auto& backup = m_sim.getBackup();
    SupplySource active = m_sim.getActiveSource();

    char line0[21];
    char pTag = (active == SOURCE_PRIMARY) ? '*' : ' ';
    snprintf(line0, sizeof(line0), CHAR_CYLINDER "Pri%c:%3.0f%% %3.0fB", pTag, primary.percentage, primary.pressureBar);
    printPaddedLine(0, line0);

    char line1[21];
    char bTag = (active == SOURCE_BACKUP) ? '*' : ' ';
    snprintf(line1, sizeof(line1), CHAR_CYLINDER "Bck%c:%3.0f%% %3.0fB", bTag, backup.percentage, backup.pressureBar);
    printPaddedLine(1, line1);

    if (LCD_ROWS >= 4) {
        const auto& reserve = m_sim.getReserve();
        char line2[21];
        char rTag = (active == SOURCE_RESERVE) ? '*' : ' ';
        snprintf(line2, sizeof(line2), "Res%c:%3.0f%% %3.0fs", rTag, reserve.percentage, reserve.remainingSeconds);
        printPaddedLine(2, line2);

        const char* srcStr = (active == SOURCE_PRIMARY) ? "Active: PRIMARY" :
                             (active == SOURCE_BACKUP)  ? "Active: BACKUP" :
                             (active == SOURCE_RESERVE) ? "Active: 5m-RES" : "Active: NONE!";
        printPaddedLine(3, srcStr);
    }
}

void DisplayManager::renderPagePrediction() {
    float estMin = m_sim.getEstimatedRemainingMinutes();
    if (estMin > 5999.0f) estMin = 5999.0f;
    int hours = static_cast<int>(estMin) / 60;
    int mins = static_cast<int>(estMin) % 60;
    float flow = m_sim.getFlowRate();

    char line0[21];
    snprintf(line0, sizeof(line0), "Rem:%02dh %02dm", hours, mins);
    printPaddedLine(0, line0);

    char line1[21];
    const char* status = (estMin < 30.0f) ? "LOW!" : "OK";
    snprintf(line1, sizeof(line1), "Flow:%.1fL %s", flow, status);
    printPaddedLine(1, line1);

    if (LCD_ROWS >= 4) {
        printPaddedLine(2, "Est. Depletion:");
        char line3[21];
        snprintf(line3, sizeof(line3), "dV/dt = -%.1f L/m", flow);
        printPaddedLine(3, line3);
    }
}

void DisplayManager::renderPageAlerts() {
    AlertSeverity sev = m_sim.getAlertSeverity();
    const char* alertMsg = m_sim.getActiveAlertMessage();

    const char* sevStr = (sev == SEV_CRITICAL) ? CHAR_ALERT " CRITICAL " CHAR_ALERT :
                         (sev == SEV_WARNING)  ? CHAR_ALERT " WARNING" : "Status: NORMAL";
    printPaddedLine(0, sevStr);
    printPaddedLine(1, alertMsg);

    if (LCD_ROWS >= 4) {
        printPaddedLine(2, "Sensors: Online");
        printPaddedLine(3, "Auto-Switch: ON");
    }
}

void DisplayManager::renderPageSystem() {
    char line0[21];
    const char* mode = m_isApMode ? "SoftAP" : "STA-Net";
    snprintf(line0, sizeof(line0), "%s Cl:%d", mode, m_clientCount);
    printPaddedLine(0, line0);

    printPaddedLine(1, m_ipAddress.c_str());

    if (LCD_ROWS >= 4) {
        char line2[21];
        snprintf(line2, sizeof(line2), "Up:%lus Heap:%uk", millis() / 1000, ESP.getFreeHeap() / 1024);
        printPaddedLine(2, line2);
        printPaddedLine(3, "REST:80  WS:81");
    }
}
