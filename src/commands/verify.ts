import * as crypto from "node:crypto";



import { CaptchaGenerator } from "captcha-canvas";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";



import { Command } from "#root/classes/command";


const generator = new CaptchaGenerator().setDecoy({ opacity: 0.6, total: 15 });

export default new Command("verify", "prove that your not a robot").setExecutor({
	interaction: async function (interaction) {
		const { captcha, text } = await createCaptcha();
		console.log(text);

		const attachment = new AttachmentBuilder(captcha, { name: `${text}.png`, description: "prove yourself" });
		const button = buttonAnswer();
		await interaction.deferReply({ ephemeral: true }).catch(() => {});
		await interaction.editReply({ content: "", components: [button], files: [attachment] }).catch(() => {});
	},
	button: async function (interaction) {
		const modal = modalAnswer();
		await interaction.showModal(modal);
	},
	modalSubmit: async function (interaction) {
		const text = interaction.fields.getTextInputValue("text");
		console.log(text);
		await interaction.editReply({ content: `done: \`${text}\`` }).catch(() => {});
	}
});

async function createCaptcha() {
	let text = crypto.randomBytes(32).toString("hex");
	text = text.substring(0, Math.floor(Math.random() * 3) + 6);

	generator.setCaptcha({ text });
	return { captcha: await generator.generate(), text };
}

function buttonAnswer() {
	const button = new ButtonBuilder().setCustomId("verify").setLabel("Answer").setStyle(ButtonStyle.Primary);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

	return row;
}

function modalAnswer() {
	const modal = new ModalBuilder().setCustomId("verify").setTitle("Test out a modal!");
	const modalDescription = new TextInputBuilder().setCustomId("text").setLabel("Enter some text").setMinLength(3).setMaxLength(300).setRequired(true).setPlaceholder("Hello World!").setStyle(TextInputStyle.Paragraph);
	const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(modalDescription);
	modal.addComponents(actionRow);

	return modal;
}