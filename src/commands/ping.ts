import { Command } from "#root/classes/command";
import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";

export default new Command("ping", "ping the bot").setExecutor({
	message: async function (message) {
		const before = Date.now();
		const msg = await message.reply({ content: "*🏓 Pinging...*" });
		const embed = await pong(before, msg);
		await msg.edit({ content: "*🏓 PONG!*", embeds: [embed] });
	},
	interaction: async function (interaction) {
		const before = Date.now();
		await interaction.reply({ content: "*🏓 Pinging...*" });
		const embed = await pong(before, interaction);

		if (interaction.replied || interaction.deferred) {
			await interaction.editReply({
				content: "*🏓 PONG!*",
				embeds: [embed]
			});
		}
	}
});

async function pong(before: number, data: Message | ChatInputCommandInteraction) {
	const latency = Date.now() - before;
	const wsLatency = data.client.ws.ping.toFixed(0);
	const embed = new EmbedBuilder().setColor(searchHex(wsLatency)).addFields(
		{
			name: "API Latency",
			value: `**\`${latency}\`** ms`,
			inline: true
		},
		{
			name: "WebSocket Latency",
			value: `**\`${wsLatency}\`** ms`,
			inline: true
		}
	);

	return embed;
}

function searchHex(ms: string) {
	const listColorHex = [
		[0, 20, "#51e066"],
		[21, 50, "##51c562"],
		[51, 100, "#edd572"],
		[101, 150, "#e3a54a"],
		[150, 200, "#d09d52"]
	];
	const min = listColorHex.map((e) => e[0]);
	const max = listColorHex.map((e) => e[1]);
	const hex = listColorHex.map((e) => e[2]);
	let ret: `#${string}` = "#e05151";
	for (let i = 0; i < listColorHex.length; i++) {
		if (min[i] <= ms && ms <= max[i]) {
			ret = `#${hex[i]}`;
			break;
		}
	}

	return ret;
}
