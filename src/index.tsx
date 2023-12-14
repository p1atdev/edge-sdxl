import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { renderToReadableStream } from "hono/jsx/streaming";

import { AiTextToImageInput } from "@cloudflare/ai/dist/tasks/text-to-image";
import Home from "./components/home";
import Layout from "./components/layout";
import Result from "./components/result";

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

app.get("/", async (c) => {
	return c.render(
		<Layout>
			<Home />
		</Layout>,
	);
});

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

	const imageSrc = `/image/${promptHash}`;

	return c.render(
		<Layout>
			<Result prompt={prompt} imageSrc={imageSrc} />
		</Layout>,
	);
});

app.get("/image/:promptHash", async (c) => {
	const promptHash = c.req.param("promptHash");
	const prompt = await c.env.KV.get(promptHash);

	if (prompt === null) {
		return c.notFound();
	}

	const imageKey = `image_${promptHash}`;
	const imageBase64 = await c.env.KV.get(imageKey);
	if (imageBase64 !== null) {
		const image = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
		return c.newResponse(image, {
			headers: {
				"content-type": "image/png",
			},
		});
	}

	const ai = new Ai(c.env.AI);
	const inputs: AiTextToImageInput = {
		prompt: prompt,
		num_steps: 20,
	};
	const image: Uint8Array = await ai.run(SDXL_MODEL_NAME, inputs);
	const imageBase64Encoded = uint8ArrayToBase64(image);
	await c.env.KV.put(imageKey, imageBase64Encoded);

	return c.newResponse(image, {
		headers: {
			"content-type": "image/png",
		},
	});
});

export default app;
