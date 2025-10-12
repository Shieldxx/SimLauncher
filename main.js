const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // <-- OPRAVA 1: PŘIDÁN dialog!
const { exec } = require('child_process');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        icon: path.join(__dirname, 'SimLauncher.ico'),
        webPreferences: {
            // preload: path.join(__dirname, 'preload.js'), // PRELOAD není potřeba, pro zjednodušení vynecháme
            contextIsolation: false, 
            nodeIntegration: true     
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// ----------------------------------------------------------------
// HLAVNÍ LOGIKA SPOUŠTĚNÍ PROGRAMŮ
// ----------------------------------------------------------------

// Původní logika launch-app a launch-profile zůstává
ipcMain.on('launch-profile', (event, profileApps) => {
    if (!profileApps || profileApps.length === 0) {
        event.reply('launch-result', { success: false, error: 'Profil je prázdný.' });
        return;
    }
    
    let delay = 0;
    profileApps.forEach((appPath, index) => {
        setTimeout(() => {
            exec(`start "" "${appPath}"`, (error, stdout, stderr) => {
                // Zde by měla být notifikace
            });
        }, delay);
        delay += 1000; 
    });

    event.reply('launch-result', { success: true, message: 'Všechny aplikace v profilu spuštěny.' });
});


// ----------------------------------------------------------------
// NOVÝ LISTENER PRO DIALOG PROCHÁZENÍ SOUBORŮ
// ----------------------------------------------------------------
ipcMain.on('browse-path', (event, inputId) => { // <-- PŘIJÍMÁME inputId
    dialog.showOpenDialog(null, {
        title: 'Vyberte spustitelný soubor (.exe)',
        properties: ['openFile'],
        filters: [
            { name: 'Spustitelné soubory', extensions: ['exe'] },
            { name: 'Všechny soubory', extensions: ['*'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            // Posíláme zpět cestu A ID pole!
            event.reply('browse-path-result', { 
                filePath: result.filePaths[0],
                inputId: inputId 
            });
        }
    }).catch(err => {
        console.error("Chyba dialogu:", err);
    });
});

// Zbytek kodu
ipcMain.on('launch-app', (event, appPath) => {
    // Používáme 'exec' z Node.js k spuštění externí aplikace.
    // 'start ""' je nutné pro Windows, aby se nespustil konzolový proces.
    exec(`start "" "${appPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ CHYBA při spouštění ${appPath}: ${error.message}`);
            // Můžeme poslat chybu zpět do HTML
            event.reply('launch-result', { success: false, path: appPath, error: error.message });
            return;
        }
        console.log(`✅ Spuštěno: ${appPath}`);
        event.reply('launch-result', { success: true, path: appPath });
    });
});