const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: true,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'SimLauncher.ico'),
        webPreferences: {
            contextIsolation: false, 
            nodeIntegration: true     
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// ----------------------------------------------------------------
// MAIN LAUNCH LOGIC
// ----------------------------------------------------------------

/**
 * Executes a list of applications sequentially with a delay.
 * @param {string[]} profileApps Array of executable paths to launch.
 */
ipcMain.on('launch-profile', (event, profileApps) => {
    if (!profileApps || profileApps.length === 0) {
        event.reply('launch-result', { success: false, error: 'Profile is empty.' });
        return;
    }
    
    let delay = 0;
    profileApps.forEach((appPath, index) => {
        setTimeout(() => {
            // 'start ""' is required on Windows to run the path correctly if it contains spaces
            exec(`start "" "${appPath}"`, (error, stdout, stderr) => {
                // Future notification logic can go here
                if (error) {
                    console.error(`Error launching ${appPath}: ${error.message}`);
                }
            });
        }, delay);
        delay += 1000; // 1 second delay between app launches for stability
    });

    event.reply('launch-result', { success: true, message: 'All profile applications launched.' });
});


// ----------------------------------------------------------------
// FILE BROWSER DIALOG LISTENER
// ----------------------------------------------------------------

/**
 * Opens a file dialog to select an executable file and sends the path back.
 * @param {string} inputId The ID of the input field in the Renderer to update.
 */
ipcMain.on('browse-path', (event, inputId) => { 
    dialog.showOpenDialog(null, {
        title: 'Select Executable File (.exe)',
        properties: ['openFile'],
        filters: [
            { name: 'Executable Files', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            // Send the file path and the input field ID back to index.html
            event.reply('browse-path-result', { 
                filePath: result.filePaths[0],
                inputId: inputId 
            });
        }
    }).catch(err => {
        console.error("Dialog error:", err);
    });
});