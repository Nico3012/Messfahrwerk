void setup() {
  analogReadResolution(14); // 0 - 16383
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char status = Serial.read();  // read one char

    if (status == '0') {
      // write all sensor names in order
      // \n indicates a split between sensors
      // \0 indicates the end of the init string
      Serial.print("PUSHROD_FRT_LFT\n");
      Serial.print("A-ARM_FRT_UPR_FRT_LFT\n");
      Serial.print("A-ARM_FRT_UPR_RER_LFT\n");
      Serial.print("A-ARM_FRT_LWR_FRT_LFT\n");
      Serial.print("A-ARM_FRT_LWR_RER_LFT\n");
      Serial.print("STEERING_ROD_LFT\0");
    } else if (status == '1') {
      int val0 = analogRead(A0);
      int val1 = analogRead(A1);
      int val2 = analogRead(A2);
      int val3 = analogRead(A3);
      int val4 = analogRead(A4);
      int val5 = analogRead(A5);

      char buffer[31];

      sprintf(buffer, "%05d%05d%05d%05d%05d%05d", val0, val1, val2, val3, val4, val5);

      Serial.print(buffer);
    }
  }
}
