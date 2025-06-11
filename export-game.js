import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function exportGame() {
  try {
    // Read the game configuration
    const configPath = path.join(__dirname, 'config', 'game-config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    // Read the game component
    const componentPath = path.join(__dirname, 'components', 'SpaceMemoryGame.js');
    let gameComponent = await fs.readFile(componentPath, 'utf-8');

    // Remove the import statements and export keyword
    gameComponent = gameComponent.replace(/import.*from.*\n/g, '');
    gameComponent = gameComponent.replace('export function', 'function');

    // Create the HTML template
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Space Memory Game</title>
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <script src="https://unpkg.com/lucide-react@0.303.0/dist/umd/lucide-react.min.js"></script>
    <script>
        const gameConfig = ${JSON.stringify(config)};
    </script>
    <style>
        /* Tailwind CSS */
        @import 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { Pause, Play, HelpCircle, RefreshCw, Volume2, VolumeX } = lucide;
        ${gameComponent}

        function App() {
            return (
                <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
                    <h1 className="text-3xl font-bold mb-8">Space Memory Game</h1>
                    <SpaceMemoryGame />
                </main>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>
    `;

    // Write the HTML file
    const outputPath = path.join(__dirname, 'space-memory-game.html');
    await fs.writeFile(outputPath, html);

    console.log(`Game exported successfully to ${outputPath}`);
  } catch (error) {
    console.error('Error exporting game:', error);
  }
}

exportGame();
