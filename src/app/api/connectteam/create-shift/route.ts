import { NextRequest, NextResponse } from 'next/server';
import { ConnectTeamService } from '@/config/connectTeam';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    const apiKey = process.env.CONNECTTEAM_API_KEY;
    const baseUrl = process.env.CONNECTTEAM_BASE_URL || 'https://api.connecteam.com';
    const schedulerId = process.env.CONNECTTEAM_SCHEDULER_ID;

    if (!apiKey) {
      console.error('CONNECTTEAM_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'ConnectTeam API key is not configured. Please set CONNECTTEAM_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Create a new ConnectTeam service instance with proper API key
    const connectTeamService = new ConnectTeamService();

    const body = await request.json();
    const { bookingId, bookingNumber, shiftData } = body;

    // Validate required fields
    if (!bookingId || !bookingNumber || !shiftData) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, bookingNumber, or shiftData' },
        { status: 400 }
      );
    }

    // Validate shift data structure
    const requiredShiftFields = ['date', 'start_time', 'end_time', 'shift_title', 'job', 'address'];
    for (const field of requiredShiftFields) {
      if (!shiftData[field]) {
        return NextResponse.json(
          { error: `Missing required shift field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('Creating ConnectTeam shift with data:', {
      apiKey: apiKey.substring(0, 8) + '...', // Log partial key for debugging
      baseUrl,
      schedulerId,
      shiftData: {
        date: shiftData.date,
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        shift_title: shiftData.shift_title,
        job: shiftData.job
      }
    });
    
    if (!schedulerId) {
      // If no scheduler ID in environment, try to get the first available scheduler
      try {
        const schedulers = await connectTeamService.getSchedulers();
        if (!schedulers || schedulers.length === 0) {
          return NextResponse.json(
            { error: 'No schedulers found in ConnectTeam account' },
            { status: 400 }
          );
        }
        
        // Use the first scheduler (you might want to make this configurable)
        const firstScheduler = schedulers[0];
        console.log(`Using scheduler: ${firstScheduler.name} (${firstScheduler.id})`);
        
        // Create the shift
        const result = await connectTeamService.createShift(firstScheduler.id, shiftData);
        
        return NextResponse.json({
          success: true,
          message: 'Shift created successfully in ConnectTeam',
          shiftId: result.id || result.data?.id,
          schedulerId: firstScheduler.id,
          schedulerName: firstScheduler.name,
          bookingNumber,
        });
        
      } catch (schedulerError) {
        console.error('Error fetching schedulers:', schedulerError);
        return NextResponse.json(
          { error: 'Failed to fetch ConnectTeam schedulers. Please configure CONNECTTEAM_SCHEDULER_ID environment variable.' },
          { status: 500 }
        );
      }
    }

    // Create the shift using the configured scheduler ID
    const result = await connectTeamService.createShift(schedulerId, shiftData);

    return NextResponse.json({
      success: true,
      message: 'Shift created successfully in ConnectTeam',
      shiftId: result.id || result.data?.id,
      schedulerId,
      bookingNumber,
    });

  } catch (error) {
    console.error('Error creating ConnectTeam shift:', error);
    
    // Handle specific ConnectTeam API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'ConnectTeam API authentication failed. Please check your API key.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'ConnectTeam API access forbidden. Please check your permissions.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('404')) {
        return NextResponse.json(
          { error: 'ConnectTeam scheduler not found. Please check your scheduler ID.' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'ConnectTeam API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create shift in ConnectTeam', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check environment variables first
    const apiKey = process.env.CONNECTTEAM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CONNECTTEAM_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Create ConnectTeam service instance
    const connectTeamService = new ConnectTeamService();
    
    // Test ConnectTeam API connection
    const accountInfo = await connectTeamService.getAccountInfo();
    
    return NextResponse.json({
      success: true,
      message: 'ConnectTeam API connection successful',
      account: {
        id: accountInfo.id,
        name: accountInfo.name || accountInfo.company_name,
      },
    });
  } catch (error) {
    console.error('ConnectTeam API health check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'ConnectTeam API connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
