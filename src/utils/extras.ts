import { Log } from "./logger";
import ora, { Ora } from "ora";

const sleep = async (duration: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};

const spinner = (text?: string): Ora =>
	ora({
		text,
		spinner: "dots",
		color: "cyan",
		prefixText: `${Log.prefix("PROGRESS")}`
	});

function onceEvent(emitter?: any, events: string[] = [], listener?: (eventName: string, ...args: any[]) => void) {
	let called = false;
	events?.forEach((event) =>
		emitter?.on(event, (...args: any[]) => {
			if (!called) {
				called = true;
				listener?.(event, ...args);
			}
		})
	);
}

function terminate(options = { coredump: false, timeout: 500 }) {
	const exit = (code: number) =>
		// eslint-disable-next-line no-process-exit
		options.coredump ? process.abort() : process.exit(code);

	return (code: number, reason: any) => (err: Error, promise: any) => {
		if (err && err instanceof Error) Log.error(err);

		// If the promise is still pending, reject it
		if (promise && !promise.isResolved()) promise.reject(reason);

		setTimeout(exit(code), options.timeout).unref();
	};
}

export { sleep, spinner, onceEvent, terminate };
