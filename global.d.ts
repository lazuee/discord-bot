import type { Command } from "#root/classes/command";
import type { Collection } from "discord.js";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "production" | "development";
			DISCORD_TOKEN: string;
			DISCORD_CLIENT_ID: string;
			DISCORD_GUILD_ID: string;
			DEPLOY_INTERACTION: "true" | "false";
		}
	}
}

declare module "discord.js" {
	export interface Message {
		commandName?: string;
		args?: string[];
	}

	export interface Client {
		commands: Collection<string, Command>;
	}
}

export {};
