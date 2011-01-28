// Give this file a .pde extension to make the Arduino IDE happy, if need be.
#include <Spi.h>
#include <mirf.h>
#include <nRF24L01.h>

#define ONE_HUNDRED_MILLISECONDS 1 // Adjusted for the clock scale.

const byte BUTTON_UP = 0;
const byte BUTTON_DOWN = 1;
const byte BUTTON_MIDDLE = 2;
const byte BUTTON_LEFT = 3;
const byte BUTTON_RIGHT = 4;
const byte LED_UPDOWN = 5;
const byte LED_MIDDLE = 6;
const byte LED_LEFTRIGHT = 7;

void radioSend(byte* bytes);
void setup();
void loop();

void radioSend(byte* bytes) {
    Mirf.send(bytes);
    delay(ONE_HUNDRED_MILLISECONDS);
    Mirf.ceLow();
}

void setup() {
    CLKPR = (1<<CLKPCE);
    CLKPR = B00000111; // Run 64 times slower than usual.
    // Set up our various pins.
    pinMode(BUTTON_UP, INPUT);
    digitalWrite(BUTTON_UP, HIGH);
    pinMode(BUTTON_DOWN, INPUT);
    digitalWrite(BUTTON_DOWN, HIGH);
    pinMode(BUTTON_LEFT, INPUT);
    digitalWrite(BUTTON_LEFT, HIGH);
    pinMode(BUTTON_RIGHT, INPUT);
    digitalWrite(BUTTON_RIGHT, HIGH);
    pinMode(BUTTON_MIDDLE, INPUT);
    digitalWrite(BUTTON_MIDDLE, HIGH);
    pinMode(LED_UPDOWN, OUTPUT);
    pinMode(LED_LEFTRIGHT, OUTPUT);
    pinMode(LED_MIDDLE, OUTPUT);
    digitalWrite(LED_UPDOWN, LOW);
    digitalWrite(LED_LEFTRIGHT, LOW);
    digitalWrite(LED_MIDDLE, LOW);
    // Set up the radio  
    Mirf.csnPin = 10;
    Mirf.cePin = 8;
    Mirf.init();
    byte data_array[5];
    data_array[0] = 0xE7;
    data_array[1] = 0xE7;
    data_array[2] = 0xE7;
    data_array[3] = 0xE7;
    data_array[4] = 0xE7;
    Mirf.setRADDR(data_array);
    Mirf.setTADDR(data_array);
    Mirf.configRegister(0x26,0x07); //Air data rate 1Mbit, 0dBm, Setup LNA
    Mirf.configRegister(0x21, 0x00); //Disable auto-acknowledge
    Mirf.payload = 4;
    Mirf.channel = 2;
    Mirf.config();
    Mirf.ceLow();
}

void loop() {
  // Check the buttons.
    bool up = !digitalRead(BUTTON_UP);
    bool down = !digitalRead(BUTTON_DOWN);
    bool left = !digitalRead(BUTTON_LEFT);
    bool right = !digitalRead(BUTTON_RIGHT);
    bool middle = !digitalRead(BUTTON_MIDDLE);
    digitalWrite(LED_UPDOWN, (up || down) ? HIGH : LOW);
    digitalWrite(LED_LEFTRIGHT, (left || right) ? HIGH : LOW);
    digitalWrite(LED_MIDDLE, middle ? HIGH : LOW);
    if(up) {
        radioSend((byte*)"bemu");
    }
    if(down) {
        radioSend((byte*)"bemd");
    }
    if(left) {
        radioSend((byte*)"beml");
    }
    if(right) {
        radioSend((byte*)"bemr");
    }
    if(middle) {
        radioSend((byte*)"bemm");
    }
    delay(ONE_HUNDRED_MILLISECONDS);
}
