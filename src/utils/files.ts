import fs, { Dirent } from "fs";
import path from "path";

class Files {
	static load(folderPath = ""): Promise<any[]> {
		folderPath = path.resolve(path.join(folderPath));
		const Files: [file: any][] = [];
		try {
			if (fs.existsSync(folderPath)) {
				const files = this.get(folderPath) || [];
				for (const [filepath] of files ?? []) {
					delete require.cache[filepath];
					let file = require(filepath);
					if (file.default) file = file.default;
					Files.push(file);
				}
			}

			return Promise.resolve(Files);
		} catch (error: any) {
			return Promise.reject(error);
		}
	}

	static get(folderPath = "", extension = [".js", ".ts"]) {
		const files: Dirent[] =
			fs.readdirSync(folderPath, {
				withFileTypes: true
			}) || [];
		let FolderFiles: any[] = [];

		for (const file of files ?? []) {
			if (file.isDirectory()) {
				FolderFiles = [...FolderFiles, ...this.get(`${folderPath}/${file.name}`, extension)];
			} else if (new RegExp(`${extension.join("|")}$`).test(file.name) && !file.name.startsWith("!")) {
				let filename: string | string[] = file.name.replace(/\\/g, "/").split("/");
				filename = filename[filename.length - 1];
				filename = filename.split(".")[0].toLowerCase();

				FolderFiles.push([`${folderPath}/${file.name}`, filename]);
			}
		}

		return FolderFiles as [string, string][];
	}
}

export { Files };
