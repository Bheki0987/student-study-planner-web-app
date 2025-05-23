window.addEventListener('load', function() {
    console.log('Quick fix for Collaboration Hub loaded!');
    
    // Fix Create Study Room button
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', function() {
            alert('Create Study Room button clicked! This would open the creation modal in a complete implementation.');
        });
    }
    
    // Fix Join Room button
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', function() {
            alert('Join Room button clicked! This would open the join room modal in a complete implementation.');
        });
    }
    
    // Fix Shared Calendar button
    const sharedCalendarBtn = document.getElementById('sharedCalendarBtn');
    if (sharedCalendarBtn) {
        sharedCalendarBtn.addEventListener('click', function() {
            alert('Shared Calendar button clicked! This would display the shared calendar in a complete implementation.');
        });
    }
    
    // Fix Document buttons
    const createDocBtn = document.getElementById('createDocBtn');
    if (createDocBtn) {
        createDocBtn.addEventListener('click', function() {
            alert('Create Document button clicked! This would create a new document in a complete implementation.');
        });
    }
    
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    if (uploadDocBtn) {
        uploadDocBtn.addEventListener('click', function() {
            alert('Upload Document button clicked! This would open a file picker in a complete implementation.');
        });
    }
}); 
