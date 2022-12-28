import { Log } from "#root/utils";
import type {} from "@discordjs/builders";
import { AnySelectMenuInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, ClientEvents, Collection, InteractionType, Message, MessageContextMenuCommandInteraction, ModalSubmitInteraction, SlashCommandBuilder, UserContextMenuCommandInteraction } from "discord.js";
import type { Promisable } from "type-fest";

interface EventOptions<K extends keyof ClientEvents, N extends string = string, D extends string = string> {
	name: K;
	run: (this: Command<N, D>, ...args: ClientEvents[K]) => Promise<void>;
	once: boolean;
}

class Event<K extends keyof ClientEvents> {
	private __data: EventOptions<K, string, string>;

	constructor(options: EventOptions<K, string, string>) {
		this.__data = options;

		this.__validate();
	}

	get data() {
		return this.__data;
	}

	private __validate(): void {
		if (typeof this.__data?.name !== "string") throw new TypeError("Event name must be a string.");
		if (typeof this.__data?.once !== "boolean") throw new TypeError("Event once must be a boolean.");
		if (typeof this.__data?.run !== "function") throw new TypeError("Event run must be a function.");
	}
}

interface CommandOptions {
	addAttachmentOption: SlashCommandBuilder["addAttachmentOption"];
	addBooleanOption: SlashCommandBuilder["addBooleanOption"];
	addChannelOption: SlashCommandBuilder["addChannelOption"];
	addIntegerOption: SlashCommandBuilder["addIntegerOption"];
	addMentionableOption: SlashCommandBuilder["addMentionableOption"];
	addNumberOption: SlashCommandBuilder["addNumberOption"];
	addRoleOption: SlashCommandBuilder["addRoleOption"];
	addStringOption: SlashCommandBuilder["addStringOption"];
	addSubcommand: SlashCommandBuilder["addSubcommand"];
	addSubcommandGroup: SlashCommandBuilder["addSubcommandGroup"];
	addUserOption: SlashCommandBuilder["addUserOption"];
}

class Command<N extends string = string, D extends string = string> {
	public name: N;
	public description: D;
	public executor: {
		button?: (this: Command<N, D>, interaction: ButtonInteraction) => Promisable<void>;
		contextMenu?: (this: Command<N, D>, interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) => Promisable<void>;
		selectMenu?: (this: Command<N, D>, interaction: AnySelectMenuInteraction) => Promisable<void>;
		modalSubmit?: (this: Command<N, D>, interaction: ModalSubmitInteraction) => Promisable<void>;
		interaction?: (this: Command<N, D>, interaction: ChatInputCommandInteraction) => Promisable<void>;
		message?: (this: Command<N, D>, message: Message<boolean>) => Promisable<void>;
	};

	private __slash = new SlashCommandBuilder();
	private __events = new Collection<keyof ClientEvents, Event<keyof ClientEvents>[]>();
	private __options_called = false;

	constructor(name: N, description: D) {
		this.name = name as any;
		this.description = description as any;

		this.__slash.setName(name).setDescription(description);
		this.executor = {
			button: undefined,
			contextMenu: undefined,
			selectMenu: undefined,
			modalSubmit: undefined,
			interaction: undefined,
			message: undefined
		};
	}

	setExecutor(executor: Command<N, D>["executor"]) {
		if (typeof executor.button === "function") this.executor.button = executor.button;
		if (typeof executor.contextMenu === "function") this.executor.contextMenu = executor.contextMenu;
		if (typeof executor.selectMenu === "function") this.executor.selectMenu = executor.selectMenu;
		if (typeof executor.modalSubmit === "function") this.executor.modalSubmit = executor.modalSubmit;
		if (typeof executor.interaction === "function") this.executor.interaction = executor.interaction;
		if (typeof executor.message === "function") this.executor.message = executor.message;

		return this;
	}

