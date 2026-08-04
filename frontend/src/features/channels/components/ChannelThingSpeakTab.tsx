import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, Tabs, Tab, Button, IconButton, Tooltip 
} from '@mui/material';
import { ContentCopy, Download } from '@mui/icons-material';
import { Channel } from '../api/channels';

interface ChannelThingSpeakTabProps {
  channel: Channel;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const ChannelThingSpeakTab: React.FC<ChannelThingSpeakTabProps> = ({ channel }) => {
  const [tabValue, setTabValue] = useState(0);

  const writeKey = channel.api_keys.find(k => k.key_type === 'write')?.api_key || 'YOUR_WRITE_API_KEY';
  const readKey = channel.api_keys.find(k => k.key_type === 'read')?.api_key || 'YOUR_READ_API_KEY';
  const channelId = channel.id;
  
  // Use current origin, or a placeholder if running locally and expecting a different domain
  const baseUrl = window.location.origin;
  const thingspeakUrl = `${baseUrl}/api/v1/thingspeak`;

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // --- MATLAB Snippets ---
  const matlabWrite = `% MATLAB code to write data to Local IoT Cloud using ThingSpeak compatible API
url = '${thingspeakUrl}/update';
apiKey = '${writeKey}';

% Define your fields
field1Value = 25.6;
field2Value = 61;

% Construct payload
payload = sprintf('api_key=%s&field1=%.2f&field2=%.2f', apiKey, field1Value, field2Value);

% Send POST request
options = weboptions('MediaType', 'application/x-www-form-urlencoded');
response = webwrite(url, payload, options);
disp(response);
`;

  const matlabRead = `% MATLAB code to read data from Local IoT Cloud
channelID = '${channelId}';
readAPIKey = '${readKey}';
url = sprintf('${thingspeakUrl}/channels/%s/feeds.json?api_key=%s&results=5', channelID, readAPIKey);

% Fetch data
response = webread(url);
disp('Channel Info:');
disp(response.channel);
disp('Recent Feeds:');
disp(response.feeds);
`;

  // --- Python Snippets ---
  const pythonWrite = `import requests

url = '${thingspeakUrl}/update'
payload = {
    'api_key': '${writeKey}',
    'field1': 25.6,
    'field2': 61
}

response = requests.post(url, data=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
`;

  const pythonRead = `import requests

url = '${thingspeakUrl}/channels/${channelId}/feeds.json'
params = {
    'api_key': '${readKey}',
    'results': 5
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    print(f"Channel: {data['channel']['name']}")
    for feed in data['feeds']:
        print(feed)
else:
    print(f"Error: {response.status_code}")
`;

  // --- ESP32 Snippets ---
  const esp32Write = `#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* serverUrl = "${thingspeakUrl}/update";
String apiKey = "${writeKey}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    float temp = 25.6; // Read from sensor
    float hum = 61.0;  // Read from sensor
    
    String httpRequestData = "api_key=" + apiKey + "&field1=" + String(temp) + "&field2=" + String(hum);
    
    int httpResponseCode = http.POST(httpRequestData);
    
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    http.end();
  }
  delay(15000); // Wait 15 seconds
}
`;

  // --- cURL Snippets ---
  const curlWrite = `curl -X POST "${thingspeakUrl}/update" \\
     -d "api_key=${writeKey}" \\
     -d "field1=25.6" \\
     -d "field2=61"`;

  const curlRead = `curl "${thingspeakUrl}/channels/${channelId}/feeds.json?api_key=${readKey}&results=5"`;


  const CodeBlock = ({ code, filename }: { code: string, filename: string }) => (
    <Box sx={{ position: 'relative', mt: 1, mb: 3 }}>
      <Box sx={{ 
        bgcolor: '#1e1e1e', 
        color: '#d4d4d4', 
        p: 2, 
        borderRadius: 1, 
        overflowX: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.875rem'
      }}>
        <pre style={{ margin: 0 }}>{code}</pre>
      </Box>
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
        <Tooltip title="Copy">
          <IconButton size="small" onClick={() => copyToClipboard(code)} sx={{ color: '#fff' }}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => downloadFile(filename, code)} sx={{ color: '#fff' }}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>MATLAB & ThingSpeak Compatibility</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        The platform provides ThingSpeak-compatible REST API endpoints. This allows you to easily migrate existing scripts and devices that use the ThingSpeak API surface with minimal or no code changes.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Endpoint Reference</Typography>
          <Typography variant="body2"><strong>Base URL:</strong> <code>{thingspeakUrl}</code></Typography>
          <Typography variant="body2" sx={{ mt: 1 }}><strong>Write Data:</strong> <code>POST /update</code></Typography>
          <Typography variant="body2"><strong>Read Channel:</strong> <code>GET /channels/{'{channel_id}'}/feeds.json</code></Typography>
          <Typography variant="body2"><strong>Read Field:</strong> <code>GET /channels/{'{channel_id}'}/fields/{'{field_id}'}.json</code></Typography>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="code examples tabs">
          <Tab label="MATLAB" />
          <Tab label="Python" />
          <Tab label="ESP32 (C++)" />
          <Tab label="cURL" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography variant="subtitle2" gutterBottom>Write Data (MATLAB)</Typography>
        <CodeBlock code={matlabWrite} filename="thingspeak_write.m" />
        
        <Typography variant="subtitle2" gutterBottom>Read Data (MATLAB)</Typography>
        <CodeBlock code={matlabRead} filename="thingspeak_read.m" />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        <Typography variant="subtitle2" gutterBottom>Write Data (Python using requests)</Typography>
        <CodeBlock code={pythonWrite} filename="thingspeak_write.py" />
        
        <Typography variant="subtitle2" gutterBottom>Read Data (Python using requests)</Typography>
        <CodeBlock code={pythonRead} filename="thingspeak_read.py" />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        <Typography variant="subtitle2" gutterBottom>Write Data (ESP32 / Arduino)</Typography>
        <CodeBlock code={esp32Write} filename="ESP32_ThingSpeak_Write.ino" />
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={3}>
        <Typography variant="subtitle2" gutterBottom>Write Data (cURL)</Typography>
        <CodeBlock code={curlWrite} filename="thingspeak_write.sh" />
        
        <Typography variant="subtitle2" gutterBottom>Read Data (cURL)</Typography>
        <CodeBlock code={curlRead} filename="thingspeak_read.sh" />
      </CustomTabPanel>
    </Box>
  );
};
