const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/rtc/:channelName/:role/:uidType/:uid/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  
  const channelName = req.params.channelName;
  const appId = process.env.APP_ID;
  const appCertificate = process.env.APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    return res.status(500).json({ error: 'Missing APP_ID or APP_CERTIFICATE on server variables' });
  }

  // Map incoming parameter string paths safely
  const role = req.params.role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build token directly using pure JavaScript drivers to bypass native C++ compilation steps
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId, 
    appCertificate, 
    channelName, 
    0, 
    role, 
    privilegeExpiredTs, 
    privilegeExpiredTs
  );

  return res.json({ rtcToken: token });
});

app.listen(PORT, () => console.log(`🚀 Pure-JS Token server successfully online on port ${PORT}`));
