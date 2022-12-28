import chalk from "chalk";

type LogLevel = "INFO" | "ERROR" | "SUCCESS" | "PROGRESS" | "WARNING";

class Log {
	private static _colorLevels = {
		INFO: chalk.cyan,
		ERROR: chalk.red,
		SUCCESS: chalk.green,
		PROGRESS: chalk.magenta,
		WARNING: chalk.hex("#FFA500")
	};

	static prefix(logLevel: LogLevel): string {
		return `${chalk.grey("[")}${this._colorLevels[logLevel].bold(logLevel)}${chalk.grey("]")}`;
	}

	static plain(message: any) {
		console.log(message);
	}

	static error(message: any): void {
		console.log(
			`${this.prefix("ERROR")} ${this._colorLevels.ERROR(`${message.code ?? message.name}: ${message.message}`)}
${process.env.NODE_ENV === "development" ? message.stack : ""}`
		);
	}

	static success(message: any): void {
		console.log(`${this.prefix("SUCCESS")} : ${this._colorLevels.SUCCESS(message)}`);
	}

	static info(message: any): void {
		console.log(`${this.prefix("INFO")} : ${this._colorLevels.INFO(message)}`);
	}

	static warn(message: any): void {
		console.log(`${this.prefix("WARNING")} : ${this._colorLevels.WARNING(message)}`);
	}

	static progress(message: any): void {
		console.log(`${this.prefix("PROGRESS")} : ${this._colorLevels.PROGRESS(message)}`);
	}

	static banner(clearScreen = true): void {
		if (clearScreen) console.clear();
		const bannerText = `
  ███╗░░░███╗██╗░██╗░░░░░░░██╗░█████╗░
  ████╗░████║██║░██║░░██╗░░██║██╔══██╗
  ██╔████╔██║██║░╚██╗████╗██╔╝███████║
  ██║╚██╔╝██║██║░░████╔═████║░██╔══██║
  ██║░╚═╝░██║██║░░╚██╔╝░╚██╔╝░██║░░██║
  ╚═╝░░░░░╚═╝╚═╝░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝
    `;
		console.log(chalk.blue(bannerText));
	}
}

export { Log, LogLevel };