	setOptions(options: (this: Command<N, D>, options: CommandOptions) => Promisable<void>) {
		if (!this.__options_called) {
			options.call(this, {
				addAttachmentOption: this.__slash.addAttachmentOption,
				addBooleanOption: this.__slash.addBooleanOption,
				addChannelOption: this.__slash.addChannelOption,
				addIntegerOption: this.__slash.addIntegerOption,
				addMentionableOption: this.__slash.addMentionableOption,
				addNumberOption: this.__slash.addNumberOption,
				addRoleOption: this.__slash.addRoleOption,
				addStringOption: this.__slash.addStringOption,
				addSubcommand: this.__slash.addSubcommand,
				addSubcommandGroup: this.__slash.addSubcommandGroup,
				addUserOption: this.__slash.addUserOption
			});

			this.__options_called = true;
		} else {
			process.emitWarning(`Command<${this.name}>#setOptions can only called once!`);
		}

		return this;
	}

	getData() {
		return {
			name: this.name,
			description: this.description,
			slash: this.__slash.toJSON(),
			events: [...this.__events.values()]
		};
	}

	useEvent<K extends keyof ClientEvents>(event: EventOptions<K, N, D>) {
		const events = this.__events.get(event.name) || [];
		this.__events.set(event.name, [...events, new Event(event as any)]);

		return this;
	}

	connect(client: Client<true>) {
		client.on("messageCreate", async (message) => {
			if (message.author.bot) return;
			let args: string[] = [],
				commandName = "";
			const regex = new RegExp(
				`^(<@${client.user?.id
					.toLowerCase()
					.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
					.replace(/-/g, "\\x2d")}>)`,
				"g"
			);

			if (message.mentions.repliedUser?.id === message.client.user?.id) {
				args = message.content.trim().split(/ +/g) as string[];
				commandName = args.shift()?.toLowerCase() ?? "";
			} else if (regex.test(message.content)) {
				const [_mention, ..._args] = message.content.trim().split(/ +/g) as string[];
				commandName = _args.shift()?.toLowerCase() ?? "";
				args = _args;
			}

			if (commandName === this.name) {
				try {
					message.commandName = commandName;
					message.args = args;
					await this.executor.message!.call(this, message);
					Log.info(`Command<${this.name}> was used`);
				} catch (error: unknown) {
					if (error! instanceof Error) {
						const errorMessage = error?.message || error.toString();
						Log.error(errorMessage);
					}
				}
			}
		});

		client.on("interactionCreate", async (interaction) => {
			switch (interaction.type) {
				// Command
				case InteractionType.ApplicationCommand:
					// Chat Input Command
					if (interaction.isChatInputCommand()) {
						if (interaction.commandName !== this.name) return;

						try {
							await this.executor.interaction!.call(this, interaction);
						} catch (error: unknown) {
							if (error! instanceof Error) {
								const errorMessage = error?.message || error.toString();
								Log.error(errorMessage);
							}
						}
					}

					// Command Menu
					else if (interaction.isContextMenuCommand()) {
						if (interaction.commandName !== this.name) return;
						try {
							await this.executor.contextMenu!.call(this, interaction);
						} catch (error: unknown) {
							if (error! instanceof Error) {
								const errorMessage = error?.message || error.toString();
								Log.error(errorMessage);
							}
						}
					}
					break;

				// Component
				case InteractionType.MessageComponent:
					// Button
					if (interaction.isButton()) {
						try {
							await this.executor.button!.call(this, interaction);
						} catch (error) {
							if (error! instanceof Error) {
								const errorMessage = error?.message || error.toString();
								Log.error(errorMessage);
							}
						}
					}
					// Select Menu
					else if (interaction.isAnySelectMenu()) {
						try {
							await this.executor.selectMenu!.call(this, interaction);
						} catch (error) {
							if (error! instanceof Error) {
								const errorMessage = error?.message || error.toString();
								Log.error(errorMessage);
							}
						}
					}
					break;

				// Modal
				case InteractionType.ModalSubmit:
					if (!interaction.isModalSubmit()) return;

					try {
						await this.executor.modalSubmit!.call(this, interaction);
					} catch (error) {
						if (error! instanceof Error) {
							const errorMessage = error?.message || error.toString();
							Log.error(errorMessage);
						}
					}
					break;

				default:
					break;
			}
		});

		for (const events of [...this.__events.values()]) {
			for (const event of events) {
				client[event.data.once ? "once" : "on"](event.data.name, event.data.run);
			}
		}
	}
}

export { Command };
