import { Ai } from "@cloudflare/ai";
import { AiTextToImageInput } from "@cloudflare/ai/dist/tasks/text-to-image";
import { Context, Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { renderToReadableStream } from "hono/jsx/streaming";

import Home from "./components/home";
import Imagine from "./components/imagine";
import Layout from "./components/layout";

type Bindings = {
	AI: object;
	KV: KVNamespace;
};

const SDXL_MODEL_NAME = "@cf/stabilityai/stable-diffusion-xl-base-1.0";

const app = new Hono<{ Bindings: Bindings }>();
const textEncoder = new TextEncoder();

const sha256hash = async (text: string) => {
	const array = new Uint8Array(
		await crypto.subtle.digest("SHA-256", textEncoder.encode(text)),
	);
	return Array.from(array)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

const uint8ArrayToBase64 = (u8: Uint8Array) => {
	const bin = Array.from(u8)
		.map((b) => String.fromCharCode(b))
		.join("");
	return btoa(bin);
};

const maybeGenerateImage = async (
	promptHash: string,
	c: Context<{ Bindings: Bindings }>,
): Promise<string | null> => {
	const prompt = await c.env.KV.get(promptHash);

	if (prompt === null) {
		return null;
	}

	const imageKey = `image_${promptHash}`;
	const imageBase64 = await c.env.KV.get(imageKey);
	if (imageBase64 !== null) {
		return imageBase64;
	}

	const ai = new Ai(c.env.AI);
	const inputs: AiTextToImageInput = {
		prompt: prompt,
		num_steps: 20,
	};
	const image: Uint8Array = await ai.run(SDXL_MODEL_NAME, inputs);
	const imageBase64Encoded = uint8ArrayToBase64(image);
	await c.env.KV.put(imageKey, imageBase64Encoded);

	return imageBase64Encoded;
};

app.get("/", async (c) => {
	return c.render(
		<Layout>
			<Home />
		</Layout>,
	);
});

app.get("/imagine", (c) => c.redirect("/"));

app.post("/imagine", async (c) => {
	const body = await c.req.parseBody();
	const prompt = body["prompt"];

	if (typeof prompt !== "string") {
		return c.body("prompt is not a string", {
			status: 400,
		});
	}

	const promptHash = await sha256hash(prompt);
	await c.env.KV.put(promptHash, prompt);

	const imagine = async () => {
		const image = await maybeGenerateImage(promptHash, c);
		return image === null
			? "https://4.bp.blogspot.com/-97ehmgQAia0/VZt5RUaiYsI/AAAAAAAAu24/yrwP694zWZA/s800/computer_error_bluescreen.png"
			: `data:image/png;base64,${image}`;
	};

	const stream = renderToReadableStream(
		<Layout>
			<Imagine prompt={prompt} imagine={imagine} />
		</Layout>,
	);

	return c.body(stream, {
		headers: {
			"Content-Type": "text/html; charset=UTF-8",
			"Transfer-Encoding": "chunked",
		},
	});
});

app.get("/assets/placeholder.jpg", serveStatic({ path: "./placeholder.jpg" }));

export default app;
