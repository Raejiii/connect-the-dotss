import GamePreview from "./pages/GamePreview";
import { useCallback, useEffect, useState } from "react";
import type { GameConfigType } from "./types/TGames";
import { downloadSettingsObj } from "./lib/uploadToS3";
import Image from "./components/ui/image";
import defaultConfig from "./config/defaultConfig.json";
import { isLocalHost } from "./lib/utils";

export type RefType = {
  triggerSave: () => Promise<GameConfigType | null>;
  triggerSaveAsDraft: () => Promise<GameConfigType | null>;
  captureScreenShot?: () => Promise<string | undefined>;
};

const getGameIDFromConfigURL = (url: string | null) => {
  if (!url) return "";
  const path = new URL(url).pathname;
  return path.slice(1, path.lastIndexOf("/"));
};

function App() {
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<GameConfigType>(
    defaultConfig as GameConfigType
  );
  const queryString = window.location.search;

  const params = new URLSearchParams(queryString);
  const configFileURL = params.get("config");
  const gameID = getGameIDFromConfigURL(configFileURL);
  console.log(gameID, "gameID");
  const getGameConfigFromCloud = useCallback(async () => {
    try {
      const gameConfig = await downloadSettingsObj(
        isLocalHost() ? configFileURL || "settings.json" : "settings.json"
      );
      setConfig(gameConfig);
    } catch (error) {
      console.error("Error fetching game config:", error);
    } finally {
      setIsConfigLoading(false);
    }
  }, [setConfig]);

  useEffect(() => {
    let isMounted = true;

    const fetchWithDelay = async () => {
      try {
        setIsConfigLoading(true);
        const startTime = Date.now();

        await getGameConfigFromCloud();

        const endTime = Date.now();
        const elapsed = endTime - startTime;

        const remaining = 1000 - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            if (isMounted) setIsConfigLoading(false);
          }, remaining);
        } else {
          if (isMounted) setIsConfigLoading(false);
        }
      } catch (error) {
        console.error("Error fetching game config:", error);
        if (isMounted) setIsConfigLoading(false);
      }
    };

    fetchWithDelay();

    return () => {
      isMounted = false;
    };
  }, [getGameConfigFromCloud]);

  if (isLocalHost() && !configFileURL) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-center mt-10">
          Please provide a config file URL as a query parameter.
        </h1>
        <p className="text-center mt-4">
          Example:{" "}
          <code>?config=https://example.com/path/to/your/config.json</code>
        </p>
      </div>
    );
  }

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Image
          src="images/eklavya.png"
          alt="eklavya - making learning accessible"
          className="w-full h-full object-contain animate-fade-in"
        />
      </div>
    );
  }

  return <GamePreview gameId={gameID} config={config} />;
}

export default App;
