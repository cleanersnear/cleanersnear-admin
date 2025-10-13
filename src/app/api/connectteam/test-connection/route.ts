import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const apiKey = process.env.CONNECTTEAM_API_KEY;
    const baseUrl = process.env.CONNECTTEAM_BASE_URL || 'https://api.connecteam.com';
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NO_KEY',
      baseUrl,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('CONNECTTEAM'))
    });

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'CONNECTTEAM_API_KEY environment variable is not set',
        envVars: Object.keys(process.env).filter(key => key.includes('CONNECTTEAM'))
      }, { status: 500 });
    }

    // Test API connection with different auth formats
    console.log('Testing API connection with key:', apiKey.substring(0, 8) + '...');
    
    // Try different authentication formats
    const authFormats = [
      { name: 'Bearer Token', header: `Bearer ${apiKey}` },
      { name: 'Direct Key', header: apiKey },
      { name: 'X-API-Key', header: apiKey, customHeader: 'X-API-Key' },
    ];

    for (const format of authFormats) {
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };

        if (format.customHeader) {
          headers[format.customHeader] = format.header;
        } else {
          headers['Authorization'] = format.header;
        }

        console.log(`Trying ${format.name}:`, { header: format.header.substring(0, 20) + '...' });

        const response = await fetch(`${baseUrl}/me`, {
          method: 'GET',
          headers,
        });

        const responseText = await response.text();
        
        if (response.ok) {
          const data = JSON.parse(responseText);
          return NextResponse.json({
            success: true,
            message: `ConnectTeam API connection successful with ${format.name}`,
            account: data,
            authMethod: format.name,
            requestUrl: `${baseUrl}/me`,
            apiKeyPrefix: apiKey.substring(0, 8) + '...'
          });
        } else {
          console.log(`${format.name} failed:`, response.status, responseText);
        }
      } catch (error) {
        console.log(`${format.name} error:`, error);
      }
    }

    // If we get here, all auth methods failed
    return NextResponse.json({
      success: false,
      error: 'All authentication methods failed',
      message: 'Tried Bearer Token, Direct Key, and X-API-Key headers but none worked',
      requestUrl: `${baseUrl}/me`,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      suggestion: 'Please verify your API key is correct and active in ConnectTeam'
    }, { status: 401 });

  } catch (error) {
    console.error('ConnectTeam connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test ConnectTeam connection',
      details: error instanceof Error ? error.message : 'Unknown error',
      envVars: Object.keys(process.env).filter(key => key.includes('CONNECTTEAM'))
    }, { status: 500 });
  }
}
