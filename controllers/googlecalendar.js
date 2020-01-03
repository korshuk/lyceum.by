function getCalendar(client){
    const {google} = require('googleapis');
    // const oauth2Client = new google.auth.OAuth2(client.clientId, client.secret, client.redirectURL);
    // const scopes = [
    //     'https://www.googleapis.com/auth/calendar'
    // ];
    // const url = oauth2Client.generateAuthUrl({
    //     access_type: 'offline',
    //     scope: scopes
    // });
    const calendar = google.calendar({
        version: 'v3',
        auth: client.ipikey
    });
    return calendar;
}