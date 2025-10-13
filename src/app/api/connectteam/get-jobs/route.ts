import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.CONNECTTEAM_API_KEY;
    const baseUrl = process.env.CONNECTTEAM_BASE_URL || 'https://api.connecteam.com';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'CONNECTTEAM_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const url = `${baseUrl}/jobs/v1/jobs?includeDeleted=false&order=asc&limit=10&offset=0`;
    
    console.log('Fetching ConnectTeam jobs from:', url);
    console.log('Using API key:', apiKey.substring(0, 8) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConnectTeam API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return NextResponse.json(
        { 
          error: 'ConnectTeam API request failed',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('ConnectTeam jobs fetched successfully:', {
      totalJobs: data.data?.jobs?.length || 0,
      requestId: data.requestId
    });

    return NextResponse.json({
      success: true,
      message: 'Active ConnectTeam jobs fetched successfully',
      data: data,
      summary: {
        activeJobs: data.data?.jobs?.length || 0,
        requestId: data.requestId
      }
    });

  } catch (error) {
    console.error('Error fetching ConnectTeam jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ConnectTeam jobs', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
