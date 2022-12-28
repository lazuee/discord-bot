import chalk from "chalk";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import type { Ora } from "ora";
import { join } from "path";
import { fetch } from "undici";

import { Files, Log, onceEvent, sleep, spinner } from "#utils";

import type { Command } from "./classes/command";

let _spinner: Ora;
let process_called = false;

onceEvent(process, ["uncaughtException", "uncaughtExceptionMonitor", "unhandledRejection"], async (error: unknown) => {
	if (process_called) return;
	process_called = true;

	_spinner.isSpinning ? (_spinner.text = "Something went wrong, getting error...") : (_spinner = spinner("Something went wrong, getting error...").start());

	await sleep(1500);

	let errorMessage = "";
	if (error! instanceof Error) {
		errorMessage = error?.message || error.toString();
	} else {
		errorMessage = "Cannot determine the error.";
	}
	_spinner.stopAndPersist({
		symbol: chalk.red("✗"),
		prefixText: `${chalk.grey("[")} ${chalk.cyan.bold("SYSTEM")}  ${chalk.grey("]")}`,
		text: chalk.red(errorMessage)
	});

	process_called = true;
});

onceEvent(process, ["SIGINT"], async () => {
	if (process_called) return;
	process_called = true;

	_spinner.isSpinning ? (_spinner.text = "Terminating...") : (_spinner = spinner("Terminating...").start());

	_spinner.stopAndPersist({
		symbol: chalk.red("👋"),
		prefixText: `${chalk.grey("[")}${chalk.cyan.bold("SYSTEM")}${chalk.grey("]")} :`,
		text: "Goodbye!"
	});

	process_called = false;
	// eslint-disable-next-line no-process-exit
	process.exit(0);
});

Log.banner();
_spinner = spinner("Attempting Login...").start(); //spinner start here

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
	allowedMentions: { parse: ["roles"], repliedUser: false }
});
client.commands = new Collection();

(async () => {
	try {
		await sleep(2500);
		_spinner.text = "Building client cache...";
		await client.login();
		await sleep(1500);
		_spinner.prefixText = Log.prefix("SUCCESS");
		_spinner.succeed("Login successful.");
	} catch (error) {
		_spinner.prefixText = Log.prefix("ERROR");
		_spinner.fail("Login failed.");
		throw error;
	}

	await sleep(800);

	_spinner.isSpinning ? (_spinner.text = "Loading commands...") : (_spinner = spinner("Loading commands...").start());

	const Commands = (await Files.load(join(__dirname, "/commands"))) as unknown as Command[];
	const interactionCommands = [];

	await sleep(2500);

	for await (const command of Commands ?? []) {
		await sleep(800);
		_spinner.text = `Loading ${command.name}...`;
		client.commands.set(command.name, command);

		try {
			command.connect(client);

			if (command.executor!.interaction) {
				interactionCommands.push(command.getData().slash);
			}
		} catch (error) {
			_spinner.prefixText = Log.prefix("ERROR");
			if (error! instanceof Error) {
				const errorMessage = error?.message || error.toString();
				_spinner.fail(errorMessage);
			} else {
				_spinner.fail("Command loading failed.");
			}
			return;
		}
		await sleep(2500);
	}

	if (Commands.length > 0) {
		_spinner.prefixText = Log.prefix("SUCCESS");
		_spinner.succeed(`Loaded ${Commands.length} commands.`);
	} else {
		_spinner.prefixText = Log.prefix("WARNING");
		_spinner.warn("No commands loaded.");
	}

	if (process.env.DEPLOY_INTERACTION === "true") {
		await sleep(800);

		_spinner.isSpinning ? (_spinner.text = "Checking for Interaction Commands...") : (_spinner = spinner("Checking for Interaction Commands").start());

		try {
			await sleep(800);
			if (interactionCommands.length > 0) {
				_spinner.text = "Setting up Interaction Commands...";
				const midRoute = process.env.NODE_ENV === "development" ? `/guilds/${process.env.DISCORD_GUILD_ID!}` : "";
				const route = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID!}${midRoute}/commands`;

				const res = await fetch(route, {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bot ${process.env.DISCORD_TOKEN!}`
					},
					method: "put",
					body: JSON.stringify(interactionCommands)
				}).then((r) => r.json());

				_spinner.prefixText = Log.prefix("SUCCESS");
				_spinner.succeed("Loaded Interaction Commands.");

				Log.info(res as string);
			} else {
				_spinner.prefixText = Log.prefix("WARNING");
				_spinner.warn("No Interaction Commands.");
			}
		} catch (error) {
			_spinner.prefixText = Log.prefix("ERROR");
			if (error! instanceof Error) {
				const errorMessage = error?.message || error.toString();
				_spinner.fail(errorMessage);
			} else {
				_spinner.fail("Failed while setting up the Interactions");
			}
			return;
		}
	}

	await sleep(2500);

	Log.success(`Logged in as ${chalk.bold(`${client.user?.username}#${client.user?.discriminator}`)} ${chalk.gray.dim(`[ID: ${client.user?.id}]`)}`);
})();
